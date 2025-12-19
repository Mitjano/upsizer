import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'
import { CREDIT_COSTS } from '@/lib/credits-config'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

// Configure fal.ai client
fal.config({
  credentials: process.env.FAL_API_KEY,
})

const CREDITS_PER_CONVERSION = CREDIT_COSTS.vectorize.cost

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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Supported: JPEG, PNG, WebP' }, { status: 400 })
    }

    // Max 5MB for Recraft
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 5MB allowed.' }, { status: 400 })
    }

    // Check for FAL API key
    if (!process.env.FAL_API_KEY) {
      console.error('[Vectorize] FAL_API_KEY not configured')
      return NextResponse.json(
        { error: 'Vectorization service not configured. Please contact support.' },
        { status: 503 }
      )
    }

    // Upload image to FAL storage
    const arrayBuffer = await file.arrayBuffer()
    const uploadedUrl = await fal.storage.upload(
      new Blob([new Uint8Array(arrayBuffer)], { type: file.type })
    )

    console.log('[Vectorize] Calling Fal.ai Recraft Vectorize...')

    // Call Fal.ai Recraft Vectorize API
    const result = await fal.subscribe('fal-ai/recraft/vectorize', {
      input: {
        image_url: uploadedUrl,
      },
    })

    const data = result.data as { image: { url: string; file_size: number } }

    if (!data.image || !data.image.url) {
      throw new Error('No SVG generated from Recraft')
    }

    // Download SVG content
    const svgResponse = await fetch(data.image.url)
    if (!svgResponse.ok) {
      throw new Error('Failed to download SVG result')
    }
    const svgContent = await svgResponse.text()

    // Log usage and deduct credits
    await createUsage({
      userId: user.id,
      type: 'vectorize',
      creditsUsed: CREDITS_PER_CONVERSION,
      imageSize: `${file.size} bytes`,
      model: 'recraft-vectorize',
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
      svgUrl: data.image.url,
      format: 'svg',
      fileSize: data.image.file_size,
      creditsUsed: CREDITS_PER_CONVERSION,
      creditsRemaining: newCredits,
    })

  } catch (error) {
    console.error('[Vectorize] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to vectorize image' },
      { status: 500 }
    )
  }
}
