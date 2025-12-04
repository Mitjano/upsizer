"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

interface SocialAccount {
  id: string;
  platform: string;
  platformType: string;
  accountId: string;
  accountName: string;
  accountHandle?: string;
  avatarUrl?: string;
  metadata?: {
    followers?: number;
    following?: number;
    posts?: number;
  };
  isActive: boolean;
  isPrimary: boolean;
  tokenExpiry?: string;
  postsCount: number;
  analytics?: {
    followers: number;
    followersGrowth: number;
    engagementRate: number;
  };
  createdAt: string;
}

const PLATFORM_CONFIG: Record<
  string,
  {
    name: string;
    icon: string;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  facebook: {
    name: "Facebook",
    icon: "f",
    color: "text-blue-400",
    bgColor: "bg-blue-600",
    description: "Connect your Facebook Page or Profile",
  },
  instagram: {
    name: "Instagram",
    icon: "📸",
    color: "text-pink-400",
    bgColor: "bg-gradient-to-br from-purple-600 to-pink-500",
    description: "Connect your Instagram Business account",
  },
  twitter: {
    name: "X (Twitter)",
    icon: "𝕏",
    color: "text-white",
    bgColor: "bg-black",
    description: "Connect your X/Twitter account",
  },
  linkedin: {
    name: "LinkedIn",
    icon: "in",
    color: "text-blue-300",
    bgColor: "bg-blue-700",
    description: "Connect your LinkedIn Profile or Company Page",
  },
  pinterest: {
    name: "Pinterest",
    icon: "📌",
    color: "text-red-400",
    bgColor: "bg-red-600",
    description: "Connect your Pinterest Business account",
  },
  tiktok: {
    name: "TikTok",
    icon: "♪",
    color: "text-white",
    bgColor: "bg-black",
    description: "Connect your TikTok Business account",
  },
  youtube: {
    name: "YouTube",
    icon: "▶",
    color: "text-red-400",
    bgColor: "bg-red-600",
    description: "Connect your YouTube channel",
  },
  threads: {
    name: "Threads",
    icon: "@",
    color: "text-white",
    bgColor: "bg-black",
    description: "Connect your Threads account",
  },
};

