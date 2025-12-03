/**
 * SEO Locales Configuration
 * Supports 30+ languages with Google-specific parameters
 */

export interface SEOLocaleConfig {
  code: string;           // ISO code: pl, en, es, fr, de, it...
  name: string;           // English name
  nativeName: string;     // Native name
  googleDomain: string;   // google.pl, google.com, google.de...
  googleHL: string;       // hl parameter for Google (interface language)
  googleGL: string;       // gl parameter (geolocation/country)
  flag: string;           // Emoji flag
  isActive: boolean;      // Whether currently enabled
  priority: number;       // Sort order (lower = higher priority)
}

// Default locales - 4 active + 26 prepared for expansion
export const SEO_LOCALES: SEOLocaleConfig[] = [
  // === ACTIVE LOCALES (4) ===
  {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    googleDomain: 'google.pl',
    googleHL: 'pl',
    googleGL: 'PL',
    flag: '🇵🇱',
    isActive: true,
    priority: 1
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    googleDomain: 'google.com',
    googleHL: 'en',
    googleGL: 'US',
    flag: '🇺🇸',
    isActive: true,
    priority: 2
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    googleDomain: 'google.es',
    googleHL: 'es',
    googleGL: 'ES',
    flag: '🇪🇸',
    isActive: true,
    priority: 3
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    googleDomain: 'google.fr',
    googleHL: 'fr',
    googleGL: 'FR',
    flag: '🇫🇷',
    isActive: true,
    priority: 4
  },

  // === PREPARED LOCALES (26) ===
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    googleDomain: 'google.de',
    googleHL: 'de',
    googleGL: 'DE',
    flag: '🇩🇪',
    isActive: false,
    priority: 5
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    googleDomain: 'google.it',
    googleHL: 'it',
    googleGL: 'IT',
    flag: '🇮🇹',
    isActive: false,
    priority: 6
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    googleDomain: 'google.pt',
    googleHL: 'pt',
    googleGL: 'PT',
    flag: '🇵🇹',
    isActive: false,
    priority: 7
  },
  {
    code: 'pt-br',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    googleDomain: 'google.com.br',
    googleHL: 'pt-BR',
    googleGL: 'BR',
    flag: '🇧🇷',
    isActive: false,
    priority: 8
  },
  {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    googleDomain: 'google.nl',
    googleHL: 'nl',
    googleGL: 'NL',
    flag: '🇳🇱',
    isActive: false,
    priority: 9
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    googleDomain: 'google.ru',
    googleHL: 'ru',
    googleGL: 'RU',
    flag: '🇷🇺',
    isActive: false,
    priority: 10
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    googleDomain: 'google.co.jp',
    googleHL: 'ja',
    googleGL: 'JP',
    flag: '🇯🇵',
    isActive: false,
    priority: 11
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    googleDomain: 'google.co.kr',
    googleHL: 'ko',
    googleGL: 'KR',
    flag: '🇰🇷',
    isActive: false,
    priority: 12
  },
  {
    code: 'zh',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    googleDomain: 'google.com',
    googleHL: 'zh-CN',
    googleGL: 'CN',
    flag: '🇨🇳',
    isActive: false,
    priority: 13
  },
  {
    code: 'zh-tw',
    name: 'Chinese (Traditional)',
    nativeName: '繁體中文',
    googleDomain: 'google.com.tw',
    googleHL: 'zh-TW',
    googleGL: 'TW',
    flag: '🇹🇼',
    isActive: false,
    priority: 14
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    googleDomain: 'google.com',
    googleHL: 'ar',
    googleGL: 'SA',
    flag: '🇸🇦',
    isActive: false,
    priority: 15
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    googleDomain: 'google.co.in',
    googleHL: 'hi',
    googleGL: 'IN',
    flag: '🇮🇳',
    isActive: false,
    priority: 16
  },
  {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    googleDomain: 'google.com.tr',
    googleHL: 'tr',
    googleGL: 'TR',
    flag: '🇹🇷',
    isActive: false,
    priority: 17
  },
  {
    code: 'sv',
    name: 'Swedish',
    nativeName: 'Svenska',
    googleDomain: 'google.se',
    googleHL: 'sv',
    googleGL: 'SE',
    flag: '🇸🇪',
    isActive: false,
    priority: 18
  },
  {
    code: 'da',
    name: 'Danish',
    nativeName: 'Dansk',
    googleDomain: 'google.dk',
    googleHL: 'da',
    googleGL: 'DK',
    flag: '🇩🇰',
    isActive: false,
    priority: 19
  },
  {
    code: 'no',
    name: 'Norwegian',
    nativeName: 'Norsk',
    googleDomain: 'google.no',
    googleHL: 'no',
    googleGL: 'NO',
    flag: '🇳🇴',
    isActive: false,
    priority: 20
  },
  {
    code: 'fi',
    name: 'Finnish',
    nativeName: 'Suomi',
    googleDomain: 'google.fi',
    googleHL: 'fi',
    googleGL: 'FI',
    flag: '🇫🇮',
    isActive: false,
    priority: 21
  },
  {
    code: 'cs',
    name: 'Czech',
    nativeName: 'Čeština',
    googleDomain: 'google.cz',
    googleHL: 'cs',
    googleGL: 'CZ',
    flag: '🇨🇿',
    isActive: false,
    priority: 22
  },
  {
    code: 'sk',
    name: 'Slovak',
    nativeName: 'Slovenčina',
    googleDomain: 'google.sk',
    googleHL: 'sk',
    googleGL: 'SK',
    flag: '🇸🇰',
    isActive: false,
    priority: 23
  },
  {
    code: 'uk',
    name: 'Ukrainian',
    nativeName: 'Українська',
    googleDomain: 'google.com.ua',
    googleHL: 'uk',
    googleGL: 'UA',
    flag: '🇺🇦',
    isActive: false,
    priority: 24
  },
  {
    code: 'hu',
    name: 'Hungarian',
    nativeName: 'Magyar',
    googleDomain: 'google.hu',
    googleHL: 'hu',
    googleGL: 'HU',
    flag: '🇭🇺',
    isActive: false,
    priority: 25
  },
  {
    code: 'ro',
    name: 'Romanian',
    nativeName: 'Română',
    googleDomain: 'google.ro',
    googleHL: 'ro',
    googleGL: 'RO',
    flag: '🇷🇴',
    isActive: false,
    priority: 26
  },
  {
    code: 'bg',
    name: 'Bulgarian',
    nativeName: 'Български',
    googleDomain: 'google.bg',
    googleHL: 'bg',
    googleGL: 'BG',
    flag: '🇧🇬',
    isActive: false,
    priority: 27
  },
  {
    code: 'el',
    name: 'Greek',
    nativeName: 'Ελληνικά',
    googleDomain: 'google.gr',
    googleHL: 'el',
    googleGL: 'GR',
    flag: '🇬🇷',
    isActive: false,
    priority: 28
  },
  {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    googleDomain: 'google.co.th',
    googleHL: 'th',
    googleGL: 'TH',
    flag: '🇹🇭',
    isActive: false,
    priority: 29
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    googleDomain: 'google.com.vn',
    googleHL: 'vi',
    googleGL: 'VN',
    flag: '🇻🇳',
    isActive: false,
    priority: 30
  },
];

// Helper functions
export function getLocaleByCode(code: string): SEOLocaleConfig | undefined {
  return SEO_LOCALES.find(l => l.code === code);
}

export function getActiveLocales(): SEOLocaleConfig[] {
  return SEO_LOCALES.filter(l => l.isActive).sort((a, b) => a.priority - b.priority);
}

export function getAllLocales(): SEOLocaleConfig[] {
  return SEO_LOCALES.sort((a, b) => a.priority - b.priority);
}

export function getLocaleFlag(code: string): string {
  return getLocaleByCode(code)?.flag || '🌍';
}

export function getLocaleName(code: string): string {
  return getLocaleByCode(code)?.name || code.toUpperCase();
}
