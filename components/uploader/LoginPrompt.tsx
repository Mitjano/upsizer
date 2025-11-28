"use client";

/**
 * Login prompt shown to unauthenticated users
 */
export default function LoginPrompt() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="relative border-2 border-dashed border-gray-600 rounded-2xl p-12 bg-gray-800/30">
        <div className="text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-3">Sign in to Upload Images</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Create a free account to start upscaling your images with AI. Get 3 free credits to try it out!
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/auth/signin"
              className="inline-block px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition"
            >
              Sign In
            </a>
            <a
              href="/auth/signup"
              className="inline-block px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
            >
              Sign Up Free
            </a>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
            <FeatureBadge text="3 Free Credits" />
            <FeatureBadge text="No Credit Card" />
            <FeatureBadge text="Cancel Anytime" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span>{text}</span>
    </div>
  );
}
