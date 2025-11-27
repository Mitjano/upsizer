'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Track page views
function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && GA_MEASUREMENT_ID) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

      // Google Analytics page view
      window.gtag?.('config', GA_MEASUREMENT_ID, {
        page_path: url,
      });

      // Also track to our internal analytics
      trackPageViewInternal(pathname);
    }
  }, [pathname, searchParams]);
}

// Internal page view tracking (calls our API)
async function trackPageViewInternal(path: string) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'page_view',
        data: {
          path,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
        },
      }),
    });
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.debug('Analytics tracking failed:', error);
  }
}

// Event tracking helper
export function trackEvent(
  eventName: string,
  parameters?: Record<string, any>
) {
  // Google Analytics event
  if (GA_MEASUREMENT_ID) {
    window.gtag?.('event', eventName, parameters);
  }

  // Internal event tracking
  try {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'event',
        data: {
          eventName,
          ...parameters,
        },
      }),
    });
  } catch (error) {
    console.debug('Event tracking failed:', error);
  }
}

// Predefined events for the app
export const AnalyticsEvents = {
  // Tool usage
  imageUpscaled: (scale: number, model: string) =>
    trackEvent('image_upscaled', { scale, model, category: 'tool_usage' }),

  backgroundRemoved: () =>
    trackEvent('background_removed', { category: 'tool_usage' }),

  packshotGenerated: (preset: string) =>
    trackEvent('packshot_generated', { preset, category: 'tool_usage' }),

  imageExpanded: (direction: string) =>
    trackEvent('image_expanded', { direction, category: 'tool_usage' }),

  imageCompressed: (originalSize: number, compressedSize: number) =>
    trackEvent('image_compressed', {
      originalSize,
      compressedSize,
      savings: Math.round((1 - compressedSize / originalSize) * 100),
      category: 'tool_usage'
    }),

  // User actions
  imageDownloaded: (tool: string) =>
    trackEvent('image_downloaded', { tool, category: 'user_action' }),

  imageUploaded: (fileSize: number, fileType: string) =>
    trackEvent('image_uploaded', { fileSize, fileType, category: 'user_action' }),

  // Auth events
  signupStarted: (method: string) =>
    trackEvent('signup_started', { method, category: 'auth' }),

  signupCompleted: (method: string) =>
    trackEvent('signup_completed', { method, category: 'auth' }),

  loginCompleted: (method: string) =>
    trackEvent('login_completed', { method, category: 'auth' }),

  // Conversion events
  pricingViewed: () =>
    trackEvent('pricing_viewed', { category: 'conversion' }),

  planSelected: (plan: string, billing: 'monthly' | 'yearly') =>
    trackEvent('plan_selected', { plan, billing, category: 'conversion' }),

  checkoutStarted: (plan: string, amount: number) =>
    trackEvent('checkout_started', { plan, amount, category: 'conversion' }),

  purchaseCompleted: (plan: string, amount: number) =>
    trackEvent('purchase_completed', { plan, amount, category: 'conversion' }),

  // Engagement
  featureClicked: (feature: string) =>
    trackEvent('feature_clicked', { feature, category: 'engagement' }),

  ctaClicked: (cta: string, location: string) =>
    trackEvent('cta_clicked', { cta, location, category: 'engagement' }),

  faqExpanded: (question: string) =>
    trackEvent('faq_expanded', { question, category: 'engagement' }),

  // Errors
  errorOccurred: (error: string, context: string) =>
    trackEvent('error_occurred', { error, context, category: 'error' }),

  apiError: (endpoint: string, statusCode: number) =>
    trackEvent('api_error', { endpoint, statusCode, category: 'error' }),
};

// Page tracking component
function PageTracker() {
  usePageTracking();
  return null;
}

// Main Analytics Provider
export default function Analytics() {
  if (!GA_MEASUREMENT_ID) {
    return (
      <Suspense fallback={null}>
        <PageTracker />
      </Suspense>
    );
  }

  return (
    <>
      {/* Google Analytics */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
          });
        `}
      </Script>

      {/* Page tracking */}
      <Suspense fallback={null}>
        <PageTracker />
      </Suspense>
    </>
  );
}

// Type declaration for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}
