# Pixelift - Lista Zadań (Aktualizacja 19.12.2024)

## Status Projektu

| Metryka | Wartość |
|---------|---------|
| Pliki źródłowe | 479 |
| Pliki testowe | 23 |
| Pokrycie testami | ~5% |
| Zależności | 700+ |
| Podatności | 0 ✅ |
| Języki UI | 4 (en, pl, es, fr) |
| Główne API | Replicate, Sharp, Photoroom |

---

## 🎯 STRATEGIA: Konkurencja z Adobe Express

### Analiza Porównawcza (18.12.2024)

#### ✅ Narzędzia Pixelift (przewaga nad Adobe)
- AI Image Upscaler (Real-ESRGAN) - Adobe nie ma
- Face Restore (CodeFormer) - Adobe nie ma
- Image Colorize - Adobe nie ma
- Portrait Relight - Adobe nie ma
- Object Removal (LaMA) - Adobe ma podobne
- Background Generator (FLUX) - Adobe ma podstawowe
- Style Transfer - Adobe nie ma
- Reimagine - Adobe nie ma
- Structure Control - Adobe nie ma
- AI Video Generation - Adobe ma ograniczone

#### ❌ Narzędzia Adobe, których brakuje Pixelift
| Narzędzie | Priorytet | API/Rozwiązanie | Koszt |
|-----------|-----------|-----------------|-------|
| Crop Image | 🔴 Wysoki | Sharp (lokalnie) | FREE |
| Resize Image | 🔴 Wysoki | Sharp (lokalnie) | FREE |
| Logo Maker | 🔴 Wysoki | Ideogram 3.0 (Replicate) | ~$0.05/obraz |
| QR Code Generator | 🔴 Wysoki | qrcode lib + Sharp (lokalnie) | FREE |
| Convert to SVG | 🟠 Średni | Vectorizer.AI API | ~$0.20/obraz |
| Collage Maker | 🟠 Średni | Sharp + własna logika | FREE |
| Text Effects | 🟠 Średni | Ideogram 3.0 (Replicate) | ~$0.05/obraz |
| Filters & Effects | 🟡 Niski | Sharp + LUTs | FREE |
| Templates Gallery | 🟡 Niski | Własna implementacja | FREE |

---

## 🔴 PRIORYTET 1: Nowe Narzędzia Podstawowe

### 1.1 Crop Image (Kadrowanie)
- **Rozwiązanie**: Sharp (lokalnie, bez API)
- **Koszt kredytów**: FREE (0 kredytów) - podstawowa edycja
- **Funkcje**:
  - [ ] Swobodne kadrowanie
  - [ ] Predefiniowane proporcje (1:1, 4:3, 16:9, 9:16)
  - [ ] Proporcje social media (Instagram, Facebook, Twitter)
  - [ ] Rule of thirds overlay
- **Pliki do utworzenia**:
  - `app/api/crop-image/route.ts`
  - `components/ImageCropper.tsx`
  - `app/[locale]/tools/crop-image/page.tsx`
- **Konfiguracja credits-config.ts**:
  - ToolType: `crop_image`
  - API keys: `'crop-image': 'crop_image'`, `'cropImage': 'crop_image'`
- **Header.tsx**:
  - key: `cropImage`
  - href: `/tools/crop-image`
  - kategoria: `edit` (nowa)

### 1.2 Resize Image (Zmiana rozmiaru)
- **Rozwiązanie**: Sharp (lokalnie, bez API)
- **Koszt kredytów**: FREE (0 kredytów) - podstawowa edycja
- **Funkcje**:
  - [ ] Resize by pixels
  - [ ] Resize by percentage
  - [ ] Maintain aspect ratio
  - [ ] Social media presets (Instagram 1080x1080, FB Cover 820x312, etc.)
- **Pliki do utworzenia**:
  - `app/api/resize-image/route.ts`
  - `components/ImageResizer.tsx`
  - `app/[locale]/tools/resize-image/page.tsx`
- **Konfiguracja credits-config.ts**:
  - ToolType: `resize_image`
  - API keys: `'resize-image': 'resize_image'`, `'resizeImage': 'resize_image'`
- **Header.tsx**:
  - key: `resizeImage`
  - href: `/tools/resize-image`
  - kategoria: `edit`

