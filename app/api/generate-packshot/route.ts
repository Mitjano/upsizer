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

async function upscaleImage(imageBuffer: Buffer, scale: number): Promise<Buffer> {
  const base64Image = imageBuffer.toString('base64')
  const dataUrl = `data:image/png;base64,${base64Image}`

  console.log('[Packshot] AI Upscaling image', scale, 'x...')

  const output = (await replicate.run(
    'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
    {
      input: {
        image: dataUrl,
        scale: scale,
        face_enhance: false,
      },
    }
  )) as unknown as string

  const response = await fetch(output)
  const resultBuffer = Buffer.from(await response.arrayBuffer())

  console.log('[Packshot] Upscaling complete')
  return resultBuffer
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
  // Create a simple light gray background instead of gradient
  // (Sharp has issues with SVG gradients, so using solid color)
  return await sharp({
    create: {
      width: width,
      height: height,
      channels: 3,
      background: { r: 245, g: 245, b: 245 }, // Light gray #F5F5F5
    },
  })
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
      .png()
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
      .png()
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

    // 5. CHECK IMAGE SIZE & CALCULATE CREDITS
    console.log('[Packshot] Analyzing image...')
    const arrayBuffer = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)

    const originalMetadata = await sharp(buffer).metadata()
    const originalWidth = originalMetadata.width || 0
    const originalHeight = originalMetadata.height || 0
    const minDimension = Math.min(originalWidth, originalHeight)

    console.log('[Packshot] Original image size:', originalWidth, 'x', originalHeight)

    // Calculate credits needed based on preset and image size
    let baseCredits = presetName === 'premium' ? 2 : 1
    let upscaleCredits = 0

    // Determine if upscaling is needed
    if (minDimension < 800) {
      upscaleCredits = 2 // 4x upscale
    } else if (minDimension < 1400 && presetName === 'premium') {
      upscaleCredits = 1 // 2x upscale for premium
    }

    const creditsNeeded = baseCredits + upscaleCredits

    console.log('[Packshot] Credits needed:', creditsNeeded, '(base:', baseCredits, '+ upscale:', upscaleCredits, ')')

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
          details: upscaleCredits > 0 ? `Includes ${upscaleCredits} credits for AI upscaling` : undefined,
        },
        { status: 402 }
      )
    }

    // 6. PROCESS IMAGE
    console.log('[Packshot] Starting processing...')

    // Apply upscaling if needed
    if (upscaleCredits === 2) {
      console.log('[Packshot] Image too small, applying 4x AI upscaling...')
      buffer = Buffer.from(await upscaleImage(buffer, 4))
      const upscaledMetadata = await sharp(buffer).metadata()
      console.log('[Packshot] After upscale:', upscaledMetadata.width, 'x', upscaledMetadata.height)
    } else if (upscaleCredits === 1) {
      console.log('[Packshot] Premium preset: applying 2x AI upscaling...')
      buffer = Buffer.from(await upscaleImage(buffer, 2))
      const upscaledMetadata = await sharp(buffer).metadata()
      console.log('[Packshot] After upscale:', upscaledMetadata.width, 'x', upscaledMetadata.height)
    }

    // Step 1: Remove background
    console.log('[Packshot] Removing background...')
    const noBgBuffer = await removeBackground(buffer)

    // Validate and normalize the buffer to ensure it's a valid image
    console.log('[Packshot] Validating buffer format...')
    const normalizedBuffer = await sharp(noBgBuffer)
      .png()
      .toBuffer()

    // Step 2: Add shadow
    console.log('[Packshot] Adding shadow...', preset.shadowType)
    const withShadowBuffer = await addShadow(normalizedBuffer, preset.shadowType, preset.shadowIntensity)
    console.log('[Packshot] Shadow added, buffer size:', withShadowBuffer.length)

    // Step 3: Create background
    console.log('[Packshot] Creating background...', preset.backgroundColor)
    let backgroundBuffer: Buffer
    if (preset.backgroundColor === 'gradient') {
      console.log('[Packshot] Creating gradient background')
      backgroundBuffer = await createGradientBackground(preset.width, preset.height)
    } else {
      // Solid color background - convert hex to RGB
      console.log('[Packshot] Creating solid color background:', preset.backgroundColor)
      const hex = preset.backgroundColor.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)

      backgroundBuffer = await sharp({
        create: {
          width: preset.width,
          height: preset.height,
          channels: 3,
          background: { r, g, b },
        },
      })
        .png()
        .toBuffer()
    }
    console.log('[Packshot] Background created successfully')

    // Step 4: Get image dimensions for smart positioning
    console.log('[Packshot] Getting image metadata...')
    const imageMetadata = await sharp(withShadowBuffer).metadata()
    console.log('[Packshot] Image metadata:', imageMetadata.width, 'x', imageMetadata.height)
    const imageWidth = imageMetadata.width || preset.width
    const imageHeight = imageMetadata.height || preset.height

    // Calculate scaling to fit within canvas with padding
    const padding = Math.round(preset.width * 0.1) // 10% padding
    const maxWidth = preset.width - 2 * padding
    const maxHeight = preset.height - 2 * padding

    // Calculate scale - never upscale (max 1.0), only downscale if needed
    let scale = 1
    if (imageWidth > maxWidth || imageHeight > maxHeight) {
      scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight)
    }

    const scaledWidth = Math.round(imageWidth * scale)
    const scaledHeight = Math.round(imageHeight * scale)

    // Center the image
    const left = Math.round((preset.width - scaledWidth) / 2)
    const top = Math.round((preset.height - scaledHeight) / 2)

    console.log('[Packshot] Scaling:', scale, 'Final size:', scaledWidth, 'x', scaledHeight)

    // Resize image only if needed, using high-quality interpolation
    let resizedImage: Buffer
    if (scale < 1) {
      resizedImage = await sharp(withShadowBuffer)
        .resize(scaledWidth, scaledHeight, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
          kernel: 'lanczos3', // High-quality downscaling
        })
        .toBuffer()
    } else {
      // No resize needed, use original
      resizedImage = withShadowBuffer
    }

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
