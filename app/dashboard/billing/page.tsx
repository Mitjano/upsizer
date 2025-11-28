"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Transaction {
  id: string;
  type: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  metadata?: {
    credits?: number;
    packageId?: string;
    planId?: string;
    billingPeriod?: string;
  };
}

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchTransactions();
    }
  }, [status, router]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/user/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    } finally {
      setPortalLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!session) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      case 'failed': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase': return '💳';
      case 'subscription': return '📦';
      default: return '💰';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'PLN' ? 'zł' : '$';
    return `${symbol}${amount.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-white mb-4 inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold mb-2 mt-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Billing & Transactions
            </h1>
            <p className="text-gray-400">View your payment history and manage your subscription</p>
          </div>
          <button
            onClick={openBillingPortal}
            disabled={portalLoading}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {portalLoading ? 'Loading...' : 'Manage Subscription'}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="text-green-400 text-3xl mb-2">💳</div>
            <div className="text-2xl font-bold mb-1">{transactions.length}</div>
            <div className="text-sm text-gray-400">Total Transactions</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="text-blue-400 text-3xl mb-2">📦</div>
            <div className="text-2xl font-bold mb-1">
              {transactions.filter(t => t.type === 'subscription').length}
            </div>
            <div className="text-sm text-gray-400">Subscription Payments</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="text-purple-400 text-3xl mb-2">🛒</div>
            <div className="text-2xl font-bold mb-1">
              {transactions.filter(t => t.type === 'purchase').length}
            </div>
            <div className="text-sm text-gray-400">One-time Purchases</div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-bold">Transaction History</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">💳</div>
              <h2 className="text-2xl font-bold mb-2">No transactions yet</h2>
              <p className="text-gray-400 mb-6">Your payment history will appear here</p>
              <Link
                href="/pricing"
                className="inline-block px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg font-semibold hover:opacity-90 transition"
              >
                View Pricing
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="px-6 py-4 hover:bg-gray-700/30 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{getTypeIcon(transaction.type)}</div>
                      <div>
                        <div className="font-semibold">
                          {transaction.type === 'subscription'
                            ? `Subscription: ${transaction.plan || 'Premium'}`
                            : `Credit Pack: ${transaction.metadata?.packageId || transaction.plan || 'One-time'}`
                          }
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-3">
                          <span>{new Date(transaction.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}</span>
                          {transaction.metadata?.credits && (
                            <span className="text-green-400">+{transaction.metadata.credits} credits</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gray-800/30 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-3">Need help with billing?</h3>
          <p className="text-gray-400 text-sm mb-4">
            If you have any questions about your charges or need help with your subscription,
            please contact our support team.
          </p>
          <Link
            href="/support"
            className="text-green-400 hover:text-green-300 text-sm font-medium"
          >
            Contact Support →
          </Link>
        </div>
      </div>
    </div>
  );
}
