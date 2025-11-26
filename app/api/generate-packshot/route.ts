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
  console.log('[Packshot] Generating professional packshot with OpenAI gpt-image-1...')
  console.log('[Packshot] Background color:', backgroundColor)

  // Step 1: Resize original image to 1024x1024 for remove-bg
  console.log('[Packshot] Step 1: Preparing image for background removal...')

  const resizedForRemoveBg = await sharp(imageBuffer)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer()

  const base64Image = resizedForRemoveBg.toString('base64')
  const dataUrl = `data:image/png;base64,${base64Image}`

  console.log('[Packshot] Step 2: Removing background to create mask...')

  // Use background removal model
  const rmbgOutput = (await replicate.run('lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1', {
    input: {
      image: dataUrl,
    },
  })) as unknown as string

  console.log('[Packshot] Step 3: Downloading removed background image...')

  const nobgResponse = await fetch(rmbgOutput)
  const nobgBuffer = Buffer.from(await nobgResponse.arrayBuffer())

  console.log('[Packshot] Step 4: Building WHITE binary mask from alpha channel...')

  // Resize nobgBuffer to exactly 1024x1024 first
  const nobgResized = await sharp(nobgBuffer)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .toBuffer()

  // Extract alpha channel and make it binary (0 or 255)
  const alphaChannel = await sharp(nobgResized)
    .extractChannel(3)  // Get alpha channel
    .threshold(1)       // Binary: product = 255, background = 0
    .toBuffer()

  // Build proper WHITE mask with alpha from the extracted channel
  // Product = white with alpha 255 (PRESERVE)
  // Background = transparent with alpha 0 (EDIT)
  const maskPng = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 }, // Start fully transparent (editable)
    },
  })
    .composite([
      {
        // Overlay white where product is (alpha > 0)
        input: await sharp({
          create: {
            width: 1024,
            height: 1024,
            channels: 3,
            background: { r: 255, g: 255, b: 255 },
          },
        })
          .joinChannel(alphaChannel) // Add alpha channel: 255 where product, 0 where bg
          .png()
          .toBuffer(),
        blend: 'over',
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer()

  console.log('[Packshot] Step 5: Preparing original image with white background...')

  // IMAGE: Original photo resized with WHITE OPAQUE background
  const imagePng = await sharp(imageBuffer)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .ensureAlpha()
    .toColorspace('srgb')
    .png({ compressionLevel: 9, force: true })
    .toBuffer()

  // Map background color to description
  const backgroundDescriptions: Record<string, string> = {
    '#FFFFFF': 'pure white',
    '#F5F5F5': 'light gray',
    '#F5E6D3': 'warm beige',
    '#E3F2FD': 'light blue',
  }

  const bgDescription = backgroundDescriptions[backgroundColor] || 'white'

  console.log('[Packshot] Step 6: Calling OpenAI gpt-image-1 Edit API...')

  // Use raw fetch for gpt-image-1 (not available in openai SDK yet for edits)
  const formData = new FormData()
  formData.append('model', 'gpt-image-1')
  formData.append('size', '1024x1024')
  formData.append('n', '1')
  formData.append('prompt', `
Professional ecommerce packshot of the SAME product.
Keep the product EXACTLY as it is: same shape, text, connectors, colors, labels, logos.
Edit ONLY the background pixels.
The background must be a perfectly flat ${bgDescription} (${backgroundColor}) studio backdrop
with only a tiny, soft, neutral gray shadow under the product.
STRICT: No additional objects, no stands, no boxes, no props, no decorations, no text overlays.
Only the product on a ${bgDescription} background. If you add anything else, the result is invalid.
`.trim())

  formData.append('image', new Blob([new Uint8Array(imagePng)], { type: 'image/png' }), 'image.png')
  formData.append('mask', new Blob([new Uint8Array(maskPng)], { type: 'image/png' }), 'mask.png')

  const openaiResponse = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  })

  if (!openaiResponse.ok) {
    const errorText = await openaiResponse.text()
    console.error('[Packshot] OpenAI API error:', errorText)
    throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`)
  }

  const result = await openaiResponse.json() as { data: Array<{ b64_json?: string; url?: string }> }

  // gpt-image-1 returns base64 by default
  let generatedBuffer: Buffer
  if (result.data?.[0]?.b64_json) {
    generatedBuffer = Buffer.from(result.data[0].b64_json, 'base64')
  } else if (result.data?.[0]?.url) {
    const imgResponse = await fetch(result.data[0].url)
    generatedBuffer = Buffer.from(await imgResponse.arrayBuffer())
  } else {
    throw new Error('Failed to get image from OpenAI response')
  }

  console.log('[Packshot] Step 7: Downloading generated packshot...')

  // Upscale to 2000x2000
  const TARGET_SIZE = 2000
  console.log(`[Packshot] Step 8: Upscaling to ${TARGET_SIZE}x${TARGET_SIZE}px...`)

  const finalImage = await sharp(generatedBuffer)
    .resize(TARGET_SIZE, TARGET_SIZE, {
      fit: 'contain',
      background: backgroundColor,
    })
    .png({ quality: 100 })
    .toBuffer()

  console.log('[Packshot] Professional packshot created successfully with gpt-image-1')
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
      model: 'openai-gpt-image-1',
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