### 1.3 Logo Maker (Generator Logo AI)
- **Rozwiązanie**: Ideogram 3.0 via Replicate
- **Dlaczego**: Najlepsza jakość tekstu/typografii w AI (lepszy niż FLUX)
- **Model**: `ideogram-ai/ideogram-v2-turbo`
- **Koszt API**: ~$0.05/generacja (zweryfikowane 18.12.2024)
- **Koszt kredytów**: 5 kredytów (dostosowane do kosztu API)
- **Funkcje**:
  - [ ] Text input dla nazwy firmy/marki
  - [ ] Wybór stylu (minimalist, vintage, modern, etc.)
  - [ ] Wybór kolorystyki
  - [ ] Eksport PNG z przezroczystym tłem
  - [ ] Warianty (3-4 propozycje)
- **Pliki do utworzenia**:
  - `app/api/logo-maker/route.ts`
  - `components/LogoMaker.tsx`
  - `app/[locale]/tools/logo-maker/page.tsx`
- **Konfiguracja credits-config.ts**:
  - ToolType: `logo_maker`
  - API keys: `'logo-maker': 'logo_maker'`, `'logoMaker': 'logo_maker'`
- **Header.tsx**:
  - key: `logoMaker`
  - href: `/tools/logo-maker`
  - kategoria: `generate`

### 1.4 QR Code Generator (Stylizowane kody QR)
- **Rozwiązanie**: Biblioteka `qrcode` + Sharp (lokalne przetwarzanie)
- **Biblioteka**: `qrcode` (npm) - generowanie QR + Sharp dla overlay
- **Koszt API**: FREE (brak zewnętrznego API)
- **Koszt kredytów**: FREE (0 kredytów) - podstawowa funkcja
- **Uwaga**: Modele AI QR na Replicate są OFFLINE (18.12.2024). Planujemy dodać AI QR gdy modele wrócą online.
- **Funkcje**:
  - [ ] URL/Text/vCard/WiFi input
  - [ ] Wybór kolorów (foreground/background)
  - [ ] Logo/obrazek w centrum QR
  - [ ] Zaokrąglone rogi modułów
  - [ ] Gradient tła
  - [ ] Predefiniowane style (klasyczny, gradient, branded)
  - [ ] Eksport PNG/SVG
  - [ ] Walidacja skanowania przed pobraniem
- **Pliki do utworzenia**:
  - `app/api/qr-generator/route.ts`
  - `components/QRGenerator.tsx`
  - `app/[locale]/tools/qr-generator/page.tsx`
- **Zależności do dodania**:
  - `npm install qrcode @types/qrcode`
- **Konfiguracja credits-config.ts**:
  - ToolType: `qr_generator`
  - cost: 0 (FREE)
  - API keys: `'qr-generator': 'qr_generator'`, `'qrGenerator': 'qr_generator'`
- **Header.tsx**:
  - key: `qrGenerator`
  - href: `/tools/qr-generator`
  - kategoria: `utilities` (zamiast generate - bo nie używa AI)
- **Przyszłe rozszerzenie (AI QR)**: Gdy modele wrócą online, dodać opcję AI Art QR za 3 kredyty

---

## 🟠 PRIORYTET 2: Narzędzia Zaawansowane

### 2.1 Convert to SVG (Wektoryzacja)
- **Rozwiązanie OPCJA A**: Vectorizer.AI API (najlepsza jakość)
  - Płatne API: ~$0.20/obraz (plan: 50 kredytów za $9.99/mies)
  - https://vectorizer.ai/api
  - ⚠️ Wymaga osobnego klucza API (nie Replicate)
- **Rozwiązanie OPCJA B**: Recraft V3 via Replicate (tańsze, ale gorsza jakość)
  - Model: `recraft-ai/recraft-v3-svg`
  - Koszt: ~$0.04/obraz
- **Koszt kredytów**: 3 kredyty (przy użyciu Vectorizer.AI)
- **Funkcje**:
  - [ ] Upload raster image
  - [ ] Preview SVG
  - [ ] Download SVG
  - [ ] Color simplification options
- **Pliki do utworzenia**:
  - `app/api/vectorize/route.ts`
  - `components/ImageVectorizer.tsx`
  - `app/[locale]/tools/convert-to-svg/page.tsx`
