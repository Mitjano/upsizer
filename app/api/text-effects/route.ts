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

// Style preset to prompt mapping for text effects
const STYLE_PRESETS = {
  '3d': '3D text effect, dimensional, depth, shadows, realistic lighting, volumetric',
  neon: 'neon sign effect, glowing, bright colors, electric, luminous, vibrant glow',
  graffiti: 'graffiti street art style, urban, spray paint, bold letters, hip-hop culture',
  fire: 'flames and fire effect, burning text, ember glow, heat distortion, fiery',
  ice: 'ice and frost effect, frozen, crystalline, cold, icy texture, glacial',
  gold: 'golden metallic effect, luxury, shiny gold, reflective, premium, expensive',
  chrome: 'chrome metal effect, reflective, mirror-like, metallic, silver, polished',
  cartoon: 'cartoon style text, playful, fun, bold outlines, comic book, animated',
  retro: 'retro vintage style, 80s aesthetic, nostalgic, classic, old-school',
  glitch: 'glitch digital effect, distorted, cyberpunk, corrupted data, technological',
} as const

type StylePreset = keyof typeof STYLE_PRESETS

// Background options
const BACKGROUND_OPTIONS = {
  transparent: 'transparent background, isolated text',
  solid: 'solid color background',
  gradient: 'gradient background, smooth color transition',
} as const

type BackgroundOption = keyof typeof BACKGROUND_OPTIONS

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
      text,
      style = '3d',
      background = 'transparent',
      backgroundColor = '',
    } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
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

    // Validate background option
    if (!Object.keys(BACKGROUND_OPTIONS).includes(background)) {
      return NextResponse.json(
        { error: `Invalid background option. Must be one of: ${Object.keys(BACKGROUND_OPTIONS).join(', ')}` },
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

    // 5. BUILD PROMPT FOR TEXT EFFECTS GENERATION
    const styleDescription = STYLE_PRESETS[style as StylePreset]
    const backgroundDescription = BACKGROUND_OPTIONS[background as BackgroundOption]

    // Add background color if specified and background is not transparent
    const backgroundColorPart = (background !== 'transparent' && backgroundColor)
      ? `, ${backgroundColor} background color`
      : ''

    const prompt = `Stylized text that says "${text}", ${styleDescription}, ${backgroundDescription}${backgroundColorPart}, high quality, detailed, professional, centered composition, artistic typography`

    const negativePrompt = 'low quality, blurry, distorted, pixelated, watermark, signature, cluttered, messy, amateur, poorly designed'

    console.log('[Text Effects] Generating text effect with prompt:', prompt)

    // 6. CALL REPLICATE - Ideogram V3 model (better for text)
    const output = await replicate.run(
      "ideogram-ai/ideogram-v2-turbo",
      {
        input: {
          prompt: prompt,
          negative_prompt: negativePrompt,
          aspect_ratio: "16:9",
          magic_prompt_option: "Auto",
          seed: Math.floor(Math.random() * 1000000),
          output_format: "png",
        }
      }
    ) as unknown as string[]

    // Ideogram returns an array of URLs
    if (!output || !Array.isArray(output) || output.length === 0) {
      throw new Error('No output received from Ideogram API')
    }

    const textEffectUrl = output[0]

    // 7. DOWNLOAD RESULT AND CONVERT TO BASE64
    const resultResponse = await fetch(textEffectUrl)
    if (!resultResponse.ok) {
      throw new Error('Failed to download generated text effect')
    }
    const resultBuffer = Buffer.from(await resultResponse.arrayBuffer())
    const resultBase64 = resultBuffer.toString('base64')
    const resultDataUrl = `data:image/png;base64,${resultBase64}`

    // 8. DEDUCT CREDITS & LOG USAGE
    await createUsage({
      userId: user.id,
      type: 'text_effects',
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
      generatedImage: resultDataUrl,
      imageUrl: textEffectUrl,
      prompt: prompt,
      text: text,
      style: style,
      background: background,
      backgroundColor: backgroundColor,
      creditsUsed: CREDITS_PER_GENERATION,
      creditsRemaining: newCredits,
    })

  } catch (error: unknown) {
    console.error('[Text Effects] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to generate text effect',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
