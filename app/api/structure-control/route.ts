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

const CREDITS_PER_CONTROL = CREDIT_COSTS.structure_control.cost

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
    const prompt = formData.get('prompt') as string
    const controlMode = formData.get('control_mode') as string || 'depth' // 'depth' or 'canny'
    const controlStrength = parseFloat(formData.get('strength') as string || '0.8')

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required for structure control' },
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
    if (user.credits < CREDITS_PER_CONTROL) {
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
          required: CREDITS_PER_CONTROL,
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

    // 7. SELECT MODEL BASED ON CONTROL MODE
    let modelId: string
    let inputParams: Record<string, unknown>

    if (controlMode === 'canny') {
      // FLUX Canny - Edge detection based control
      modelId = "black-forest-labs/flux-canny-pro"
      inputParams = {
        control_image: dataUrl,
        prompt: prompt,
        steps: 50,
        guidance: 30,
        output_format: "png",
        safety_tolerance: 2,
        prompt_upsampling: true,
      }
    } else {
      // FLUX Depth - Depth map based control (default)
      modelId = "black-forest-labs/flux-depth-pro"
      inputParams = {
        control_image: dataUrl,
        prompt: prompt,
        steps: 50,
        guidance: 30,
        output_format: "png",
        safety_tolerance: 2,
        prompt_upsampling: true,
      }
    }

    // 8. CALL REPLICATE
    const output = await replicate.run(
      modelId as `${string}/${string}`,
      { input: inputParams }
    ) as unknown as string

    // 9. DOWNLOAD RESULT AND CONVERT TO BASE64
    const resultResponse = await fetch(output)
    if (!resultResponse.ok) {
      throw new Error('Failed to download processed image')
    }
    const resultBuffer = Buffer.from(await resultResponse.arrayBuffer())
    const resultBase64 = resultBuffer.toString('base64')
    const resultDataUrl = `data:image/png;base64,${resultBase64}`

    // 10. DEDUCT CREDITS & LOG USAGE
    await createUsage({
      userId: user.id,
      type: 'structure_control',
      creditsUsed: CREDITS_PER_CONTROL,
      imageSize: `${file.size} bytes`,
      model: controlMode === 'canny' ? 'flux-canny-pro' : 'flux-depth-pro',
    })

    const newCredits = user.credits - CREDITS_PER_CONTROL

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
      processedImage: resultDataUrl,
      controlMode: controlMode,
      prompt: prompt,
      creditsUsed: CREDITS_PER_CONTROL,
      creditsRemaining: newCredits,
    })

  } catch (error: unknown) {
    console.error('[Structure Control] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to process structure control',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