- **Konfiguracja credits-config.ts**:
  - ToolType: `vectorize`
  - API keys: `'vectorize': 'vectorize'`, `'convert-to-svg': 'vectorize'`
- **Header.tsx**:
  - key: `vectorize`
  - href: `/tools/convert-to-svg`
  - kategoria: `transform`

### 2.2 Collage Maker
- **Rozwiązanie**: Sharp + własna logika (bez API zewnętrznego)
- **Koszt kredytów**: FREE (0 kredytów) - podstawowa edycja
- **Funkcje**:
  - [ ] Wybór layoutu (2x2, 3x3, 1+2, etc.)
  - [ ] Upload wielu zdjęć
  - [ ] Drag & drop reordering
  - [ ] Spacing/padding options
  - [ ] Background color
- **Pliki do utworzenia**:
  - `app/api/collage/route.ts`
  - `components/CollageMaker.tsx`
  - `app/[locale]/tools/collage-maker/page.tsx`
- **Konfiguracja credits-config.ts**:
  - ToolType: `collage`
  - API keys: `'collage': 'collage'`, `'collage-maker': 'collage'`
- **Header.tsx**:
  - key: `collageMaker`
  - href: `/tools/collage-maker`
  - kategoria: `edit`

### 2.3 Text Effects (Efekty tekstowe AI)
- **Rozwiązanie**: Ideogram 3.0 lub Recraft V3
- **Model**: `ideogram-ai/ideogram-v2-turbo`
- **Koszt API**: ~$0.05/generacja (zweryfikowane 18.12.2024)
- **Koszt kredytów**: 5 kredytów
- **Funkcje**:
  - [ ] Text input
  - [ ] Style presets (3D, neon, graffiti, fire, ice, etc.)
  - [ ] Color customization
  - [ ] Background options (transparent, solid, gradient)
- **Pliki do utworzenia**:
  - `app/api/text-effects/route.ts`
  - `components/TextEffects.tsx`
  - `app/[locale]/tools/text-effects/page.tsx`
- **Konfiguracja credits-config.ts**:
  - ToolType: `text_effects`
  - API keys: `'text-effects': 'text_effects'`, `'textEffects': 'text_effects'`
- **Header.tsx**:
  - key: `textEffects`
  - href: `/tools/text-effects`
  - kategoria: `generate`

### 2.4 Filters & Effects (Filtry obrazu)
- **Rozwiązanie**: Sharp + custom LUTs (bez API zewnętrznego)
- **Koszt kredytów**: FREE (0 kredytów) - podstawowa edycja
- **Funkcje**:
  - [ ] Basic adjustments (brightness, contrast, saturation)
  - [ ] Preset filters (Vintage, B&W, Sepia, Cool, Warm)
  - [ ] Blur/Sharpen
  - [ ] Vignette
- **Pliki do utworzenia**:
  - `app/api/image-filters/route.ts`
  - `components/ImageFilters.tsx`
  - `app/[locale]/tools/image-filters/page.tsx`
- **Konfiguracja credits-config.ts**:
  - ToolType: `image_filters`
  - API keys: `'image-filters': 'image_filters'`, `'imageFilters': 'image_filters'`
- **Header.tsx**:
  - key: `imageFilters`
  - href: `/tools/image-filters`
  - kategoria: `edit`

---

## 🟡 PRIORYTET 3: Ulepszenia Istniejących

### 3.1 Tool Status Dashboard (Admin Panel)
- **Problem**: Zewnętrzne API (Replicate, fal.ai, OpenAI) mogą być okresowo niedostępne
- **Rozwiązanie**: Nowa zakładka w panelu admina do monitorowania statusu narzędzi
- **Istniejąca infrastruktura do wykorzystania**:
  - `ApiPlatformBalances.tsx` - już śledzi salda API
  - `/api/health/route.ts` - podstawowy health check
  - `/admin/system/` - wzorzec monitoringu
