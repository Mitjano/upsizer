import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n/config';

// Use auth config without Node.js modules for Edge Runtime
const { auth } = NextAuth(authConfig);

// Allowed origins for CSRF protection (localhost only in development)
const ALLOWED_ORIGINS = [
  'https://pixelift.pl',
  'https://www.pixelift.pl',
  // Admin Hub origin for cross-service communication
  process.env.ADMIN_HUB_ORIGIN || 'https://admin.juvestore.group',
  ...(process.env.NODE_ENV === 'development' ? [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001', // Admin Hub dev
  ] : []),
].filter(Boolean);

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Skip locale handling for API routes, static files, and SEO files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/generated-music/') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|xml|txt|mp3|wav|ogg|m4a)$/)
  ) {
    const response = NextResponse.next();

    // CSRF protection for API routes (POST, PUT, PATCH, DELETE)
    if (pathname.startsWith("/api/") && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const origin = req.headers.get("origin");
      const referer = req.headers.get("referer");

      // Skip CSRF check for internal NextAuth routes and external API (uses own auth)
      if (!pathname.startsWith("/api/auth/") && !pathname.startsWith("/api/external")) {
        const isAllowedOrigin = origin
          ? ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))
          : referer
            ? ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed))
            : true; // Allow requests without origin (same-origin, non-browser)

        if (!isAllowedOrigin) {
          return NextResponse.json(
            { error: "CSRF validation failed" },
            { status: 403 }
          );
        }
      }
    }

    return response;
  }

  // HTTPS enforcement in production
  if (
    process.env.NODE_ENV === "production" &&
    req.headers.get("x-forwarded-proto") === "http"
  ) {
    const httpsUrl = new URL(req.url);
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

  // Protect admin routes (including localized versions)
  const adminPattern = /^(\/(en|pl|es|fr))?\/admin/;
  if (adminPattern.test(pathname)) {
    // Check if user is authenticated
    if (!req.auth?.user) {
      // Not logged in - redirect to signin
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Debug: log auth info for admin routes
    console.log('[Admin Auth]', {
      email: req.auth?.user?.email,
      isAdmin: req.auth?.user?.isAdmin,
      pathname
    });

    // Check if user is admin (from JWT token)
    const isAdmin = req.auth?.user?.isAdmin === true;

    if (!isAdmin) {
      // Logged in but not admin - redirect to home
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Apply intl middleware for locale handling
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Match all routes except static files and generated content
    "/((?!_next/static|_next/image|favicon.ico|generated-music|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ogg|m4a)$).*)",
  ],
};
