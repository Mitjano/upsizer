# Pixelift - Lista Zadań (Aktualizacja 18.12.2024)

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
| Logo Maker | 🔴 Wysoki | Ideogram 3.0 (Replicate) | ~$0.02/obraz |
| QR Code Generator | 🔴 Wysoki | Illusion (Replicate) | ~$0.02/obraz |
| Convert to SVG | 🟠 Średni | Vectorizer.AI API | ~$0.01/obraz |
| Collage Maker | 🟠 Średni | Sharp + własna logika | FREE |
| Text Effects | 🟠 Średni | Ideogram 3.0 / Recraft V3 | ~$0.02/obraz |
| Filters & Effects | 🟡 Niski | Sharp + LUTs | FREE |
| Templates Gallery | 🟡 Niski | Własna implementacja | FREE |

---

## 🔴 PRIORYTET 1: Nowe Narzędzia Podstawowe

### 1.1 Crop Image (Kadrowanie)
- **Rozwiązanie**: Sharp (lokalnie, bez API)
- **Koszt kredytów**: FREE lub 1 kredt
- **Funkcje**:
  - [ ] Swobodne kadrowanie
  - [ ] Predefiniowane proporcje (1:1, 4:3, 16:9, 9:16)
  - [ ] Proporcje social media (Instagram, Facebook, Twitter)
  - [ ] Rule of thirds overlay
- **Pliki do utworzenia**:
  - `app/api/crop-image/route.ts`
  - `components/ImageCropper.tsx`
  - `app/[locale]/tools/crop-image/page.tsx`

### 1.2 Resize Image (Zmiana rozmiaru)
- **Rozwiązanie**: Sharp (lokalnie, bez API)
- **Koszt kredytów**: FREE lub 1 kredt
- **Funkcje**:
  - [ ] Resize by pixels
  - [ ] Resize by percentage
  - [ ] Maintain aspect ratio
  - [ ] Social media presets (Instagram 1080x1080, FB Cover 820x312, etc.)
- **Pliki do utworzenia**:
  - `app/api/resize-image/route.ts`
  - `components/ImageResizer.tsx`
  - `app/[locale]/tools/resize-image/page.tsx`

### 1.3 Logo Maker (Generator Logo AI)
- **Rozwiązanie**: Ideogram 3.0 via Replicate
- **Dlaczego**: Najlepsza jakość tekstu/typografii w AI (lepszy niż FLUX)
- **Model**: `ideogram-ai/ideogram-v2-turbo`
- **Koszt API**: ~$0.02/generacja
- **Koszt kredytów**: 3-5 kredytów
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

### 1.4 QR Code Generator (Artystyczne kody QR)
- **Rozwiązanie**: Illusion model via Replicate
- **Model**: `catacolabs/illusion`
- **Koszt API**: ~$0.02/generacja
- **Koszt kredytów**: 2-3 kredyty
- **Funkcje**:
  - [ ] URL/Text input
  - [ ] Prompt dla stylu wizualnego
  - [ ] Wybór predefiniowanych stylów
  - [ ] Walidacja skanowania
- **Pliki do utworzenia**:
  - `app/api/qr-generator/route.ts`
  - `components/QRGenerator.tsx`
  - `app/[locale]/tools/qr-generator/page.tsx`

---

## 🟠 PRIORYTET 2: Narzędzia Zaawansowane

### 2.1 Convert to SVG (Wektoryzacja)
- **Rozwiązanie OPCJA A**: Vectorizer.AI API (najlepsza jakość)
  - Płatne API: ~$0.01/obraz
  - https://vectorizer.ai/api
- **Rozwiązanie OPCJA B**: Recraft V3 (free tier dostępny)
  - Model: `recraft-ai/recraft-v3-svg`
- **Koszt kredytów**: 2-3 kredyty
- **Funkcje**:
  - [ ] Upload raster image
  - [ ] Preview SVG
  - [ ] Download SVG
  - [ ] Color simplification options
- **Pliki do utworzenia**:
  - `app/api/vectorize/route.ts`
  - `components/ImageVectorizer.tsx`
  - `app/[locale]/tools/convert-to-svg/page.tsx`

