import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import path from 'path'
import { ProcessedImagesDB } from '@/lib/processed-images-db'
import { auth } from '@/lib/auth'

/**
 * DELETE /api/processed-images/[id]
 * Delete a processed image (both files and database record)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Delete files from filesystem
    try {
      // Delete original file
      const originalPath = path.join(process.cwd(), 'public', image.originalPath)
      await unlink(originalPath).catch(() => {
        // Ignore error if file doesn't exist
        console.warn(`Original file not found: ${originalPath}`)
      })

      // Delete processed file if it exists
      if (image.processedPath) {
        const processedPath = path.join(process.cwd(), 'public', image.processedPath)
        await unlink(processedPath).catch(() => {
          // Ignore error if file doesn't exist
          console.warn(`Processed file not found: ${processedPath}`)
        })
      }
    } catch (error) {
      console.error('Error deleting files:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete database record
    await ProcessedImagesDB.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}
