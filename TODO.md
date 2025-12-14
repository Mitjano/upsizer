# Pixelift - Plan Rozwoju

## Zakończone (14.12.2024)

### Copy Link / Share Feature
- [x] Dodać ikonę 'link' do ActionButton
- [x] Utworzyć komponent CopyLinkButton
- [x] Eksportować CopyLinkButton z barrel file
- [x] Utworzyć stronę /share/[id] z OG meta tagami
- [x] Dodać tłumaczenia (en, pl)
- [x] Zintegrować z ImageUpscaler
- [x] Zintegrować z BackgroundRemover
- [x] Wdrożyć na produkcję

---

## Do Zrobienia

### 1. Nowe Narzędzia AI (Wyrównanie Menu)

**Priorytet: Wysoki** - Aktualnie menu jest nierówne (1 narzędzie w "Narzędzia")

#### Kategoria: NARZĘDZIA (Utilities) - potrzeba 2 nowych

| Narzędzie | Model AI | Opis | Koszt API |
|-----------|----------|------|-----------|
| **Image to Vector (SVG)** | Vectorizer.AI API lub lokalne | Konwersja PNG/JPG do SVG | ~$0.01/obraz |
| **Format Converter** | Sharp (lokalne) | HEIC/AVIF/WebP ↔ JPG/PNG | DARMOWE |

#### Kategoria: ULEPSZANIE (Enhance) - można dodać

| Narzędzie | Model AI | Opis | Koszt API |
|-----------|----------|------|-----------|
| **Portrait Relight** | fal.ai/ic-light-v2 lub Replicate zsxkib/ic-light | Zmiana oświetlenia portretów | ~$0.05/obraz |
| **Face Enhancer Pro** | Replicate codeformer | Zaawansowana restauracja twarzy | ~$0.01/obraz |

#### Kategoria: USUWANIE (Remove) - można dodać

| Narzędzie | Model AI | Opis | Koszt API |
|-----------|----------|------|-----------|
| **Watermark Remover** | Replicate (LaMA inpainting) | Usuwanie znaków wodnych | ~$0.02/obraz |
| **Shadow Remover** | fal.ai shadow-removal | Usuwanie cieni ze zdjęć | ~$0.02/obraz |

#### Kategoria: GENEROWANIE (Generate) - można dodać

| Narzędzie | Model AI | Opis | Koszt API |
|-----------|----------|------|-----------|
| **Sketch to Image** | Replicate flux-kontext | Zamiana szkicu w realistyczny obraz | ~$0.04/obraz |
| **Image to 3D** | Replicate meshy/triposr | Konwersja zdjęcia do modelu 3D | ~$0.10/model |

#### Kategoria: PRZEKSZTAŁCANIE (Transform) - można dodać

| Narzędzie | Model AI | Opis | Koszt API |
|-----------|----------|------|-----------|
| **Face Swap** | Replicate face-swap | Zamiana twarzy na zdjęciach | ~$0.05/obraz |
| **Age Transform** | Replicate age-transformation | Zmiana wieku na zdjęciu | ~$0.03/obraz |

---

### 2. Rekomendowane Narzędzia do Natychmiastowej Implementacji

**Priorytet: Najwyższy** - wyrównanie menu + popularne funkcje

- [ ] **Format Converter** (Kategoria: Narzędzia)
  - Konwersja między formatami: HEIC, AVIF, WebP, PNG, JPG, GIF
  - Używa Sharp (biblioteka już zainstalowana!)
  - **DARMOWE** - brak kosztów API
  - Wypełni kategorię "Narzędzia"

- [ ] **Portrait Relight** (Kategoria: Ulepszanie)
  - fal.ai ICLight V2 (już masz FAL_API_KEY!)
  - Zmiana oświetlenia portretów przez prompt
  - ~$0.05/obraz
  - Bardzo popularne narzędzie

- [ ] **Watermark Remover** (Kategoria: Usuwanie)
  - Replicate LaMA lub podobny model inpainting
  - Automatyczne wykrywanie i usuwanie watermarków
  - ~$0.02/obraz
  - Duże zapotrzebowanie rynkowe

---

### 3. Rozszerzyć Copy Link na pozostałe narzędzia

**Priorytet: Wysoki**

Narzędzia wymagające modyfikacji API (muszą zapisywać obrazy do bazy):

- [ ] **ImageExpander** (`/api/expand-image`)
- [ ] **PackshotGenerator** (`/api/generate-packshot`)
- [ ] **ObjectRemover** (`/api/object-removal`)
- [ ] **ImageColorizer** (`/api/colorize`)
- [ ] **ImageDenoiser** (`/api/denoise`)
- [ ] **StyleTransfer** (`/api/style-transfer`)
- [ ] **ImageReimagine** (`/api/reimagine`)
- [ ] **InpaintingPro** (`/api/inpainting`)
- [ ] **StructureControl** (`/api/structure-control`)

---

### 4. Social Share Buttons

**Priorytet: Średni**

- [ ] Dodać przyciski udostępniania na stronie /share/[id]:
  - Facebook Share
  - Twitter/X Share
  - Pinterest Pin
  - WhatsApp Share
- [ ] Utworzyć komponent `SocialShareButtons`

---

### 5. Ulepszenia UX

**Priorytet: Niski**

- [ ] Batch processing - przetwarzanie wielu obrazów naraz
- [ ] History page - historia przetworzonych obrazów
- [ ] Before/After comparison na share page
- [ ] QR code do share link

