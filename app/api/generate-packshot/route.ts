import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'
import { CREDIT_COSTS } from '@/lib/credits-config'
import { ImageProcessor } from '@/lib/image-processor'

interface PackshotPreset {
  name: string
  background: { r: number; g: number; b: number }
  addReflection: boolean
  addShadow: boolean
  credits: number
}

const PACKSHOT_CREDITS = CREDIT_COSTS.packshot.cost

// Professional packshot presets with shadow/reflection options
const PRESETS: Record<string, PackshotPreset> = {
  white: {
    name: 'White Background',
    background: { r: 255, g: 255, b: 255 },
    addReflection: false,
    addShadow: true,
    credits: PACKSHOT_CREDITS,
  },
  gray: {
    name: 'Light Gray',
    background: { r: 245, g: 245, b: 245 },
    addReflection: false,
    addShadow: true,
    credits: PACKSHOT_CREDITS,
  },
  studio: {
    name: 'Studio Setup',
    background: { r: 250, g: 250, b: 250 },
    addReflection: true,
    addShadow: true,
    credits: PACKSHOT_CREDITS,
  },
  lifestyle: {
    name: 'Lifestyle',
    background: { r: 248, g: 248, b: 248 },
    addReflection: false,
    addShadow: true,
    credits: PACKSHOT_CREDITS,
  },
}

