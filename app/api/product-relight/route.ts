import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'
import { CREDIT_COSTS } from '@/lib/credits-config'
import { ProcessedImagesDB } from '@/lib/processed-images-db'

// Configure fal.ai client
fal.config({
  credentials: process.env.FAL_API_KEY,
})

const RELIGHT_CREDITS = CREDIT_COSTS.product_shot_relight.cost

// Lighting direction presets
type LightDirection = 'None' | 'Left' | 'Right' | 'Top' | 'Bottom'

// Professional lighting presets with prompts
const LIGHTING_PRESETS: Record<string, { prompt: string; direction: LightDirection }> = {
  // Studio lighting
  studioSoft: {
    prompt: 'Professional soft studio lighting, even diffused light, commercial product photography',
    direction: 'None'
  },
  studioLeft: {
    prompt: 'Professional studio lighting from left side, dramatic shadows, commercial photography',
    direction: 'Left'
  },
  studioRight: {
    prompt: 'Professional studio lighting from right side, elegant shadows, product photography',
    direction: 'Right'
  },
  studioTop: {
    prompt: 'Professional overhead studio lighting, soft top-down illumination, commercial shot',
    direction: 'Top'
  },

  // Natural lighting
  windowLight: {
    prompt: 'Soft natural window light from side, warm daylight, lifestyle product photography',
    direction: 'Left'
  },
  goldenHour: {
    prompt: 'Warm golden hour lighting, sunset tones, soft romantic atmosphere',
    direction: 'Right'
  },
  overcast: {
    prompt: 'Soft overcast natural lighting, even diffused daylight, clean product shot',
    direction: 'None'
  },

  // Dramatic lighting
  dramaticRim: {
    prompt: 'Dramatic rim lighting, edge-lit product, dark moody atmosphere, premium feel',
    direction: 'Right'
  },
  lowKey: {
    prompt: 'Low-key dramatic lighting, deep shadows, luxury product photography',
    direction: 'Left'
  },
  spotlight: {
    prompt: 'Focused spotlight from above, theatrical dramatic lighting, premium product',
    direction: 'Top'
  },

  // Specialty
  neonGlow: {
    prompt: 'Subtle neon accent lighting, modern tech aesthetic, cool blue and pink tones',
    direction: 'None'
  },
  warmAmbient: {
    prompt: 'Warm ambient interior lighting, cozy atmosphere, inviting product presentation',
    direction: 'None'
  },
  coolClean: {
    prompt: 'Cool clean clinical lighting, medical or tech aesthetic, pure white light',
    direction: 'Top'
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. EXTRACT FORMDATA
    const formData = await request.formData()
    const file = formData.get('file') as File
    const preset = formData.get('preset') as string | null
    const customPrompt = formData.get('prompt') as string | null
    const lightDirection = (formData.get('light_direction') as LightDirection) || 'None'
    const numImages = parseInt(formData.get('num_images') as string || '1', 10)
    const enableHrFix = formData.get('enable_hr_fix') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate num_images (1-4)
    const clampedImages = Math.min(Math.max(numImages, 1), 4)

    // Determine the prompt and direction to use
    let lightingPrompt: string
    let direction: LightDirection = lightDirection

    if (customPrompt && customPrompt.trim()) {
      lightingPrompt = customPrompt.trim()
    } else if (preset && LIGHTING_PRESETS[preset]) {
      lightingPrompt = LIGHTING_PRESETS[preset].prompt
      direction = LIGHTING_PRESETS[preset].direction
    } else {
      lightingPrompt = LIGHTING_PRESETS.studioSoft.prompt
    }

    // 4. VALIDATE FILE
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: JPG, PNG, WEBP' },
        { status: 400 }
      )
    }

    const MAX_SIZE = 20 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 20MB' },
        { status: 400 }
      )
    }

    // 5. CHECK CREDITS
    const creditsNeeded = RELIGHT_CREDITS * clampedImages
    if (user.credits < creditsNeeded) {
      if (user.credits === 0) {
        sendCreditsDepletedEmail({
          userEmail: user.email,
          userName: user.name || 'User',
          totalImagesProcessed: user.totalUsage || 0,
        }).catch(err => console.error('Failed to send credits depleted email:', err))
      }
      return NextResponse.json(
        { error: 'Insufficient credits', required: creditsNeeded, available: user.credits },
        { status: 402 }
      )
    }

    // 6. UPLOAD IMAGE TO FAL STORAGE
    const arrayBuffer = await file.arrayBuffer()
    const uploadedUrl = await fal.storage.upload(
      new Blob([new Uint8Array(arrayBuffer)], { type: file.type })
    )

    console.log('[Product Relight] Processing with IC-Light V2...', {
      prompt: lightingPrompt.substring(0, 50) + '...',
      direction,
      numImages: clampedImages
    })

    // 7. CALL IC-LIGHT V2 API
    const result = await fal.subscribe('fal-ai/iclight-v2', {
      input: {
        image_url: uploadedUrl,
        prompt: lightingPrompt,
        initial_latent: direction,
        num_images: clampedImages,
        num_inference_steps: 28,
        guidance_scale: 5,
        enable_hr_fix: enableHrFix,
        output_format: 'png',
      },
    })

    const data = result.data as { images: Array<{ url: string; width: number; height: number }> }
    if (!data.images || data.images.length === 0) {
      throw new Error('No images generated from IC-Light V2')
    }

    // 8. DOWNLOAD RESULTS AND CONVERT TO BASE64
    const results = await Promise.all(
      data.images.map(async (img, index) => {
        const response = await fetch(img.url)
        const buffer = Buffer.from(await response.arrayBuffer())
        const base64 = buffer.toString('base64')
        return {
          index,
          url: img.url,
          dataUrl: `data:image/png;base64,${base64}`,
          width: img.width,
          height: img.height
        }
      })
    )

    // 9. SAVE FIRST RESULT TO DATABASE FOR SHARE LINK
    const originalBase64 = Buffer.from(arrayBuffer).toString('base64')
    const originalDataUrl = `data:${file.type};base64,${originalBase64}`
    const imageRecord = await ProcessedImagesDB.create({
      userId: user.email,
      originalPath: originalDataUrl,
      processedPath: results[0].dataUrl,
      originalFilename: file.name,
      fileSize: file.size,
      width: results[0].width,
      height: results[0].height,
      isProcessed: true,
    })

    // 10. DEDUCT CREDITS & LOG USAGE
    await createUsage({
      userId: user.id,
      type: 'product_shot_relight',
      creditsUsed: creditsNeeded,
      imageSize: `${results[0].width}x${results[0].height}`,
      model: 'iclight-v2',
    })

    const newCredits = user.credits - creditsNeeded

    // 11. SEND LOW CREDITS WARNING
    if (newCredits > 0 && newCredits <= 10) {
      sendCreditsLowEmail({
        userEmail: user.email,
        userName: user.name || 'User',
        creditsRemaining: newCredits,
      }).catch(err => console.error('Failed to send low credits email:', err))
    }

    // 12. RETURN SUCCESS
    return NextResponse.json({
      success: true,
      id: imageRecord.id,
      results: results.map(r => ({
        index: r.index,
        dataUrl: r.dataUrl,
        width: r.width,
        height: r.height
      })),
      prompt: lightingPrompt,
      preset: preset || 'custom',
      lightDirection: direction,
      numImages: clampedImages,
      creditsUsed: creditsNeeded,
      creditsRemaining: newCredits,
    })
  } catch (error: unknown) {
    console.error('[Product Relight] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to relight product', details: errorMessage },
      { status: 500 }
    )
  }
}
