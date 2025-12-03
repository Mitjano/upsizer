# SEO Hub - Lista zadań do dokończenia

**Data utworzenia:** 2025-12-03
**Status:** W trakcie implementacji

---

## ✅ Zaimplementowane (Fazy 1-5)

### Faza 1: Fundament
- [x] Prisma schema dla SEO models (SEOLocale, TrackedKeyword, KeywordPositionHistory, Backlink, SiteAuditResult, SEOCompetitor, SEOReport)
- [x] Migracja bazy danych
- [x] SERP scraper (basic) - `lib/seo/serp-scraper.ts`
- [x] Google Suggest integration - `lib/seo/google-suggest.ts`
- [x] Locales configuration (30 języków) - `lib/seo/locales.ts`

### Faza 2: Rank Tracker
- [x] Keywords CRUD API - `app/api/admin/seo/keywords/route.ts`
- [x] Position checking logic - `app/api/admin/seo/keywords/check/route.ts`
- [x] Keywords table UI z sparklines
- [x] Position history
- [x] Add keyword modal (multi-locale)
- [x] Locale filtering

### Faza 3: Keyword Research
- [x] Keyword discovery API - `app/api/admin/seo/research/route.ts`
- [x] Google Autocomplete suggestions
- [x] Question keywords (co, jak, dlaczego...)
- [x] Long-tail variations
- [x] Research UI

### Faza 4: Backlinks
- [x] Backlink model & API - `app/api/admin/seo/backlinks/route.ts`
- [x] Link status checker - `app/api/admin/seo/backlinks/check/route.ts`
- [x] Backlinks table UI
- [x] Status monitoring (active/lost/broken)
- [x] Anchor text display

### Faza 5: Site Audit (Podstawowy)
- [x] Simple audit (bez Lighthouse) - `app/api/admin/seo/site-audit/route.ts`
- [x] HTML checks (meta tags, title, h1, viewport, canonical, OG)
- [x] Performance checks (load time, HTML size)
- [x] Accessibility checks (alt texts)
- [x] Issue severity (critical/warning/info)
- [x] Audit results UI

### Dashboard
- [x] SEO Overview page - `app/[locale]/admin/seo/page.tsx`
- [x] Stats cards (keywords, avg position, backlinks, audit score)
- [x] Position distribution chart
- [x] Recent changes summary
- [x] Locale stats

---

## 🔲 Do zrobienia (Fazy 6-7)

### Faza 6: Competitor Analysis

**API:**
- [ ] `POST /api/admin/seo/competitors` - Add competitor
- [ ] `GET /api/admin/seo/competitors` - List competitors
- [ ] `DELETE /api/admin/seo/competitors/[id]` - Remove competitor
- [ ] `POST /api/admin/seo/competitors/discover` - Auto-discover from SERP
- [ ] `POST /api/admin/seo/competitors/check` - Check competitor positions

**Logic:**
```typescript
// Auto-discover competitors from SERP results
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

  // Return domains appearing in 3+ SERPs
  return [...competitorDomains.entries()]
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([domain]) => domain)
    .slice(0, 10);
}
```

**UI:** `app/[locale]/admin/seo/competitors/page.tsx`
- [ ] Competitors list table
- [ ] Add competitor modal
- [ ] Auto-discover button
- [ ] Position comparison view (our position vs competitor)
- [ ] Gap analysis (keywords they rank for, we don't)

### Faza 7: Reports & Automation

**API:**
- [ ] `GET /api/admin/seo/reports` - List reports
- [ ] `POST /api/admin/seo/reports/generate` - Generate report
- [ ] `GET /api/admin/seo/reports/[id]` - Get report details
- [ ] `POST /api/admin/seo/reports/[id]/send` - Send report via email

**Report Types:**
- [ ] Weekly Overview - pozycje, zmiany, nowe/utracone keywords
- [ ] Monthly Deep Dive - trendy, backlinki, audit summary
- [ ] Custom Report - wybrane metryki i okres

**Email Templates:**
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

**UI:** `app/[locale]/admin/seo/reports/page.tsx`
- [ ] Reports list
- [ ] Generate report button
- [ ] Report preview
- [ ] Send via email button
- [ ] PDF export

### Cron Jobs

**Endpoints:**
- [ ] `POST /api/cron/seo/check-positions` - Daily position check (high priority keywords)
- [ ] `POST /api/cron/seo/check-backlinks` - Weekly backlink status check
- [ ] `POST /api/cron/seo/weekly-report` - Weekly report generation

**Vercel Cron Configuration** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/seo/check-positions",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/seo/check-backlinks",
      "schedule": "0 7 * * 0"
    },
    {
      "path": "/api/cron/seo/weekly-report",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

---

## 💡 Przyszłe rozszerzenia (opcjonalne)

### Google Search Console Integration
- Import backlinków z GSC
- Real search performance data
- Top queries import

### Google Analytics 4 Integration
- Organic traffic stats
- Conversion tracking
- User behavior metrics

### AI Content Generator
- Generowanie artykułów SEO
- Outline generation
- Auto-publikacja

### Content Calendar
- Planowanie treści
- Scheduling system
- Auto-publish

### Social Media Hub (nowy moduł)
**Pełny plan:** `docs/SOCIAL-MEDIA-HUB-PLAN.md`

- Multi-platform posting (Facebook, Instagram, Twitter, LinkedIn)
- Content scheduling & calendar
- AI caption generation
- Analytics dashboard
- Auto-posting (blog → social)
- Engagement tracking

---

## 📁 Pliki referencyjne

- `docs/SEO-HUB-IMPLEMENTATION-PLAN.md` - Szczegółowy plan implementacji SEO
- `docs/SEO-MARKETING-HUB-PLAN.md` - Szerszy plan marketingowy
- `docs/SOCIAL-MEDIA-HUB-PLAN.md` - Plan Social Media Hub
- `prisma/schema.prisma` - Modele bazy danych
- `lib/seo/` - Biblioteki SEO

---

**Commit:** c867863 feat: Add comprehensive SEO Hub with multi-locale support
