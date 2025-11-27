import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ERRORS_DIR = path.join(process.cwd(), 'data', 'errors');
const ERRORS_FILE = path.join(ERRORS_DIR, 'errors.json');

// Ensure errors directory exists
if (!fs.existsSync(ERRORS_DIR)) {
  fs.mkdirSync(ERRORS_DIR, { recursive: true });
}

// Initialize file if it doesn't exist
if (!fs.existsSync(ERRORS_FILE)) {
  fs.writeFileSync(ERRORS_FILE, JSON.stringify([]));
}

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  resolved?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const errorReport: ErrorReport = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: body.message || 'Unknown error',
      stack: body.stack,
      componentStack: body.componentStack,
      url: body.url || 'unknown',
      userAgent: body.userAgent || 'unknown',
      timestamp: body.timestamp || new Date().toISOString(),
      resolved: false,
    };

    // Read existing errors
    const errors: ErrorReport[] = JSON.parse(fs.readFileSync(ERRORS_FILE, 'utf-8'));

    // Add new error
    errors.push(errorReport);

    // Keep only last 1000 errors
    if (errors.length > 1000) {
      errors.splice(0, errors.length - 1000);
    }

    // Write back
    fs.writeFileSync(ERRORS_FILE, JSON.stringify(errors, null, 2));

    // Log to console for monitoring
    console.error(`[ERROR REPORT] ${errorReport.id}: ${errorReport.message}`);

    return NextResponse.json({ success: true, errorId: errorReport.id });
  } catch (error) {
    console.error('Failed to save error report:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const unresolvedOnly = searchParams.get('unresolved') === 'true';

    const errors: ErrorReport[] = JSON.parse(fs.readFileSync(ERRORS_FILE, 'utf-8'));

    let filteredErrors = errors;
    if (unresolvedOnly) {
      filteredErrors = errors.filter(e => !e.resolved);
    }

    // Return most recent first
    const recentErrors = filteredErrors.slice(-limit).reverse();

    return NextResponse.json({
      errors: recentErrors,
      total: errors.length,
      unresolvedCount: errors.filter(e => !e.resolved).length,
    });
  } catch (error) {
    console.error('Failed to fetch error reports:', error);
    return NextResponse.json({ error: 'Failed to fetch errors' }, { status: 500 });
  }
}
