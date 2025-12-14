import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'
import { CREDIT_COSTS } from '@/lib/credits-config'

// Configure fal.ai client
fal.config({
  credentials: process.env.FAL_API_KEY,
})

const AI_BACKGROUND_CREDITS = CREDIT_COSTS.packshot.cost

// Preset prompts for AI backgrounds
const PRESET_PROMPTS: Record<string, string> = {
  studio: 'Professional product photography studio setup, clean white cyclorama background, soft studio lighting with subtle gradient, commercial photography, high-end product shot',
  marble: 'Elegant marble surface with soft natural lighting, luxury product photography, clean white marble texture, premium feel, high-end commercial shot',
  nature: 'Natural outdoor setting with soft bokeh background, organic green leaves and plants, soft natural daylight, lifestyle product photography',
  minimal: 'Minimalist clean background, soft neutral gradient, modern product photography, subtle shadows, contemporary design aesthetic',
  wood: 'Rustic wooden table surface, warm natural tones, artisan product photography, cozy ambient lighting, handcrafted feel',
  lifestyle: 'Modern lifestyle scene, contemporary interior setting, soft ambient lighting, aspirational product placement, premium home environment',
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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Determine the prompt to use
    let backgroundPrompt: string
    if (customPrompt && customPrompt.trim()) {
      backgroundPrompt = customPrompt.trim()
    } else if (preset && PRESET_PROMPTS[preset]) {
      backgroundPrompt = PRESET_PROMPTS[preset]
    } else {
      backgroundPrompt = PRESET_PROMPTS.studio
    }

    // 4. VALIDATE FILE
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: JPG, PNG, WEBP' },
        { status: 400 }
      )
    }

    const MAX_SIZE = 30 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 30MB' },
        { status: 400 }
      )
    }

    // 5. CHECK CREDITS
    const creditsNeeded = AI_BACKGROUND_CREDITS
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

    console.log('Generating AI background with Bria...', { prompt: backgroundPrompt })

    // 7. GENERATE AI BACKGROUND (Bria handles bg removal + new bg generation)
    const result = await fal.subscribe('fal-ai/bria/background/replace', {
      input: {
        image_url: uploadedUrl,
        prompt: backgroundPrompt,
        refine_prompt: true,
        fast: true,
        num_images: 1,
      },
    })

    const data = result.data as { images: Array<{ url: string }> }
    if (!data.images || data.images.length === 0) {
      throw new Error('No image generated from Bria')
    }

    const resultUrl = data.images[0].url

    // Download result and convert to base64
    const resultResponse = await fetch(resultUrl)
    const resultBuffer = Buffer.from(await resultResponse.arrayBuffer())
    const base64 = resultBuffer.toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    // 8. DEDUCT CREDITS & LOG USAGE
    await createUsage({
      userId: user.id,
      type: 'ai_background',
      creditsUsed: creditsNeeded,
      imageSize: `${file.size} bytes`,
      model: 'bria-background-replace',
    })

    const newCredits = user.credits - creditsNeeded

    // 9. SEND LOW CREDITS WARNING
    if (newCredits > 0 && newCredits <= 10) {
      sendCreditsLowEmail({
        userEmail: user.email,
        userName: user.name || 'User',
        creditsRemaining: newCredits,
      }).catch(err => console.error('Failed to send low credits email:', err))
    }

    // 10. RETURN SUCCESS
    return NextResponse.json({
      success: true,
      result: dataUrl,
      prompt: backgroundPrompt,
      preset: preset || 'custom',
      creditsRemaining: newCredits,
    })
  } catch (error: any) {
    console.error('[AI Background] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI background', details: error.message },
      { status: 500 }
    )
  }
}
