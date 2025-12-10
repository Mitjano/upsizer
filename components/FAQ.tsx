"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';

const faqKeys = [
  'upscaleQuality',
  'bestFreeTool',
  'mobileSupport',
  'aiVsManual',
  'artworkSupport',
  'formats',
  'processingTime',
  'dataSafety',
  'aiPresets',
  'batchProcessing',
  'scalingDifference',
  'groupPhotos',
  'commercialUse',
  'aiModels',
  'credits'
];

export default function FAQ() {
  const t = useTranslations('faq');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-gray-100/50 dark:bg-gray-900/50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4">
          {t('title')} <span className="text-green-600 dark:text-green-400">{t('titleHighlight')}</span>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqKeys.map((key, index) => (
            <div
              key={key}
              className="bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition"
              >
                <span className="font-medium text-lg">{t(`items.${key}.question`)}</span>
                <svg
                  className={`w-5 h-5 text-green-500 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-600 dark:text-gray-300">
                  {t(`items.${key}.answer`)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