export default function AccountsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/social/accounts");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const disconnectAccount = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this account?")) return;

    try {
      await fetch(`/api/admin/social/accounts?id=${id}`, { method: "DELETE" });
      fetchAccounts();
    } catch (error) {
      console.error("Error disconnecting account:", error);
    }
  };

  const togglePrimary = async (account: SocialAccount) => {
    try {
      await fetch("/api/admin/social/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: account.id,
          isPrimary: !account.isPrimary,
        }),
      });
      fetchAccounts();
    } catch (error) {
      console.error("Error updating account:", error);
    }
  };

  const connectedPlatforms = new Set(accounts.map((a) => a.platform));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/${locale}/admin/social`}
              className="text-gray-400 hover:text-white transition"
            >
              Social Hub
            </Link>
            <span className="text-gray-600">/</span>
            <h1 className="text-3xl font-bold">Connected Accounts</h1>
          </div>
          <p className="text-gray-400">
            Manage your connected social media accounts
          </p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl transition"
        >
          <span>+</span> Connect Account
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="text-3xl font-bold text-white">{accounts.length}</div>
          <div className="text-gray-400 text-sm">Connected Accounts</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="text-3xl font-bold text-green-400">
            {accounts.filter((a) => a.isActive).length}
          </div>
          <div className="text-gray-400 text-sm">Active</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="text-3xl font-bold text-purple-400">
            {accounts
              .reduce(
                (sum, a) => sum + (a.analytics?.followers || a.metadata?.followers || 0),
                0
              )
              .toLocaleString()}
          </div>
          <div className="text-gray-400 text-sm">Total Followers</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="text-3xl font-bold text-cyan-400">
            {accounts.reduce((sum, a) => sum + a.postsCount, 0)}
          </div>
          <div className="text-gray-400 text-sm">Total Posts</div>
        </div>
      </div>

      {/* Connected Accounts */}
      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading...</div>
      ) : accounts.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl p-12 text-center border border-gray-700/50">
          <div className="text-6xl mb-6">🔗</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No accounts connected
          </h3>
          <p className="text-gray-400 mb-4">
            Connect your social media accounts to start posting
          </p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl transition"
          >
            Connect Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => {
            const config = PLATFORM_CONFIG[account.platform] || {
              name: account.platform,
              icon: account.platform[0].toUpperCase(),
              color: "text-white",
              bgColor: "bg-gray-600",
            };

            return (
              <div
                key={account.id}
                className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl ${config.bgColor} flex items-center justify-center text-white font-bold text-xl shrink-0`}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white truncate">
                          {account.accountName}
                        </h3>
                        {account.isPrimary && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded border border-yellow-500/30">
                            Primary
                          </span>
                        )}
                        {!account.isActive && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded border border-red-500/30">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-sm ${config.color}`}>
                          {config.name}
                        </span>
                        {account.accountHandle && (
                          <span className="text-gray-500 text-sm">
                            @{account.accountHandle}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>
                          {(
                            account.analytics?.followers ||
                            account.metadata?.followers ||
                            0
                          ).toLocaleString()}{" "}
                          followers
                        </span>
                        <span>{account.postsCount} posts</span>
                        {account.analytics?.engagementRate && (
                          <span className="text-cyan-400">
                            {account.analytics.engagementRate.toFixed(2)}%
                            engagement
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-900/30 border-t border-gray-700/50 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Connected {new Date(account.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePrimary(account)}
                      className="text-gray-400 hover:text-yellow-400 text-xs"
                    >
                      {account.isPrimary ? "Remove Primary" : "Set Primary"}
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                      onClick={() => disconnectAccount(account.id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Connect Account Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-2">
              Connect Social Account
            </h2>
            <p className="text-gray-400 mb-6">
              {selectedPlatform
                ? `Connect your ${PLATFORM_CONFIG[selectedPlatform]?.name || selectedPlatform} account`
                : "Choose a platform to connect"}
            </p>

            {!selectedPlatform ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
                  const isConnected = connectedPlatforms.has(key);

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedPlatform(key)}
                      className={`p-4 rounded-xl border transition text-center ${
                        isConnected
                          ? "bg-green-500/10 border-green-500/30 hover:border-green-500/50"
                          : "bg-gray-900/50 border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center text-white font-bold text-lg mx-auto mb-3`}
                      >
                        {config.icon}
                      </div>
                      <div className="font-medium text-white text-sm">
                        {config.name}
                      </div>
                      {isConnected && (
                        <div className="text-green-400 text-xs mt-1">
                          Connected
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl">
                  <div
                    className={`w-12 h-12 rounded-xl ${PLATFORM_CONFIG[selectedPlatform]?.bgColor || "bg-gray-600"} flex items-center justify-center text-white font-bold text-lg`}
                  >
                    {PLATFORM_CONFIG[selectedPlatform]?.icon ||
                      selectedPlatform[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      {PLATFORM_CONFIG[selectedPlatform]?.name ||
                        selectedPlatform}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {PLATFORM_CONFIG[selectedPlatform]?.description}
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <h4 className="font-medium text-yellow-400">
                        OAuth Coming Soon
                      </h4>
                      <p className="text-yellow-400/70 text-sm mt-1">
                        Full OAuth integration with {PLATFORM_CONFIG[selectedPlatform]?.name || selectedPlatform} is coming soon.
                        For now, this is a placeholder for the connection flow.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center py-6">
                  <div className="text-4xl mb-4">🔐</div>
                  <p className="text-gray-400 mb-4">
                    Click the button below to connect your{" "}
                    {PLATFORM_CONFIG[selectedPlatform]?.name || selectedPlatform}{" "}
                    account
                  </p>
                  <button
                    disabled
                    className="px-6 py-3 bg-gray-600 text-gray-400 font-semibold rounded-xl cursor-not-allowed"
                  >
                    Connect with{" "}
                    {PLATFORM_CONFIG[selectedPlatform]?.name || selectedPlatform}
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              {selectedPlatform && (
                <button
                  onClick={() => setSelectedPlatform(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={() => {
                  setShowConnectModal(false);
                  setSelectedPlatform(null);
                }}
                className="ml-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition"
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
