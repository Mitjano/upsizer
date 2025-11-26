import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import OpenAI from 'openai'
import sharp from 'sharp'
import { auth } from '@/lib/auth'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
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
  console.log('[Packshot] Generating professional packshot with OpenAI DALL-E 2 Edit...')
  console.log('[Packshot] Background color:', backgroundColor)

  // Step 1: Remove background to get mask
  const base64Image = imageBuffer.toString('base64')
  const dataUrl = `data:image/png;base64,${base64Image}`

  console.log('[Packshot] Step 1: Removing background to create mask...')

  // Use background removal model to create mask
  const rmbgOutput = (await replicate.run('lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1', {
    input: {
      image: dataUrl,
    },
  })) as unknown as string

  console.log('[Packshot] Step 2: Downloading removed background image...')

  const nobgResponse = await fetch(rmbgOutput)
  const nobgBuffer = Buffer.from(await nobgResponse.arrayBuffer())

  console.log('[Packshot] Step 3: Creating transparency mask for DALL-E 2...')

  // Create mask: transparent areas (background) = white, opaque areas (product) = black
  const maskImage = await sharp(nobgBuffer)
    .ensureAlpha()
    .extractChannel(3) // Extract alpha channel
    .negate() // Invert: transparent becomes white (area to edit)
    .toBuffer()

  // Convert to PNG with alpha
  const mask = await sharp(maskImage)
    .toFormat('png')
    .toBuffer()

  console.log('[Packshot] Step 4: Preparing images for DALL-E 2 Edit...')

  // Resize original image to 1024x1024 (DALL-E 2 requirement)
  // DALL-E 2 Edit requires RGBA format
  const resizedOriginal = await sharp(imageBuffer)
    .ensureAlpha() // Ensure alpha channel exists
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer()

  // Resize mask to 1024x1024
  const resizedMask = await sharp(mask)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer()

  // Map background color to description
  const backgroundDescriptions: Record<string, string> = {
    '#FFFFFF': 'pure white',
    '#F5F5F5': 'light gray',
    '#F5E6D3': 'warm beige',
    '#E3F2FD': 'light blue',
  }

  const bgDescription = backgroundDescriptions[backgroundColor] || 'white'

  console.log('[Packshot] Step 5: Calling OpenAI DALL-E 2 Edit...')

  // Create Blob objects for OpenAI API (File extends Blob)
  // Convert Buffer to Uint8Array for Blob compatibility
  const imageBlob = new Blob([new Uint8Array(resizedOriginal)], { type: 'image/png' }) as any
  const maskBlob = new Blob([new Uint8Array(resizedMask)], { type: 'image/png' }) as any

  // Add filename property for OpenAI API
  Object.defineProperty(imageBlob, 'name', { value: 'product.png' })
  Object.defineProperty(maskBlob, 'name', { value: 'mask.png' })

  // Call DALL-E 2 Edit
  const response = await openai.images.edit({
    image: imageBlob,
    mask: maskBlob,
    prompt: `Professional product packshot photography on ${bgDescription} background, studio lighting, centered composition, clean presentation with natural shadows, high-end e-commerce style, Amazon listing quality, commercial photography`,
    n: 1,
    size: '1024x1024',
  })

  const generatedImageUrl = response.data?.[0]?.url
  if (!generatedImageUrl) {
    throw new Error('Failed to generate packshot with OpenAI DALL-E 2')
  }

  console.log('[Packshot] Step 6: Downloading generated packshot...')

  // Download generated image
  const generatedResponse = await fetch(generatedImageUrl)
  const generatedBuffer = Buffer.from(await generatedResponse.arrayBuffer())

  // Upscale to 2000x2000
  const TARGET_SIZE = 2000
  console.log(`[Packshot] Step 7: Upscaling to ${TARGET_SIZE}x${TARGET_SIZE}px...`)

  const finalImage = await sharp(generatedBuffer)
    .resize(TARGET_SIZE, TARGET_SIZE, {
      fit: 'contain',
      background: backgroundColor,
    })
    .png({ quality: 100 })
    .toBuffer()

  console.log('[Packshot] Professional packshot created successfully with OpenAI DALL-E 2')
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
      model: 'openai-dalle-2-edit',
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
