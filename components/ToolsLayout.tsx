'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Tool {
  name: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
}

const tools: Tool[] = [
  {
    name: 'Image Upscaler',
    href: '/tools/upscaler',
    description: 'Enhance and enlarge images up to 8x',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
    ),
  },
  {
    name: 'Background Remover',
    href: '/tools/remove-bg',
    description: 'Remove backgrounds with AI precision',
    badge: 'NEW',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
];

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Tools Navigation Bar */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-lg sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-4">
            {tools.map((tool) => {
              const isActive = pathname === tool.href;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`flex items-center gap-3 px-6 py-3 rounded-lg whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {tool.icon}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{tool.name}</span>
                      {tool.badge && (
                        <span className="px-2 py-0.5 text-xs bg-green-500 text-white rounded-full">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{tool.description}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tool Content */}
      <main>{children}</main>
    </div>
  );
}
