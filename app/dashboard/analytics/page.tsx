'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { FiArrowLeft, FiShield } from 'react-icons/fi';
import Link from 'next/link';

// Admin emails that can access analytics
const ADMIN_EMAILS = ['michalchmielarz00@gmail.com'];

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    if (status !== 'loading') {
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      // Check if user is admin
      const email = session.user?.email;
      if (email && ADMIN_EMAILS.includes(email)) {
        setIsAdmin(true);
      }
      setCheckingAccess(false);
    }
  }, [session, status, router]);

  if (status === 'loading' || checkingAccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-zinc-400 mb-6">
            You don&apos;t have permission to view analytics. This page is restricted to administrators.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-4 transition"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-zinc-400 mt-1">Monitor your app&apos;s performance and user engagement</p>
        </div>

        {/* Analytics Dashboard Component */}
        <AnalyticsDashboard />
      </div>
    </div>
  );
}
