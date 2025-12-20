"use client";

import { useState, useEffect } from "react";

interface ServiceStatus {
  id: string;
  serviceName: string;
  displayName: string;
  status: "online" | "offline" | "degraded" | "unknown";
  latency: number | null;
  lastCheck: string;
  lastOnline: string | null;
  lastError: string | null;
  checkCount24h: number;
  errorCount24h: number;
  uptime24h: number;
}

interface ServiceConfig {
  serviceName: string;
  displayName: string;
  icon: string;
  description: string;
}

const SERVICES: ServiceConfig[] = [
  { serviceName: "replicate", displayName: "Replicate", icon: "🔄", description: "AI image models (12+ models)" },
  { serviceName: "fal", displayName: "Fal.ai", icon: "⚡", description: "Fast AI inference (6+ endpoints)" },
  { serviceName: "openai", displayName: "OpenAI", icon: "🤖", description: "GPT & DALL-E models" },
  { serviceName: "anthropic", displayName: "Anthropic", icon: "🧠", description: "Claude AI models" },
  { serviceName: "stripe", displayName: "Stripe", icon: "💳", description: "Payment processing" },
  { serviceName: "resend", displayName: "Resend", icon: "📧", description: "Email delivery" },
];

const STATUS_COLORS = {
  online: { bg: "bg-green-500/20", border: "border-green-500/50", text: "text-green-400", dot: "bg-green-500" },
  offline: { bg: "bg-red-500/20", border: "border-red-500/50", text: "text-red-400", dot: "bg-red-500" },
  degraded: { bg: "bg-yellow-500/20", border: "border-yellow-500/50", text: "text-yellow-400", dot: "bg-yellow-500" },
  unknown: { bg: "bg-gray-500/20", border: "border-gray-500/50", text: "text-gray-400", dot: "bg-gray-500" },
};

export default function ToolStatusClient() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/admin/tool-status");
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (err) {
      console.error("Failed to fetch status:", err);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  const testService = async (serviceName: string) => {
    setTesting(serviceName);
    try {
      const response = await fetch("/api/admin/tool-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", serviceName }),
      });
      if (response.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error("Failed to test service:", err);
    } finally {
      setTesting(null);
    }
  };

  const testAllServices = async () => {
    setTesting("all");
    try {
      const response = await fetch("/api/admin/tool-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test-all" }),
      });
      if (response.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error("Failed to test all services:", err);
    } finally {
      setTesting(null);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStatus, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getServiceStatus = (serviceName: string): ServiceStatus | undefined => {
    return services.find((s) => s.serviceName === serviceName);
  };

  const getOverallStats = () => {
    const total = SERVICES.length;
    const online = services.filter((s) => s.status === "online").length;
    const offline = services.filter((s) => s.status === "offline").length;
    const degraded = services.filter((s) => s.status === "degraded").length;
    const avgUptime = services.length > 0
      ? services.reduce((sum, s) => sum + s.uptime24h, 0) / services.length
      : 100;

    return { total, online, offline, degraded, avgUptime };
  };

  const stats = getOverallStats();

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Tool Status</h1>
            <p className="text-gray-400 text-lg">Monitor external API health</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Tool Status</h1>
          <p className="text-gray-400 text-lg">Monitor external API health and availability</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-gray-700 border-gray-600"
            />
            Auto-refresh
          </label>
          <span className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={testAllServices}
            disabled={testing === "all"}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition flex items-center gap-2"
          >
            {testing === "all" ? (
              <>
                <span className="animate-spin">⏳</span> Testing...
              </>
            ) : (
              <>
                <span>🔍</span> Test All Services
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
          <div className="text-sm text-blue-400 font-semibold mb-2">Total Services</div>
          <div className="text-4xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-400 mt-2">Monitored APIs</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-sm text-green-400 font-semibold mb-2">Online</div>
          <div className="text-4xl font-bold text-white">{stats.online}</div>
          <div className="text-xs text-gray-400 mt-2">Operational</div>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl p-6">
          <div className="text-sm text-red-400 font-semibold mb-2">Offline</div>
          <div className="text-4xl font-bold text-white">{stats.offline}</div>
          <div className="text-xs text-gray-400 mt-2">{stats.degraded} degraded</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
          <div className="text-sm text-purple-400 font-semibold mb-2">Avg Uptime (24h)</div>
          <div className="text-4xl font-bold text-white">{stats.avgUptime.toFixed(1)}%</div>
          <div className="text-xs text-gray-400 mt-2">Last 24 hours</div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((config) => {
          const status = getServiceStatus(config.serviceName);
          const statusType = status?.status || "unknown";
          const colors = STATUS_COLORS[statusType];

          return (
            <div
              key={config.serviceName}
              className={`${colors.bg} border ${colors.border} rounded-xl p-6 transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{config.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{config.displayName}</h3>
                    <p className="text-sm text-gray-400">{config.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors.dot} animate-pulse`}></div>
                  <span className={`text-sm font-semibold ${colors.text} uppercase`}>
                    {statusType}
                  </span>
                </div>
              </div>

              {status ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Latency</span>
                    <span className="text-white font-medium">
                      {status.latency !== null ? `${status.latency}ms` : "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Uptime (24h)</span>
                    <span className={`font-medium ${status.uptime24h >= 99 ? "text-green-400" : status.uptime24h >= 95 ? "text-yellow-400" : "text-red-400"}`}>
                      {status.uptime24h.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Checks (24h)</span>
                    <span className="text-white font-medium">
                      {status.checkCount24h} ({status.errorCount24h} errors)
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Last Check</span>
                    <span className="text-white font-medium">
                      {new Date(status.lastCheck).toLocaleTimeString()}
                    </span>
                  </div>

                  {status.lastError && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-xs text-red-400 font-medium mb-1">Last Error:</p>
                      <p className="text-xs text-gray-300 truncate">{status.lastError}</p>
                    </div>
                  )}

                  {/* Uptime bar */}
                  <div className="mt-3">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${status.uptime24h >= 99 ? "bg-green-500" : status.uptime24h >= 95 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${status.uptime24h}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No data available</p>
                  <p className="text-xs mt-1">Run a test to initialize</p>
                </div>
              )}

              <button
                onClick={() => testService(config.serviceName)}
                disabled={testing === config.serviceName || testing === "all"}
                className="mt-4 w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {testing === config.serviceName ? (
                  <>
                    <span className="animate-spin">⏳</span> Testing...
                  </>
                ) : (
                  <>
                    <span>🔌</span> Test Connection
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>ℹ️</span> About Service Monitoring
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-400">
          <div>
            <h4 className="font-semibold text-white mb-2">Status Types</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span><strong className="text-green-400">Online</strong> - Service is operational</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span><strong className="text-yellow-400">Degraded</strong> - Slow response times</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span><strong className="text-red-400">Offline</strong> - Service unavailable</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                <span><strong className="text-gray-400">Unknown</strong> - Not yet tested</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Automatic Monitoring</h4>
            <ul className="space-y-2">
              <li>Health checks run every 5 minutes via Vercel Cron</li>
              <li>Email alerts when service is offline &gt;5 minutes</li>
              <li>24-hour uptime statistics are calculated automatically</li>
              <li>Latency is measured for each API call</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
