"use client";

import { FcGoogle } from "react-icons/fc";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg"></div>
          <span className="text-2xl font-bold">Pixelift</span>
        </Link>

        {/* Card */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-center mb-8">
            Sign in to access your dashboard
          </p>

          {/* Google Sign In - Direct Link Approach */}
          <a
            href="/api/auth/signin/google?callbackUrl=/dashboard"
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 hover:bg-gray-100 py-3 px-6 rounded-lg font-medium transition"
          >
            <FcGoogle className="text-2xl" />
            Continue with Google
          </a>

          {/* Info */}
          <p className="text-center text-sm text-gray-400 mt-6">
            Sign in with your Google account to get started. Your account will be created automatically on first sign-in.
          </p>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
