# SEO Professional Hub - Plan Implementacji

## Przegląd

Kompleksowy moduł SEO dla panelu admin Pixelift z własnymi narzędziami scrapingu i minimalną zależnością od płatnych API.

**Multi-locale support**: System zaprojektowany dla 30+ języków/rynków z pełnym filtrowaniem i porównywaniem pozycji między lokalizacjami.

---

## Obsługiwane Lokalizacje (Scalable to 30+)

### Aktualne (4):
- 🇵🇱 Polski (pl) - google.pl
- 🇬🇧 English (en) - google.com
- 🇪🇸 Español (es) - google.es
- 🇫🇷 Français (fr) - google.fr

### Architektura Multi-Locale:

```typescript
// lib/seo/locales.ts

export interface SEOLocale {
  code: string;           // ISO code: pl, en, es, fr, de, it...
  name: string;           // Display name
  googleDomain: string;   // google.pl, google.com, google.de...
  googleHL: string;       // hl parameter for Google
  googleGL: string;       // gl parameter (country)
  flag: string;           // Emoji flag
  isActive: boolean;
}

export const SEO_LOCALES: SEOLocale[] = [
  { code: 'pl', name: 'Polski', googleDomain: 'google.pl', googleHL: 'pl', googleGL: 'PL', flag: '🇵🇱', isActive: true },
  { code: 'en', name: 'English', googleDomain: 'google.com', googleHL: 'en', googleGL: 'US', flag: '🇺🇸', isActive: true },
  { code: 'es', name: 'Español', googleDomain: 'google.es', googleHL: 'es', googleGL: 'ES', flag: '🇪🇸', isActive: true },
  { code: 'fr', name: 'Français', googleDomain: 'google.fr', googleHL: 'fr', googleGL: 'FR', flag: '🇫🇷', isActive: true },
  // Przyszłe lokalizacje (łatwe do dodania):
  { code: 'de', name: 'Deutsch', googleDomain: 'google.de', googleHL: 'de', googleGL: 'DE', flag: '🇩🇪', isActive: false },
  { code: 'it', name: 'Italiano', googleDomain: 'google.it', googleHL: 'it', googleGL: 'IT', flag: '🇮🇹', isActive: false },
  { code: 'pt', name: 'Português', googleDomain: 'google.pt', googleHL: 'pt', googleGL: 'PT', flag: '🇵🇹', isActive: false },
  { code: 'nl', name: 'Nederlands', googleDomain: 'google.nl', googleHL: 'nl', googleGL: 'NL', flag: '🇳🇱', isActive: false },
  // ... do 30+ języków
];

// Dynamiczne dodawanie nowych lokalizacji przez admin panel
```

### UI Filtering:

```
┌─────────────────────────────────────────────────────────────┐
│  Rank Tracker                                               │
├─────────────────────────────────────────────────────────────┤
│  Filters:                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ 🌍 All (247) │ │ 🇵🇱 PL (89)  │ │ 🇺🇸 EN (72)  │ ...    │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                             │
│  ☑ Compare across locales                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Architektura Modułu

```
/admin/seo/
├── page.tsx                    # Dashboard Overview
├── rank-tracker/
│   └── page.tsx               # Monitoring pozycji keywords
├── keywords/
│   └── page.tsx               # Keyword research & management
├── backlinks/
│   └── page.tsx               # Backlink analysis
├── site-audit/
│   └── page.tsx               # Technical SEO audit
├── competitors/
│   └── page.tsx               # Competitor tracking
└── reports/
    └── page.tsx               # Automated SEO reports
```

---

## Faza 1: Fundament (Tydzień 1)

### 1.1 Schema Bazy Danych (Prisma)

```prisma
// =====================
// SEO - Locale Configuration (for 30+ languages)
// =====================

model SEOLocale {
  id              String   @id @default(cuid())
  code            String   @unique  // pl, en, es, fr, de, it...
  name            String            // Polski, English, Español...
  nativeName      String?           // Polski, English, Español...
  googleDomain    String            // google.pl, google.com...
  googleHL        String            // hl parameter
  googleGL        String            // gl parameter (country)
  flag            String            // Emoji flag

  isActive        Boolean  @default(true)
  priority        Int      @default(0)  // Sort order

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  keywords        TrackedKeyword[]

  @@index([isActive])
  @@index([code])
}

