import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
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
  },
};

export default withSentryConfig(nextConfig, {
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
