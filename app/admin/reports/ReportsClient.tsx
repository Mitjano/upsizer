"use client";

import { useState } from 'react';

interface Report {
  id: string;
  name: string;
  type: 'users' | 'usage' | 'revenue' | 'campaigns' | 'custom';
  format: 'pdf' | 'csv' | 'json';
  dateRange: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
  createdAt: string;
  createdBy: string;
  fileSize?: number;
  downloadCount: number;
  lastDownloadedAt?: string;
}

interface ReportsClientProps {
  reports: Report[];
  stats: {
    total: number;
    users: number;
    usage: number;
    revenue: number;
    campaigns: number;
    totalDownloads: number;
  };
}

export default function ReportsClient({ reports, stats }: ReportsClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'users' | 'usage' | 'revenue' | 'campaigns'>('users');
  const [format, setFormat] = useState<'pdf' | 'csv' | 'json'>('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name || !startDate || !endDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          format,
          dateRange: {
            start: startDate,
            end: endDate,
          },
          filters: {},
        }),
      });

      if (response.ok) {
        setName('');
        setType('users');
        setFormat('csv');
        setStartDate('');
        setEndDate('');
        setShowCreateModal(false);
        window.location.reload();
      } else {
        alert('Failed to create report');
      }
    } catch (error) {
      alert('Error creating report');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownload = async (id: string, name: string, format: string) => {
    try {
      const response = await fetch(`/api/admin/reports?action=generate&id=${id}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${name.replace(/[^a-z0-9]/gi, '_')}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Reload to update download count
        setTimeout(() => window.location.reload(), 500);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to download report');
      }
    } catch (error) {
      alert('Error downloading report');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete report "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/reports?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to delete report');
      }
    } catch (error) {
      alert('Error deleting report');
    }
  };

  const filteredReports = reports.filter(r => {
    if (filterType !== 'all' && r.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Reports Generator</h1>
          <p className="text-gray-400 text-lg">Generate and download comprehensive reports</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
        >
          + Generate Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
          <div className="text-sm text-blue-400 font-semibold mb-2">Total Reports</div>
          <div className="text-4xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-400 mt-2">{stats.totalDownloads} downloads</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-sm text-green-400 font-semibold mb-2">By Type</div>
          <div className="text-sm text-white space-y-1">
            <div>Users: <span className="font-bold">{stats.users}</span></div>
            <div>Usage: <span className="font-bold">{stats.usage}</span></div>
            <div>Revenue: <span className="font-bold">{stats.revenue}</span></div>
            <div>Campaigns: <span className="font-bold">{stats.campaigns}</span></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
          <div className="text-sm text-purple-400 font-semibold mb-2">Most Popular</div>
          <div className="text-2xl font-bold text-white">
            {reports.length > 0
              ? reports.reduce((max, r) => r.downloadCount > max.downloadCount ? r : max, reports[0]).name.substring(0, 20)
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="all">All Types</option>
          <option value="users">Users</option>
          <option value="usage">Usage</option>
          <option value="revenue">Revenue</option>
          <option value="campaigns">Campaigns</option>
        </select>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-400 text-lg">No reports generated yet</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{report.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      report.type === 'users' ? 'bg-blue-500/20 text-blue-400' :
                      report.type === 'usage' ? 'bg-green-500/20 text-green-400' :
                      report.type === 'revenue' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {report.type.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400">
                      {report.format.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Date Range: </span>
                      <span className="text-white">
                        {new Date(report.dateRange.start).toLocaleDateString()} - {new Date(report.dateRange.end).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">Created: </span>
                      <span className="text-white">{new Date(report.createdAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">By: </span>
                      <span className="text-white">{report.createdBy}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Downloads: </span>
                      <span className="text-white font-semibold">{report.downloadCount}</span>
                    </div>
                    {report.lastDownloadedAt && (
                      <div>
                        <span className="text-gray-500">Last download: </span>
                        <span className="text-white">{new Date(report.lastDownloadedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(report.id, report.name, report.format)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(report.id, report.name)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Generate New Report</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Report Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Q4 2024 User Growth"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  disabled={isCreating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Report Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    disabled={isCreating}
                  >
                    <option value="users">Users Report</option>
                    <option value="usage">Usage Report</option>
                    <option value="revenue">Revenue Report</option>
                    <option value="campaigns">Campaigns Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Format *
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    disabled={isCreating}
                  >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="pdf">PDF (Coming Soon)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 text-lg">ℹ️</span>
                  <div className="text-sm text-blue-400">
                    <strong>Report Types:</strong>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li><strong>Users:</strong> User registration and activity data</li>
                      <li><strong>Usage:</strong> Image processing and credit usage</li>
                      <li><strong>Revenue:</strong> Transaction and revenue analytics</li>
                      <li><strong>Campaigns:</strong> Marketing campaign performance</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {isCreating ? 'Generating...' : 'Generate Report'}
              </button>
              <button
                onClick={() => {
                  setName('');
                  setType('users');
                  setFormat('csv');
                  setStartDate('');
                  setEndDate('');
                  setShowCreateModal(false);
                }}
                disabled={isCreating}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
