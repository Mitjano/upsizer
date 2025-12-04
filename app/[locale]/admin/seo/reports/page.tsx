"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

interface SEOReport {
  id: string;
  name: string;
  type: string;
  domain: string;
  locales: string[];
  periodStart: string;
  periodEnd: string;
  keywordsTracked: number;
  avgPosition: number | null;
  positionsUp: number;
  positionsDown: number;
  positionsStable: number;
  newKeywords: number;
  lostKeywords: number;
  newBacklinks: number;
  lostBacklinks: number;
  data: {
    keywords?: Array<{
      keyword: string;
      localeCode: string;
      currentPosition: number | null;
      previousPosition: number | null;
      change: "up" | "down" | "stable" | "new";
      positionChange: number;
    }>;
    backlinks?: {
      total: number;
      new: number;
      lost: number;
    };
  };
  emailSent: boolean;
  sentAt: string | null;
  createdAt: string;
}

export default function ReportsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [reports, setReports] = useState<SEOReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SEOReport | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    type: "weekly",
    periodDays: 7,
    locales: ["pl", "en"],
  });

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/seo/reports");
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/seo/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generateForm),
      });
      if (res.ok) {
        setShowGenerateModal(false);
        fetchReports();
      }
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setGenerating(false);
    }
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      await fetch(`/api/admin/seo/reports?id=${id}`, { method: "DELETE" });
      fetchReports();
      if (selectedReport?.id === id) setSelectedReport(null);
    } catch (error) {
      console.error("Error deleting report:", error);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  const getTypeColor = (type: string) => {
    switch (type) {
      case "weekly":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "monthly":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  // Stats from all reports
  const totalReports = reports.length;
  const weeklyReports = reports.filter((r) => r.type === "weekly").length;
  const monthlyReports = reports.filter((r) => r.type === "monthly").length;

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
            <h1 className="text-3xl font-bold">SEO Reports</h1>
          </div>
          <p className="text-gray-400">
            Generate and view SEO performance reports
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl transition"
        >
          <span>+</span> Generate Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="text-3xl font-bold text-white">{totalReports}</div>
          <div className="text-gray-400 text-sm">Total Reports</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="text-3xl font-bold text-blue-400">{weeklyReports}</div>
          <div className="text-gray-400 text-sm">Weekly Reports</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="text-3xl font-bold text-purple-400">
            {monthlyReports}
          </div>
          <div className="text-gray-400 text-sm">Monthly Reports</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="text-3xl font-bold text-green-400">
            {reports.filter((r) => r.emailSent).length}
          </div>
          <div className="text-gray-400 text-sm">Reports Sent</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold text-white">Reports History</h2>

          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : reports.length === 0 ? (
            <div className="bg-gray-800/50 rounded-xl p-8 text-center border border-gray-700/50">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-gray-400 mb-4">No reports generated yet</p>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="text-cyan-400 hover:text-cyan-300"
              >
                Generate your first report
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`p-4 rounded-xl cursor-pointer transition ${
                    selectedReport?.id === report.id
                      ? "bg-cyan-500/20 border border-cyan-500/50"
                      : "bg-gray-800/50 border border-gray-700/50 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${getTypeColor(report.type)}`}
                    >
                      {report.type}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatDate(report.createdAt)}
                    </span>
                  </div>
                  <h3 className="font-medium text-white text-sm truncate">
                    {report.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{report.keywordsTracked} keywords</span>
                    <span className="text-green-400">
                      +{report.positionsUp} up
                    </span>
                    <span className="text-red-400">
                      -{report.positionsDown} down
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Details */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700/50">
              {/* Report Header */}
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor(selectedReport.type)}`}
                    >
                      {selectedReport.type.toUpperCase()} REPORT
                    </span>
                  </div>
                  <button
                    onClick={() => deleteReport(selectedReport.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedReport.name}
                </h2>
                <p className="text-gray-400 mt-1">
                  Period: {formatDate(selectedReport.periodStart)} -{" "}
                  {formatDate(selectedReport.periodEnd)}
                </p>
              </div>

              {/* Summary Stats */}
              <div className="p-6 border-b border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">
                      {selectedReport.keywordsTracked}
                    </div>
                    <div className="text-xs text-gray-400">Keywords Tracked</div>
                  </div>
                  <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-cyan-400">
                      {selectedReport.avgPosition?.toFixed(1) || "-"}
                    </div>
                    <div className="text-xs text-gray-400">Avg. Position</div>
                  </div>
                  <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                      +{selectedReport.positionsUp}
                    </div>
                    <div className="text-xs text-gray-400">Improved</div>
                  </div>
                  <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">
                      -{selectedReport.positionsDown}
                    </div>
                    <div className="text-xs text-gray-400">Declined</div>
                  </div>
                </div>
              </div>

              {/* Backlinks Stats */}
              {selectedReport.data?.backlinks && (
                <div className="p-6 border-b border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Backlinks
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-white">
                        {selectedReport.data.backlinks.total}
                      </div>
                      <div className="text-xs text-gray-400">Total</div>
                    </div>
                    <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">
                        +{selectedReport.data.backlinks.new}
                      </div>
                      <div className="text-xs text-gray-400">New</div>
                    </div>
                    <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-red-400">
                        -{selectedReport.data.backlinks.lost}
                      </div>
                      <div className="text-xs text-gray-400">Lost</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Keywords Table */}
              {selectedReport.data?.keywords &&
                selectedReport.data.keywords.length > 0 && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Keyword Performance
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-700">
                            <th className="text-left py-2 px-3">Keyword</th>
                            <th className="text-left py-2 px-3">Locale</th>
                            <th className="text-right py-2 px-3">Position</th>
                            <th className="text-right py-2 px-3">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReport.data.keywords
                            .slice(0, 20)
                            .map((kw, idx) => (
                              <tr
                                key={idx}
                                className="border-b border-gray-800/50"
                              >
                                <td className="py-2 px-3 text-white">
                                  {kw.keyword}
                                </td>
                                <td className="py-2 px-3 text-gray-400">
                                  {kw.localeCode}
                                </td>
                                <td className="py-2 px-3 text-right font-mono">
                                  {kw.currentPosition || "-"}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {kw.change === "up" && (
                                    <span className="text-green-400">
                                      ▲ {kw.positionChange}
                                    </span>
                                  )}
                                  {kw.change === "down" && (
                                    <span className="text-red-400">
                                      ▼ {kw.positionChange}
                                    </span>
                                  )}
                                  {kw.change === "stable" && (
                                    <span className="text-gray-500">-</span>
                                  )}
                                  {kw.change === "new" && (
                                    <span className="text-cyan-400">NEW</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {selectedReport.data.keywords.length > 20 && (
                        <p className="text-gray-500 text-xs mt-2 text-center">
                          Showing 20 of {selectedReport.data.keywords.length}{" "}
                          keywords
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-12 text-center">
              <div className="text-6xl mb-6">📋</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Select a Report
              </h3>
              <p className="text-gray-400">
                Click on a report from the list to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">
              Generate SEO Report
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Report Type
                </label>
                <select
                  value={generateForm.type}
                  onChange={(e) =>
                    setGenerateForm({
                      ...generateForm,
                      type: e.target.value,
                      periodDays:
                        e.target.value === "weekly"
                          ? 7
                          : e.target.value === "monthly"
                            ? 30
                            : generateForm.periodDays,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white"
                >
                  <option value="weekly">Weekly (7 days)</option>
                  <option value="monthly">Monthly (30 days)</option>
                  <option value="custom">Custom Period</option>
                </select>
              </div>

              {generateForm.type === "custom" && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Period (days)
                  </label>
                  <input
                    type="number"
                    value={generateForm.periodDays}
                    onChange={(e) =>
                      setGenerateForm({
                        ...generateForm,
                        periodDays: parseInt(e.target.value) || 7,
                      })
                    }
                    min={1}
                    max={365}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Locales
                </label>
                <div className="flex flex-wrap gap-2">
                  {["pl", "en", "de", "es", "fr"].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        const newLocales = generateForm.locales.includes(loc)
                          ? generateForm.locales.filter((l) => l !== loc)
                          : [...generateForm.locales, loc];
                        setGenerateForm({
                          ...generateForm,
                          locales: newLocales,
                        });
                      }}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        generateForm.locales.includes(loc)
                          ? "bg-cyan-500 text-white"
                          : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                      }`}
                    >
                      {loc.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={generateReport}
                disabled={generating || generateForm.locales.length === 0}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-semibold rounded-xl transition"
              >
                {generating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
