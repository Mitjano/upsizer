import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PERF_DIR = path.join(process.cwd(), 'data', 'analytics');
const PERF_FILE = path.join(PERF_DIR, 'performance.json');

// Ensure directory exists
if (!fs.existsSync(PERF_DIR)) {
  fs.mkdirSync(PERF_DIR, { recursive: true });
}

// Initialize file if it doesn't exist
if (!fs.existsSync(PERF_FILE)) {
  fs.writeFileSync(PERF_FILE, JSON.stringify([]));
}

interface PerformanceEntry {
  id: string;
  url: string;
  timestamp: number;
  metrics: {
    LCP?: number;
    FID?: number;
    CLS?: number;
    FCP?: number;
    TTFB?: number;
    pageLoadTime?: number;
    domContentLoaded?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const entry: PerformanceEntry = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: body.url || '/',
      timestamp: body.timestamp || Date.now(),
      metrics: body.metrics || {},
    };

    // Read existing entries
    const entries: PerformanceEntry[] = JSON.parse(fs.readFileSync(PERF_FILE, 'utf-8'));

    // Add new entry
    entries.push(entry);

    // Keep only last 5000 entries
    if (entries.length > 5000) {
      entries.splice(0, entries.length - 5000);
    }

    // Write back
    fs.writeFileSync(PERF_FILE, JSON.stringify(entries, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save performance data:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    const entries: PerformanceEntry[] = JSON.parse(fs.readFileSync(PERF_FILE, 'utf-8'));

    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const recentEntries = entries.filter(e => e.timestamp >= startTime);

    // Calculate averages
    const calculateAverage = (values: number[]) =>
      values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;

    const lcpValues = recentEntries.map(e => e.metrics.LCP).filter((v): v is number => v !== undefined);
    const fidValues = recentEntries.map(e => e.metrics.FID).filter((v): v is number => v !== undefined);
    const clsValues = recentEntries.map(e => e.metrics.CLS).filter((v): v is number => v !== undefined);
    const fcpValues = recentEntries.map(e => e.metrics.FCP).filter((v): v is number => v !== undefined);
    const ttfbValues = recentEntries.map(e => e.metrics.TTFB).filter((v): v is number => v !== undefined);

    // Grade Core Web Vitals
    const gradeLCP = (value: number | null) => {
      if (value === null) return 'N/A';
      if (value <= 2500) return 'Good';
      if (value <= 4000) return 'Needs Improvement';
      return 'Poor';
    };

    const gradeFID = (value: number | null) => {
      if (value === null) return 'N/A';
      if (value <= 100) return 'Good';
      if (value <= 300) return 'Needs Improvement';
      return 'Poor';
    };

    const gradeCLS = (value: number | null) => {
      if (value === null) return 'N/A';
      if (value <= 0.1) return 'Good';
      if (value <= 0.25) return 'Needs Improvement';
      return 'Poor';
    };

    const avgLCP = calculateAverage(lcpValues);
    const avgFID = calculateAverage(fidValues);
    const avgCLS = calculateAverage(clsValues);
    const avgFCP = calculateAverage(fcpValues);
    const avgTTFB = calculateAverage(ttfbValues);

    return NextResponse.json({
      totalSamples: recentEntries.length,
      averages: {
        LCP: avgLCP ? Math.round(avgLCP) : null,
        FID: avgFID ? Math.round(avgFID) : null,
        CLS: avgCLS ? avgCLS.toFixed(3) : null,
        FCP: avgFCP ? Math.round(avgFCP) : null,
        TTFB: avgTTFB ? Math.round(avgTTFB) : null,
      },
      grades: {
        LCP: gradeLCP(avgLCP),
        FID: gradeFID(avgFID),
        CLS: gradeCLS(avgCLS),
      },
      // Page breakdown
      byPage: Object.entries(
        recentEntries.reduce((acc, e) => {
          if (!acc[e.url]) acc[e.url] = [];
          acc[e.url].push(e.metrics);
          return acc;
        }, {} as Record<string, typeof recentEntries[0]['metrics'][]>)
      )
        .map(([url, metrics]) => ({
          url,
          samples: metrics.length,
          avgLCP: Math.round(calculateAverage(metrics.map(m => m.LCP).filter((v): v is number => v !== undefined)) || 0),
        }))
        .slice(0, 10),
    });
  } catch (error) {
    console.error('Failed to fetch performance data:', error);
    return NextResponse.json({ error: 'Failed to fetch performance data' }, { status: 500 });
  }
}