- **Funkcje**:
  - [ ] Status każdego narzędzia: Online/Offline/Degraded (kolor: zielony/czerwony/żółty)
  - [ ] Automatyczne health checks co 5-15 minut (cron job lub Vercel cron)
  - [ ] Ręczny przycisk "Test Connection" dla każdego serwisu
  - [ ] Latencja/czas odpowiedzi każdego API
  - [ ] Historia statusów (wykres dostępności 24h/7d)
  - [ ] Alerty email gdy serwis jest offline >5 minut
  - [ ] Integracja z istniejącym `ApiPlatformBalance` (saldo + status)
- **Serwisy do monitorowania**:
  - Replicate (12+ modeli): ping `replicate.models.get()`
  - Fal.ai (6+ endpointów): ping health endpoint
  - OpenAI: ping `openai.models.list()`
  - Vectorizer.AI (planowany): ping API status
  - Stripe: ping `stripe.balance.retrieve()`
  - Resend: ping account info
- **Pliki do utworzenia**:
  - `app/[locale]/admin/tool-status/page.tsx`
  - `app/[locale]/admin/tool-status/ToolStatusClient.tsx`
  - `app/api/admin/tool-status/route.ts`
  - `app/api/cron/health-check/route.ts` (Vercel cron)
- **Model bazy danych** (rozszerzenie istniejącego):
  ```prisma
  model ServiceStatus {
    id            String   @id @default(cuid())
    serviceName   String   @unique // replicate, fal, openai, etc.
    status        String   // online, offline, degraded
    latency       Int?     // ms
    lastCheck     DateTime
    lastOnline    DateTime?
    lastError     String?
    checkCount24h Int      @default(0)
    errorCount24h Int      @default(0)
  }
  ```
- **Konfiguracja credits-config.ts**: Nie wymaga zmian
- **Header.tsx**: Nie wymaga zmian (tylko admin panel)
- **Sidebar admina**: Dodać link "Tool Status" z ikoną 🔧 lub ⚡

### 3.2 Połączenie Email Templates z systemem wysyłania
- **Problem**: Admin panel Email Templates nie jest połączony z `lib/email.ts`
- **Rozwiązanie**:
  - [ ] Przenieść szablony z hardcoded do bazy danych
  - [ ] Funkcja `getEmailTemplate(slug)` z DB fallback
  - [ ] Admin UI do edycji szablonów
  - [ ] Preview email przed wysłaniem
- **Pliki do modyfikacji**:
  - `lib/email.ts`
  - `lib/db.ts`
  - `app/api/admin/email-templates/route.ts`

### 3.3 Usprawnienie Text to Image
- **Obecny stan**: Działa, ale można ulepszyć
- **Ulepszenia**:
  - [ ] Więcej stylów/presetów
  - [ ] Aspect ratio selection
  - [ ] Negative prompts
  - [ ] Batch generation (2-4 warianty)

### 3.4 Video Tools Enhancement
- **Obecne narzędzia**: AI Video Generation, Captions
- **Brakujące funkcje Adobe**:
  - [ ] Video Merge (łączenie klipów)
  - [ ] Video Trim (przycinanie)
  - [ ] Speed Control (przyspieszenie/zwolnienie)
  - [ ] Video Resize

---

## 📐 ZMIANY W UI/MENU

### Struktura menu po dodaniu nowych narzędzi

```
TOOLS (dropdown)
├── Enhance
│   ├── AI Upscaler ✅
│   ├── Face Restore ✅
│   ├── Colorize ✅
│   ├── Denoise ✅
│   └── Portrait Relight ✅
├── Remove
│   ├── Remove Background ✅
│   ├── Object Removal ✅
│   └── Watermark Remover ✅
├── Generate
│   ├── Background Generator ✅
│   ├── AI Packshot ✅
│   ├── Image Expand ✅
│   ├── Inpainting ✅
│   ├── Logo Maker 🆕
│   └── Text Effects 🆕
├── Transform
│   ├── Style Transfer ✅
│   ├── Reimagine ✅
│   ├── Structure Control ✅
│   └── Convert to SVG 🆕
├── Edit 🆕 (nowa kategoria)
│   ├── Crop Image 🆕
│   ├── Resize Image 🆕
│   ├── Filters & Effects 🆕
│   └── Collage Maker 🆕
└── Utilities
    ├── Image Compressor ✅
    ├── Format Converter ✅
    └── QR Code Generator 🆕 (FREE)

AI IMAGE ✅
AI VIDEO ✅
```

