"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';

// Inline SVG icons to replace react-icons (better tree-shaking)
const DatabaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
    <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
    <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
    <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const QuoteIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
    <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
);

const CogIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const EnvelopeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" width="16" height="16">
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
  </svg>
);

export default function PricingPage() {
  const t = useTranslations('pricing');
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedSubscription, setSelectedSubscription] = useState("plan-500");
  const [selectedOneTime, setSelectedOneTime] = useState(2); // Index 2 = 100 credits

  // Subscription Plans - simplified to 4 options
  // Yearly gives 30% discount
  const subscriptionPlans = [
    {
      id: "plan-100",
      credits: 100,
      priceMonthly: 12.99,
      selected: false
    },
    {
      id: "plan-300",
      credits: 300,
      priceMonthly: 34.99,
      selected: false
    },
    {
      id: "plan-500",
      credits: 500,
      priceMonthly: 54.99,
      selected: true // Default selected
    },
    {
      id: "plan-1000",
      credits: 1000,
      priceMonthly: 89.99,
      selected: false
    }
  ];

  // Get current selected plan
  const selectedPlan = subscriptionPlans.find(p => p.id === selectedSubscription);

  // Yearly gives 30% discount (70% of monthly price)
  const currentPricePerMonth = billingCycle === "yearly" && selectedPlan
    ? selectedPlan.priceMonthly * 0.7 // 30% off
    : selectedPlan?.priceMonthly || 0;

  const currentPricePerCredit = selectedPlan
    ? (currentPricePerMonth / selectedPlan.credits).toFixed(2)
    : "0.00";

  // For yearly: show total yearly price
  const totalYearlyPrice = billingCycle === "yearly" && selectedPlan
    ? (selectedPlan.priceMonthly * 0.7 * 12).toFixed(2)
    : undefined;

  // One-time payment plans - 6 options including 500 and 1000 credits
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
    },
    {
      credits: 500,
      price: 89.99,
      pricePerCredit: 0.18
    },
    {
      credits: 1000,
      price: 159.99,
      pricePerCredit: 0.16
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white">

      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            {t('title')}
          </h1>
        </div>

        {/* Plans Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16 items-stretch">
          {/* Free Plan */}
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
            <h3 className="text-xl font-bold mb-4 h-8">{t('freePlan.title')}</h3>

            <div className="mb-4 h-20">
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">{t('freePlan.perCredit')}</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">&nbsp;</div>
            </div>

            <button className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 rounded-lg font-semibold mb-4 transition">
              {t('freePlan.button')}
            </button>

            <div className="space-y-3 flex-grow">
              <div className="flex items-start gap-3">
                <DatabaseIcon className="text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                <div className="font-medium text-sm">{t('freePlan.freeCredits')}</div>
              </div>
              <div className="flex items-start gap-3">
                <DownloadIcon className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                <div className="font-medium text-sm">{t('freePlan.freeDownloads')}</div>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {t('freePlan.description')}
              </p>
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl border-2 border-blue-500 p-6 flex flex-col relative h-full">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                {t('subscription.mostPopular')}
              </span>
            </div>

            <h3 className="text-xl font-bold mb-4 h-8 mt-2">{t('subscription.title')}</h3>

            <div className="mb-4 h-20">
              <div className="flex items-baseline mb-1">
                <span className="text-4xl font-bold">
                  ${currentPricePerCredit}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">{t('subscription.perCredit')}</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                ${currentPricePerMonth.toFixed(2)} {t('subscription.billed')} {t('subscription.monthly')}
              </div>
              {billingCycle === "yearly" && totalYearlyPrice && (
                <div className="text-xs text-gray-500">
                  ${totalYearlyPrice} {t('subscription.billedYearly')}
                </div>
              )}
            </div>

            <button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 rounded-lg font-semibold mb-4 transition">
              {t('subscription.button')}
            </button>

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 mb-4 w-full">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  billingCycle === "monthly"
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {t('subscription.monthly')}
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center justify-center gap-1 ${
                  billingCycle === "yearly"
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {t('subscription.yearly')}
                <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded">
                  {t('subscription.save30')}
                </span>
              </button>
            </div>

            {/* Subscription Options */}
            <div className="space-y-2 flex-grow mb-4">
              {subscriptionPlans.map((plan) => {
                // Oblicz cenę per month (z 30% zniżką dla yearly = 0.7 * cena)
                const pricePerMonth = billingCycle === "yearly"
                  ? plan.priceMonthly * 0.7
                  : plan.priceMonthly;

                const pricePerCredit = (pricePerMonth / plan.credits).toFixed(2);

                // Dla yearly pokazujemy całkowitą roczną cenę w małym tekście
                const totalYearly = billingCycle === "yearly"
                  ? (plan.priceMonthly * 0.7 * 12).toFixed(2)
                  : null;

                return (
                  <label
                    key={plan.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                      selectedSubscription === plan.id
                        ? "bg-blue-500/20 border border-blue-500"
                        : "bg-gray-100/50 dark:bg-gray-700/30 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="subscription"
                        checked={selectedSubscription === plan.id}
                        onChange={() => setSelectedSubscription(plan.id)}
                        className="w-3 h-3 text-blue-500"
                      />
                      <div className="font-medium text-sm">{plan.credits} {t('subscription.creditsPerMonth')}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">${pricePerCredit}{t('subscription.perCredit')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">${pricePerMonth.toFixed(2)}{t('subscription.perMonth')}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 space-y-1 text-xs text-gray-500 dark:text-gray-400">
              {billingCycle === "yearly" ? (
                <>
                  <p>{t('subscription.billedYearlyAuto')}</p>
                  <p>{t('subscription.save30Compared')}</p>
                </>
              ) : (
                <p>{t('subscription.billedMonthlyAuto')}</p>
              )}
              <p>{t('subscription.cancelAnytime')}</p>
              <p>{t('subscription.noRefunds')}</p>
            </div>
          </div>

          {/* One Time Payment */}
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
            <h3 className="text-xl font-bold mb-4 h-8">{t('oneTime.title')}</h3>

            <div className="mb-4 h-20">
              <div className="flex items-baseline mb-1">
                <span className="text-4xl font-bold">
                  ${oneTimePlans[selectedOneTime].pricePerCredit.toFixed(2)}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">{t('oneTime.perCredit')}</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                ${oneTimePlans[selectedOneTime].price.toFixed(2)} {t('oneTime.billedOnce')}
              </div>
            </div>

            <button className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 rounded-lg font-semibold mb-4 transition">
              {t('oneTime.button')}
            </button>

            {/* One-time Options */}
            <div className="space-y-2 flex-grow mb-4">
              {oneTimePlans.map((plan, index) => (
                <label
                  key={index}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                    selectedOneTime === index
                      ? "bg-blue-500/20 border border-blue-500"
                      : "bg-gray-100/50 dark:bg-gray-700/50 hover:bg-gray-200/50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="onetime"
                      checked={selectedOneTime === index}
                      onChange={() => setSelectedOneTime(index)}
                      className="w-3 h-3 text-blue-500"
                    />
                    <div className="font-medium text-sm">{plan.credits} {t('oneTime.credits')}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">${plan.pricePerCredit.toFixed(2)}{t('oneTime.perCredit')}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">${plan.price.toFixed(2)}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t('oneTime.validFor1Year')}</p>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
            <h3 className="text-xl font-bold mb-4 h-8">{t('enterprise.title')}</h3>

            <div className="mb-4 h-20">
              <div className="text-lg font-bold leading-tight">{t('enterprise.customSolutions')}</div>
            </div>

            <button className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 rounded-lg font-semibold mb-4 transition">
              {t('enterprise.button')}
            </button>

            <div className="space-y-3 flex-grow">
              <div className="flex items-start gap-3">
                <QuoteIcon className="text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                <div className="font-medium text-sm">{t('enterprise.scheduleDemo')}</div>
              </div>
              <div className="flex items-start gap-3">
                <CogIcon className="text-orange-600 dark:text-orange-400 mt-1 flex-shrink-0" />
                <div className="font-medium text-sm">{t('enterprise.getQuote')}</div>
              </div>
              <div className="flex items-start gap-3">
                <EnvelopeIcon className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                <div className="font-medium text-sm">{t('enterprise.emailUs')} <span className="text-blue-600 dark:text-blue-400">sales@pixelift.pl</span></div>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t('enterprise.bookSession')}</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">{t('features.title')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: FREE Preview */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/30 p-6">
              <div className="text-4xl mb-4">👁️</div>
              <h3 className="text-xl font-bold mb-3">{t('features.preview.title')}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('features.preview.description')}
              </p>
            </div>

            {/* Feature 2: Batch Processing */}
            <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/30 p-6">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-bold mb-3">{t('features.batch.title')}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('features.batch.description')}
              </p>
            </div>

            {/* Feature 3: AI Presets */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/30 p-6">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-bold mb-3">{t('features.presets.title')}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('features.presets.description')}
              </p>
            </div>

            {/* Feature 4: Advanced Enhancement */}
            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/30 p-6">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-bold mb-3">{t('features.enhancements.title')}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('features.enhancements.description')}
              </p>
            </div>

            {/* Feature 5: Scale Options */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/30 p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3">{t('features.scaling.title')}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('features.scaling.description')}
              </p>
            </div>

            {/* Feature 6: Real-time Comparison */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/30 p-6">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-3">{t('features.comparison.title')}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('features.comparison.description')}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl border border-green-500/20 p-12 max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-xl text-gray-500 dark:text-gray-400 mb-8">
            {t('cta.description')}
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="/auth/signin"
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg font-semibold text-lg transition shadow-lg"
            >
              {t('cta.startTrial')}
            </a>
            <a
              href="mailto:sales@pixelift.pl"
              className="px-8 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-semibold text-lg transition"
            >
              {t('cta.contactSales')}
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
    </div>
  );
}
