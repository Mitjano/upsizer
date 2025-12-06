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
  | 'inpainting';

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
};

/**
 * Pobierz typ narzędzia z klucza API
 */
export function getToolTypeFromApiKey(apiKey: string): ToolType | undefined {
  return TOOL_API_KEYS[apiKey];
}
