# Plan Wdrożenia: SEO & Content Marketing Hub

**Data utworzenia:** 2025-12-03
**Status:** Do wdrożenia
**Inspiracja:** [Outrank.so](https://www.outrank.so)

---

## 📊 Obecny Stan

Panel SEO (`/admin/seo`) obecnie zawiera:
- Mock data (hardcoded statystyki)
- 4 zakładki: Overview, Keywords, Pages, Backlinks
- Brak integracji z zewnętrznymi API
- Blog przechowywany w plikach JSON (`data/blog/[locale]/`)

---

## 🎯 Cel Wdrożenia

Przekształcenie panelu SEO w pełnoprawne centrum zarządzania SEO i content marketingiem, inspirowane funkcjami Outrank.so:

### Funkcje Outrank.so do wdrożenia:
1. **30 artykułów miesięcznie** - generowanie AI i auto-publikacja
2. **Auto Keyword Research** - automatyczne badanie słów kluczowych
3. **High DR Backlinks** - wymiana/budowanie backlinków
4. **YouTube videos** - integracja filmów w artykułach
5. **Unlimited AI Rewrites** - przepisywanie treści AI
6. **Integracje** - WordPress, Webflow, Shopify, Framer
7. **AI Images** - generowanie obrazków do artykułów (już mamy!)
8. **150+ języków** - wielojęzyczność (już mamy EN, PL, ES, FR)

---

## 📋 FAZY WDROŻENIA

### **FAZA 1: Infrastruktura Bazy Danych** (Fundamenty)

#### 1.1 Migracja bloga z JSON do bazy danych
```prisma
model BlogPost {
  id            String   @id @default(cuid())
  slug          String   @unique
  locale        String   // en, pl, es, fr
  title         String
  content       String   @db.Text
  excerpt       String?
  featuredImage String?
  author        String
  authorEmail   String?
  categories    String[] // JSON array
  tags          String[] // JSON array
  status        String   @default("draft") // draft, published, scheduled
  scheduledAt   DateTime?
  publishedAt   DateTime?
  viewCount     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // SEO fields
  metaTitle       String?
  metaDescription String?
  canonicalUrl    String?

  // AI generation tracking
  isAIGenerated   Boolean @default(false)
  aiModel         String? // claude-3, gpt-4, etc.
  aiPrompt        String? @db.Text

  @@index([locale, status])
  @@index([slug, locale])
}
```

#### 1.2 Model Keyword
```prisma
model Keyword {
  id            String   @id @default(cuid())
  keyword       String
  locale        String
  position      Int?     // Current SERP position
  previousPos   Int?     // Previous position for trend
  searchVolume  Int?
  difficulty    Int?     // 0-100
  cpc           Float?   // Cost per click
  url           String?  // Ranking URL
  lastChecked   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  history       KeywordHistory[]

  @@unique([keyword, locale])
  @@index([locale])
}

model KeywordHistory {
  id        String   @id @default(cuid())
  keywordId String
  keyword   Keyword  @relation(fields: [keywordId], references: [id], onDelete: Cascade)
  position  Int
  checkedAt DateTime @default(now())

  @@index([keywordId, checkedAt])
}
```

#### 1.3 Model ContentPlan
```prisma
model ContentPlan {
  id            String   @id @default(cuid())
  title         String
  targetKeyword String
  locale        String
  status        String   @default("idea") // idea, planned, in_progress, review, published
  scheduledDate DateTime?
  assignedTo    String?
  notes         String?  @db.Text
  blogPostId    String?  // Link to generated post
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([status, locale])
}
```

#### 1.4 Model Backlink
```prisma
model Backlink {
  id            String   @id @default(cuid())
  sourceUrl     String   // External URL linking to us
  targetUrl     String   // Our URL being linked
  anchorText    String?
  domainRating  Int?     // DR 0-100
  isDoFollow    Boolean  @default(true)
  isActive      Boolean  @default(true)
  firstSeen     DateTime @default(now())
  lastChecked   DateTime?
  source        String?  // gsc, manual, ahrefs

  @@index([targetUrl])
  @@index([isActive])
}
```

#### 1.5 Model AIArticle (do kolejki generowania)
```prisma
model AIArticle {
  id            String   @id @default(cuid())
  title         String
  targetKeyword String
  locale        String
  outline       String?  @db.Text // JSON structure
  status        String   @default("pending") // pending, generating, review, approved, published
  generatedContent String? @db.Text
  aiModel       String?
  tokensUsed    Int?
  cost          Float?
  blogPostId    String?  // Created blog post
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([status])
}
```

---

### **FAZA 2: Integracje Zewnętrzne**

#### 2.1 Google Search Console API
- **Endpoint:** `/api/admin/seo/gsc`
- **Funkcje:**
  - Pobieranie danych o kliknięciach, wyświetleniach, CTR, pozycjach
  - Top queries (słowa kluczowe)
  - Top pages
  - Backlinks z GSC
- **Wymagane:** Google Cloud Project + OAuth credentials

**Konfiguracja .env:**
```env
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_SEARCH_CONSOLE_SITE=https://pixelift.pl
```

#### 2.2 Google Analytics 4 API
- **Endpoint:** `/api/admin/seo/ga4`
- **Funkcje:**
  - Organic traffic
  - Top landing pages
  - Conversions from organic
  - User behavior metrics
- **Wymagane:** GA4 Property ID + Service Account

**Konfiguracja .env:**
```env
GA4_PROPERTY_ID=xxx
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx
GOOGLE_SERVICE_ACCOUNT_KEY=xxx
```

#### 2.3 OpenAI/Anthropic API (do generowania treści)
- **Endpoint:** `/api/admin/seo/generate-article`
- **Funkcje:**
  - Generowanie artykułów SEO
  - Keyword research suggestions
  - Content rewriting
  - Meta descriptions generation

**Konfiguracja .env (już mamy):**
```env
ANTHROPIC_API_KEY=xxx
OPENAI_API_KEY=xxx
```

#### 2.4 DataForSEO API (opcjonalne - płatne)
- **Funkcje:**
  - Keyword research z rzeczywistymi danymi
  - SERP analysis
  - Competitor analysis
  - Backlink checking

**Konfiguracja .env:**
```env
DATAFORSEO_LOGIN=xxx
DATAFORSEO_PASSWORD=xxx
```

---

### **FAZA 3: AI Content Generator**

#### 3.1 Moduł generowania artykułów SEO
**Plik:** `lib/ai-content-generator.ts`

```typescript
interface ArticleGenerationOptions {
  targetKeyword: string;
  locale: string;
  tone: 'professional' | 'casual' | 'educational';
  length: 'short' | 'medium' | 'long'; // 500, 1000, 2000 words
  includeImages: boolean;
  includeFAQ: boolean;
  competitors?: string[]; // URLs to analyze
}

interface GeneratedArticle {
  title: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  suggestedTags: string[];
  suggestedCategories: string[];
  faq?: { question: string; answer: string }[];
  imagePrompts?: string[];
}
```

**Workflow:**
1. User podaje keyword + opcje
2. AI generuje outline
3. User zatwierdza/edytuje outline
4. AI generuje pełny artykuł
5. Auto-generowanie obrazków (jeśli włączone)
6. Review & publish

#### 3.2 Auto Keyword Research
```typescript
interface KeywordSuggestion {
  keyword: string;
  estimatedVolume: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  relevance: number; // 0-100
  suggestedTitle: string;
}

async function suggestKeywords(
  niche: string,
  locale: string,
  count: number = 10
): Promise<KeywordSuggestion[]>
```

#### 3.3 AI Rewriter
```typescript
async function rewriteContent(
  content: string,
  style: 'improve' | 'simplify' | 'expand' | 'shorten',
  targetKeyword?: string
): Promise<string>
```

#### 3.4 Auto-generowanie obrazków
- Wykorzystanie istniejącego AI Image generation
- Auto-prompt z kontekstu artykułu
- Featured image + inline images

---

### **FAZA 4: Content Calendar & Scheduling**

#### 4.1 Kalendarz treści UI
**Plik:** `app/[locale]/admin/seo/calendar/page.tsx`

- Widok miesięczny/tygodniowy
- Drag & drop planowanie
- Status kolorami (idea, planned, in_progress, published)
- Quick actions (edit, generate, publish)

#### 4.2 Auto-scheduling
```typescript
interface SchedulingOptions {
  postsPerWeek: number;
  preferredDays: number[]; // 0-6 (Sunday-Saturday)
  preferredTime: string; // "09:00"
  locales: string[];
}
```

#### 4.3 Bulk article generation
- Generowanie wielu artykułów naraz
- Queue system z progress tracking
- Background processing (możliwe że potrzebny będzie worker)

---

### **FAZA 5: Keyword Research Module**

#### 5.1 Keyword tracking dashboard
**Plik:** `app/[locale]/admin/seo/keywords/page.tsx`

- Lista śledzonych keywords
- Pozycje + trendy (up/down/stable)
- Grouped by locale
- Add/remove keywords
- Import z GSC

#### 5.2 Keyword suggestions
- AI-powered suggestions based on niche
- Related keywords
- Long-tail variations
- Questions (People Also Ask)

#### 5.3 SERP analysis
- Top 10 competitors dla keyword
- Content gap analysis
- Suggested improvements

---

### **FAZA 6: Backlink Management**

#### 6.1 Backlink monitoring dashboard
**Plik:** `app/[locale]/admin/seo/backlinks/page.tsx`

- Lista wszystkich backlinków
- New/Lost tracking
- Domain Rating
- DoFollow/NoFollow filter

#### 6.2 Import z GSC
- Automatyczny import backlinków z Google Search Console
- Scheduled sync (daily/weekly)

#### 6.3 Link building opportunities
- Guest post finder (AI suggestions)
- Competitor backlink analysis
- Outreach templates

---

### **FAZA 7: Nowy UI Panelu SEO**

#### Nowa struktura plików:
```
app/[locale]/admin/seo/
├── page.tsx                    # Dashboard overview
├── content/
│   ├── page.tsx               # AI Content Generator
│   └── [id]/
│       └── page.tsx           # Edit generated article
├── keywords/
│   └── page.tsx               # Keyword research & tracking
├── backlinks/
│   └── page.tsx               # Backlink management
├── calendar/
│   └── page.tsx               # Content calendar
├── reports/
│   └── page.tsx               # SEO reports & analytics
└── settings/
    └── page.tsx               # API connections, preferences
```

#### Nowa nawigacja (tabs):
1. **Overview** - Dashboard z real data (GSC + GA4)
2. **Content Generator** - AI article generation
3. **Keywords** - Tracking & research
4. **Backlinks** - Monitoring & opportunities
5. **Calendar** - Content planning
6. **Reports** - Detailed analytics
7. **Settings** - API connections

---

### **FAZA 8: Automatyzacja**

#### 8.1 Cron jobs
**Plik:** `app/api/cron/seo/route.ts`

```typescript
// Daily tasks
- Sync keywords positions from GSC
- Check backlinks status
- Generate scheduled articles
- Publish scheduled posts

// Weekly tasks
- Send SEO report email
- Keyword suggestions refresh
- Competitor analysis update
```

#### 8.2 Alerty
- Position drop alert (> 5 positions)
- New backlink notification
- Lost backlink alert
- Traffic anomaly detection

---

## 🎯 Priorytetyzacja (MVP First)

### Sprint 1 (Tydzień 1-2): Real Data
- [ ] Integracja Google Search Console API
- [ ] Integracja Google Analytics 4 API
- [ ] Aktualizacja dashboardu SEO z real data
- [ ] Basic keyword tracking z GSC

### Sprint 2 (Tydzień 3-4): AI Content
- [ ] Model BlogPost w Prisma (migracja z JSON)
- [ ] AI Article Generator (basic)
- [ ] Outline generation
- [ ] Full article generation

### Sprint 3 (Tydzień 5-6): Planning
- [ ] Content Calendar UI
- [ ] Scheduling system
- [ ] Auto-publish

### Sprint 4 (Tydzień 7-8): Advanced
- [ ] Keyword research module
- [ ] Backlink monitoring
- [ ] Bulk generation

### Sprint 5 (Tydzień 9-10): Automation
- [ ] Cron jobs setup
- [ ] Email reports
- [ ] Alerts system

---

## 💰 Szacowane Koszty Zewnętrzne

| Usługa | Koszt | Notatka |
|--------|-------|---------|
| Google Search Console API | **Darmowe** | Wymaga weryfikacji domeny |
| Google Analytics 4 API | **Darmowe** | Wymaga GA4 setup |
| Claude API (Anthropic) | ~$0.015/1K tokens | ~$0.30-1.00 za artykuł |
| OpenAI GPT-4 | ~$0.03/1K tokens | ~$0.50-2.00 za artykuł |
| DataForSEO (opcja) | od $50/mo | Real keyword data |
| Moz/Ahrefs API (opcja) | od $99/mo | Premium backlink data |

**Szacowany koszt na 30 artykułów/miesiąc:** $15-60 (tylko AI)

---

## 🔧 Wymagane Zmienne Środowiskowe

Dodać do `.env`:

```env
# Google APIs
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_SEARCH_CONSOLE_SITE=https://pixelift.pl
GA4_PROPERTY_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_KEY=

# DataForSEO (opcjonalne)
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=

# Content Generation Settings
AI_CONTENT_MODEL=claude-3-sonnet # lub gpt-4
AI_CONTENT_MAX_TOKENS=4000
AI_CONTENT_DEFAULT_LOCALE=pl
```

---

## 📁 Pliki do Utworzenia

```
lib/
├── seo/
│   ├── google-search-console.ts
│   ├── google-analytics.ts
│   ├── ai-content-generator.ts
│   ├── keyword-research.ts
│   └── backlink-analyzer.ts

app/api/admin/seo/
├── gsc/
│   └── route.ts
├── ga4/
│   └── route.ts
├── keywords/
│   └── route.ts
├── backlinks/
│   └── route.ts
├── generate-article/
│   └── route.ts
├── generate-outline/
│   └── route.ts
└── schedule/
    └── route.ts

components/admin/seo/
├── SEODashboard.tsx
├── ContentGenerator.tsx
├── KeywordTracker.tsx
├── BacklinkMonitor.tsx
├── ContentCalendar.tsx
└── SEOReports.tsx
```

---

## ✅ Checklist przed rozpoczęciem

- [ ] Utwórz Google Cloud Project
- [ ] Włącz Search Console API
- [ ] Włącz Analytics Data API
- [ ] Zweryfikuj domenę w GSC
- [ ] Utwórz Service Account dla GA4
- [ ] Przygotuj klucze API

---

## 📝 Notatki

- Obecny blog jest w plikach JSON - migracja do DB da więcej możliwości
- Już mamy AI Image - można wykorzystać do auto-generowania obrazków
- Już mamy 4 języki - content generator powinien wspierać wszystkie
- Rozważyć czy backlink exchange nie wymaga osobnego modułu/strony

---

**Ostatnia aktualizacja:** 2025-12-03
