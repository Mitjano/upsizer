import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { getUserByEmail, createUsage } from '@/lib/db'
import { sendCreditsLowEmail, sendCreditsDepletedEmail } from '@/lib/email'
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'
import { authenticateRequest } from '@/lib/api-auth'
import { calculateProductShotCost } from '@/lib/credits-config'
import { ProcessedImagesDB } from '@/lib/processed-images-db'

// Configure fal.ai client
fal.config({
  credentials: process.env.FAL_API_KEY,
})

// E-commerce optimized presets with professional prompts
const ECOMMERCE_PRESETS: Record<string, { prompt: string; category: string }> = {
  // Marketplace/Amazon style
  pureWhite: {
    prompt: 'Pure white infinite seamless background, professional e-commerce product photography, Amazon marketplace style, clean minimal, perfect for product listing, soft even studio lighting',
    category: 'marketplace'
  },
  softShadow: {
    prompt: 'Clean white background with subtle soft drop shadow underneath product, floating effect, professional product photography, e-commerce ready, soft diffused lighting',
    category: 'marketplace'
  },
  gradientWhite: {
    prompt: 'Smooth white to light gray gradient background, professional product photography, soft studio lighting, clean minimal e-commerce style',
    category: 'marketplace'
  },

  // Lifestyle surfaces
  marbleElegant: {
    prompt: 'Elegant white marble surface with subtle gray veins, luxury product photography, soft natural lighting from window, premium brand aesthetic, high-end commercial shot',
    category: 'lifestyle'
  },
  woodenRustic: {
    prompt: 'Warm rustic wooden table surface, natural wood grain texture, artisan product photography, soft warm ambient lighting, handcrafted cozy feel',
    category: 'lifestyle'
  },
  modernKitchen: {
    prompt: 'Modern white kitchen countertop, clean contemporary interior, lifestyle product placement, soft natural daylight, premium home environment',
    category: 'lifestyle'
  },
  concreteMinimal: {
    prompt: 'Minimalist concrete surface, modern industrial aesthetic, clean gray tones, architectural product photography, soft diffused lighting',
    category: 'lifestyle'
  },

  // Premium/Luxury
  velvetDark: {
    prompt: 'Luxurious black velvet surface, dramatic professional lighting, elegant shadows, premium brand photography, sophisticated high-end aesthetic',
    category: 'luxury'
  },
  goldAccent: {
    prompt: 'Dark elegant background with subtle gold accent lighting, luxury brand aesthetic, premium product photography, sophisticated shadows',
    category: 'luxury'
  },
  silkWaves: {
    prompt: 'Flowing silk fabric background in soft neutral tones, elegant waves, luxury texture, premium brand photography, soft sophisticated lighting',
    category: 'luxury'
  },

  // Category specific
  cosmetics: {
    prompt: 'Clean bathroom shelf setting, white marble and gold accents, spa atmosphere, beauty product photography, soft flattering lighting, premium skincare aesthetic',
    category: 'industry'
  },
  food: {
    prompt: 'Rustic wooden cutting board, fresh herbs and ingredients around, food photography style, warm natural lighting, appetizing culinary setting',
    category: 'industry'
  },
  electronics: {
    prompt: 'Sleek dark matte surface, subtle blue tech accent glow, futuristic minimal, technology product photography, clean modern aesthetic',
    category: 'industry'
  },
  fashion: {
    prompt: 'Fashion editorial style background, clean modern backdrop, neutral tones, runway inspired, professional fashion photography lighting',
    category: 'industry'
  },
  jewelry: {
    prompt: 'Black velvet jewelry display, dramatic spotlight from above, luxury jewelry photography, elegant shadows, premium gemstone presentation',
    category: 'industry'
  },

  // Seasonal
  christmas: {
    prompt: 'Festive Christmas setting, warm bokeh lights in background, red and gold accents, holiday gift presentation, cozy winter atmosphere',
    category: 'seasonal'
  },
  summer: {
    prompt: 'Bright summer outdoor setting, fresh tropical vibes, natural sunlight, beach vacation aesthetic, light airy atmosphere',
    category: 'seasonal'
  },
  autumn: {
    prompt: 'Warm autumn scene, golden and orange leaves, rustic wood surface, cozy fall atmosphere, warm natural lighting',
    category: 'seasonal'
  },
  spring: {
    prompt: 'Fresh spring setting, soft pink cherry blossoms, bright natural light, renewal atmosphere, delicate floral accents',
    category: 'seasonal'
  },

  // Studio professional
  studioClassic: {
    prompt: 'Professional photography studio, white cyclorama background, soft even studio lighting, commercial product shot, no horizon line visible',
    category: 'studio'
  },
  studioGray: {
    prompt: 'Professional gray seamless studio backdrop, neutral tones, even diffused lighting, commercial photography, clean minimal',
    category: 'studio'
  },
  studioDark: {
    prompt: 'Dark studio background, dramatic rim lighting, professional product photography, elegant shadows, premium commercial aesthetic',
    category: 'studio'
  }
}

