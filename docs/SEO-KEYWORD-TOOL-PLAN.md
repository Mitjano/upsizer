# SEO Keyword Tool - Plan Wdrożenia

## Cel
Stworzyć zaawansowane narzędzie SEO łączące najlepsze funkcje:
- **VidIQ** - rekomendacje tagów z relevancy score
- **Surfer SEO** - Content Score, NLP analysis, SERP Analyzer
- **Clearscope** - grading system (F do A++), semantic keywords
- **Ahrefs/SEMrush** - keyword research, competitor analysis

---

## Inspiracje i źródła
- [Surfer SEO Review 2025](https://www.baytechconsulting.com/blog/surfer-seo-an-analytical-review-2025) - Content Score 0-100, NLP analysis
- [Clearscope](https://www.clearscope.io/) - IBM Watson NLP, grading F-A++
- [Ahrefs vs SEMrush 2025](https://backlinko.com/ahrefs-vs-semrush) - keyword research best practices
- [Best Keyword Tools 2025](https://www.smamarketing.net/blog/best-keyword-research-tools-2025)

---

## Status: ✅ = Done | 🔄 = In Progress | ⬜ = Todo

---

## FAZA 1: Keyword Research Enhancement
**Priorytet: 🔴 WYSOKI**

### 1.1 Ulepszenie obecnej strony Keyword Research
- [ ] Naprawić bug z parsowaniem odpowiedzi API (jak w rank-tracker)
- [ ] Dodać multi-locale search (wyszukiwanie w wielu krajach jednocześnie)
- [ ] Poprawić UI - bardziej przejrzysty widok wyników
- [ ] Dodać możliwość zapisywania wyników do bazy

### 1.2 Keyword Difficulty Score (jak Ahrefs)
- [ ] Analiza liczby wyników w Google dla frazy
- [ ] Sprawdzenie siły konkurencji (Domain Authority stron w top 10)
- [ ] Obliczenie score 0-100 (łatwość pozycjonowania)
- [ ] Kolorowe oznaczenia: zielony (0-30 łatwe), żółty (31-60 średnie), czerwony (61-100 trudne)
- [ ] Clickstream data estimation (jak Ahrefs - real traffic potential)

### 1.3 Search Volume Estimation
- [ ] Integracja z Google Search Console API (prawdziwe dane)
- [ ] Fallback: szacowanie na podstawie Google Trends
- [ ] Wyświetlanie miesięcznego wolumenu wyszukiwań
- [ ] Traffic potential (nie tylko volume, ale real clicks)

### 1.4 Keyword Clustering (jak SEMrush)
- [ ] Automatyczne grupowanie podobnych słów kluczowych przez AI
- [ ] Wykrywanie synonimów i wariantów (remove background, background remover, delete bg)
- [ ] Wizualizacja klastrów
- [ ] Ochrona przed kanibalizacją (wiele artykułów na to samo słowo)
- [ ] Search Intent detection (informational, transactional, navigational)

### 1.5 Keyword Magic (jak SEMrush Keyword Magic Tool)
- [ ] Z jednego seed keyword generuj tysiące wariantów
- [ ] Filtrowanie po: volume, difficulty, intent, word count
- [ ] Grupowanie w kategorie automatycznie
- [ ] Export do Rank Tracker jednym kliknięciem

---

## FAZA 2: Recommended Tags System (styl VidIQ)
**Priorytet: 🔴 WYSOKI**

### 2.1 Model danych
```prisma
model KeywordTag {
  id              String   @id @default(cuid())
  keyword         String
  locale          String

  // Metryki (cache z API)
  searchVolume    Int?
  difficulty      Int?      // 0-100
  competition     Float?    // 0-1
  cpc             Float?
  trend           String?   // rising, stable, falling

  // NLP & Semantic (jak Clearscope)
  semanticGroup   String?   // grupa semantyczna
  searchIntent    String?   // informational, transactional, navigational, commercial
  entities        String[]  // NLP entities związane z tym słowem

  // Użycie
  usageCount      Int       @default(0)
  lastUsed        DateTime?

  // Kategorie
  category        String?   // product, feature, how-to, comparison

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([keyword, locale])
  @@index([locale])
  @@index([searchVolume])
  @@index([difficulty])
  @@index([semanticGroup])
}
```

### 2.2 API Endpoints
- `POST /api/admin/seo/tags/recommend` - rekomendacje tagów dla tekstu/tytułu
- `POST /api/admin/seo/tags/analyze` - analiza istniejących tagów
- `GET /api/admin/seo/tags/trending` - trending tagi w danej kategorii
- `POST /api/admin/seo/tags/score` - oblicz score dla listy tagów
- `GET /api/admin/seo/tags/semantic` - pobierz semantycznie powiązane tagi

### 2.3 Algorytm rekomendacji (ulepszony)
1. **Input**: tytuł artykułu + opcjonalnie treść
2. **NLP Analysis**: wyciągnij entities i kluczowe frazy (OpenAI lub własny model)
3. **Semantic Expansion**: znajdź semantycznie powiązane słowa (nie tylko Google Suggest)
4. **Intent Detection**: określ search intent dla każdego słowa
5. **Scoring**: oblicz relevancy score (0-100) uwzględniając:
   - Semantic similarity do tytułu
   - Search volume
   - Keyword difficulty (inverse - łatwiejsze = wyższy score)
   - Trend (rising = bonus)
6. **Ranking**: posortuj po score, pokaż top 50
7. **Kategoryzacja**:
   - "Highly Relevant" (80-100)
   - "Related" (60-79)
   - "Trending in Niche" (rosnące frazy)
   - "Low Competition Gems" (łatwe frazy z decent volume)

### 2.4 UI Component - TagRecommender (VidIQ-style)
```
┌─────────────────────────────────────────────────────────────┐
│ 🏷️ Recommended Tags                          Relevancy ▼   │
│                                               [🔍 Search]   │
├─────────────────────────────────────────────────────────────┤
│ 💎 HIGHLY RELEVANT                                          │
│ + remove background  [85.2] 🟢  + photo editing     [78.4] 🟢│
│ + background remover [82.1] 🟡  + image processing  [76.9] 🟡│
│                                                             │
│ 🔗 RELATED                                                  │
│ + transparent bg     [69.5] 🟢  + ai photo editor   [64.2] 🟡│
│ + usuwanie tła       [67.8] 🟢  + edit photos online[61.5] 🔴│
│                                                             │
│ 📈 TRENDING NOW                                             │
│ + ai background      [72.1] ↗️  + remove bg free    [68.9] ↗️│
│                                                             │
│ 💡 LOW COMPETITION GEMS                                     │
│ + background eraser app [58.2] 🟢  + photo bg changer [55.1] 🟢│
│                                                             │
│ [SHOW MORE (184)]                                           │
├─────────────────────────────────────────────────────────────┤
│ Selected: 12/30  │ Score: 847/1000  │ [Copy] [Add to Post]  │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ remove background [85.2] ✕ │ photo editing [78.4] ✕    ││
│ │ background remover [82.1] ✕│ ai tools [68.3] ✕         ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

Legenda: 🟢 Easy (KD 0-30) | 🟡 Medium (KD 31-60) | 🔴 Hard (KD 61+)
         ↗️ Trending up | Score = suma relevancy wybranych tagów
```

---

## FAZA 3: Content Score & Editor (jak Surfer SEO)
**Priorytet: 🔴 WYSOKI**

> Surfer SEO Content Score pokazuje 0.28 korelację z rankingami Google - 3x lepiej niż konkurencja!
> Optymalny target: 70-85 (nie 90-100 - to over-optimization)

### 3.1 Content Score System (0-100)
- [ ] Real-time scoring podczas pisania
- [ ] Analiza top 20-30 rankujących stron dla target keyword
- [ ] Scoring oparty na:
  - Keyword usage (główne słowo, częstotliwość, pozycja)
  - NLP terms (semantyczne słowa z top wyników)
  - Content structure (H1, H2, H3, paragraphs)
  - Word count (porównanie z konkurencją)
  - Image count (czy masz tyle co konkurencja)
  - Internal/external links

### 3.2 NLP Terms Suggestions (jak Clearscope)
- [ ] Analiza top 30 stron przez NLP
- [ ] Ekstrakcja "must-have" słów i fraz
- [ ] Term frequency recommendations
- [ ] Semantic entities (osoby, miejsca, koncepty)
- [ ] Grading system: F, D, C, B, A, A+ (jak Clearscope)

### 3.3 Content Editor z Real-time Feedback
- [ ] Sidebar z sugestiami podczas pisania
- [ ] Checklisty: ✅ "Add word 'transparent' 2-3 more times"
- [ ] Word count target vs current
- [ ] Readability score
- [ ] Heading structure analyzer

### 3.4 SERP Preview
- [ ] Podgląd jak artykuł będzie wyglądał w Google
- [ ] Edytor meta title z licznikiem znaków (max 60)
- [ ] Edytor meta description z licznikiem (max 160)
- [ ] Podgląd rich snippets (FAQ schema, How-to schema)
- [ ] Mobile vs Desktop preview

### 3.5 SERP Analyzer (500+ signals jak Surfer)
- [ ] Analiza top 10-20 wyników dla danego słowa
- [ ] Typ contentu który rankuje (artykuł, produkt, video, lista)
- [ ] Średnia długość artykułów w top 10
- [ ] Wspólne słowa kluczowe w top wynikach
- [ ] Backlink profile comparison
- [ ] Content structure patterns

---

## FAZA 4: Integracja z Blog Editor
**Priorytet: 🟡 ŚREDNI**

### 4.1 Sidebar w edytorze artykułów
- [ ] Panel "SEO Assistant" w prawej kolumnie
- [ ] Auto-suggest tagów na podstawie tytułu (real-time)
- [ ] Analiza treści artykułu
- [ ] Podpowiedzi optymalizacji (meta description, nagłówki H2/H3)

### 4.2 Tag Input Component
- [ ] Autocomplete z bazy tagów
- [ ] Pokazuj score przy każdym tagu
- [ ] Limit tagów (np. max 30)
- [ ] Walidacja duplikatów
- [ ] Drag & drop reordering

### 4.3 SEO Score dla artykułu
- [ ] Ocena 0-100 dla całego artykułu
- [ ] Checklist: tytuł, meta, nagłówki, długość, tagi
- [ ] Sugestie poprawek w czasie rzeczywistym

### 4.4 Internal Linking Suggestions
- [ ] Analiza istniejących artykułów w bazie
- [ ] Sugestie gdzie dodać linki wewnętrzne
- [ ] "Ten artykuł powinien linkować do: X, Y, Z"
- [ ] Wykrywanie orphan pages (strony bez linków)

---

## FAZA 5: Content Ideas Generator (AI-powered)
**Priorytet: 🟡 ŚREDNI**

### 5.1 Generator pomysłów na artykuły
- [ ] Input: główne słowo kluczowe + nisza
- [ ] Output: 10-20 pomysłów na artykuły z tytułami
- [ ] Dla każdego pomysłu: estimated difficulty, search volume
- [ ] Możliwość "Generate outline" dla wybranego tematu

### 5.2 AI Article Outline Generator
- [ ] Wpisujesz słowo kluczowe
- [ ] AI generuje strukturę artykułu (H1, H2, H3)
- [ ] Sugeruje długość, pytania do odpowiedzi
- [ ] Eksport do edytora artykułów

### 5.3 Question-based content
- [ ] Zbieranie pytań z Google (People Also Ask)
- [ ] Grupowanie pytań w tematy
- [ ] Sugestie artykułów typu FAQ/How-to

### 5.4 Competitor Content Gap
- [ ] Analiza artykułów konkurencji
- [ ] Znajdowanie tematów których nie mamy
- [ ] Priorytetyzacja na podstawie potencjału

---

## FAZA 6: Competitor Spy
**Priorytet: 🟡 ŚREDNI**

### 6.1 Competitor Tracking
- [ ] Dodawanie domen konkurentów do śledzenia
- [ ] Automatyczne crawlowanie ich artykułów
- [ ] Wykrywanie nowych publikacji konkurencji

### 6.2 Competitor Keyword Analysis
- [ ] Na jakie słowa rankują konkurenci
- [ ] Porównanie pozycji: my vs konkurent
- [ ] Keyword gap: słowa na które oni rankują a my nie
- [ ] Wspólne słowa kluczowe

### 6.3 Content Comparison
- [ ] Porównanie długości artykułów
- [ ] Analiza struktury (ile H2, H3, obrazków)
- [ ] Frequency publikacji

---

## FAZA 7: Trending & Alerts
**Priorytet: 🟢 NISKI**

### 7.1 Trending Keywords Monitor
- [ ] Śledzenie trendów w niszy (AI, photo editing, image tools)
- [ ] Integracja z Google Trends API
- [ ] Dashboard z hot topics
- [ ] Alerty gdy pojawia się nowy trending temat

### 7.2 Position Tracking Alerts
- [ ] Email gdy pozycja spadnie/wzrośnie o X miejsc
- [ ] Konfiguracja progów alertów
- [ ] Webhook do Slack/Discord
- [ ] Push notifications (opcjonalnie)

---

## FAZA 8: Analytics & Reporting
**Priorytet: 🟢 NISKI**

### 8.1 Keyword Performance Dashboard
- [ ] Które tagi/słowa generują ruch
- [ ] Trendy w czasie (wykresy)
- [ ] Porównanie z konkurencją
- [ ] Top performing articles

### 8.2 Automatyczne raporty
- [ ] Tygodniowy email z top performing keywords
- [ ] Miesięczny raport SEO
- [ ] Sugestie nowych słów do targetowania
- [ ] Export do PDF/CSV

### 8.3 Content Calendar
- [ ] Planowanie publikacji artykułów
- [ ] Przypomnienia o aktualizacji starych artykułów
- [ ] Integracja z Social Media Hub
- [ ] Widok kalendarza miesiąc/tydzień

---

## Architektura Systemu

### Warstwy
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Next.js)                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ SEO Hub     │ │ Blog Editor │ │ TagRecommender Component│ │
│  │ Dashboard   │ │ + Sidebar   │ │ (VidIQ-style)           │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                       API LAYER                              │
│  /api/admin/seo/                                            │
│  ├── keywords/     (CRUD + research)                        │
│  ├── tags/         (recommendations, scoring)               │
│  ├── content/      (Content Score, NLP analysis)            │
│  ├── serp/         (SERP analysis, competitor data)         │
│  └── reports/      (analytics, exports)                     │
├─────────────────────────────────────────────────────────────┤
│                    SERVICES LAYER                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ Google APIs  │ │ OpenAI NLP   │ │ SERP Scraper         │ │
│  │ - Suggest    │ │ - Entities   │ │ - Top 30 analysis    │ │
│  │ - Trends     │ │ - Intent     │ │ - Content extraction │ │
│  │ - Search Con │ │ - Scoring    │ │ - Structure analysis │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    DATABASE (Prisma)                         │
│  KeywordTag │ SEOLocale │ KeywordRank │ ContentScore │ ...  │
└─────────────────────────────────────────────────────────────┘
```

### Kluczowe algorytmy

**1. Relevancy Score (dla tagów)**
```
score = (
  semantic_similarity * 0.35 +
  search_volume_normalized * 0.25 +
  (100 - keyword_difficulty) * 0.20 +
  trend_bonus * 0.10 +
  usage_in_top_results * 0.10
)
```

**2. Content Score (dla artykułów)**
```
score = (
  keyword_optimization * 0.25 +
  nlp_terms_coverage * 0.30 +
  content_structure * 0.15 +
  word_count_match * 0.10 +
  readability * 0.10 +
  links_images * 0.10
)
```

---

## Kolejność implementacji (ZREWIDOWANA)

### Sprint 1: Foundation ✅
**Status: DONE**
1. ✅ Fix Rank Tracker
2. ✅ Fix Social Media Hub
3. ✅ Basic SEO Hub structure

### Sprint 2: Keyword Research Core 🔴 HIGH
**Estymacja: 3-4 dni**
4. [ ] Fix Keyword Research page (bug z API response)
5. [ ] Multi-locale search z UI tabs
6. [ ] Keyword Difficulty Score algorithm
7. [ ] Search Intent detection (AI)
8. [ ] Keyword Magic - ekspansja słów

### Sprint 3: Recommended Tags (VidIQ-style) 🔴 HIGH
**Estymacja: 4-5 dni**
9. [ ] KeywordTag model w Prisma
10. [ ] API endpoints dla tagów
11. [ ] Relevancy score algorithm z NLP
12. [ ] TagRecommender UI component (kategorie, difficulty badges)
13. [ ] Copy tags, search, filtering

### Sprint 4: Content Score System (Surfer-style) 🔴 HIGH
**Estymacja: 5-6 dni**
14. [ ] SERP scraper - analiza top 30 stron
15. [ ] NLP terms extraction (must-have words)
16. [ ] Content Score algorithm (0-100)
17. [ ] Real-time scoring API
18. [ ] Grading system (F do A+)

### Sprint 5: Blog Editor Integration 🟡 MED
**Estymacja: 4-5 dni**
19. [ ] SEO Assistant sidebar component
20. [ ] Content Score widget w edytorze
21. [ ] NLP terms checklist (real-time)
22. [ ] Tag Input component z autocomplete
23. [ ] Internal linking suggestions

### Sprint 6: SERP Preview & Analysis 🟡 MED
**Estymacja: 3-4 dni**
24. [ ] SERP Preview component (desktop/mobile)
25. [ ] Meta title/description editor
26. [ ] Rich snippets preview (FAQ, How-to)
27. [ ] SERP Analyzer - top 10 breakdown

### Sprint 7: AI Content Generator 🟡 MED
**Estymacja: 3-4 dni**
28. [ ] Article ideas generator (AI)
29. [ ] AI Outline generator (H1, H2, H3)
30. [ ] People Also Ask scraper
31. [ ] Export to editor

### Sprint 8: Competitor Spy 🟡 MED
**Estymacja: 4-5 dni**
32. [ ] Competitor tracking system
33. [ ] Keyword gap analysis
34. [ ] Content comparison
35. [ ] New content alerts

### Sprint 9: Trending & Alerts 🟢 LOW
**Estymacja: 2-3 dni**
36. [ ] Google Trends integration
37. [ ] Position alerts (email)
38. [ ] Slack/Discord webhooks

### Sprint 10: Analytics & Calendar 🟢 LOW
**Estymacja: 3-4 dni**
39. [ ] Performance dashboard
40. [ ] Automated reports (PDF/CSV)
41. [ ] Content calendar
42. [ ] Social Media Hub integration

---

## Technologie

- **Google Suggest API** - darmowe podpowiedzi
- **Google Search Console API** - prawdziwe dane o ruchu
- **Google Trends API** - trending topics
- **OpenAI API** - generowanie pomysłów, analiza treści, outline
- **Prisma** - baza danych tagów i cache
- **React Components** - UI jak VidIQ
- **Recharts** - wykresy i wizualizacje
- **React DnD** - drag & drop dla tagów

---

## Przykład użycia (User Flow)

### Flow 1: Pisanie nowego artykułu
1. Admin wchodzi do edytora artykułu
2. Wpisuje tytuł: "Jak usunąć tło ze zdjęcia w 5 sekund"
3. System automatycznie:
   - Analizuje tytuł
   - Pobiera suggestions z Google
   - Oblicza relevancy score
   - Pokazuje "Recommended Tags" w sidebarze
4. Admin klika wybrane tagi (dodają się do artykułu)
5. System pokazuje SEO Score i sugestie poprawek
6. SERP Preview pokazuje jak będzie wyglądać w Google
7. Admin publikuje zoptymalizowany artykuł

### Flow 2: Research przed pisaniem
1. Admin wchodzi do Keyword Research
2. Wpisuje seed keyword: "usuwanie tła"
3. Wybiera lokalizacje: PL, EN, DE
4. System pokazuje:
   - Suggestions z każdego kraju
   - Difficulty score
   - Questions (pytania ludzi)
   - Long-tail warianty
5. Admin wybiera najlepsze frazy
6. Klika "Generate Article Ideas"
7. AI generuje 10 pomysłów na artykuły
8. Admin wybiera temat i generuje outline
9. Eksportuje do edytora i zaczyna pisać

### Flow 3: Monitoring konkurencji
1. Admin dodaje konkurenta: remove.bg
2. System crawluje ich stronę
3. Pokazuje na jakie słowa rankują
4. Porównuje z naszymi pozycjami
5. Znajduje "gap" - słowa na które oni są a my nie
6. Sugeruje artykuły do napisania

---

## Estymacja czasowa (ZREWIDOWANA)

| Sprint | Funkcjonalność | Priorytet | Estymacja |
|--------|----------------|-----------|-----------|
| 2 | Keyword Research Core | 🔴 HIGH | 3-4 dni |
| 3 | Recommended Tags (VidIQ) | 🔴 HIGH | 4-5 dni |
| 4 | Content Score System (Surfer) | 🔴 HIGH | 5-6 dni |
| 5 | Blog Editor Integration | 🟡 MED | 4-5 dni |
| 6 | SERP Preview & Analysis | 🟡 MED | 3-4 dni |
| 7 | AI Content Generator | 🟡 MED | 3-4 dni |
| 8 | Competitor Spy | 🟡 MED | 4-5 dni |
| 9 | Trending & Alerts | 🟢 LOW | 2-3 dni |
| 10 | Analytics & Calendar | 🟢 LOW | 3-4 dni |
| **TOTAL** | | | **~32-40 dni roboczych** |

### MVP (Minimum Viable Product)
Sprinty 2-5 = **~16-20 dni** → działający system z:
- ✅ Keyword Research z difficulty score
- ✅ Recommended Tags jak VidIQ
- ✅ Content Score jak Surfer SEO
- ✅ Integracja z Blog Editor

---

## Metryki sukcesu

### Krótkoterminowe (1 miesiąc)
- [ ] Content Score dostępny dla 100% nowych artykułów
- [ ] Średni Content Score > 70 (target: 70-85)
- [ ] 50+ tagów dodanych przez system rekomendacji
- [ ] Czas research'u słów kluczowych zmniejszony o 50%

### Średnioterminowe (3 miesiące)
- [ ] Wzrost organic traffic o 20%
- [ ] 30+ artykułów zoptymalizowanych przez Content Score
- [ ] Średnia pozycja śledzonych słów kluczowych < 20

### Długoterminowe (6 miesięcy)
- [ ] 50% artykułów z Content Score > 75
- [ ] Wzrost organic traffic o 50%
- [ ] Top 10 dla 20+ kluczowych fraz
- [ ] Automatyczne raporty tygodniowe działające

---

## Porównanie z konkurencją

| Funkcja | Surfer ($79/m) | Clearscope ($189/m) | Ahrefs ($99/m) | **Nasze (wbudowane)** |
|---------|----------------|---------------------|----------------|----------------------|
| Content Score | ✅ | ✅ | ❌ | ✅ |
| NLP Terms | ✅ | ✅ (IBM Watson) | ❌ | ✅ (OpenAI) |
| Tag Recommendations | ❌ | ❌ | ❌ | ✅ (VidIQ-style) |
| Keyword Difficulty | ❌ | ❌ | ✅ | ✅ |
| SERP Analyzer | ✅ | ❌ | ✅ | ✅ |
| Blog Editor Integration | Plugin | Plugin | ❌ | ✅ Native |
| Multi-locale | ✅ | ❌ | ✅ | ✅ |
| AI Outline | ✅ | ❌ | ❌ | ✅ |

**Przewaga**: Wszystko w jednym miejscu, zintegrowane z CMS, bez dodatkowych kosztów!
