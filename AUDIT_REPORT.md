# KOMPLEKSOWY AUDYT TECHNICZNY - PixeLift

**Data audytu:** 2024-12-17
**Audytor:** Claude Code
**Wersja aplikacji:** Produkcja (pixelift.pl)

---

## PODSUMOWANIE WYKONAWCZE

Przeprowadzono kompleksowy audyt wszystkich API endpoints, bibliotek pomocniczych oraz konfiguracji. Zidentyfikowano **3 problemy krytyczne**, **5 problemow sredniej wagi** oraz **8 rekomendacji do poprawy**.

### Status po audycie:
- Krytyczne: 3 (NAPRAWIONE)
- Srednie: 5 (do monitorowania)
- Niskie: 8 (rekomendacje)

---

## 1. ANALIZA API ENDPOINTS

### 1.1 Tabela Pixel Limits i Resize

| Endpoint | Model | Max Pixels | Resize | Status |
|----------|-------|------------|--------|--------|
| `/api/upscale` | Clarity/Real-ESRGAN/Recraft | 2M | TAK | OK |
| `/api/denoise` | SwinIR | 1M | TAK | OK |
| `/api/colorize` | DDColor | 2M | TAK | OK |
| `/api/object-removal` | Bria Eraser | 2M | TAK | OK |
| `/api/watermark-remover` | Bria Eraser | 2M | TAK | OK |
| `/api/reimagine` | FLUX Redux | 2M | TAK | OK |
| `/api/style-transfer` | InstantID | 2M | TAK | OK |
| `/api/structure-control` | FLUX Depth/Canny | 2M | TAK | OK |
| `/api/inpainting` | FLUX Fill Pro | 2M | TAK | OK |
| `/api/expand-image` | FLUX Fill Pro | 2M | TAK | OK |
| `/api/background-generate` | Bria BG | 2M | TAK | OK |
| `/api/generate-ai-background` | Bria Replace (FAL) | N/A | FAL handles | OK |
| `/api/portrait-relight` | ICLight V2 (FAL) | N/A | FAL handles | OK |
| `/api/face-restore` | CodeFormer | 2M | TAK (internal) | OK |
| `/api/compress-image` | Sharp (local) | N/A | N/A | OK |
| `/api/convert-format` | Sharp (local) | N/A | N/A | OK |

### 1.2 Koszty Kredytowe

| Endpoint | Koszt | Typ |
|----------|-------|-----|
| Upscale (faithful) | 0 | Staly |
| Upscale (product 2x/4x) | 1 | Staly |
| Upscale (product 8x) | 2 | Staly |
| Upscale (portrait) | 2-3 | Dynamiczny |
| Upscale (general) | 1-2 | Dynamiczny |
| Remove Background | 1 | Staly |
| Colorize | 1 | Staly |
| Compress | 1 | Staly |
| Denoise | 1 | Staly |
| Expand | 2 | Staly |
| Object Removal | 2 | Staly |
| Watermark Remover | 2 | Staly |
| Packshot | 2 | Staly |
| Reimagine | 2 x variants | Dynamiczny |
| Background Generate | 3 | Staly |
| Style Transfer | 3 | Staly |
| Structure Control | 3 | Staly |
| Inpainting | 3 | Staly |
| Portrait Relight | 2 | Staly |
| Convert Format | 0 | FREE |

---

## 2. PROBLEMY KRYTYCZNE (NAPRAWIONE)

### 2.1 CUDA OOM w `/api/upscale`
**Status:** NAPRAWIONE

**Problem:** Brak wywolania `resizeForUpscale()` przed przetwarzaniem AI, co powodowalo bledy CUDA OOM na duzych obrazach (>2M pikseli).

**Rozwiazanie:** Dodano resize przed AI processing:
```typescript
const resizedDataUrl = await ImageProcessor.resizeForUpscale(dataUrl);
```

### 2.2 Zepsuty model w `/api/watermark-remover`
**Status:** NAPRAWIONE

**Problem:** Model `zylim0702/remove-object` zwracal bledy 422 (version does not exist).

**Rozwiazanie:** Zmieniono na `bria/eraser` + dodano resize dla obrazu i maski.

### 2.3 CUDA OOM w `/api/denoise` (SwinIR)
**Status:** NAPRAWIONE

**Problem:** SwinIR wykonuje 4x upscale, wiec duze obrazy powodowaly OOM.

**Rozwiazanie:** Zmniejszono limit pikseli do 1M:
```typescript
const MAX_PIXELS_FOR_SWINIR = 1000000
```

---

## 3. PROBLEMY SREDNIEJ WAGI

### 3.1 Brak `maxDuration` w niektorych endpointach
**Dotyczy:**
- `/api/upscale`
- `/api/colorize`
- `/api/object-removal`
- `/api/reimagine`
- `/api/style-transfer`
- `/api/structure-control`
- `/api/inpainting`
- `/api/face-restore`

**Problem:** Brak explicite ustawionego `maxDuration` moze powodowac timeout na Vercel (domyslnie 10s dla Hobby, 60s dla Pro).

**Rekomendacja:** Dodac do wszystkich AI endpoints:
```typescript
export const maxDuration = 120 // 2 minutes timeout
export const dynamic = 'force-dynamic'
```