async function generatePackshot(imageBuffer: Buffer, preset: PackshotPreset): Promise<Buffer> {
  // Convert image to base64 data URL for background removal
  const base64Image = imageBuffer.toString('base64')
  const dataUrl = `data:image/png;base64,${base64Image}`

  // Step 1: Remove background using BiRefNet
  console.log('Step 1: Removing background...')
  const transparentUrl = await ImageProcessor.removeBackground(dataUrl)

  // Download the transparent image
  const transparentResponse = await fetch(transparentUrl)
  if (!transparentResponse.ok) {
    throw new Error('Failed to download transparent image')
  }
  const transparentBuffer = Buffer.from(await transparentResponse.arrayBuffer())

  // Get image metadata
  const metadata = await sharp(transparentBuffer).metadata()
  const productWidth = metadata.width || 1000
  const productHeight = metadata.height || 1000

  // Calculate canvas size (2000x2000) and positioning
  const canvasSize = 2000
  const padding = 200 // Padding around product

  // Scale product to fit with padding
  const maxProductSize = canvasSize - (padding * 2)
  const scale = Math.min(maxProductSize / productWidth, maxProductSize / productHeight * 0.7) // 0.7 to leave room for shadow/reflection
  const scaledWidth = Math.round(productWidth * scale)
  const scaledHeight = Math.round(productHeight * scale)

  // Position product (centered horizontally, slightly above center vertically)
  const productX = Math.round((canvasSize - scaledWidth) / 2)
  const productY = Math.round((canvasSize - scaledHeight) / 2) - 100 // Move up to leave room for shadow

  // Resize product
  const resizedProduct = await sharp(transparentBuffer)
    .resize(scaledWidth, scaledHeight, { fit: 'contain' })
    .png()
    .toBuffer()

  // Create layers for compositing
  const composites: sharp.OverlayOptions[] = []

  // Step 2: Add reflection if enabled (before product)
  if (preset.addReflection) {
    console.log('Step 2: Adding reflection...')
    // Create flipped, faded reflection
    const reflection = await sharp(resizedProduct)
      .flip() // Flip vertically
      .linear(0.3, 0) // Reduce brightness to 30%
      .png()
      .toBuffer()

    // Add gradient fade to reflection using a mask
    const gradientMask = Buffer.from(
      `<svg width="${scaledWidth}" height="${scaledHeight}">
        <defs>
          <linearGradient id="fade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:white;stop-opacity:0.4"/>
            <stop offset="50%" style="stop-color:white;stop-opacity:0.1"/>
            <stop offset="100%" style="stop-color:white;stop-opacity:0"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#fade)"/>
      </svg>`
    )

    const fadedReflection = await sharp(reflection)
      .composite([{ input: gradientMask, blend: 'dest-in' }])
      .png()
      .toBuffer()

    // Position reflection below product
    composites.push({
      input: fadedReflection,
      left: productX,
      top: productY + scaledHeight + 5, // Small gap
    })
  }

  // Step 3: Add shadow if enabled
  if (preset.addShadow) {
    console.log('Step 3: Adding shadow...')
    // Create shadow ellipse
    const shadowWidth = Math.round(scaledWidth * 0.8)
    const shadowHeight = Math.round(scaledHeight * 0.1)
    const shadowX = productX + Math.round((scaledWidth - shadowWidth) / 2)
    const shadowY = productY + scaledHeight - 20

    const shadowSvg = Buffer.from(
      `<svg width="${shadowWidth}" height="${shadowHeight}">
        <defs>
          <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:black;stop-opacity:0.25"/>
            <stop offset="70%" style="stop-color:black;stop-opacity:0.1"/>
            <stop offset="100%" style="stop-color:black;stop-opacity:0"/>
          </radialGradient>
        </defs>
        <ellipse cx="${shadowWidth/2}" cy="${shadowHeight/2}" rx="${shadowWidth/2}" ry="${shadowHeight/2}" fill="url(#shadow)"/>
      </svg>`
    )

    composites.push({
      input: shadowSvg,
      left: shadowX,
      top: shadowY,
    })
  }

  // Step 4: Add the product on top
  composites.push({
    input: resizedProduct,
    left: productX,
    top: productY,
  })

  // Create final canvas with background color and all layers
  console.log('Step 4: Compositing final image...')
  const finalImage = await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 3,
      background: preset.background,
    }
  })
    .composite(composites)
    .png({ quality: 100 })
    .toBuffer()

  return finalImage
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const { allowed, resetAt } = imageProcessingLimiter.check(identifier)
    if (!allowed) {
      return rateLimitResponse(resetAt)
    }

    // 1. AUTHENTICATION - via session or API key
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

    // 3. EXTRACT FORMDATA
    const formData = await request.formData()
    const file = formData.get('file') as File
    const presetName = (formData.get('preset') as string) || 'white'

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

    const MAX_SIZE = 30 * 1024 * 1024 // 30MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 30MB' },
        { status: 400 }
      )
    }

    // Get preset
    const preset = PRESETS[presetName]
    if (!preset) {
      return NextResponse.json(
        { error: 'Invalid preset' },
        { status: 400 }
      )
    }

    // 5. CHECK CREDITS
    const creditsNeeded = preset.credits


    // Check if user has enough credits
    if (user.credits < creditsNeeded) {
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
          required: creditsNeeded,
          available: user.credits,
        },
        { status: 402 }
      )
    }

    // 6. PROCESS IMAGE - Generate professional packshot with AI
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const finalImage = await generatePackshot(buffer, preset)

    // Convert to data URL
    const base64 = finalImage.toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    // 7. GET IMAGE DIMENSIONS
    const metadata = await sharp(finalImage).metadata()
    const width = metadata.width || 2000
    const height = metadata.height || 2000

    // 8. DEDUCT CREDITS & LOG USAGE
    await createUsage({
      userId: user.id,
      type: 'packshot_generation',
      creditsUsed: creditsNeeded,
      imageSize: `${file.size} bytes`,
      model: 'birefnet-sharp',
    })

    const newCredits = user.credits - creditsNeeded

    // 9. SEND LOW CREDITS WARNING
    if (newCredits > 0 && newCredits <= 10) {
      sendCreditsLowEmail({
        userEmail: user.email,
        userName: user.name || 'User',
        creditsRemaining: newCredits,
      }).catch(err => console.error('Failed to send low credits email:', err))
    }

    // 10. RETURN SUCCESS
    return NextResponse.json({
      success: true,
      packshot: dataUrl,
      preset: preset.name,
      dimensions: {
        width,
        height,
      },
      creditsRemaining: newCredits,
    })
  } catch (error: any) {
    console.error('[Packshot] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate packshot',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
