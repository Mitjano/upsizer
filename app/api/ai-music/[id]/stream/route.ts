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

    // Check ownership or public visibility
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    const isOwner = user && music.userId === user.id;
    const isPublic = music.isPublic;

    if (!isOwner && !isPublic) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get Range header for partial content support
    const range = request.headers.get('range');

    // Try to serve from local file first
    if (music.localPath) {
      const fullPath = path.join(process.cwd(), music.localPath);
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        const fileSize = stat.size;

        if (range) {
          // Handle range request for seeking
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunkSize = end - start + 1;

          const fileBuffer = Buffer.alloc(chunkSize);
          const fd = fs.openSync(fullPath, 'r');
          fs.readSync(fd, fileBuffer, 0, chunkSize, start);
          fs.closeSync(fd);

          return new NextResponse(fileBuffer, {
            status: 206,
            headers: {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunkSize.toString(),
              'Content-Type': 'audio/mpeg',
            },
          });
        }

        // Full file
        const fileBuffer = fs.readFileSync(fullPath);
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': fileSize.toString(),
            'Accept-Ranges': 'bytes',
          },
        });
      }
    }

    // Fallback: fetch from external URL and proxy
    const audioUrl = music.audioUrl;
    if (!audioUrl) {
      return NextResponse.json(
        { error: 'Audio file not available' },
        { status: 404 }
      );
    }

    // Fetch from external CDN with range if provided
    const headers: HeadersInit = {};
    if (range) {
      headers['Range'] = range;
    }

    const response = await fetch(audioUrl, { headers });

    if (!response.ok && response.status !== 206) {
      return NextResponse.json(
        { error: 'Failed to fetch audio' },
        { status: 502 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const contentLength = response.headers.get('content-length');
    const contentRange = response.headers.get('content-range');

    const responseHeaders: HeadersInit = {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    };

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange;
    }

    return new NextResponse(arrayBuffer, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Music stream error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
