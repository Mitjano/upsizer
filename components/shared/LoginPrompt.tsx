"use client";

/**
 * Generic login prompt for unauthenticated users
 * Used by: Upscaler, BackgroundRemover, ImageExpander
 */

export interface LoginPromptProps {
  title?: string;
  description?: string;
  callbackUrl?: string;
  accentColor?: 'green' | 'blue' | 'purple';
  features?: string[];
}

const COLOR_CLASSES = {
  green: {
    button: 'bg-green-500 hover:bg-green-600',
    icon: 'text-green-400',
  },
  blue: {
    button: 'bg-blue-500 hover:bg-blue-600',
    icon: 'text-blue-400',
  },
  purple: {
    button: 'bg-purple-500 hover:bg-purple-600',
    icon: 'text-purple-400',
  },
};

export default function LoginPrompt({
  title = "Sign in to Upload Images",
  description = "Create a free account to start processing your images with AI. Get 3 free credits to try it out!",
  callbackUrl = "/",
  accentColor = 'green',
  features = ["3 Free Credits", "No Credit Card", "Cancel Anytime"],
}: LoginPromptProps) {
  const colors = COLOR_CLASSES[accentColor];

  return (
    <div className="w-full max-w-5xl mx-auto">
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
          <h3 className="text-2xl font-bold mb-3">{title}</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {description}
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className={`inline-block px-8 py-3 ${colors.button} rounded-lg font-medium transition`}
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
          {features.length > 0 && (
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500 flex-wrap">
              {features.map((feature) => (
                <FeatureBadge key={feature} text={feature} iconColor={colors.icon} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureBadge({ text, iconColor }: { text: string; iconColor: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg className={`w-5 h-5 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span>{text}</span>
    </div>
  );
}
