import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, createUsage } from '@/lib/db'
import sharp from 'sharp'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Filter presets
const FILTER_PRESETS = {
  none: {},
  grayscale: { grayscale: true },
  sepia: {
    modulate: { saturation: 0.3 },
    tint: { r: 112, g: 66, b: 20 }
  },
  vintage: {
    modulate: { saturation: 0.8, brightness: 0.95 },
    gamma: 1.1,
  },
  cool: {
    modulate: { saturation: 1.1 },
    tint: { r: 200, g: 200, b: 255 }
  },
  warm: {
    modulate: { saturation: 1.1 },
    tint: { r: 255, g: 200, b: 150 }
  },
  dramatic: {
    modulate: { saturation: 1.3, brightness: 0.9 },
    gamma: 0.8,
  },
}

export async function POST(request: NextRequest) {
  try {
    const identifier = getClientIdentifier(request)
    const { allowed, resetAt } = imageProcessingLimiter.check(identifier)
    if (!allowed) return rateLimitResponse(resetAt)

    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode || 401 })
    }

    const user = await getUserByEmail(authResult.user!.email)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Get filter parameters
    const preset = (formData.get('preset') as string) || 'none'
    const brightness = parseFloat(formData.get('brightness') as string) || 1 // 0.5 to 2
    const contrast = parseFloat(formData.get('contrast') as string) || 1 // 0.5 to 2
    const saturation = parseFloat(formData.get('saturation') as string) || 1 // 0 to 2
    const blur = parseFloat(formData.get('blur') as string) || 0 // 0 to 10
    const sharpen = parseFloat(formData.get('sharpen') as string) || 0 // 0 to 10

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const MAX_SIZE = 20 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let pipeline = sharp(buffer)

    // Apply preset filter first
    if (preset !== 'none' && FILTER_PRESETS[preset as keyof typeof FILTER_PRESETS]) {
      const presetConfig = FILTER_PRESETS[preset as keyof typeof FILTER_PRESETS]
      if ('grayscale' in presetConfig) {
        pipeline = pipeline.grayscale()
      }
      if ('modulate' in presetConfig) {
        pipeline = pipeline.modulate(presetConfig.modulate as any)
      }
      if ('gamma' in presetConfig) {
        pipeline = pipeline.gamma(presetConfig.gamma as number)
      }
    }

    // Apply manual adjustments
    pipeline = pipeline.modulate({
      brightness,
      saturation,
    })

    // Contrast adjustment via linear transform
    if (contrast !== 1) {
      const a = contrast
      const b = (1 - contrast) * 128
      pipeline = pipeline.linear(a, b)
    }

    // Apply blur
    if (blur > 0) {
      pipeline = pipeline.blur(blur)
    }

    // Apply sharpen
    if (sharpen > 0) {
      pipeline = pipeline.sharpen(sharpen)
    }

    const processedBuffer = await pipeline.toBuffer()

    // Determine output format
    let outputMimeType = file.type
    if (outputMimeType === 'image/jpg') outputMimeType = 'image/jpeg'

    // Log usage (FREE)
    await createUsage({
      userId: user.id,
      type: 'image_filters',
      creditsUsed: 0,
      imageSize: `${file.size} bytes`,
      model: `sharp-filter-${preset}`,
    })

    const base64 = processedBuffer.toString('base64')
    const dataUrl = `data:${outputMimeType};base64,${base64}`

    return NextResponse.json({
      success: true,
      image: dataUrl,
      stats: {
        preset,
        adjustments: { brightness, contrast, saturation, blur, sharpen },
      },
      creditsRemaining: user.credits,
    })

  } catch (error) {
    console.error('Error applying filters:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to apply filters' },
      { status: 500 }
    )
  }
}
