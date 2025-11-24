"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowToolsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg"></div>
          <span className="text-xl font-bold text-white">Pixelift</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 text-white">
          {/* Tools Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowToolsDropdown(!showToolsDropdown)}
              className="flex items-center gap-1 text-white hover:text-green-400 transition font-medium"
            >
              Tools
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  showToolsDropdown ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showToolsDropdown && (
              <div className="absolute left-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                <div className="py-2">
                  {/* Image Upscaler */}
                  <Link
                    href="/tools/upscaler"
                    onClick={() => setShowToolsDropdown(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-700 transition-colors"
                  >
                    <div className="mt-1 text-purple-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-white">Image Upscaler</div>
                      <div className="text-sm text-gray-400">Enhance images up to 8x resolution</div>
                    </div>
                  </Link>

                  {/* Coming Soon - Face Restoration */}
                  <div className="flex items-start gap-3 px-4 py-3 opacity-50 cursor-not-allowed">
                    <div className="mt-1 text-blue-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">Face Restoration</span>
                        <span className="px-2 py-0.5 text-xs bg-gray-600 text-white rounded-full">
                          SOON
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">Restore and enhance face photos</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link href="/#use-cases" className="text-white hover:text-green-400 transition">
            Use Cases
          </Link>
          <Link href="/pricing" className="text-white hover:text-green-400 transition">
            Pricing
          </Link>
          <Link href="/blog" className="text-white hover:text-green-400 transition">
            Blog
          </Link>
          <Link href="/#faq" className="text-white hover:text-green-400 transition">
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
                className="hidden md:block px-4 py-2 text-white hover:text-green-400 transition"
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
                    href="/dashboard/api"
                    className="block px-4 py-2 hover:bg-gray-700 transition"
                  >
                    API Keys
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
                className="px-4 py-2 text-white hover:text-green-400 transition"
              >
                Login
              </Link>
              <Link
                href="/auth/signin"
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition"
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
              className="block py-2 text-white hover:text-green-400 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/#use-cases"
              className="block py-2 text-white hover:text-green-400 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Use Cases
            </Link>
            <Link
              href="/pricing"
              className="block py-2 text-white hover:text-green-400 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              className="block py-2 text-white hover:text-green-400 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/#faq"
              className="block py-2 text-white hover:text-green-400 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            {session && (
              <>
                <hr className="border-gray-800" />
                <Link
                  href="/dashboard"
                  className="block py-2 text-white hover:text-green-400 transition"
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
