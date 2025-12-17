/**
 * Export users to XLSX
 * GET /api/admin/users/export - Export users data
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

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

    // If only emails requested as CSV
    if (fields.length === 1 && fields[0] === 'email' && format === 'csv') {
      const csv = users.map(u => u.email).join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="users_emails_' + new Date().toISOString().split('T')[0] + '.csv"',
        },
      });
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

    // Create workbook with ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    // Add header row
    worksheet.columns = selectedFields.map(field => ({
      header: field,
      key: field,
      width: Math.max(field.length, 15)
    }));

    // Add data rows
    exportData.forEach(row => {
      worksheet.addRow(row);
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };

    const filename = newsletterOnly
      ? 'newsletter_subscribers_' + new Date().toISOString().split('T')[0]
      : 'users_export_' + new Date().toISOString().split('T')[0];

    // Generate buffer based on format
    let arrayBuffer: ArrayBuffer;
    let contentType: string;

    if (format === 'csv') {
      arrayBuffer = await workbook.csv.writeBuffer();
      contentType = 'text/csv';
    } else {
      arrayBuffer = await workbook.xlsx.writeBuffer();
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'attachment; filename="' + filename + '.' + format + '"',
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
