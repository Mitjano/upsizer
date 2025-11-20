"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/Header";
import EnhancedImageUploader from "@/components/EnhancedImageUploader";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && session?.user) {
      // Sync user data to Firebase
      fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.email, // Using email as userId
          email: session.user.email,
          displayName: session.user.name,
          photoURL: session.user.image,
        }),
      }).catch((err) => console.error("Failed to sync user:", err));
    }
  }, [status, session, router]);

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

        {/* Image Upscaler */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">AI Image Upscaler</h2>
          <EnhancedImageUploader />
          <p className="text-sm text-gray-500 mt-4 text-center">
            By uploading a file or URL you agree to our Terms of Use and Privacy Policy.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
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
