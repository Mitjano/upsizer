import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { ProcessedImagesDB } from '@/lib/processed-images-db'
import { auth } from '@/lib/auth'
import { validateSafePath } from '@/lib/security'

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

    // Delete files from filesystem with path validation
    // Remove leading slash if present (paths stored as /uploads/...)
    try {
      // Validate and delete original file
      const originalRelative = image.originalPath.startsWith('/') ? image.originalPath.slice(1) : image.originalPath
      const originalValidation = validateSafePath(originalRelative)
      if (originalValidation.valid) {
        await unlink(originalValidation.safePath).catch(() => {
          // Ignore error if file doesn't exist
        })
      }

      // Validate and delete processed file if it exists
      if (image.processedPath) {
        const processedRelative = image.processedPath.startsWith('/') ? image.processedPath.slice(1) : image.processedPath
        const processedValidation = validateSafePath(processedRelative)
        if (processedValidation.valid) {
          await unlink(processedValidation.safePath).catch(() => {
            // Ignore error if file doesn't exist
          })
        }
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
