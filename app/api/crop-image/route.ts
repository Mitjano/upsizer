import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, createUsage } from '@/lib/db'
import sharp from 'sharp'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const { allowed, resetAt } = imageProcessingLimiter.check(identifier)
    if (!allowed) {
      return rateLimitResponse(resetAt)
    }

    // Authenticate
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode || 401 }
      )
    }

    // Get user
    const user = await getUserByEmail(authResult.user!.email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const cropX = parseInt(formData.get('x') as string) || 0
    const cropY = parseInt(formData.get('y') as string) || 0
    const cropWidth = parseInt(formData.get('width') as string)
    const cropHeight = parseInt(formData.get('height') as string)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: JPG, PNG, WebP' },
        { status: 400 }
      )
    }

    // Validate file size (max 20MB)
    const MAX_SIZE = 20 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 20MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Get image metadata
    const metadata = await sharp(buffer).metadata()

    // Validate crop dimensions
    if (!cropWidth || !cropHeight) {
      return NextResponse.json(
        { error: 'Crop width and height are required' },
        { status: 400 }
      )
    }

    // Ensure crop region is within image bounds
    const maxX = Math.min(cropX, (metadata.width || 0) - 1)
    const maxY = Math.min(cropY, (metadata.height || 0) - 1)
    const maxWidth = Math.min(cropWidth, (metadata.width || 0) - maxX)
    const maxHeight = Math.min(cropHeight, (metadata.height || 0) - maxY)

    // Crop image with Sharp
    const croppedBuffer = await sharp(buffer)
      .extract({
        left: Math.max(0, maxX),
        top: Math.max(0, maxY),
        width: Math.max(1, maxWidth),
        height: Math.max(1, maxHeight),
      })
      .toBuffer()

    // Determine output format based on input
    let outputMimeType = file.type
    if (outputMimeType === 'image/jpg') outputMimeType = 'image/jpeg'

    // Log usage (FREE tool - 0 credits)
    await createUsage({
      userId: user.id,
      type: 'crop_image',
      creditsUsed: 0,
      imageSize: `${metadata.width}x${metadata.height} → ${maxWidth}x${maxHeight}`,
      model: 'sharp-crop',
    })

    // Convert to base64
    const base64 = croppedBuffer.toString('base64')
    const dataUrl = `data:${outputMimeType};base64,${base64}`

    return NextResponse.json({
      success: true,
      image: dataUrl,
      stats: {
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        croppedWidth: maxWidth,
        croppedHeight: maxHeight,
        cropRegion: { x: maxX, y: maxY, width: maxWidth, height: maxHeight },
      },
      creditsRemaining: user.credits, // No deduction for FREE tool
    })

  } catch (error) {
    console.error('Error cropping image:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to crop image' },
      { status: 500 }
    )
  }
}