// Placement options
type PlacementType = 'original' | 'automatic' | 'bottom_center' | 'center' | 'left_center' | 'right_center'

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
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. EXTRACT FORMDATA
    const formData = await request.formData()
    const file = formData.get('file') as File
    const preset = formData.get('preset') as string | null
    const customPrompt = formData.get('prompt') as string | null
    const referenceImageUrl = formData.get('reference_image_url') as string | null
    const numResults = parseInt(formData.get('num_results') as string || '1', 10)
    const placement = (formData.get('placement') as PlacementType) || 'automatic'
    const shotWidth = parseInt(formData.get('shot_width') as string || '1000', 10)
    const shotHeight = parseInt(formData.get('shot_height') as string || '1000', 10)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate num_results (1-4)
    const clampedResults = Math.min(Math.max(numResults, 1), 4)

    // Determine the prompt to use
    let sceneDescription: string
    if (customPrompt && customPrompt.trim()) {
      sceneDescription = customPrompt.trim()
    } else if (preset && ECOMMERCE_PRESETS[preset]) {
      sceneDescription = ECOMMERCE_PRESETS[preset].prompt
    } else {
      sceneDescription = ECOMMERCE_PRESETS.pureWhite.prompt
    }

    // 4. VALIDATE FILE
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: JPG, PNG, WEBP' },
        { status: 400 }
      )
    }

    const MAX_SIZE = 12 * 1024 * 1024 // Bria Product Shot max 12MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 12MB' },
        { status: 400 }
      )
    }

    // 5. CHECK CREDITS
    const creditsNeeded = calculateProductShotCost(clampedResults)
    if (user.credits < creditsNeeded) {
      if (user.credits === 0) {
        sendCreditsDepletedEmail({
          userEmail: user.email,
          userName: user.name || 'User',
          totalImagesProcessed: user.totalUsage || 0,
        }).catch(err => console.error('Failed to send credits depleted email:', err))
      }
      return NextResponse.json(
        { error: 'Insufficient credits', required: creditsNeeded, available: user.credits },
        { status: 402 }
      )
    }

    // 6. UPLOAD IMAGE TO FAL STORAGE
    const arrayBuffer = await file.arrayBuffer()
    const uploadedUrl = await fal.storage.upload(
      new Blob([new Uint8Array(arrayBuffer)], { type: file.type })
    )

    console.log('[Product Shot] Generating with Bria Product Shot...', {
      prompt: sceneDescription.substring(0, 50) + '...',
      numResults: clampedResults,
      placement
    })

    // 7. CALL BRIA PRODUCT SHOT API
    // Determine placement type for API
    let placementType: string = 'automatic'
    let manualPlacement: string | undefined

    if (placement === 'original') {
      placementType = 'original'
    } else if (placement === 'automatic') {
      placementType = 'automatic'
    } else {
      placementType = 'manual_placement'
      manualPlacement = placement
    }

    const apiInput: Record<string, unknown> = {
      image_url: uploadedUrl,
      scene_description: sceneDescription,
      num_results: clampedResults,
      placement_type: placementType,
      shot_size: [shotWidth, shotHeight],
      optimize_description: true,
      fast: true,
    }

    // Add manual placement if specified
    if (manualPlacement) {
      apiInput.manual_placement_selection = manualPlacement
    }

    // Add reference image if provided
    if (referenceImageUrl) {
      apiInput.ref_image_url = referenceImageUrl
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await fal.subscribe('fal-ai/bria/product-shot', {
      input: apiInput,
    } as any)

    const data = result.data as { images: Array<{ url: string }> }
    if (!data.images || data.images.length === 0) {
      throw new Error('No images generated from Bria Product Shot')
    }

    // 8. DOWNLOAD RESULTS AND CONVERT TO BASE64
    const results = await Promise.all(
      data.images.map(async (img, index) => {
        const response = await fetch(img.url)
        const buffer = Buffer.from(await response.arrayBuffer())
        const base64 = buffer.toString('base64')
        return {
          index,
          url: img.url,
          dataUrl: `data:image/png;base64,${base64}`
        }
      })
    )

    // 9. SAVE FIRST RESULT TO DATABASE FOR SHARE LINK
    const originalBase64 = Buffer.from(arrayBuffer).toString('base64')
    const originalDataUrl = `data:${file.type};base64,${originalBase64}`
    const imageRecord = await ProcessedImagesDB.create({
      userId: user.email,
      originalPath: originalDataUrl,
      processedPath: results[0].dataUrl,
      originalFilename: file.name,
      fileSize: file.size,
      width: shotWidth,
      height: shotHeight,
      isProcessed: true,
    })

    // 10. DEDUCT CREDITS & LOG USAGE
    await createUsage({
      userId: user.id,
      type: 'product_shot',
      creditsUsed: creditsNeeded,
      imageSize: `${shotWidth}x${shotHeight}`,
      model: 'bria-product-shot',
    })

    const newCredits = user.credits - creditsNeeded

    // 11. SEND LOW CREDITS WARNING
    if (newCredits > 0 && newCredits <= 10) {
      sendCreditsLowEmail({
        userEmail: user.email,
        userName: user.name || 'User',
        creditsRemaining: newCredits,
      }).catch(err => console.error('Failed to send low credits email:', err))
    }

    // 12. RETURN SUCCESS
    return NextResponse.json({
      success: true,
      id: imageRecord.id,
      results: results.map(r => ({
        index: r.index,
        dataUrl: r.dataUrl
      })),
      prompt: sceneDescription,
      preset: preset || 'custom',
      placement,
      numResults: clampedResults,
      creditsUsed: creditsNeeded,
      creditsRemaining: newCredits,
    })
  } catch (error: unknown) {
    console.error('[Product Shot] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to generate product shot', details: errorMessage },
      { status: 500 }
    )
  }
}
