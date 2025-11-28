"use client";

import { useState } from "react";
import { FaCheck, FaDatabase, FaDownload, FaEnvelope, FaQuoteLeft, FaCog } from "react-icons/fa";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedSubscription, setSelectedSubscription] = useState("plan-500");
  const [selectedOneTime, setSelectedOneTime] = useState(2); // Index 2 = 100 credits

  // Subscription Plans - simplified to 4 options
  // Yearly gives 70% discount
  const subscriptionPlans = [
    {
      id: "plan-100",
      credits: 100,
      priceMonthly: 7.99,
      selected: false
    },
    {
      id: "plan-300",
      credits: 300,
      priceMonthly: 21.99,
      selected: false
    },
    {
      id: "plan-500",
      credits: 500,
      priceMonthly: 34.99,
      selected: true // Default selected
    },
    {
      id: "plan-1000",
      credits: 1000,
      priceMonthly: 59.99,
      selected: false
    }
  ];

  // Get current selected plan
  const selectedPlan = subscriptionPlans.find(p => p.id === selectedSubscription);

  // Yearly daje 70% zniżki (30% ceny monthly)
  const currentPricePerMonth = billingCycle === "yearly" && selectedPlan
    ? selectedPlan.priceMonthly * 0.3 // 70% off
    : selectedPlan?.priceMonthly || 0;

  const currentPricePerCredit = selectedPlan
    ? (currentPricePerMonth / selectedPlan.credits).toFixed(2)
    : "0.00";

  // For yearly: show total yearly price
  const totalYearlyPrice = billingCycle === "yearly" && selectedPlan
    ? (selectedPlan.priceMonthly * 0.3 * 12).toFixed(2)
    : undefined;

  // One-time payment plans - simplified to 4 options
  const oneTimePlans = [
    {
      credits: 25,
      price: 8.99,
      pricePerCredit: 0.36
    },
    {
      credits: 50,
      price: 13.99,
      pricePerCredit: 0.28
    },
    {
      credits: 100,
      price: 21.99,
      pricePerCredit: 0.22,
      selected: true // Most popular
    },
    {
      credits: 200,
      price: 39.99,
      pricePerCredit: 0.20
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">

      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            Choose the Right Plan for You
          </h1>
        </div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          {/* Free Plan */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-8 flex flex-col">
            <h3 className="text-2xl font-bold mb-6">Free Plan</h3>

            <div className="mb-6">
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-gray-400 ml-2">/credit</span>
              </div>
            </div>

            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold mb-8 transition">
              Sign Up For Free
            </button>

            <div className="space-y-4 flex-grow">
              <div className="flex items-start gap-3">
                <FaDatabase className="text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">3 free credits</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaDownload className="text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">3 free downloads</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Get 3 free credits and 3 free downloads every month to try the platform
              </p>
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="bg-gray-800/50 rounded-2xl border-2 border-blue-500 p-8 flex flex-col relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-full">
                Most Popular
              </span>
            </div>

            <h3 className="text-2xl font-bold mb-6">Subscription Plan</h3>

            <div className="mb-6">
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold">
                  ${currentPricePerCredit}
                </span>
                <span className="text-gray-400 ml-2">/credit</span>
              </div>
              <div className="text-sm text-gray-400">
                ${currentPricePerMonth.toFixed(2)} billed {billingCycle === "yearly" ? "monthly" : "monthly"}
              </div>
              {billingCycle === "yearly" && totalYearlyPrice && (
                <div className="text-xs text-gray-500">
                  ${totalYearlyPrice} billed yearly
                </div>
              )}
            </div>

            <button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 rounded-lg font-semibold mb-6 transition">
              Subscribe Now
            </button>

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-gray-700 rounded-lg p-1 mb-6 w-full">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                  billingCycle === "monthly"
                    ? "bg-gray-900 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition flex items-center justify-center gap-2 ${
                  billingCycle === "yearly"
                    ? "bg-gray-900 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Yearly
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                  Save 70%
                </span>
              </button>
            </div>

            {/* Subscription Options */}
            <div className="space-y-2 flex-grow mb-6">
              {subscriptionPlans.map((plan) => {
                // Oblicz cenę per month (z 70% zniżką dla yearly)
                const pricePerMonth = billingCycle === "yearly"
                  ? plan.priceMonthly * 0.3
                  : plan.priceMonthly;

                const pricePerCredit = (pricePerMonth / plan.credits).toFixed(2);

                // Dla yearly pokazujemy całkowitą roczną cenę w małym tekście
                const totalYearly = billingCycle === "yearly"
                  ? (plan.priceMonthly * 0.3 * 12).toFixed(2)
                  : null;

                return (
                  <label
                    key={plan.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                      selectedSubscription === plan.id
                        ? "bg-blue-500/20 border border-blue-500"
                        : "bg-gray-700/30 hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="subscription"
                        checked={selectedSubscription === plan.id}
                        onChange={() => setSelectedSubscription(plan.id)}
                        className="w-4 h-4 text-blue-500"
                      />
                      <div>
                        <div className="font-medium text-sm">{plan.credits} Credits/month</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">${pricePerCredit}/credit</div>
                      <div className="text-xs text-gray-400">
                        ${pricePerMonth.toFixed(2)}/month
                        {totalYearly && (
                          <> ({totalYearly}/year)</>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="pt-6 border-t border-gray-700 space-y-2 text-sm text-gray-400">
              {billingCycle === "yearly" ? (
                <>
                  <p>Billed yearly (Auto-renews yearly)</p>
                  <p>Save 70% compared to monthly billing</p>
                </>
              ) : (
                <p>Billed monthly (Auto-renews monthly)</p>
              )}
              <p>Cancel anytime</p>
              <p>Due to the high cost of AI, we don't offer refunds. Please try the free plan before upgrading</p>
            </div>
          </div>

          {/* One Time Payment */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-8 flex flex-col">
            <h3 className="text-2xl font-bold mb-6">One time payment</h3>

            <div className="mb-6">
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold">
                  ${oneTimePlans[selectedOneTime].pricePerCredit.toFixed(2)}
                </span>
                <span className="text-gray-400 ml-2">/credit</span>
              </div>
              <div className="text-sm text-gray-400">
                ${oneTimePlans[selectedOneTime].price.toFixed(2)} billed once
              </div>
            </div>

            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold mb-6 transition">
              Buy Now
            </button>

            {/* One-time Options */}
            <div className="space-y-3 flex-grow mb-6">
              {oneTimePlans.map((plan, index) => (
                <label
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                    selectedOneTime === index
                      ? "bg-blue-500/20 border border-blue-500"
                      : "bg-gray-700/50 hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="onetime"
                      checked={selectedOneTime === index}
                      onChange={() => setSelectedOneTime(index)}
                      className="w-4 h-4 text-blue-500"
                    />
                    <div>
                      <div className="font-medium">{plan.credits} Credits</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${plan.pricePerCredit.toFixed(2)}/credit</div>
                    <div className="text-xs text-gray-400">${plan.price.toFixed(2)} billed once</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-700 text-sm text-gray-400">
              <p>Credits are valid for 1 year from purchase and are non-refundable</p>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-8 flex flex-col">
            <h3 className="text-2xl font-bold mb-6">Enterprise Plan</h3>

            <div className="mb-6">
              <div className="text-3xl font-bold mb-2">Need custom solutions?</div>
            </div>

            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold mb-8 transition">
              Talk to Sales
            </button>

            <div className="space-y-4 flex-grow">
              <div className="flex items-start gap-3">
                <FaQuoteLeft className="text-purple-400 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">Schedule a demo with our team</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaCog className="text-orange-400 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">Get a quote that fits your needs</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaEnvelope className="text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">Email us at <span className="text-blue-400">sales@pixelift.pl</span> for any queries</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700 text-sm text-gray-400">
              <p>Book a 1:1 session with our experts to see how Pixelift can help your business transform images at scale</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features Included</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: FREE Preview */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/30 p-6">
              <div className="text-4xl mb-4">👁️</div>
              <h3 className="text-xl font-bold mb-3">FREE Preview System</h3>
              <p className="text-gray-400 text-sm">
                Try before you buy! Generate a FREE 200x200px preview with all your settings before using any credits. Perfect for testing different presets.
              </p>
            </div>

            {/* Feature 2: Batch Processing */}
            <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/30 p-6">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-bold mb-3">Batch Processing</h3>
              <p className="text-gray-400 text-sm">
                Upload and process up to 50 images at once with the same settings. Perfect for photographers and content creators working with multiple files.
              </p>
            </div>

            {/* Feature 3: AI Presets */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/30 p-6">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-bold mb-3">7 AI Presets</h3>
              <p className="text-gray-400 text-sm">
                Quality Boost, Portrait, Landscape, Art, Restoration, Maximum, and Custom modes. Each optimized for specific use cases with one-click application.
              </p>
            </div>

            {/* Feature 4: Advanced Enhancement */}
            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/30 p-6">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-bold mb-3">Advanced Enhancements</h3>
              <p className="text-gray-400 text-sm">
                Denoising, JPEG artifact removal, color correction, and face enhancement. Fine-tune every aspect of your image processing.
              </p>
            </div>

            {/* Feature 5: Scale Options */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/30 p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3">Flexible Scaling</h3>
              <p className="text-gray-400 text-sm">
                Choose from 1x (quality only), 2x, 4x, or 8x upscaling. Enhance without resizing or scale up to 8x the original resolution.
              </p>
            </div>

            {/* Feature 6: Real-time Comparison */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/30 p-6">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-3">Interactive Comparison</h3>
              <p className="text-gray-400 text-sm">
                Drag to compare before and after images side-by-side. See the quality improvements in real-time with our interactive slider.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl border border-green-500/20 p-12 max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Start with our free plan or choose a paid option for more credits
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="/auth/signin"
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 rounded-lg font-semibold text-lg transition shadow-lg"
            >
              Start Free Trial
            </a>
            <a
              href="mailto:sales@pixelift.pl"
              className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-lg transition"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
    </div>
  );
}
