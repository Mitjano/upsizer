import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getUserByEmail,
  getTransactionsByUserId,
  getUsageByUserId,
  getAllTickets,
} from '@/lib/db';
import { ProcessedImagesDB } from '@/lib/processed-images-db';

/**
 * GET /api/user/export-data
 * Export all user data for GDPR compliance
 * Returns a JSON file with all user information
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const email = session.user.email;
    const user = getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Collect all user data
    const transactions = getTransactionsByUserId(user.id);
    const usage = getUsageByUserId(user.id);
    const allTickets = getAllTickets();
    const userTickets = allTickets.filter(t => t.userEmail === email || t.userId === user.id);
    const processedImages = await ProcessedImagesDB.getByUserId(email);

    // Build export data object
    const exportData = {
      exportDate: new Date().toISOString(),
      exportType: 'GDPR Data Export',

      // Personal Information
      personalInfo: {
        id: user.id,
        email: user.email,
        name: user.name || null,
        image: user.image || null,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt || null,
      },

      // Account Statistics
      accountStats: {
        credits: user.credits,
        totalUsage: user.totalUsage,
        firstUploadAt: user.firstUploadAt || null,
      },

      // Transaction History
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        plan: t.plan,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        createdAt: t.createdAt,
        metadata: t.metadata ? JSON.parse(t.metadata) : null,
      })),

      // Usage History
      usageHistory: usage.map(u => ({
        id: u.id,
        type: u.type,
        creditsUsed: u.creditsUsed,
        imageSize: u.imageSize || null,
        model: u.model || null,
        createdAt: u.createdAt,
      })),

      // Support Tickets
      supportTickets: userTickets.map(t => ({
        id: t.id,
        subject: t.subject,
        description: t.description,
        status: t.status,
        priority: t.priority,
        category: t.category,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        resolvedAt: t.resolvedAt || null,
        messages: t.messages.map(m => ({
          author: m.author,
          isStaff: m.isStaff,
          message: m.message,
          createdAt: m.createdAt,
        })),
      })),

      // Processed Images (metadata only - no actual files)
      processedImages: processedImages.map(img => ({
        id: img.id,
        originalFilename: img.originalFilename,
        fileSize: img.fileSize,
        width: img.width,
        height: img.height,
        isProcessed: img.isProcessed,
        createdAt: img.createdAt,
        processedAt: img.processedAt || null,
      })),

      // Summary
      summary: {
        totalTransactions: transactions.length,
        totalCreditsSpent: usage.reduce((sum, u) => sum + u.creditsUsed, 0),
        totalImagesProcessed: processedImages.filter(img => img.isProcessed).length,
        totalTickets: userTickets.length,
      },
    };

    // Return as downloadable JSON file
    const fileName = `pixelift-data-export-${user.id}-${Date.now()}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
