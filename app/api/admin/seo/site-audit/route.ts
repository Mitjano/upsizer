/**
 * Site Audit API
 * GET - Get all audit results
 * POST - Run a new site audit
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Simple site audit (without full Lighthouse)
async function runSimpleAudit(url: string): Promise<{
  overallScore: number;
  performanceScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  seoScore: number | null;
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
  totalBlockingTime: number | null;
  cumulativeLayoutShift: number | null;
  speedIndex: number | null;
  issues: Array<{ type: string; severity: 'critical' | 'warning' | 'info'; title: string; description: string }>;
}> {
  const issues: Array<{ type: string; severity: 'critical' | 'warning' | 'info'; title: string; description: string }> = [];
  let score = 100;

  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(30000),
    });

    const loadTime = Date.now() - startTime;
    const html = await response.text();
    const lowerHtml = html.toLowerCase();

    // Check response status
    if (!response.ok) {
      issues.push({
        type: 'http',
        severity: 'critical',
        title: `HTTP ${response.status} Error`,
        description: `The page returned an HTTP ${response.status} status code.`,
      });
      score -= 30;
    }

    // Check for meta viewport
    if (!lowerHtml.includes('name="viewport"')) {
      issues.push({
        type: 'seo',
        severity: 'warning',
        title: 'Missing viewport meta tag',
        description: 'Add a viewport meta tag for mobile responsiveness.',
      });
      score -= 10;
    }

    // Check for meta description
    if (!lowerHtml.includes('name="description"')) {
      issues.push({
        type: 'seo',
        severity: 'warning',
        title: 'Missing meta description',
        description: 'Add a meta description for better search engine results.',
      });
      score -= 10;
    }

    // Check for title tag
    if (!lowerHtml.includes('<title>') || lowerHtml.includes('<title></title>')) {
      issues.push({
        type: 'seo',
        severity: 'critical',
        title: 'Missing or empty title tag',
        description: 'Every page should have a unique, descriptive title.',
      });
      score -= 15;
    }

    // Check for H1 tag
    if (!lowerHtml.includes('<h1')) {
      issues.push({
        type: 'seo',
        severity: 'warning',
        title: 'Missing H1 tag',
        description: 'Add an H1 heading to improve SEO structure.',
      });
      score -= 5;
    }

    // Check for canonical URL
    if (!lowerHtml.includes('rel="canonical"')) {
      issues.push({
        type: 'seo',
        severity: 'info',
        title: 'Missing canonical URL',
        description: 'Add a canonical URL to prevent duplicate content issues.',
      });
      score -= 5;
    }

    // Check for Open Graph tags
    if (!lowerHtml.includes('property="og:')) {
      issues.push({
        type: 'seo',
        severity: 'info',
        title: 'Missing Open Graph tags',
        description: 'Add Open Graph tags for better social media sharing.',
      });
      score -= 3;
    }

    // Check for HTTPS
    if (!url.startsWith('https://')) {
      issues.push({
        type: 'security',
        severity: 'critical',
        title: 'Not using HTTPS',
        description: 'Your site should use HTTPS for security and SEO benefits.',
      });
      score -= 20;
    }

    // Check load time
    if (loadTime > 3000) {
      issues.push({
        type: 'performance',
        severity: 'warning',
        title: 'Slow page load time',
        description: `Page took ${(loadTime / 1000).toFixed(1)}s to load. Aim for under 3 seconds.`,
      });
      score -= 10;
    }

    // Check for large HTML size
    const htmlSize = new Blob([html]).size;
    if (htmlSize > 500000) { // 500KB
      issues.push({
        type: 'performance',
        severity: 'warning',
        title: 'Large HTML size',
        description: `HTML is ${Math.round(htmlSize / 1024)}KB. Consider reducing page size.`,
      });
      score -= 5;
    }

    // Check for alt attributes on images
    const imgCount = (html.match(/<img/g) || []).length;
    const altCount = (html.match(/<img[^>]*alt=/g) || []).length;
    if (imgCount > 0 && altCount < imgCount) {
      issues.push({
        type: 'accessibility',
        severity: 'warning',
        title: 'Images missing alt text',
        description: `${imgCount - altCount} of ${imgCount} images are missing alt attributes.`,
      });
      score -= 5;
    }

    // Estimate scores based on findings
    const seoIssues = issues.filter(i => i.type === 'seo').length;
    const perfIssues = issues.filter(i => i.type === 'performance').length;
    const a11yIssues = issues.filter(i => i.type === 'accessibility').length;

    return {
      overallScore: Math.max(0, Math.min(100, score)),
      performanceScore: Math.max(0, 100 - perfIssues * 15 - (loadTime > 2000 ? 20 : 0)),
      accessibilityScore: Math.max(0, 100 - a11yIssues * 10),
      bestPracticesScore: Math.max(0, 100 - issues.filter(i => i.type === 'security').length * 20),
      seoScore: Math.max(0, 100 - seoIssues * 10),
      firstContentfulPaint: loadTime * 0.3, // Estimate
      largestContentfulPaint: loadTime * 0.8, // Estimate
      totalBlockingTime: loadTime > 3000 ? loadTime * 0.2 : 100,
      cumulativeLayoutShift: 0.05, // Default estimate
      speedIndex: loadTime * 0.6, // Estimate
      issues,
    };
  } catch (error) {
    issues.push({
      type: 'error',
      severity: 'critical',
      title: 'Audit Failed',
      description: error instanceof Error ? error.message : 'Failed to fetch the page.',
    });

    return {
      overallScore: 0,
      performanceScore: null,
      accessibilityScore: null,
      bestPracticesScore: null,
      seoScore: null,
      firstContentfulPaint: null,
      largestContentfulPaint: null,
      totalBlockingTime: null,
      cumulativeLayoutShift: null,
      speedIndex: null,
      issues,
    };
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const audits = await prisma.siteAuditResult.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Map to frontend format
    const auditsFormatted = audits.map(audit => ({
      id: audit.id,
      url: `https://${audit.domain}`,
      overallScore: audit.overallScore,
      performanceScore: audit.performanceScore,
      accessibilityScore: audit.accessibilityScore,
      bestPracticesScore: audit.bestPracticesScore,
      seoScore: audit.seoScore,
      firstContentfulPaint: null,
      largestContentfulPaint: audit.lcp ? audit.lcp * 1000 : null,
      totalBlockingTime: null,
      cumulativeLayoutShift: audit.cls,
      speedIndex: null,
      issues: audit.issues || [],
      createdAt: audit.createdAt,
    }));

    return NextResponse.json(auditsFormatted);
  } catch (error) {
    console.error('Error fetching audits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audits' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Run simple audit
    const auditResult = await runSimpleAudit(url);

    // Count issues by severity
    const criticalIssues = auditResult.issues.filter(i => i.severity === 'critical').length;
    const warningIssues = auditResult.issues.filter(i => i.severity === 'warning').length;
    const infoIssues = auditResult.issues.filter(i => i.severity === 'info').length;

    // Save to database
    const audit = await prisma.siteAuditResult.create({
      data: {
        domain: new URL(url).hostname,
        overallScore: auditResult.overallScore,
        performanceScore: auditResult.performanceScore ?? 0,
        accessibilityScore: auditResult.accessibilityScore ?? 0,
        bestPracticesScore: auditResult.bestPracticesScore ?? 0,
        seoScore: auditResult.seoScore ?? 0,
        criticalIssues,
        warningIssues,
        infoIssues,
        lcp: auditResult.largestContentfulPaint ? auditResult.largestContentfulPaint / 1000 : null,
        cls: auditResult.cumulativeLayoutShift,
        issues: auditResult.issues,
      },
    });

    return NextResponse.json({
      ...audit,
      issues: auditResult.issues,
    });
  } catch (error) {
    console.error('Error running audit:', error);
    return NextResponse.json(
      { error: 'Failed to run audit' },
      { status: 500 }
    );
  }
}
