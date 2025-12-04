import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - List all posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const accountId = searchParams.get("accountId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: {
      status?: string;
      accountId?: string;
    } = {};

    if (status) where.status = status;
    if (accountId) where.accountId = accountId;

    const [posts, total] = await Promise.all([
      prisma.socialPost.findMany({
        where,
        orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
        include: {
          account: {
            select: {
              platform: true,
              accountName: true,
              accountHandle: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.socialPost.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      total,
      hasMore: offset + posts.length < total,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST - Create new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      content,
      mediaUrls = [],
      mediaTypes = [],
      link,
      hashtags = [],
      mentions = [],
      accountId,
      scheduledAt,
      status = "draft",
    } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Extract hashtags from content if not provided
    const extractedHashtags =
      hashtags.length > 0
        ? hashtags
        : (content.match(/#\w+/g) || []).map((tag: string) =>
            tag.replace("#", "")
          );

    // Extract mentions from content if not provided
    const extractedMentions =
      mentions.length > 0
        ? mentions
        : (content.match(/@\w+/g) || []).map((mention: string) =>
            mention.replace("@", "")
          );

    const post = await prisma.socialPost.create({
      data: {
        userId: "admin", // TODO: Get from session
        content,
        mediaUrls,
        mediaTypes,
        link,
        hashtags: extractedHashtags,
        mentions: extractedMentions,
        accountId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? "scheduled" : status,
      },
      include: {
        account: {
          select: {
            platform: true,
            accountName: true,
          },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

// PUT - Update post
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // If scheduledAt is being updated, also update status
    if (updateData.scheduledAt) {
      updateData.scheduledAt = new Date(updateData.scheduledAt);
      if (updateData.status === "draft") {
        updateData.status = "scheduled";
      }
    }

    const post = await prisma.socialPost.update({
      where: { id },
      data: updateData,
      include: {
        account: {
          select: {
            platform: true,
            accountName: true,
          },
        },
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE - Delete post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    await prisma.socialPost.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
