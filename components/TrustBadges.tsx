'use client';

import { useTranslations } from 'next-intl';

const trustBadges = [
  {
    id: 'ssl',
    title: 'SSL Secured',
    description: '256-bit encryption',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    color: 'text-green-400',
  },
  {
    id: 'gdpr',
    title: 'GDPR Compliant',
    description: 'EU data protection',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'text-blue-400',
  },
  {
    id: 'privacy',
    title: 'Auto-Delete',
    description: 'Files deleted after 1h',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    color: 'text-purple-400',
  },
  {
    id: 'uptime',
    title: '99.9% Uptime',
    description: 'Enterprise reliability',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-cyan-400',
  },
  {
    id: 'support',
    title: '24/7 Support',
    description: 'Always here to help',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    color: 'text-orange-400',
  },
  {
    id: 'noWatermark',
    title: 'No Watermarks',
    description: 'Full quality exports',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'text-pink-400',
  },
];


export default function TrustBadges() {
  const t = useTranslations('trustBadges');
  return (
    <section className="py-16 border-t border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        {/* Trust Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {trustBadges.map((badge) => (
            <div
              key={badge.id}
              className="group flex flex-col items-center text-center p-4 rounded-xl bg-gray-100/50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-all duration-300"
            >
              <div className={`${badge.color} mb-3 group-hover:scale-110 transition-transform`}>
                {badge.icon}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{t(`badges.${badge.id}.title`)}</h3>
              <p className="text-gray-500 text-xs">{t(`badges.${badge.id}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
