import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserByEmail, updateUser } from '@/lib/db'
import { ImageProcessor } from '@/lib/image-processor'
import { ProcessedImagesDB } from '@/lib/processed-images-db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication (same pattern as upscale)
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. Get user from database
    const user = getUserByEmail(session.user.email)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 3. Get file from formData
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // 4. Validate file
    const validation = await ImageProcessor.validateImage(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // 5. Check credits (1 credit per background removal)
    const creditsNeeded = 1

    if (user.credits < creditsNeeded) {
      // Send credits depleted email
      if (user.credits === 0) {
        sendCreditsDepletedEmail({
          userName: user.name || 'User',
          userEmail: user.email,
          totalImagesProcessed: user.totalUsage || 0,
        }).catch(err => console.error('Credits depleted email failed:', err))
      }

      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: creditsNeeded,
          available: user.credits
        },
        { status: 402 }
      )
    }

    // 6. Convert image to base64 (same as upscale)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mimeType = file.type
    const dataUrl = `data:${mimeType};base64,${base64}`

    console.log(`Removing background from: ${file.name}`)

    // 7. Get image dimensions
    const dimensions = await ImageProcessor.getImageDimensions(buffer)

    // 8. Save original image
    const originalPath = await ImageProcessor.saveFile(
      buffer,
      file.name,
      'original'
    )

    // 9. Create database record
    const imageRecord = await ProcessedImagesDB.create({
      userId: session.user.email,
      originalPath,
      processedPath: null,
      originalFilename: file.name,
      fileSize: file.size,
      width: dimensions.width,
      height: dimensions.height,
      isProcessed: false
    })

    // 10. Process image - remove background
    try {
      const processedUrl = await ImageProcessor.removeBackground(dataUrl)

      // Download processed image from Replicate
      const processedBuffer = await ImageProcessor.downloadImage(processedUrl)

      // Save processed image (always as PNG for transparency)
      const processedFilename = file.name.replace(/\.[^.]+$/, '.png')
      const processedPath = await ImageProcessor.saveFile(
        processedBuffer,
        processedFilename,
        'processed'
      )

      // Update record with processed info
      await ProcessedImagesDB.update(imageRecord.id, {
        processedPath,
        isProcessed: true,
        processedAt: new Date().toISOString()
      })

      // 11. Update user credits
      const newCredits = user.credits - creditsNeeded
      const newTotalUsage = (user.totalUsage || 0) + 1

      updateUser(user.email, {
        credits: newCredits,
        totalUsage: newTotalUsage
      })

      // Send low credits warning if needed (10 credits remaining)
      if (newCredits > 0 && newCredits <= 10) {
        sendCreditsLowEmail({
          userName: user.name || 'User',
          userEmail: user.email,
          creditsRemaining: newCredits,
          totalUsed: newTotalUsage,
        }).catch(err => console.error('Credits low email failed:', err))
      }

      console.log(`Background removal completed: ${imageRecord.id}`)

      // 12. Return success
      return NextResponse.json({
        success: true,
        image: {
          id: imageRecord.id,
          originalUrl: `/api/processed-images/${imageRecord.id}/view?type=original`,
          processedUrl: `/api/processed-images/${imageRecord.id}/view?type=processed`,
          filename: file.name,
          creditsRemaining: newCredits
        }
      })

    } catch (processingError) {
      console.error('Processing error:', processingError)

      // Update record with error
      await ProcessedImagesDB.update(imageRecord.id, {
        processingError: String(processingError),
        isProcessed: false
      })

      return NextResponse.json(
        { error: 'Failed to process image. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Background removal error:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}
