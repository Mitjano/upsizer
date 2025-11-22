import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createReport, deleteReport, getAllReports, trackReportDownload, generateReportData, type Report } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const reportId = url.searchParams.get('id');

    if (action === 'generate' && reportId) {
      const reports = getAllReports();
      const report = reports.find(r => r.id === reportId);

      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      const reportData = generateReportData(report.type, report.dateRange, report.filters);

      trackReportDownload(reportId);

      if (report.format === 'json') {
        return NextResponse.json(reportData, {
          headers: {
            'Content-Disposition': `attachment; filename="report-${report.name.replace(/[^a-z0-9]/gi, '_')}.json"`,
          },
        });
      }

      if (report.format === 'csv') {
        const csv = convertToCSV(reportData.data, report.type);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="report-${report.name.replace(/[^a-z0-9]/gi, '_')}.csv"`,
          },
        });
      }

      // PDF generation would require a library like jsPDF or puppeteer
      // For now, return JSON with a note
      return NextResponse.json({
        error: 'PDF generation not implemented yet. Use JSON or CSV format.',
      }, { status: 501 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, format, dateRange, filters } = body;

    if (!name || !type || !format || !dateRange) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const report = createReport({
      name,
      type,
      format,
      dateRange,
      filters: filters || {},
      createdBy: session.user.email || 'Unknown',
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Report creation error:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const success = deleteReport(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Report delete error:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}

// Helper to convert data to CSV
function convertToCSV(data: any[], type: Report['type']): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
