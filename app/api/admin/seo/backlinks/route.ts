/**
 * Backlinks API
 * GET - Get all backlinks
 * POST - Add a new backlink
 * DELETE - Delete a backlink
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backlinks = await prisma.backlink.findMany({
      orderBy: { firstSeen: 'desc' },
    });

    return NextResponse.json(backlinks);
  } catch (error) {
    console.error('Error fetching backlinks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backlinks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceUrl, targetUrl, anchorText } = await request.json();

    if (!sourceUrl) {
      return NextResponse.json(
        { error: 'Source URL is required' },
        { status: 400 }
      );
    }

    // Check if backlink already exists
    const existing = await prisma.backlink.findFirst({
      where: { sourceUrl },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Backlink already exists' },
        { status: 400 }
      );
    }

    const backlink = await prisma.backlink.create({
      data: {
        sourceUrl,
        sourceDomain: extractDomain(sourceUrl),
        targetUrl: targetUrl || 'https://pixelift.pl',
        anchorText,
        status: 'pending',
        isDoFollow: true, // Default, will be checked later
      },
    });

    return NextResponse.json(backlink);
  } catch (error) {
    console.error('Error adding backlink:', error);
    return NextResponse.json(
      { error: 'Failed to add backlink' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Backlink ID is required' },
        { status: 400 }
      );
    }

    await prisma.backlink.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting backlink:', error);
    return NextResponse.json(
      { error: 'Failed to delete backlink' },
      { status: 500 }
    );
  }
}
