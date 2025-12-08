import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getMusicById, deleteMusicRecord, deleteMusicFile, updateFolderStats } from '@/lib/ai-music';

// GET - Get single track details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const music = await getMusicById(id);

    if (!music) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    // Check if private and not owner
    if (!music.isPublic) {
      const session = await auth();
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: 'Track not found' },
          { status: 404 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });

      if (!user || user.id !== music.userId) {
        return NextResponse.json(
          { error: 'Track not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ music });
  } catch (error) {
    console.error('Get track error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete track
export async function DELETE(
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
      select: { userId: true, localPath: true, masteredLocalPath: true, folderId: true },
    });

    if (!music || music.userId !== user.id) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    const folderId = music.folderId;

    // Delete files
    if (music.localPath) {
      try {
        await deleteMusicFile(music.localPath);
      } catch (e) {
        console.error('Failed to delete original file:', e);
      }
    }
    if (music.masteredLocalPath) {
      try {
        await deleteMusicFile(music.masteredLocalPath);
      } catch (e) {
        console.error('Failed to delete mastered file:', e);
      }
    }

    // Delete database record
    await deleteMusicRecord(id);

    // Update folder stats if was in a folder
    if (folderId) {
      await updateFolderStats(folderId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete track error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
