import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'
import { CREDIT_COSTS } from '@/lib/credits-config'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

const CREDITS_PER_REIMAGINE = CREDIT_COSTS.reimagine.cost

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

    // 3. GET FILE FROM FORMDATA
    const formData = await request.formData()
    const file = formData.get('file') as File
    const prompt = formData.get('prompt') as string || ''
    const variationStrength = parseFloat(formData.get('strength') as string || '0.7')
    const numVariations = parseInt(formData.get('num_variations') as string || '1')

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

    // Limit variations to 4 max
    const actualVariations = Math.min(Math.max(numVariations, 1), 4)
    const totalCredits = CREDITS_PER_REIMAGINE * actualVariations

    // 5. CHECK CREDITS
    if (user.credits < totalCredits) {
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
          required: totalCredits,
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

    // 7. CALL REPLICATE - FLUX Redux Schnell for image variations
    // FLUX Redux does NOT support prompt - it uses redux_image for conditioning
    const output = await replicate.run(
      "black-forest-labs/flux-redux-schnell",
      {
        input: {
          redux_image: dataUrl, // Image to create variations from
          num_outputs: actualVariations,
          megapixels: "1",
          num_inference_steps: 4, // Schnell uses 1-4 steps
          output_format: "png",
          output_quality: 100,
        }
      }
    ) as unknown as string[]

    // 8. DOWNLOAD RESULTS AND CONVERT TO BASE64
    const variations: string[] = []
    const outputArray = Array.isArray(output) ? output : [output]

    for (const resultUrl of outputArray) {
      const resultResponse = await fetch(resultUrl as string)
      if (!resultResponse.ok) {
        console.error('Failed to download variation')
        continue
      }
      const resultBuffer = Buffer.from(await resultResponse.arrayBuffer())
      const resultBase64 = resultBuffer.toString('base64')
      variations.push(`data:image/png;base64,${resultBase64}`)
    }

    if (variations.length === 0) {
      throw new Error('Failed to generate any variations')
    }

    // 9. DEDUCT CREDITS & LOG USAGE
    await createUsage({
      userId: user.id,
      type: 'reimagine',
      creditsUsed: totalCredits,
      imageSize: `${file.size} bytes`,
      model: 'flux-redux-schnell',
    })

    const newCredits = user.credits - totalCredits

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
      variations: variations,
      variationCount: variations.length,
      prompt: prompt || 'Image variation',
      creditsUsed: totalCredits,
      creditsRemaining: newCredits,
    })

  } catch (error: unknown) {
    console.error('[Reimagine] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to reimagine image',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
