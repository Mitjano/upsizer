/**
 * Centralna konfiguracja kosztów kredytowych dla wszystkich narzędzi.
 *
 * WAŻNE: To jest jedyne źródło prawdy dla kosztów kredytowych.
 * Wszystkie API routes i komponenty powinny importować stąd.
 */

export type ToolType =
  | 'upscale'
  | 'upscale_premium'
  | 'remove_background'
  | 'colorize'
  | 'compress'
  | 'denoise'
  | 'expand'
  | 'object_removal'
  | 'packshot'
  | 'reimagine'
  | 'background_generate'
  | 'style_transfer'
  | 'structure_control'
  | 'inpainting'
  // AI Video tools
  | 'video_pixverse_5s'
  | 'video_pixverse_8s'
  | 'video_kling_5s'
  | 'video_kling_10s'
  | 'video_veo_4s'
  | 'video_veo_6s'
  | 'video_veo_8s'
  | 'video_hailuo_6s'
  | 'video_hailuo_pro_6s'
  | 'video_luma_ray2_5s';

export interface ToolCreditConfig {
  /** Bazowy koszt w kredytach */
  cost: number;
  /** Koszt minimalny (dla narzędzi ze zmiennym kosztem) */
  minCost?: number;
  /** Koszt maksymalny (dla narzędzi ze zmiennym kosztem) */
  maxCost?: number;
  /** Czy koszt jest zmienny (np. zależy od opcji) */
  isDynamic?: boolean;
  /** Opis jak obliczany jest koszt (dla tooltipów) - zlokalizowany */
  costDescription?: { en: string; pl: string };
  /** Nazwa narzędzia do wyświetlenia */
  displayName: string;
  /** Krótki opis narzędzia */
  description: string;
}

/**
 * Konfiguracja kosztów kredytowych dla każdego narzędzia
 */
export const CREDIT_COSTS: Record<ToolType, ToolCreditConfig> = {
  upscale: {
    cost: 1,
    minCost: 1,
    maxCost: 2,
    isDynamic: true,
    costDescription: {
      en: '+1 credit for Quality Boost',
      pl: '+1 kredyt za Quality Boost',
    },
    displayName: 'Upscaler',
    description: 'Powiększ obraz do 4x bez utraty jakości',
  },
  upscale_premium: {
    cost: 2,
    displayName: 'Upscaler Premium',
    description: 'Powiększenie z Quality Boost (GFPGAN)',
  },
  remove_background: {
    cost: 1,
    displayName: 'Usuń tło',
    description: 'Automatyczne usuwanie tła z obrazów',
  },
  colorize: {
    cost: 1,
    displayName: 'Kolorowanie',
    description: 'Dodaj kolory do czarno-białych zdjęć',
  },
  compress: {
    cost: 1,
    displayName: 'Kompresja',
    description: 'Zmniejsz rozmiar pliku zachowując jakość',
  },
  denoise: {
    cost: 1,
    displayName: 'Odszumianie',
    description: 'Usuń szum i artefakty z obrazów',
  },
  expand: {
    cost: 2,
    displayName: 'Rozszerzanie',
    description: 'Rozszerz obraz poza oryginalne krawędzie',
  },
  object_removal: {
    cost: 2,
    displayName: 'Usuwanie obiektów',
    description: 'Usuń niechciane elementy z obrazu',
  },
  packshot: {
    cost: 2,
    displayName: 'Packshot',
    description: 'Profesjonalne tła produktowe',
  },
  reimagine: {
    cost: 3,
    minCost: 3,
    maxCost: 12,
    isDynamic: true,
    costDescription: {
      en: '3 credits × number of variants (1-4)',
      pl: '3 kredyty × liczba wariantów (1-4)',
    },
    displayName: 'Reimagine',
    description: 'Wygeneruj warianty obrazu',
  },
  background_generate: {
    cost: 3,
    displayName: 'Generator tła',
    description: 'Wygeneruj nowe tło AI',
  },
  style_transfer: {
    cost: 4,
    displayName: 'Transfer stylu',
    description: 'Zastosuj styl artystyczny do zdjęcia',
  },
  structure_control: {
    cost: 4,
    displayName: 'Kontrola struktury',
    description: 'Zachowaj strukturę z nowym stylem',
  },
  inpainting: {
    cost: 5,
    displayName: 'Inpainting',
    description: 'Zaawansowana edycja fragmentów obrazu',
  },
  // AI Video tools
  video_pixverse_5s: {
    cost: 15,
    displayName: 'PixVerse V5 (5s)',
    description: 'Generowanie wideo AI - 5 sekund (PixVerse)',
  },
  video_pixverse_8s: {
    cost: 25,
    displayName: 'PixVerse V5 (8s)',
    description: 'Generowanie wideo AI - 8 sekund (PixVerse)',
  },
  video_kling_5s: {
    cost: 14,
    displayName: 'Kling 2.5 (5s)',
    description: 'Generowanie wideo AI - 5 sekund (Kling)',
  },
  video_kling_10s: {
    cost: 28,
    displayName: 'Kling 2.5 (10s)',
    description: 'Generowanie wideo AI - 10 sekund (Kling)',
  },
  video_veo_4s: {
    cost: 55,
    displayName: 'Google Veo 3 (4s)',
    description: 'Premium wideo AI z dźwiękiem - 4 sekundy (Veo)',
  },
  video_veo_6s: {
    cost: 80,
    displayName: 'Google Veo 3 (6s)',
    description: 'Premium wideo AI z dźwiękiem - 6 sekund (Veo)',
  },
  video_veo_8s: {
    cost: 105,
    displayName: 'Google Veo 3 (8s)',
    description: 'Premium wideo AI z dźwiękiem - 8 sekund (Veo)',
  },
  video_hailuo_6s: {
    cost: 6,
    displayName: 'MiniMax Hailuo 02 (6s)',
    description: 'Wideo AI #2 na świecie - 6 sekund, 720p',
  },
  video_hailuo_pro_6s: {
    cost: 11,
    displayName: 'MiniMax Hailuo 02 Pro (6s)',
    description: 'Wideo AI premium - 6 sekund, 1080p',
  },
  video_luma_ray2_5s: {
    cost: 5,
    displayName: 'Luma Ray2 Flash (5s)',
    description: 'Szybkie wideo AI - 5 sekund',
  },
};

