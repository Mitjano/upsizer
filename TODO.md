# Pixelift - Lista Zadań (Audyt 16.12.2024)

## Status Projektu

| Metryka | Wartość |
|---------|---------|
| Pliki źródłowe | 479 |
| Pliki testowe | 8 |
| Pokrycie testami | ~1.7% |
| Zależności | 700+ |
| Podatności | 0 ✅ |
| Języki UI | 4 (en, pl, es, fr) |

---

## 🔴 KRYTYCZNE (Do natychmiastowej naprawy)

### Bezpieczeństwo

- [x] **Naprawić podatności Next.js** (HIGH severity) ✅ *Zrobione 17.12.2024*
  - Source Code Exposure (GHSA-w37m-7fhw-fmv9)
  - DoS with Server Components (GHSA-mwv6-3258-q52c)

- [x] **Zamienić bibliotekę xlsx na bezpieczną alternatywę** ✅ *Zrobione 17.12.2024*
  - Problem: Prototype Pollution + ReDoS (brak poprawki)
  - Rozwiązanie: Migracja do `exceljs`
  - Plik zmodyfikowany: `app/api/admin/users/export/route.ts`

### Brakujące Zależności

- [x] **Zainstalować brakujące pakiety** ✅ *Zrobione 17.12.2024*
  - `@fal-ai/client@1.7.2` - zainstalowane

### Build & TypeScript

- [x] **Wyczyścić stary cache buildu** ✅ *Zrobione 17.12.2024*

- [x] **Usunąć lub utworzyć brakujące ścieżki** ✅ *Zrobione 17.12.2024*
  - `app/api/generate-packshot/` - usunięty pusty katalog (redirect w next.config.ts)
  - `app/api/user/welcome/` - utworzony endpoint do wysyłania welcome email

---

## 🟠 ŚREDNIE (Przed następnym deployem)

### ESLint & Jakość Kodu

- [x] **Naprawić LoginPrompt.tsx** - użyć `<Link>` zamiast `<a>` ✅ *Zrobione 17.12.2024*
  - Plik: `components/uploader/LoginPrompt.tsx`

- [x] **Zamienić `<img>` na `<Image>`** ✅ *Zrobione 17.12.2024*
  - [x] `components/Header.tsx` ✅ *Zrobione 17.12.2024*
  - ~~`components/admin/AdminUserRow.tsx`~~ - plik nie istnieje
  - ~~`components/admin/AdminBlogRow.tsx`~~ - plik nie istnieje
  - ~~`components/SwaggerUI.tsx`~~ - plik nie istnieje

- [x] **Dodać brakującą regułę ESLint** ✅ *Zrobione 17.12.2024*
  - Plik: `.eslintrc.json`
  - Dodano: `@typescript-eslint/no-explicit-any` (warn)
  - Dodano: `@typescript-eslint/no-unused-vars` (warn)
  - Dodano: `prefer-const` (warn)
  - Rozszerzono: `plugin:@typescript-eslint/recommended`

### Konfiguracja

- [x] **Skonfigurować środowisko deweloperskie** ✅ *Zrobione 17.12.2024*
  - Zaktualizowano `.env.example` o brakujące zmienne
  - Dodano: Firebase Admin SDK, Google OAuth, OpenAI, GoAPI
  - Poprawiono nazewnictwo (`NEXT_PUBLIC_APP_URL`)

### i18n - Tłumaczenia

- [x] **Dodać brakujące tłumaczenia portraitRelight i watermarkRemover** ✅ *Zrobione 17.12.2024*
  - Dodano do `messages/es/common.json`
  - Dodano do `messages/fr/common.json`
  - Naprawiono błędy MISSING_MESSAGE podczas buildu

---

## 🟡 NISKIE (Ulepszenia)

### Testy (Zwiększyć pokrycie z 1.7% do 30%)

- [ ] **Testy API endpoints (priorytet)**
  - [ ] `/api/auth/` - flow autentykacji
  - [ ] `/api/upscale/` - upscaling obrazów
  - [ ] `/api/stripe/` - webhook płatności
  - [ ] `/api/user/` - zarządzanie użytkownikami

- [ ] **Testy komponentów**
  - [ ] `ImageUploader` - główny komponent uploadu
  - [ ] `Dashboard` - panel użytkownika
  - [ ] `CopyLinkButton` - udostępnianie

- [ ] **Testy integracyjne**
  - [ ] Flow rejestracji użytkownika
  - [ ] Flow płatności (Stripe)
  - [ ] Flow przetwarzania obrazu

### Dokumentacja

- [ ] **Zaktualizować README.md** o informacje z audytu
- [ ] **Dodać CONTRIBUTING.md** z wytycznymi dla deweloperów
- [ ] **Dodać CHANGELOG.md** do śledzenia zmian

---

## 📋 FUNKCJONALNOŚCI (Backlog)

### Nowe Narzędzia AI (wyrównanie menu)

#### Kategoria: NARZĘDZIA (potrzeba 2 nowych)

- [x] **Format Converter** (DARMOWE - Sharp) ✅ *Już zaimplementowane*
  - Konwersja: HEIC, AVIF, WebP ↔ PNG, JPG, GIF

