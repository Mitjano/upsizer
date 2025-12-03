"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CompetitorsPage() {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Link
            href={`/${locale}/admin/seo`}
            className="text-gray-400 hover:text-white transition"
          >
            SEO Hub
          </Link>
          <span className="text-gray-600">/</span>
          <h1 className="text-3xl font-bold">Competitor Analysis</h1>
        </div>
        <p className="text-gray-400">
          Track and compare with competitors
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-12 text-center">
        <div className="text-6xl mb-6">🎯</div>
        <h2 className="text-3xl font-bold text-white mb-4">Coming Soon</h2>
        <p className="text-gray-400 text-lg max-w-lg mx-auto mb-8">
          Competitor Analysis is under development. Soon you'll be able to:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📊</span>
              <h3 className="font-semibold text-white">Track Competitors</h3>
            </div>
            <p className="text-sm text-gray-400">
              Add competitor websites and track their keyword rankings
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🔄</span>
              <h3 className="font-semibold text-white">Compare Positions</h3>
            </div>
            <p className="text-sm text-gray-400">
              See how you rank compared to competitors for the same keywords
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🔍</span>
              <h3 className="font-semibold text-white">Discover Keywords</h3>
            </div>
            <p className="text-sm text-gray-400">
              Find keywords your competitors rank for that you don't
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📈</span>
              <h3 className="font-semibold text-white">Gap Analysis</h3>
            </div>
            <p className="text-sm text-gray-400">
              Identify content and backlink gaps vs competitors
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href={`/${locale}/admin/seo`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition"
          >
            <span>←</span> Back to SEO Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
