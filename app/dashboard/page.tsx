"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/Header";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

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
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {session.user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-gray-400">
            Manage your account and view your image processing history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="text-green-400 text-3xl mb-2">⚡</div>
            <div className="text-2xl font-bold mb-1">0</div>
            <div className="text-sm text-gray-400">Images Processed</div>
          </div>

          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="text-blue-400 text-3xl mb-2">💎</div>
            <div className="text-2xl font-bold mb-1">3</div>
            <div className="text-sm text-gray-400">Credits Remaining</div>
          </div>

          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="text-purple-400 text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold mb-1">Free</div>
            <div className="text-sm text-gray-400">Current Plan</div>
          </div>

          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="text-yellow-400 text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold mb-1">0</div>
            <div className="text-sm text-gray-400">Total Saved</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          <div className="text-center py-12 text-gray-400">
            <svg
              className="mx-auto h-16 w-16 mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p>No images processed yet</p>
            <p className="text-sm mt-2">
              Go to the home page to start upscaling images!
            </p>
            <a
              href="/"
              className="inline-block mt-4 px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition"
            >
              Start Upscaling
            </a>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <a
            href="/"
            className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 hover:border-green-500 transition group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition">🚀</div>
            <h3 className="text-xl font-semibold mb-2">Upscale Image</h3>
            <p className="text-gray-400 text-sm">
              Process a new image with AI upscaling
            </p>
          </a>

          <a
            href="/pricing"
            className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 hover:border-green-500 transition group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition">💳</div>
            <h3 className="text-xl font-semibold mb-2">Upgrade Plan</h3>
            <p className="text-gray-400 text-sm">
              Get more credits and unlock features
            </p>
          </a>

          <a
            href="/dashboard/settings"
            className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 hover:border-green-500 transition group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition">⚙️</div>
            <h3 className="text-xl font-semibold mb-2">Settings</h3>
            <p className="text-gray-400 text-sm">
              Manage your account preferences
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