- [ ] **Image to Vector (SVG)**
  - Model: Vectorizer.AI API
  - Koszt: ~$0.01/obraz

#### Kategoria: ULEPSZANIE

- [x] **Portrait Relight** ✅ *Już zaimplementowane*
  - Model: fal.ai/ic-light-v2 (klucz już skonfigurowany)
  - Koszt: ~$0.05/obraz

- [ ] **Face Enhancer Pro**
  - Model: Replicate codeformer
  - Koszt: ~$0.01/obraz

#### Kategoria: USUWANIE

- [x] **Watermark Remover** ✅ *Już zaimplementowane*
  - Model: Replicate LaMA inpainting
  - Koszt: ~$0.02/obraz

- [ ] **Shadow Remover**
  - Model: fal.ai shadow-removal
  - Koszt: ~$0.02/obraz

#### Kategoria: GENEROWANIE

- [ ] **Sketch to Image**
  - Model: Replicate flux-kontext
  - Koszt: ~$0.04/obraz

- [ ] **Image to 3D**
  - Model: Replicate meshy/triposr
  - Koszt: ~$0.10/model

#### Kategoria: PRZEKSZTAŁCANIE

- [ ] **Face Swap**
  - Model: Replicate face-swap
  - Koszt: ~$0.05/obraz

- [ ] **Age Transform**
  - Model: Replicate age-transformation
  - Koszt: ~$0.03/obraz

### Rozszerzenie Copy Link

Narzędzia wymagające integracji z CopyLinkButton:

- [ ] ImageExpander (`/api/expand-image`)
- [ ] PackshotGenerator (`/api/generate-packshot`)
- [ ] ObjectRemover (`/api/object-removal`)
- [ ] ImageColorizer (`/api/colorize`)
- [ ] ImageDenoiser (`/api/denoise`)
- [ ] StyleTransfer (`/api/style-transfer`)
- [ ] ImageReimagine (`/api/reimagine`)
- [ ] InpaintingPro (`/api/inpainting`)
- [ ] StructureControl (`/api/structure-control`)

### Social Share

- [ ] **Social Share Buttons** na stronie `/share/[id]`
  - Facebook Share
  - Twitter/X Share
  - Pinterest Pin
  - WhatsApp Share
  - LinkedIn Share

### UX Improvements

- [ ] Batch processing - przetwarzanie wielu obrazów
- [ ] History page - historia przetworzonych obrazów
- [ ] Before/After comparison na share page
- [ ] QR code do share link
- [ ] Dark mode improvements

---

## 🛡️ BEZPIECZEŃSTWO (Ciągłe)

- [x] Regularny `npm audit` - **0 vulnerabilities** ✅
- [ ] Rotacja kluczy API co 90 dni
- [ ] Przegląd logów Sentry co tydzień
- [ ] Backup bazy danych (automatyczny, dzienny)
- [ ] Penetration testing przed major release

---

## 📊 MONITORING (Do wdrożenia)

- [ ] **Web Vitals Dashboard**
  - LCP, FID, CLS tracking
  - Integracja z Google Analytics

- [ ] **Alerting**
  - Error rate > 1%
  - Response time > 3s
  - Failed payments

- [ ] **Business Metrics**
  - Daily Active Users
  - Conversion rate
  - Credit usage patterns

---

## 🚀 DEPLOYMENT CHECKLIST

Przed każdym deployem sprawdzić:

```bash
# 1. Testy
npm run test:run

# 2. Linting
npm run lint

# 3. Type check
npx tsc --noEmit

# 4. Security audit
npm audit

# 5. Build
npm run build

# 6. Database migrations
npx prisma migrate deploy
```

---

## 📝 NOTATKI TECHNICZNE

### Wzorzec dodawania nowego narzędzia AI

1. `app/api/[tool-name]/route.ts` - API endpoint
2. `components/[ToolName].tsx` - Komponent React
3. `app/[locale]/tools/[tool-name]/page.tsx` - Strona
4. `components/Header.tsx` - Dodać do menu
5. `messages/[locale]/common.json` - Tłumaczenia (4 języki)
6. `lib/credits-config.ts` - Koszt kredytów

### Kluczowe pliki

| Plik | Opis |
|------|------|
| `lib/prisma.ts` | Klient bazy danych |
| `lib/redis.ts` | Cache i kolejki |
| `lib/stripe.ts` | Integracja płatności |
| `lib/auth.ts` | Autentykacja |
| `middleware.ts` | CSRF, locale, admin |

---

## 📅 HISTORIA AUDYTÓW

| Data | Wersja | Uwagi |
|------|--------|-------|
| 2024-11-23 | 1.0 | Pierwszy pełny audyt |
| 2024-12-16 | 1.1 | Audyt przed zamknięciem fazy dev |
| 2024-12-17 | 1.2 | Poprawki bezpieczeństwa (xlsx→exceljs, Next.js audit fix, i18n) |

---

## 🔗 LINKI

- **Repo:** https://github.com/Mitjano/upsizer
- **Produkcja:** https://pixelift.pl
- **Dokumentacja API:** https://pixelift.pl/api-docs
- **Sentry:** https://sentry.io/organizations/pixelift

---

*Ostatnia aktualizacja: 17.12.2024*
