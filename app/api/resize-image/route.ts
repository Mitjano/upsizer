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
    const targetWidth = parseInt(formData.get('width') as string) || 0
    const targetHeight = parseInt(formData.get('height') as string) || 0
    const maintainAspectRatio = formData.get('maintainAspectRatio') !== 'false'
    const fit = (formData.get('fit') as string) || 'inside' // cover, contain, fill, inside, outside

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate at least one dimension
    if (!targetWidth && !targetHeight) {
      return NextResponse.json(
        { error: 'At least one dimension (width or height) is required' },
        { status: 400 }
      )
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

    // Validate dimensions (max 8192px)
    const MAX_DIMENSION = 8192
    if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
      return NextResponse.json(
        { error: `Maximum dimension is ${MAX_DIMENSION}px` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Get image metadata
    const metadata = await sharp(buffer).metadata()

    // Build resize options
    const resizeOptions: sharp.ResizeOptions = {
      fit: fit as keyof sharp.FitEnum,
      withoutEnlargement: false,
    }

    if (targetWidth) resizeOptions.width = targetWidth
    if (targetHeight) resizeOptions.height = targetHeight

    // Resize image with Sharp
    const resizedBuffer = await sharp(buffer)
      .resize(resizeOptions)
      .toBuffer()

    // Get new dimensions
    const newMetadata = await sharp(resizedBuffer).metadata()

    // Determine output format based on input
    let outputMimeType = file.type
    if (outputMimeType === 'image/jpg') outputMimeType = 'image/jpeg'

    // Log usage (FREE tool - 0 credits)
    await createUsage({
      userId: user.id,
      type: 'resize_image',
      creditsUsed: 0,
      imageSize: `${metadata.width}x${metadata.height} → ${newMetadata.width}x${newMetadata.height}`,
      model: 'sharp-resize',
    })

    // Convert to base64
    const base64 = resizedBuffer.toString('base64')
    const dataUrl = `data:${outputMimeType};base64,${base64}`

    return NextResponse.json({
      success: true,
      image: dataUrl,
      stats: {
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        newWidth: newMetadata.width,
        newHeight: newMetadata.height,
        fit,
        maintainAspectRatio,
      },
      creditsRemaining: user.credits, // No deduction for FREE tool
    })

  } catch (error) {
    console.error('Error resizing image:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resize image' },
      { status: 500 }
    )
  }
}
