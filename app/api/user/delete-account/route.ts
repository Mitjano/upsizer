import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getUserByEmail,
  deleteUser,
  getTransactionsByUserId,
  deleteTransaction,
  getUsageByUserId,
  deleteUsage,
  getAllTickets,
  deleteTicket,
} from '@/lib/db';
import { ProcessedImagesDB } from '@/lib/processed-images-db';
import { sendAccountDeletedEmail } from '@/lib/email';

/**
 * DELETE /api/user/delete-account
 * Permanently delete user account and all associated data
 * GDPR Right to Erasure (Article 17)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const email = session.user.email;
    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse confirmation from request body
    const body = await request.json();
    const { confirmEmail, confirmText } = body;

    // Require email confirmation
    if (confirmEmail !== email) {
      return NextResponse.json(
        { error: 'Email confirmation does not match' },
        { status: 400 }
      );
    }

    // Require typed confirmation
    if (confirmText !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Please type "DELETE MY ACCOUNT" to confirm' },
        { status: 400 }
      );
    }

    // Store user info for final email before deletion
    const userName = user.name || 'User';
    const userEmail = user.email;

    // Delete all associated data
    const deletionLog = {
      userId: user.id,
      transactionsDeleted: 0,
      usageDeleted: 0,
      ticketsDeleted: 0,
      imagesDeleted: 0,
    };

    // 1. Delete transactions
    const transactions = await getTransactionsByUserId(user.id);
    for (const transaction of transactions) {
      deleteTransaction(transaction.id);
      deletionLog.transactionsDeleted++;
    }

    // 2. Delete usage records
    const usageRecords = await getUsageByUserId(user.id);
    for (const usage of usageRecords) {
      deleteUsage(usage.id);
      deletionLog.usageDeleted++;
    }

    // 3. Delete tickets
    const allTickets = getAllTickets();
    const userTickets = allTickets.filter(t => t.userEmail === email || t.userId === user.id);
    for (const ticket of userTickets) {
      deleteTicket(ticket.id);
      deletionLog.ticketsDeleted++;
    }

    // 4. Delete processed images
    const processedImages = await ProcessedImagesDB.getByUserId(email);
    for (const image of processedImages) {
      await ProcessedImagesDB.delete(image.id);
      deletionLog.imagesDeleted++;
    }

    // 5. Delete user account
    const deleted = deleteUser(user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 500 }
      );
    }

    // Send final confirmation email
    sendAccountDeletedEmail({
      userName,
      userEmail,
      deletionDate: new Date().toISOString(),
    }).catch(err => console.error('Account deletion email failed:', err));

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data permanently deleted',
      deletionSummary: deletionLog,
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
