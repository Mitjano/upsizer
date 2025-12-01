/**
 * Bulk Processing API
 * POST /api/bulk - Create a new bulk processing job
 * GET /api/bulk - Get user's bulk jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  createBulkJob,
  getUserBulkJobs,
  calculateCreditsForJob,
  getUserBulkStats,
  type ProcessingType,
  type BulkJobStatus,
} from '@/lib/bulk-processor';
import { getUserByEmail, updateUser } from '@/lib/db';

// Maximum images per bulk job
const MAX_IMAGES_PER_JOB = 100;
const ALLOWED_TYPES: ProcessingType[] = ['upscale', 'enhance', 'restore', 'background_remove', 'compress'];

/**
 * POST /api/bulk
 * Create a new bulk processing job
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id || session.user.email;
    const body = await request.json();

    const {
      type,
      imageUrls,
      settings = {},
    } = body as {
      type: ProcessingType;
      imageUrls: string[];
      settings?: {
        scale?: number;
        preset?: string;
        faceEnhance?: boolean;
        outputFormat?: string;
      };
    };

    // Validate type
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate imageUrls
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'imageUrls is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    if (imageUrls.length > MAX_IMAGES_PER_JOB) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES_PER_JOB} images per job` },
        { status: 400 }
      );
    }

    // Validate URLs
    const invalidUrls = imageUrls.filter((url) => {
      try {
        new URL(url);
        return false;
      } catch {
        return true;
      }
    });

    if (invalidUrls.length > 0) {
      return NextResponse.json(
        { error: 'Invalid URLs provided', invalidUrls },
        { status: 400 }
      );
    }

    // Check user credits
    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const estimatedCredits = calculateCreditsForJob(
      type,
      imageUrls.length,
      settings?.scale
    );

    if ((user.credits || 0) < estimatedCredits) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: estimatedCredits,
          available: user.credits || 0,
        },
        { status: 402 }
      );
    }

    // Create the bulk job
    const job = await createBulkJob({
      userId,
      type,
      imageUrls,
      settings,
    });

    // Reserve credits (deduct estimated amount)
    await updateUser(user.id, {
      credits: (user.credits || 0) - estimatedCredits,
    });

    return NextResponse.json({
      job,
      message: 'Bulk job created successfully',
      estimatedCredits,
      creditsRemaining: (user.credits || 0) - estimatedCredits,
    }, { status: 201 });
  } catch (error) {
    console.error('Bulk POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create bulk job' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bulk
 * Get user's bulk jobs with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id || session.user.email;
    const { searchParams } = new URL(request.url);

    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status') as BulkJobStatus | null;
    const includeStats = searchParams.get('stats') === 'true';

    const { jobs, total } = getUserBulkJobs(userId, {
      limit,
      offset,
      status: status || undefined,
    });

    const response: {
      jobs: typeof jobs;
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
      stats?: ReturnType<typeof getUserBulkStats>;
    } = {
      jobs,
      total,
      limit,
      offset,
      hasMore: offset + jobs.length < total,
    };

    if (includeStats) {
      response.stats = getUserBulkStats(userId);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Bulk GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get bulk jobs' },
      { status: 500 }
    );
  }
}