model TrackedKeyword {
  id               String   @id @default(cuid())
  keyword          String
  domain           String   @default("pixelift.pl")
  localeCode       String   // Reference to SEOLocale.code

  // Current metrics (per locale!)
  currentPosition  Int?     // null = not in top 100
  previousPosition Int?
  bestPosition     Int?
  worstPosition    Int?

  // Search metrics (locale-specific)
  searchVolume     Int?     // monthly searches estimate for this locale
  difficulty       Int?     // 0-100 competition score
  cpc              Float?   // cost per click estimate (in locale currency)
  trend            String?  // rising, falling, stable

  // Tracking config
  isActive         Boolean  @default(true)
  priority         String   @default("medium") // high, medium, low
  tags             String[] @default([])
  targetUrl        String?  // expected ranking URL (locale-specific)

  // Group keywords across locales
  groupId          String?  // Same keyword in different locales shares groupId

  // Timestamps
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  lastChecked      DateTime?

  // Relations
  locale           SEOLocale @relation(fields: [localeCode], references: [code])
  history          KeywordPositionHistory[]

  @@unique([keyword, domain, localeCode])
  @@index([domain])
  @@index([localeCode])
  @@index([isActive])
  @@index([currentPosition])
  @@index([groupId])
}

model KeywordPositionHistory {
  id          String   @id @default(cuid())
  keywordId   String
  position    Int?     // null = not found in top 100
  url         String?  // URL that ranked
  title       String?  // SERP title
  snippet     String?  // SERP description
  features    String[] @default([]) // featured_snippet, local_pack, images, etc.
  checkedAt   DateTime @default(now())

  keyword     TrackedKeyword @relation(fields: [keywordId], references: [id], onDelete: Cascade)

  @@index([keywordId])
  @@index([checkedAt])
}

// =====================
// SEO - Backlinks
// =====================

model Backlink {
  id              String   @id @default(cuid())

  // Link details
  sourceUrl       String   // URL where link is found
  sourceDomain    String   // Domain of source
  targetUrl       String   // Our URL being linked
  targetDomain    String   @default("pixelift.pl")
  anchorText      String?

  // Metrics
  domainAuthority Int?     // 0-100
  pageAuthority   Int?     // 0-100
  spamScore       Int?     // 0-100

  // Link attributes
  isDoFollow      Boolean  @default(true)
  isSponsored     Boolean  @default(false)
  isUGC           Boolean  @default(false)
  linkType        String?  // text, image, redirect

  // Status tracking
  status          String   @default("active") // active, lost, broken, new
  firstSeen       DateTime @default(now())
  lastSeen        DateTime @default(now())
  lastChecked     DateTime @default(now())
  lostAt          DateTime?

  @@unique([sourceUrl, targetUrl])
  @@index([targetDomain])
  @@index([sourceDomain])
  @@index([status])
  @@index([firstSeen])
}

// =====================
// SEO - Site Audit
// =====================

model SiteAuditResult {
  id              String   @id @default(cuid())
  domain          String   @default("pixelift.pl")

  // Scores (0-100)
  overallScore    Int
  performanceScore Int
  seoScore        Int
  accessibilityScore Int
  bestPracticesScore Int

  // Issue counts
  criticalIssues  Int      @default(0)
  warningIssues   Int      @default(0)
  infoIssues      Int      @default(0)

  // Core Web Vitals
  lcp             Float?   // Largest Contentful Paint (seconds)
  fid             Float?   // First Input Delay (ms)
  cls             Float?   // Cumulative Layout Shift
  ttfb            Float?   // Time to First Byte (ms)

  // Page stats
  totalPages      Int      @default(0)
  indexedPages    Int      @default(0)
  brokenLinks     Int      @default(0)
  missingMeta     Int      @default(0)

  // Full results
  issues          Json     // Array of all issues
  pageResults     Json     // Per-page audit results

  createdAt       DateTime @default(now())

  @@index([domain])
  @@index([createdAt])
}

// =====================
// SEO - Competitors
// =====================

