import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, createUsage } from '@/lib/db'
import sharp from 'sharp'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

// Layout configurations
const LAYOUTS = {
  '2x1': { cols: 2, rows: 1, cells: [[0, 0], [1, 0]] },
  '1x2': { cols: 1, rows: 2, cells: [[0, 0], [0, 1]] },
  '2x2': { cols: 2, rows: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  '3x3': { cols: 3, rows: 3, cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]] },
  '1+2': { cols: 2, rows: 2, cells: [[0, 0, 1, 2], [1, 0], [1, 1]] },
  '2+1': { cols: 2, rows: 2, cells: [[0, 0], [1, 0], [0, 1, 2, 1]] },
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

    // Parse JSON body with base64 images
    const body = await request.json()
    const {
      images = [],
      layout = '2x2',
      gap = 10,
      backgroundColor = '#ffffff',
      outputWidth = 1200,
    } = body

    if (!images || images.length < 2) {
      return NextResponse.json({ error: 'At least 2 images required' }, { status: 400 })
    }
    if (images.length > 9) {
      return NextResponse.json({ error: 'Maximum 9 images allowed' }, { status: 400 })
    }

    // Validate layout
    if (!LAYOUTS[layout as keyof typeof LAYOUTS]) {
      return NextResponse.json({ error: 'Invalid layout' }, { status: 400 })
    }

    const layoutConfig = LAYOUTS[layout as keyof typeof LAYOUTS]
    const { cols, rows } = layoutConfig

    // Calculate cell dimensions
    const spacing = gap
    const cellWidth = Math.floor((outputWidth - spacing * (cols + 1)) / cols)
    const cellHeight = cellWidth // Square cells
    const outputHeight = cellHeight * rows + spacing * (rows + 1)

    // Convert base64 images to buffers and resize
    const imageBuffers: Buffer[] = []
    for (const imageDataUrl of images) {
      if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
        continue
      }
      
      const base64Data = imageDataUrl.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')

      // Resize each image to fit cell
      const resized = await sharp(buffer)
        .resize(cellWidth, cellHeight, { fit: 'cover' })
        .toBuffer()

      imageBuffers.push(resized)
    }

    if (imageBuffers.length < 2) {
      return NextResponse.json({ error: 'At least 2 valid images required' }, { status: 400 })
    }

    // Parse background color
    let bgColor = backgroundColor
    if (!bgColor.startsWith('#')) bgColor = '#ffffff'

    // Create canvas
    const canvas = sharp({
      create: {
        width: outputWidth,
        height: outputHeight,
        channels: 4,
        background: bgColor,
      }
    })

    // Build composite operations
    const composites: sharp.OverlayOptions[] = []
    const cells = layoutConfig.cells

    for (let i = 0; i < Math.min(imageBuffers.length, cells.length); i++) {
      const cell = cells[i]
      const col = cell[0]
      const row = cell[1]
      const colSpan = cell[2] || 1
      const rowSpan = cell[3] || 1

      const x = spacing + col * (cellWidth + spacing)
      const y = spacing + row * (cellHeight + spacing)

      let imgBuffer = imageBuffers[i]

      // If cell spans multiple cells, resize accordingly
      if (colSpan > 1 || rowSpan > 1) {
        const spanWidth = cellWidth * colSpan + spacing * (colSpan - 1)
        const spanHeight = cellHeight * rowSpan + spacing * (rowSpan - 1)
        imgBuffer = await sharp(imageBuffers[i])
          .resize(spanWidth, spanHeight, { fit: 'cover' })
          .toBuffer()
      }

      composites.push({
        input: imgBuffer,
        left: x,
        top: y,
      })
    }

    const collageBuffer = await canvas.composite(composites).png().toBuffer()

    // Log usage (FREE)
    await createUsage({
      userId: user.id,
      type: 'collage',
      creditsUsed: 0,
      imageSize: `${outputWidth}x${outputHeight}`,
      model: 'sharp-collage',
    })

    const base64 = collageBuffer.toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    return NextResponse.json({
      success: true,
      collage: dataUrl,  // Match component expectation
      image: dataUrl,    // Also include for API compatibility
      stats: {
        imageCount: imageBuffers.length,
        layout,
        width: outputWidth,
        height: outputHeight,
        gap,
      },
      creditsRemaining: user.credits,
    })

  } catch (error) {
    console.error('Error creating collage:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create collage' },
      { status: 500 }
    )
  }
}
