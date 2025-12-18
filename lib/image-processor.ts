import Replicate from 'replicate'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export class ImageProcessor {
  private static replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN!,
  })

  /**
   * Remove background from image using Fal.ai BiRefNet
   * FREE - $0 per compute second!
   * Falls back to Replicate BRIA if Fal.ai fails
   */
  static async removeBackground(dataUrl: string): Promise<string> {
    const falApiKey = process.env.FAL_API_KEY

    // Try Fal.ai BiRefNet first (FREE!)
    if (falApiKey) {
      try {
        const result = await this.removeBackgroundViaFal(dataUrl, falApiKey)
        if (result) return result
      } catch (error) {
        console.error('Fal.ai BiRefNet failed, falling back to Replicate:', error)
      }
    }

    // Fallback to Replicate BRIA
    return this.removeBackgroundViaReplicate(dataUrl)
  }

  /**
   * Remove background using Fal.ai BiRefNet (FREE!)
   * Uses "General Use (Heavy)" model for best accuracy on all image types
   * including products, portraits, and general images.
   */
  private static async removeBackgroundViaFal(dataUrl: string, apiKey: string): Promise<string> {
    try {
      // Submit request to Fal.ai
      const submitResponse = await fetch('https://queue.fal.run/fal-ai/birefnet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${apiKey}`,
        },
        body: JSON.stringify({
          image_url: dataUrl,
          model: 'General Use (Heavy)',  // Best accuracy for ALL image types (products, portraits, etc.)
          operating_resolution: '2048x2048',  // Higher resolution for better quality
          output_format: 'png',
          refine_foreground: true,
        }),
      })

      if (!submitResponse.ok) {
        const error = await submitResponse.text()
        throw new Error(`Fal.ai submit failed: ${error}`)
      }

      const submitData = await submitResponse.json()
      const requestId = submitData.request_id

      if (!requestId) {
        throw new Error('No request_id returned from Fal.ai')
      }

      // Poll for result (BiRefNet is usually fast)
      let attempts = 0
      const maxAttempts = 60 // 60 seconds max

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000))

        const statusResponse = await fetch(
          `https://queue.fal.run/fal-ai/birefnet/requests/${requestId}/status`,
          {
            headers: {
              'Authorization': `Key ${apiKey}`,
            },
          }
        )

        if (!statusResponse.ok) {
          attempts++
          continue
        }

        const statusData = await statusResponse.json()

        if (statusData.status === 'COMPLETED') {
          // Get result
          const resultResponse = await fetch(
            `https://queue.fal.run/fal-ai/birefnet/requests/${requestId}`,
            {
              headers: {
                'Authorization': `Key ${apiKey}`,
              },
            }
          )

          if (!resultResponse.ok) {
            throw new Error('Failed to get result from Fal.ai')
          }

          const resultData = await resultResponse.json()

          // BiRefNet returns { image: { url: "..." } }
          if (resultData.image?.url) {
            console.log('Background removed via Fal.ai BiRefNet (FREE)')
            return resultData.image.url
          }

          throw new Error('No image URL in Fal.ai response')
        }

        if (statusData.status === 'FAILED') {
          throw new Error(`Fal.ai processing failed: ${statusData.error || 'Unknown error'}`)
        }

        attempts++
      }

      throw new Error('Fal.ai processing timeout')
    } catch (error) {
      console.error('Fal.ai BiRefNet error:', error)
      throw error
    }
  }

  /**
   * Remove background using Replicate BRIA (fallback)
   */
  private static async removeBackgroundViaReplicate(dataUrl: string): Promise<string> {
    try {
      const output = await this.replicate.run(
        "bria/remove-background",
        {
          input: {
            image: dataUrl
          }
        }
      )

      const resultUrl = typeof output === 'string' ? output : String(output)
      console.log('Background removed via Replicate BRIA')
      return resultUrl
    } catch (error) {
      console.error('Replicate background removal failed:', error)
      throw new Error(`Background removal failed: ${error}`)
    }
  }

  /**
   * Validate uploaded image
   */
  static async validateImage(file: File): Promise<{ valid: boolean; error?: string }> {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

    // Check size
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large. Maximum size is 10MB' }
    }

    // Check type
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Use JPG, PNG, or WEBP' }
    }

    return { valid: true }
  }

  /**
   * Get image dimensions using sharp
   */
  static async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    try {
      const metadata = await sharp(buffer).metadata()
      return {
        width: metadata.width || 0,
        height: metadata.height || 0
      }
    } catch (error) {
      console.error('Error getting image dimensions:', error)
      return { width: 0, height: 0 }
    }
  }

  /**
   * Save file to local storage (public/uploads)
   */
  static async saveFile(
    buffer: Buffer,
    filename: string,
    subfolder: 'original' | 'processed'
  ): Promise<string> {
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', subfolder)

      // Create directory if not exists
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      // Generate unique filename with timestamp
      const timestamp = Date.now()
      const ext = path.extname(filename)
      const name = path.basename(filename, ext)
      const uniqueFilename = `${name}_${timestamp}${ext}`
      const filePath = path.join(uploadDir, uniqueFilename)

      // Save file
      await writeFile(filePath, buffer)

      // Return relative path (for use with /uploads/)
      const relativePath = `/uploads/${subfolder}/${uniqueFilename}`
      return relativePath
    } catch (error) {
      console.error('Error saving file:', error)
      throw new Error(`Failed to save file: ${error}`)
    }
  }

  /**
   * Download image from URL and return as buffer
   */
  static async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error('Error downloading image:', error)
      throw new Error(`Failed to download image: ${error}`)
    }
  }

  /**
   * Resize image if it exceeds the maximum pixel count for Replicate GPU
   * Replicate's Real-ESRGAN has a limit of ~2 million pixels
   * @param dataUrl - Base64 data URL of the image
   * @param maxPixels - Maximum number of pixels allowed (default 2 million)
   * @returns Resized data URL if needed, or original if within limits
   */
  static async resizeForUpscale(dataUrl: string, maxPixels: number = 2000000): Promise<string> {
    try {
      // Extract base64 data from data URL
      const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (!matches) {
        console.log('Invalid data URL format, returning as-is')
        return dataUrl
      }

      const mimeType = matches[1]
      const base64Data = matches[2]
      const buffer = Buffer.from(base64Data, 'base64')

      // Get image dimensions
      const metadata = await sharp(buffer).metadata()
      const width = metadata.width || 0
      const height = metadata.height || 0
      const totalPixels = width * height

      console.log(`Image dimensions: ${width}x${height} = ${totalPixels} pixels (max: ${maxPixels})`)

      // If within limits, return original
      if (totalPixels <= maxPixels) {
        return dataUrl
      }

      // Calculate resize ratio to fit within maxPixels
      const ratio = Math.sqrt(maxPixels / totalPixels)
      const newWidth = Math.floor(width * ratio)
      const newHeight = Math.floor(height * ratio)

      console.log(`Resizing image from ${width}x${height} to ${newWidth}x${newHeight} for upscaling`)

      // Resize image
      const resizedBuffer = await sharp(buffer)
        .resize(newWidth, newHeight, { fit: 'inside' })
        .png() // Use PNG to preserve quality
        .toBuffer()

      // Convert back to data URL
      const resizedBase64 = resizedBuffer.toString('base64')
      return `data:image/png;base64,${resizedBase64}`
    } catch (error) {
      console.error('Error resizing image for upscale:', error)
      // Return original on error
      return dataUrl
    }
  }

  /**
   * Upscale image using Replicate Real-ESRGAN
   * @param dataUrl - Base64 data URL of the image
   * @param scale - Upscale factor (2, 4, or 8)
   * @param faceEnhance - Whether to enable face enhancement (uses Real-ESRGAN's built-in GFPGAN)
   * @returns URL of the upscaled image
   */
  static async upscaleImage(
    dataUrl: string,
    scale: 2 | 4 | 8,
    faceEnhance: boolean = false
  ): Promise<string> {
    try {
      // Adjust max pixels based on scale to prevent GPU OOM errors
      // Higher scales require more GPU memory, so we need smaller input images
      // 8x with face_enhance is the most memory intensive
      let maxPixels: number
      if (scale === 8) {
        maxPixels = faceEnhance ? 250000 : 500000  // ~500x500 or ~700x700 max
      } else if (scale === 4) {
        maxPixels = faceEnhance ? 1000000 : 1500000  // ~1000x1000 or ~1200x1200 max
      } else {
        maxPixels = 2000000  // ~1400x1400 max for 2x
      }

      const resizedDataUrl = await this.resizeForUpscale(dataUrl, maxPixels)

      // Use Real-ESRGAN with built-in face_enhance option
      // This is more stable than separate GFPGAN model which has upload errors
      return await this.upscaleWithRealESRGAN(resizedDataUrl, scale, faceEnhance)
    } catch (error) {
      console.error('Replicate upscaling failed:', error)
      throw error
    }
  }

  /**
   * Upscale using Real-ESRGAN (general upscaling)
   * Uses built-in face_enhance option instead of separate GFPGAN model
   * to avoid "Cog: Got error trying to upload output files" errors
   */
  private static async upscaleWithRealESRGAN(
    dataUrl: string,
    scale: 2 | 4 | 8,
    faceEnhance: boolean = false
  ): Promise<string> {
    console.log(`Starting Real-ESRGAN ${scale}x upscale (face_enhance=${faceEnhance})...`)

    const output = await this.replicate.run(
      "nightmareai/real-esrgan:b3ef194191d13140337468c916c2c5b96dd0cb06dffc032a022a31807f6a5ea8",
      {
        input: {
          image: dataUrl,
          scale: scale,
          face_enhance: faceEnhance,
        },
      }
    )

    const resultUrl = typeof output === 'string' ? output : String(output)
    console.log('Image upscaled via Replicate Real-ESRGAN')
    return resultUrl
  }

  /**
   * Premium upscale using Clarity Upscaler (best quality, $0.017/run)
   * Best for: portraits, general images, detailed photos
   */
  static async upscaleWithClarity(
    dataUrl: string,
    scale: number = 2,
    creativity: number = 0.35
  ): Promise<string> {
    console.log(`Starting Clarity Upscaler ${scale}x upscale...`)

    // Resize if too large (Clarity works best with reasonable input sizes)
    const resizedDataUrl = await this.resizeForUpscale(dataUrl, 4000000) // 4MP limit for Clarity

    const output = await this.replicate.run(
      "philz1337x/clarity-upscaler",
      {
        input: {
          image: resizedDataUrl,
          scale_factor: scale,
          creativity: creativity,
          resemblance: 0.6,
          dynamic: 6,
          output_format: "png",
        },
      }
    )

    const resultUrl = typeof output === 'string' ? output : String(output)
    console.log('Image upscaled via Clarity Upscaler')
    return resultUrl
  }

  /**
   * Product upscale using Recraft Crisp (best for e-commerce, $0.002/run)
   * Best for: product photos, text/logos, e-commerce images
   * Preserves text, labels, and fine details without distortion
   */
  static async upscaleWithRecraftCrisp(dataUrl: string): Promise<string> {
    console.log('Starting Recraft Crisp upscale (best for products)...')

    // Recraft accepts max 4MP input, 4096px max dimension
    const resizedDataUrl = await this.resizeForUpscale(dataUrl, 4000000)

    const output = await this.replicate.run(
      "recraft-ai/recraft-crisp-upscale",
      {
        input: {
          image: resizedDataUrl,
        },
      }
    )

    const resultUrl = typeof output === 'string' ? output : String(output)
    console.log('Image upscaled via Recraft Crisp')
    return resultUrl
  }

  /**
   * Advanced upscale with intelligent model selection
   * Automatically chooses the best model based on image type and scale
   *
   * @param dataUrl - Base64 data URL of the image
   * @param scale - Upscale factor (2, 4, or 8)
   * @param imageType - Type of image: 'product' | 'portrait' | 'general'
   * @returns URL of the upscaled image
   */
  static async upscaleAdvanced(
    dataUrl: string,
    scale: 2 | 4 | 8,
    imageType: 'product' | 'portrait' | 'general' = 'general'
  ): Promise<string> {
    console.log(`Starting advanced upscale: ${scale}x, type=${imageType}`)

    try {
      switch (imageType) {
        case 'product':
          // Product photos: Use Recraft Crisp (best for text/logos/details)
          // Recraft does ~4x, so for 8x we chain: Recraft 4x -> Recraft 2x
          if (scale === 8) {
            console.log('Product 8x: Chaining Recraft Crisp 4x -> 2x')
            const firstPass = await this.upscaleWithRecraftCrisp(dataUrl)
            const firstPassDataUrl = await this.urlToDataUrl(firstPass)
            return await this.upscaleWithRecraftCrisp(firstPassDataUrl)
          } else {
            // 2x and 4x: Single Recraft pass
            return await this.upscaleWithRecraftCrisp(dataUrl)
          }

        case 'portrait':
          // Portraits: Use CodeFormer for face enhancement + Clarity for upscale
          console.log('Portrait: CodeFormer face restoration + Clarity upscale')
          const faceRestored = await this.restoreFace(dataUrl, 0.7)
          if (scale <= 2) {
            return faceRestored // CodeFormer already does 2x
          }
          // For 4x/8x: Additional upscale with Clarity
          const faceDataUrl = await this.urlToDataUrl(faceRestored)
          const clarityScale = scale === 8 ? 4 : 2 // 2x from CodeFormer * 2/4 from Clarity
          return await this.upscaleWithClarity(faceDataUrl, clarityScale, 0.25)

        case 'general':
        default:
          // General images: Use Clarity for quality or Real-ESRGAN for speed
          if (scale === 8) {
            // 8x: Use Real-ESRGAN (native 8x support)
            return await this.upscaleImage(dataUrl, 8, false)
          } else {
            // 2x/4x: Use Clarity for best quality
            return await this.upscaleWithClarity(dataUrl, scale, 0.35)
          }
      }
    } catch (error) {
      console.error(`Advanced upscale failed for ${imageType}:`, error)
      // Fallback to Real-ESRGAN
      console.log('Falling back to Real-ESRGAN...')
      return await this.upscaleImage(dataUrl, scale, false)
    }
  }

  /**
   * Convert image URL to data URL for chaining operations
   */
  private static async urlToDataUrl(url: string): Promise<string> {
    const buffer = await this.downloadImage(url)
    const base64 = buffer.toString('base64')
    // Detect format from buffer magic bytes
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50
    const mimeType = isPng ? 'image/png' : 'image/jpeg'
    return `data:${mimeType};base64,${base64}`
  }

  /**
   * Fast upscale using fal.ai AuraSR v2 (good quality, cheap/free)
   * Best for: quick upscales, AI-generated images
   */
  static async upscaleWithAuraSR(dataUrl: string): Promise<string> {
    const falApiKey = process.env.FAL_API_KEY
    if (!falApiKey) {
      throw new Error('FAL_API_KEY not configured')
    }

    console.log('Starting AuraSR v2 4x upscale...')

    // Use synchronous endpoint for faster response
    const response = await fetch('https://fal.run/fal-ai/aura-sr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${falApiKey}`,
      },
      body: JSON.stringify({
        image_url: dataUrl,
        overlapping_tiles: true, // Reduces seams
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`AuraSR failed: ${error}`)
    }

    const result = await response.json()
    const imageUrl = result.image?.url || result.output?.url

    if (!imageUrl) {
      throw new Error('No image URL in AuraSR response')
    }

    console.log('Image upscaled via AuraSR v2')
    return imageUrl
  }

  /**
   * Face restoration using CodeFormer (best for faces)
   */
  static async restoreFace(dataUrl: string, fidelity: number = 0.7): Promise<string> {
    console.log('Starting CodeFormer face restoration...')

    const resizedDataUrl = await this.resizeForUpscale(dataUrl)

    const output = await this.replicate.run(
      "sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",
      {
        input: {
          image: resizedDataUrl,
          codeformer_fidelity: fidelity,
          background_enhance: true,
          face_upsample: true,
          upscale: 2,
        },
      }
    )

    const resultUrl = typeof output === 'string' ? output : String(output)
    console.log('Face restored via CodeFormer')
    return resultUrl
  }

  /**
   * Old photo restoration using FLUX Kontext ($0.04/run)
   * Fixes scratches, damage, and can colorize
   */
  static async restoreOldPhoto(dataUrl: string): Promise<string> {
    console.log('Starting FLUX Kontext photo restoration...')

    const resizedDataUrl = await this.resizeForUpscale(dataUrl)

    const output = await this.replicate.run(
      "flux-kontext-apps/restore-image",
      {
        input: {
          image: resizedDataUrl,
          output_format: "png",
        },
      }
    )

    const resultUrl = typeof output === 'string' ? output : String(output)
    console.log('Photo restored via FLUX Kontext')
    return resultUrl
  }

  /**
   * Professional studio relighting using ICLight V2 ($0.1/megapixel)
   * Perfect for packshots - adds dramatic studio lighting
   */
  static async relightForPackshot(dataUrl: string, lightingPrompt: string): Promise<string> {
    const falApiKey = process.env.FAL_API_KEY
    if (!falApiKey) {
      throw new Error('FAL_API_KEY not configured')
    }

    console.log('Starting ICLight V2 studio relighting...')

    // Submit request to Fal.ai ICLight V2
    const submitResponse = await fetch('https://queue.fal.run/fal-ai/iclight-v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${falApiKey}`,
      },
      body: JSON.stringify({
        image_url: dataUrl,
        prompt: lightingPrompt,
        num_inference_steps: 35,
        guidance_scale: 7,
        enable_hr_fix: true,
        output_format: 'png',
      }),
    })

    if (!submitResponse.ok) {
      const error = await submitResponse.text()
      throw new Error(`ICLight V2 submit failed: ${error}`)
    }

    const submitData = await submitResponse.json()
    const requestId = submitData.request_id

    if (!requestId) {
      throw new Error('No request_id returned from ICLight V2')
    }

    // Poll for result
    let attempts = 0
    const maxAttempts = 120 // 2 minutes max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const statusResponse = await fetch(
        `https://queue.fal.run/fal-ai/iclight-v2/requests/${requestId}/status`,
        {
          headers: {
            'Authorization': `Key ${falApiKey}`,
          },
        }
      )

      if (!statusResponse.ok) {
        attempts++
        continue
      }

      const statusData = await statusResponse.json()

      if (statusData.status === 'COMPLETED') {
        const resultResponse = await fetch(
          `https://queue.fal.run/fal-ai/iclight-v2/requests/${requestId}`,
          {
            headers: {
              'Authorization': `Key ${falApiKey}`,
            },
          }
        )

        if (!resultResponse.ok) {
          throw new Error('Failed to get result from ICLight V2')
        }

        const resultData = await resultResponse.json()

        // ICLight V2 returns { images: [{ url: "..." }] }
        if (resultData.images?.[0]?.url) {
          console.log('Product relit via ICLight V2')
          return resultData.images[0].url
        }

        throw new Error('No image URL in ICLight V2 response')
      }

      if (statusData.status === 'FAILED') {
        throw new Error(`ICLight V2 processing failed: ${statusData.error || 'Unknown error'}`)
      }

      attempts++
    }

    throw new Error('ICLight V2 processing timeout')
  }

  /**
   * Professional packshot using Photoroom API ($0.10/image)
   * Industry standard - removes background, adds shadow, beautifies product
   */
  static async generatePackshotPhotoroom(
    imageBuffer: Buffer,
    backgroundColor: string = 'FFFFFF'
  ): Promise<Buffer> {
    const photoroomApiKey = process.env.PHOTOROOM_API_KEY
    if (!photoroomApiKey) {
      throw new Error('PHOTOROOM_API_KEY not configured')
    }

    console.log('Starting Photoroom packshot generation...')

    // Create form data with image
    const formData = new FormData()
    const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/png' })
    formData.append('imageFile', blob, 'image.png')
    formData.append('removeBackground', 'true')
    formData.append('background.color', backgroundColor)
    formData.append('shadow.mode', 'ai.hard') // Hard AI shadow - more visible
    formData.append('padding', '0.15') // 15% padding for shadow visibility
    formData.append('outputSize', '2000x2000')

    const response = await fetch('https://image-api.photoroom.com/v2/edit', {
      method: 'POST',
      headers: {
        'x-api-key': photoroomApiKey,
        'Accept': 'image/png',
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Photoroom error:', error)
      throw new Error(`Photoroom failed: ${error}`)
    }

    // Response is the image directly
    const resultBuffer = Buffer.from(await response.arrayBuffer())
    console.log('Packshot generated via Photoroom')
    return resultBuffer
  }

  /**
   * Faithful upscale using Sharp with Lanczos algorithm (no AI)
   * Perfect for: service parts, technical diagrams, documents, images with text
   * Preserves exact pixel detail without AI interpretation/hallucination
   * FREE - 0 credits, runs locally
   *
   * @param buffer - Image buffer
   * @param scale - Upscale factor (2, 4, or 8)
   * @returns Upscaled image buffer
   */
  static async upscaleFaithful(
    buffer: Buffer,
    scale: 2 | 4 | 8
  ): Promise<Buffer> {
    console.log(`Starting faithful upscale ${scale}x using Sharp Lanczos...`)

    try {
      // Get original dimensions
      const metadata = await sharp(buffer).metadata()
      const originalWidth = metadata.width || 0
      const originalHeight = metadata.height || 0

      if (originalWidth === 0 || originalHeight === 0) {
        throw new Error('Could not determine image dimensions')
      }

      // Calculate new dimensions
      const newWidth = originalWidth * scale
      const newHeight = originalHeight * scale

      // Maximum output resolution (10000x10000 for free tier)
      const maxDimension = 10000
      let finalWidth = newWidth
      let finalHeight = newHeight

      // Cap to max resolution while maintaining aspect ratio
      if (finalWidth > maxDimension || finalHeight > maxDimension) {
        const ratio = Math.min(maxDimension / finalWidth, maxDimension / finalHeight)
        finalWidth = Math.floor(finalWidth * ratio)
        finalHeight = Math.floor(finalHeight * ratio)
        console.log(`Capping output to ${finalWidth}x${finalHeight} (max ${maxDimension}px)`)
      }

      console.log(`Upscaling from ${originalWidth}x${originalHeight} to ${finalWidth}x${finalHeight}`)

      // Upscale using Lanczos3 kernel (best quality for sharp edges and text)
      const upscaledBuffer = await sharp(buffer)
        .resize(finalWidth, finalHeight, {
          kernel: sharp.kernel.lanczos3,
          fit: 'fill',
          withoutEnlargement: false,
        })
        .png({ quality: 100 }) // Lossless PNG output
        .toBuffer()

      console.log('Image upscaled via Sharp Lanczos (faithful, no AI)')
      return upscaledBuffer
    } catch (error) {
      console.error('Faithful upscale failed:', error)
      throw new Error(`Faithful upscale failed: ${error}`)
    }
  }

  /**
   * Professional packshot with AI-generated background using Photoroom API
   * Creates studio-quality product photography with custom AI backgrounds
   */
  static async generatePackshotWithAIBackground(
    imageBuffer: Buffer,
    backgroundPrompt: string
  ): Promise<Buffer> {
    const photoroomApiKey = process.env.PHOTOROOM_API_KEY
    if (!photoroomApiKey) {
      throw new Error('PHOTOROOM_API_KEY not configured')
    }

    console.log('Starting Photoroom AI background generation...', backgroundPrompt)

    // Create form data with image
    const formData = new FormData()
    const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/png' })
    formData.append('imageFile', blob, 'image.png')
    formData.append('removeBackground', 'true')
    formData.append('background.prompt', backgroundPrompt)
    formData.append('shadow.mode', 'ai.soft')
    formData.append('padding', '0.1')
    formData.append('outputSize', '2000x2000')

    const response = await fetch('https://image-api.photoroom.com/v2/edit', {
      method: 'POST',
      headers: {
        'x-api-key': photoroomApiKey,
        'Accept': 'image/png',
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Photoroom AI background error:', error)
      throw new Error(`Photoroom AI background failed: ${error}`)
    }

    const resultBuffer = Buffer.from(await response.arrayBuffer())
    console.log('AI background packshot generated via Photoroom')
    return resultBuffer
  }
}
