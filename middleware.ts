import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n/config';

// Allowed origins for CSRF protection
const ALLOWED_ORIGINS = [
  'https://pixelift.pl',
  'https://www.pixelift.pl',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Skip locale handling for API routes and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    const response = NextResponse.next();

    // CSRF protection for API routes (POST, PUT, PATCH, DELETE)
    if (pathname.startsWith("/api/") && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const origin = req.headers.get("origin");
      const referer = req.headers.get("referer");

      // Skip CSRF check for internal NextAuth routes
      if (!pathname.startsWith("/api/auth/")) {
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
  const adminPattern = /^(\/(pl|es|fr))?\/admin/;
  if (adminPattern.test(pathname)) {
    // Check if user is authenticated
    if (!req.auth?.user) {
      // Not logged in - redirect to signin
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

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
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
