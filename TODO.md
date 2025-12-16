# Pixelift - Lista Zadań (Audyt 16.12.2024)

## Status Projektu

| Metryka | Wartość |
|---------|---------|
| Pliki źródłowe | 479 |
| Pliki testowe | 8 |
| Pokrycie testami | ~1.7% |
| Zależności | 700+ |
| Podatności | 2 HIGH |
| Języki UI | 4 (en, pl, es, fr) |

---

## 🔴 KRYTYCZNE (Do natychmiastowej naprawy)

### Bezpieczeństwo

- [ ] **Naprawić podatności Next.js** (HIGH severity)
  ```bash
  npm audit fix
  ```
  - Source Code Exposure (GHSA-w37m-7fhw-fmv9)
  - DoS with Server Components (GHSA-mwv6-3258-q52c)

- [ ] **Zamienić bibliotekę xlsx na bezpieczną alternatywę**
  - Problem: Prototype Pollution + ReDoS (brak poprawki)
  - Rozwiązanie: Migracja do `exceljs` lub `sheetjs-ce`
  ```bash
  npm uninstall xlsx
  npm install exceljs
  ```
  - Pliki do modyfikacji: sprawdzić użycie xlsx w projekcie

### Brakujące Zależności

- [ ] **Zainstalować brakujące pakiety**
  ```bash
  npm install @fal-ai/client
  npm install --save-dev @types/swagger-ui-react swagger-ui-react
  ```

### Build & TypeScript

- [ ] **Wyczyścić stary cache buildu**
  ```bash
  rm -rf .next
  npm run build
  ```

- [ ] **Usunąć lub utworzyć brakujące ścieżki**
  - `app/[locale]/tools/packshot-generator/` - brak strony (usuń referencje lub utwórz)
  - `app/api/generate-packshot/` - brak endpointu
  - `app/api/user/welcome/` - brak endpointu

---

## 🟠 ŚREDNIE (Przed następnym deployem)

### ESLint & Jakość Kodu

- [ ] **Naprawić LoginPrompt.tsx** - użyć `<Link>` zamiast `<a>`
  - Plik: `components/uploader/LoginPrompt.tsx:35,41`
  - Problem: Używa `<a>` dla wewnętrznych linków

- [ ] **Zamienić `<img>` na `<Image>`** w komponentach:
  - `components/admin/AdminUserRow.tsx`
  - `components/admin/AdminBlogRow.tsx`
  - `components/SwaggerUI.tsx`
  - Inne komponenty zgłoszone przez ESLint

- [ ] **Dodać brakującą regułę ESLint**
  - Plik: `.eslintrc.json`
  - Dodać: `@typescript-eslint/no-explicit-any`

### Konfiguracja

- [ ] **Skonfigurować środowisko deweloperskie**
  - Upewnić się, że `.env.local` zawiera wszystkie wymagane zmienne
  - Zweryfikować `DATABASE_URL` dla lokalnego development

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

- [ ] **Format Converter** (DARMOWE - Sharp)
  - Konwersja: HEIC, AVIF, WebP ↔ PNG, JPG, GIF
  - Biblioteka już zainstalowana

- [ ] **Image to Vector (SVG)**
  - Model: Vectorizer.AI API
  - Koszt: ~$0.01/obraz

#### Kategoria: ULEPSZANIE

- [ ] **Portrait Relight**
  - Model: fal.ai/ic-light-v2 (klucz już skonfigurowany)
  - Koszt: ~$0.05/obraz

- [ ] **Face Enhancer Pro**
  - Model: Replicate codeformer
  - Koszt: ~$0.01/obraz

#### Kategoria: USUWANIE

- [ ] **Watermark Remover**
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

- [ ] Regularny `npm audit` (dodać do CI)
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

---

## 🔗 LINKI

- **Repo:** https://github.com/Mitjano/upsizer
- **Produkcja:** https://pixelift.pl
- **Dokumentacja API:** https://pixelift.pl/api-docs
- **Sentry:** https://sentry.io/organizations/pixelift

---

*Ostatnia aktualizacja: 16.12.2024*
