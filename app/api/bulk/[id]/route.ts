/**
 * Single Bulk Job API
 * GET /api/bulk/[id] - Get bulk job details
 * DELETE /api/bulk/[id] - Cancel/delete a bulk job
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getBulkJobById,
  cancelBulkJob,
  deleteBulkJob,
} from '@/lib/bulk-processor';
import { getUserByEmail, updateUser } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/bulk/[id]
 * Get bulk job details and progress
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
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
    const userId = session.user.id || session.user.email;

    const job = getBulkJobById(id);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (job.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Bulk GET [id] error:', error);
    return NextResponse.json(
      { error: 'Failed to get bulk job' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bulk/[id]
 * Cancel or delete a bulk job
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
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
    const userId = session.user.id || session.user.email;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'cancel';

    const job = getBulkJobById(id);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (job.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (action === 'delete') {
      // Only allow deletion of completed, failed, or cancelled jobs
      if (job.status === 'processing' || job.status === 'pending') {
        return NextResponse.json(
          { error: 'Cannot delete a job in progress. Cancel it first.' },
          { status: 400 }
        );
      }

      const deleted = deleteBulkJob(id);

      if (!deleted) {
        return NextResponse.json(
          { error: 'Failed to delete job' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Job deleted successfully',
      });
    } else {
      // Cancel the job
      if (job.status === 'completed' || job.status === 'failed') {
        return NextResponse.json(
          { error: 'Cannot cancel a completed or failed job' },
          { status: 400 }
        );
      }

      if (job.status === 'cancelled') {
        return NextResponse.json(
          { error: 'Job is already cancelled' },
          { status: 400 }
        );
      }

      const cancelledJob = cancelBulkJob(id);

      if (!cancelledJob) {
        return NextResponse.json(
          { error: 'Failed to cancel job' },
          { status: 500 }
        );
      }

      // Refund unused credits
      const unusedCredits = job.estimatedCredits - job.actualCredits;
      if (unusedCredits > 0) {
        const user = await getUserByEmail(session.user.email);
        if (user) {
          await updateUser(user.id, {
            credits: (user.credits || 0) + unusedCredits,
          });
        }
      }

      return NextResponse.json({
        message: 'Job cancelled successfully',
        job: cancelledJob,
        refundedCredits: unusedCredits,
      });
    }
  } catch (error) {
    console.error('Bulk DELETE [id] error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
