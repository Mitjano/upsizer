"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  credits: number;
  status: string;
  createdAt: string;
}

interface Usage {
  id: string;
  toolType: string;
  creditsUsed: number;
  createdAt: string;
}

interface ImageHistory {
  id: string;
  toolType: string;
  originalUrl?: string;
  processedUrl?: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: string;
  status: string;
  credits: number;
  totalUsage: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastActiveAt?: string;
  // Location
  country?: string;
  countryName?: string;
  city?: string;
  region?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  // Device
  lastIpAddress?: string;
  signupIpAddress?: string;
  userAgent?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  deviceType?: string;
  language?: string;
  // Marketing
  referralSource?: string;
  referralMedium?: string;
  referralCampaign?: string;
  referrerUrl?: string;
  landingPage?: string;
  signupPage?: string;
  gclid?: string;
  fbclid?: string;
  authProvider?: string;
  // Business
  lifetimeValue: number;
  totalSpent: number;
  totalPurchases: number;
  totalSessions: number;
  totalImagesProcessed: number;
  preferredTools: string[];
  lastToolUsed?: string;
  // Notes
  internalNotes?: string;
  tags: string[];
  // Relations
  transactions: Transaction[];
  usages: Usage[];
  imageHistory: ImageHistory[];
}

interface Props {
  user: User;
}