### Modyfikacje plików menu
- [ ] `components/Header.tsx` - dodać nową kategorię "Edit"
- [ ] `messages/*/common.json` - tłumaczenia dla nowych narzędzi (4 języki)
- [ ] `lib/credits-config.ts` - koszty kredytów

---

## 🔧 DECYZJE TECHNICZNE

### API Stack
| Kategoria | Wybór | Uzasadnienie |
|-----------|-------|--------------|
| AI Models | **Replicate** | Największy wybór modeli, sprawdzona integracja |
| Fast Inference | fal.ai (backup) | Dla zadań wymagających <1s response |
| Image Processing | **Sharp** | Lokalne, bezpłatne, bardzo szybkie |
| Logo/Text AI | **Ideogram 3.0** | Najlepsza jakość tekstu w obrazach |
| Vectorization | **Vectorizer.AI** | Najlepsza jakość SVG |
| QR Codes | **qrcode (npm)** | Lokalne, FREE, z opcją logo/stylowania |

### Dlaczego Replicate?
1. ✅ 1000+ modeli do wyboru
2. ✅ Już zintegrowane w projekcie (20+ endpointów)
3. ✅ Pay-per-use (bez subskrypcji)
4. ✅ Dobra dokumentacja
5. ✅ Szybkie wdrożenie nowych modeli

### Kiedy użyć fal.ai?
- Real-time applications (<120ms latency)
- Portrait Relight (już używane)
- Jako fallback gdy Replicate jest wolny

---

## 📋 KOLEJNOŚĆ WDRAŻANIA

### Faza 1 (ASAP)
1. [ ] Crop Image
2. [ ] Resize Image
3. [ ] Logo Maker
4. [ ] QR Code Generator

### Faza 2
5. [ ] Convert to SVG
6. [ ] Collage Maker
7. [ ] Text Effects
8. [ ] Filters & Effects

### Faza 3
9. [ ] Tool Status Dashboard (admin monitoring)
10. [ ] Email Templates integration
11. [ ] Text to Image improvements
12. [ ] Video Tools (merge, trim, speed)
13. [ ] Templates Gallery

---

## 🛡️ BEZPIECZEŃSTWO (Ciągłe)

- [x] Regularny `npm audit` - **0 vulnerabilities** ✅
- [ ] Rotacja kluczy API co 90 dni
- [ ] Przegląd logów Sentry co tydzień
- [ ] Backup bazy danych (automatyczny, dzienny)
- [ ] Penetration testing przed major release

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

## 📝 WZORZEC DODAWANIA NOWEGO NARZĘDZIA

### 1. Backend (API)
```
app/api/[tool-name]/route.ts
```

### 2. Frontend (Component)
```
components/[ToolName].tsx
```

### 3. Page
```
app/[locale]/tools/[tool-name]/page.tsx
```

### 4. Menu - Header.tsx
```typescript
// 1. Dodać ikonę SVG do obiektu toolIcons (linia ~14)
const toolIcons = {
  newTool: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
    </svg>
  ),
  // ...
};

// 2. Dodać narzędzie do odpowiedniej kategorii w toolCategories (linia ~88)
{ key: 'newTool', href: '/tools/new-tool', color: 'from-blue-500 to-blue-600' },
```

### 5. Translations (4 języki)
```
messages/en/common.json
messages/pl/common.json
messages/es/common.json
messages/fr/common.json
```

### 6. Credits - lib/credits-config.ts
```typescript
// 1. Dodać do typu ToolType (linia ~8)
export type ToolType =
  | 'new_tool'
  // ...

// 2. Dodać konfigurację w CREDIT_COSTS (linia ~67)
new_tool: {
  cost: 1,
  displayName: 'New Tool',
  description: 'Tool description',
},

// 3. Dodać mapowanie w TOOL_API_KEYS (linia ~338)
'new-tool': 'new_tool',
'newTool': 'new_tool',
```

---

## 🌍 WYMAGANE TŁUMACZENIA DLA NOWYCH NARZĘDZI

### Nowa kategoria menu "Edit"

| Klucz | EN | PL | ES | FR |
|-------|----|----|----|----|
| `toolCategories.edit` | Edit | Edytuj | Editar | Éditer |

### Crop Image

