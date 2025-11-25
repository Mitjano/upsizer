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
    credits: 1,
  },
  gray: {
    name: 'Light Gray',
    backgroundColor: '#F5F5F5',
    credits: 1,
  },
  beige: {
    name: 'Beige',
    backgroundColor: '#F5E6D3',
    credits: 1,
  },
  blue: {
    name: 'Light Blue',
    backgroundColor: '#E3F2FD',
    credits: 1,
  },
}

async function generatePackshot(imageBuffer: Buffer, backgroundColor: string): Promise<Buffer> {
  const base64Image = imageBuffer.toString('base64')
  const dataUrl = `data:image/png;base64,${base64Image}`

  console.log('[Packshot] Step 1: Removing background with Bria RMBG 2.0...')

  // Step 1: Remove background using state-of-the-art Bria RMBG 2.0
  const output = (await replicate.run(
    'bria/remove-background',
    {
      input: {
        image: dataUrl,
      },
    }
  )) as unknown as string

  console.log('[Packshot] Step 2: Downloading transparent image...')

  // Download the transparent PNG
  const response = await fetch(output)
  const transparentBuffer = Buffer.from(await response.arrayBuffer())

  console.log('[Packshot] Step 3: Composing professional packshot...')

  // Step 2: Compose professional packshot with custom background
  const TARGET_SIZE = 2000
  const PADDING_PERCENT = 0.025 // 2.5% padding (50px) for maximum product visibility

  // Load the transparent image
  const transparentImage = sharp(transparentBuffer)
  const metadata = await transparentImage.metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error('Failed to get image dimensions')
  }

  // Calculate scaling to fit within padded area - maximize product size
  const maxProductSize = TARGET_SIZE * (1 - 2 * PADDING_PERCENT)
  const scale = Math.min(
    maxProductSize / metadata.width,
    maxProductSize / metadata.height
  )

  const scaledWidth = Math.round(metadata.width * scale)
  const scaledHeight = Math.round(metadata.height * scale)

  // Resize the product
  const resizedProduct = await transparentImage
    .resize(scaledWidth, scaledHeight, {
      fit: 'inside',
      withoutEnlargement: false,
    })
    .toBuffer()

  // Create background canvas
  const canvas = sharp({
    create: {
      width: TARGET_SIZE,
      height: TARGET_SIZE,
      channels: 4,
      background: backgroundColor,
    },
  })

  // Calculate centering offset
  const offsetX = Math.round((TARGET_SIZE - scaledWidth) / 2)
  const offsetY = Math.round((TARGET_SIZE - scaledHeight) / 2)

  // Composite product onto background
  const finalImage = await canvas
    .composite([
      {
        input: resizedProduct,
        top: offsetY,
        left: offsetX,
      },
    ])
    .png({ quality: 100 })
    .toBuffer()

  console.log('[Packshot] Professional packshot created successfully')
  console.log(`[Packshot] Final dimensions: ${TARGET_SIZE}x${TARGET_SIZE}px`)
  console.log(`[Packshot] Product scaled to: ${scaledWidth}x${scaledHeight}px`)

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
      model: 'bria-rmbg-2.0',
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
