import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from 'next-intl/plugin';

// Bundle analyzer for performance optimization
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// next-intl plugin
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Increase body size limit for large image uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
    // Increase middleware request body buffer size (default is 10MB)
    // This affects API routes that receive large FormData uploads
    middlewareClientMaxBodySize: 26214400, // 25MB in bytes
  },
  serverExternalPackages: ['sharp'],
  // Remove console.log in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  images: {
    remotePatterns: [
      // Replicate API (for AI-generated images)
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
      {
        protocol: "https",
        hostname: "pbxt.replicate.delivery",
      },
      // Firebase Storage
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      // Google user avatars
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Pixelift domain
      {
        protocol: "https",
        hostname: "pixelift.pl",
      },
      {
        protocol: "https",
        hostname: "www.pixelift.pl",
      },
    ],
    // Image optimization settings
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400,
  },
  // Redirects for renamed pages
  async redirects() {
    return [
      // Old packshot-generator -> new ai-background-generator
      {
        source: '/:locale/tools/packshot-generator',
        destination: '/:locale/tools/ai-background-generator',
        permanent: true,
      },
    ];
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Note: 'unsafe-inline' and 'unsafe-eval' are required for Next.js hydration and Stripe
              // In future, implement nonce-based CSP for better security
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.googletagmanager.com https://*.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' blob: https:",
              "connect-src 'self' https://*.stripe.com https://*.google-analytics.com https://*.googletagmanager.com https://firebasestorage.googleapis.com https://*.replicate.delivery https://*.sentry.io https://*.fal.ai https://api.piapi.ai https://api.runwayml.com wss:",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.google.com https://td.doubleclick.net",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://*.stripe.com",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
      // Prevent Cloudflare from caching admin pages
      {
        source: '/:locale/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'no-store',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'no-store',
          },
        ],
      },
      // Cache static assets aggressively (JS, CSS, fonts)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images with moderate TTL
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Cache API gallery/explore endpoints (public data)
      {
        source: '/api/ai-image/gallery',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
      // Cache blog content
      {
        source: '/:locale/blog/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

// Apply bundle analyzer wrapper
const configWithAnalyzer = withBundleAnalyzer(nextConfig);

// Apply next-intl wrapper
const configWithIntl = withNextIntl(configWithAnalyzer);

export default withSentryConfig(configWithIntl, {
  // Sentry organization and project slugs
  org: "juvestorepl-micha-chmielarz",
  project: "pixelift",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Sourcemaps configuration
  sourcemaps: {
    disable: process.env.NODE_ENV !== 'production',
  },
});
