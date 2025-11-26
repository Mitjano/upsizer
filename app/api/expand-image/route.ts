import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import sharp from 'sharp'
import { auth } from '@/lib/auth'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

// Expand mode presets matching FLUX.1 Fill [pro] outpaint parameter
type ExpandMode =
  | 'zoom_1.5x'
  | 'zoom_2x'
  | 'make_square'
  | 'expand_left'
  | 'expand_right'
  | 'expand_up'
  | 'expand_down'

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

async function expandImage(
  imageBuffer: Buffer,
  expandMode: ExpandMode,
  prompt?: string
): Promise<Buffer> {
  console.log('[Expand] Starting image expansion with FLUX.1 Fill [pro]...')
  console.log('[Expand] Mode:', expandMode)

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

  // Default prompt - simple description works best for outpainting
  // The model uses this to understand what to generate in expanded areas
  const expandPrompt = prompt || 'natural continuation of the scene'

  // Get the outpaint mode string
  const outpaintMode = EXPAND_MODE_MAP[expandMode]
  if (!outpaintMode) {
    throw new Error(`Invalid expand mode: ${expandMode}`)
  }

  console.log('[Expand] Calling FLUX.1 Fill [pro] with outpaint:', outpaintMode)
  console.log('[Expand] Prompt:', expandPrompt)

  // Call Replicate API
  // guidance: 3 (LOW) - allows creative freedom for natural expansion
  // Higher guidance makes the model too rigid and causes artifacts
  const output = (await replicate.run(
    'black-forest-labs/flux-fill-pro',
    {
      input: {
        image: dataUrl,
        prompt: expandPrompt,
        outpaint: outpaintMode,
        steps: 50,
        guidance: 3,
        output_format: 'png',
        safety_tolerance: 2,
      },
    }
  )) as unknown

  // Handle output - Replicate SDK returns a FileOutput object with toString() that returns URL
  // FileOutput extends ReadableStream and has url() and toString() methods
  let resultUrl: string

  console.log('[Expand] Raw output type:', typeof output)

  if (typeof output === 'string') {
    resultUrl = output
  } else if (output && typeof output === 'object') {
    // FileOutput object - use toString() to get the URL string
    // The toString() method returns the URL as a string
    const stringified = String(output)
    if (stringified.startsWith('http')) {
      resultUrl = stringified
    } else {
      // Try other methods
      const outputObj = output as Record<string, unknown>
      if (typeof outputObj.toString === 'function') {
        const toStringResult = outputObj.toString()
        if (typeof toStringResult === 'string' && toStringResult.startsWith('http')) {
          resultUrl = toStringResult
        } else {
          throw new Error(`toString() did not return a URL: ${toStringResult}`)
        }
      } else if (Array.isArray(output) && output.length > 0) {
        const first = output[0]
        if (typeof first === 'string') {
          resultUrl = first
        } else {
          resultUrl = String(first)
          if (!resultUrl.startsWith('http')) {
            throw new Error(`Cannot extract URL from array element: ${resultUrl}`)
          }
        }
      } else {
        throw new Error(`Cannot extract URL from output. toString() returned: ${stringified}`)
      }
    }
  } else {
    throw new Error(`Unexpected output type: ${typeof output}`)
  }

  console.log('[Expand] Downloading result from:', resultUrl)

  const response = await fetch(resultUrl)
  if (!response.ok) {
    throw new Error(`Failed to download expanded image: ${response.status}`)
  }

  const resultBuffer = Buffer.from(await response.arrayBuffer())
  console.log('[Expand] Image expansion completed successfully')
  return resultBuffer
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
    const validModes = Object.keys(EXPAND_MODE_MAP)
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
        }).catch(err => console.error('Failed to send credits depleted email:', err))
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

    const expandedImage = await expandImage(buffer, expandMode, prompt || undefined)

    // Convert to data URL for response
    const base64 = expandedImage.toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    // 7. GET IMAGE DIMENSIONS
    const metadata = await sharp(expandedImage).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0

    // 8. DEDUCT CREDITS & LOG USAGE
    createUsage({
      userId: user.id,
      type: 'image_expand',
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
      }).catch(err => console.error('Failed to send low credits email:', err))
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
