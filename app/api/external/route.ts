/**
 * External API endpoints for JuveStore Admin Hub integration.
 *
 * This module provides secure endpoints for the centralized Admin Hub to:
 * - Fetch aggregated statistics
 * - Monitor system health
 * - Retrieve revenue metrics
 * - Access user/tool analytics
 *
 * Authentication is done via HMAC-signed requests or API key.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { getAllUsers, getAllTransactions, getAllUsage } from '@/lib/db';

// Service identifier for this SaaS
const SERVICE_ID = 'pixelift';
const SERVICE_NAME = 'PixeLift';
const SERVICE_VERSION = '1.0.0';

// Tool labels for display
const TOOL_LABELS: Record<string, string> = {
  'upscale': 'Image Upscaler',
  'enhance': 'Quality Enhancement',
  'restore': 'Photo Restoration',
  'background': 'Background Removal',
  'background_remove': 'Background Removal',
  'packshot': 'Packshot Generator',
  'expand': 'Image Expansion',
  'compress': 'Image Compressor',
  'colorize': 'Photo Colorization',
  'denoise': 'Noise Removal',
  'object_removal': 'Object Removal',
  'ai_image': 'AI Image Generation',
  'ai_video': 'AI Video Generation',
  'style_transfer': 'Style Transfer',
  'face_restore': 'Face Restoration',
};

/**
 * Verify HMAC signature from Admin Hub.
 * Signature format: HMAC-SHA256(timestamp + ":" + body)
 */
