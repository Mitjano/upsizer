import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, createUsage } from '@/lib/db'
import QRCode from 'qrcode'
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

    // Parse JSON body
    const body = await request.json()
    const {
      content,
      size = 400,
      errorCorrectionLevel = 'M',
      margin = 4,
      darkColor = '#000000',
      lightColor = '#FFFFFF',
      logo,
    } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Validate content length
    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Content too long. Maximum 2000 characters.' },
        { status: 400 }
      )
    }

    // Validate size
    const MIN_SIZE = 100
    const MAX_SIZE = 2000
    const validSize = Math.min(Math.max(size, MIN_SIZE), MAX_SIZE)

    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(content, {
      width: validSize,
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: errorCorrectionLevel as 'L' | 'M' | 'Q' | 'H',
    })

    let finalBuffer = qrBuffer

    // Add logo overlay if provided (base64 data URL)
    if (logo && typeof logo === 'string' && logo.startsWith('data:')) {
      try {
        // Extract base64 data from data URL
        const base64Data = logo.split(',')[1]
        const logoBuffer = Buffer.from(base64Data, 'base64')

        // Logo should be about 20% of QR code size
        const logoSize = Math.round(validSize * 0.2)

        // Resize logo
        const resizedLogo = await sharp(logoBuffer)
          .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .toBuffer()

        // Create white background for logo
        const logoBackground = await sharp({
          create: {
            width: logoSize + 10,
            height: logoSize + 10,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          },
        })
          .png()
          .toBuffer()

        // Composite logo onto background
        const logoWithBg = await sharp(logoBackground)
          .composite([
            {
              input: resizedLogo,
              left: 5,
              top: 5,
            },
          ])
          .toBuffer()

        // Composite logo onto QR code center
        const logoX = Math.round((validSize - logoSize - 10) / 2)
        const logoY = Math.round((validSize - logoSize - 10) / 2)

        finalBuffer = await sharp(qrBuffer)
          .composite([
            {
              input: logoWithBg,
              left: logoX,
              top: logoY,
            },
          ])
          .toBuffer()
      } catch (logoError) {
        console.error('Error processing logo:', logoError)
        // Continue without logo if there's an error
      }
    }

    // Log usage (FREE tool - 0 credits)
    await createUsage({
      userId: user.id,
      type: 'qr_generator',
      creditsUsed: 0,
      imageSize: \`\${validSize}x\${validSize}\`,
      model: 'qrcode-sharp',
    })

    // Convert to base64
    const base64 = finalBuffer.toString('base64')
    const dataUrl = \`data:image/png;base64,\${base64}\`

    return NextResponse.json({
      success: true,
      qrCode: dataUrl,  // Match component expectation
      image: dataUrl,   // Also include for API compatibility
      stats: {
        size: validSize,
        contentLength: content.length,
        hasLogo: !!logo,
        errorCorrectionLevel,
      },
      creditsRemaining: user.credits, // No deduction for FREE tool
    })

  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}
