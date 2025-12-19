import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'
import { CREDIT_COSTS } from '@/lib/credits-config'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

const CREDITS_PER_CONVERSION = CREDIT_COSTS.vectorize.cost

// Vectorizer.AI API endpoint
const VECTORIZER_API_URL = 'https://api.vectorizer.ai/api/v1/vectorize'

export async function POST(request: NextRequest) {
  try {
    const identifier = getClientIdentifier(request)
    const { allowed, resetAt } = imageProcessingLimiter.check(identifier)
    if (!allowed) return rateLimitResponse(resetAt)

    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode || 401 })
    }

    const user = await getUserByEmail(authResult.user!.email)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Check credits
    if (user.credits < CREDITS_PER_CONVERSION) {
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
          required: CREDITS_PER_CONVERSION,
          available: user.credits,
        },
        { status: 402 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const mode = (formData.get('mode') as string) || 'production' // production, preview, or test
    const colorMode = (formData.get('colorMode') as string) || 'color' // color, grayscale, bw
    const maxColors = parseInt(formData.get('maxColors') as string) || 0 // 0 = unlimited

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Supported: JPEG, PNG, WebP, GIF, BMP' }, { status: 400 })
    }

    // Max 10MB for vectorizer
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB allowed.' }, { status: 400 })
    }

    // Check for API key
    const vectorizerApiKey = process.env.VECTORIZER_API_KEY

    if (!vectorizerApiKey) {
      // Fallback: use a simple SVG tracing method using potrace via replicate
      // For now, return an error suggesting the feature requires configuration
      console.warn('[Vectorize] VECTORIZER_API_KEY not configured')
      return NextResponse.json(
        {
          error: 'Vectorization service not configured. Please contact support.',
          details: 'VECTORIZER_API_KEY is required'
        },
        { status: 503 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Build form data for Vectorizer.AI API
    const apiFormData = new FormData()
    apiFormData.append('image', new Blob([buffer], { type: file.type }), file.name)
    apiFormData.append('output.file_format', 'svg')
    apiFormData.append('processing.palette', colorMode === 'bw' ? 'bw' : colorMode === 'grayscale' ? 'grayscale' : 'color')

    if (maxColors > 0 && colorMode === 'color') {
      apiFormData.append('processing.max_colors', maxColors.toString())
    }

    // Set mode (production uses credits, preview is watermarked but free for testing)
    apiFormData.append('mode', mode)

    console.log('[Vectorize] Calling Vectorizer.AI API...')

    // Call Vectorizer.AI API
    const response = await fetch(VECTORIZER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${vectorizerApiKey}:`).toString('base64')}`,
      },
      body: apiFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Vectorize] API error:', response.status, errorText)

      if (response.status === 402) {
        return NextResponse.json(
          { error: 'Vectorization API credits exhausted. Please contact support.' },
          { status: 503 }
        )
      }

      throw new Error(`Vectorizer.AI API error: ${response.status}`)
    }

    // Get SVG content
    const svgContent = await response.text()

    // Only deduct credits for production mode
    if (mode === 'production') {
      // Log usage
      await createUsage({
        userId: user.id,
        type: 'vectorize',
        creditsUsed: CREDITS_PER_CONVERSION,
        imageSize: `${file.size} bytes`,
        model: 'vectorizer-ai',
      })

      const newCredits = user.credits - CREDITS_PER_CONVERSION

      // Send low credits warning
      if (newCredits > 0 && newCredits <= 10) {
        sendCreditsLowEmail({
          userEmail: user.email,
          userName: user.name || 'User',
          creditsRemaining: newCredits,
        }).catch(err => console.error('Failed to send low credits email:', err))
      }

      return NextResponse.json({
        success: true,
        svg: svgContent,
        format: 'svg',
        mode: mode,
        colorMode: colorMode,
        maxColors: maxColors,
        creditsUsed: CREDITS_PER_CONVERSION,
        creditsRemaining: newCredits,
      })
    } else {
      // Preview mode - no credits charged
      return NextResponse.json({
        success: true,
        svg: svgContent,
        format: 'svg',
        mode: mode,
        colorMode: colorMode,
        maxColors: maxColors,
        creditsUsed: 0,
        creditsRemaining: user.credits,
        note: 'Preview mode - watermarked output. Use production mode for final result.',
      })
    }

  } catch (error) {
    console.error('[Vectorize] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to vectorize image' },
      { status: 500 }
    )
  }
}
