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
          model: 'Portrait',  // Optimized for portraits - better hair/face edges
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
      // Resize image if too large for Replicate GPU (max ~2 million pixels)
      const resizedDataUrl = await this.resizeForUpscale(dataUrl)

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
      "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
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
   * Best for: portraits, products, detailed images
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
