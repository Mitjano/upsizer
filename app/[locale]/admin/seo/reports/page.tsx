"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ReportsPage() {
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
          <h1 className="text-3xl font-bold">SEO Reports</h1>
        </div>
        <p className="text-gray-400">
          Automated weekly and monthly reports
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-12 text-center">
        <div className="text-6xl mb-6">📈</div>
        <h2 className="text-3xl font-bold text-white mb-4">Coming Soon</h2>
        <p className="text-gray-400 text-lg max-w-lg mx-auto mb-8">
          SEO Reports module is under development. Soon you'll be able to:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📊</span>
              <h3 className="font-semibold text-white">Automated Reports</h3>
            </div>
            <p className="text-sm text-gray-400">
              Weekly and monthly reports generated automatically
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📧</span>
              <h3 className="font-semibold text-white">Email Delivery</h3>
            </div>
            <p className="text-sm text-gray-400">
              Receive reports directly in your inbox
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📉</span>
              <h3 className="font-semibold text-white">Trend Analysis</h3>
            </div>
            <p className="text-sm text-gray-400">
              Track ranking trends over time with charts
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📄</span>
              <h3 className="font-semibold text-white">PDF Export</h3>
            </div>
            <p className="text-sm text-gray-400">
              Download reports as PDF for sharing
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