model Competitor {
  id              String   @id @default(cuid())
  domain          String   @unique
  name            String
  description     String?

  // Estimated metrics
  domainAuthority Int?
  monthlyTraffic  Int?
  totalKeywords   Int?

  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  rankings        CompetitorRanking[]

  @@index([isActive])
}

model CompetitorRanking {
  id            String   @id @default(cuid())
  competitorId  String
  keyword       String
  position      Int?
  url           String?
  checkedAt     DateTime @default(now())

  competitor    Competitor @relation(fields: [competitorId], references: [id], onDelete: Cascade)

  @@index([competitorId])
  @@index([keyword])
  @@index([checkedAt])
}

// =====================
// SEO - Reports
// =====================

model SEOReport {
  id              String   @id @default(cuid())
  name            String
  type            String   // weekly, monthly, custom
  domain          String   @default("pixelift.pl")

  // Report period
  periodStart     DateTime
  periodEnd       DateTime

  // Summary metrics
  keywordsTracked Int
  avgPosition     Float?
  positionsUp     Int      @default(0)
  positionsDown   Int      @default(0)
  newBacklinks    Int      @default(0)
  lostBacklinks   Int      @default(0)

  // Full data
  data            Json

  // Delivery
  emailSent       Boolean  @default(false)
  sentAt          DateTime?
  recipients      String[] @default([])

  createdAt       DateTime @default(now())

  @@index([domain])
  @@index([type])
  @@index([createdAt])
}
```

### 1.2 SERP Scraper (Własna implementacja - Multi-Locale)

**Strategia scrapingu bez blokad:**

1. **Rotating User Agents** - pula 50+ realnych UA
2. **Request Delays** - losowe opóźnienia 3-10s
3. **Proxy Rotation** (opcjonalnie) - dla większej skali
4. **Google Search via different TLDs** - google.pl, google.com, google.de...
5. **Puppeteer/Playwright** - dla JavaScript-rendered results
6. **Locale-aware requests** - proper hl/gl parameters per locale

```typescript
// lib/seo/serp-scraper.ts

interface SerpResult {
  position: number;
  url: string;
  title: string;
  snippet: string;
  features: string[];
}

interface SerpResponse {
  keyword: string;
  locale: SEOLocale;       // Full locale info
  totalResults: number;
  results: SerpResult[];
  featuredSnippet?: SerpResult;
  peopleAlsoAsk?: string[];
  relatedSearches?: string[];
  scrapedAt: Date;
}

// Multi-locale scraping
async function scrapeSERP(keyword: string, locale: SEOLocale): Promise<SerpResponse> {
  // Build locale-specific Google URL
  const searchUrl = buildGoogleSearchUrl(keyword, locale);
  // https://www.google.pl/search?q=keyword&hl=pl&gl=PL&num=100

  // Use Puppeteer with locale-specific settings
  const browser = await puppeteer.launch({
    args: ['--lang=' + locale.googleHL]
  });

  // ... scraping logic
}

function buildGoogleSearchUrl(keyword: string, locale: SEOLocale): string {
  const baseUrl = `https://www.${locale.googleDomain}/search`;
  const params = new URLSearchParams({
    q: keyword,
    hl: locale.googleHL,    // Interface language
    gl: locale.googleGL,    // Geolocation
    num: '100',             // Results count
    pws: '0',               // Disable personalization
    nfpr: '1',              // Disable auto-correction
  });
  return `${baseUrl}?${params.toString()}`;
}
```

**Limity bezpłatnego scrapingu (per locale):**
- ~100-200 zapytań/dzień bez proxy (łącznie dla wszystkich locales)
- ~1000+ zapytań/dzień z proxy ($5-10/miesiąc)
- **Rekomendacja dla 30 locales**: Proxy + smart scheduling

**Smart Scheduling dla Multi-Locale:**
```typescript
// Distribute checks across locales based on priority
const checkSchedule = {
  high: 'daily',      // Check every day
  medium: 'weekly',   // Check once per week
  low: 'biweekly',    // Check every 2 weeks
};

