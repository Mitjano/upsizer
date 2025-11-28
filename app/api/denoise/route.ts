import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

const CREDITS_PER_DENOISE = 1

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
    const task = formData.get('task') as string || 'real_sr' // real_sr, denoise, jpeg_car

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

    // Validate task type
    const validTasks = ['real_sr', 'denoise', 'jpeg_car']
    if (!validTasks.includes(task)) {
      return NextResponse.json(
        { error: 'Invalid task. Supported: real_sr, denoise, jpeg_car' },
        { status: 400 }
      )
    }

    // 5. CHECK CREDITS
    if (user.credits < CREDITS_PER_DENOISE) {
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
          required: CREDITS_PER_DENOISE,
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

    // 7. CALL REPLICATE - SwinIR model
    const output = await replicate.run(
      "jingyunliang/swinir:660d922d33153019e8c263a3bba265de882e7f4f70396571f16765507b29b690",
      {
        input: {
          image: dataUrl,
          task_type: task, // real_sr, denoise, jpeg_car
        }
      }
    ) as string

    // 8. DOWNLOAD RESULT AND CONVERT TO BASE64
    const resultResponse = await fetch(output)
    if (!resultResponse.ok) {
      throw new Error('Failed to download processed image')
    }
    const resultBuffer = Buffer.from(await resultResponse.arrayBuffer())
    const resultBase64 = resultBuffer.toString('base64')
    const resultDataUrl = `data:image/png;base64,${resultBase64}`

    // 9. DEDUCT CREDITS & LOG USAGE
    createUsage({
      userId: user.id,
      type: 'denoise',
      creditsUsed: CREDITS_PER_DENOISE,
      imageSize: `${file.size} bytes`,
      model: 'swinir',
      metadata: { task }
    })

    const newCredits = user.credits - CREDITS_PER_DENOISE

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
      task: task,
      creditsUsed: CREDITS_PER_DENOISE,
      creditsRemaining: newCredits,
    })

  } catch (error: unknown) {
    console.error('[Denoise] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to process image',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
