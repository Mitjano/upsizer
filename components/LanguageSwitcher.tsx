'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';
import { useTransition, useState, useRef, useEffect, useCallback } from 'react';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const switchLocale = useCallback((newLocale: Locale) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
    setIsOpen(false);
  }, [pathname, router]);

  const { activeIndex, handleKeyDown, containerRef } = useKeyboardNavigation({
    itemCount: locales.length,
    isOpen,
    onSelect: (index) => switchLocale(locales[index]),
    onEscape: () => {
      setIsOpen(false);
      buttonRef.current?.focus();
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle button keyboard events
  const handleButtonKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  const menuId = 'language-menu';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleButtonKeyDown}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
          isPending ? 'opacity-50' : ''
        }`}
        disabled={isPending}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={menuId}
        aria-label={`Select language. Current: ${localeNames[locale]}`}
      >
        <span className="text-lg" aria-hidden="true">{localeFlags[locale]}</span>
        <span className="hidden lg:inline text-sm text-gray-900 dark:text-white">{localeNames[locale]}</span>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <div
        ref={containerRef}
        id={menuId}
        role="listbox"
        aria-label="Select language"
        aria-activedescendant={activeIndex >= 0 ? `lang-option-${locales[activeIndex]}` : undefined}
        onKeyDown={handleKeyDown}
        tabIndex={isOpen ? 0 : -1}
        className={`absolute right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[9999] min-w-[140px] transition-all duration-200 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        {locales.map((loc, index) => (
          <button
            key={loc}
            id={`lang-option-${loc}`}
            role="option"
            aria-selected={loc === locale}
            data-index={index}
            onClick={() => switchLocale(loc)}
            disabled={isPending}
            className={`flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition first:rounded-t-lg last:rounded-b-lg ${
              loc === locale
                ? 'text-green-600 dark:text-green-400 bg-gray-100 dark:bg-gray-700/50'
                : 'text-gray-900 dark:text-white'
            } ${activeIndex === index ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
          >
            <span className="text-lg" aria-hidden="true">{localeFlags[loc]}</span>
            <span className="text-sm">{localeNames[loc]}</span>
            {loc === locale && (
              <svg className="w-4 h-4 ml-auto text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
