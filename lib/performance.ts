'use client';

// Performance monitoring utilities

interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte

  // Custom metrics
  pageLoadTime?: number;
  domContentLoaded?: number;
  resourceLoadTime?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Wait for page load
    if (document.readyState === 'complete') {
      this.collectNavigationMetrics();
    } else {
      window.addEventListener('load', () => {
        this.collectNavigationMetrics();
      });
    }

    // Observe Core Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
  }

  private collectNavigationMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.startTime;
      this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.startTime;
      this.metrics.TTFB = navigation.responseStart - navigation.requestStart;
    }
  }

  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.LCP = lastEntry.startTime;
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // Not supported
    }
  }

  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];
        entries.forEach((entry) => {
          if (entry.processingStart) {
            this.metrics.FID = entry.processingStart - entry.startTime;
          }
        });
      });
      observer.observe({ type: 'first-input', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // Not supported
    }
  }

  private observeCLS() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.CLS = clsValue;
          }
        });
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // Not supported
    }
  }

  private observeFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.metrics.FCP = fcpEntry.startTime;
        }
      });
      observer.observe({ type: 'paint', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // Not supported
    }
  }

  // Get all collected metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Report metrics to analytics
  async reportMetrics() {
    if (typeof window === 'undefined') return;

    // Wait a bit for metrics to be collected
    await new Promise(resolve => setTimeout(resolve, 3000));

    const metrics = this.getMetrics();

    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          url: window.location.pathname,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.debug('Failed to report performance metrics:', error);
    }
  }

  // Cleanup observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (typeof window !== 'undefined' && !performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor!;
}

// Measure function execution time
export function measureExecutionTime<T>(
  fn: () => T,
  label: string
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.debug(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}

// Measure async function execution time
export async function measureAsyncExecutionTime<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.debug(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}

// Resource timing helper
export function getResourceTiming(urlPattern: string): PerformanceResourceTiming[] {
  if (typeof window === 'undefined') return [];

  return performance
    .getEntriesByType('resource')
    .filter(entry => entry.name.includes(urlPattern)) as PerformanceResourceTiming[];
}

// Memory usage (Chrome only)
export function getMemoryUsage(): { usedJSHeapSize?: number; totalJSHeapSize?: number } | null {
  if (typeof window === 'undefined') return null;

  const memory = (performance as any).memory;
  if (memory) {
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
    };
  }
  return null;
}

// Track long tasks
export function observeLongTasks(callback: (duration: number) => void): (() => void) | null {
  if (typeof window === 'undefined') return null;

  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) { // Tasks longer than 50ms
          callback(entry.duration);
        }
      });
    });
    observer.observe({ type: 'longtask', buffered: true });
    return () => observer.disconnect();
  } catch (e) {
    return null;
  }
}

// Type declarations
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}
