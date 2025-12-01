import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { getAllUsers, getAllUsage, getAllTransactions } from '@/lib/db';

// Replicate API costs per model (approximate USD)
const REPLICATE_COSTS = {
  'real-esrgan': 0.0023,      // ~$0.0023 per run for upscaling
  'gfpgan': 0.0015,           // ~$0.0015 per run for face restoration
  'rembg': 0.0012,            // ~$0.0012 per run for background removal
  'stable-diffusion': 0.0046, // ~$0.0046 per run for image generation
  'default': 0.002,           // Default estimate
};

// Map tool types to Replicate models
const TOOL_TO_MODEL: Record<string, keyof typeof REPLICATE_COSTS> = {
  'upscale': 'real-esrgan',
  'enhance': 'real-esrgan',
  'restore': 'gfpgan',
  'face': 'gfpgan',
  'background': 'rembg',
  'background_remove': 'rembg',
  'packshot': 'rembg',
  'expand': 'stable-diffusion',
  'compress': 'default',
};

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // week, month, year

    // Get all data
    const [users, usage, transactions] = await Promise.all([
      getAllUsers(),
      getAllUsage(),
      getAllTransactions(),
    ]);

    // Calculate date ranges
    const now = new Date();
    const periodStart = new Date();
    const previousPeriodStart = new Date();

    switch (period) {
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        previousPeriodStart.setDate(now.getDate() - 14);
        break;
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1);
        previousPeriodStart.setFullYear(now.getFullYear() - 2);
        break;
      default: // month
        periodStart.setMonth(now.getMonth() - 1);
        previousPeriodStart.setMonth(now.getMonth() - 2);
    }

    // Filter usage for current period
    const currentPeriodUsage = usage.filter(u => new Date(u.createdAt) >= periodStart);
    const previousPeriodUsage = usage.filter(u => {
      const date = new Date(u.createdAt);
      return date >= previousPeriodStart && date < periodStart;
    });

    // Filter transactions for current period
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const currentPeriodTransactions = completedTransactions.filter(t =>
      new Date(t.createdAt) >= periodStart
    );
    const previousPeriodTransactions = completedTransactions.filter(t => {
      const date = new Date(t.createdAt);
      return date >= previousPeriodStart && date < periodStart;
    });

    // === CREDIT STATISTICS ===
    const totalCreditsInSystem = users.reduce((sum, u) => sum + (u.credits || 0), 0);
    const totalCreditsUsed = usage.reduce((sum, u) => sum + (u.creditsUsed || 0), 0);
    const currentPeriodCreditsUsed = currentPeriodUsage.reduce((sum, u) => sum + (u.creditsUsed || 0), 0);
    const previousPeriodCreditsUsed = previousPeriodUsage.reduce((sum, u) => sum + (u.creditsUsed || 0), 0);

    // === REVENUE STATISTICS ===
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const currentPeriodRevenue = currentPeriodTransactions.reduce((sum, t) => sum + t.amount, 0);
    const previousPeriodRevenue = previousPeriodTransactions.reduce((sum, t) => sum + t.amount, 0);
    const revenueGrowth = previousPeriodRevenue > 0
      ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue * 100).toFixed(1)
      : '0';

    // === API COST ESTIMATION ===
    const estimateApiCost = (usageRecords: typeof usage) => {
      return usageRecords.reduce((sum, u) => {
        const model = TOOL_TO_MODEL[u.type] || 'default';
        const costPerRun = REPLICATE_COSTS[model];
        return sum + costPerRun;
      }, 0);
    };

    const totalApiCost = estimateApiCost(usage);
    const currentPeriodApiCost = estimateApiCost(currentPeriodUsage);
    const previousPeriodApiCost = estimateApiCost(previousPeriodUsage);

    // === USAGE BY TOOL TYPE ===
    const usageByType = usage.reduce((acc, u) => {
      acc[u.type] = (acc[u.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const apiCostByType = Object.entries(usageByType).map(([type, count]) => {
      const model = TOOL_TO_MODEL[type] || 'default';
      const costPerRun = REPLICATE_COSTS[model];
      return {
        type,
        count,
        totalCost: (count * costPerRun).toFixed(4),
        costPerRun: costPerRun.toFixed(4),
      };
    }).sort((a, b) => parseFloat(b.totalCost) - parseFloat(a.totalCost));

    // === USER STATISTICS ===
    const activeUsers = users.filter(u => u.status === 'active').length;
    const usersWithCredits = users.filter(u => (u.credits || 0) > 0).length;
    // Use role to determine paid users (premium/admin are paid, user is free)
    const freeUsers = users.filter(u => u.role === 'user').length;
    const paidUsers = users.filter(u => u.role === 'premium' || u.role === 'admin').length;

    // === PROFIT CALCULATION ===
    // Assuming average credit price of 0.10 PLN and API cost in USD (exchange rate ~4 PLN/USD)
    const avgCreditPrice = 0.10; // PLN per credit
    const usdToPlnRate = 4.0;
    const totalApiCostPln = totalApiCost * usdToPlnRate;
    const currentApiCostPln = currentPeriodApiCost * usdToPlnRate;
    const grossProfit = totalRevenue - totalApiCostPln;
    const currentGrossProfit = currentPeriodRevenue - currentApiCostPln;
    const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0';

    // === FORECASTING ===
    // Daily average usage rate
    const daysInPeriod = period === 'week' ? 7 : period === 'year' ? 365 : 30;
    const dailyAvgCreditsUsed = currentPeriodCreditsUsed / daysInPeriod;
    const dailyAvgApiCost = currentPeriodApiCost / daysInPeriod;

    // Forecast for next 30 days
    const forecastCreditsUsed30Days = dailyAvgCreditsUsed * 30;
    const forecastApiCost30Days = dailyAvgApiCost * 30;

    // Days until credits run out (based on current rate)
    const daysUntilCreditsDeplete = dailyAvgCreditsUsed > 0
      ? Math.floor(totalCreditsInSystem / dailyAvgCreditsUsed)
      : Infinity;

    // === TRENDS DATA (last 30 days by day) ===
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const dailyStats = last30Days.map(dateStr => {
      const dayUsage = usage.filter(u => u.createdAt.startsWith(dateStr));
      const dayTransactions = completedTransactions.filter(t => t.createdAt.startsWith(dateStr));
      const dayCreditsUsed = dayUsage.reduce((sum, u) => sum + (u.creditsUsed || 0), 0);
      const dayApiCost = estimateApiCost(dayUsage);
      const dayRevenue = dayTransactions.reduce((sum, t) => sum + t.amount, 0);

      return {
        date: dateStr,
        creditsUsed: dayCreditsUsed,
        apiCost: parseFloat(dayApiCost.toFixed(4)),
        apiCostPln: parseFloat((dayApiCost * usdToPlnRate).toFixed(2)),
        revenue: dayRevenue,
        profit: parseFloat((dayRevenue - dayApiCost * usdToPlnRate).toFixed(2)),
        operations: dayUsage.length,
      };
    });

    // === RECENT TRANSACTIONS ===
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(t => {
        const user = users.find(u => u.id === t.userId);
        return {
          ...t,
          userEmail: user?.email || 'Unknown',
          userName: user?.name || 'Unknown',
        };
      });

    // === TOP USERS BY USAGE ===
    const userUsageMap = new Map<string, { credits: number; operations: number; apiCost: number }>();
    usage.forEach(u => {
      const current = userUsageMap.get(u.userId) || { credits: 0, operations: 0, apiCost: 0 };
      const model = TOOL_TO_MODEL[u.type] || 'default';
      current.credits += u.creditsUsed || 0;
      current.operations += 1;
      current.apiCost += REPLICATE_COSTS[model];
      userUsageMap.set(u.userId, current);
    });

    const topUsersByUsage = Array.from(userUsageMap.entries())
      .map(([userId, stats]) => {
        const user = users.find(u => u.id === userId);
        return {
          userId,
          email: user?.email || 'Unknown',
          name: user?.name || 'Unknown',
          currentCredits: user?.credits || 0,
          ...stats,
          apiCost: parseFloat(stats.apiCost.toFixed(4)),
        };
      })
      .sort((a, b) => b.credits - a.credits)
      .slice(0, 10);

    return NextResponse.json({
      period,

      // Credit overview
      credits: {
        totalInSystem: totalCreditsInSystem,
        totalUsed: totalCreditsUsed,
        currentPeriodUsed: currentPeriodCreditsUsed,
        previousPeriodUsed: previousPeriodCreditsUsed,
        growthPercent: previousPeriodCreditsUsed > 0
          ? ((currentPeriodCreditsUsed - previousPeriodCreditsUsed) / previousPeriodCreditsUsed * 100).toFixed(1)
          : '0',
      },

      // Revenue
      revenue: {
        total: totalRevenue,
        currentPeriod: currentPeriodRevenue,
        previousPeriod: previousPeriodRevenue,
        growthPercent: revenueGrowth,
        currency: 'PLN',
      },

      // API Costs (Replicate)
      apiCosts: {
        totalUsd: parseFloat(totalApiCost.toFixed(4)),
        totalPln: parseFloat(totalApiCostPln.toFixed(2)),
        currentPeriodUsd: parseFloat(currentPeriodApiCost.toFixed(4)),
        currentPeriodPln: parseFloat(currentApiCostPln.toFixed(2)),
        byToolType: apiCostByType,
        rates: REPLICATE_COSTS,
      },

      // Profit
      profit: {
        gross: parseFloat(grossProfit.toFixed(2)),
        currentPeriod: parseFloat(currentGrossProfit.toFixed(2)),
        margin: profitMargin,
        currency: 'PLN',
      },

      // Forecasting
      forecast: {
        dailyAvgCreditsUsed: parseFloat(dailyAvgCreditsUsed.toFixed(2)),
        dailyAvgApiCostUsd: parseFloat(dailyAvgApiCost.toFixed(4)),
        next30DaysCredits: parseFloat(forecastCreditsUsed30Days.toFixed(0)),
        next30DaysApiCostUsd: parseFloat(forecastApiCost30Days.toFixed(2)),
        next30DaysApiCostPln: parseFloat((forecastApiCost30Days * usdToPlnRate).toFixed(2)),
        daysUntilCreditsDeplete: daysUntilCreditsDeplete === Infinity ? null : daysUntilCreditsDeplete,
      },

      // Users
      users: {
        total: users.length,
        active: activeUsers,
        withCredits: usersWithCredits,
        free: freeUsers,
        paid: paidUsers,
      },

      // Usage stats
      usage: {
        total: usage.length,
        currentPeriod: currentPeriodUsage.length,
        byType: usageByType,
      },

      // Trends (last 30 days)
      trends: dailyStats,

      // Recent transactions
      recentTransactions,

      // Top users
      topUsers: topUsersByUsage,
    });
  } catch (error) {
    console.error('[admin/finance] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch finance data' }, { status: 500 });
  }
}
