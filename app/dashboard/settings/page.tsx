"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [emailPrefs, setEmailPrefs] = useState({
    marketing: false,
    productUpdates: true,
    processingNotifications: true,
    securityAlerts: true,
    weeklyDigest: false,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Load email preferences
  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/user/preferences')
        .then(res => res.json())
        .then(data => {
          if (data.preferences) {
            setEmailPrefs(data.preferences);
          }
        })
        .catch(err => console.error('Failed to load preferences:', err));
    }
  }, [session]);

  const handlePreferenceChange = (key: keyof typeof emailPrefs) => {
    setEmailPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveEmailPreferences = async () => {
    setSavingPrefs(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: emailPrefs }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Email preferences saved!');
    } catch (error) {
      console.error('Save preferences error:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/user/export-data');
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pixelift-data-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== session?.user?.email) {
      toast.error('Email does not match');
      return;
    }
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" exactly');
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmEmail: deleteConfirmEmail,
          confirmText: deleteConfirmText,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Deletion failed');
      }

      toast.success('Account deleted. Goodbye!');
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account';
      toast.error(message);
      setDeleting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-white mb-4 inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2 mt-4">Settings</h1>
          <p className="text-gray-400">Manage your account preferences</p>
        </div>

        {/* Settings Tabs */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700">
          {/* Tab Navigation */}
          <div className="border-b border-gray-700">
            <div className="flex gap-6 px-6">
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-4 border-b-2 transition ${
                  activeTab === "profile"
                    ? "border-green-500 text-green-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`py-4 border-b-2 transition ${
                  activeTab === "notifications"
                    ? "border-green-500 text-green-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                Notifications
              </button>
              <button
                onClick={() => setActiveTab("preferences")}
                className={`py-4 border-b-2 transition ${
                  activeTab === "preferences"
                    ? "border-green-500 text-green-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                Preferences
              </button>
              <button
                onClick={() => setActiveTab("privacy")}
                className={`py-4 border-b-2 transition ${
                  activeTab === "privacy"
                    ? "border-green-500 text-green-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                Privacy & Data
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-20 h-20 rounded-full"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-3xl">
                      {session.user?.name?.[0] || "U"}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{session.user?.name}</h3>
                    <p className="text-gray-400">{session.user?.email}</p>
                  </div>
                </div>

                {/* Account Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={session.user?.email || ""}
                      disabled
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email is managed through your Google account
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={session.user?.name || ""}
                      disabled
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Name is managed through your Google account
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Email Notification Preferences</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Choose which types of emails you want to receive from Pixelift.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                    <div>
                      <h3 className="font-medium">Processing Notifications</h3>
                      <p className="text-sm text-gray-400">
                        Get notified when your images finish processing
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={emailPrefs.processingNotifications}
                        onChange={() => handlePreferenceChange('processingNotifications')}
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                    <div>
                      <h3 className="font-medium">Product Updates</h3>
                      <p className="text-sm text-gray-400">
                        New features, improvements, and important announcements
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={emailPrefs.productUpdates}
                        onChange={() => handlePreferenceChange('productUpdates')}
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                    <div>
                      <h3 className="font-medium">Security Alerts</h3>
                      <p className="text-sm text-gray-400">
                        Login notifications and security-related updates
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={emailPrefs.securityAlerts}
                        onChange={() => handlePreferenceChange('securityAlerts')}
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                    <div>
                      <h3 className="font-medium">Weekly Digest</h3>
                      <p className="text-sm text-gray-400">
                        Weekly summary of your usage and credits
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={emailPrefs.weeklyDigest}
                        onChange={() => handlePreferenceChange('weeklyDigest')}
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                    <div>
                      <h3 className="font-medium">Marketing & Promotions</h3>
                      <p className="text-sm text-gray-400">
                        Special offers, discounts, and promotional content
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={emailPrefs.marketing}
                        onChange={() => handlePreferenceChange('marketing')}
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={saveEmailPreferences}
                    disabled={savingPrefs}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition flex items-center gap-2"
                  >
                    {savingPrefs ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Preferences'
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Preferences</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Default Image Quality
                    </label>
                    <select className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      <option value="2x">2x (Balanced)</option>
                      <option value="4x">4x (High Quality)</option>
                      <option value="8x">8x (Maximum Quality)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Default Output Format
                    </label>
                    <select className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      <option value="png">PNG (Lossless)</option>
                      <option value="jpg">JPG (Smaller Size)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                    <div>
                      <h3 className="font-medium">Auto-download Results</h3>
                      <p className="text-sm text-gray-400">
                        Automatically download processed images
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition">
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Privacy & Data Management</h2>
                <p className="text-gray-400">
                  Manage your personal data in accordance with GDPR and privacy regulations.
                </p>

                {/* Export Data */}
                <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">📦</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Export Your Data</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Download a copy of all your data including profile information, transaction history,
                        usage statistics, support tickets, and processed images metadata.
                      </p>
                      <button
                        onClick={handleExportData}
                        disabled={exporting}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition flex items-center gap-2"
                      >
                        {exporting ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Exporting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export All Data (JSON)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Data Retention */}
                <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">🗂️</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Data Retention</h3>
                      <p className="text-gray-400 text-sm">
                        Your processed images are stored for 30 days. Transaction and usage history is retained
                        for accounting purposes. You can delete individual images from your{" "}
                        <Link href="/dashboard/images" className="text-green-400 hover:underline">
                          Image History
                        </Link>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="bg-red-900/20 rounded-lg p-6 border border-red-800">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">⚠️</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2 text-red-400">Delete Account</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Permanently delete your account and all associated data. This action is irreversible
                        and cannot be undone. You will lose access to all your processed images, transaction
                        history, and any remaining credits.
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition"
                      >
                        Delete My Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-red-400">Delete Account</h2>
              <p className="text-gray-400 mt-2">
                This action is permanent and cannot be undone.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Enter your email to confirm
                </label>
                <input
                  type="email"
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  placeholder={session?.user?.email || ''}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Type &quot;DELETE MY ACCOUNT&quot; to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-300">
                <strong>Warning:</strong> All your data will be permanently deleted including:
              </p>
              <ul className="text-sm text-red-300 mt-2 list-disc list-inside">
                <li>Profile and account information</li>
                <li>All processed images</li>
                <li>Transaction and usage history</li>
                <li>Support tickets</li>
                <li>Remaining credits (no refunds)</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmEmail("");
                  setDeleteConfirmText("");
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmEmail !== session?.user?.email || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Forever'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
