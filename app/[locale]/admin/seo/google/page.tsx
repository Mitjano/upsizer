"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface IntegrationStatus {
  configured: boolean;
  searchConsole: {
    enabled: boolean;
    siteUrl: string | null;
    verified: boolean;
  };
  analytics: {
    enabled: boolean;
    propertyId: string | null;
    verified: boolean;
  };
}

interface SearchConsoleQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SearchConsolePage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export default function GoogleIntegrationPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [serviceAccountEmail, setServiceAccountEmail] = useState("");
  const [serviceAccountKey, setServiceAccountKey] = useState("");
  const [searchConsoleSiteUrl, setSearchConsoleSiteUrl] = useState("");
  const [analyticsPropertyId, setAnalyticsPropertyId] = useState("");

  // Data state
  const [queries, setQueries] = useState<SearchConsoleQuery[]>([]);
  const [pages, setPages] = useState<SearchConsolePage[]>([]);
  const [activeTab, setActiveTab] = useState<"setup" | "queries" | "pages">("setup");

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/seo/google?action=status");
      const data = await res.json();
      setStatus(data);

      if (data.searchConsole?.siteUrl) {
        setSearchConsoleSiteUrl(data.searchConsole.siteUrl);
      }
      if (data.analytics?.propertyId) {
        setAnalyticsPropertyId(data.analytics.propertyId);
      }
    } catch (err) {
      setError("Failed to fetch integration status");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/seo/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "configure",
          serviceAccountEmail,
          serviceAccountKey,
          searchConsoleSiteUrl,
          analyticsPropertyId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save configuration");
      }

      setSuccess("Configuration saved successfully!");
      fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (service: "search-console" | "analytics") => {
    try {
      setVerifying(true);
      setError(null);

      const res = await fetch("/api/admin/seo/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: service === "search-console" ? "verify-search-console" : "verify-analytics",
        }),
      });

      const data = await res.json();

      if (data.verified) {
        setSuccess(`${service === "search-console" ? "Search Console" : "Analytics"} verified successfully!`);
        fetchStatus();
      } else {
        setError("Verification failed. Please check your credentials and permissions.");
      }
    } catch (err) {
      setError("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleSync = async (service: "search-console" | "analytics") => {
    try {
      setSyncing(true);
      setError(null);

      const res = await fetch("/api/admin/seo/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: service === "search-console" ? "sync-search-console" : "sync-analytics",
          days: 28,
        }),
      });

      const data = await res.json();
      setSuccess(`Synced ${data.synced} records successfully!`);
    } catch (err) {
      setError("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const fetchQueries = async () => {
    try {
      const res = await fetch("/api/admin/seo/google?action=search-console-queries&days=28&limit=100");
      const data = await res.json();
      setQueries(data.queries || []);
    } catch (err) {
      setError("Failed to fetch queries");
    }
  };

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/admin/seo/google?action=search-console-pages&days=28&limit=100");
      const data = await res.json();
      setPages(data.pages || []);
    } catch (err) {
      setError("Failed to fetch pages");
    }
  };

  useEffect(() => {
    if (activeTab === "queries" && status?.searchConsole?.verified) {
      fetchQueries();
    } else if (activeTab === "pages" && status?.searchConsole?.verified) {
      fetchPages();
    }
  }, [activeTab, status?.searchConsole?.verified]);

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
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Link
            href={`/${locale}/admin/seo`}
            className="text-gray-400 hover:text-white transition"
          >
            SEO Hub
          </Link>
          <span className="text-gray-600">/</span>
          <h1 className="text-3xl font-bold">Google Integration</h1>
        </div>
        <p className="text-gray-400">
          Connect Google Search Console and Analytics for real SEO data
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-green-400">
          {success}
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-6">
        <div className={`bg-gray-800/50 border rounded-xl p-6 ${
          status?.searchConsole?.verified
            ? "border-green-500/30"
            : status?.searchConsole?.enabled
              ? "border-yellow-500/30"
              : "border-gray-700"
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">🔍</div>
            <div>
              <h3 className="font-bold text-white">Search Console</h3>
              <p className="text-sm text-gray-400">Keyword positions, clicks, impressions</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            {status?.searchConsole?.verified ? (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">Connected</span>
            ) : status?.searchConsole?.enabled ? (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm">Configured - Not Verified</span>
            ) : (
              <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-sm">Not Configured</span>
            )}
          </div>
          {status?.searchConsole?.siteUrl && (
            <p className="text-sm text-gray-400 mb-4">Site: {status.searchConsole.siteUrl}</p>
          )}
          {status?.searchConsole?.enabled && !status?.searchConsole?.verified && (
            <button
              onClick={() => handleVerify("search-console")}
              disabled={verifying}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg text-sm font-semibold"
            >
              {verifying ? "Verifying..." : "Verify Connection"}
            </button>
          )}
          {status?.searchConsole?.verified && (
            <button
              onClick={() => handleSync("search-console")}
              disabled={syncing}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold"
            >
              {syncing ? "Syncing..." : "Sync Data"}
            </button>
          )}
        </div>

        <div className={`bg-gray-800/50 border rounded-xl p-6 ${
          status?.analytics?.verified
            ? "border-green-500/30"
            : status?.analytics?.enabled
              ? "border-yellow-500/30"
              : "border-gray-700"
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">📊</div>
            <div>
              <h3 className="font-bold text-white">Google Analytics</h3>
              <p className="text-sm text-gray-400">Organic traffic, sessions, conversions</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            {status?.analytics?.verified ? (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">Connected</span>
            ) : status?.analytics?.enabled ? (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm">Configured - Not Verified</span>
            ) : (
              <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-sm">Not Configured</span>
            )}
          </div>
          {status?.analytics?.propertyId && (
            <p className="text-sm text-gray-400 mb-4">Property: {status.analytics.propertyId}</p>
          )}
          {status?.analytics?.enabled && !status?.analytics?.verified && (
            <button
              onClick={() => handleVerify("analytics")}
              disabled={verifying}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg text-sm font-semibold"
            >
              {verifying ? "Verifying..." : "Verify Connection"}
            </button>
          )}
          {status?.analytics?.verified && (
            <button
              onClick={() => handleSync("analytics")}
              disabled={syncing}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold"
            >
              {syncing ? "Syncing..." : "Sync Data"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("setup")}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === "setup"
              ? "text-green-400 border-b-2 border-green-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Setup
        </button>
        {status?.searchConsole?.verified && (
          <>
            <button
              onClick={() => setActiveTab("queries")}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === "queries"
                  ? "text-green-400 border-b-2 border-green-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Top Queries
            </button>
            <button
              onClick={() => setActiveTab("pages")}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === "pages"
                  ? "text-green-400 border-b-2 border-green-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Top Pages
            </button>
          </>
        )}
      </div>

      {/* Setup Tab */}
      {activeTab === "setup" && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Configuration</h3>
            <p className="text-gray-400 text-sm mb-6">
              Enter your Google Cloud service account credentials to enable the integration.
            </p>
          </div>

          {/* Setup Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-blue-400 mb-2">Setup Instructions:</h4>
            <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
              <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener" className="text-blue-400 hover:underline">Google Cloud Console</a></li>
              <li>Create a new project or select existing one</li>
              <li>Enable "Google Search Console API" and "Google Analytics Data API"</li>
              <li>Go to "IAM & Admin" → "Service Accounts"</li>
              <li>Create a service account and download JSON key</li>
              <li>In Search Console, add service account email as user with read permissions</li>
              <li>In Analytics, add service account email with Viewer role</li>
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Service Account Email
              </label>
              <input
                type="email"
                value={serviceAccountEmail}
                onChange={(e) => setServiceAccountEmail(e.target.value)}
                placeholder="name@project.iam.gserviceaccount.com"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Search Console Site URL
              </label>
              <input
                type="url"
                value={searchConsoleSiteUrl}
                onChange={(e) => setSearchConsoleSiteUrl(e.target.value)}
                placeholder="https://pixelift.pl/"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Service Account Private Key (JSON)
            </label>
            <textarea
              value={serviceAccountKey}
              onChange={(e) => setServiceAccountKey(e.target.value)}
              placeholder='Paste the entire "private_key" value from JSON file (starts with -----BEGIN PRIVATE KEY-----)'
              rows={4}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Google Analytics Property ID (GA4)
            </label>
            <input
              type="text"
              value={analyticsPropertyId}
              onChange={(e) => setAnalyticsPropertyId(e.target.value)}
              placeholder="123456789"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Find it in GA4: Admin → Property Settings → Property ID
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-semibold rounded-lg transition"
            >
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      )}

      {/* Queries Tab */}
      {activeTab === "queries" && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-bold text-white">Top Search Queries (Last 28 days)</h3>
          </div>
          {queries.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No data available. Click "Sync Data" to fetch from Search Console.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Query</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Clicks</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Impressions</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">CTR</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {queries.map((q, idx) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/30">
                      <td className="py-3 px-4 text-white">{q.query}</td>
                      <td className="py-3 px-4 text-right text-green-400 font-semibold">{q.clicks}</td>
                      <td className="py-3 px-4 text-right text-gray-300">{q.impressions.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-blue-400">{(q.ctr * 100).toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-1 rounded text-sm font-semibold ${
                          q.position <= 3 ? "bg-green-500/20 text-green-400" :
                          q.position <= 10 ? "bg-blue-500/20 text-blue-400" :
                          q.position <= 20 ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          #{q.position.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pages Tab */}
      {activeTab === "pages" && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-bold text-white">Top Pages (Last 28 days)</h3>
          </div>
          {pages.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No data available. Click "Sync Data" to fetch from Search Console.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Page</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Clicks</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Impressions</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">CTR</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Avg Position</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((p, idx) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/30">
                      <td className="py-3 px-4 text-white text-sm truncate max-w-md">
                        <a href={p.page} target="_blank" rel="noopener" className="hover:text-green-400">
                          {p.page.replace("https://pixelift.pl", "")}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-right text-green-400 font-semibold">{p.clicks}</td>
                      <td className="py-3 px-4 text-right text-gray-300">{p.impressions.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-blue-400">{(p.ctr * 100).toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right text-gray-300">#{p.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
