'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import ToolsLayout from '@/components/ToolsLayout';
import Link from 'next/link';

// Lazy load heavy components
const AgentChat = dynamic(
  () => import('@/components/ai-agent/AgentChat'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function AIAgentPage() {
  const t = useTranslations('aiAgentPage');
  const { data: session } = useSession();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <ToolsLayout>
      {/* Compact Header + Chat Section */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-4 pb-8">
        {/* Compact Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  AI Agent
                  <span className="px-2 py-0.5 bg-cyan-600/30 text-cyan-400 text-xs rounded-full">PRO</span>
                </h1>
                <p className="text-gray-400 text-sm">{t('hero.subtitle')}</p>
              </div>
            </div>

            {/* Quick info */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg">
                <span className="text-cyan-400">🔧</span>
                <span className="text-gray-300">28+ narzędzi</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg">
                <span className="text-green-400">⚡</span>
                <span className="text-gray-300">Streaming</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat - Full Height */}
        <div className="h-[calc(100vh-200px)] min-h-[500px]">
          <AgentChat />
        </div>
      </section>
    </ToolsLayout>
  );
}
