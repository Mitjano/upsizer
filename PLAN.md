# Plan: System wyświetlania kosztów kredytowych

## Cel
Stworzyć spójny, scentralizowany system informowania użytkowników o kosztach kredytowych przed i po przetwarzaniu obrazów.

---

## Faza 1: Centralna konfiguracja kredytów

### 1.1 Utworzenie pliku `lib/credits-config.ts`

Jeden plik z wszystkimi kosztami kredytowymi:

```typescript
export const CREDIT_COSTS = {
  upscale: {
    base: 1,
    qualityBoost: 2,
  },
  removeBackground: 1,
  colorize: 1,
  compress: 1,
  denoise: 1,
  expand: 2,
  objectRemoval: 2,
  packshot: 2,
  reimagine: 3,        // per wariant
  backgroundGenerate: 3,
  styleTransfer: 4,
  structureControl: 4,
  inpainting: 5,
} as const;
```

### 1.2 Aktualizacja API routes
Zamiana hardkodowanych wartości na import z centralnej konfiguracji.

**Pliki do zmiany:**
- `app/api/upscale/route.ts`
- `app/api/remove-background/route.ts`
- `app/api/colorize/route.ts`
- `app/api/compress-image/route.ts`
- `app/api/denoise/route.ts`
- `app/api/expand-image/route.ts`
- `app/api/object-removal/route.ts`
- `app/api/generate-packshot/route.ts`
- `app/api/reimagine/route.ts`
- `app/api/background-generate/route.ts`
- `app/api/style-transfer/route.ts`
- `app/api/structure-control/route.ts`
- `app/api/inpainting/route.ts`

---

## Faza 2: Komponent CreditCostBadge

### 2.1 Utworzenie `components/shared/CreditCostBadge.tsx`

```typescript
interface CreditCostBadgeProps {
  cost: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'warning' | 'dynamic';
  tooltip?: string;
}
```

**Warianty:**
- `default` - standardowy koszt (zielony)
- `warning` - wyższy koszt (żółty/pomarańczowy)
- `dynamic` - zmienny koszt (niebieski z ikoną info)

### 2.2 Wygląd komponentu

```
┌─────────────────┐
│ 🪙 2 kredyty   │  <- default
└─────────────────┘

┌─────────────────┐
│ 🪙 5 kredytów  │  <- warning (wyższy koszt)
└─────────────────┘

┌─────────────────────────┐
│ 🪙 3-12 kredytów  ⓘ   │  <- dynamic (reimagine)
└─────────────────────────┘
```

---

## Faza 3: Integracja z komponentami narzędzi

### 3.1 Lista komponentów do aktualizacji

| Komponent | Plik | Koszt | Typ |
|-----------|------|-------|-----|
| ImageUpscaler | `components/ImageUpscaler.tsx` | 1-2 | dynamic |
| BackgroundRemover | `components/BackgroundRemover.tsx` | 1 | default |
| ImageColorizer | `components/ImageColorizer.tsx` | 1 | default |
| ImageCompressor | `components/ImageCompressor.tsx` | 1 | default |
| ImageDenoiser | `components/ImageDenoiser.tsx` | 1 | default |
| ImageExpander | `components/ImageExpander.tsx` | 2 | default |
| ObjectRemover | `components/ObjectRemover.tsx` | 2 | default |
| PackshotGenerator | `components/PackshotGenerator.tsx` | 2 | default |
| ImageReimagine | `components/ImageReimagine.tsx` | 3-12 | dynamic |
| BackgroundGenerator | `components/BackgroundGenerator.tsx` | 3 | default |
| StyleTransfer | `components/StyleTransfer.tsx` | 4 | warning |
| StructureControl | `components/StructureControl.tsx` | 4 | warning |
| Inpainting | `components/Inpainting.tsx` | 5 | warning |

### 3.2 Miejsca wyświetlania kosztu

1. **Przed uploadem** - w nagłówku sekcji uploadera
2. **Po uploadzie** - obok przycisku "Process"
3. **Przy opcjach** - dla narzędzi ze zmiennym kosztem (upscaler, reimagine)

---

## Faza 4: Aktualizacja stron narzędzi

### 4.1 Sekcja statystyk na stronach `/tools/*`

Aktualne strony pokazują statystyki (czas, jakość, itp.). Dodać koszt kredytowy.

**Pliki:**
- `app/[locale]/tools/upscaler/page.tsx`
- `app/[locale]/tools/remove-background/page.tsx`
- `app/[locale]/tools/colorize/page.tsx`
- `app/[locale]/tools/image-compressor/page.tsx`
- `app/[locale]/tools/restore/page.tsx` (denoise)
- `app/[locale]/tools/image-expand/page.tsx`
- `app/[locale]/tools/object-removal/page.tsx`
- `app/[locale]/tools/packshot-generator/page.tsx`
- `app/[locale]/tools/reimagine/page.tsx`
- `app/[locale]/tools/background-generator/page.tsx`
- `app/[locale]/tools/style-transfer/page.tsx`
- `app/[locale]/tools/structure-control/page.tsx`
- `app/[locale]/tools/inpainting/page.tsx`

---

## Faza 5: Tłumaczenia

### 5.1 Dodanie kluczy tłumaczeń

```json
// messages/*/common.json
{
  "credits": {
    "cost": "Koszt",
    "credit": "kredyt",
    "credits": "kredyty",
    "creditsGenitive": "kredytów",
    "perImage": "za obraz",
    "perVariant": "za wariant",
    "total": "Łącznie",
    "remaining": "Pozostało",
    "insufficient": "Niewystarczająca liczba kredytów",
    "required": "Wymagane",
    "available": "Dostępne"
  }
}
```

---

## Faza 6: Ulepszone komunikaty błędów

### 6.1 Komponent `InsufficientCreditsModal`

Modal wyświetlany gdy użytkownik nie ma wystarczającej liczby kredytów:

```
┌────────────────────────────────────────┐
│  ⚠️  Niewystarczająca liczba kredytów │
│                                        │
│  Potrzebujesz: 5 kredytów              │
│  Masz: 2 kredyty                       │
│                                        │
│  [Kup kredyty]  [Anuluj]              │
└────────────────────────────────────────┘
```

---

## Faza 7: Dashboard - podsumowanie kosztów

### 7.1 Sekcja w dashboardzie użytkownika

Dodać widoczność ile kredytów zużywa każde narzędzie w `/dashboard` lub `/dashboard/settings`.

---

## Kolejność implementacji

1. **Faza 1** - Centralna konfiguracja (fundament)
2. **Faza 2** - Komponent CreditCostBadge
3. **Faza 3** - Integracja z komponentami narzędzi
4. **Faza 4** - Aktualizacja stron narzędzi
5. **Faza 5** - Tłumaczenia
6. **Faza 6** - Modal niewystarczających kredytów
7. **Faza 7** - Dashboard

---

## Podsumowanie zmian

### Nowe pliki:
- `lib/credits-config.ts`
- `components/shared/CreditCostBadge.tsx`
- `components/shared/InsufficientCreditsModal.tsx`

### Zmodyfikowane pliki:
- 13 API routes
- 13 komponentów narzędzi
- 13 stron narzędzi
- 4 pliki tłumaczeń (en, pl, es, fr)

### Korzyści:
1. Jedno źródło prawdy dla kosztów kredytowych
2. Użytkownik zawsze wie ile zapłaci przed przetwarzaniem
3. Spójny UX we wszystkich narzędziach
4. Łatwa zmiana cen w jednym miejscu
5. Lepsza obsługa błędów (niewystarczające kredyty)
