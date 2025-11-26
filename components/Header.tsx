"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isToolsPage = pathname?.startsWith('/tools/');

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
          <span className="text-xl font-bold" style={{color: '#ffffff'}}>Pixelift</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 text-white">
          {/* Tools Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowToolsDropdown(!showToolsDropdown)}
              className={`flex items-center gap-1 transition font-medium ${
                isToolsPage ? 'text-green-400' : 'text-white hover:text-green-400'
              }`}
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
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-700 transition-colors ${
                      pathname === '/tools/upscaler' ? 'bg-gray-700/50' : ''
                    }`}
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

                  {/* Background Remover */}
                  <Link
                    href="/tools/remove-background"
                    onClick={() => setShowToolsDropdown(false)}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-700 transition-colors ${
                      pathname === '/tools/remove-background' ? 'bg-gray-700/50' : ''
                    }`}
                  >
                    <div className="mt-1 text-blue-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-white">Background Remover</div>
                      <div className="text-sm text-gray-400">Remove image backgrounds with AI</div>
                    </div>
                  </Link>

                  {/* Image Compressor */}
                  <Link
                    href="/tools/image-compressor"
                    onClick={() => setShowToolsDropdown(false)}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-700 transition-colors ${
                      pathname === '/tools/image-compressor' ? 'bg-gray-700/50' : ''
                    }`}
                  >
                    <div className="mt-1 text-cyan-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-white">Image Compressor</div>
                      <div className="text-sm text-gray-400">Reduce file size with smart compression</div>
                    </div>
                  </Link>

                  {/* Packshot Generator */}
                  <Link
                    href="/tools/packshot-generator"
                    onClick={() => setShowToolsDropdown(false)}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-700 transition-colors ${
                      pathname === '/tools/packshot-generator' ? 'bg-gray-700/50' : ''
                    }`}
                  >
                    <div className="mt-1 text-pink-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">Packshot Generator</span>
                        <span className="px-2 py-0.5 text-xs bg-pink-500 text-white rounded-full">
                          NEW
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">Generate professional product packshots</div>
                    </div>
                  </Link>

                  {/* Coming Soon - Face Restoration */}
                  <div className="flex items-start gap-3 px-4 py-3 opacity-50 cursor-not-allowed">
                    <div className="mt-1 text-green-400">
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
                  <span className="hidden md:block" style={{color: '#ffffff'}}>
                    {session.user?.name?.split(" ")[0]}
                  </span>
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 hover:bg-gray-700 transition"
                    style={{color: '#ffffff'}}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/api"
                    className="block px-4 py-2 hover:bg-gray-700 transition"
                    style={{color: '#ffffff'}}
                  >
                    API Keys
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="block px-4 py-2 hover:bg-gray-700 transition"
                    style={{color: '#ffffff'}}
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
            {/* Tools Section */}
            <div className="border-b border-gray-800 pb-3 mb-3">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Tools</div>
              <Link
                href="/tools/upscaler"
                className="block py-2 text-white hover:text-green-400 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Image Upscaler
              </Link>
              <Link
                href="/tools/remove-background"
                className="block py-2 text-white hover:text-green-400 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Background Remover
              </Link>
              <Link
                href="/tools/image-compressor"
                className="block py-2 text-white hover:text-green-400 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Image Compressor
              </Link>
              <Link
                href="/tools/packshot-generator"
                className="block py-2 text-white hover:text-green-400 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Packshot Generator <span className="text-xs bg-pink-500 px-2 py-0.5 rounded-full ml-2">NEW</span>
              </Link>
            </div>

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
