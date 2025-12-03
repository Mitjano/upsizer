/**
 * Backlinks Check API
 * POST - Check status of all backlinks
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Check if a backlink is still present on the source page
async function checkBacklink(
  sourceUrl: string,
  targetUrl: string
): Promise<{ isActive: boolean; isDoFollow: boolean }> {
  try {
    const response = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { isActive: false, isDoFollow: false };
    }

    const html = await response.text();

    // Check if target URL is present in the HTML
    const targetDomain = new URL(targetUrl).hostname.replace('www.', '');
    const isActive = html.includes(targetUrl) || html.includes(targetDomain);

    // Check for nofollow attribute (simplified check)
    const isDoFollow = !html.includes('rel="nofollow"') ||
      (html.includes(targetUrl) && !html.toLowerCase().includes('nofollow'));

    return { isActive, isDoFollow };
  } catch {
    return { isActive: false, isDoFollow: false };
  }
}

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backlinks = await prisma.backlink.findMany();

    let active = 0;
    let lost = 0;

    // Check backlinks sequentially with small delays
    for (const bl of backlinks) {
      const result = await checkBacklink(bl.sourceUrl, bl.targetUrl);

      await prisma.backlink.update({
        where: { id: bl.id },
        data: {
          status: result.isActive ? 'active' : 'lost',
          isDoFollow: result.isDoFollow,
          lastChecked: new Date(),
        },
      });

      if (result.isActive) {
        active++;
      } else {
        lost++;
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json({
      checked: backlinks.length,
      active,
      lost,
    });
  } catch (error) {
    console.error('Error checking backlinks:', error);
    return NextResponse.json(
      { error: 'Failed to check backlinks' },
      { status: 500 }
    );
  }
}