---

## Analiza Konkurencji

### Popularne funkcje u konkurencji (źródło: [Dzine.ai](https://www.dzine.ai/blog/the-best-ai-photo-editors-of-2024-top-tools-for-photo-editing-retouching/), [Fotor](https://www.fotor.com/blog/best-ai-photo-editor/)):

| Funkcja | Pixelift | Konkurencja |
|---------|----------|-------------|
| Image Upscaling | ✅ | ✅ |
| Background Removal | ✅ | ✅ |
| Object Removal | ✅ | ✅ |
| Inpainting | ✅ | ✅ |
| Style Transfer | ✅ | ✅ |
| Colorization | ✅ | ✅ |
| Face Enhancement | ✅ (GFPGAN) | ✅ |
| Image Expand | ✅ | ✅ |
| **Portrait Relight** | ❌ | ✅ (Luminar, Clipdrop) |
| **Face Swap** | ❌ | ✅ (Pixlr, Fotor) |
| **Watermark Remover** | ❌ | ✅ (WatermarkRemover.io) |
| **Image to Vector** | ❌ | ✅ (Vectorizer.AI) |
| **Format Converter** | ❌ | ✅ (Cloudinary) |
| **Sketch to Image** | ❌ | ✅ (Canva, OpenArt) |
| **Image to 3D** | ❌ | ✅ (Meshy, 3DAIStudio) |

---

## Dostępne Modele AI

### Replicate (już używane)
- [Real-ESRGAN](https://replicate.com/nightmareai/real-esrgan) - upscaling ✅
- [BRIA RMBG](https://replicate.com/bria/remove-background) - background removal ✅
- [DDColor](https://replicate.com/piddnad/ddcolor) - colorization ✅
- [GFPGAN](https://replicate.com/tencentarc/gfpgan) - face restoration ✅
- [CodeFormer](https://replicate.com/sczhou/codeformer) - face restoration pro
- [IC-Light](https://replicate.com/zsxkib/ic-light) - portrait relighting
- [FLUX Kontext](https://replicate.com/black-forest-labs/flux-kontext-pro) - inpainting/editing ✅

### Fal.ai (już używane)
- [BiRefNet](https://fal.ai/models/fal-ai/birefnet) - background removal (FREE!) ✅
- [AuraSR](https://fal.ai/models/fal-ai/aura-sr) - upscaling
- [ICLight V2](https://fal.ai/models/fal-ai/iclight-v2) - relighting ✅ (używane w packshot)
- [Shadow Removal](https://fal.ai) - usuwanie cieni
- [FLUX.1](https://fal.ai/flux) - generowanie obrazów

### Lokalne (Sharp - już zainstalowane)
- Format conversion (HEIC, AVIF, WebP, PNG, JPG)
- Resize, crop, rotate
- Metadata extraction

---

## Notatki techniczne

### Wzorzec dodawania Copy Link do narzędzia

1. **Modyfikacja API route** (`/api/[tool]/route.ts`):
```typescript
import { ProcessedImagesDB } from '@/lib/processed-images-db';
import { ImageProcessor } from '@/lib/image-processor';

// Po przetworzeniu obrazu:
const processedPath = await ImageProcessor.saveFile(resultBuffer, filename, 'processed');

const imageRecord = await ProcessedImagesDB.create({
  userId: user.email,
  originalPath,
  processedPath,
  originalFilename: file.name,
  fileSize: file.size,
  width,
  height,
  isProcessed: true,
});

// W response dodać:
return NextResponse.json({
  // ... existing fields
  imageId: imageRecord.id,
});
```

2. **Modyfikacja komponentu** (`/components/[Tool].tsx`):
```typescript
import { CopyLinkButton } from './shared';

// W result interface dodać:
interface ProcessingResult {
  imageId: string;
  // ... existing fields
}

// W sekcji Actions dodać:
<CopyLinkButton imageId={result.imageId} accentColor="[tool-color]" />
```

### Wzorzec dodawania nowego narzędzia

1. Utworzyć `/app/api/[tool-name]/route.ts`
2. Utworzyć `/components/[ToolName].tsx`
3. Utworzyć `/app/[locale]/tools/[tool-name]/page.tsx`
4. Dodać do menu w `/components/Header.tsx`
5. Dodać tłumaczenia do `/messages/en/common.json` i `/messages/pl/common.json`
6. Dodać koszt kredytów w `/lib/credits-config.ts`

### Pliki kluczowe

- `/components/shared/CopyLinkButton.tsx` - komponent przycisku share
- `/app/[locale]/share/[id]/page.tsx` - strona udostępniania
- `/lib/processed-images-db.ts` - baza danych obrazów
- `/lib/image-processor.ts` - przetwarzanie i zapis obrazów
- `/lib/credits-config.ts` - konfiguracja kredytów

---

## Źródła i Referencje

- [Best AI Photo Editors 2024 - Dzine.ai](https://www.dzine.ai/blog/the-best-ai-photo-editors-of-2024-top-tools-for-photo-editing-retouching/)
- [Replicate AI Models](https://replicate.com/explore)
- [Fal.ai Models](https://fal.ai/models)
- [Vectorizer.AI](https://vectorizer.ai/)
- [WatermarkRemover.io](https://www.watermarkremover.io/)

---

## Kontakt

Projekt: Pixelift
Repo: https://github.com/Mitjano/upsizer
Produkcja: https://pixelift.pl
