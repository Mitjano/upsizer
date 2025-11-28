import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

const CREDITS_PER_GENERATION = 3 // Background generation is compute-intensive

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
    const user = getUserByEmail(authResult.user!.email)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 3. GET FILE FROM FORMDATA
    const formData = await request.formData()
    const file = formData.get('file') as File
    const prompt = formData.get('prompt') as string || 'professional studio background'
    const negativePrompt = formData.get('negative_prompt') as string || 'low quality, blurry, distorted'
    const refinePrompt = formData.get('refine_prompt') === 'true'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
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
    if (user.credits < CREDITS_PER_GENERATION) {
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
          required: CREDITS_PER_GENERATION,
          available: user.credits,
        },
        { status: 402 }
      )
    }

    // 6. CONVERT TO BASE64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const mimeType = file.type
    const dataUrl = `data:${mimeType};base64,${base64}`

    // 7. CALL REPLICATE - BRIA Background Generation model
    const output = await replicate.run(
      "bria-ai/bria-background-generation:15ddb1a21a3c5b48e858a78c7b4c26bd32daa39e4bcb4c6a7e5e4469dc522192",
      {
        input: {
          image: dataUrl,
          prompt: prompt,
          negative_prompt: negativePrompt,
          refine_prompt: refinePrompt,
        }
      }
    ) as string

    // 8. DOWNLOAD RESULT AND CONVERT TO BASE64
    const resultResponse = await fetch(output)
    if (!resultResponse.ok) {
      throw new Error('Failed to download generated image')
    }
    const resultBuffer = Buffer.from(await resultResponse.arrayBuffer())
    const resultBase64 = resultBuffer.toString('base64')
    const resultDataUrl = `data:image/png;base64,${resultBase64}`

    // 9. DEDUCT CREDITS & LOG USAGE
    createUsage({
      userId: user.id,
      type: 'background_generate',
      creditsUsed: CREDITS_PER_GENERATION,
      imageSize: `${file.size} bytes`,
      model: 'bria-background-generation',
      metadata: { prompt, negativePrompt }
    })

    const newCredits = user.credits - CREDITS_PER_GENERATION

    // 10. SEND LOW CREDITS WARNING
    if (newCredits > 0 && newCredits <= 10) {
      sendCreditsLowEmail({
        userEmail: user.email,
        userName: user.name || 'User',
        creditsRemaining: newCredits,
        totalUsed: user.totalUsage || 0,
      }).catch(err => console.error('Failed to send low credits email:', err))
    }

    // 11. RETURN SUCCESS
    return NextResponse.json({
      success: true,
      generatedImage: resultDataUrl,
      prompt: prompt,
      creditsUsed: CREDITS_PER_GENERATION,
      creditsRemaining: newCredits,
    })

  } catch (error: unknown) {
    console.error('[Background Generate] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to generate background',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
