/**
 * Admin API - Get user's processed images
 * GET /api/admin/users/[id]/images
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ProcessedImagesDB } from '@/lib/processed-images-db';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get user from Prisma
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Try to get images from Prisma ImageHistory first
    let prismaImages: Array<{
      id: string;
      toolType: string;
      originalUrl: string;
      processedUrl: string | null;
      createdAt: string;
      filename?: string;
    }> = [];

    try {
      const imageHistory = await prisma.imageHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      prismaImages = imageHistory.map(img => ({
        id: img.id,
        toolType: img.type,
        originalUrl: img.originalUrl,
        processedUrl: img.processedUrl,
        createdAt: img.createdAt.toISOString(),
      }));
    } catch (err) {
      console.error('Error fetching from Prisma ImageHistory:', err);
    }

    // Also get from JSON DB (legacy)
    let jsonImages: Array<{
      id: string;
      toolType: string;
      originalUrl: string;
      processedUrl: string | null;
      createdAt: string;
      filename?: string;
    }> = [];

    try {
      const processedImages = await ProcessedImagesDB.getByUserId(user.email);
      jsonImages = processedImages.map(img => ({
        id: img.id,
        toolType: 'image_processing',
        originalUrl: img.originalPath,
        processedUrl: img.processedPath,
        createdAt: img.createdAt,
        filename: img.originalFilename,
      }));
    } catch (err) {
      console.error('Error fetching from ProcessedImagesDB:', err);
    }

    // Merge and deduplicate by timestamp (within 1 minute)
    const allImages = [...prismaImages];

    for (const jsonImg of jsonImages) {
      const jsonTime = new Date(jsonImg.createdAt).getTime();
      const isDuplicate = prismaImages.some(prismaImg => {
        const prismaTime = new Date(prismaImg.createdAt).getTime();
        return Math.abs(jsonTime - prismaTime) < 60000;
      });

      if (!isDuplicate) {
        allImages.push(jsonImg);
      }
    }

    // Sort by date descending
    allImages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ images: allImages });
  } catch (error) {
    console.error('Error fetching user images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user images' },
      { status: 500 }
    );
  }
}