// Country flag emoji from code
function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Format date nicely
function formatDate(dateStr?: string): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Time ago
function timeAgo(dateStr?: string): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function UserDetailClient({ user }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "images" | "billing" | "technical" | "admin">("overview");
  const [userData, setUserData] = useState(user);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState(user.internalNotes || "");
  const [selectedImage, setSelectedImage] = useState<ImageHistory | null>(null);

  const tabs = [
    { id: "overview", label: "Overview", icon: "👤" },
    { id: "activity", label: "Activity", icon: "📊" },
    { id: "images", label: "Images", icon: "🖼️" },
    { id: "billing", label: "Billing", icon: "💳" },
    { id: "technical", label: "Technical", icon: "🔧" },
    { id: "admin", label: "Admin", icon: "⚙️" },
  ];

  const updateUser = async (updates: Partial<User>) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update user");

      const data = await response.json();
      setUserData(data.user);
      toast.success("User updated successfully");
    } catch {
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const addCredits = async (amount: number) => {
    await updateUser({ credits: userData.credits + amount });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back button */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Users
      </Link>

      {/* User Header */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            {userData.image ? (
              <Image
                src={userData.image}
                alt={userData.name || userData.email}
                width={80}
                height={80}
                className="rounded-full"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-2xl font-bold">
                {(userData.name || userData.email)[0].toUpperCase()}
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-gray-800 ${
                userData.status === "active"
                  ? "bg-green-500"
                  : userData.status === "suspended"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            />
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{userData.name || "Unnamed User"}</h1>
              {userData.country && (
                <span className="text-xl" title={userData.countryName}>
                  {getCountryFlag(userData.country)}
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  userData.role === "admin"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : userData.role === "premium"
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                }`}
              >
                {userData.role}
              </span>
            </div>
            <p className="text-gray-400 mb-3">{userData.email}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Joined {formatDate(userData.createdAt)}</span>
              <span>|</span>
              <span>Last active {timeAgo(userData.lastActiveAt || userData.lastLoginAt)}</span>
              {userData.city && userData.countryName && (
                <>
                  <span>|</span>
                  <span>
                    {userData.city}, {userData.countryName}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{userData.credits}</div>
              <div className="text-xs text-gray-500">Credits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{userData.totalUsage}</div>
              <div className="text-xs text-gray-500">Usage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">${userData.totalSpent.toFixed(2)}</div>
              <div className="text-xs text-gray-500">Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{userData.totalSessions}</div>
              <div className="text-xs text-gray-500">Sessions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 mb-6">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 text-sm font-medium transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? "text-white border-b-2 border-green-500"
                  : "text-gray-400 hover:text-white border-b-2 border-transparent"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>👤</span> Basic Information
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Email</dt>
                  <dd>{userData.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Name</dt>
                  <dd>{userData.name || "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Role</dt>
                  <dd className="capitalize">{userData.role}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Status</dt>
                  <dd className="capitalize">{userData.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Auth Provider</dt>
                  <dd className="capitalize">{userData.authProvider || "email"}</dd>
                </div>
              </dl>
            </div>

            {/* Location */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>🌍</span> Location
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Country</dt>
                  <dd>
                    {userData.countryName
                      ? `${getCountryFlag(userData.country)} ${userData.countryName}`
                      : "-"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">City</dt>
                  <dd>{userData.city || "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Region</dt>
                  <dd>{userData.region || "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Timezone</dt>
                  <dd>{userData.timezone || "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Language</dt>
                  <dd>{userData.language || "-"}</dd>
                </div>
              </dl>
            </div>

            {/* Device Info */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>📱</span> Device
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Device Type</dt>
                  <dd className="capitalize">{userData.deviceType || "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Browser</dt>
                  <dd>
                    {userData.browser
                      ? `${userData.browser}${userData.browserVersion ? ` ${userData.browserVersion}` : ""}`
                      : "-"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">OS</dt>
                  <dd>
                    {userData.os
                      ? `${userData.os}${userData.osVersion ? ` ${userData.osVersion}` : ""}`
                      : "-"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Marketing Attribution */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>📣</span> Attribution
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Source</dt>
                  <dd>{userData.referralSource || "direct"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Medium</dt>
                  <dd>{userData.referralMedium || "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Campaign</dt>
                  <dd>{userData.referralCampaign || "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Landing Page</dt>
                  <dd className="truncate max-w-[200px]" title={userData.landingPage}>
                    {userData.landingPage || "-"}
                  </dd>
                </div>
                {userData.gclid && (
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Google Ads</dt>
                    <dd className="text-green-400">Yes (gclid)</dd>
                  </div>
                )}
                {userData.fbclid && (
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Facebook Ads</dt>
                    <dd className="text-blue-400">Yes (fbclid)</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Usage Stats */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>📈</span> Usage Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{userData.totalImagesProcessed}</div>
                  <div className="text-xs text-gray-400">Images Processed</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{userData.totalSessions}</div>
                  <div className="text-xs text-gray-400">Total Sessions</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{userData.totalPurchases}</div>
                  <div className="text-xs text-gray-400">Purchases</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400">${userData.lifetimeValue.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">LTV</div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-gray-300 capitalize">
                    {userData.lastToolUsed || "None"}
                  </div>
                  <div className="text-xs text-gray-400">Last Tool Used</div>
                </div>
              </div>
              {userData.preferredTools && userData.preferredTools.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-2">Preferred Tools:</p>
                  <div className="flex gap-2 flex-wrap">
                    {userData.preferredTools.map((tool) => (
                      <span
                        key={tool}
                        className="px-2 py-1 bg-gray-700 rounded text-sm capitalize"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            {userData.usages.length === 0 ? (
              <p className="text-gray-400">No activity yet</p>
            ) : (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Tool</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Credits</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {userData.usages.map((usage) => (
                      <tr key={usage.id} className="hover:bg-gray-700/30">
                        <td className="px-4 py-3 capitalize">
                          {usage.toolType?.replace(/_/g, ' ') || 'Unknown'}
                          {usage.creditsUsed === 0 && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">FREE</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {usage.creditsUsed === 0 ? (
                            <span className="text-gray-500">0</span>
                          ) : (
                            <span className="text-yellow-400">-{usage.creditsUsed}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{formatDate(usage.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Images Tab */}
        {activeTab === "images" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">User Created Images</h3>
            {userData.imageHistory.length === 0 ? (
              <p className="text-gray-400">No images processed yet</p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {userData.imageHistory.map((img) => (
                    <div
                      key={img.id}
                      className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden cursor-pointer hover:border-green-500 transition"
                      onClick={() => setSelectedImage(img)}
                    >
                      <div className="aspect-square relative bg-gray-900">
                        {img.processedUrl ? (
                          <img
                            src={img.processedUrl}
                            alt={img.toolType}
                            className="w-full h-full object-cover"
                          />
                        ) : img.originalUrl ? (
                          <img
                            src={img.originalUrl}
                            alt={img.toolType}
                            className="w-full h-full object-cover opacity-50"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            No preview
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium capitalize truncate">
                          {img.toolType?.replace(/_/g, ' ') || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(img.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Image Modal */}
                {selectedImage && (
                  <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedImage(null)}
                  >
                    <div
                      className="bg-gray-800 border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                        <h3 className="text-lg font-semibold capitalize">
                          {selectedImage.toolType?.replace(/_/g, ' ') || 'Image'}
                        </h3>
                        <button
                          onClick={() => setSelectedImage(null)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="p-4 grid md:grid-cols-2 gap-4">
                        {selectedImage.originalUrl && (
                          <div>
                            <p className="text-sm text-gray-400 mb-2">Original</p>
                            <img
                              src={selectedImage.originalUrl}
                              alt="Original"
                              className="w-full rounded-lg border border-gray-700"
                            />
                          </div>
                        )}
                        {selectedImage.processedUrl && (
                          <div>
                            <p className="text-sm text-gray-400 mb-2">Processed</p>
                            <img
                              src={selectedImage.processedUrl}
                              alt="Processed"
                              className="w-full rounded-lg border border-gray-700"
                            />
                          </div>
                        )}
                      </div>
                      <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
                        Created: {formatDate(selectedImage.createdAt)}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Transactions</h3>
              <div className="text-sm text-gray-400">
                Total Spent: <span className="text-green-400 font-bold">${userData.totalSpent.toFixed(2)}</span>
              </div>
            </div>
            {userData.transactions.length === 0 ? (
              <p className="text-gray-400">No transactions yet</p>
            ) : (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Type</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Amount</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Credits</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {userData.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-700/30">
                        <td className="px-4 py-3 capitalize">{tx.type}</td>
                        <td className="px-4 py-3 text-green-400">${tx.amount.toFixed(2)}</td>
                        <td className="px-4 py-3">+{tx.credits}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              tx.status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : tx.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{formatDate(tx.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Technical Tab */}
        {activeTab === "technical" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">IP Addresses</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Signup IP</dt>
                  <dd className="font-mono text-sm">{userData.signupIpAddress || "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Last IP</dt>
                  <dd className="font-mono text-sm">{userData.lastIpAddress || "-"}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Timestamps</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Created</dt>
                  <dd>{formatDate(userData.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Last Login</dt>
                  <dd>{formatDate(userData.lastLoginAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Last Active</dt>
                  <dd>{formatDate(userData.lastActiveAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Updated</dt>
                  <dd>{formatDate(userData.updatedAt)}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">User Agent</h3>
              <p className="text-sm text-gray-400 font-mono break-all">
                {userData.userAgent || "Not recorded"}
              </p>
            </div>
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === "admin" && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => addCredits(10)}
                  disabled={saving}
                  className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition disabled:opacity-50"
                >
                  +10 Credits
                </button>
                <button
                  onClick={() => addCredits(50)}
                  disabled={saving}
                  className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition disabled:opacity-50"
                >
                  +50 Credits
                </button>
                <button
                  onClick={() => addCredits(100)}
                  disabled={saving}
                  className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition disabled:opacity-50"
                >
                  +100 Credits
                </button>
                <button
                  onClick={() => updateUser({ role: "premium" })}
                  disabled={saving || userData.role === "premium"}
                  className="px-4 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/30 transition disabled:opacity-50"
                >
                  Make Premium
                </button>
                <button
                  onClick={() =>
                    updateUser({
                      status: userData.status === "active" ? "suspended" : "active",
                    })
                  }
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg transition disabled:opacity-50 ${
                    userData.status === "active"
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
                      : "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                  }`}
                >
                  {userData.status === "active" ? "Suspend User" : "Activate User"}
                </button>
              </div>
            </div>

            {/* Change Role/Status */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Change Role</h3>
                <select
                  value={userData.role}
                  onChange={(e) => updateUser({ role: e.target.value })}
                  disabled={saving}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                >
                  <option value="user">User</option>
                  <option value="premium">Premium</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Change Status</h3>
                <select
                  value={userData.status}
                  onChange={(e) => updateUser({ status: e.target.value })}
                  disabled={saving}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
            </div>

            {/* Internal Notes */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Internal Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500 resize-none"
                placeholder="Add internal notes about this user..."
              />
              <button
                onClick={() => updateUser({ internalNotes: notes })}
                disabled={saving || notes === userData.internalNotes}
                className="mt-3 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition disabled:opacity-50"
              >
                Save Notes
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-red-400">Danger Zone</h3>
              <p className="text-sm text-gray-400 mb-4">
                Banning a user will prevent them from accessing the platform. Permanent deletion removes all data.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to ban this user?")) {
                      updateUser({ status: "banned" });
                    }
                  }}
                  disabled={saving || userData.status === "banned"}
                  className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition disabled:opacity-50"
                >
                  Ban User
                </button>
                <button
                  onClick={async () => {
                    if (confirm("Are you sure you want to PERMANENTLY DELETE this user? This action cannot be undone!")) {
                      if (confirm("This will delete ALL user data. Are you absolutely sure?")) {
                        try {
                          const res = await fetch(`/api/admin/users/${userData.id}?hard=true`, { method: "DELETE" });
                          if (res.ok) {
                            alert("User deleted permanently");
                            window.location.href = "/admin/users";
                          } else {
                            alert("Failed to delete user");
                          }
                        } catch {
                          alert("Error deleting user");
                        }
                      }
                    }
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
