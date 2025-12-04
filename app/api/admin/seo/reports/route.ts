import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - List all SEO reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // weekly, monthly, custom
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: { type?: string } = {};
    if (type) where.type = type;

    const reports = await prisma.sEOReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      reports,
      total: reports.length,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// POST - Generate a new SEO report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = "custom", periodDays = 7, locales = [] } = body;

    // Calculate period
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    // Get keywords data for the period
    const keywords = await prisma.trackedKeyword.findMany({
      where: {
        isActive: true,
        ...(locales.length > 0 ? { localeCode: { in: locales } } : {}),
      },
      include: {
        history: {
          where: {
            checkedAt: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
          orderBy: { checkedAt: "desc" },
        },
      },
    });

    // Calculate metrics
    let positionsUp = 0;
    let positionsDown = 0;
    let positionsStable = 0;
    let totalPosition = 0;
    let positionCount = 0;

    const keywordData = keywords.map((kw) => {
      const history = kw.history;
      const oldestInPeriod = history[history.length - 1];
      const newest = history[0];

      let change: "up" | "down" | "stable" | "new" = "stable";
      let positionChange = 0;

      if (oldestInPeriod && newest) {
        if (oldestInPeriod.position && newest.position) {
          positionChange = oldestInPeriod.position - newest.position;
          if (positionChange > 0) {
            change = "up";
            positionsUp++;
          } else if (positionChange < 0) {
            change = "down";
            positionsDown++;
          } else {
            positionsStable++;
          }
        }
      } else if (newest && !oldestInPeriod) {
        change = "new";
      }

      if (kw.currentPosition) {
        totalPosition += kw.currentPosition;
        positionCount++;
      }

      return {
        keyword: kw.keyword,
        localeCode: kw.localeCode,
        currentPosition: kw.currentPosition,
        previousPosition: kw.previousPosition,
        bestPosition: kw.bestPosition,
        change,
        positionChange: Math.abs(positionChange),
      };
    });

    // Get backlinks data
    const backlinksStart = await prisma.backlink.count({
      where: {
        firstSeen: { lt: periodStart },
        status: "active",
      },
    });

    const backlinksEnd = await prisma.backlink.count({
      where: {
        firstSeen: { lte: periodEnd },
        status: "active",
      },
    });

    const newBacklinks = await prisma.backlink.count({
      where: {
        firstSeen: { gte: periodStart, lte: periodEnd },
      },
    });

    const lostBacklinks = await prisma.backlink.count({
      where: {
        lastChecked: { gte: periodStart, lte: periodEnd },
        status: "lost",
      },
    });

    // Create report name
    const dateFormat = (d: Date) => d.toISOString().split("T")[0];
    const name = `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${dateFormat(periodStart)} to ${dateFormat(periodEnd)}`;

    // Create report
    const report = await prisma.sEOReport.create({
      data: {
        name,
        type,
        locales: locales.length > 0 ? locales : ["pl", "en"],
        periodStart,
        periodEnd,
        keywordsTracked: keywords.length,
        avgPosition: positionCount > 0 ? totalPosition / positionCount : null,
        positionsUp,
        positionsDown,
        positionsStable,
        newKeywords: 0,
        lostKeywords: 0,
        newBacklinks,
        lostBacklinks,
        data: {
          keywords: keywordData,
          backlinks: {
            total: backlinksEnd,
            new: newBacklinks,
            lost: lostBacklinks,
          },
          generatedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a report
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );
    }

    await prisma.sEOReport.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}
