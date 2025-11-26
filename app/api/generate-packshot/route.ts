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
  console.log('[Packshot] Generating professional packshot with OpenAI DALL-E 3...')
  console.log('[Packshot] Background color:', backgroundColor)

  // Map background color to description
  const backgroundDescriptions: Record<string, string> = {
    '#FFFFFF': 'pure white',
    '#F5F5F5': 'light gray',
    '#F5E6D3': 'warm beige',
    '#E3F2FD': 'light blue',
  }

  const bgDescription = backgroundDescriptions[backgroundColor] || 'white'

  console.log('[Packshot] Step 1: Converting image to base64...')
  const base64Image = imageBuffer.toString('base64')
  const mimeType = 'image/png'
  const dataUrl = `data:${mimeType};base64,${base64Image}`

  console.log('[Packshot] Step 2: Analyzing product with GPT-4 Vision...')

  // Use GPT-4 Vision to analyze the product
  const visionResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Describe this product in detail for creating a professional packshot. Focus on the product type, key features, and important details that should be preserved. Be concise but specific.',
          },
          {
            type: 'image_url',
            image_url: {
              url: dataUrl,
            },
          },
        ],
      },
    ],
    max_tokens: 300,
  })

  const productDescription = visionResponse.choices[0]?.message?.content || 'product'
  console.log('[Packshot] Product identified:', productDescription)

  console.log('[Packshot] Step 3: Generating professional packshot with DALL-E 3...')

  // Generate packshot with DALL-E 3
  const prompt = `Professional product photography of ${productDescription} on a clean ${bgDescription} background. Studio lighting with soft shadows, centered composition, high-end e-commerce style, sharp focus, commercial quality, perfect for Amazon or online marketplace listing. The product should be the main focus with clean, minimal background.`

  const dalleResponse = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    quality: 'hd',
  })

  const generatedImageUrl = dalleResponse.data?.[0]?.url
  if (!generatedImageUrl) {
    throw new Error('Failed to generate packshot with OpenAI DALL-E 3')
  }

  console.log('[Packshot] Step 4: Downloading generated packshot...')

  // Download generated image
  const generatedResponse = await fetch(generatedImageUrl)
  const generatedBuffer = Buffer.from(await generatedResponse.arrayBuffer())

  // Upscale to 2000x2000
  const TARGET_SIZE = 2000
  console.log(`[Packshot] Step 5: Upscaling to ${TARGET_SIZE}x${TARGET_SIZE}px...`)

  const finalImage = await sharp(generatedBuffer)
    .resize(TARGET_SIZE, TARGET_SIZE, {
      fit: 'contain',
      background: backgroundColor,
    })
    .png({ quality: 100 })
    .toBuffer()

  console.log('[Packshot] Professional packshot created successfully with OpenAI DALL-E 3')
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
      model: 'openai-dalle-3-hd',
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
