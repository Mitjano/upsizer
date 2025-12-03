"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface AuditResult {
  id: string;
  url: string;
  overallScore: number;
  performanceScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  seoScore: number | null;
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
  totalBlockingTime: number | null;
  cumulativeLayoutShift: number | null;
  speedIndex: number | null;
  issues: AuditIssue[];
  rawData: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditIssue {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
}

export default function SiteAuditPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [audits, setAudits] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audit form
  const [urlToAudit, setUrlToAudit] = useState('https://pixelift.pl');

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/seo/site-audit');
      if (!response.ok) throw new Error('Failed to fetch audits');
      const data = await response.json();
      setAudits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAudit = async () => {
    if (!urlToAudit.trim()) return;

    setRunning(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/seo/site-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToAudit.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to run audit');
      }

      await fetchAudits();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRunning(false);
    }
  };

  const getScoreColor = (score: number | null): string => {
    if (score === null) return 'text-gray-500';
    if (score >= 90) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number | null): string => {
    if (score === null) return 'bg-gray-500/20 border-gray-500/30';
    if (score >= 90) return 'bg-green-500/20 border-green-500/30';
    if (score >= 50) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const formatMs = (ms: number | null): string => {
    if (ms === null) return '—';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const latestAudit = audits[0];

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
            <h1 className="text-3xl font-bold">Site Audit</h1>
          </div>
          <p className="text-gray-400">
            Technical SEO analysis with Lighthouse metrics
          </p>
        </div>
      </div>

      {/* Run Audit */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Run New Audit</h2>
        <div className="flex gap-4">
          <input
            type="url"
            value={urlToAudit}
            onChange={(e) => setUrlToAudit(e.target.value)}
            placeholder="https://pixelift.pl"
            className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
          />
          <button
            onClick={handleRunAudit}
            disabled={running || !urlToAudit.trim()}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black font-semibold rounded-xl transition flex items-center gap-2"
          >
            {running ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                Running...
              </>
            ) : (
              <>
                <span>🔬</span> Run Audit
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-red-400 text-sm">{error}</p>
        )}
        <p className="mt-3 text-sm text-gray-500">
          Note: Full Lighthouse audit requires a server-side setup. This shows a simplified audit.
        </p>
      </div>

      {/* Latest Audit Results */}
      {latestAudit && (
        <>
          {/* Score Cards */}
          <div className="grid grid-cols-5 gap-4">
            <div className={`rounded-xl p-4 border ${getScoreBgColor(latestAudit.overallScore)}`}>
              <div className="text-sm text-gray-400 font-semibold mb-1">Overall Score</div>
              <div className={`text-4xl font-bold ${getScoreColor(latestAudit.overallScore)}`}>
                {latestAudit.overallScore}
              </div>
            </div>
            <div className={`rounded-xl p-4 border ${getScoreBgColor(latestAudit.performanceScore)}`}>
              <div className="text-sm text-gray-400 font-semibold mb-1">Performance</div>
              <div className={`text-4xl font-bold ${getScoreColor(latestAudit.performanceScore)}`}>
                {latestAudit.performanceScore ?? '—'}
              </div>
            </div>
            <div className={`rounded-xl p-4 border ${getScoreBgColor(latestAudit.accessibilityScore)}`}>
              <div className="text-sm text-gray-400 font-semibold mb-1">Accessibility</div>
              <div className={`text-4xl font-bold ${getScoreColor(latestAudit.accessibilityScore)}`}>
                {latestAudit.accessibilityScore ?? '—'}
              </div>
            </div>
            <div className={`rounded-xl p-4 border ${getScoreBgColor(latestAudit.bestPracticesScore)}`}>
              <div className="text-sm text-gray-400 font-semibold mb-1">Best Practices</div>
              <div className={`text-4xl font-bold ${getScoreColor(latestAudit.bestPracticesScore)}`}>
                {latestAudit.bestPracticesScore ?? '—'}
              </div>
            </div>
            <div className={`rounded-xl p-4 border ${getScoreBgColor(latestAudit.seoScore)}`}>
              <div className="text-sm text-gray-400 font-semibold mb-1">SEO</div>
              <div className={`text-4xl font-bold ${getScoreColor(latestAudit.seoScore)}`}>
                {latestAudit.seoScore ?? '—'}
              </div>
            </div>
          </div>

          {/* Core Web Vitals */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Core Web Vitals</h2>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {formatMs(latestAudit.firstContentfulPaint)}
                </div>
                <div className="text-xs text-gray-400 mt-1">FCP</div>
                <div className="text-xs text-gray-500">First Contentful Paint</div>
              </div>
              <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {formatMs(latestAudit.largestContentfulPaint)}
                </div>
                <div className="text-xs text-gray-400 mt-1">LCP</div>
                <div className="text-xs text-gray-500">Largest Contentful Paint</div>
              </div>
              <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {formatMs(latestAudit.totalBlockingTime)}
                </div>
                <div className="text-xs text-gray-400 mt-1">TBT</div>
                <div className="text-xs text-gray-500">Total Blocking Time</div>
              </div>
              <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {latestAudit.cumulativeLayoutShift?.toFixed(3) ?? '—'}
                </div>
                <div className="text-xs text-gray-400 mt-1">CLS</div>
                <div className="text-xs text-gray-500">Cumulative Layout Shift</div>
              </div>
              <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {formatMs(latestAudit.speedIndex)}
                </div>
                <div className="text-xs text-gray-400 mt-1">SI</div>
                <div className="text-xs text-gray-500">Speed Index</div>
              </div>
            </div>
          </div>

          {/* Issues */}
          {latestAudit.issues && latestAudit.issues.length > 0 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">
                Issues Found ({latestAudit.issues.length})
              </h2>
              <div className="space-y-3">
                {latestAudit.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      issue.severity === 'critical'
                        ? 'bg-red-500/10 border-red-500/30'
                        : issue.severity === 'warning'
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : 'bg-blue-500/10 border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">
                        {issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵'}
                      </span>
                      <div>
                        <h3 className="font-semibold text-white">{issue.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">{issue.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Meta */}
          <div className="text-sm text-gray-500 text-center">
            Last audit: {new Date(latestAudit.createdAt).toLocaleString()} | URL: {latestAudit.url}
          </div>
        </>
      )}

      {/* No Audits Yet */}
      {!latestAudit && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">Get Started with Site Audits</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>Site audits analyze your website's technical SEO health</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>Check Core Web Vitals metrics that affect search rankings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>Identify performance, accessibility, and SEO issues</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <span>Run audits regularly to track improvements over time</span>
            </li>
          </ul>
        </div>
      )}

      {/* History */}
      {audits.length > 1 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Audit History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-2 text-sm font-semibold text-gray-400">Date</th>
                  <th className="text-left px-4 py-2 text-sm font-semibold text-gray-400">URL</th>
                  <th className="text-center px-4 py-2 text-sm font-semibold text-gray-400">Overall</th>
                  <th className="text-center px-4 py-2 text-sm font-semibold text-gray-400">Performance</th>
                  <th className="text-center px-4 py-2 text-sm font-semibold text-gray-400">SEO</th>
                </tr>
              </thead>
              <tbody>
                {audits.map(audit => (
                  <tr key={audit.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(audit.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {audit.url.replace('https://', '').slice(0, 30)}
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className={`font-bold ${getScoreColor(audit.overallScore)}`}>
                        {audit.overallScore}
                      </span>
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className={`font-bold ${getScoreColor(audit.performanceScore)}`}>
                        {audit.performanceScore ?? '—'}
                      </span>
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className={`font-bold ${getScoreColor(audit.seoScore)}`}>
                        {audit.seoScore ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
