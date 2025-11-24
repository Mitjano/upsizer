import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { ProcessedImagesDB } from '@/lib/processed-images-db'
import { auth } from '@/lib/auth'

/**
 * View image (original or processed)
 * Serves the image file from filesystem
 * Query param: ?type=original or ?type=processed (default)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const imageType = searchParams.get('type') || 'processed'

    // Get session for auth
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get image record
    const image = await ProcessedImagesDB.getById(id)

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (image.userId !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Determine which path to use
    let imagePath: string
    if (imageType === 'original') {
      imagePath = image.originalPath
    } else {
      // Check if processed
      if (!image.isProcessed || !image.processedPath) {
        return NextResponse.json(
          { error: 'Image not yet processed' },
          { status: 404 }
        )
      }
      imagePath = image.processedPath
    }

    // Read file from filesystem
    const filePath = path.join(process.cwd(), 'public', imagePath)
    const fileBuffer = await readFile(filePath)

    // Determine content type from extension
    const ext = path.extname(imagePath).toLowerCase()
    const contentType = ext === '.png' ? 'image/png' :
                        ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                        ext === '.webp' ? 'image/webp' : 'image/png'

    // Return image
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving image:', error)
    return NextResponse.json(
      { error: 'Failed to load image' },
      { status: 500 }
    )
  }
}
