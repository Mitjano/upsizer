"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg"></div>
          <span className="text-xl font-bold">Pixelift</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/#features" className="hover:text-green-400 transition">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-green-400 transition">
            Pricing
          </Link>
          <Link href="/blog" className="hover:text-green-400 transition">
            Blog
          </Link>
          <Link href="/#faq" className="hover:text-green-400 transition">
            FAQ
          </Link>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="w-8 h-8 border-2 border-gray-600 border-t-green-500 rounded-full animate-spin"></div>
          ) : session ? (
            <>
              <Link
                href="/dashboard"
                className="hidden md:block px-4 py-2 hover:text-green-400 transition"
              >
                Dashboard
              </Link>
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      {session.user?.name?.[0] || "U"}
                    </div>
                  )}
                  <span className="hidden md:block">
                    {session.user?.name?.split(" ")[0]}
                  </span>
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 hover:bg-gray-700 transition"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="block px-4 py-2 hover:bg-gray-700 transition"
                  >
                    Settings
                  </Link>
                  <hr className="border-gray-700" />
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 transition text-red-400"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="px-4 py-2 hover:text-green-400 transition"
              >
                Login
              </Link>
              <Link
                href="/auth/signin"
                className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <Link
              href="/#features"
              className="block py-2 hover:text-green-400 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="block py-2 hover:text-green-400 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              className="block py-2 hover:text-green-400 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/#faq"
              className="block py-2 hover:text-green-400 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            {session && (
              <>
                <hr className="border-gray-800" />
                <Link
                  href="/dashboard"
                  className="block py-2 hover:text-green-400 transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
