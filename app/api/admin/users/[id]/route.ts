/**
 * Single User API - Get full user details
 * GET /api/admin/users/[id] - Get user by ID with all related data
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get user with all related data
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        usages: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        imageHistory: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      'name', 'role', 'status', 'credits', 'internalNotes', 'tags',
      'emailNotifications', 'marketingConsent', 'newsletterSubscribed',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (soft or hard)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete) {
      // Hard delete - permanently remove user and all related data
      // Delete in correct order to respect foreign keys
      await prisma.$transaction(async (tx) => {
        // Delete related data first (all models that have userId)
        await tx.usage.deleteMany({ where: { userId: id } });
        await tx.transaction.deleteMany({ where: { userId: id } });
        await tx.imageHistory.deleteMany({ where: { userId: id } });
        await tx.apiKey.deleteMany({ where: { userId: id } });
        await tx.userSession.deleteMany({ where: { userId: id } });
        await tx.userEvent.deleteMany({ where: { userId: id } });
        await tx.pageView.deleteMany({ where: { userId: id } });
        await tx.socialPost.deleteMany({ where: { userId: id } });
        await tx.socialAccount.deleteMany({ where: { userId: id } });
        await tx.captionTemplate.deleteMany({ where: { userId: id } });
        await tx.hashtagCollection.deleteMany({ where: { userId: id } });
        await tx.brandKit.deleteMany({ where: { userId: id } });
        await tx.generatedVideo.deleteMany({ where: { userId: id } });
        await tx.generatedMusic.deleteMany({ where: { userId: id } });
        await tx.musicFolder.deleteMany({ where: { userId: id } });
        await tx.ticket.deleteMany({ where: { userId: id } }); // TicketMessages cascade delete
        await tx.emailVerificationToken.deleteMany({ where: { userId: id } });
        await tx.passwordResetToken.deleteMany({ where: { userId: id } });
        await tx.account.deleteMany({ where: { userId: id } });
        // Finally delete the user
        await tx.user.delete({ where: { id } });
      });

      return NextResponse.json({ success: true, deleted: true });
    } else {
      // Soft delete - just mark as banned
      await prisma.user.update({
        where: { id },
        data: { status: 'banned' },
      });

      return NextResponse.json({ success: true, banned: true });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
