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

// Expand mode types
type ExpandMode =
  | 'zoom_1.5x'
  | 'zoom_2x'
  | 'make_square'
  | 'expand_left'
  | 'expand_right'
  | 'expand_up'
  | 'expand_down'
  | 'expand_horizontal'

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

// Calculate canvas parameters for Bria Expand based on expand mode
function calculateBriaParams(
  origWidth: number,
  origHeight: number,
  expandMode: ExpandMode
): {
  canvasSize: [number, number]
  originalImageSize: [number, number]
  originalImageLocation: [number, number]
} {
  switch (expandMode) {
    case 'zoom_1.5x': {
      // Expand all sides by 25% each (1.5x total)
      const newWidth = Math.round(origWidth * 1.5)
      const newHeight = Math.round(origHeight * 1.5)
      const offsetX = Math.round((newWidth - origWidth) / 2)
      const offsetY = Math.round((newHeight - origHeight) / 2)
      return {
        canvasSize: [newWidth, newHeight],
        originalImageSize: [origWidth, origHeight],
        originalImageLocation: [offsetX, offsetY],
      }
    }

    case 'zoom_2x': {
      // Expand all sides by 50% each (2x total)
      const newWidth = Math.round(origWidth * 2)
      const newHeight = Math.round(origHeight * 2)
      const offsetX = Math.round((newWidth - origWidth) / 2)
      const offsetY = Math.round((newHeight - origHeight) / 2)
      return {
        canvasSize: [newWidth, newHeight],
        originalImageSize: [origWidth, origHeight],
        originalImageLocation: [offsetX, offsetY],
      }
    }

    case 'make_square': {
      // Make the image square by expanding shorter side
      const maxSide = Math.max(origWidth, origHeight)
      const offsetX = Math.round((maxSide - origWidth) / 2)
      const offsetY = Math.round((maxSide - origHeight) / 2)
      return {
        canvasSize: [maxSide, maxSide],
        originalImageSize: [origWidth, origHeight],
        originalImageLocation: [offsetX, offsetY],
      }
    }

    case 'expand_left': {
      // Add 50% to the left side
      const expandAmount = Math.round(origWidth * 0.5)
      const newWidth = origWidth + expandAmount
      return {
        canvasSize: [newWidth, origHeight],
        originalImageSize: [origWidth, origHeight],
        originalImageLocation: [expandAmount, 0], // Image on right
      }
    }

    case 'expand_right': {
      // Add 50% to the right side
      const expandAmount = Math.round(origWidth * 0.5)
      const newWidth = origWidth + expandAmount
      return {
        canvasSize: [newWidth, origHeight],
        originalImageSize: [origWidth, origHeight],
        originalImageLocation: [0, 0], // Image on left
      }
    }

    case 'expand_up': {
      // Add 50% to the top
      const expandAmount = Math.round(origHeight * 0.5)
      const newHeight = origHeight + expandAmount
      return {
        canvasSize: [origWidth, newHeight],
        originalImageSize: [origWidth, origHeight],
        originalImageLocation: [0, expandAmount], // Image at bottom
      }
    }

    case 'expand_down': {
      // Add 50% to the bottom
      const expandAmount = Math.round(origHeight * 0.5)
      const newHeight = origHeight + expandAmount
      return {
        canvasSize: [origWidth, newHeight],
        originalImageSize: [origWidth, origHeight],
        originalImageLocation: [0, 0], // Image at top
      }
    }

    case 'expand_horizontal': {
      // Add 50% to both left and right (2x width total)
      const expandAmount = Math.round(origWidth * 0.5)
      const newWidth = origWidth + expandAmount * 2
      return {
        canvasSize: [newWidth, origHeight],
        originalImageSize: [origWidth, origHeight],
        originalImageLocation: [expandAmount, 0], // Image centered
      }
    }

    default:
      throw new Error(`Unknown expand mode: ${expandMode}`)
  }
}

// Expand image using Bria Expand model
async function expandWithBria(
  imageBuffer: Buffer,
  expandMode: ExpandMode,
  prompt: string,
  seed: number
): Promise<{ buffer: Buffer; seed: number }> {
  console.log('[Expand] Starting Bria expansion with mode:', expandMode)

  // Get original image dimensions
  const metadata = await sharp(imageBuffer).metadata()
  const origWidth = metadata.width || 0
  const origHeight = metadata.height || 0

  console.log('[Expand] Original dimensions:', origWidth, 'x', origHeight)

  // Resize if too large (Bria works best with reasonable sizes)
  let processedBuffer = imageBuffer
  const maxDimension = Math.max(origWidth, origHeight)
  let scaleFactor = 1

  if (maxDimension > 1536) {
    scaleFactor = 1536 / maxDimension
    const newW = Math.round(origWidth * scaleFactor)
    const newH = Math.round(origHeight * scaleFactor)
    console.log('[Expand] Resizing from', origWidth, 'x', origHeight, 'to', newW, 'x', newH)
    processedBuffer = await sharp(imageBuffer)
      .resize(newW, newH, { fit: 'inside', withoutEnlargement: true })
      .toBuffer()
  }

  // Get processed dimensions
  const processedMeta = await sharp(processedBuffer).metadata()
  const procWidth = processedMeta.width || 0
  const procHeight = processedMeta.height || 0

  // Calculate canvas parameters for Bria
  const briaParams = calculateBriaParams(procWidth, procHeight, expandMode)

  console.log('[Expand] Bria params:', {
    canvasSize: briaParams.canvasSize,
    originalImageSize: briaParams.originalImageSize,
    originalImageLocation: briaParams.originalImageLocation,
  })

  // Convert image to base64 data URL
  const base64Image = processedBuffer.toString('base64')
  const mimeType = metadata.format === 'png' ? 'image/png' : 'image/jpeg'
  const dataUrl = `data:${mimeType};base64,${base64Image}`

  console.log('[Expand] Calling Bria Expand...')
  console.log('[Expand] Prompt:', prompt)
  console.log('[Expand] Seed:', seed)

  const output = (await replicate.run('bria/expand-image', {
    input: {
      image: dataUrl,
      prompt: prompt,
      negative_prompt: 'blurry, low quality, distorted, deformed, text, watermark, logo, letters, writing',
      canvas_size: briaParams.canvasSize,
      original_image_size: briaParams.originalImageSize,
      original_image_location: briaParams.originalImageLocation,
      seed: seed,
    },
  })) as unknown

  const resultUrl = extractResultUrl(output)
  console.log('[Expand] Downloading result from:', resultUrl)

  const response = await fetch(resultUrl)
  if (!response.ok) {
    throw new Error(`Failed to download expanded image: ${response.status}`)
  }

  const resultBuffer = Buffer.from(await response.arrayBuffer())
  console.log('[Expand] Bria expansion completed successfully')
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
    const validModes: ExpandMode[] = [
      'zoom_1.5x',
      'zoom_2x',
      'make_square',
      'expand_left',
      'expand_right',
      'expand_up',
      'expand_down',
      'expand_horizontal',
    ]
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
      // No prompt - use a good default that explicitly prevents text generation
      expandPrompt = 'natural seamless continuation of the scene, matching style and lighting, photorealistic, high detail'
    }

    // Use Bria Expand for all modes
    const expandResult = await expandWithBria(buffer, expandMode, expandPrompt, seed)

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
      type: `image_expand_${expandMode}`,
      creditsUsed: CREDITS_PER_EXPAND,
      imageSize: `${file.size} bytes`,
      model: 'bria-expand',
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
