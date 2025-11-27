import { NextRequest, NextResponse } from 'next/server';
import { trackVisitor, trackPageView, trackEvent } from '@/lib/analytics';

// Helper to parse user agent
function parseUserAgent(ua: string) {
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  let browser = 'unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  let os = 'unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS';

  return { device, browser, os };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // Get client info
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const userAgent = data?.userAgent || request.headers.get('user-agent') || '';
    const { device, browser, os } = parseUserAgent(userAgent);

    switch (type) {
      case 'visitor':
        const visitorId = await trackVisitor({
          ip,
          userAgent,
          device: device as 'mobile' | 'tablet' | 'desktop',
          browser,
          os,
        });
        return NextResponse.json({ success: true, visitorId });

      case 'page_view':
        await trackPageView({
          path: data.path,
          referrer: data.referrer,
          visitorId: data.visitorId,
        });
        return NextResponse.json({ success: true });

      case 'event':
        await trackEvent({
          type: mapEventType(data.eventName),
          userId: data.userId,
          metadata: {
            eventName: data.eventName,
            ...data,
          },
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

// Map event names to our event types
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
