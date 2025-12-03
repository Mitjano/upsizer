/**
 * SEO Locales API
 * GET - List all locales
 * PUT - Update locale (activate/deactivate)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SEO_LOCALES } from '@/lib/seo/locales';

// GET - List all SEO locales
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get locales from database
    let locales = await prisma.sEOLocale.findMany({
      orderBy: { priority: 'asc' },
      include: {
        _count: {
          select: { keywords: true },
        },
      },
    });

    // If no locales in DB, seed them first
    if (locales.length === 0) {
      for (const locale of SEO_LOCALES) {
        await prisma.sEOLocale.create({
          data: {
            code: locale.code,
            name: locale.name,
            nativeName: locale.nativeName,
            googleDomain: locale.googleDomain,
            googleHL: locale.googleHL,
            googleGL: locale.googleGL,
            flag: locale.flag,
            isActive: locale.isActive,
            priority: locale.priority,
          },
        });
      }

      locales = await prisma.sEOLocale.findMany({
        orderBy: { priority: 'asc' },
        include: {
          _count: {
            select: { keywords: true },
          },
        },
      });
    }

    return NextResponse.json({
      locales,
      activeCount: locales.filter(l => l.isActive).length,
      totalCount: locales.length,
    });
  } catch (error) {
    console.error('Error fetching locales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locales' },
      { status: 500 }
    );
  }
}

// PUT - Update locale
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, isActive, priority } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Locale code is required' },
        { status: 400 }
      );
    }

    const updatedLocale = await prisma.sEOLocale.update({
      where: { code },
      data: {
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(typeof priority === 'number' && { priority }),
      },
    });

    return NextResponse.json({ locale: updatedLocale });
  } catch (error) {
    console.error('Error updating locale:', error);
    return NextResponse.json(
      { error: 'Failed to update locale' },
      { status: 500 }
    );
  }
}