// With 30 locales and 100 keywords each = 3000 keyword-locale combinations
// Daily quota: ~200 checks
// Strategy: Check high-priority first, rotate medium/low
```

### 1.3 Google Suggest API (Bezpłatne - Multi-Locale)

```typescript
// Bezpłatne API do keyword suggestions - locale-aware
function getGoogleSuggestUrl(keyword: string, locale: SEOLocale): string {
  return `https://suggestqueries.google.com/complete/search?` +
    `client=firefox&q=${encodeURIComponent(keyword)}&hl=${locale.googleHL}&gl=${locale.googleGL}`;
}

// Example responses per locale:
// PL: "image upscaler" → ["image upscaler online", "image upscaler free", "image upscaler ai"]
// DE: "bild vergrößern" → ["bild vergrößern ohne qualitätsverlust", "bild vergrößern kostenlos"]
// ES: "aumentar imagen" → ["aumentar imagen sin perder calidad", "aumentar imagen online"]

async function getKeywordSuggestions(keyword: string, locales: SEOLocale[]): Promise<Map<string, string[]>> {
  const suggestions = new Map<string, string[]>();

  for (const locale of locales) {
    const url = getGoogleSuggestUrl(keyword, locale);
    const response = await fetch(url);
    const data = await response.json();
    suggestions.set(locale.code, data[1] || []);
  }

  return suggestions;
}
```

---

## Faza 2: Rank Tracker (Tydzień 2)

### Funkcjonalności:

| Feature | Opis |
|---------|------|
| **Add Keywords** | Dodawanie słów kluczowych do śledzenia (single/multi-locale) |
| **Bulk Import** | Import z CSV/TXT z kolumną locale |
| **Position History** | Wykres historii pozycji per locale |
| **Cross-Locale Compare** | Porównanie pozycji tego samego keyword w różnych krajach |
| **Alerts** | Powiadomienia o zmianach pozycji (configurable per locale) |
| **Tags & Groups** | Organizacja keywords w grupy |
| **Locale Filters** | Filtrowanie po języku/kraju |
| **Export** | Eksport do CSV/PDF z danymi per locale |

### UI Components:

```
Rank Tracker Dashboard
├── Locale Selector Bar
│   ├── [🌍 All] [🇵🇱 PL (89)] [🇺🇸 EN (72)] [🇪🇸 ES (45)] [🇫🇷 FR (41)] [+ Add Locale]
│   └── Multi-select for comparison view
├── Stats Cards (filtered by selected locales)
│   ├── Keywords Tracked: 247
│   ├── Avg Position: 12.4
│   ├── Improved: 34 ↑
│   └── Declined: 12 ↓
├── Position Distribution Chart (pie: top 3, 4-10, 11-20, etc.)
├── Keywords Table
│   ├── Columns: Keyword | 🇵🇱 | 🇺🇸 | 🇪🇸 | 🇫🇷 | Change | Volume | Last Check
│   ├── Expandable row → full locale breakdown + history chart
│   ├── Sortable by any locale column
│   ├── Filters (position range, tags, locale, status)
│   └── Bulk actions (check now, delete, tag, add to locales)
├── Add Keyword Modal
│   ├── Keyword input
│   ├── Locale checkboxes: ☑️ PL ☑️ EN ☐ ES ☐ FR [Select All]
│   ├── Bulk paste area (keyword,locale format)
│   └── Target URL per locale (optional)
└── Position History Chart
    ├── Multi-line chart (one line per locale)
    └── Locale toggles to show/hide lines

COMPARISON VIEW (when multiple locales selected):
┌─────────────────────────────────────────────────────────────┐
│ Keyword: "AI image upscaler"                                │
├─────────────────────────────────────────────────────────────┤
│  🇵🇱 PL: #3  ↑2   │  🇺🇸 EN: #12 ↓1  │  🇪🇸 ES: #8  →    │
│  🇫🇷 FR: #15 ↑5  │  🇩🇪 DE: #21 new │  🇮🇹 IT: --       │
├─────────────────────────────────────────────────────────────┤
│  [📊 View History] [🔄 Check Now] [⚙️ Settings]            │
└─────────────────────────────────────────────────────────────┘
```

### Add Keyword Flow (Multi-Locale):

```typescript
// When adding a keyword, user can select multiple locales
interface AddKeywordInput {
  keyword: string;
  locales: string[];          // ['pl', 'en', 'es']
  targetUrls?: {              // Optional per-locale target URLs
    [localeCode: string]: string;
  };
  tags?: string[];
  priority?: 'high' | 'medium' | 'low';
}

