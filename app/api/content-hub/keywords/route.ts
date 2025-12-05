import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/content-hub/keywords - List all keywords with filtering
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');
    const status = searchParams.get('status');
    const cluster = searchParams.get('cluster');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (locale) {
      where.locale = locale;
    }
    if (status) {
      where.status = status;
    }
    if (cluster) {
      where.cluster = cluster;
    }
    if (search) {
      where.keyword = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Get total count
    const total = await prisma.keywordBank.count({ where });

    // Get keywords with pagination
    const keywords = await prisma.keywordBank.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        usedInArticles: {
          include: {
            contentPlan: {
              select: {
                id: true,
                title: true,
                status: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      keywords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}

// POST /api/content-hub/keywords - Add new keyword(s)
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get default locale and cluster from body
    const defaultLocale = body.locale || 'en';
    const defaultCluster = body.cluster;

    // Support multiple formats:
    // 1. { keywords: ["kw1", "kw2"], locale: "en" } - array of strings
    // 2. { keywords: [{keyword: "kw1"}, {keyword: "kw2"}] } - array of objects
    // 3. { keyword: "kw1", locale: "en" } - single keyword
    let keywordsToAdd: Array<{ keyword: string; locale?: string; cluster?: string }> = [];

    if (Array.isArray(body.keywords)) {
      keywordsToAdd = body.keywords.map((k: string | { keyword: string; locale?: string; cluster?: string }) => {
        if (typeof k === 'string') {
          return { keyword: k, locale: defaultLocale, cluster: defaultCluster };
        }
        return { ...k, locale: k.locale || defaultLocale, cluster: k.cluster || defaultCluster };
      });
    } else if (body.keyword) {
      keywordsToAdd = [{ keyword: body.keyword, locale: defaultLocale, cluster: defaultCluster }];
    }

    const results = {
      added: 0,
      duplicates: 0,
      errors: [] as string[]
    };

    for (const keywordData of keywordsToAdd) {
      try {
        const {
          keyword,
          locale = defaultLocale,
          cluster = defaultCluster,
        } = keywordData;

        const searchVolume = (keywordData as Record<string, unknown>).searchVolume as number | undefined;
        const difficulty = (keywordData as Record<string, unknown>).difficulty as number | undefined;
        const cpc = (keywordData as Record<string, unknown>).cpc as number | undefined;
        const intent = (keywordData as Record<string, unknown>).intent as string | undefined;
        const source = ((keywordData as Record<string, unknown>).source as string) || 'manual';
        const relatedKeywords = ((keywordData as Record<string, unknown>).relatedKeywords as string[]) || [];
        const serpFeatures = ((keywordData as Record<string, unknown>).serpFeatures as string[]) || [];
        const trend = (keywordData as Record<string, unknown>).trend as string | undefined;
        const priority = ((keywordData as Record<string, unknown>).priority as number) || 0;

        if (!keyword || typeof keyword !== 'string') {
          results.errors.push(`Invalid keyword: ${keyword}`);
          continue;
        }

        // Check if keyword already exists
        const existing = await prisma.keywordBank.findUnique({
          where: {
            keyword_locale: {
              keyword: keyword.toLowerCase().trim(),
              locale
            }
          }
        });

        if (existing) {
          results.duplicates++;
          continue;
        }

        // Create keyword
        await prisma.keywordBank.create({
          data: {
            keyword: keyword.toLowerCase().trim(),
            locale,
            searchVolume,
            difficulty,
            cpc,
            intent,
            cluster,
            source,
            relatedKeywords,
            serpFeatures,
            trend,
            priority,
            status: 'new'
          }
        });

        results.added++;
      } catch (err) {
        results.errors.push(`Failed to add ${keywordData.keyword}: ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error adding keywords:', error);
    return NextResponse.json(
      { error: 'Failed to add keywords' },
      { status: 500 }
    );
  }
}
