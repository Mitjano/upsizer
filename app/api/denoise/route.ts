import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'
import { CREDIT_COSTS } from '@/lib/credits-config'
import { ImageProcessor } from '@/lib/image-processor'
import { ProcessedImagesDB } from '@/lib/processed-images-db'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

const CREDITS_PER_DENOISE = CREDIT_COSTS.denoise.cost

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

    // Map old task names to new Replicate task_type values
    const taskMapping: Record<string, string> = {
      'real_sr': 'Real-World Image Super-Resolution-Large',
      'denoise': 'Color Image Denoising',
      'jpeg_car': 'JPEG Compression Artifact Reduction',
      'old_photo': 'FLUX Kontext Restore', // New: AI photo restoration
    }

    const validTasks = Object.keys(taskMapping)
    if (!validTasks.includes(task)) {
      return NextResponse.json(
        { error: 'Invalid task. Supported: real_sr, denoise, jpeg_car, old_photo' },
        { status: 400 }
      )
    }

    const replicateTaskType = taskMapping[task]
    const isOldPhotoRestore = task === 'old_photo'

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

    // 6.5. RESIZE IF TOO LARGE FOR REPLICATE GPU
    // SwinIR requires smaller input (~1 million pixels) because it does 4x super-resolution
    // Output would be 4x larger, causing CUDA OOM errors on Replicate A100 GPU
    const MAX_PIXELS_FOR_SWINIR = 1000000 // ~1000x1000 pixels max input
    const resizedDataUrl = await ImageProcessor.resizeForUpscale(dataUrl, MAX_PIXELS_FOR_SWINIR)

    // 7. CALL APPROPRIATE MODEL
    let output: string

    if (isOldPhotoRestore) {
      // Use FLUX Kontext for old photo restoration (better for scratches, damage, colorization)
      output = await ImageProcessor.restoreOldPhoto(resizedDataUrl)
    } else {
      // Use SwinIR for denoise, jpeg artifact removal, and super-resolution
      output = await replicate.run(
        "jingyunliang/swinir:660d922d33153019e8c263a3bba265de882e7f4f70396546b6c9c8f9d47a021a",
        {
          input: {
            image: resizedDataUrl,
            task_type: replicateTaskType,
          }
        }
      ) as unknown as string
    }

    // 8. DOWNLOAD RESULT
    const resultResponse = await fetch(output)
    if (!resultResponse.ok) {
      throw new Error('Failed to download processed image')
    }
    const resultBuffer = Buffer.from(await resultResponse.arrayBuffer())
    const resultBase64 = resultBuffer.toString('base64')
    const resultDataUrl = `data:image/png;base64,${resultBase64}`

    // 8.5 SAVE FILES TO DISK FOR SHARE LINK
    // Get image dimensions
    const dimensions = await ImageProcessor.getImageDimensions(buffer)

    // Save original image to disk
    const originalPath = await ImageProcessor.saveFile(
      buffer,
      file.name,
      'original'
    )

    // Save processed image to disk
    const processedFilename = file.name.replace(/\.[^.]+$/, '_restored.png')
    const processedPath = await ImageProcessor.saveFile(
      resultBuffer,
      processedFilename,
      'processed'
    )

    // Create database record with file paths (not base64)
    const imageRecord = await ProcessedImagesDB.create({
      userId: user.email,
      originalPath,
      processedPath,
      originalFilename: file.name,
      fileSize: file.size,
      width: dimensions.width,
      height: dimensions.height,
      isProcessed: true,
    })

    // 9. DEDUCT CREDITS & LOG USAGE
    await createUsage({
      userId: user.id,
      type: isOldPhotoRestore ? 'old_photo_restore' : 'denoise',
      creditsUsed: CREDITS_PER_DENOISE,
      imageSize: `${file.size} bytes`,
      model: isOldPhotoRestore ? 'flux-kontext-restore' : `swinir-${task}`,
    })

    const newCredits = user.credits - CREDITS_PER_DENOISE

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
      id: imageRecord.id,
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
