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
          model: 'General Use (Light)',
          operating_resolution: '1024x1024',
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
   * Upscale image using Replicate Real-ESRGAN or GFPGAN
   * @param dataUrl - Base64 data URL of the image
   * @param scale - Upscale factor (2, 4, or 8)
   * @param faceEnhance - Whether to use GFPGAN for face enhancement
   * @returns URL of the upscaled image
   */
  static async upscaleImage(
    dataUrl: string,
    scale: 2 | 4 | 8,
    faceEnhance: boolean = false
  ): Promise<string> {
    try {
      if (faceEnhance) {
        return await this.upscaleWithGFPGAN(dataUrl, scale)
      } else {
        return await this.upscaleWithRealESRGAN(dataUrl, scale)
      }
    } catch (error) {
      console.error('Replicate upscaling failed:', error)
      throw error
    }
  }

  /**
   * Upscale using Real-ESRGAN (general upscaling)
   */
  private static async upscaleWithRealESRGAN(
    dataUrl: string,
    scale: 2 | 4 | 8
  ): Promise<string> {
    console.log(`Starting Real-ESRGAN ${scale}x upscale...`)

    const output = await this.replicate.run(
      "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
      {
        input: {
          image: dataUrl,
          scale: scale,
          face_enhance: false,
        },
      }
    )

    const resultUrl = typeof output === 'string' ? output : String(output)
    console.log('Image upscaled via Replicate Real-ESRGAN')
    return resultUrl
  }

  /**
   * Upscale using GFPGAN (face enhancement + upscaling)
   */
  private static async upscaleWithGFPGAN(
    dataUrl: string,
    scale: 2 | 4 | 8
  ): Promise<string> {
    console.log(`Starting GFPGAN ${scale}x upscale with face enhancement...`)

    const output = await this.replicate.run(
      "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
      {
        input: {
          img: dataUrl,
          scale: scale,
          version: "v1.4",
        },
      }
    )

    const resultUrl = typeof output === 'string' ? output : String(output)
    console.log('Image upscaled via Replicate GFPGAN')
    return resultUrl
  }
}
