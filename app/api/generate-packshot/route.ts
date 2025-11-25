import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import sharp from 'sharp'
import { auth } from '@/lib/auth'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

interface PackshotPreset {
  name: string
  backgroundColor: string
  width: number
  height: number
  shadowIntensity: number
  shadowType: 'drop' | 'reflection' | 'none'
}

const PRESETS: Record<string, PackshotPreset> = {
  amazon: {
    name: 'Amazon Ready',
    backgroundColor: '#FFFFFF',
    width: 2000,
    height: 2000,
    shadowIntensity: 0.3,
    shadowType: 'drop',
  },
  allegro: {
    name: 'Allegro',
    backgroundColor: '#F5F5F5',
    width: 1600,
    height: 1200,
    shadowIntensity: 0.2,
    shadowType: 'drop',
  },
  instagram: {
    name: 'Instagram',
    backgroundColor: '#FFFFFF',
    width: 1080,
    height: 1080,
    shadowIntensity: 0.15,
    shadowType: 'none',
  },
  premium: {
    name: 'Premium',
    backgroundColor: 'gradient',
    width: 2048,
    height: 2048,
    shadowIntensity: 0.4,
    shadowType: 'reflection',
  },
}

async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  const base64Image = imageBuffer.toString('base64')
  const dataUrl = `data:image/png;base64,${base64Image}`

  const output = (await replicate.run(
    'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
    {
      input: {
        image: dataUrl,
      },
    }
  )) as unknown as string

  // Download the result
  const response = await fetch(output)
  const resultBuffer = Buffer.from(await response.arrayBuffer())

  return resultBuffer
}

async function createGradientBackground(width: number, height: number): Promise<Buffer> {
  // Create a gradient from light gray to white
  const svgGradient = `
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ffffff;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)" />
    </svg>
  `
  // Convert SVG to PNG buffer using Sharp
  return await sharp(Buffer.from(svgGradient))
    .png()
    .toBuffer()
}

async function addShadow(
  imageBuffer: Buffer,
  shadowType: 'drop' | 'reflection' | 'none',
  intensity: number
): Promise<Buffer> {
  if (shadowType === 'none') {
    return imageBuffer
  }

  const image = sharp(imageBuffer)
  const metadata = await image.metadata()

  if (!metadata.width || !metadata.height) {
    return imageBuffer
  }

  // Create shadow layer
  const shadowBlur = Math.round(metadata.height * 0.02)
  const shadowOffset = Math.round(metadata.height * 0.01)

  if (shadowType === 'drop') {
    // Drop shadow beneath the object
    const shadow = await sharp(imageBuffer)
      .blur(shadowBlur)
      .modulate({ brightness: 0.3 })
      .toBuffer()

    // Composite original image over shadow with offset
    return await sharp({
      create: {
        width: metadata.width,
        height: metadata.height + shadowOffset,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: shadow, top: shadowOffset, left: 0 },
        { input: imageBuffer, top: 0, left: 0 },
      ])
      .toBuffer()
  } else if (shadowType === 'reflection') {
    // Reflection shadow (mirrored and faded)
    const reflection = await sharp(imageBuffer)
      .flip()
      .modulate({ brightness: 0.5 })
      .blur(shadowBlur / 2)
      .toBuffer()

    const reflectionHeight = Math.round(metadata.height * 0.3)

    return await sharp({
      create: {
        width: metadata.width,
        height: metadata.height + reflectionHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: imageBuffer, top: 0, left: 0 },
        {
          input: await sharp(reflection).extract({ left: 0, top: 0, width: metadata.width, height: reflectionHeight }).toBuffer(),
          top: metadata.height,
          left: 0,
        },
      ])
      .toBuffer()
  }

  return imageBuffer
}

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. GET USER
    const user = getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 3. EXTRACT FORMDATA
    const formData = await request.formData()
    const file = formData.get('file') as File
    const presetName = (formData.get('preset') as string) || 'amazon'

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
    const creditsNeeded = presetName === 'premium' ? 2 : 1
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

    // 6. PROCESS IMAGE
    console.log('[Packshot] Starting processing...')

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Step 1: Remove background
    console.log('[Packshot] Removing background...')
    const noBgBuffer = await removeBackground(buffer)

    // Validate and normalize the buffer to ensure it's a valid image
    console.log('[Packshot] Validating buffer format...')
    const normalizedBuffer = await sharp(noBgBuffer)
      .png()
      .toBuffer()

    // Step 2: Add shadow
    console.log('[Packshot] Adding shadow...')
    const withShadowBuffer = await addShadow(normalizedBuffer, preset.shadowType, preset.shadowIntensity)

    // Step 3: Create background
    console.log('[Packshot] Creating background...')
    let backgroundBuffer: Buffer
    if (preset.backgroundColor === 'gradient') {
      backgroundBuffer = await createGradientBackground(preset.width, preset.height)
    } else {
      // Solid color background
      backgroundBuffer = await sharp({
        create: {
          width: preset.width,
          height: preset.height,
          channels: 3,
          background: preset.backgroundColor,
        },
      })
        .png()
        .toBuffer()
    }

    // Step 4: Get image dimensions for smart positioning
    const imageMetadata = await sharp(withShadowBuffer).metadata()
    const imageWidth = imageMetadata.width || preset.width
    const imageHeight = imageMetadata.height || preset.height

    // Calculate scaling to fit within canvas with padding
    const padding = Math.round(preset.width * 0.1) // 10% padding
    const maxWidth = preset.width - 2 * padding
    const maxHeight = preset.height - 2 * padding
    const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight, 1)

    const scaledWidth = Math.round(imageWidth * scale)
    const scaledHeight = Math.round(imageHeight * scale)

    // Center the image
    const left = Math.round((preset.width - scaledWidth) / 2)
    const top = Math.round((preset.height - scaledHeight) / 2)

    // Resize image
    const resizedImage = await sharp(withShadowBuffer)
      .resize(scaledWidth, scaledHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer()

    // Step 5: Composite everything
    console.log('[Packshot] Compositing final image...')
    const finalImage = await sharp(backgroundBuffer)
      .composite([
        {
          input: resizedImage,
          top,
          left,
        },
      ])
      .png()
      .toBuffer()

    // Convert to data URL
    const base64 = finalImage.toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    // 7. DEDUCT CREDITS & LOG USAGE
    createUsage({
      userId: user.id,
      type: presetName === 'premium' ? 'packshot_generation_premium' : 'packshot_generation',
      creditsUsed: creditsNeeded,
      imageSize: `${file.size} bytes`,
      model: 'packshot-generator-v1',
    })

    const newCredits = user.credits - creditsNeeded

    // 8. SEND LOW CREDITS WARNING
    if (newCredits > 0 && newCredits <= 10) {
      sendCreditsLowEmail({
        userEmail: user.email,
        userName: user.name || 'User',
        creditsRemaining: newCredits,
        totalUsed: user.totalUsage || 0,
      }).catch(err => console.error('Failed to send low credits email:', err))
    }

    // 9. RETURN SUCCESS
    console.log('[Packshot] Processing complete!')
    return NextResponse.json({
      success: true,
      packshot: dataUrl,
      preset: preset.name,
      dimensions: {
        width: preset.width,
        height: preset.height,
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
