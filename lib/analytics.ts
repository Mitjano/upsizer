import fs from 'fs';
import path from 'path';

const ANALYTICS_DIR = path.join(process.cwd(), 'data', 'analytics');
const VISITORS_FILE = path.join(ANALYTICS_DIR, 'visitors.json');
const PAGE_VIEWS_FILE = path.join(ANALYTICS_DIR, 'page_views.json');
const EVENTS_FILE = path.join(ANALYTICS_DIR, 'events.json');

// Ensure analytics directory exists
if (!fs.existsSync(ANALYTICS_DIR)) {
  fs.mkdirSync(ANALYTICS_DIR, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(VISITORS_FILE)) {
  fs.writeFileSync(VISITORS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(PAGE_VIEWS_FILE)) {
  fs.writeFileSync(PAGE_VIEWS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(EVENTS_FILE)) {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify([]));
}

export interface VisitorData {
  id: string;
  timestamp: number;
  ip?: string;
  userAgent?: string;
  country?: string;
  city?: string;
  device?: 'mobile' | 'tablet' | 'desktop';
  os?: string;
  browser?: string;
}

export interface PageView {
  id: string;
  timestamp: number;
  path: string;
  referrer?: string;
  duration?: number;
  visitorId?: string;
}

export interface AnalyticsEvent {
  id: string;
  timestamp: number;
  type: 'upscale' | 'download' | 'signup' | 'login' | 'purchase' | 'api_call';
  userId?: string;
  metadata?: Record<string, any>;
}

// Track visitor
export async function trackVisitor(data: Omit<VisitorData, 'id' | 'timestamp'>): Promise<string> {
  const visitors: VisitorData[] = JSON.parse(fs.readFileSync(VISITORS_FILE, 'utf-8'));
  const visitor: VisitorData = {
    id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    ...data,
  };

  visitors.push(visitor);

  // Keep only last 10,000 visitors
  if (visitors.length > 10000) {
    visitors.splice(0, visitors.length - 10000);
  }

  fs.writeFileSync(VISITORS_FILE, JSON.stringify(visitors, null, 2));
  return visitor.id;
}

// Track page view
export async function trackPageView(data: Omit<PageView, 'id' | 'timestamp'>): Promise<void> {
  const pageViews: PageView[] = JSON.parse(fs.readFileSync(PAGE_VIEWS_FILE, 'utf-8'));
  const pageView: PageView = {
    id: `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    ...data,
  };

  pageViews.push(pageView);

  // Keep only last 50,000 page views
  if (pageViews.length > 50000) {
    pageViews.splice(0, pageViews.length - 50000);
  }

  fs.writeFileSync(PAGE_VIEWS_FILE, JSON.stringify(pageViews, null, 2));
}

// Track event
export async function trackEvent(data: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
  const events: AnalyticsEvent[] = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
  const event: AnalyticsEvent = {
    id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    ...data,
  };

  events.push(event);

  // Keep only last 50,000 events
  if (events.length > 50000) {
    events.splice(0, events.length - 50000);
  }

  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
}

// Get analytics stats
export async function getAnalyticsStats(days: number = 30) {
  const now = Date.now();
  const startTime = now - (days * 24 * 60 * 60 * 1000);

  const visitors: VisitorData[] = JSON.parse(fs.readFileSync(VISITORS_FILE, 'utf-8'));
  const pageViews: PageView[] = JSON.parse(fs.readFileSync(PAGE_VIEWS_FILE, 'utf-8'));
  const events: AnalyticsEvent[] = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));

  // Filter by time range
  const recentVisitors = visitors.filter(v => v.timestamp >= startTime);
  const recentPageViews = pageViews.filter(pv => pv.timestamp >= startTime);
  const recentEvents = events.filter(e => e.timestamp >= startTime);

  // Calculate daily stats
  const dailyStats = [];
  for (let i = 0; i < days; i++) {
    const dayStart = now - (i * 24 * 60 * 60 * 1000);
    const dayEnd = dayStart + (24 * 60 * 60 * 1000);

    const dayVisitors = recentVisitors.filter(v => v.timestamp >= dayStart && v.timestamp < dayEnd).length;
    const dayPageViews = recentPageViews.filter(pv => pv.timestamp >= dayStart && pv.timestamp < dayEnd).length;
    const dayEvents = recentEvents.filter(e => e.timestamp >= dayStart && e.timestamp < dayEnd).length;

    dailyStats.push({
      date: new Date(dayStart).toISOString().split('T')[0],
      visitors: dayVisitors,
      pageViews: dayPageViews,
      events: dayEvents,
    });
  }

  // Top pages
  const pageViewCounts: Record<string, number> = {};
  recentPageViews.forEach(pv => {
    pageViewCounts[pv.path] = (pageViewCounts[pv.path] || 0) + 1;
  });
  const topPages = Object.entries(pageViewCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  // Device stats
  const deviceCounts = {
    mobile: recentVisitors.filter(v => v.device === 'mobile').length,
    tablet: recentVisitors.filter(v => v.device === 'tablet').length,
    desktop: recentVisitors.filter(v => v.device === 'desktop').length,
  };

  // Event type counts
  const eventTypeCounts: Record<string, number> = {};
  recentEvents.forEach(e => {
    eventTypeCounts[e.type] = (eventTypeCounts[e.type] || 0) + 1;
  });

  return {
    totalVisitors: recentVisitors.length,
    totalPageViews: recentPageViews.length,
    totalEvents: recentEvents.length,
    dailyStats: dailyStats.reverse(),
    topPages,
    deviceStats: deviceCounts,
    eventStats: eventTypeCounts,
    averagePageViewsPerVisitor: recentVisitors.length > 0
      ? (recentPageViews.length / recentVisitors.length).toFixed(2)
      : '0',
  };
}

// Get real-time stats (last 5 minutes)
export async function getRealTimeStats() {
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);

  const visitors: VisitorData[] = JSON.parse(fs.readFileSync(VISITORS_FILE, 'utf-8'));
  const pageViews: PageView[] = JSON.parse(fs.readFileSync(PAGE_VIEWS_FILE, 'utf-8'));
  const events: AnalyticsEvent[] = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));

  const activeVisitors = visitors.filter(v => v.timestamp >= fiveMinutesAgo).length;
  const recentPageViews = pageViews.filter(pv => pv.timestamp >= fiveMinutesAgo);
  const recentEvents = events.filter(e => e.timestamp >= fiveMinutesAgo);

  // Current pages being viewed
  const currentPages: Record<string, number> = {};
  recentPageViews.forEach(pv => {
    currentPages[pv.path] = (currentPages[pv.path] || 0) + 1;
  });

  return {
    activeVisitors,
    recentPageViews: recentPageViews.length,
    recentEvents: recentEvents.length,
    currentPages: Object.entries(currentPages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([path, count]) => ({ path, count })),
  };
}
