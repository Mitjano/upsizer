"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Competitor {
  id: string;
  domain: string;
  name: string;
  description: string | null;
  domainAuthority: number | null;
  monthlyTraffic: number | null;
  totalKeywords: number | null;
  totalBacklinks: number | null;
  isActive: boolean;
  createdAt: string;
  rankings?: CompetitorRanking[];
}

interface CompetitorRanking {
  id: string;
  keyword: string;
  localeCode: string;
  position: number | null;
  url: string | null;
  checkedAt: string;
}

interface TrackedKeyword {
  keyword: string;
  localeCode: string;
  currentPosition: number | null;
  url: string | null;
}

interface PotentialCompetitor {
  domain: string;
  appearances: number;
  avgPosition: number;
  keywords: string[];
  keywordsCount: number;
}

export default function CompetitorsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [trackedKeywords, setTrackedKeywords] = useState<TrackedKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [potentialCompetitors, setPotentialCompetitors] = useState<
    PotentialCompetitor[]
  >([]);

  // Form state
  const [newCompetitor, setNewCompetitor] = useState({
    domain: "",
    name: "",
    description: "",
  });
  const [addingCompetitor, setAddingCompetitor] = useState(false);

  // Check positions state
  const [checkingPositions, setCheckingPositions] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const fetchCompetitors = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/admin/seo/competitors?includeRankings=true"
      );
      if (!response.ok) throw new Error("Failed to fetch competitors");
      const data = await response.json();
      setCompetitors(data.competitors);
      setTrackedKeywords(data.trackedKeywords);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompetitor = async () => {
    if (!newCompetitor.domain) return;

    try {
      setAddingCompetitor(true);
      const response = await fetch("/api/admin/seo/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCompetitor),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to add competitor");
      }

      setShowAddModal(false);
      setNewCompetitor({ domain: "", name: "", description: "" });
      fetchCompetitors();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add competitor");
    } finally {
      setAddingCompetitor(false);
    }
  };

  const handleDeleteCompetitor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this competitor?")) return;

    try {
      const response = await fetch(`/api/admin/seo/competitors?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete competitor");
      fetchCompetitors();
    } catch (err) {
      alert("Failed to delete competitor");
    }
  };

  const handleDiscoverCompetitors = async () => {
    try {
      setDiscovering(true);
      setPotentialCompetitors([]);

      const response = await fetch("/api/admin/seo/competitors/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywordLimit: 20 }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to discover competitors");
      }

      const data = await response.json();
      setPotentialCompetitors(data.potentialCompetitors);
      setShowDiscoverModal(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to discover");
    } finally {
      setDiscovering(false);
    }
  };

  const handleAddDiscoveredCompetitor = async (domain: string) => {
    try {
      const response = await fetch("/api/admin/seo/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, name: domain }),
      });

      if (!response.ok) throw new Error("Failed to add");

      // Remove from potential list
      setPotentialCompetitors((prev) =>
        prev.filter((c) => c.domain !== domain)
      );
      fetchCompetitors();
    } catch {
      alert("Failed to add competitor");
    }
  };

  const handleCheckPositions = async (competitorId: string) => {
    try {
      setCheckingPositions(competitorId);
      const response = await fetch("/api/admin/seo/competitors/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitorId }),
      });

      if (!response.ok) throw new Error("Failed to check positions");
      fetchCompetitors();
    } catch (err) {
      alert("Failed to check positions");
    } finally {
      setCheckingPositions(null);
    }
  };

  // Get comparison data
  const getComparisonData = (competitor: Competitor) => {
    if (!competitor.rankings || competitor.rankings.length === 0) return null;

    // Get latest ranking for each keyword
    const latestRankings = new Map<string, CompetitorRanking>();
    for (const r of competitor.rankings) {
      const key = `${r.keyword}-${r.localeCode}`;
      if (!latestRankings.has(key)) {
        latestRankings.set(key, r);
      }
    }

    // Compare with our positions
    const comparisons: Array<{
      keyword: string;
      localeCode: string;
      ourPosition: number | null;
      theirPosition: number | null;
      difference: number | null;
    }> = [];

    for (const [key, ranking] of latestRankings) {
      const ourKeyword = trackedKeywords.find(
        (k) => k.keyword === ranking.keyword && k.localeCode === ranking.localeCode
      );

      const ourPos = ourKeyword?.currentPosition || null;
      const theirPos = ranking.position;
      let diff: number | null = null;

      if (ourPos && theirPos) {
        diff = theirPos - ourPos; // Positive = we're winning
      }

      comparisons.push({
        keyword: ranking.keyword,
        localeCode: ranking.localeCode,
        ourPosition: ourPos,
        theirPosition: theirPos,
        difference: diff,
      });
    }

    // Sort: keywords where we're losing first
    comparisons.sort((a, b) => {
      if (a.difference === null) return 1;
      if (b.difference === null) return -1;
      return a.difference - b.difference;
    });

    return comparisons;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-red-400">Error: {error}</p>
        <button
          onClick={fetchCompetitors}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Retry
        </button>
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
            <h1 className="text-3xl font-bold">Competitor Analysis</h1>
          </div>
          <p className="text-gray-400">
            Track and compare keyword positions with competitors
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDiscoverCompetitors}
            disabled={discovering}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            {discovering ? (
              <>
                <span className="animate-spin">⏳</span> Discovering...
              </>
            ) : (
              <>
                <span>🔍</span> Auto-Discover
              </>
            )}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            <span>+</span> Add Competitor
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Competitors</div>
          <div className="text-2xl font-bold text-white">{competitors.length}</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Our Keywords</div>
          <div className="text-2xl font-bold text-green-400">
            {trackedKeywords.length}
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Winning</div>
          <div className="text-2xl font-bold text-green-400">
            {competitors.reduce((acc, c) => {
              const comp = getComparisonData(c);
              if (!comp) return acc;
              return acc + comp.filter((x) => x.difference && x.difference > 0).length;
            }, 0)}
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Losing</div>
          <div className="text-2xl font-bold text-red-400">
            {competitors.reduce((acc, c) => {
              const comp = getComparisonData(c);
              if (!comp) return acc;
              return acc + comp.filter((x) => x.difference && x.difference < 0).length;
            }, 0)}
          </div>
        </div>
      </div>

      {/* Competitors List */}
      {competitors.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            No Competitors Yet
          </h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Add competitors manually or use Auto-Discover to find websites that
            rank for your keywords.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleDiscoverCompetitors}
              disabled={discovering || trackedKeywords.length === 0}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition"
            >
              {trackedKeywords.length === 0
                ? "Add keywords first"
                : "Auto-Discover Competitors"}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
            >
              Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {competitors.map((competitor) => {
            const comparison = getComparisonData(competitor);
            const winning = comparison?.filter(
              (x) => x.difference && x.difference > 0
            ).length || 0;
            const losing = comparison?.filter(
              (x) => x.difference && x.difference < 0
            ).length || 0;

            return (
              <div
                key={competitor.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden"
              >
                {/* Competitor Header */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        {competitor.name}
                        <span className="text-sm font-normal text-gray-400">
                          {competitor.domain}
                        </span>
                      </h3>
                      {competitor.description && (
                        <p className="text-gray-400 text-sm mt-1">
                          {competitor.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-4 text-center">
                        <div>
                          <div className="text-sm text-gray-400">Winning</div>
                          <div className="text-xl font-bold text-green-400">
                            {winning}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Losing</div>
                          <div className="text-xl font-bold text-red-400">
                            {losing}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCheckPositions(competitor.id)}
                          disabled={checkingPositions === competitor.id}
                          className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition text-sm"
                        >
                          {checkingPositions === competitor.id
                            ? "Checking..."
                            : "Check Positions"}
                        </button>
                        <button
                          onClick={() => handleDeleteCompetitor(competitor.id)}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparison Table */}
                {comparison && comparison.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-900/50">
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                            Keyword
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                            Locale
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                            Our Position
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                            Their Position
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparison.slice(0, 10).map((row, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-gray-800 hover:bg-gray-700/30"
                          >
                            <td className="py-3 px-4 font-medium text-white">
                              {row.keyword}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-400">
                              {row.localeCode.toUpperCase()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {row.ourPosition ? (
                                <span
                                  className={`px-2 py-1 rounded text-sm font-semibold ${
                                    row.ourPosition <= 3
                                      ? "bg-green-500/20 text-green-400"
                                      : row.ourPosition <= 10
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-gray-500/20 text-gray-400"
                                  }`}
                                >
                                  #{row.ourPosition}
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {row.theirPosition ? (
                                <span
                                  className={`px-2 py-1 rounded text-sm font-semibold ${
                                    row.theirPosition <= 3
                                      ? "bg-green-500/20 text-green-400"
                                      : row.theirPosition <= 10
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-gray-500/20 text-gray-400"
                                  }`}
                                >
                                  #{row.theirPosition}
                                </span>
                              ) : (
                                <span className="text-gray-500">Not ranking</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {row.difference !== null ? (
                                row.difference > 0 ? (
                                  <span className="text-green-400 font-semibold">
                                    Winning by {row.difference}
                                  </span>
                                ) : row.difference < 0 ? (
                                  <span className="text-red-400 font-semibold">
                                    Losing by {Math.abs(row.difference)}
                                  </span>
                                ) : (
                                  <span className="text-yellow-400">Tied</span>
                                )
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {comparison.length > 10 && (
                      <div className="p-4 text-center text-gray-400 text-sm">
                        And {comparison.length - 10} more keywords...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <p>No position data yet.</p>
                    <button
                      onClick={() => handleCheckPositions(competitor.id)}
                      disabled={checkingPositions === competitor.id}
                      className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                    >
                      {checkingPositions === competitor.id
                        ? "Checking positions..."
                        : "Check positions now"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Competitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">
              Add Competitor
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Domain *
                </label>
                <input
                  type="text"
                  value={newCompetitor.domain}
                  onChange={(e) =>
                    setNewCompetitor({ ...newCompetitor, domain: e.target.value })
                  }
                  placeholder="example.com"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={newCompetitor.name}
                  onChange={(e) =>
                    setNewCompetitor({ ...newCompetitor, name: e.target.value })
                  }
                  placeholder="Company Name"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newCompetitor.description}
                  onChange={(e) =>
                    setNewCompetitor({
                      ...newCompetitor,
                      description: e.target.value,
                    })
                  }
                  placeholder="Notes about this competitor..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCompetitor}
                disabled={!newCompetitor.domain || addingCompetitor}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-semibold rounded-lg transition"
              >
                {addingCompetitor ? "Adding..." : "Add Competitor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discover Competitors Modal */}
      {showDiscoverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-4">
              Discovered Competitors
            </h2>
            {potentialCompetitors.length === 0 ? (
              <p className="text-gray-400">
                No potential competitors found. Try adding more keywords first.
              </p>
            ) : (
              <div className="overflow-y-auto flex-1">
                <table className="w-full">
                  <thead className="bg-gray-900/50 sticky top-0">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                        Domain
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                        Appearances
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                        Avg Position
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {potentialCompetitors.map((pc) => (
                      <tr
                        key={pc.domain}
                        className="border-b border-gray-700 hover:bg-gray-700/30"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-white">
                            {pc.domain}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Keywords: {pc.keywords.join(", ")}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm font-semibold">
                            {pc.appearances}x
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-300">
                          #{pc.avgPosition.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              handleAddDiscoveredCompetitor(pc.domain)
                            }
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-semibold transition"
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowDiscoverModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
