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

// Enhance user's simple prompt into a detailed image generation prompt
async function enhancePrompt(userPrompt: string): Promise<string> {
  console.log('[Expand] Enhancing prompt:', userPrompt)

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at writing image generation prompts for AI outpainting (extending an existing image).

CRITICAL RULES:
- If the user mentions specific objects/subjects (like "cat and dog"), you MUST keep them as the PRIMARY focus
- Start the prompt with the main subjects the user wants to see
- Add visual details but NEVER remove or de-emphasize what the user asked for
- Keep it concise (1-2 sentences max)
- Write in English even if input is in another language
- Focus on what should appear in the EXPANDED areas

Example:
Input: "cat and dog sitting on carpet"
Output: "A fluffy cat and a golden retriever dog sitting together on the carpet, cozy home interior, soft natural lighting, photorealistic, high detail"

Input: "forest background"
Output: "Dense green forest with tall trees, dappled sunlight, misty atmosphere, photorealistic"`
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    })

    const enhancedPrompt = response.choices[0]?.message?.content?.trim()

    if (enhancedPrompt) {
      console.log('[Expand] Enhanced prompt:', enhancedPrompt)
      return enhancedPrompt
    }

    return userPrompt
  } catch (error) {
    console.error('[Expand] Prompt enhancement failed, using original:', error)
    return userPrompt
  }
}

// Expand mode presets matching FLUX.1 Fill [pro] outpaint parameter
type ExpandMode =
  | 'zoom_1.5x'
  | 'zoom_2x'
  | 'make_square'
  | 'expand_left'
  | 'expand_right'
  | 'expand_up'
  | 'expand_down'
  | 'expand_horizontal' // Custom: Left + Right with mask

// Single direction modes map directly to FLUX API outpaint values
const EXPAND_MODE_MAP: Record<string, string> = {
  'zoom_1.5x': 'Zoom out 1.5x',
  'zoom_2x': 'Zoom out 2x',
  'make_square': 'Make square',
  'expand_left': 'Left outpaint',
  'expand_right': 'Right outpaint',
  'expand_up': 'Top outpaint',
  'expand_down': 'Bottom outpaint',
}

const CREDITS_PER_EXPAND = 2

// Helper to extract URL from Replicate output
function extractResultUrl(output: unknown): string {
  if (typeof output === 'string') {
    return output
  } else if (output && typeof output === 'object') {
    const stringified = String(output)
    if (stringified.startsWith('http')) {
      return stringified
    }
    const outputObj = output as Record<string, unknown>
    if (typeof outputObj.toString === 'function') {
      const toStringResult = outputObj.toString()
      if (typeof toStringResult === 'string' && toStringResult.startsWith('http')) {
        return toStringResult
      }
    }
    if (Array.isArray(output) && output.length > 0) {
      const first = output[0]
      if (typeof first === 'string') {
        return first
      }
      const firstStr = String(first)
      if (firstStr.startsWith('http')) {
        return firstStr
      }
    }
    throw new Error(`Cannot extract URL from output: ${stringified}`)
  }
  throw new Error(`Unexpected output type: ${typeof output}`)
}

// Expand horizontally using custom mask (left + right at once)
async function expandHorizontal(
  imageBuffer: Buffer,
  prompt: string,
  seed: number
): Promise<{ buffer: Buffer; seed: number }> {
  console.log('[Expand] Starting horizontal expansion with custom mask...')

  // First, ensure image is in a format we can work with
  const processedImage = await sharp(imageBuffer)
    .flatten({ background: { r: 255, g: 255, b: 255 } }) // Flatten alpha to white
    .jpeg({ quality: 95 })
    .toBuffer()

  const metadata = await sharp(processedImage).metadata()
  const origWidth = metadata.width || 0
  const origHeight = metadata.height || 0

  // Calculate new dimensions - add 50% on each side (total 2x width)
  const expandAmount = Math.round(origWidth * 0.5)
  const newWidth = origWidth + expandAmount * 2

  console.log('[Expand] Original:', origWidth, 'x', origHeight)
  console.log('[Expand] New width:', newWidth, '(+', expandAmount, 'each side)')

  // Create expanded canvas with original image centered
  // Use white background to match typical image backgrounds
  const expandedImage = await sharp({
    create: {
      width: newWidth,
      height: origHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      {
        input: processedImage,
        left: expandAmount,
        top: 0,
      },
    ])
    .jpeg({ quality: 95 })
    .toBuffer()

  // Create mask: white (255) = inpaint, black (0) = preserve
  // White on sides, black in center where original image is
  const maskBuffer = await sharp({
    create: {
      width: newWidth,
      height: origHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }, // Start all white
    },
  })
    .composite([
      {
        // Black rectangle where original image is (preserve)
        input: await sharp({
          create: {
            width: origWidth,
            height: origHeight,
            channels: 3,
            background: { r: 0, g: 0, b: 0 },
          },
        })
          .png()
          .toBuffer(),
        left: expandAmount,
        top: 0,
      },
    ])
    .png()
    .toBuffer()

  // Convert to data URLs
  const imageDataUrl = `data:image/jpeg;base64,${expandedImage.toString('base64')}`
  const maskDataUrl = `data:image/png;base64,${maskBuffer.toString('base64')}`

  console.log('[Expand] Calling FLUX.1 Fill [pro] with custom mask...')
  console.log('[Expand] Prompt:', prompt)
  console.log('[Expand] Seed:', seed)

  // Use moderate-high guidance for better prompt adherence
  const output = (await replicate.run('black-forest-labs/flux-fill-pro', {
    input: {
      image: imageDataUrl,
      mask: maskDataUrl,
      prompt: prompt,
      steps: 50,
      guidance: 15, // Balance between prompt adherence and natural continuation
      output_format: 'png',
      safety_tolerance: 2,
      seed: seed,
      prompt_upsampling: false, // Disable - we already enhance with GPT
    },
  })) as unknown

  const resultUrl = extractResultUrl(output)
  console.log('[Expand] Downloading result from:', resultUrl)

  const response = await fetch(resultUrl)
  if (!response.ok) {
    throw new Error(`Failed to download expanded image: ${response.status}`)
  }

  const resultBuffer = Buffer.from(await response.arrayBuffer())
  console.log('[Expand] Horizontal expansion completed successfully')
  return { buffer: resultBuffer, seed }
}

// Standard expansion using outpaint preset
async function expandWithPreset(
  imageBuffer: Buffer,
  expandMode: string,
  prompt: string,
  seed: number
): Promise<{ buffer: Buffer; seed: number }> {
  console.log('[Expand] Starting expansion with preset:', expandMode)

  // Resize image if too large (max 2048px on longest side for API efficiency)
  const metadata = await sharp(imageBuffer).metadata()
  const maxDimension = Math.max(metadata.width || 0, metadata.height || 0)

  let processedBuffer = imageBuffer
  if (maxDimension > 2048) {
    console.log('[Expand] Resizing large image from', maxDimension, 'to 2048px')
    processedBuffer = await sharp(imageBuffer)
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .toBuffer()
  }

  // Convert to base64 data URL
  const base64Image = processedBuffer.toString('base64')
  const mimeType = metadata.format === 'png' ? 'image/png' : 'image/jpeg'
  const dataUrl = `data:${mimeType};base64,${base64Image}`

  const outpaintMode = EXPAND_MODE_MAP[expandMode]

  console.log('[Expand] Calling FLUX.1 Fill [pro] with outpaint:', outpaintMode)
  console.log('[Expand] Prompt:', prompt)
  console.log('[Expand] Seed:', seed)

  const output = (await replicate.run('black-forest-labs/flux-fill-pro', {
    input: {
      image: dataUrl,
      prompt: prompt,
      outpaint: outpaintMode,
      steps: 50,
      guidance: 15, // Balance between prompt adherence and natural continuation
      output_format: 'png',
      safety_tolerance: 2,
      seed: seed,
      prompt_upsampling: false, // Disable - we already enhance with GPT
    },
  })) as unknown

  const resultUrl = extractResultUrl(output)
  console.log('[Expand] Downloading result from:', resultUrl)

  const response = await fetch(resultUrl)
  if (!response.ok) {
    throw new Error(`Failed to download expanded image: ${response.status}`)
  }

  const resultBuffer = Buffer.from(await response.arrayBuffer())
  console.log('[Expand] Expansion completed successfully')
  return { buffer: resultBuffer, seed }
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
    const expandMode = (formData.get('expandMode') as ExpandMode) || 'zoom_1.5x'
    const prompt = formData.get('prompt') as string | null
    const seedParam = formData.get('seed') as string | null
    const seed = seedParam ? parseInt(seedParam, 10) : Math.floor(Math.random() * 2147483647)

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

    // Validate expand mode
    const validModes = [...Object.keys(EXPAND_MODE_MAP), 'expand_horizontal']
    if (!validModes.includes(expandMode)) {
      return NextResponse.json(
        { error: 'Invalid expand mode' },
        { status: 400 }
      )
    }

    // 5. CHECK CREDITS
    if (user.credits < CREDITS_PER_EXPAND) {
      if (user.credits === 0) {
        sendCreditsDepletedEmail({
          userEmail: user.email,
          userName: user.name || 'User',
          totalImagesProcessed: user.totalUsage || 0,
        }).catch((err) => console.error('Failed to send credits depleted email:', err))
      }
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: CREDITS_PER_EXPAND,
          available: user.credits,
        },
        { status: 402 }
      )
    }

    // 6. PROCESS IMAGE
    console.log('[Expand] Starting processing...')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Enhance user prompt with AI (or use default)
    let expandPrompt: string
    if (prompt && prompt.trim()) {
      // User provided a prompt - enhance it with GPT
      expandPrompt = await enhancePrompt(prompt.trim())
    } else {
      // No prompt - use a good default
      expandPrompt = 'natural seamless continuation of the scene, matching style and lighting, photorealistic, high detail'
    }

    let expandResult: { buffer: Buffer; seed: number }
    if (expandMode === 'expand_horizontal') {
      expandResult = await expandHorizontal(buffer, expandPrompt, seed)
    } else {
      expandResult = await expandWithPreset(buffer, expandMode, expandPrompt, seed)
    }

    // Convert to data URL for response
    const base64 = expandResult.buffer.toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    // 7. GET IMAGE DIMENSIONS
    const metadata = await sharp(expandResult.buffer).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0

    // 8. DEDUCT CREDITS & LOG USAGE
    createUsage({
      userId: user.id,
      type: expandMode === 'expand_horizontal' ? 'image_expand_horizontal' : 'image_expand',
      creditsUsed: CREDITS_PER_EXPAND,
      imageSize: `${file.size} bytes`,
      model: 'flux-fill-pro',
    })

    const newCredits = user.credits - CREDITS_PER_EXPAND

    // 9. SEND LOW CREDITS WARNING
    if (newCredits > 0 && newCredits <= 10) {
      sendCreditsLowEmail({
        userEmail: user.email,
        userName: user.name || 'User',
        creditsRemaining: newCredits,
        totalUsed: user.totalUsage || 0,
      }).catch((err) => console.error('Failed to send low credits email:', err))
    }

    // 10. RETURN SUCCESS
    console.log('[Expand] Processing complete!')
    return NextResponse.json({
      success: true,
      expandedImage: dataUrl,
      expandMode: expandMode,
      dimensions: {
        width,
        height,
      },
      seed: expandResult.seed,
      creditsUsed: CREDITS_PER_EXPAND,
      creditsRemaining: newCredits,
    })
  } catch (error: unknown) {
    console.error('[Expand] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to expand image',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
