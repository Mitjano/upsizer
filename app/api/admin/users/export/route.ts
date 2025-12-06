/**
 * Export users to XLSX
 * GET /api/admin/users/export - Export users data
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const fields = searchParams.get('fields')?.split(',') || ['all'];
    const newsletterOnly = searchParams.get('newsletter') === 'true';
    const format = searchParams.get('format') || 'xlsx'; // xlsx or csv

    // Get all users
    let users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Filter newsletter subscribers if requested
    if (newsletterOnly) {
      users = users.filter(u => u.newsletterSubscribed);
    }

    // Define available fields
    const allFields = [
      'id', 'email', 'name', 'role', 'status', 'credits', 'totalUsage',
      'createdAt', 'lastLoginAt', 'newsletterSubscribed', 'marketingConsent',
      'country', 'countryName', 'city', 'region', 'timezone', 'language',
      'deviceType', 'browser', 'os',
      'referralSource', 'referralMedium', 'referralCampaign', 'landingPage',
      'authProvider', 'promoCode'
    ];

    // Select fields
    const selectedFields = fields.includes('all') ? allFields : fields.filter(f => allFields.includes(f));

    // If only emails requested
    if (fields.length === 1 && fields[0] === 'email') {
      const emailData = users.map(u => ({ email: u.email }));

      if (format === 'csv') {
        const csv = emailData.map(e => e.email).join('\n');
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="users_emails_${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });
      }
    }

    // Map users to selected fields
    const exportData = users.map(user => {
      const row: Record<string, unknown> = {};
      for (const field of selectedFields) {
        const value = (user as Record<string, unknown>)[field];
        // Format dates
        if (value instanceof Date) {
          row[field] = value.toISOString();
        } else {
          row[field] = value ?? '';
        }
      }
      return row;
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = selectedFields.map(field => ({
      wch: Math.max(field.length, 15)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Users');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: format === 'csv' ? 'csv' : 'xlsx' });

    const filename = newsletterOnly
      ? `newsletter_subscribers_${new Date().toISOString().split('T')[0]}`
      : `users_export_${new Date().toISOString().split('T')[0]}`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.${format}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    );
  }
}
