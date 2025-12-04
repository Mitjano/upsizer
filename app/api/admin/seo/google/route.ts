import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  verifySearchConsoleAccess,
  verifyAnalyticsAccess,
  getTopQueries,
  getTopPages,
  getOrganicTrafficStats,
  getTopOrganicLandingPages,
  syncSearchConsoleData,
  syncAnalyticsData,
} from "@/lib/google-apis";

// GET - Get integration status and data
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    // Get integration settings
    const integration = await prisma.googleIntegration.findFirst();

    if (action === "status") {
      return NextResponse.json({
        configured: !!integration,
        searchConsole: {
          enabled: integration?.searchConsoleEnabled || false,
          siteUrl: integration?.searchConsoleSiteUrl || null,
          verified: integration?.searchConsoleVerified || false,
        },
        analytics: {
          enabled: integration?.analyticsEnabled || false,
          propertyId: integration?.analyticsPropertyId || null,
          verified: integration?.analyticsVerified || false,
        },
      });
    }

    if (action === "search-console-queries") {
      const days = parseInt(searchParams.get("days") || "28");
      const limit = parseInt(searchParams.get("limit") || "100");
      const queries = await getTopQueries(days, limit);
      return NextResponse.json({ queries });
    }

    if (action === "search-console-pages") {
      const days = parseInt(searchParams.get("days") || "28");
      const limit = parseInt(searchParams.get("limit") || "100");
      const pages = await getTopPages(days, limit);
      return NextResponse.json({ pages });
    }

    if (action === "analytics-organic") {
      const days = parseInt(searchParams.get("days") || "28");
      const stats = await getOrganicTrafficStats(days);
      return NextResponse.json({ stats });
    }

    if (action === "analytics-landing-pages") {
      const days = parseInt(searchParams.get("days") || "28");
      const limit = parseInt(searchParams.get("limit") || "50");
      const pages = await getTopOrganicLandingPages(days, limit);
      return NextResponse.json({ pages });
    }

    // Default - return cached data from database
    const [searchConsoleData, analyticsData] = await Promise.all([
      prisma.searchConsoleData.findMany({
        orderBy: { date: "desc" },
        take: 1000,
      }),
      prisma.analyticsData.findMany({
        where: { source: "Organic Search" },
        orderBy: { date: "desc" },
        take: 1000,
      }),
    ]);

    return NextResponse.json({
      integration: {
        configured: !!integration,
        searchConsoleEnabled: integration?.searchConsoleEnabled || false,
        analyticsEnabled: integration?.analyticsEnabled || false,
      },
      searchConsoleData,
      analyticsData,
    });
  } catch (error) {
    console.error("Google API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST - Configure integration or sync data
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "configure") {
      const {
        serviceAccountEmail,
        serviceAccountKey,
        searchConsoleSiteUrl,
        analyticsPropertyId,
      } = body;

      // Find existing or create new
      const existing = await prisma.googleIntegration.findFirst();

      const data = {
        serviceAccountEmail: serviceAccountEmail || undefined,
        serviceAccountKey: serviceAccountKey || undefined,
        searchConsoleSiteUrl: searchConsoleSiteUrl || undefined,
        searchConsoleEnabled: !!searchConsoleSiteUrl,
        analyticsPropertyId: analyticsPropertyId || undefined,
        analyticsEnabled: !!analyticsPropertyId,
      };

      if (existing) {
        await prisma.googleIntegration.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await prisma.googleIntegration.create({ data });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "verify-search-console") {
      const verified = await verifySearchConsoleAccess();
      return NextResponse.json({ verified });
    }

    if (action === "verify-analytics") {
      const verified = await verifyAnalyticsAccess();
      return NextResponse.json({ verified });
    }

    if (action === "sync-search-console") {
      const days = body.days || 28;
      const synced = await syncSearchConsoleData(days);
      return NextResponse.json({ synced });
    }

    if (action === "sync-analytics") {
      const days = body.days || 28;
      const synced = await syncAnalyticsData(days);
      return NextResponse.json({ synced });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Google API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove integration
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.googleIntegration.deleteMany();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
