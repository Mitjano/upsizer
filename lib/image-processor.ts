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
   * Remove background from image using Replicate API
   * Uses BRIA RMBG 2.0 - professional quality background removal
   */
  static async removeBackground(dataUrl: string): Promise<string> {
    try {
      // Call Replicate API with BRIA RMBG 2.0 model (better quality than rembg)
      const output = await this.replicate.run(
        "bria-ai/bria-rmbg:d27e6dbcdae5e4d009ca4f7360f1fdbe7af1f07a3b0aa2f8a1e35e40f2eb9c99",
        {
          input: {
            image: dataUrl
          }
        }
      )

      // Output should be a string (URL to processed image)
      const resultUrl = typeof output === 'string' ? output : String(output)

      return resultUrl
    } catch (error) {
      console.error('Background removal failed:', error)
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
}