// Creates multiple TrackedKeyword entries with same groupId
async function addKeywordToLocales(input: AddKeywordInput) {
  const groupId = nanoid();   // Link keywords across locales

  for (const localeCode of input.locales) {
    await prisma.trackedKeyword.create({
      data: {
        keyword: input.keyword,
        localeCode,
        groupId,
        targetUrl: input.targetUrls?.[localeCode],
        tags: input.tags || [],
        priority: input.priority || 'medium',
      }
    });
  }
}
```

### Cron Job (Locale-Aware Scheduling):

```typescript
// Daily position check at 6:00 AM
// Smart scheduling based on locale priority and quota

interface CheckSchedule {
  localeCode: string;
  keywordsToCheck: number;
  nextCheckTime: Date;
}

async function schedulePositionChecks() {
  const DAILY_QUOTA = 200;  // Without proxy
  const locales = await prisma.sEOLocale.findMany({ where: { isActive: true } });

  // Distribute quota based on locale priority
  // Priority 1 (main markets): 40% of quota
  // Priority 2 (secondary): 35% of quota
  // Priority 3 (expansion): 25% of quota

  // High-priority keywords checked daily
  // Medium-priority: rotate through locales
  // Low-priority: weekly full check
}
```

---

## Faza 3: Keyword Research (Tydzień 3)

### Źródła danych (bezpłatne - Multi-Locale):

1. **Google Suggest** - autocomplete suggestions (per locale)
2. **Google Trends** - relative search volume (per locale/region)
3. **Related Searches** - z SERP scraping (locale-specific)
4. **People Also Ask** - z SERP scraping (locale-specific)
5. **Własna analityka** - popularne frazy z naszego ruchu (per locale)
6. **Cross-Locale Translation** - automatyczne tłumaczenie keywords na inne języki

### Funkcjonalności:

| Feature | Opis |
|---------|------|
| **Keyword Discovery** | Znajdź nowe keywords bazując na seed keyword (per locale) |
| **Multi-Locale Research** | Porównaj keyword potential across markets |
| **Auto-Translate** | Automatycznie przetłumacz keyword na wybrane języki |
| **Question Keywords** | Pytania w lokalnych językach (co/what/qué/quoi...) |
| **Long-tail Finder** | Rozszerzenia 3-5 słów (locale-specific) |
| **Trend Analysis** | Rising/falling keywords per region |
| **Keyword Grouper** | Automatyczne grupowanie tematyczne |
| **Market Opportunity** | Znajdź słowa łatwe w jednym kraju, trudne w innym |

### UI - Keyword Research (Multi-Locale):

```
┌─────────────────────────────────────────────────────────────────┐
│ Keyword Research                                                │
├─────────────────────────────────────────────────────────────────┤
│ Seed Keyword: [image upscaler________________] [🔍 Research]    │
│                                                                 │
│ Research in: ☑️ 🇵🇱 ☑️ 🇺🇸 ☑️ 🇪🇸 ☐ 🇫🇷 ☐ 🇩🇪  [Select All]       │
│ ☑️ Auto-translate to selected locales                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Results by Locale:                                              │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 🇵🇱 Polish Market                                    [Expand]││
│ │ ├── "powiększanie zdjęć" - Vol: 2.4K, Diff: 34            ││
│ │ ├── "powiększanie zdjęć online" - Vol: 1.8K, Diff: 28     ││
│ │ ├── "powiększanie zdjęć bez utraty jakości" - Vol: 890    ││
│ │ └── + 23 more keywords                                     ││
│ └─────────────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 🇺🇸 US Market                                        [Expand]││
│ │ ├── "image upscaler" - Vol: 8.9K, Diff: 67                ││
│ │ ├── "AI image upscaler" - Vol: 5.4K, Diff: 58             ││
│ │ ├── "upscale image online free" - Vol: 3.2K, Diff: 45     ││
│ │ └── + 31 more keywords                                     ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ 💡 Market Opportunity:                                          │
│ "powiększanie zdjęć ai" has LOW competition in PL but HIGH     │
│ search volume. Consider prioritizing this market!              │
│                                                                 │
│ [📥 Export All] [➕ Add Selected to Tracker]                   │
└─────────────────────────────────────────────────────────────────┘
```

### Auto-Translation Feature:

```typescript
// Automatyczne tłumaczenie keywords na inne języki
// Używamy Claude API (już masz w projekcie) lub Google Translate

