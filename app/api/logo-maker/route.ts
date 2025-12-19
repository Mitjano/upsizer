import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'
import { CREDIT_COSTS } from '@/lib/credits-config'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

const CREDITS_PER_GENERATION = 5

// Style preset to prompt mapping
const STYLE_PRESETS = {
  minimalist: 'clean, minimal, simple, modern, geometric shapes, negative space',
  vintage: 'retro, classic, timeless, vintage typography, traditional, heritage',
  modern: 'contemporary, sleek, bold, dynamic, innovative, cutting-edge',
  playful: 'fun, vibrant, colorful, whimsical, creative, energetic',
  professional: 'corporate, sophisticated, elegant, refined, trustworthy',
  tech: 'technological, digital, futuristic, innovative, abstract, silicon valley',
} as const

type StylePreset = keyof typeof STYLE_PRESETS

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const { allowed, resetAt } = imageProcessingLimiter.check(identifier)
    if (!allowed) {
      return rateLimitResponse(resetAt)
    }

    // 1. AUTHENTICATION
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode || 401 }
      )
    }

    // 2. GET USER
    const user = await getUserByEmail(authResult.user!.email)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 3. GET REQUEST BODY
    const body = await request.json()
    const {
      companyName,
      style = 'modern',
      colorScheme = '',
    } = body

    if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Company/brand name is required' },
        { status: 400 }
      )
    }

    // Validate style preset
    if (!Object.keys(STYLE_PRESETS).includes(style)) {
      return NextResponse.json(
        { error: `Invalid style preset. Must be one of: ${Object.keys(STYLE_PRESETS).join(', ')}` },
        { status: 400 }
      )
    }

    // 4. CHECK CREDITS
    if (user.credits < CREDITS_PER_GENERATION) {
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
          required: CREDITS_PER_GENERATION,
          available: user.credits,
        },
        { status: 402 }
      )
    }

    // 5. BUILD PROMPT FOR LOGO GENERATION
    const styleDescription = STYLE_PRESETS[style as StylePreset]
    const colorPart = colorScheme ? `, ${colorScheme} color scheme` : ''

    const prompt = `Professional logo design for "${companyName}", ${styleDescription}${colorPart}, high quality, vector style, clean design, transparent background, centered composition, commercial use`

    const negativePrompt = 'text, words, letters, typography, watermark, signature, low quality, blurry, distorted, photographic, realistic photo, cluttered, busy, multiple logos'

    console.log('[Logo Maker] Generating logo with prompt:', prompt)

    // 6. CALL REPLICATE - Ideogram V2 Turbo model
    const output = await replicate.run(
      "ideogram-ai/ideogram-v2-turbo",
      {
        input: {
          prompt: prompt,
          negative_prompt: negativePrompt,
          aspect_ratio: "1:1",
          magic_prompt_option: "Auto",
          seed: Math.floor(Math.random() * 1000000),
          output_format: "png",
        }
      }
    )

    console.log('[Logo Maker] Raw output:', JSON.stringify(output))

    // Handle different output formats from Replicate
    let logoUrl: string | null = null

    if (typeof output === 'string') {
      // Direct URL string
      logoUrl = output
    } else if (Array.isArray(output) && output.length > 0) {
      // Array of URLs
      logoUrl = output[0]
    } else if (output && typeof output === 'object') {
      // Object with url property
      const outputObj = output as Record<string, unknown>
      if (outputObj.url && typeof outputObj.url === 'string') {
        logoUrl = outputObj.url
      } else if (outputObj.output && typeof outputObj.output === 'string') {
        logoUrl = outputObj.output
      } else if (Array.isArray(outputObj.output) && outputObj.output.length > 0) {
        logoUrl = outputObj.output[0] as string
      }
    }

    if (!logoUrl) {
      console.error('[Logo Maker] Could not extract URL from output:', output)
      throw new Error('No output received from Ideogram API')
    }

    // 7. DOWNLOAD RESULT AND CONVERT TO BASE64
    const resultResponse = await fetch(logoUrl)
    if (!resultResponse.ok) {
      throw new Error('Failed to download generated logo')
    }
    const resultBuffer = Buffer.from(await resultResponse.arrayBuffer())
    const resultBase64 = resultBuffer.toString('base64')
    const resultDataUrl = `data:image/png;base64,${resultBase64}`

    // 8. DEDUCT CREDITS & LOG USAGE
    await createUsage({
      userId: user.id,
      type: 'logo_maker',
      creditsUsed: CREDITS_PER_GENERATION,
      imageSize: `${resultBuffer.length} bytes`,
      model: 'ideogram-v2-turbo',
    })

    const newCredits = user.credits - CREDITS_PER_GENERATION

    // 9. SEND LOW CREDITS WARNING
    if (newCredits > 0 && newCredits <= 10) {
      sendCreditsLowEmail({
        userEmail: user.email,
        userName: user.name || 'User',
        creditsRemaining: newCredits,
      }).catch(err => console.error('Failed to send low credits email:', err))
    }

    // 10. RETURN SUCCESS
    return NextResponse.json({
      success: true,
      generatedLogo: resultDataUrl,
      logoUrl: logoUrl,
      prompt: prompt,
      companyName: companyName,
      style: style,
      colorScheme: colorScheme,
      creditsUsed: CREDITS_PER_GENERATION,
      creditsRemaining: newCredits,
    })

  } catch (error: unknown) {
    console.error('[Logo Maker] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to generate logo',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
