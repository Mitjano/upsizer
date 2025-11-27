import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
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
