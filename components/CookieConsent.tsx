"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaCookie, FaTimes } from "react-icons/fa";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, can't be disabled
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Small delay to not show immediately
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consent);
        setPreferences(saved);
      } catch (e) {
        console.error("Failed to parse cookie consent", e);
      }
    }
  }, []);

  const saveConsent = async (prefs: typeof preferences) => {
    localStorage.setItem("cookie-consent", JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);

    // Dispatch custom event to notify Analytics component
    window.dispatchEvent(new CustomEvent('cookie-consent-changed'));

    // If marketing consent is given, update newsletter subscription in database
    // This will be picked up on next login/page load if user is authenticated
    if (prefs.marketing) {
      try {
        // Try to sync marketing consent with newsletter subscription
        await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newsletterFromCookieConsent: true
          }),
        }).catch(() => {
          // Silently fail if not logged in - will sync on next login
        });
      } catch {
        // User not logged in, will sync on login
      }
    }
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
  };

  const acceptNecessary = () => {
    saveConsent({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  };

  const savePreferences = () => {
    saveConsent(preferences);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn" />

      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slideUp">
        <div className="max-w-6xl mx-auto bg-gray-900 border-2 border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          {!showSettings ? (
            // Simple Banner View
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <FaCookie className="text-2xl text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                    We value your privacy
                  </h3>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                    We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                    By clicking "Accept All", you consent to our use of cookies. You can manage your preferences or learn more in our{" "}
                    <Link href="/privacy" className="text-green-400 hover:text-green-300 underline">
                      Privacy Policy
                    </Link>
                    {" "}and{" "}
                    <Link href="/cookies" className="text-green-400 hover:text-green-300 underline">
                      Cookie Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={acceptAll}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold rounded-lg transition shadow-lg shadow-green-500/20"
                >
                  Accept All Cookies
                </button>
                <button
                  onClick={acceptNecessary}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg border border-gray-700 transition"
                >
                  Only Necessary
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg border border-gray-700 transition"
                >
                  Customize
                </button>
              </div>
            </div>
          ) : (
            // Settings View
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  Cookie Preferences
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition"
                  aria-label="Close settings"
                >
                  <FaTimes className="text-gray-400 text-xl" />
                </button>
              </div>

              <p className="text-gray-300 text-sm mb-6">
                Choose which cookies you want to accept. You can change your preferences at any time.
              </p>

              {/* Cookie Categories */}
              <div className="space-y-4 mb-6">
                {/* Necessary Cookies */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-white">Necessary Cookies</span>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                        Always Active
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Essential for the website to function properly. These cookies enable basic functions like page navigation,
                    authentication, and access to secure areas. The website cannot function properly without these cookies.
                  </p>
                </div>

                {/* Functional Cookies */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold text-white">Functional Cookies</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Enable enhanced functionality and personalization, such as remembering your preferences,
                    language settings, and user interface customizations.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold text-white">Analytics Cookies</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Help us understand how visitors interact with our website by collecting and reporting information anonymously.
                    This helps us improve our service.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold text-white">Marketing Cookies</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Used to track visitors across websites. The intention is to display ads that are relevant and engaging
                    for the individual user.
                  </p>
                </div>
              </div>

              {/* Save Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={savePreferences}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold rounded-lg transition shadow-lg shadow-green-500/20"
                >
                  Save Preferences
                </button>
                <button
                  onClick={acceptAll}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg border border-gray-700 transition"
                >
                  Accept All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </>
  );
}
