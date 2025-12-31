import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'
import { CREDIT_COSTS } from '@/lib/credits-config'
import { ProcessedImagesDB } from '@/lib/processed-images-db'
import { prisma } from '@/lib/prisma'

// Configure fal.ai client
fal.config({
  credentials: process.env.FAL_API_KEY,
})

// For App Router - set max duration for processing
export const maxDuration = 120 // 2 minutes timeout
export const dynamic = 'force-dynamic'

const PORTRAIT_RELIGHT_CREDITS = CREDIT_COSTS.portrait_relight.cost

// Preset lighting options
const LIGHTING_PRESETS: Record<string, string> = {
  studio: 'Professional studio lighting with soft key light from the left, fill light from the right, and subtle rim light, creating dimensional portrait lighting',
  golden: 'Warm golden hour sunlight from the side, creating soft shadows and a warm glow on the skin',
  dramatic: 'Dramatic single light source from above, creating strong shadows and moody atmosphere',
  neon: 'Vibrant neon lighting with pink and blue colors, cyberpunk style portrait lighting',
  natural: 'Soft natural window light from the side, creating gentle shadows and natural look',
  rembrandt: 'Classic Rembrandt lighting with triangular highlight on the cheek, artistic portrait style',
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

    // Determine the lighting prompt
    let lightingPrompt: string
    if (customPrompt && customPrompt.trim()) {
      lightingPrompt = customPrompt.trim()
    } else if (preset && LIGHTING_PRESETS[preset]) {
      lightingPrompt = LIGHTING_PRESETS[preset]
    } else {
      lightingPrompt = LIGHTING_PRESETS.studio
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
    const creditsNeeded = PORTRAIT_RELIGHT_CREDITS
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

    console.log('Processing portrait relight with ICLight V2...', { prompt: lightingPrompt })

    // 7. PROCESS WITH ICLIGHT V2
    const result = await fal.subscribe('fal-ai/iclight-v2', {
      input: {
        image_url: uploadedUrl,
        prompt: lightingPrompt,
        num_inference_steps: 35,
        guidance_scale: 7,
        enable_hr_fix: true,
        output_format: 'png',
      },
    })

    const data = result.data as { images: Array<{ url: string }> }
    if (!data.images || data.images.length === 0) {
      throw new Error('No image generated from ICLight V2')
    }

    const resultUrl = data.images[0].url

    // Download result and convert to base64
    const resultResponse = await fetch(resultUrl)
    const resultBuffer = Buffer.from(await resultResponse.arrayBuffer())
    const base64 = resultBuffer.toString('base64')
    const processedDataUrl = `data:image/png;base64,${base64}`

    // Convert original to base64 for comparison
    const originalBase64 = Buffer.from(arrayBuffer).toString('base64')
    const originalDataUrl = `data:${file.type};base64,${originalBase64}`

    // 8. SAVE TO DATABASE FOR SHARE LINK
    const imageRecord = await ProcessedImagesDB.create({
      userId: user.email,
      originalPath: originalDataUrl,
      processedPath: processedDataUrl,
      originalFilename: file.name,
      fileSize: file.size,
      width: 0,
      height: 0,
      isProcessed: true,
    })

    // 8b. SAVE TO PRISMA IMAGE HISTORY (for admin panel)
    try {
      if (prisma) {
        await prisma.imageHistory.create({
          data: {
            userId: user.id,
            type: 'portrait_relight',
            status: 'completed',
            preset: preset || 'studio',
            originalUrl: originalDataUrl,
            originalSize: file.size,
            originalFormat: file.type,
            processedUrl: processedDataUrl,
            processedFormat: 'image/png',
            creditsUsed: creditsNeeded,
            model: 'fal-ai/iclight-v2',
          },
        })
      }
    } catch (err) {
      console.error('[Portrait Relight] Failed to save to ImageHistory:', err)
    }

    // 9. DEDUCT CREDITS & LOG USAGE
    await createUsage({
      userId: user.id,
      type: 'portrait_relight',
      creditsUsed: creditsNeeded,
      imageSize: `${file.size} bytes`,
      model: 'fal-ai/iclight-v2',
    })

    const newCredits = user.credits - creditsNeeded

    // 10. SEND LOW CREDITS WARNING
    if (newCredits > 0 && newCredits <= 10) {
      sendCreditsLowEmail({
        userEmail: user.email,
        userName: user.name || 'User',
        creditsRemaining: newCredits,
      }).catch(err => console.error('Failed to send low credits email:', err))
    }

    // 11. RETURN SUCCESS
    return NextResponse.json({
      success: true,
      image: {
        id: imageRecord.id,
        originalPath: originalDataUrl,
        processedPath: processedDataUrl,
        filename: file.name,
        creditsRemaining: newCredits,
      },
      prompt: lightingPrompt,
      preset: preset || 'custom',
    })
  } catch (error: unknown) {
    console.error('[Portrait Relight] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to process portrait'
    return NextResponse.json(
      { error: 'Failed to relight portrait', details: errorMessage },
      { status: 500 }
    )
  }
}
