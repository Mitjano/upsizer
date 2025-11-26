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
  | 'expand_horizontal'  // Left + Right (two API calls)

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
const CREDITS_PER_HORIZONTAL = 4  // Two API calls for left+right

// Helper to call FLUX API for single direction
async function callFluxFillPro(
  dataUrl: string,
  outpaintMode: string,
  prompt: string
): Promise<Buffer> {
  console.log('[Expand] Calling FLUX.1 Fill [pro] with outpaint:', outpaintMode)

  const output = await replicate.run(
    'black-forest-labs/flux-fill-pro',
    {
      input: {
        image: dataUrl,
        prompt: prompt,
        outpaint: outpaintMode,
        steps: 50,
        guidance: 30,
        output_format: 'png',
        safety_tolerance: 2,
      },
    }
  ) as unknown

  // Handle output - could be string URL or FileOutput object
  let resultUrl: string
  if (typeof output === 'string') {
    resultUrl = output
  } else if (output && typeof output === 'object' && 'url' in output) {
    resultUrl = (output as { url: string }).url
  } else if (Array.isArray(output) && output.length > 0) {
    resultUrl = typeof output[0] === 'string' ? output[0] : (output[0] as { url: string }).url
  } else {
    throw new Error('Unexpected output format from FLUX.1 Fill [pro]')
  }

  console.log('[Expand] Downloading result from:', resultUrl)

  const response = await fetch(resultUrl)
  if (!response.ok) {
    throw new Error(`Failed to download expanded image: ${response.status}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

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
  let dataUrl = `data:${mimeType};base64,${base64Image}`

  // Default prompt if not provided
  const expandPrompt = prompt || 'Continue the image naturally, maintaining consistent style, lighting, and content'

  // Handle horizontal expansion (left + right) - requires two API calls
  if (expandMode === 'expand_horizontal') {
    console.log('[Expand] Horizontal expansion - Step 1: Expand Left')
    const leftExpanded = await callFluxFillPro(dataUrl, 'Left outpaint', expandPrompt)

    // Convert result to data URL for second call
    const leftBase64 = leftExpanded.toString('base64')
    const leftDataUrl = `data:image/png;base64,${leftBase64}`

    console.log('[Expand] Horizontal expansion - Step 2: Expand Right')
    const finalResult = await callFluxFillPro(leftDataUrl, 'Right outpaint', expandPrompt)

    console.log('[Expand] Horizontal expansion completed successfully')
    return finalResult
  }

  // Single direction expansion
  const outpaintMode = EXPAND_MODE_MAP[expandMode]
  if (!outpaintMode) {
    throw new Error(`Invalid expand mode: ${expandMode}`)
  }

  const resultBuffer = await callFluxFillPro(dataUrl, outpaintMode, expandPrompt)

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
    const validModes = [...Object.keys(EXPAND_MODE_MAP), 'expand_horizontal']
    if (!validModes.includes(expandMode)) {
      return NextResponse.json(
        { error: 'Invalid expand mode' },
        { status: 400 }
      )
    }

    // Calculate credits needed (horizontal = 4, others = 2)
    const creditsNeeded = expandMode === 'expand_horizontal' ? CREDITS_PER_HORIZONTAL : CREDITS_PER_EXPAND

    // 5. CHECK CREDITS
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
      type: expandMode === 'expand_horizontal' ? 'image_expand_horizontal' : 'image_expand',
      creditsUsed: creditsNeeded,
      imageSize: `${file.size} bytes`,
      model: 'flux-fill-pro',
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
    console.log('[Expand] Processing complete!')
    return NextResponse.json({
      success: true,
      expandedImage: dataUrl,
      expandMode: expandMode,
      dimensions: {
        width,
        height,
      },
      creditsUsed: creditsNeeded,
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