| Klucz | EN | PL | ES | FR |
|-------|----|----|----|----|
| `tools.cropImage.name` | Crop Image | Kadruj Obraz | Recortar Imagen | Rogner l'Image |
| `tools.cropImage.description` | Crop and frame your images | Kadruj i przycinaj obrazy | Recorta y enmarca tus imágenes | Recadrez et cadrez vos images |

### Resize Image

| Klucz | EN | PL | ES | FR |
|-------|----|----|----|----|
| `tools.resizeImage.name` | Resize Image | Zmień Rozmiar | Cambiar Tamaño | Redimensionner |
| `tools.resizeImage.description` | Change image dimensions | Zmień wymiary obrazu | Cambia las dimensiones de la imagen | Modifier les dimensions de l'image |

### Logo Maker

| Klucz | EN | PL | ES | FR |
|-------|----|----|----|----|
| `tools.logoMaker.name` | Logo Maker | Generator Logo | Creador de Logo | Créateur de Logo |
| `tools.logoMaker.description` | Create AI-powered logos | Twórz logo z pomocą AI | Crea logos con IA | Créez des logos avec l'IA |
| `tools.logoMaker.badge` | AI | AI | IA | IA |

### QR Code Generator

| Klucz | EN | PL | ES | FR |
|-------|----|----|----|----|
| `tools.qrGenerator.name` | QR Code Generator | Generator Kodów QR | Generador de Códigos QR | Générateur de QR Code |
| `tools.qrGenerator.description` | Create stylized QR codes with logo | Twórz stylizowane kody QR z logo | Crea códigos QR estilizados con logo | Créez des QR codes stylisés avec logo |
| `tools.qrGenerator.badge` | FREE | FREE | GRATIS | GRATUIT |

### Convert to SVG

| Klucz | EN | PL | ES | FR |
|-------|----|----|----|----|
| `tools.vectorize.name` | Convert to SVG | Konwertuj do SVG | Convertir a SVG | Convertir en SVG |
| `tools.vectorize.description` | Vectorize images to SVG | Wektoryzuj obrazy do SVG | Vectoriza imágenes a SVG | Vectorisez les images en SVG |

### Collage Maker

| Klucz | EN | PL | ES | FR |
|-------|----|----|----|----|
| `tools.collageMaker.name` | Collage Maker | Kreator Kolaży | Creador de Collage | Créateur de Collage |
| `tools.collageMaker.description` | Create photo collages | Twórz kolaże zdjęć | Crea collages de fotos | Créez des collages photo |

### Text Effects

| Klucz | EN | PL | ES | FR |
|-------|----|----|----|----|
| `tools.textEffects.name` | Text Effects | Efekty Tekstowe | Efectos de Texto | Effets de Texte |
| `tools.textEffects.description` | Create stylized text art | Twórz stylizowany tekst | Crea texto estilizado | Créez du texte stylisé |
| `tools.textEffects.badge` | AI | AI | IA | IA |

### Filters & Effects

| Klucz | EN | PL | ES | FR |
|-------|----|----|----|----|
| `tools.imageFilters.name` | Filters & Effects | Filtry i Efekty | Filtros y Efectos | Filtres et Effets |
| `tools.imageFilters.description` | Apply filters and adjustments | Zastosuj filtry i korekty | Aplica filtros y ajustes | Appliquez des filtres et des ajustements |

---

## ⚠️ CHECKLIST KOMPATYBILNOŚCI (weryfikacja 18.12.2024)

### Zgodność nazewnictwa z projektem

| Element | Wzorzec projektu | Status |
|---------|------------------|--------|
| URL path | kebab-case (`/tools/remove-background`) | ✅ Zgodne |
| API route | kebab-case (`app/api/remove-background/`) | ✅ Zgodne |
| ToolType | snake_case (`remove_background`) | ✅ Zgodne |
| Translation key | camelCase (`tools.removeBackground`) | ✅ Zgodne |
| Header key | camelCase (`key: 'removeBackground'`) | ✅ Zgodne |
| Component name | PascalCase (`BackgroundRemover.tsx`) | ✅ Zgodne |

### Pliki wymagające modyfikacji dla KAŻDEGO nowego narzędzia

