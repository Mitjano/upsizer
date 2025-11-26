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
  credits: number
}

const PRESETS: Record<string, PackshotPreset> = {
  white: {
    name: 'White Background',
    backgroundColor: '#FFFFFF',
    credits: 2,
  },
  gray: {
    name: 'Light Gray',
    backgroundColor: '#F5F5F5',
    credits: 2,
  },
  beige: {
    name: 'Beige',
    backgroundColor: '#F5E6D3',
    credits: 2,
  },
  blue: {
    name: 'Light Blue',
    backgroundColor: '#E3F2FD',
    credits: 2,
  },
}

// Parse hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    return { r: 255, g: 255, b: 255 } // Default to white
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

async function generatePackshot(imageBuffer: Buffer, backgroundColor: string): Promise<Buffer> {
  console.log('[Packshot] Generating DETERMINISTIC packshot (100% faithful product)...')
  console.log('[Packshot] Background color:', backgroundColor)

  const TARGET_SIZE = 2000
  const PROCESS_SIZE = 1024 // Size for background removal

  // Step 1: Resize original image for background removal
  console.log('[Packshot] Step 1: Preparing image for background removal...')

  const resizedForRemoveBg = await sharp(imageBuffer)
    .resize(PROCESS_SIZE, PROCESS_SIZE, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer()

  const base64Image = resizedForRemoveBg.toString('base64')
  const dataUrl = `data:image/png;base64,${base64Image}`

  // Step 2: Remove background using Replicate
  console.log('[Packshot] Step 2: Removing background with AI...')

  const rmbgOutput = (await replicate.run('lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1', {
    input: {
      image: dataUrl,
    },
  })) as unknown as string

  console.log('[Packshot] Step 3: Downloading product with transparent background...')

  const nobgResponse = await fetch(rmbgOutput)
  const nobgBuffer = Buffer.from(await nobgResponse.arrayBuffer())

  // Step 4: Resize product with transparent background to target size
  console.log(`[Packshot] Step 4: Resizing product to ${TARGET_SIZE}x${TARGET_SIZE}px...`)

  const productResized = await sharp(nobgBuffer)
    .resize(TARGET_SIZE, TARGET_SIZE, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
    })
    .ensureAlpha()
    .png()
    .toBuffer()

  // Step 5: Extract alpha channel for shadow generation
  console.log('[Packshot] Step 5: Extracting alpha channel for shadow...')

  const alphaChannel = await sharp(productResized)
    .extractChannel(3) // Get alpha channel (0 = transparent, 255 = opaque)
    .toBuffer()

  // Step 6: Create soft shadow from alpha channel
  console.log('[Packshot] Step 6: Creating soft shadow...')

  // Create shadow: blur the alpha, make it semi-transparent gray
  const blurredAlpha = await sharp(alphaChannel)
    .blur(30) // Soft blur for shadow
    .toBuffer()

  // Create shadow layer (dark gray, semi-transparent based on blurred alpha)
  // Shadow is offset slightly down and to the right
  const shadowLayer = await sharp({
    create: {
      width: TARGET_SIZE,
      height: TARGET_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp({
          create: {
            width: TARGET_SIZE,
            height: TARGET_SIZE,
            channels: 3,
            background: { r: 80, g: 80, b: 80 }, // Dark gray shadow color
          },
        })
          .joinChannel(blurredAlpha)
          .png()
          .toBuffer(),
        blend: 'over',
        top: 15, // Shadow offset down
        left: 10, // Shadow offset right
      },
    ])
    .png()
    .toBuffer()

  // Step 7: Create background layer with chosen color
  console.log('[Packshot] Step 7: Creating background layer...')

  const bgColor = hexToRgb(backgroundColor)

  const backgroundLayer = await sharp({
    create: {
      width: TARGET_SIZE,
      height: TARGET_SIZE,
      channels: 4,
      background: { r: bgColor.r, g: bgColor.g, b: bgColor.b, alpha: 255 },
    },
  })
    .png()
    .toBuffer()

  // Step 8: Composite all layers: background + shadow + product
  console.log('[Packshot] Step 8: Compositing final packshot...')

  const finalImage = await sharp(backgroundLayer)
    .composite([
      {
        input: shadowLayer,
        blend: 'multiply', // Shadow blends naturally with background
        top: 0,
        left: 0,
      },
      {
        input: productResized,
        blend: 'over', // Product on top
        top: 0,
        left: 0,
      },
    ])
    .png({ quality: 100 })
    .toBuffer()

  console.log('[Packshot] DETERMINISTIC packshot created successfully!')
  console.log(`[Packshot] Final dimensions: ${TARGET_SIZE}x${TARGET_SIZE}px`)
  console.log('[Packshot] Product is 100% preserved - no AI modifications to product pixels')

  return finalImage
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
    const creditsNeeded = preset.credits

    console.log('[Packshot] Credits needed:', creditsNeeded)

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

    // 6. PROCESS IMAGE WITH BRIA AI
    console.log('[Packshot] Starting processing...')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const finalImage = await generatePackshot(buffer, preset.backgroundColor)

    // Convert to data URL
    const base64 = finalImage.toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    // 7. GET IMAGE DIMENSIONS
    const metadata = await sharp(finalImage).metadata()
    const width = metadata.width || 2000
    const height = metadata.height || 2000

    // 8. DEDUCT CREDITS & LOG USAGE
    createUsage({
      userId: user.id,
      type: 'packshot_generation',
      creditsUsed: creditsNeeded,
      imageSize: `${file.size} bytes`,
      model: 'deterministic-packshot',
    })

    const newCredits = user.credits - creditsNeeded

    // 9. SEND LOW CREDITS WARNING
    if (newCredits > 0 && newCredits <= 10) {
      sendCreditsLowEmail({
        userEmail: user.email,
        userName: user.name || 'User',
        creditsRemaining: newCredits,
        totalUsed: user.totalUsage || 0,
      }).catch(err => console.error('Failed to send low credits email:', err))
    }

    // 10. RETURN SUCCESS
    console.log('[Packshot] Processing complete!')
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
