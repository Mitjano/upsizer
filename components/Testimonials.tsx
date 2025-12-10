'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

const testimonialKeys = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6'];
const testimonialMeta = [
  { initials: 'SM', color: 'from-pink-500 to-rose-500' },
  { initials: 'MC', color: 'from-blue-500 to-cyan-500' },
  { initials: 'ER', color: 'from-purple-500 to-violet-500' },
  { initials: 'DP', color: 'from-green-500 to-emerald-500' },
  { initials: 'LT', color: 'from-orange-500 to-amber-500' },
  { initials: 'JW', color: 'from-teal-500 to-cyan-500' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const t = useTranslations('testimonials');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotate testimonials
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonialKeys.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonialKeys.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonialKeys.length) % testimonialKeys.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-100/50 dark:from-gray-900/50 to-transparent"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">{t('badge')}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            {t('title')} <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">{t('titleHighlight')}</span> {t('titleSuffix')}
          </h2>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex justify-center gap-8 md:gap-16 mb-16 flex-wrap">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              50K+
            </div>
            <div className="text-gray-500 dark:text-gray-400 mt-1">{t('stats.imagesProcessed')}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              10K+
            </div>
            <div className="text-gray-500 dark:text-gray-400 mt-1">{t('stats.happyUsers')}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              4.9/5
            </div>
            <div className="text-gray-500 dark:text-gray-400 mt-1">{t('stats.averageRating')}</div>
          </div>
        </div>

        {/* Featured Testimonial (Large) */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative">
            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 p-3 bg-gray-200/80 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-full transition-all hover:scale-110"
              aria-label="Previous testimonial"
            >
              <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 p-3 bg-gray-200/80 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-full transition-all hover:scale-110"
              aria-label="Next testimonial"
            >
              <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Testimonial Card */}
            <div className="relative bg-gradient-to-br from-gray-100/80 to-gray-200/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-3xl p-8 md:p-12">
              {/* Quote Icon */}
              <div className="absolute top-6 right-8 text-green-500/20">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>

              <div className="relative">
                {/* Rating */}
                <div className="mb-6">
                  <StarRating rating={5} />
                </div>

                {/* Quote */}
                <blockquote className="text-xl md:text-2xl text-gray-700 dark:text-gray-200 leading-relaxed mb-8 min-h-[120px]">
                  &quot;{t(`items.${testimonialKeys[currentIndex]}.quote`)}&quot;
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${testimonialMeta[currentIndex].color} flex items-center justify-center text-white font-bold text-lg`}>
                    {testimonialMeta[currentIndex].initials}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-lg">{t(`items.${testimonialKeys[currentIndex]}.name`)}</div>
                    <div className="text-gray-500 dark:text-gray-400">{t(`items.${testimonialKeys[currentIndex]}.role`)}</div>
                    <div className="text-green-600 dark:text-green-400 text-sm">{t(`items.${testimonialKeys[currentIndex]}.company`)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonialKeys.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-green-500'
                    : 'bg-gray-400 dark:bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Grid of smaller testimonials */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonialKeys.slice(0, 3).map((key, index) => (
            <div
              key={key}
              className={`group p-6 bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl hover:border-green-500/50 transition-all duration-300 ${
                index === currentIndex ? 'ring-2 ring-green-500/30' : ''
              }`}
            >
              <StarRating rating={5} />
              <p className="text-gray-600 dark:text-gray-300 mt-4 mb-6 line-clamp-3">&quot;{t(`items.${key}.quote`)}&quot;</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonialMeta[index].color} flex items-center justify-center text-white font-bold text-sm`}>
                  {testimonialMeta[index].initials}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">{t(`items.${key}.name`)}</div>
                  <div className="text-gray-500 text-xs">{t(`items.${key}.role`)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
