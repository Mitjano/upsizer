import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - List all connected accounts
export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch accounts with posts count in single query
    const accounts = await prisma.socialAccount.findMany({
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        platform: true,
        platformType: true,
        accountId: true,
        accountName: true,
        accountHandle: true,
        avatarUrl: true,
        metadata: true,
        isActive: true,
        isPrimary: true,
        tokenExpiry: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    // Batch fetch latest analytics for all accounts (fixes N+1 query)
    const accountIds = accounts.map(a => a.id);

    // Fetch all analytics for accounts and group by accountId to get latest
    const allAnalytics = accountIds.length > 0
      ? await prisma.socialAnalytics.findMany({
          where: { accountId: { in: accountIds } },
          orderBy: { date: 'desc' },
        })
      : [];

    // Create a map with only the latest analytics per account
    const analyticsMap = new Map<string, typeof allAnalytics[0]>();
    for (const analytics of allAnalytics) {
      if (!analyticsMap.has(analytics.accountId)) {
        analyticsMap.set(analytics.accountId, analytics);
      }
    }

    // Combine accounts with analytics
    const accountsWithAnalytics = accounts.map(account => ({
      ...account,
      postsCount: account._count.posts,
      analytics: analyticsMap.get(account.id) || null,
    }));

    return NextResponse.json({
      accounts: accountsWithAnalytics,
      total: accounts.length,
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

// POST - Add new account (manual for now, OAuth later)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      platform,
      platformType = "profile",
      accountId,
      accountName,
      accountHandle,
      avatarUrl,
      accessToken,
      refreshToken,
      tokenExpiry,
      metadata,
    } = body;

    if (!platform || !accountId || !accountName || !accessToken) {
      return NextResponse.json(
        {
          error:
            "Platform, accountId, accountName, and accessToken are required",
        },
        { status: 400 }
      );
    }

    // Check if account already exists
    const existing = await prisma.socialAccount.findUnique({
      where: {
        platform_accountId: {
          platform,
          accountId,
        },
      },
    });

    if (existing) {
      // Update existing account
      const updated = await prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          accountName,
          accountHandle,
          avatarUrl,
          accessToken,
          refreshToken,
          tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : null,
          metadata,
          isActive: true,
        },
      });

      return NextResponse.json(updated);
    }

    // Create new account
    const account = await prisma.socialAccount.create({
      data: {
        userId: session.user.id || session.user.email || "admin",
        platform,
        platformType,
        accountId,
        accountName,
        accountHandle,
        avatarUrl,
        accessToken,
        refreshToken,
        tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : null,
        metadata,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

// PUT - Update account
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    if (updateData.tokenExpiry) {
      updateData.tokenExpiry = new Date(updateData.tokenExpiry);
    }

    const account = await prisma.socialAccount.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect account
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    // Delete related analytics first
    await prisma.socialAnalytics.deleteMany({
      where: { accountId: id },
    });

    // Update posts to remove account reference
    await prisma.socialPost.updateMany({
      where: { accountId: id },
      data: { accountId: null },
    });

    // Delete account
    await prisma.socialAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