### 2.2 Collage Maker
- **Rozwiązanie**: Sharp + własna logika (bez API zewnętrznego)
- **Koszt kredytów**: FREE lub 1 kredt
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

### 2.3 Text Effects (Efekty tekstowe AI)
- **Rozwiązanie**: Ideogram 3.0 lub Recraft V3
- **Model**: `ideogram-ai/ideogram-v2-turbo`
- **Koszt API**: ~$0.02/generacja
- **Koszt kredytów**: 3-5 kredytów
- **Funkcje**:
  - [ ] Text input
  - [ ] Style presets (3D, neon, graffiti, fire, ice, etc.)
  - [ ] Color customization
  - [ ] Background options (transparent, solid, gradient)
- **Pliki do utworzenia**:
  - `app/api/text-effects/route.ts`
  - `components/TextEffects.tsx`
  - `app/[locale]/tools/text-effects/page.tsx`

### 2.4 Filters & Effects (Filtry obrazu)
- **Rozwiązanie**: Sharp + custom LUTs (bez API zewnętrznego)
- **Koszt kredytów**: FREE lub 1 kredt
- **Funkcje**:
  - [ ] Basic adjustments (brightness, contrast, saturation)
  - [ ] Preset filters (Vintage, B&W, Sepia, Cool, Warm)
  - [ ] Blur/Sharpen
  - [ ] Vignette
- **Pliki do utworzenia**:
  - `app/api/image-filters/route.ts`
  - `components/ImageFilters.tsx`
  - `app/[locale]/tools/image-filters/page.tsx`

---

## 🟡 PRIORYTET 3: Ulepszenia Istniejących

### 3.1 Połączenie Email Templates z systemem wysyłania
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

### 3.2 Usprawnienie Text to Image
- **Obecny stan**: Działa, ale można ulepszyć
- **Ulepszenia**:
  - [ ] Więcej stylów/presetów
  - [ ] Aspect ratio selection
  - [ ] Negative prompts
  - [ ] Batch generation (2-4 warianty)

### 3.3 Video Tools Enhancement
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
│   ├── QR Code Generator 🆕
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
    └── Format Converter ✅

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
| QR Codes | **Illusion (Replicate)** | Artystyczne QR z AI |

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
9. [ ] Email Templates integration
10. [ ] Text to Image improvements
11. [ ] Video Tools (merge, trim, speed)
12. [ ] Templates Gallery

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

### 4. Menu
```
components/Header.tsx (toolCategories)
```

### 5. Translations (4 języki)
```
messages/en/common.json
messages/pl/common.json
messages/es/common.json
messages/fr/common.json
```

### 6. Credits
```
lib/credits-config.ts
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
| `tools.qrGenerator.description` | Create artistic QR codes | Twórz artystyczne kody QR | Crea códigos QR artísticos | Créez des QR codes artistiques |
| `tools.qrGenerator.badge` | AI | AI | IA | IA |

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

## 🔗 LINKI

- **Repo:** https://github.com/Mitjano/upsizer
- **Produkcja:** https://pixelift.pl
- **Dokumentacja API:** https://pixelift.pl/api-docs
- **Sentry:** https://sentry.io/organizations/pixelift

### API Documentation
- **Replicate:** https://replicate.com/docs
- **Ideogram:** https://replicate.com/ideogram-ai/ideogram-v2-turbo
- **Vectorizer.AI:** https://vectorizer.ai/api
- **Illusion QR:** https://replicate.com/catacolabs/illusion

---

## 📅 HISTORIA AUDYTÓW

| Data | Wersja | Uwagi |
|------|--------|-------|
| 2024-11-23 | 1.0 | Pierwszy pełny audyt |
| 2024-12-16 | 1.1 | Audyt przed zamknięciem fazy dev |
| 2024-12-17 | 1.2 | Poprawki bezpieczeństwa (xlsx→exceljs, Next.js audit fix, i18n) |
| 2024-12-18 | 2.0 | **Strategia konkurencji z Adobe Express** - analiza i roadmap |

---

*Ostatnia aktualizacja: 18.12.2024*
