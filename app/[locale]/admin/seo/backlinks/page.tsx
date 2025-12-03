"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Backlink {
  id: string;
  sourceUrl: string;
  sourceDomain: string;
  targetUrl: string;
  anchorText: string | null;
  isDoFollow: boolean;
  status: string;
  domainAuthority: number | null;
  pageAuthority: number | null;
  firstSeen: string;
  lastChecked: string | null;
  notes: string | null;
}

export default function BacklinksPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Add backlink form
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newTargetUrl, setNewTargetUrl] = useState('https://pixelift.pl');
  const [newAnchorText, setNewAnchorText] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchBacklinks();
  }, []);

  const fetchBacklinks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/seo/backlinks');
      if (!response.ok) throw new Error('Failed to fetch backlinks');
      const data = await response.json();
      setBacklinks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBacklink = async () => {
    if (!newSourceUrl.trim()) return;

    setAdding(true);
    try {
      const response = await fetch('/api/admin/seo/backlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl: newSourceUrl.trim(),
          targetUrl: newTargetUrl.trim(),
          anchorText: newAnchorText.trim() || null,
          notes: newNotes.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add backlink');
      }

      setNewSourceUrl('');
      setNewAnchorText('');
      setNewNotes('');
      setIsAddModalOpen(false);
      await fetchBacklinks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add backlink');
    } finally {
      setAdding(false);
    }
  };

  const handleCheckBacklinks = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/admin/seo/backlinks/check', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to check backlinks');

      const data = await response.json();
      alert(`Checked ${data.checked} backlinks. Active: ${data.active}, Lost: ${data.lost}`);
      await fetchBacklinks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to check backlinks');
    } finally {
      setChecking(false);
    }
  };

  const handleDeleteBacklink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this backlink?')) return;

    try {
      const response = await fetch(`/api/admin/seo/backlinks?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete backlink');
      await fetchBacklinks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete backlink');
    }
  };

  // Filter backlinks
  const filteredBacklinks = backlinks.filter(bl => {
    if (statusFilter !== 'all' && bl.status !== statusFilter) return false;
    if (typeFilter === 'dofollow' && !bl.isDoFollow) return false;
    if (typeFilter === 'nofollow' && bl.isDoFollow) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        bl.sourceUrl.toLowerCase().includes(search) ||
        bl.sourceDomain.toLowerCase().includes(search) ||
        bl.anchorText?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Stats
  const stats = {
    total: backlinks.length,
    active: backlinks.filter(bl => bl.status === 'active').length,
    lost: backlinks.filter(bl => bl.status === 'lost').length,
    doFollow: backlinks.filter(bl => bl.isDoFollow).length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'lost': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/${locale}/admin/seo`}
              className="text-gray-400 hover:text-white transition"
            >
              SEO Hub
            </Link>
            <span className="text-gray-600">/</span>
            <h1 className="text-3xl font-bold">Backlink Monitor</h1>
          </div>
          <p className="text-gray-400">
            Track and analyze your backlink profile
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCheckBacklinks}
            disabled={checking}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            {checking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Checking...
              </>
            ) : (
              <>
                <span>🔄</span> Check All
              </>
            )}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            <span>+</span> Add Backlink
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 border border-gray-500/30 rounded-xl p-4">
          <div className="text-sm text-gray-400 font-semibold mb-1">Total Backlinks</div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4">
          <div className="text-sm text-green-400 font-semibold mb-1">Active</div>
          <div className="text-3xl font-bold text-white">{stats.active}</div>
        </div>
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl p-4">
          <div className="text-sm text-red-400 font-semibold mb-1">Lost</div>
          <div className="text-3xl font-bold text-white">{stats.lost}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4">
          <div className="text-sm text-blue-400 font-semibold mb-1">DoFollow</div>
          <div className="text-3xl font-bold text-white">{stats.doFollow}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search backlinks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="lost">Lost</option>
          <option value="pending">Pending</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
        >
          <option value="all">All Types</option>
          <option value="dofollow">DoFollow</option>
          <option value="nofollow">NoFollow</option>
        </select>
      </div>

      {/* Backlinks Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Source</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Target</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Anchor</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-400">Type</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-400">First Seen</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBacklinks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No backlinks found. Add your first backlink to start tracking!
                  </td>
                </tr>
              ) : (
                filteredBacklinks.map(bl => (
                  <tr key={bl.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                    <td className="px-4 py-3">
                      <a
                        href={bl.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        {bl.sourceDomain}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-400">
                        {bl.targetUrl.replace('https://', '').replace('http://', '')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-300">
                        {bl.anchorText || '—'}
                      </span>
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        bl.isDoFollow
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {bl.isDoFollow ? 'DoFollow' : 'NoFollow'}
                      </span>
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(bl.status)}`}>
                        {bl.status}
                      </span>
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className="text-sm text-gray-400">
                        {new Date(bl.firstSeen).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="text-center px-4 py-3">
                      <button
                        onClick={() => handleDeleteBacklink(bl.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Backlink Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Add Backlink</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Source URL *
                </label>
                <input
                  type="url"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="https://example.com/page-with-link"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Target URL
                </label>
                <input
                  type="url"
                  value={newTargetUrl}
                  onChange={(e) => setNewTargetUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Anchor Text
                </label>
                <input
                  type="text"
                  value={newAnchorText}
                  onChange={(e) => setNewAnchorText(e.target.value)}
                  placeholder="e.g., remove background online"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Notes
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Optional notes about this backlink..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBacklink}
                disabled={adding || !newSourceUrl.trim()}
                className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                {adding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding...
                  </>
                ) : (
                  'Add Backlink'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      {backlinks.length === 0 && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-purple-400 mb-3">About Backlink Monitoring</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Add backlinks you've acquired to track if they're still active</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>The system will periodically check if the links are still present</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>DoFollow links pass more SEO value than NoFollow links</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span>Lost backlinks may indicate removed content or changed pages</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
