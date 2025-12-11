import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { getAuditLogs, AuditAction } from '@/lib/audit-log';

/**
 * GET /api/admin/audit-logs - Get audit logs with filtering
 */
export async function GET(request: Request) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const { allowed, resetAt } = apiLimiter.check(clientId);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    // Auth check
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId') || undefined;
    const action = searchParams.get('action') as AuditAction | undefined;
    const targetType = searchParams.get('targetType') || undefined;
    const targetId = searchParams.get('targetId') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await getAuditLogs({
      adminId,
      action,
      targetType,
      targetId,
      startDate,
      endDate,
      limit: Math.min(limit, 100), // Max 100 per request
      offset,
    });

    return NextResponse.json({
      logs: result.logs,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
