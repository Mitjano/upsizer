import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

const CREDITS_PER_REMOVAL = 2 // Object removal is more compute-intensive

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
    const mask = formData.get('mask') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    if (!mask) {
      return NextResponse.json(
        { error: 'No mask file provided. Draw over the object you want to remove.' },
        { status: 400 }
      )
    }

    // 4. VALIDATE FILES
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid image file type. Supported: JPG, PNG, WEBP' },
        { status: 400 }
      )
    }

    if (!allowedTypes.includes(mask.type)) {
      return NextResponse.json(
        { error: 'Invalid mask file type. Supported: JPG, PNG, WEBP' },
        { status: 400 }
      )
    }

    const MAX_SIZE = 20 * 1024 * 1024 // 20MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Image file too large. Maximum size: 20MB' },
        { status: 400 }
      )
    }

    // 5. CHECK CREDITS
    if (user.credits < CREDITS_PER_REMOVAL) {
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
          required: CREDITS_PER_REMOVAL,
          available: user.credits,
        },
        { status: 402 }
      )
    }

    // 6. CONVERT TO BASE64
    const imageArrayBuffer = await file.arrayBuffer()
    const imageBuffer = Buffer.from(imageArrayBuffer)
    const imageBase64 = imageBuffer.toString('base64')
    const imageDataUrl = `data:${file.type};base64,${imageBase64}`

    const maskArrayBuffer = await mask.arrayBuffer()
    const maskBuffer = Buffer.from(maskArrayBuffer)
    const maskBase64 = maskBuffer.toString('base64')
    const maskDataUrl = `data:${mask.type};base64,${maskBase64}`

    // 7. CALL REPLICATE - BRIA Eraser model
    const output = await replicate.run(
      "bria-ai/bria-eraser:9896ffa5fd2dd58f5cc94deab67a50a4b83b4e0b0cbf780e38f9b20e3a129ebd",
      {
        input: {
          image: imageDataUrl,
          mask: maskDataUrl,
        }
      }
    ) as unknown as string

    // 8. DOWNLOAD RESULT AND CONVERT TO BASE64
    const resultResponse = await fetch(output)
    if (!resultResponse.ok) {
      throw new Error('Failed to download processed image')
    }
    const resultBuffer = Buffer.from(await resultResponse.arrayBuffer())
    const resultBase64 = resultBuffer.toString('base64')
    const resultDataUrl = `data:image/png;base64,${resultBase64}`

    // 9. DEDUCT CREDITS & LOG USAGE
    await createUsage({
      userId: user.id,
      type: 'object_removal',
      creditsUsed: CREDITS_PER_REMOVAL,
      imageSize: `${file.size} bytes`,
      model: 'bria-eraser',
    })

    const newCredits = user.credits - CREDITS_PER_REMOVAL

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
      processedImage: resultDataUrl,
      creditsUsed: CREDITS_PER_REMOVAL,
      creditsRemaining: newCredits,
    })

  } catch (error: unknown) {
    console.error('[Object Removal] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to remove object from image',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