/**
 * Pobierz koszt dla danego narzędzia
 */
export function getToolCost(tool: ToolType): number {
  return CREDIT_COSTS[tool].cost;
}

/**
 * Pobierz pełną konfigurację dla danego narzędzia
 */
export function getToolConfig(tool: ToolType): ToolCreditConfig {
  return CREDIT_COSTS[tool];
}

/**
 * Oblicz koszt dla upscale (z opcjonalnym quality boost)
 */
export function calculateUpscaleCost(qualityBoost: boolean): number {
  return qualityBoost ? CREDIT_COSTS.upscale_premium.cost : CREDIT_COSTS.upscale.cost;
}

/**
 * Oblicz koszt dla reimagine (zależny od liczby wariantów)
 */
export function calculateReimagineCost(variants: number): number {
  const clampedVariants = Math.min(Math.max(variants, 1), 4);
  return CREDIT_COSTS.reimagine.cost * clampedVariants;
}

/**
 * Formatuj koszt do wyświetlenia
 */
export function formatCreditCost(cost: number, locale: string = 'pl'): string {
  if (locale === 'pl') {
    if (cost === 1) return '1 kredyt';
    if (cost >= 2 && cost <= 4) return `${cost} kredyty`;
    return `${cost} kredytów`;
  }
  // English and others
  return cost === 1 ? '1 credit' : `${cost} credits`;
}

/**
 * Formatuj zakres kosztów (dla narzędzi dynamicznych)
 */
export function formatCreditRange(minCost: number, maxCost: number, locale: string = 'pl'): string {
  if (locale === 'pl') {
    return `${minCost}-${maxCost} kredytów`;
  }
  return `${minCost}-${maxCost} credits`;
}

/**
 * Sprawdź czy użytkownik ma wystarczającą liczbę kredytów
 */
export function hasEnoughCredits(userCredits: number, requiredCredits: number): boolean {
  return userCredits >= requiredCredits;
}

/**
 * Mapowanie typów narzędzi na klucze API (dla kompatybilności)
 */
export const TOOL_API_KEYS: Record<string, ToolType> = {
  'upscale': 'upscale',
  'upscale_premium': 'upscale_premium',
  'remove-background': 'remove_background',
  'removeBackground': 'remove_background',
  'colorize': 'colorize',
  'compress': 'compress',
  'compress-image': 'compress',
  'denoise': 'denoise',
  'expand': 'expand',
  'expand-image': 'expand',
  'object-removal': 'object_removal',
  'objectRemoval': 'object_removal',
  'packshot': 'packshot',
  'generate-packshot': 'packshot',
  'reimagine': 'reimagine',
  'background-generate': 'background_generate',
  'backgroundGenerate': 'background_generate',
  'style-transfer': 'style_transfer',
  'styleTransfer': 'style_transfer',
  'structure-control': 'structure_control',
  'structureControl': 'structure_control',
  'inpainting': 'inpainting',
  // AI Video mappings
  'video-pixverse-5s': 'video_pixverse_5s',
  'video-pixverse-8s': 'video_pixverse_8s',
  'video-kling-5s': 'video_kling_5s',
  'video-kling-10s': 'video_kling_10s',
  'video-veo-4s': 'video_veo_4s',
  'video-veo-6s': 'video_veo_6s',
  'video-veo-8s': 'video_veo_8s',
  'video-hailuo-6s': 'video_hailuo_6s',
  'video-hailuo-pro-6s': 'video_hailuo_pro_6s',
  'video-luma-ray2-5s': 'video_luma_ray2_5s',
};

/**
 * Pobierz typ narzędzia z klucza API
 */
export function getToolTypeFromApiKey(apiKey: string): ToolType | undefined {
  return TOOL_API_KEYS[apiKey];
}
