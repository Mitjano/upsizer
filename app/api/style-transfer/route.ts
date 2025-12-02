import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

const CREDITS_PER_TRANSFER = 4 // Style transfer is compute-intensive

// Style presets with prompts - these define different scene/style transformations
// while preserving the person's identity
const STYLE_PRESETS: Record<string, { prompt: string; negative: string }> = {
  cyberpunk: {
    prompt: 'portrait in cyberpunk city, neon lights, futuristic, high-tech environment, night scene, cinematic lighting, 8k, highly detailed',
    negative: 'deformed, ugly, disfigured, low quality, blurry'
  },
  fantasy: {
    prompt: 'portrait in magical fantasy world, enchanted forest, mystical atmosphere, soft magical lighting, fairy tale, 8k, highly detailed',
    negative: 'deformed, ugly, disfigured, low quality, blurry'
  },
  professional: {
    prompt: 'professional corporate portrait, modern office background, business attire, clean lighting, professional headshot, 8k, highly detailed',
    negative: 'casual, deformed, ugly, disfigured, low quality, blurry'
  },
  anime: {
    prompt: 'anime style portrait, vibrant colors, anime background, Japanese animation style, detailed anime art, studio ghibli inspired, 8k',
    negative: 'realistic, photo, deformed, ugly, disfigured, low quality'
  },
  vintage: {
    prompt: 'vintage 1950s portrait, retro style, classic film photography, sepia tones, nostalgic atmosphere, old hollywood glamour, 8k',
    negative: 'modern, digital, deformed, ugly, disfigured, low quality'
  },
  nature: {
    prompt: 'portrait in beautiful nature setting, lush forest background, golden hour sunlight, natural environment, outdoor photography, 8k, highly detailed',
    negative: 'indoor, urban, deformed, ugly, disfigured, low quality'
  },
  beach: {
    prompt: 'portrait on tropical beach, ocean waves, sunset sky, palm trees, summer vacation vibes, warm lighting, 8k, highly detailed',
    negative: 'indoor, cold, winter, deformed, ugly, disfigured, low quality'
  },
  urban: {
    prompt: 'portrait in modern city, urban street photography, city lights, metropolitan environment, street style, 8k, highly detailed',
    negative: 'rural, nature, deformed, ugly, disfigured, low quality'
  },
  artistic: {
    prompt: 'artistic portrait, oil painting style background, renaissance inspired, dramatic lighting, museum quality, masterpiece, 8k',
    negative: 'photo realistic background, deformed, ugly, disfigured, low quality'
  },
  scifi: {
    prompt: 'portrait in sci-fi spaceship interior, futuristic technology, space station, holographic displays, advanced civilization, 8k, highly detailed',
    negative: 'medieval, ancient, deformed, ugly, disfigured, low quality'
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const { allowed, resetAt } = imageProcessingLimiter.check(identifier)
    if (!allowed) {
      return rateLimitResponse(resetAt)
    }

    // 1. AUTHENTICATION
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode || 401 }
      )
    }

    // 2. GET USER
    const user = await getUserByEmail(authResult.user!.email)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 3. GET FILES FROM FORMDATA
    const formData = await request.formData()
    const file = formData.get('file') as File
    const stylePreset = formData.get('style_preset') as string || 'cyberpunk'
    const customPrompt = formData.get('prompt') as string || ''

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // 4. VALIDATE FILE
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: JPG, PNG, WEBP' },
        { status: 400 }
      )
    }

    const MAX_SIZE = 20 * 1024 * 1024 // 20MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 20MB' },
        { status: 400 }
      )
    }

    // 5. CHECK CREDITS
    if (user.credits < CREDITS_PER_TRANSFER) {
      if (user.credits === 0) {
        sendCreditsDepletedEmail({
          userEmail: user.email,
          userName: user.name || 'User',
          totalImagesProcessed: user.totalUsage || 0,
        }).catch(err => console.error('Failed to send credits depleted email:', err))
      }
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: CREDITS_PER_TRANSFER,
          available: user.credits,
        },
        { status: 402 }
      )
    }

    // 6. CONVERT IMAGE TO BASE64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const mimeType = file.type
    const dataUrl = `data:${mimeType};base64,${base64}`

    // 7. BUILD FINAL PROMPT - combine preset with user's custom details
    const preset = STYLE_PRESETS[stylePreset] || STYLE_PRESETS.cyberpunk
    let finalPrompt = preset.prompt

    // If user provided additional details, append them to the base prompt
    if (customPrompt && customPrompt.trim()) {
      finalPrompt = `${preset.prompt}, ${customPrompt.trim()}`
    }

    const negativePrompt = preset.negative

    // 8. CALL REPLICATE - InstantID + IPAdapter for identity-preserving style transfer
    // This model preserves the exact face while changing the style/background
    const output = await replicate.run(
      "zsxkib/instant-id-ipadapter-plus-face:32402fb5c493d883aa6cf098ce3e4cc80f1fe6871f6ae7f632a8dbde01a3d161",
      {
        input: {
          image: dataUrl,
          prompt: finalPrompt,
          negative_prompt: negativePrompt,
          // Face preservation settings - HIGH values to keep identity
          instantid_weight: 0.8,       // High for strong identity preservation
          instantid_start_at: 0,
          instantid_end_at: 1,
          // Style transfer settings
          ipadapter_weight: 0.5,       // Moderate for style while keeping face
          ipadapter_start_at: 0,
          ipadapter_end_at: 1,
          ipadapter_weight_type: 'style transfer',
          // Generation settings
          steps: 30,
          cfg: 4.5,
          width: 1024,
          height: 1024,
          denoise: 1.0,
          output_format: 'webp',
          output_quality: 90,
          sampler_name: 'euler',
          scheduler: 'normal',
          batch_size: 1,
        }
      }
    ) as unknown

    // 9. GET RESULT
    const outputArray = Array.isArray(output) ? output : [output]
    if (outputArray.length === 0) {
      throw new Error('No output generated')
    }
    const resultUrl = outputArray[0] as string

    // 10. DOWNLOAD RESULT AND CONVERT TO BASE64
    const resultResponse = await fetch(resultUrl)
    if (!resultResponse.ok) {
      throw new Error('Failed to download styled image')
    }
    const resultBuffer = Buffer.from(await resultResponse.arrayBuffer())
    const resultBase64 = resultBuffer.toString('base64')
    const resultDataUrl = `data:image/webp;base64,${resultBase64}`

    // 11. DEDUCT CREDITS & LOG USAGE
    await createUsage({
      userId: user.id,
      type: 'style_transfer',
      creditsUsed: CREDITS_PER_TRANSFER,
      imageSize: `${file.size} bytes`,
      model: 'instant-id-ipadapter-plus-face',
    })

    const newCredits = user.credits - CREDITS_PER_TRANSFER

    // 12. SEND LOW CREDITS WARNING
    if (newCredits > 0 && newCredits <= 10) {
      sendCreditsLowEmail({
        userEmail: user.email,
        userName: user.name || 'User',
        creditsRemaining: newCredits,
        totalUsed: user.totalUsage || 0,
      }).catch(err => console.error('Failed to send low credits email:', err))
    }

    // 13. RETURN SUCCESS
    return NextResponse.json({
      success: true,
      styledImage: resultDataUrl,
      style: stylePreset,
      prompt: finalPrompt,
      creditsUsed: CREDITS_PER_TRANSFER,
      creditsRemaining: newCredits,
    })

  } catch (error: unknown) {
    console.error('[Style Transfer] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to apply style transfer',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
