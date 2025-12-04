import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - List all competitors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeRankings = searchParams.get("includeRankings") === "true";

    const competitors = await prisma.sEOCompetitor.findMany({
      orderBy: { createdAt: "desc" },
      include: includeRankings
        ? {
            rankings: {
              orderBy: { checkedAt: "desc" },
              take: 100,
            },
          }
        : undefined,
    });

    // Get our tracked keywords for comparison
    const trackedKeywords = await prisma.trackedKeyword.findMany({
      select: {
        keyword: true,
        localeCode: true,
        currentPosition: true,
      },
    });

    return NextResponse.json({
      competitors,
      trackedKeywords,
      total: competitors.length,
    });
  } catch (error) {
    console.error("Error fetching competitors:", error);
    return NextResponse.json(
      { error: "Failed to fetch competitors" },
      { status: 500 }
    );
  }
}

// POST - Add new competitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, name, description } = body;

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    // Clean domain
    let cleanDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "");

    // Check if competitor already exists
    const existing = await prisma.sEOCompetitor.findUnique({
      where: { domain: cleanDomain },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Competitor already exists" },
        { status: 400 }
      );
    }

    const competitor = await prisma.sEOCompetitor.create({
      data: {
        domain: cleanDomain,
        name: name || cleanDomain,
        description,
      },
    });

    return NextResponse.json(competitor, { status: 201 });
  } catch (error) {
    console.error("Error creating competitor:", error);
    return NextResponse.json(
      { error: "Failed to create competitor" },
      { status: 500 }
    );
  }
}

// DELETE - Remove competitor
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Competitor ID is required" },
        { status: 400 }
      );
    }

    // Delete rankings first
    await prisma.competitorRanking.deleteMany({
      where: { competitorId: id },
    });

    // Delete competitor
    await prisma.sEOCompetitor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting competitor:", error);
    return NextResponse.json(
      { error: "Failed to delete competitor" },
      { status: 500 }
    );
  }
}
