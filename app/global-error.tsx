'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Something went wrong!</h1>
            <p className="text-gray-400 mb-8">
              We&apos;ve been notified about this issue and are working to fix it.
            </p>
            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
