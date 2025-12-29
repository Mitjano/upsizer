import { NextRequest, NextResponse } from 'next/server';
import {
  getUserByEmailAsync,
  createUserAsync,
  updateUserLoginAsync,
  createNotification,
  updateUserOnSignup,
  updateUserOnLogin,
} from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';
import { authLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { isAdminEmail } from '@/lib/admin-config';
import { getGeoFromIP } from '@/lib/geo';

// Helper to parse user agent for detailed info
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
    else if (ver === '6.3') osVersion = '8.1';
    else if (ver === '6.2') osVersion = '8';
    else if (ver === '6.1') osVersion = '7';
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

  return { deviceType, browser, browserVersion, os, osVersion };
}

// Internal endpoint for user registration during OAuth callback
// Requires internal auth token (only called by NextAuth signIn callback)
export async function POST(request: NextRequest) {
  try {
    // Verify internal authentication token
    const internalAuth = request.headers.get('x-internal-auth');
    const expectedSecret = process.env.NEXTAUTH_SECRET;

    if (!expectedSecret || !internalAuth || internalAuth !== expectedSecret) {
      console.error('[register-user-internal] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting to prevent abuse
    const identifier = getClientIdentifier(request);
    const { allowed, resetAt } = authLimiter.check(identifier);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const body = await request.json();
    const { email, name, image } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Extract tracking data from headers
    // Check Cloudflare header first, then standard proxy headers
    const ipAddress = request.headers.get('cf-connecting-ip') ||
                      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || '';
    const { deviceType, browser, browserVersion, os, osVersion } = parseUserAgent(userAgent);
    const language = request.headers.get('accept-language')?.split(',')[0] || undefined;

    // Get geolocation from IP (async, won't block on failure)
    let geoData: Awaited<ReturnType<typeof getGeoFromIP>> = null;
    try {
      geoData = await getGeoFromIP(ipAddress);
    } catch (err) {
      console.error('[register-user-internal] Geo lookup failed:', err);
    }

    // Check if user exists (async for PostgreSQL support)
    let user = await getUserByEmailAsync(email);
    const isNewUser = !user;

    if (!user) {
      // Create new user (async for PostgreSQL support)
      user = await createUserAsync({
        email,
        name: name || undefined,
        image: image || undefined,
        role: isAdminEmail(email) ? 'admin' : 'user',
        status: 'active',
        credits: 3,
        totalUsage: 0,
        lastLoginAt: new Date().toISOString(),
      });

      // Track signup data with all available info
      await updateUserOnSignup(user.id, {
        ipAddress,
        userAgent,
        browser,
        browserVersion,
        os,
        osVersion,
        deviceType,
        language,
        // Geo data from IP
        country: geoData?.countryCode,
        countryName: geoData?.country,
        city: geoData?.city,
        region: geoData?.region,
        timezone: geoData?.timezone,
        latitude: geoData?.lat,
        longitude: geoData?.lon,
        // Auth provider info
        authProvider: 'google',
      }).catch(err => console.error('[register-user-internal] Failed to track signup data:', err));

      // Create notification for new user registration
      createNotification({
        type: 'success',
        category: 'user',
        title: 'New User Registration',
        message: `${name || email} just registered for Pixelift`,
        metadata: {
          userId: user.id,
          email,
          name,
          role: user.role,
          device: deviceType,
          country: geoData?.country,
        },
      });

      // Send welcome email for new users
      sendWelcomeEmail({
        userName: name || 'User',
        userEmail: email,
        freeCredits: 3,
      }).catch(err => console.error('[register-user-internal] Welcome email failed:', err));
    } else {
      // Update last login (async for PostgreSQL support)
      await updateUserLoginAsync(email);

      // Also update extended login data with geo
      await updateUserOnLogin(user.id, {
        ipAddress,
        userAgent,
        browser,
        browserVersion,
        os,
        osVersion,
        deviceType,
        language,
        country: geoData?.countryCode,
        countryName: geoData?.country,
        city: geoData?.city,
        region: geoData?.region,
        timezone: geoData?.timezone,
      }).catch(err => console.error('[register-user-internal] Failed to track login data:', err));
    }

    return NextResponse.json({ success: true, user, isNewUser });
  } catch (error) {
    console.error('[register-user-internal] Error:', error);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
