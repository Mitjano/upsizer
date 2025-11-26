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

async function generatePackshot(imageBuffer: Buffer, backgroundColor: string): Promise<Buffer> {
  const base64Image = imageBuffer.toString('base64')
  const dataUrl = `data:image/png;base64,${base64Image}`

  console.log('[Packshot] Generating professional packshot with FLUX Canny Pro...')
  console.log('[Packshot] Background color:', backgroundColor)

  // Map background color hex to descriptive prompt
  const backgroundDescriptions: Record<string, string> = {
    '#FFFFFF': 'pure white background, clean and minimalist',
    '#F5F5F5': 'light gray background, soft and elegant',
    '#F5E6D3': 'warm beige background, natural and organic',
    '#E3F2FD': 'light blue background, fresh and modern',
  }

  const bgDescription = backgroundDescriptions[backgroundColor] || 'white background'

  // Generate professional packshot using FLUX Canny Pro with edge-guided control
  const output = (await replicate.run(
    'black-forest-labs/flux-canny-pro',
    {
      input: {
        control_image: dataUrl,
        prompt: `Professional product packshot photography, studio lighting, commercial quality, ${bgDescription}, centered composition, clean product presentation, realistic shadows, high-end e-commerce style, product photography, Amazon listing quality`,
        guidance: 30, // High guidance = strict adherence to product edges
        num_inference_steps: 50,
        output_format: 'png',
        output_quality: 100,
        aspect_ratio: '1:1',
      },
    }
  )) as unknown as string

  console.log('[Packshot] FLUX Canny Pro generation complete, downloading image...')

  // Download the generated packshot
  const response = await fetch(output)
  const packshotBuffer = Buffer.from(await response.arrayBuffer())

  // Get dimensions and optionally resize to 2000x2000 if needed
  const packshotImage = sharp(packshotBuffer)
  const metadata = await packshotImage.metadata()

  console.log(`[Packshot] Generated dimensions: ${metadata.width}x${metadata.height}px`)

  // If image is not 2000x2000, resize it
  const TARGET_SIZE = 2000
  let finalImage: Buffer

  if (metadata.width !== TARGET_SIZE || metadata.height !== TARGET_SIZE) {
    console.log(`[Packshot] Resizing to ${TARGET_SIZE}x${TARGET_SIZE}px...`)
    finalImage = await packshotImage
      .resize(TARGET_SIZE, TARGET_SIZE, {
        fit: 'contain',
        background: backgroundColor,
      })
      .png({ quality: 100 })
      .toBuffer()
  } else {
    finalImage = packshotBuffer
  }

  console.log('[Packshot] Professional packshot created with FLUX Canny Pro')
  console.log(`[Packshot] Final dimensions: ${TARGET_SIZE}x${TARGET_SIZE}px`)

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
      model: 'flux-canny-pro',
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