### 3.2 Niespojnosc w walidacji plikow
**Problem:** Rozne endpointy maja rozne limity rozmiaru:
- Wiekszosc: 20MB
- `/api/generate-ai-background`: 30MB
- `/api/expand-image`: 30MB
- `ImageProcessor.validateImage()`: 10MB

**Rekomendacja:** Ujednolicic do 20MB wszedzie lub skonfigurowac w jednym miejscu.

### 3.3 Brak walidacji mask type w `/api/inpainting`
**Problem:** Endpoint nie waliduje typu pliku maski - akceptuje wszystkie typy.

**Rekomendacja:** Dodac walidacje:
```typescript
if (!allowedTypes.includes(mask.type)) {
  return NextResponse.json(...)
}
```

### 3.4 Face Restore nie uzywa CREDIT_COSTS
**Problem:** `/api/face-restore` ma hardcoded `CREDITS_PER_RESTORE = 2` zamiast uzywac `CREDIT_COSTS`.

**Rekomendacja:** Zmienic na:
```typescript
const CREDITS_PER_RESTORE = CREDIT_COSTS.denoise.cost // lub dodac nowy typ
```

### 3.5 Remove Background nie uzywa `createUsage`
**Problem:** `/api/remove-background` recznie aktualizuje kredyty przez `updateUser()` zamiast uzywac `createUsage()`.

**Wplyw:** Brak spojnosci w logowaniu usage, totalUsage aktualizowany recznie.

**Rekomendacja:** Zmienic na `createUsage()` jak w innych endpointach.

---

## 4. PROBLEMY NISKIEJ WAGI / REKOMENDACJE

### 4.1 Unused parameter w reimagine
`variationStrength` jest pobierany ale nigdzie nie uzywany.

### 4.2 Unused parameter w inpainting
`mode` jest pobierany ale tylko zwracany w response, nie wplywa na processing.

### 4.3 Brak width/height w ProcessedImagesDB
Wiele endpointow zapisuje `width: 0, height: 0` - brak rzeczywistych wymiarow.

### 4.4 Inconsistent response structure
- Niektore zwracaja `processedImage`, inne `image`, jeszcze inne `styledImage`
- Brak spojnego schematu odpowiedzi

### 4.5 Brak retry logic dla zewnetrznych API
Jesli Replicate/FAL zwroci blad, nie ma automatycznego retry.

### 4.6 Sensitive data w logach
`console.log` czasem loguje pelne prompty i dane obrazow.

### 4.7 Missing CREDIT_COSTS types
Brak typu `face_restore` w `credits-config.ts` - uzywany w `/api/face-restore`.

### 4.8 Hardcoded strings
Komunikaty bledow sa hardcoded w roznych jezykach (EN/PL mix).

---

## 5. BEZPIECZENSTWO

### 5.1 Autentykacja - OK
- Session + API key auth dziala poprawnie
- API keys sa hashowane SHA256
- Walidacja formatu klucza (`pk_live_` / `pk_test_`)

### 5.2 Rate Limiting - OK
- Redis + in-memory fallback
- 20 requests/15 min dla image processing
- Sliding window implementation

### 5.3 Input Validation - OK (z uwagami)
- Walidacja typu pliku
- Walidacja rozmiaru
- Walidacja parametrow

### 5.4 Potencjalne problemy
- Brak sanityzacji promptow (XSS w zapisanych danych)
- Brak limitu dlugosci promptow
- Base64 w database moze powodowac duze rozmiary rekordow

---

## 6. WYDAJNOSC

### 6.1 Pozytywne
- `resizeForUpscale()` zapobiega OOM
- FAL.ai storage dla duzych plikow
- Sharp dla lokalnych operacji (compress, convert)
- Faithful upscale bez AI (0 kredytow)

### 6.2 Do poprawy
- Brak queue dla dlugich operacji
- Brak progress tracking
- Duze base64 strings w response/database

---

## 7. PODSUMOWANIE ZMIAN DO WYKONANIA

### Priorytet WYSOKI (zrobione):
- [x] Dodano resize w `/api/upscale`
- [x] Naprawiono model w `/api/watermark-remover`
- [x] Zmniejszono limit pikseli w `/api/denoise`

### Priorytet SREDNI (do zrobienia):
- [ ] Dodac `maxDuration` do wszystkich AI endpoints
- [ ] Ujednolicic walidacje rozmiaru plikow
- [ ] Naprawic `/api/remove-background` - uzyc `createUsage()`
- [ ] Dodac typ `face_restore` do `credits-config.ts`
- [ ] Walidacja maski w `/api/inpainting`

### Priorytet NISKI (rekomendacje):
- [ ] Ujednolicic strukture response
- [ ] Dodac retry logic
- [ ] Usunac unused parameters
- [ ] Dodac rzeczywiste wymiary do ProcessedImagesDB
- [ ] Sanityzacja promptow

---

## 8. METRYKI AUDYTU

- **Przeanalyzowane pliki:** 25+
- **API endpoints:** 16
- **Linie kodu:** ~4000
- **Czas audytu:** ~30 min
- **Problemy krytyczne:** 3 (naprawione)
- **Problemy srednie:** 5
- **Rekomendacje:** 8

---

*Raport wygenerowany automatycznie przez Claude Code*
