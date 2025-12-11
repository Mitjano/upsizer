/**
 * Admin Audit Logging System
 * Tracks all admin actions for security and compliance
 */

import { prisma } from './prisma';

// Check if Prisma is available
const isPrismaAvailable = (): boolean => {
  return process.env.USE_POSTGRES === 'true' && prisma !== null;
};

export type AuditAction =
  | 'user.view'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.credits.add'
  | 'user.credits.remove'
  | 'user.ban'
  | 'user.unban'
  | 'api_key.create'
  | 'api_key.revoke'
  | 'api_key.view'
  | 'feature_flag.update'
  | 'ticket.reply'
  | 'ticket.close'
  | 'ticket.assign'
  | 'blog.create'
  | 'blog.update'
  | 'blog.delete'
  | 'blog.publish'
  | 'backup.create'
  | 'backup.restore'
  | 'webhook.create'
  | 'webhook.update'
  | 'webhook.delete'
  | 'moderation.approve'
  | 'moderation.reject'
  | 'moderation.ban'
  | 'ab_test.create'
  | 'ab_test.update'
  | 'ab_test.delete'
  | 'email_template.update'
  | 'notification.send'
  | 'settings.update'
  | 'admin.login'
  | 'admin.logout';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  adminId: string;
  adminEmail: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// In-memory fallback storage for audit logs
const inMemoryAuditLogs: AuditLogEntry[] = [];
const MAX_MEMORY_LOGS = 10000;

/**
 * Log an admin action
 */
export async function logAdminAction(
  adminId: string,
  adminEmail: string,
  action: AuditAction,
  options?: {
    targetType?: string;
    targetId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  const entry: AuditLogEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    adminId,
    adminEmail,
    action,
    targetType: options?.targetType,
    targetId: options?.targetId,
    details: options?.details,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  };

  // Try to persist to database
  if (isPrismaAvailable()) {
    try {
      await prisma.auditLog.create({
        data: {
          adminId: entry.adminId,
          adminEmail: entry.adminEmail,
          action: entry.action,
          targetType: entry.targetType,
          targetId: entry.targetId,
          details: entry.details ? JSON.stringify(entry.details) : null,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
      return;
    } catch (error) {
      console.warn('Failed to save audit log to database, using fallback:', error);
    }
  }

  // Fallback to in-memory storage
  inMemoryAuditLogs.push(entry);

  // Prevent memory overflow
  if (inMemoryAuditLogs.length > MAX_MEMORY_LOGS) {
    inMemoryAuditLogs.shift();
  }

  // Also log to console for immediate visibility
  console.log(`[AUDIT] ${entry.timestamp.toISOString()} | ${entry.adminEmail} | ${entry.action} | ${entry.targetType || '-'}:${entry.targetId || '-'}`);
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(options?: {
  adminId?: string;
  action?: AuditAction;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  // Try database first
  if (isPrismaAvailable()) {
    try {
      const where: Record<string, unknown> = {};

      if (options?.adminId) where.adminId = options.adminId;
      if (options?.action) where.action = options.action;
      if (options?.targetType) where.targetType = options.targetType;
      if (options?.targetId) where.targetId = options.targetId;
      if (options?.startDate || options?.endDate) {
        where.createdAt = {};
        if (options?.startDate) (where.createdAt as Record<string, Date>).gte = options.startDate;
        if (options?.endDate) (where.createdAt as Record<string, Date>).lte = options.endDate;
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logs: logs.map((log: any) => ({
          id: log.id,
          timestamp: log.createdAt,
          adminId: log.adminId,
          adminEmail: log.adminEmail,
          action: log.action as AuditAction,
          targetType: log.targetType || undefined,
          targetId: log.targetId || undefined,
          details: log.details ? JSON.parse(log.details as string) : undefined,
          ipAddress: log.ipAddress || undefined,
          userAgent: log.userAgent || undefined,
        })),
        total,
      };
    } catch (error) {
      console.warn('Failed to fetch audit logs from database:', error);
    }
  }

  // Fallback to in-memory
  let filtered = [...inMemoryAuditLogs];

  if (options?.adminId) {
    filtered = filtered.filter((log) => log.adminId === options.adminId);
  }
  if (options?.action) {
    filtered = filtered.filter((log) => log.action === options.action);
  }
  if (options?.targetType) {
    filtered = filtered.filter((log) => log.targetType === options.targetType);
  }
  if (options?.targetId) {
    filtered = filtered.filter((log) => log.targetId === options.targetId);
  }
  if (options?.startDate) {
    filtered = filtered.filter((log) => log.timestamp >= options.startDate!);
  }
  if (options?.endDate) {
    filtered = filtered.filter((log) => log.timestamp <= options.endDate!);
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return {
    logs: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
}

/**
 * Helper to extract request metadata for audit logging
 */
export function getRequestMetadata(request: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ipAddress = forwarded?.split(',')[0].trim() || realIp || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  return { ipAddress, userAgent };
}

/**
 * Delete old audit logs (retention policy)
 */
export async function cleanupOldAuditLogs(retentionDays: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  if (isPrismaAvailable()) {
    try {
      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });
      return result.count;
    } catch (error) {
      console.error('Failed to cleanup old audit logs:', error);
    }
  }

  // Cleanup in-memory logs
  const before = inMemoryAuditLogs.length;
  const cutoffTime = cutoffDate.getTime();

  for (let i = inMemoryAuditLogs.length - 1; i >= 0; i--) {
    if (inMemoryAuditLogs[i].timestamp.getTime() < cutoffTime) {
      inMemoryAuditLogs.splice(i, 1);
    }
  }

  return before - inMemoryAuditLogs.length;
}
