"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: "📊",
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: "📈",
  },
  {
    name: "Blog Posts",
    href: "/admin/blog",
    icon: "📝",
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: "👥",
  },
  {
    name: "Marketing",
    href: "/admin/marketing",
    icon: "🎯",
  },
  {
    name: "Finance",
    href: "/admin/finance",
    icon: "💰",
  },
  {
    name: "SEO Tools",
    href: "/admin/seo",
    icon: "🔍",
  },
  {
    name: "System",
    href: "/admin/system",
    icon: "⚡",
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: "⚙️",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          type="button"
          className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition"
          onClick={() => {
            const sidebar = document.getElementById("admin-sidebar");
            sidebar?.classList.toggle("-translate-x-full");
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full lg:translate-x-0 bg-gray-900 border-r border-gray-800"
      >
        <div className="h-full px-3 py-6 overflow-y-auto flex flex-col">
          {/* Logo */}
          <Link href="/admin" className="flex items-center mb-8 px-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg mr-3"></div>
            <div>
              <h2 className="text-lg font-bold">Pixelift</h2>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="border-t border-gray-800 pt-4 space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              <span className="text-xl">🏠</span>
              <span className="font-medium">View Site</span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-all"
            >
              <span className="text-xl">🚪</span>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      <div
        className="fixed inset-0 bg-black/50 z-30 lg:hidden hidden"
        id="sidebar-overlay"
        onClick={() => {
          const sidebar = document.getElementById("admin-sidebar");
          sidebar?.classList.add("-translate-x-full");
        }}
      ></div>
    </>
  );
}
