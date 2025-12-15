import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, createUsage } from '@/lib/db'
import sharp from 'sharp'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'

// For App Router - set max duration for large file processing
export const maxDuration = 60 // 60 seconds timeout
export const dynamic = 'force-dynamic'

// Format converter is FREE - no credits required
const CREDIT_COST = 0

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const { allowed, resetAt } = imageProcessingLimiter.check(identifier)
    if (!allowed) {
      return rateLimitResponse(resetAt)
    }

    // 1. Authenticate via session or API key
    const authResult = await authenticateRequest(request)

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode || 401 }
      )
    }

    // 2. Get user from database
    const user = await getUserByEmail(authResult.user!.email)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 3. Get file and conversion settings from formData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const targetFormat = (formData.get('format') as string)?.toLowerCase() || 'png'
    const quality = parseInt(formData.get('quality') as string) || 80

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // 4. Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: JPG, PNG, WebP, AVIF, GIF' },
        { status: 400 }
      )
    }

    // 5. Validate target format
    const validFormats = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif']
    if (!validFormats.includes(targetFormat)) {
      return NextResponse.json(
        { error: 'Invalid target format. Supported: JPG, PNG, WebP, AVIF, GIF' },
        { status: 400 }
      )
    }

    // 6. Validate file size (max 20MB)
    const MAX_SIZE = 20 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 20MB' },
        { status: 400 }
      )
    }

    // 7. Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 8. Get original image metadata
    const metadata = await sharp(buffer).metadata()
    const originalSize = file.size
    const originalFormat = metadata.format || file.type.split('/')[1]

    // 9. Convert image based on target format
    let convertedBuffer: Buffer
    let outputMimeType: string

    const sharpInstance = sharp(buffer)

    switch (targetFormat) {
      case 'jpg':
      case 'jpeg':
        convertedBuffer = await sharpInstance
          .jpeg({
            quality,
            progressive: true,
            mozjpeg: true
          })
          .toBuffer()
        outputMimeType = 'image/jpeg'
        break

      case 'png':
        convertedBuffer = await sharpInstance
          .png({
            quality,
            compressionLevel: 9,
            adaptiveFiltering: true
          })
          .toBuffer()
        outputMimeType = 'image/png'
        break

      case 'webp':
        convertedBuffer = await sharpInstance
          .webp({
            quality,
            effort: 6
          })
          .toBuffer()
        outputMimeType = 'image/webp'
        break

      case 'avif':
        convertedBuffer = await sharpInstance
          .avif({
            quality,
            effort: 6
          })
          .toBuffer()
        outputMimeType = 'image/avif'
        break

      case 'gif':
        convertedBuffer = await sharpInstance
          .gif()
          .toBuffer()
        outputMimeType = 'image/gif'
        break

      default:
        convertedBuffer = await sharpInstance.png().toBuffer()
        outputMimeType = 'image/png'
    }

    const convertedSize = convertedBuffer.length
    const sizeDifference = ((convertedSize - originalSize) / originalSize * 100).toFixed(1)

    // 10. Log usage (free, 0 credits)
    await createUsage({
      userId: user.id,
      type: 'convert',
      creditsUsed: CREDIT_COST,
      imageSize: `${originalSize} → ${convertedSize} bytes`,
      model: `sharp-${originalFormat}-to-${targetFormat}`,
    })

    // 11. Convert to base64
    const base64 = convertedBuffer.toString('base64')
    const dataUrl = `data:${outputMimeType};base64,${base64}`

    // 12. Return converted image with stats
    return NextResponse.json({
      success: true,
      image: dataUrl,
      stats: {
        originalSize,
        convertedSize,
        sizeDifference: parseFloat(sizeDifference),
        originalFormat,
        targetFormat: targetFormat === 'jpeg' ? 'jpg' : targetFormat,
        quality,
        width: metadata.width,
        height: metadata.height,
      },
      creditsRemaining: user.credits,
    })

  } catch (error) {
    console.error('Error converting image:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to convert image' },
      { status: 500 }
    )
  }
}
