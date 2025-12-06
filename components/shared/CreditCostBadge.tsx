'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import {
  CREDIT_COSTS,
  ToolType,
  formatCreditCost,
  formatCreditRange,
  getToolConfig,
} from '@/lib/credits-config';

export interface CreditCostBadgeProps {
  /** Typ narzędzia lub bezpośredni koszt */
  tool?: ToolType;
  /** Bezpośredni koszt (jeśli nie podano tool) */
  cost?: number;
  /** Rozmiar badge'a */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Wariant kolorystyczny */
  variant?: 'default' | 'warning' | 'premium' | 'dynamic';
  /** Czy pokazać tooltip z opisem */
  showTooltip?: boolean;
  /** Dodatkowy opis (np. dla dynamicznych kosztów) */
  description?: string;
  /** Klasa CSS */
  className?: string;
  /** Pokaż ikonę monety */
  showIcon?: boolean;
}

/**
 * Badge wyświetlający koszt kredytowy narzędzia.
 *
 * Użycie:
 * - <CreditCostBadge tool="upscale" /> - pobiera koszt z konfiguracji
 * - <CreditCostBadge cost={3} /> - bezpośredni koszt
 * - <CreditCostBadge tool="reimagine" variant="dynamic" /> - zakres kosztów
 */
export function CreditCostBadge({
  tool,
  cost: directCost,
  size = 'md',
  variant = 'default',
  showTooltip = true,
  description,
  className = '',
  showIcon = true,
}: CreditCostBadgeProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const locale = useLocale();

  // Pobierz konfigurację narzędzia lub użyj bezpośredniego kosztu
  const config = tool ? getToolConfig(tool) : null;
  const cost = directCost ?? config?.cost ?? 0;
  const isDynamic = config?.isDynamic ?? false;
  const minCost = config?.minCost;
  const maxCost = config?.maxCost;

  // Pobierz zlokalizowany opis kosztu
  const getCostDescription = () => {
    if (description) return description;
    if (!config?.costDescription) return undefined;
    const localeKey = (locale === 'pl' ? 'pl' : 'en') as 'en' | 'pl';
    return config.costDescription[localeKey];
  };
  const costDescription = getCostDescription();

  // Określ wariant automatycznie na podstawie kosztu
  const autoVariant = (() => {
    if (variant !== 'default') return variant;
    if (isDynamic) return 'dynamic';
    if (cost >= 4) return 'warning';
    if (cost >= 3) return 'premium';
    return 'default';
  })();

  // Style na podstawie rozmiaru
  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-0.5',
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  // Style na podstawie wariantu
  const variantStyles = {
    default: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    premium: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    dynamic: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  // Ikona monety
  const CoinIcon = () => (
    <svg
      className={size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="12" cy="12" r="10" opacity="0.3" />
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold">C</text>
    </svg>
  );

  // Ikona info (dla dynamicznych)
  const InfoIcon = () => (
    <svg
      className={size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  );

  // Tekst do wyświetlenia
  const displayText = isDynamic && minCost !== undefined && maxCost !== undefined
    ? formatCreditRange(minCost, maxCost, locale)
    : formatCreditCost(cost, locale);

  return (
    <div className="relative inline-flex">
      <div
        className={`
          inline-flex items-center rounded-full border font-medium
          ${sizeStyles[size]}
          ${variantStyles[autoVariant]}
          ${className}
        `}
        onMouseEnter={() => showTooltip && setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
      >
        {showIcon && <CoinIcon />}
        <span>{displayText}</span>
        {isDynamic && <InfoIcon />}
      </div>

      {/* Tooltip */}
      {showTooltip && isTooltipVisible && costDescription && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            {costDescription}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Badge wyświetlający pozostałe kredyty użytkownika
 */
export interface CreditsRemainingProps {
  credits: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function CreditsRemaining({ credits, size = 'sm', className = '' }: CreditsRemainingProps) {
  const locale = useLocale();
  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
  };

  const colorStyles = credits <= 5
    ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : credits <= 20
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    : 'bg-gray-700/50 text-gray-300 border-gray-600';

  const creditsLabel = locale === 'pl'
    ? (credits === 1 ? 'kredyt' : (credits >= 2 && credits <= 4 ? 'kredyty' : 'kredytów'))
    : (credits === 1 ? 'credit' : 'credits');

  return (
    <div
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${sizeStyles[size]}
        ${colorStyles}
        ${className}
      `}
    >
      <span>{credits}</span>
      <span className="opacity-70">{creditsLabel}</span>
    </div>
  );
}

/**
 * Wyświetlenie kosztu z informacją "zostanie pobrane"
 */
export interface CreditCostInfoProps {
  tool?: ToolType;
  cost?: number;
  userCredits?: number;
  className?: string;
}

export function CreditCostInfo({ tool, cost: directCost, userCredits, className = '' }: CreditCostInfoProps) {
  const locale = useLocale();
  const config = tool ? getToolConfig(tool) : null;
  const cost = directCost ?? config?.cost ?? 0;
  const hasEnough = userCredits !== undefined ? userCredits >= cost : true;

  const getCreditsText = (count: number) => {
    if (locale === 'pl') {
      if (count === 1) return 'kredyt';
      if (count >= 2 && count <= 4) return 'kredyty';
      return 'kredytów';
    }
    return count === 1 ? 'credit' : 'credits';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <CreditCostBadge tool={tool} cost={directCost} size="sm" />
      {userCredits !== undefined && (
        <span className={`text-xs ${hasEnough ? 'text-gray-400' : 'text-red-400'}`}>
          {hasEnough
            ? locale === 'pl'
              ? `(masz ${userCredits} ${getCreditsText(userCredits)})`
              : `(you have ${userCredits} ${getCreditsText(userCredits)})`
            : locale === 'pl'
              ? `(brakuje ${cost - userCredits} ${getCreditsText(cost - userCredits)})`
              : `(need ${cost - userCredits} more ${getCreditsText(cost - userCredits)})`
          }
        </span>
      )}
    </div>
  );
}

export default CreditCostBadge;