interface TranslatedKeyword {
  original: string;
  originalLocale: string;
  translations: {
    localeCode: string;
    translated: string;
    confidence: number;  // 0-1, jak pewne jest tłumaczenie
  }[];
}

async function translateKeyword(
  keyword: string,
  fromLocale: string,
  toLocales: string[]
): Promise<TranslatedKeyword> {
  // Use Claude for context-aware translation
  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',  // Fast & cheap
    messages: [{
      role: 'user',
      content: `Translate the SEO keyword "${keyword}" from ${fromLocale} to these languages: ${toLocales.join(', ')}.
      Return JSON: { "translations": [{ "locale": "xx", "keyword": "translated", "alternatives": ["alt1", "alt2"] }] }
      Consider local search behavior and common phrasings.`
    }]
  });

  // Parse and return translations
}

// Example:
// Input: "image upscaler", from: "en"
// Output:
// - pl: "powiększanie zdjęć", "skalowanie obrazów"
// - es: "ampliar imagen", "aumentar resolución imagen"
// - de: "bild vergrößern", "bildauflösung erhöhen"
```

### Difficulty Score Algorithm (własny - per locale):

```typescript
function calculateDifficulty(
  keyword: string,
  serpResults: SerpResult[],
  locale: SEOLocale
): number {
  let score = 0;

  // Check top 10 results
  for (const result of serpResults.slice(0, 10)) {
    // High authority domains (both global and locale-specific)
    if (isHighAuthorityDomain(result.url, locale)) score += 10;

    // Exact match in title = more competitive
    if (result.title.toLowerCase().includes(keyword.toLowerCase())) score += 5;

    // Long content (assume from snippet length)
    if (result.snippet.length > 200) score += 3;
  }

  // Featured snippet present = harder to rank
  if (serpResults.some(r => r.features.includes('featured_snippet'))) score += 15;

  // Locale-specific adjustments
  // Some markets are more competitive (EN > PL typically)
  const marketMultiplier = getMarketCompetitiveness(locale);
  score = Math.round(score * marketMultiplier);

  return Math.min(100, score);
}

function getMarketCompetitiveness(locale: SEOLocale): number {
  const competitiveness: Record<string, number> = {
    'en': 1.3,   // Most competitive
    'de': 1.1,
    'fr': 1.0,
    'es': 0.95,
    'pl': 0.85,  // Less competitive
    // ... more locales
  };
  return competitiveness[locale.code] || 1.0;
}
```

### Market Opportunity Finder:

```typescript
// Find keywords that are easy in one market but have high volume
interface MarketOpportunity {
  keyword: string;
  bestMarket: {
    locale: SEOLocale;
    difficulty: number;
    volume: number;
    score: number;  // opportunity score
  };
  otherMarkets: {
    locale: SEOLocale;
    difficulty: number;
    volume: number;
  }[];
}

function findMarketOpportunities(
  keywordData: Map<string, Map<string, KeywordMetrics>>
): MarketOpportunity[] {
  // Calculate opportunity score: (volume / difficulty) * localeWeight
  // Return sorted by opportunity score
}
```

---

## Faza 4: Backlink Monitor (Tydzień 4)

### Źródła backlinków (bezpłatne):

1. **Google Search Console** (po integracji) - najdokładniejsze
2. **Własny crawler** - skanowanie known linking domains
3. **Bing Webmaster Tools** - alternatywne źródło
4. **CommonCrawl** - historical data (opcjonalnie)

### Funkcjonalności:

| Feature | Opis |
|---------|------|
| **Backlink Discovery** | Automatyczne znajdowanie nowych linków |
| **Link Monitor** | Sprawdzanie czy linki są aktywne |
| **Anchor Text Analysis** | Rozkład anchor textów |
| **Domain Distribution** | Analiza domen linkujących |
| **Toxic Link Detector** | Identyfikacja spamowych linków |
| **Alerts** | Powiadomienia o nowych/utraconych linkach |

### Lost Link Detection:

```typescript
// Weekly check of all known backlinks
async function checkBacklinkStatus(backlink: Backlink): Promise<'active' | 'lost' | 'broken'> {
  try {
    const response = await fetch(backlink.sourceUrl);
    if (!response.ok) return 'broken';

    const html = await response.text();
    const hasLink = html.includes(backlink.targetUrl) ||
                    html.includes(backlink.targetDomain);

    return hasLink ? 'active' : 'lost';
  } catch {
    return 'broken';
  }
}
```

---

## Faza 5: Site Audit (Tydzień 5)

### Checks:

| Category | Checks |
|----------|--------|
| **Technical** | HTTPS, robots.txt, sitemap.xml, canonical tags |
| **Performance** | Core Web Vitals (LCP, FID, CLS), page speed |
| **On-Page** | Title tags, meta descriptions, H1-H6, alt texts |
| **Content** | Duplicate content, thin pages, keyword density |
| **Mobile** | Mobile-friendliness, viewport, tap targets |
| **Links** | Broken links (internal/external), orphan pages |

### Implementation:

```typescript
// Using Lighthouse CI programmatically
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';

