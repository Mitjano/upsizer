import { NextRequest, NextResponse } from 'next/server';
import { trackVisitor, trackPageView as trackPageViewLegacy, trackEvent } from '@/lib/analytics';
import { analyticsLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import {
  createUserSession,
  updateUserSession,
  endUserSession,
  trackUserEvent,
  trackPageView as trackPageViewNew,
  updateUserExtendedData,
} from '@/lib/db';
import { auth } from '@/lib/auth';

// Helper to parse user agent with detailed info
function parseUserAgent(ua: string) {
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  let browser = 'unknown';
  let browserVersion = '';
  if (ua.includes('Chrome/')) {
    browser = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Firefox/')) {
    browser = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = 'Safari';
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Edge/') || ua.includes('Edg/')) {
    browser = 'Edge';
    browserVersion = ua.match(/Edg(?:e)?\/(\d+)/)?.[1] || '';
  }

  let os = 'unknown';
  let osVersion = '';
  if (ua.includes('Windows NT')) {
    os = 'Windows';
    const ver = ua.match(/Windows NT (\d+\.\d+)/)?.[1];
    if (ver === '10.0') osVersion = '10/11';
    else osVersion = ver || '';
  } else if (ua.includes('Mac OS X')) {
    os = 'macOS';
    osVersion = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
    osVersion = ua.match(/Android (\d+)/)?.[1] || '';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
    osVersion = ua.match(/OS (\d+)/)?.[1] || '';
  }

  // Detect device brand/model for mobile
  let deviceBrand = '';
  let deviceModel = '';
  if (ua.includes('iPhone')) {
    deviceBrand = 'Apple';
    deviceModel = 'iPhone';
  } else if (ua.includes('iPad')) {
    deviceBrand = 'Apple';
    deviceModel = 'iPad';
  } else if (ua.includes('Samsung')) {
    deviceBrand = 'Samsung';
    deviceModel = ua.match(/SM-\w+/)?.[0] || '';
  } else if (ua.includes('Pixel')) {
    deviceBrand = 'Google';
    deviceModel = ua.match(/Pixel \d+/)?.[0] || 'Pixel';
  }

  return { deviceType, browser, browserVersion, os, osVersion, deviceBrand, deviceModel };
}

// Map event category strings to enum values
function mapEventCategory(category: string): 'navigation' | 'engagement' | 'conversion' | 'tool_usage' | 'error' | 'authentication' | 'account' | 'payment' | 'api' | 'custom' {
  const categoryMap: Record<string, any> = {
    'navigation': 'navigation',
    'engagement': 'engagement',
    'conversion': 'conversion',
    'tool_usage': 'tool_usage',
    'tool': 'tool_usage',
    'error': 'error',
    'authentication': 'authentication',
    'auth': 'authentication',
    'account': 'account',
    'payment': 'payment',
    'api': 'api',
  };
  return categoryMap[category] || 'custom';
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const { allowed, resetAt } = analyticsLimiter.check(identifier);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const body = await request.json();
    const { type, data } = body;

    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      request.headers.get('x-real-ip') ||
                      request.headers.get('cf-connecting-ip') ||
                      'unknown';
    const userAgent = data?.userAgent || request.headers.get('user-agent') || '';
    const language = request.headers.get('accept-language')?.split(',')[0] || undefined;
    const { deviceType, browser, browserVersion, os, osVersion, deviceBrand, deviceModel } = parseUserAgent(userAgent);

    // Try to get authenticated user
    let userId: string | undefined;
    try {
      const session = await auth();
      userId = (session?.user as any)?.id;
    } catch {
      // Not authenticated - that's OK
    }

    switch (type) {
      // Legacy visitor tracking (backwards compatible)
      case 'visitor':
        const visitorId = await trackVisitor({
          ip: ipAddress,
          userAgent,
          device: deviceType as 'mobile' | 'tablet' | 'desktop',
          browser,
          os,
        });
        return NextResponse.json({ success: true, visitorId });

      // Legacy page view (backwards compatible)
      case 'page_view':
        await trackPageViewLegacy({
          path: data.path,
          referrer: data.referrer,
          visitorId: data.visitorId,
        });
        return NextResponse.json({ success: true });

      // Legacy event (backwards compatible)
      case 'event':
        await trackEvent({
          type: mapEventType(data.eventName),
          userId: data.userId || userId,
          metadata: {
            eventName: data.eventName,
            ...data,
          },
        });
        return NextResponse.json({ success: true });

      // ===== NEW TRACKING TYPES =====

      // Start a new user session
      case 'session_start':
        if (!data.userId && !userId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        const session = await createUserSession({
          userId: data.userId || userId!,
          sessionToken: data.sessionToken || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          fingerprint: data.fingerprint,
          ipAddress,
          userAgent,
          browser,
          browserVersion,
          os,
          osVersion,
          deviceType,
          screenResolution: data.screenResolution,
          language,
          country: data.country,
          countryName: data.countryName,
          region: data.region,
          city: data.city,
          timezone: data.timezone,
          latitude: data.latitude,
          longitude: data.longitude,
          referrer: data.referrer,
          utmSource: data.utm_source,
          utmMedium: data.utm_medium,
          utmCampaign: data.utm_campaign,
          utmTerm: data.utm_term,
          utmContent: data.utm_content,
          landingPage: data.landingPage,
        });
        return NextResponse.json({ success: true, sessionId: session.id, sessionToken: session.sessionToken });

      // Update session activity
      case 'session_update':
        if (!data.sessionToken) {
          return NextResponse.json({ error: 'Session token required' }, { status: 400 });
        }
        await updateUserSession(data.sessionToken, {
          scrollDepthMax: data.scrollDepthMax,
          exitPage: data.exitPage,
        });
        return NextResponse.json({ success: true });

      // End a session
      case 'session_end':
        if (!data.sessionToken) {
          return NextResponse.json({ error: 'Session token required' }, { status: 400 });
        }
        await endUserSession(data.sessionToken);
        return NextResponse.json({ success: true });

      // Track user event (new detailed format)
      case 'user_event':
        if (!data.userId && !userId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        const userEvent = await trackUserEvent({
          userId: data.userId || userId!,
          sessionId: data.sessionId,
          eventName: data.eventName,
          eventCategory: mapEventCategory(data.eventCategory || 'custom'),
          eventLabel: data.eventLabel,
          eventValue: data.eventValue,
          pageUrl: data.pageUrl,
          pageTitle: data.pageTitle,
          elementId: data.elementId,
          elementClass: data.elementClass,
          elementText: data.elementText,
          ipAddress,
          userAgent,
          browser,
          os,
          deviceType,
          country: data.country,
          city: data.city,
          toolType: data.toolType,
          toolPreset: data.toolPreset,
          toolSettings: data.toolSettings,
          inputSize: data.inputSize,
          outputSize: data.outputSize,
          processingTime: data.processingTime,
          creditsUsed: data.creditsUsed,
          errorMessage: data.errorMessage,
          errorStack: data.errorStack,
          errorCode: data.errorCode,
          metadata: data.metadata,
          clientTimestamp: data.clientTimestamp,
        });
        return NextResponse.json({ success: true, eventId: userEvent.id });

      // Track page view (new detailed format)
      case 'page_view_detailed':
        if (!data.userId && !userId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        const pageView = await trackPageViewNew({
          userId: data.userId || userId!,
          sessionId: data.sessionId,
          pageUrl: data.pageUrl,
          pagePath: data.pagePath,
          pageTitle: data.pageTitle,
          pageType: data.pageType,
          referrer: data.referrer,
          referrerDomain: data.referrerDomain,
          ipAddress,
          userAgent,
          browser,
          os,
          deviceType,
          screenResolution: data.screenResolution,
          viewportSize: data.viewportSize,
          country: data.country,
          city: data.city,
          loadTime: data.loadTime,
          timeToFirstByte: data.timeToFirstByte,
          domContentLoaded: data.domContentLoaded,
          largestContentfulPaint: data.largestContentfulPaint,
          firstInputDelay: data.firstInputDelay,
          cumulativeLayoutShift: data.cumulativeLayoutShift,
          metadata: data.metadata,
        });
        return NextResponse.json({ success: true, pageViewId: pageView.id });

      // Update user geo/device data
      case 'update_user_data':
        if (!data.userId && !userId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        await updateUserExtendedData(data.userId || userId!, {
          country: data.country,
          countryName: data.countryName,
          region: data.region,
          city: data.city,
          timezone: data.timezone,
          latitude: data.latitude,
          longitude: data.longitude,
          lastIpAddress: ipAddress,
          browser,
          browserVersion,
          os,
          osVersion,
          deviceType,
          deviceBrand,
          deviceModel,
          screenResolution: data.screenResolution,
          language,
        });
        return NextResponse.json({ success: true });

      // Mark session conversion
      case 'conversion':
        if (!data.sessionToken) {
          return NextResponse.json({ error: 'Session token required' }, { status: 400 });
        }
        await updateUserSession(data.sessionToken, {
          converted: true,
          conversionType: data.conversionType,
          conversionValue: data.conversionValue,
        });
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid tracking type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Return success anyway to not block the client
    return NextResponse.json({ success: true });
  }
}

// Map event names to legacy event types (backwards compatible)
function mapEventType(eventName: string): 'upscale' | 'download' | 'signup' | 'login' | 'purchase' | 'api_call' {
  if (eventName.includes('upscale') || eventName.includes('background') || eventName.includes('packshot') || eventName.includes('expand') || eventName.includes('compress')) {
    return 'upscale';
  }
  if (eventName.includes('download')) return 'download';
  if (eventName.includes('signup')) return 'signup';
  if (eventName.includes('login')) return 'login';
  if (eventName.includes('purchase') || eventName.includes('checkout')) return 'purchase';
  return 'api_call';
}
