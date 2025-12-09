import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';

export async function GET(
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

    // Get music record
    const music = await prisma.generatedMusic.findUnique({
      where: { id },
    });

    if (!music) {
      return NextResponse.json(
        { error: 'Music not found' },
        { status: 404 }
      );
    }

    // Check ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user || music.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Try to serve from local file first
    if (music.localPath) {
      const fullPath = path.join(process.cwd(), music.localPath);
      if (fs.existsSync(fullPath)) {
        const fileBuffer = fs.readFileSync(fullPath);
        const filename = `${music.title || 'song'}.mp3`;

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            'Content-Length': fileBuffer.length.toString(),
          },
        });
      }
    }

    // Fallback: fetch from external URL and stream
    const audioUrl = music.audioUrl;
    if (!audioUrl) {
      return NextResponse.json(
        { error: 'Audio file not available' },
        { status: 404 }
      );
    }

    // Fetch from external CDN
    const response = await fetch(audioUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch audio' },
        { status: 502 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const filename = `${music.title || 'song'}.mp3`;

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Music download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
