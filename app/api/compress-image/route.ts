import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserByEmail, createUsage } from '@/lib/db'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
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

    // 3. Get file and compression settings from formData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const quality = parseInt(formData.get('quality') as string) || 80
    const format = (formData.get('format') as string) || 'auto' // 'auto', 'jpg', 'png', 'webp'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // 4. Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: JPG, PNG, WebP' },
        { status: 400 }
      )
    }

    // 5. Validate file size (max 20MB)
    const MAX_SIZE = 20 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 20MB' },
        { status: 400 }
      )
    }

    // 6. Check credits (1 credit per compression)
    const creditsNeeded = 1

    if (user.credits < creditsNeeded) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: creditsNeeded,
          available: user.credits
        },
        { status: 402 }
      )
    }

    // 7. Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)


    // 8. Get original image metadata
    const metadata = await sharp(buffer).metadata()
    const originalSize = file.size

    // 9. Determine output format
    let outputFormat: 'jpeg' | 'png' | 'webp' = 'jpeg'
    let outputMimeType = 'image/jpeg'

    if (format === 'auto') {
      // Auto-detect best format based on input
      if (file.type === 'image/png' && metadata.hasAlpha) {
        outputFormat = 'png'
        outputMimeType = 'image/png'
      } else if (file.type === 'image/webp') {
        outputFormat = 'webp'
        outputMimeType = 'image/webp'
      }
    } else {
      outputFormat = format as 'jpeg' | 'png' | 'webp'
      outputMimeType = `image/${format === 'jpg' ? 'jpeg' : format}`
    }

    // 10. Compress image with Sharp
    let compressedBuffer: Buffer

    if (outputFormat === 'jpeg') {
      compressedBuffer = await sharp(buffer)
        .jpeg({
          quality,
          progressive: true,
          mozjpeg: true // Better compression
        })
        .toBuffer()
    } else if (outputFormat === 'png') {
      compressedBuffer = await sharp(buffer)
        .png({
          quality,
          compressionLevel: 9,
          adaptiveFiltering: true
        })
        .toBuffer()
    } else { // webp
      compressedBuffer = await sharp(buffer)
        .webp({
          quality,
          effort: 6 // 0-6, higher = better compression but slower
        })
        .toBuffer()
    }

    const compressedSize = compressedBuffer.length
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)


    // 11. Deduct credits and log usage
    createUsage({
      userId: user.id,
      type: 'compress',
      creditsUsed: creditsNeeded,
      imageSize: `${originalSize} → ${compressedSize} bytes`,
      model: `sharp-${outputFormat}`,
    })

    // 12. Convert compressed image to base64
    const base64 = compressedBuffer.toString('base64')
    const dataUrl = `data:${outputMimeType};base64,${base64}`

    // 13. Return compressed image with stats
    return NextResponse.json({
      success: true,
      image: dataUrl,
      stats: {
        originalSize,
        compressedSize,
        compressionRatio: parseFloat(compressionRatio),
        format: outputFormat,
        quality,
        width: metadata.width,
        height: metadata.height,
      },
      creditsRemaining: user.credits - creditsNeeded,
    })

  } catch (error) {
    console.error('Error compressing image:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compress image' },
      { status: 500 }
    )
  }
}