async function auditPage(url: string) {
  const browser = await puppeteer.launch({ headless: true });
  const { lhr } = await lighthouse(url, {
    port: new URL(browser.wsEndpoint()).port,
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  });

  return {
    performance: lhr.categories.performance.score * 100,
    seo: lhr.categories.seo.score * 100,
    accessibility: lhr.categories.accessibility.score * 100,
    bestPractices: lhr.categories['best-practices'].score * 100,
    metrics: {
      lcp: lhr.audits['largest-contentful-paint'].numericValue,
      fid: lhr.audits['max-potential-fid'].numericValue,
      cls: lhr.audits['cumulative-layout-shift'].numericValue,
      ttfb: lhr.audits['server-response-time'].numericValue,
    }
  };
}
```

---

## Faza 6: Competitor Analysis (Tydzień 6)

### Funkcjonalności:

| Feature | Opis |
|---------|------|
| **Add Competitors** | Ręczne dodawanie konkurentów |
| **Auto-discover** | Znajdź konkurentów z SERP dla twoich keywords |
| **Position Comparison** | Porównanie pozycji side-by-side |
| **Gap Analysis** | Keywords gdzie konkurent rankuje, a ty nie |
| **Domain Overview** | Estymowane metryki konkurenta |

### Competitor Discovery:

```typescript
async function discoverCompetitors(trackedKeywords: string[]): Promise<string[]> {
  const competitorDomains = new Map<string, number>();

  for (const keyword of trackedKeywords.slice(0, 20)) {
    const serp = await scrapeSERP(keyword);

    for (const result of serp.results.slice(0, 10)) {
      const domain = new URL(result.url).hostname;
      if (domain !== 'pixelift.pl') {
        competitorDomains.set(domain, (competitorDomains.get(domain) || 0) + 1);
      }
    }
  }

  // Return domains appearing in multiple SERPs
  return [...competitorDomains.entries()]
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([domain]) => domain)
    .slice(0, 10);
}
```

---

## Faza 7: Reports & Automation (Tydzień 7)

### Report Types:

1. **Weekly Overview** - pozycje, zmiany, alerty
2. **Monthly Deep Dive** - trendy, backlinki, audit
3. **Custom Reports** - wybrane metryki i okres

### Email Reports:

```typescript
// Using Resend (already in project)
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendSEOReport(report: SEOReport, recipients: string[]) {
  await resend.emails.send({
    from: 'SEO Reports <seo@pixelift.pl>',
    to: recipients,
    subject: `SEO Report: ${report.name} - ${format(report.periodEnd, 'MMM yyyy')}`,
    react: SEOReportEmailTemplate({ report }),
  });
}
```

---

## Estymacja Kosztów

### Infrastruktura (miesięcznie):

| Item | Koszt | Notatka |
|------|-------|---------|
| **Vercel Pro** | $0 | (zakładam że masz) |
| **Proxy service** | $5-10 | BrightData/Oxylabs rotation |
| **Redis (opcjonalnie)** | $0 | Upstash free tier |
| **Total** | **~$5-10/miesiąc** | |

### Bez proxy (wolniejsze ale darmowe):

- Limit ~100-200 keyword checks/dzień
- Wystarczające dla ~1000 keywords z weekly checks

---

## API Routes

```
POST /api/admin/seo/keywords          # Add keyword(s)
GET  /api/admin/seo/keywords          # List keywords
PUT  /api/admin/seo/keywords/[id]     # Update keyword
DELETE /api/admin/seo/keywords/[id]   # Delete keyword
POST /api/admin/seo/keywords/check    # Manual position check

