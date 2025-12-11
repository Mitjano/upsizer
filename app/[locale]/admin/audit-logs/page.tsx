'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

const ACTION_LABELS: Record<string, string> = {
  'user.view': 'Viewed User',
  'user.create': 'Created User',
  'user.update': 'Updated User',
  'user.delete': 'Deleted User',
  'user.credits.add': 'Added Credits',
  'user.credits.remove': 'Removed Credits',
  'user.ban': 'Banned User',
  'user.unban': 'Unbanned User',
  'api_key.create': 'Created API Key',
  'api_key.revoke': 'Revoked API Key',
  'feature_flag.update': 'Updated Feature Flag',
  'ticket.reply': 'Replied to Ticket',
  'ticket.close': 'Closed Ticket',
  'blog.create': 'Created Blog Post',
  'blog.update': 'Updated Blog Post',
  'blog.delete': 'Deleted Blog Post',
  'backup.create': 'Created Backup',
  'backup.restore': 'Restored Backup',
  'admin.login': 'Admin Login',
};

export default function AuditLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    action: '',
    targetType: '',
    startDate: '',
    endDate: '',
  });

  const limit = 20;

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });

      if (filters.action) params.set('action', filters.action);
      if (filters.targetType) params.set('targetType', filters.targetType);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await res.json();

      if (res.ok) {
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.isAdmin) {
      router.push('/');
      return;
    }
    fetchLogs();
  }, [session, status, router, fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('delete') || action.includes('ban') || action.includes('revoke')) {
      return 'bg-red-500/20 text-red-400';
    }
    if (action.includes('create') || action.includes('add')) {
      return 'bg-green-500/20 text-green-400';
    }
    if (action.includes('update') || action.includes('reply')) {
      return 'bg-blue-500/20 text-blue-400';
    }
    return 'bg-gray-500/20 text-gray-400';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-gray-400 mt-1">Track all admin actions for security and compliance</p>
          </div>
          <div className="text-gray-400">
            Total: {total} entries
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Action</label>
              <select
                value={filters.action}
                onChange={(e) => {
                  setFilters({ ...filters, action: e.target.value });
                  setPage(0);
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="">All Actions</option>
                <option value="user.update">User Update</option>
                <option value="user.delete">User Delete</option>
                <option value="user.ban">User Ban</option>
                <option value="api_key.create">API Key Create</option>
                <option value="api_key.revoke">API Key Revoke</option>
                <option value="feature_flag.update">Feature Flag Update</option>
                <option value="blog.create">Blog Create</option>
                <option value="blog.update">Blog Update</option>
                <option value="backup.create">Backup Create</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Target Type</label>
              <select
                value={filters.targetType}
                onChange={(e) => {
                  setFilters({ ...filters, targetType: e.target.value });
                  setPage(0);
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="">All Types</option>
                <option value="user">User</option>
                <option value="api_key">API Key</option>
                <option value="feature_flag">Feature Flag</option>
                <option value="ticket">Ticket</option>
                <option value="blog">Blog</option>
                <option value="backup">Backup</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters({ ...filters, startDate: e.target.value });
                  setPage(0);
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  setFilters({ ...filters, endDate: e.target.value });
                  setPage(0);
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Timestamp</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Admin</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Target</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-750">
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-white">{log.adminEmail}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getActionBadgeColor(log.action)}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {log.targetType && (
                        <span>
                          {log.targetType}
                          {log.targetId && <span className="text-gray-500">:{log.targetId.slice(0, 8)}...</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