function verifyAdminHubSignature(
  timestamp: string,
  signature: string,
  body: string = ''
): boolean {
  const adminHubSecret = process.env.ADMIN_HUB_SECRET;
  if (!adminHubSecret) return false;

  // Check timestamp freshness (5 minute window)
  const requestTime = parseInt(timestamp, 10);
  const currentTime = Math.floor(Date.now() / 1000);
  if (isNaN(requestTime) || Math.abs(currentTime - requestTime) > 300) {
    return false;
  }

  // Compute expected signature
  const message = `${timestamp}:${body}`;
  const expectedSignature = createHmac('sha256', adminHubSecret)
    .update(message)
    .digest('hex');

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Verify Admin Hub request authentication.
 * Supports two methods:
 * 1. API Key (simpler)
 * 2. HMAC Signature (more secure)
 */
async function verifyAdminHubRequest(request: NextRequest): Promise<boolean> {
  // Method 1: API Key
  const apiKey = request.headers.get('X-Admin-Hub-Key');
  const adminHubApiKey = process.env.ADMIN_HUB_API_KEY;
  if (apiKey && adminHubApiKey) {
    try {
      return timingSafeEqual(
        Buffer.from(apiKey),
        Buffer.from(adminHubApiKey)
      );
    } catch {
      return false;
    }
  }

  // Method 2: HMAC Signature
  const timestamp = request.headers.get('X-Admin-Hub-Timestamp');
  const signature = request.headers.get('X-Admin-Hub-Signature');
  if (timestamp && signature) {
    const body = await request.text();
    return verifyAdminHubSignature(timestamp, signature, body);
  }

  return false;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'health';

  // Health endpoint is public (for monitoring)
  if (endpoint === 'health') {
    return NextResponse.json({
      service: SERVICE_ID,
      name: SERVICE_NAME,
      version: SERVICE_VERSION,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  }

  // All other endpoints require authentication
  const isAuthenticated = await verifyAdminHubRequest(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { error: 'Invalid or missing Admin Hub credentials' },
      { status: 401 }
    );
  }

  try {
    switch (endpoint) {
      case 'stats':
        return await getStats(searchParams);
      case 'revenue':
        return await getRevenue(searchParams);
      case 'trends':
        return await getTrends(searchParams);
      case 'info':
        return await getServiceInfo();
      default:
        return NextResponse.json(
          { error: `Unknown endpoint: ${endpoint}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('External API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getStats(searchParams: URLSearchParams) {
  const [users, transactions, usage] = await Promise.all([
    getAllUsers(),
    getAllTransactions(),
    getAllUsage(),
  ]);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // ===== USER METRICS =====
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const usersThisWeek = users.filter(u => new Date(u.createdAt) >= weekAgo).length;
  const usersThisMonth = users.filter(u => new Date(u.createdAt) >= monthAgo).length;

  // Users by role
  const usersByRole: Record<string, number> = {};
  users.forEach(u => {
    usersByRole[u.role] = (usersByRole[u.role] || 0) + 1;
  });

  // ===== USAGE METRICS =====
  const totalOperations = usage.length;
  const operationsThisWeek = usage.filter(u => new Date(u.createdAt) >= weekAgo).length;
  const operationsThisMonth = usage.filter(u => new Date(u.createdAt) >= monthAgo).length;

  // Operations by tool
  const operationsByTool: Record<string, number> = {};
  usage.forEach(u => {
    operationsByTool[u.type] = (operationsByTool[u.type] || 0) + 1;
  });

  // Total credits used
  const totalCreditsUsed = usage.reduce((sum, u) => sum + (u.creditsUsed || 0), 0);
  const creditsThisWeek = usage
    .filter(u => new Date(u.createdAt) >= weekAgo)
    .reduce((sum, u) => sum + (u.creditsUsed || 0), 0);

  // Success rate (last 30 days)
  const recentUsage = usage.filter(u => new Date(u.createdAt) >= monthAgo);
  const successfulOps = recentUsage.filter(u => u.status === 'completed').length;
  const failedOps = recentUsage.filter(u => u.status === 'failed').length;
  const successRate = (successfulOps + failedOps) > 0
    ? (successfulOps / (successfulOps + failedOps) * 100)
    : 100;

  return NextResponse.json({
    service: SERVICE_ID,
    name: SERVICE_NAME,
    timestamp: new Date().toISOString(),
    users: {
      total: totalUsers,
      active: activeUsers,
      this_week: usersThisWeek,
      this_month: usersThisMonth,
      by_role: usersByRole,
    },
    operations: {
      total: totalOperations,
      this_week: operationsThisWeek,
      this_month: operationsThisMonth,
      by_tool: operationsByTool,
    },
    credits: {
      total_used: totalCreditsUsed,
      used_this_week: creditsThisWeek,
      success_rate: Math.round(successRate * 10) / 10,
    },
  });
}

async function getRevenue(searchParams: URLSearchParams) {
  const [users, transactions] = await Promise.all([
    getAllUsers(),
    getAllTransactions(),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Filter completed transactions
  const completedTransactions = transactions.filter(t => t.status === 'completed');

  // Revenue this month
  const monthRevenue = completedTransactions
    .filter(t => new Date(t.createdAt) >= monthStart)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Revenue last month
  const lastMonthRevenue = completedTransactions
    .filter(t => {
      const date = new Date(t.createdAt);
      return date >= lastMonthStart && date <= lastMonthEnd;
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Revenue by plan
  const revenueByPlan: Record<string, { count: number; amount: number }> = {};
  completedTransactions
    .filter(t => new Date(t.createdAt) >= monthStart)
    .forEach(t => {
      const plan = t.plan || 'unknown';
      if (!revenueByPlan[plan]) {
        revenueByPlan[plan] = { count: 0, amount: 0 };
      }
      revenueByPlan[plan].count++;
      revenueByPlan[plan].amount += t.amount || 0;
    });

  // Paying users (users with completed transactions)
  const payingUserIds = new Set(completedTransactions.map(t => t.userId));
  const payingUsers = payingUserIds.size;

  // New transactions this month
  const newTransactionsMonth = completedTransactions
    .filter(t => new Date(t.createdAt) >= monthStart).length;

  // Growth calculation
  const growthPercent = lastMonthRevenue > 0
    ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
    : 0;

  return NextResponse.json({
    service: SERVICE_ID,
    name: SERVICE_NAME,
    timestamp: new Date().toISOString(),
    currency: 'PLN',
    mrr: Math.round(monthRevenue * 100) / 100, // Simplified MRR
    revenue: {
      this_month: Math.round(monthRevenue * 100) / 100,
      last_month: Math.round(lastMonthRevenue * 100) / 100,
      growth_percent: Math.round(growthPercent * 10) / 10,
    },
    subscriptions: {
      by_plan: revenueByPlan,
      paying_users: payingUsers,
      new_this_month: newTransactionsMonth,
    },
  });
}

async function getTrends(searchParams: URLSearchParams) {
  const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30', 10), 7), 90);

  const [users, transactions, usage] = await Promise.all([
    getAllUsers(),
    getAllTransactions(),
    getAllUsage(),
  ]);

  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Initialize daily buckets
  const dailyUsers: Record<string, number> = {};
  const dailyOperations: Record<string, { total: number; completed: number; failed: number }> = {};
  const dailyRevenue: Record<string, number> = {};

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    dailyUsers[dateStr] = 0;
    dailyOperations[dateStr] = { total: 0, completed: 0, failed: 0 };
    dailyRevenue[dateStr] = 0;
  }

  // Aggregate user signups
  users
    .filter(u => new Date(u.createdAt) >= startDate)
    .forEach(u => {
      const dateStr = u.createdAt.split('T')[0];
      if (dailyUsers[dateStr] !== undefined) {
        dailyUsers[dateStr]++;
      }
    });

  // Aggregate operations
  usage
    .filter(u => new Date(u.createdAt) >= startDate)
    .forEach(u => {
      const dateStr = u.createdAt.split('T')[0];
      if (dailyOperations[dateStr]) {
        dailyOperations[dateStr].total++;
        if (u.status === 'completed') {
          dailyOperations[dateStr].completed++;
        } else if (u.status === 'failed') {
          dailyOperations[dateStr].failed++;
        }
      }
    });

  // Aggregate revenue
  transactions
    .filter(t => t.status === 'completed' && new Date(t.createdAt) >= startDate)
    .forEach(t => {
      const dateStr = t.createdAt.split('T')[0];
      if (dailyRevenue[dateStr] !== undefined) {
        dailyRevenue[dateStr] += t.amount || 0;
      }
    });

  // Convert to arrays
  const usersData = Object.entries(dailyUsers).map(([date, value]) => ({ date, value }));
  const operationsData = Object.entries(dailyOperations).map(([date, data]) => ({
    date,
    total: data.total,
    completed: data.completed,
    failed: data.failed,
  }));
  const revenueData = Object.entries(dailyRevenue).map(([date, value]) => ({
    date,
    value: Math.round(value * 100) / 100,
  }));

  return NextResponse.json({
    service: SERVICE_ID,
    name: SERVICE_NAME,
    timestamp: new Date().toISOString(),
    period_days: days,
    trends: {
      users: usersData,
      operations: operationsData,
      revenue: revenueData,
    },
  });
}

async function getServiceInfo() {
  return NextResponse.json({
    service: SERVICE_ID,
    name: SERVICE_NAME,
    version: SERVICE_VERSION,
    description: 'AI-Powered Image & Video Enhancement Platform',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://pixelift.pl',
    api_base: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pixelift.pl'}/api`,
    environment: process.env.NODE_ENV,
    capabilities: [
      'image_upscaling',
      'background_removal',
      'ai_image_generation',
      'ai_video_generation',
      'photo_restoration',
      'style_transfer',
      'image_compression',
    ],
    subscription_tiers: [
      { id: 'free', name: 'Free', price: 0 },
      { id: 'starter', name: 'Starter', price: 29 },
      { id: 'pro', name: 'Pro', price: 79 },
      { id: 'business', name: 'Business', price: 199 },
      { id: 'enterprise', name: 'Enterprise', price: 499 },
    ],
    tools: Object.entries(TOOL_LABELS).map(([id, name]) => ({ id, name })),
    endpoints: {
      health: '/api/external?endpoint=health',
      stats: '/api/external?endpoint=stats',
      revenue: '/api/external?endpoint=revenue',
      trends: '/api/external?endpoint=trends',
      info: '/api/external?endpoint=info',
    },
    timestamp: new Date().toISOString(),
  });
}
