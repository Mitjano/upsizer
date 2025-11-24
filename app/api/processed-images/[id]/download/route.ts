import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserByEmail } from '@/lib/db'
import { ProcessedImagesDB } from '@/lib/processed-images-db'
import { readFile } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

type Resolution = 'low' | 'medium' | 'high' | 'original'
type Format = 'png' | 'jpg'

/**
 * GET /api/processed-images/[id]/download
 * Download processed image with resolution and format options
 * Query params:
 * - resolution: low (512px), medium (1024px), high (2048px), original
 * - format: png, jpg
 *
 * Free users: Limited to low resolution and PNG only
 * Premium/Admin: All options available
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user to check tier
    const user = getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get query params
    const { searchParams } = new URL(req.url)
    const resolution = (searchParams.get('resolution') || 'low') as Resolution
    const format = (searchParams.get('format') || 'png') as Format

    // Check tier-based restrictions
    const isFreeUser = user.role === 'user'
    const isPremiumOrAdmin = user.role === 'premium' || user.role === 'admin'

    if (isFreeUser) {
      // Free users can only download low resolution PNG
      if (resolution !== 'low' || format !== 'png') {
        return NextResponse.json(
          {
            error: 'Premium feature',
            message: 'Free users can only download low resolution PNG images. Upgrade to Premium for more options.'
          },
          { status: 403 }
        )
      }
    }

    // Await params as required in Next.js 15
    const { id } = await params

    const image = await ProcessedImagesDB.getById(id)

    if (!image || image.userId !== session.user.email) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    if (!image.isProcessed || !image.processedPath) {
      return NextResponse.json(
        { error: 'Image not processed yet' },
        { status: 400 }
      )
    }

    // Read file from public directory
    const filePath = path.join(process.cwd(), 'public', image.processedPath)

    try {
      const fileBuffer = await readFile(filePath)

      // Determine target resolution
      let targetWidth: number | null = null
      switch (resolution) {
        case 'low':
          targetWidth = 512
          break
        case 'medium':
          targetWidth = 1024
          break
        case 'high':
          targetWidth = 2048
          break
        case 'original':
          targetWidth = null // Keep original size
          break
      }

      // Process image with sharp
      let sharpInstance = sharp(fileBuffer)

      // Resize if needed
      if (targetWidth) {
        sharpInstance = sharpInstance.resize(targetWidth, null, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }

      // Convert format and get buffer
      let processedBuffer: Buffer
      if (format === 'jpg') {
        // Convert to JPEG with white background (since JPG doesn't support transparency)
        processedBuffer = await sharpInstance
          .flatten({ background: '#ffffff' })
          .jpeg({ quality: 90 })
          .toBuffer()
      } else {
        // Keep as PNG with transparency
        processedBuffer = await sharpInstance
          .png({ compressionLevel: 9 })
          .toBuffer()
      }

      // Generate filename
      const originalName = path.basename(image.originalFilename, path.extname(image.originalFilename))
      const filename = `${originalName}_${resolution}_bg-removed.${format}`

      // Determine content type
      const contentType = format === 'png' ? 'image/png' : 'image/jpeg'

      // Return file with proper headers
      return new NextResponse(processedBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      })
    } catch (fileError) {
      console.error('File processing error:', filePath, fileError)
      return NextResponse.json(
        { error: 'Failed to process file for download' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error downloading image:', error)
    return NextResponse.json(
      { error: 'Failed to download image' },
      { status: 500 }
    )
  }
}
