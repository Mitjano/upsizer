import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { moveToFolder, updateFolderStats } from '@/lib/ai-music';

// POST - Move track to folder
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check ownership
    const music = await prisma.generatedMusic.findUnique({
      where: { id },
      select: { userId: true, folderId: true },
    });

    if (!music || music.userId !== user.id) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { folderId } = body;

    // If moving to a folder, verify folder ownership
    if (folderId) {
      const folder = await prisma.musicFolder.findUnique({
        where: { id: folderId },
        select: { userId: true },
      });

      if (!folder || folder.userId !== user.id) {
        return NextResponse.json(
          { error: 'Folder not found' },
          { status: 404 }
        );
      }
    }

    const oldFolderId = music.folderId;

    // Move track
    await moveToFolder(id, folderId);

    // Update folder stats for both old and new folders
    if (oldFolderId) {
      await updateFolderStats(oldFolderId);
    }
    if (folderId) {
      await updateFolderStats(folderId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Move track error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