GET  /api/admin/seo/backlinks         # List backlinks
POST /api/admin/seo/backlinks/discover # Discover new backlinks
POST /api/admin/seo/backlinks/check   # Check backlink status

GET  /api/admin/seo/competitors       # List competitors
POST /api/admin/seo/competitors       # Add competitor
POST /api/admin/seo/competitors/discover # Auto-discover

POST /api/admin/seo/audit             # Run site audit
GET  /api/admin/seo/audit/[id]        # Get audit results
GET  /api/admin/seo/audit/history     # Audit history

GET  /api/admin/seo/reports           # List reports
POST /api/admin/seo/reports/generate  # Generate report
POST /api/admin/seo/reports/[id]/send # Send report via email

# Cron endpoints
POST /api/cron/seo/check-positions    # Daily position check
POST /api/cron/seo/check-backlinks    # Weekly backlink check
POST /api/cron/seo/weekly-report      # Weekly report generation
```

---

## Kolejność Implementacji

### Sprint 1 (Days 1-3): Foundation
- [ ] Prisma schema dla SEO models
- [ ] Migracja bazy danych
- [ ] SERP scraper core
- [ ] Google Suggest integration

### Sprint 2 (Days 4-7): Rank Tracker
- [ ] Keywords CRUD API
- [ ] Position checking logic
- [ ] Keywords table UI
- [ ] Position history chart
- [ ] Add keyword modal

### Sprint 3 (Days 8-10): Keyword Research
- [ ] Keyword discovery API
- [ ] Suggestions from Google
- [ ] Related keywords extraction
- [ ] Difficulty calculation
- [ ] Research UI

### Sprint 4 (Days 11-14): Backlinks
- [ ] Backlink model & API
- [ ] Link checker
- [ ] Backlinks table UI
- [ ] Status monitoring
- [ ] Anchor text analysis

### Sprint 5 (Days 15-17): Site Audit
- [ ] Lighthouse integration
- [ ] Page crawler
- [ ] Issue detection
- [ ] Audit results UI
- [ ] Recommendations

### Sprint 6 (Days 18-20): Competitors
- [ ] Competitor CRUD
- [ ] Auto-discovery
- [ ] Position comparison
- [ ] Gap analysis UI

### Sprint 7 (Days 21-23): Reports & Polish
- [ ] Report generation
- [ ] Email templates
- [ ] Cron jobs setup
- [ ] Dashboard overview
- [ ] Final testing

---

## Następne kroki

1. **Zatwierdzenie planu** - potwierdź że plan jest OK
2. **Prisma schema** - dodanie modeli do bazy (SEOLocale, TrackedKeyword, etc.)
3. **Seed locales** - inicjalizacja 4 aktualnych + przygotowanie na 30
4. **SERP scraper** - implementacja core functionality (multi-locale)
5. **Rank Tracker MVP** - pierwsza działająca funkcjonalność z locale filtering

---

## Kluczowe Cechy Multi-Locale

| Feature | Implementacja |
|---------|---------------|
| **Locale Management** | Model SEOLocale w DB + admin UI do zarządzania |
| **Scalability** | Zaprojektowane dla 30+ języków |
| **Cross-Locale Grouping** | groupId łączy to samo keyword w różnych językach |
| **Smart Scheduling** | Priorytetyzacja locale'ów przy ograniczonym quota |
| **Auto-Translation** | Claude API do tłumaczenia keywords |
| **Market Opportunity** | Analiza gdzie jest najłatwiej rankować |
| **Locale Filters** | Wszędzie w UI: filtrowanie i porównywanie |

---

*Plan stworzony: 2024-12-03*
*Ostatnia aktualizacja: 2024-12-03 (Multi-Locale Support)*
*Autor: Claude Code*
