import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://fd8ed66a299e3607e86abb43226f6c22@o4510438851346432.ingest.de.sentry.io/4510438867796048",

  // Performance Monitoring
  tracesSampleRate: 0.1,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Environment
  environment: process.env.NODE_ENV,

  // Enable logs
  enableLogs: true,

  // Ignore certain errors
  ignoreErrors: [
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    'NEXT_NOT_FOUND',
  ],
});