1. **`lib/credits-config.ts`**
   - [ ] Dodać do `ToolType` union type (linia ~8)
   - [ ] Dodać konfigurację w `CREDIT_COSTS` (linia ~67)
   - [ ] Dodać mapowanie w `TOOL_API_KEYS` (linia ~338)

2. **`components/Header.tsx`**
   - [ ] Dodać ikonę SVG w `toolIcons` (linia ~14)
   - [ ] Dodać narzędzie do odpowiedniej kategorii w `toolCategories` (linia ~88)
   - [ ] Dla nowej kategorii "Edit" - utworzyć nowy obiekt kategorii

3. **`messages/*/common.json`** (4 pliki)
   - [ ] Dodać `tools.[toolKey].name`
   - [ ] Dodać `tools.[toolKey].description`
   - [ ] Dodać `tools.[toolKey].badge` (opcjonalnie)
   - [ ] Dodać `toolCategories.edit` (tylko raz, dla nowej kategorii)

### Potencjalne problemy do sprawdzenia (ZWERYFIKOWANE 18.12.2024)

- [x] **Limit kategorii w menu**: ✅ OK - Menu używa `flex-wrap` i `overflow-x-auto`, więc 6 kategorii się zmieści
- [x] **Narzędzia FREE (0 kredytów)**: ✅ OK - System używa `Math.max(0, credits - creditsUsed)`, więc `cost: 0` zadziała
- [x] **Ideogram 3.0 na Replicate**: ✅ DOSTĘPNY - Model `ideogram-ai/ideogram-v2-turbo` jest ONLINE, koszt ~$0.05/obraz
- [x] **Vectorizer.AI**: ⚠️ WYMAGA KLUCZA - Osobny klucz API, ceny od $0.20/obraz (plan 50 kredytów za $9.99/mies)

- [x] **QR Code Generator**: ❌ PROBLEM - Wszystkie modele QR na Replicate są OFFLINE:
  - `catacolabs/illusion` - nie istnieje
  - `andreasjansson/illusion` - OFFLINE
  - `lucataco/illusion-diffusion-hq` - OFFLINE
  - `zylim0702/qr_code_controlnet` - OFFLINE
  - `qr2ai/qr_code_ai_art_generator` - OFFLINE

  **ALTERNATYWY DLA QR CODE** (zweryfikowane):
  1. **Samodzielny hosting** - Modele są open-source, można hostować na własnym GPU (wymaga A100)
  2. ~~**fal.ai**~~ - ❌ Brak modeli QR code
  3. **QRBTF.com API** - Komercyjne API do AI QR codes (do sprawdzenia)
  4. **Standardowy QR + stylowanie** - Użyć biblioteki `qrcode` + gradient/logo overlay
  5. **Hugging Face Spaces** - Wywołać API z HF Spaces (qr-code-ai-art-generator)

  **REKOMENDACJA**: Zacząć od prostego QR z logo/stylowaniem (FREE), dodać AI QR później gdy modele wrócą online

---

## 🔗 LINKI

- **Repo:** https://github.com/Mitjano/upsizer
- **Produkcja:** https://pixelift.pl
- **Dokumentacja API:** https://pixelift.pl/api-docs
- **Sentry:** https://sentry.io/organizations/pixelift

### API Documentation
- **Replicate:** https://replicate.com/docs
- **Ideogram:** https://replicate.com/ideogram-ai/ideogram-v2-turbo
- **Vectorizer.AI:** https://vectorizer.ai/api
- **QRCode (npm):** https://www.npmjs.com/package/qrcode

---

## 📅 HISTORIA AUDYTÓW

| Data | Wersja | Uwagi |
|------|--------|-------|
| 2024-11-23 | 1.0 | Pierwszy pełny audyt |
| 2024-12-16 | 1.1 | Audyt przed zamknięciem fazy dev |
| 2024-12-17 | 1.2 | Poprawki bezpieczeństwa (xlsx→exceljs, Next.js audit fix, i18n) |
| 2024-12-18 | 2.0 | **Strategia konkurencji z Adobe Express** - analiza i roadmap |
| 2024-12-19 | 2.1 | Poprawki: QR→qrcode lib, Tool Status Dashboard, numeracja sekcji |

---

*Ostatnia aktualizacja: 19.12.2024*
