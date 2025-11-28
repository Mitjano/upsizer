# Plan Wdrożenia: AI Image Generator

## Przegląd Projektu

Stworzenie nowej sekcji "AI Image" w stylu Artlist.io, umożliwiającej generowanie obrazów z tekstu (Text-to-Image) oraz edycję obrazów za pomocą tekstu (Image-to-Image).

---

## 1. Architektura Funkcjonalności

### 1.1 Główne Tryby Generowania

| Tryb | Opis | Model Replicate |
|------|------|-----------------|
| **Text to Image** | Generowanie obrazu z opisu tekstowego | `black-forest-labs/flux-1.1-pro` |
| **Image to Image** | Edycja/transformacja obrazu z promptem | `black-forest-labs/flux-kontext-pro` |

### 1.2 Dostępne Modele

#### Text to Image:
| Model | ID Replicate | Koszt | Opis |
|-------|--------------|-------|------|
| Nano Banana Pro | `google/nano-banana-pro` | $0.15 | Google Gemini 3 - najlepszy tekst na obrazach, do 14 ref. obrazów |
| Flux 2.0 Pro | `black-forest-labs/flux-2-pro` | $0.05 | Najwyższa jakość, 8 obrazów referencyjnych |
| Flux 1.1 Pro Ultra | `black-forest-labs/flux-1.1-pro-ultra` | $0.06 | 4MP, tryb "raw" dla fotorealizmu |
| Flux 1.1 Pro | `black-forest-labs/flux-1.1-pro` | $0.04 | Doskonała jakość, szybki |
| Flux Schnell | `black-forest-labs/flux-schnell` | $0.003 | Najszybszy, do prototypów |

#### Image to Image:
| Model | ID Replicate | Koszt | Opis |
|-------|--------------|-------|------|
| Nano Banana Pro | `google/nano-banana-pro` | $0.15 | Google Gemini 3 - edycja z 14 obrazami ref. |
| Flux Kontext Pro | `black-forest-labs/flux-kontext-pro` | $0.04 | Edycja obrazu tekstem |

### 1.3 Proporcje Obrazu (Aspect Ratios)

| Nazwa | Proporcje | Zastosowanie |
|-------|-----------|--------------|
| Landscape | 16:9 | Filmy, prezentacje |
| Portrait | 9:16 | Stories, mobile |
| Square | 1:1 | Social media |
| 4:3 | 4:3 | Zdjęcia tradycyjne |
| 3:2 | 3:2 | Fotografia |
| 21:9 | 21:9 | Ultrawide |

### 1.4 Liczba Generowanych Obrazów

| Ilość | Mnożnik Kredytów |
|-------|------------------|
| 1 obraz | 1x |
| 2 obrazy | 2x |
| 3 obrazy | 3x |
| 4 obrazy | 4x |

---

## 2. Koszty Kredytów

### 2.1 Text to Image
| Model | Kredyty za 1 obraz |
|-------|-------------------|
| Flux Schnell (Fast) | 1 kredyt |
| Flux 1.1 Pro | 2 kredyty |
| Flux 1.1 Pro Ultra | 3 kredyty |
| Flux 2.0 Pro | 4 kredyty |
| Nano Banana Pro | 5 kredytów |

### 2.2 Image to Image
| Model | Kredyty za 1 obraz |
|-------|-------------------|
| Flux Kontext Pro | 2 kredyty |
| Nano Banana Pro | 5 kredytów |

---

## 3. Struktura Bazy Danych

### 3.1 Nowa Tabela: `GeneratedImage`

```prisma
model GeneratedImage {
  id              String   @id @default(cuid())
  userId          String
  prompt          String   @db.Text
  negativePrompt  String?  @db.Text
  model           String   // flux-1.1-pro, flux-kontext-pro, etc.
  mode            String   // text-to-image, image-to-image
  aspectRatio     String   // 16:9, 9:16, 1:1, etc.
  width           Int
  height          Int
  seed            Int?

  // Source image for image-to-image
  sourceImageUrl  String?

  // Generated output
  outputUrl       String
  thumbnailUrl    String?

  // Metadata
  creditsUsed     Int
  processingTime  Int?     // milliseconds

  // Privacy & Sharing
  isPublic        Boolean  @default(false)
  likes           Int      @default(0)
  views           Int      @default(0)

  // Timestamps
  createdAt       DateTime @default(now())

  // Relations
  user            User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([isPublic, createdAt])
  @@index([model])
}
```

### 3.2 Aktualizacja User Model

```prisma
model User {
  // ... existing fields
  generatedImages GeneratedImage[]
}
```

---

## 4. Struktura Plików

```
app/
├── ai-image/
│   ├── page.tsx              # Główna strona AI Image
│   ├── layout.tsx            # Layout z nawigacją
│   └── my-creations/
│       └── page.tsx          # Moje kreacje użytkownika

app/api/
├── ai-image/
│   ├── generate/
│   │   └── route.ts          # POST - generowanie obrazu
│   ├── gallery/
│   │   └── route.ts          # GET - publiczna galeria
│   ├── my-creations/
│   │   └── route.ts          # GET - kreacje użytkownika
│   └── [id]/
│       ├── route.ts          # GET/DELETE - szczegóły obrazu
│       ├── like/
│       │   └── route.ts      # POST - polubienie
│       └── publish/
│           └── route.ts      # POST - opublikuj/ukryj

components/
├── ai-image/
│   ├── AIImageGenerator.tsx  # Główny komponent generatora
│   ├── ModelSelector.tsx     # Wybór modelu AI
│   ├── AspectRatioSelector.tsx # Wybór proporcji
│   ├── ImageCountSelector.tsx  # Wybór ilości obrazów
│   ├── ModeToggle.tsx        # Text-to-Image / Image-to-Image
│   ├── PromptInput.tsx       # Pole tekstowe prompta
│   ├── ImageUploader.tsx     # Upload dla image-to-image
│   ├── EnhancePrompt.tsx     # Przycisk "Enhance" prompta
│   ├── GenerationResult.tsx  # Wyświetlanie wygenerowanych obrazów
│   ├── ExploreGallery.tsx    # Galeria Explore
│   ├── ImageModal.tsx        # Modal ze szczegółami obrazu
│   └── CreationCard.tsx      # Karta pojedynczej kreacji

lib/
├── ai-image/
│   ├── models.ts             # Definicje modeli i kosztów
│   ├── generate.ts           # Funkcje generowania
│   └── prompts.ts            # Pomocnicze prompty
```

---

## 5. Interfejs Użytkownika

### 5.1 Główna Strona (ai-image/page.tsx)

```
┌─────────────────────────────────────────────────────────────────┐
│  Transform your ideas into stunning visuals                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [📷] [🎬] │ Text to Image │ Image to Image │    [✨ Enhance]││
│  ├─────────────────────────────────────────────────────────────┤│
│  │                                                             ││
│  │  Describe the image you want to create, in any language    ││
│  │  ____________________________________________________________││
│  │                                                             ││
│  │  [Image upload area - tylko dla Image to Image]            ││
│  │                                                             ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  [Flux 2.0 Pro ▼]  [16:9 ▼]  [1 image ▼]   [Generate 💫]   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Generate free: 2 images, 1 video                               │
├─────────────────────────────────────────────────────────────────┤
│  Explore │ My Creations                                         │
│  ─────────                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                           │
│  │ 🎬   │ │ 🎬   │ │      │ │      │                           │
│  │ img1 │ │ img2 │ │ img3 │ │ img4 │                           │
│  └──────┘ └──────┘ └──────┘ └──────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Modal Szczegółów Obrazu

```
┌─────────────────────────────────────────────────────────────────┐
│                                               [X]               │
│  ┌─────────────────────┐  Prompt [📋]                          │
│  │                     │  "two people floating mid-air against │
│  │                     │   a vast blue sky, viewed from a low  │
│  │     Generated       │   angle, soft warm sunlight..."       │
│  │       Image         │                                       │
│  │                     │  [Read more]                          │
│  │                     │                                       │
│  │                     │  Settings                             │
│  │                     │  Model: Flux 2.0 Pro                  │
│  │                     │  Aspect Ratio: 1:1                    │
│  │                     │  Resolution: 1024x1024                │
│  └─────────────────────┘                                       │
│                          [♥ Like] [💾 Download] [🔗 Share]     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. API Endpoints

### 6.1 POST /api/ai-image/generate

**Request:**
```typescript
{
  prompt: string;
  mode: 'text-to-image' | 'image-to-image';
  model: 'flux-schnell' | 'flux-1.1-pro' | 'flux-2.0-pro' | 'flux-kontext-pro' | 'nano-banana-pro';
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '3:2';
  numImages: 1 | 2 | 3 | 4;
  sourceImage?: string; // base64 dla image-to-image
  seed?: number;
  isPublic?: boolean;
}
```

**Response:**
```typescript
{
  success: true;
  images: Array<{
    id: string;
    url: string;
    thumbnailUrl: string;
  }>;
  creditsUsed: number;
  creditsRemaining: number;
}
```

### 6.2 GET /api/ai-image/gallery

**Query params:**
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `model`: string (optional)

**Response:**
```typescript
{
  images: Array<{
    id: string;
    thumbnailUrl: string;
    prompt: string;
    model: string;
    aspectRatio: string;
    user: { name: string; image: string };
    likes: number;
    createdAt: string;
  }>;
  hasMore: boolean;
  total: number;
}
```

### 6.3 GET /api/ai-image/[id]

**Response:**
```typescript
{
  id: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  width: number;
  height: number;
  outputUrl: string;
  seed?: number;
  likes: number;
  views: number;
  createdAt: string;
  user: {
    name: string;
    image: string;
  };
}
```

---

## 7. Integracja z Replicate API

### 7.1 Text to Image (Flux 1.1 Pro)

```typescript
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const output = await replicate.run("black-forest-labs/flux-1.1-pro", {
  input: {
    prompt: userPrompt,
    aspect_ratio: aspectRatio, // "16:9", "9:16", "1:1"
    output_format: "webp",
    output_quality: 90,
    safety_tolerance: 2,
    prompt_upsampling: true, // dla lepszych wyników
  }
});
```

### 7.2 Image to Image (Flux Kontext Pro)

```typescript
const output = await replicate.run("black-forest-labs/flux-kontext-pro", {
  input: {
    prompt: editPrompt,
    input_image: sourceImageUrl,
    aspect_ratio: "match_input_image", // lub konkretny
    output_format: "png",
    safety_tolerance: 2,
  }
});
```

### 7.3 Nano Banana Pro (Google Gemini 3)

```typescript
const output = await replicate.run("google/nano-banana-pro", {
  input: {
    prompt: userPrompt,
    aspect_ratio: aspectRatio, // "16:9", "9:16", "1:1", "4:3"
    resolution: "2K", // "1K", "2K", "4K"
    output_format: "png",
    safety_filter_level: "block_medium_and_above",
    // Opcjonalnie - obrazy referencyjne (do 14)
    image_1: referenceImageUrl1,
    image_2: referenceImageUrl2,
  }
});
```

**Zalety Nano Banana Pro:**
- Najlepsze renderowanie tekstu na obrazach (plakaty, infografiki)
- Do 14 obrazów referencyjnych dla spójności
- Rozdzielczość do 4K
- Integracja z Google Search dla aktualnych informacji

---

## 8. Fazy Wdrożenia

### Faza 1: Backend & Baza Danych (2-3 dni)
1. Dodanie modelu GeneratedImage do Prisma
2. Migracja bazy danych
3. Utworzenie lib/ai-image/models.ts z definicjami modeli
4. API route: POST /api/ai-image/generate
5. API route: GET /api/ai-image/gallery
6. API route: GET /api/ai-image/[id]
7. Integracja z Replicate (text-to-image)
8. Integracja z Replicate (image-to-image)

### Faza 2: Komponenty UI (2-3 dni)
1. AIImageGenerator.tsx - główny komponent
2. ModelSelector.tsx - dropdown z modelami
3. AspectRatioSelector.tsx - wybór proporcji
4. ImageCountSelector.tsx - wybór ilości
5. ModeToggle.tsx - przełącznik trybu
6. PromptInput.tsx - textarea z enhance
7. GenerationResult.tsx - wyświetlanie wyników

### Faza 3: Galeria Explore (1-2 dni)
1. ExploreGallery.tsx - siatka z infinite scroll
2. ImageModal.tsx - modal ze szczegółami
3. CreationCard.tsx - karta obrazu
4. API endpoint dla like/unlike
5. Kopiowanie promptu do schowka

### Faza 4: My Creations (1 dzień)
1. Strona /ai-image/my-creations
2. Lista kreacji użytkownika
3. Opcja publikowania/ukrywania
4. Opcja usuwania

### Faza 5: Enhance Prompt (1 dzień)
1. Integracja z OpenAI GPT-4
2. Przycisk "Enhance" przy promptach
3. Automatyczne ulepszanie promptów

### Faza 6: Testy i Optymalizacja (1-2 dni)
1. Testy wszystkich modeli
2. Optymalizacja ładowania obrazów
3. Obsługa błędów
4. Rate limiting
5. Walidacja inputów

---

## 9. Rozszerzenia na Przyszłość

1. **Video Generation** - integracja z modelami wideo (Kling, Runway)
2. **Image Variations** - generowanie wariantów obrazu
3. **Prompt History** - zapisywanie ulubionych promptów
4. **Collections** - organizacja obrazów w kolekcje
5. **Social Features** - komentarze, udostępnianie
6. **API Access** - dostęp przez API dla developerów

---

## 10. Estymacja Kosztów Replicate

| Model | Koszt za obraz | Przy 1000 generacji/dzień |
|-------|---------------|---------------------------|
| Flux Schnell | $0.003 | $3/dzień |
| Flux 1.1 Pro | $0.04 | $40/dzień |
| Flux 2.0 Pro | $0.05 | $50/dzień |
| Flux Kontext Pro | $0.04 | $40/dzień |
| Nano Banana Pro (2K) | $0.15 | $150/dzień |
| Nano Banana Pro (4K) | $0.30 | $300/dzień |

**Rekomendacja**: Domyślny model Flux 1.1 Pro z opcją Schnell dla darmowych użytkowników. Nano Banana Pro jako opcja premium dla użytkowników potrzebujących tekstu na obrazach lub spójności postaci.

---

## 11. Wymagane Zmienne Środowiskowe

```env
# Już istnieje
REPLICATE_API_TOKEN=xxx

# Nowe (opcjonalne - dla enhance)
OPENAI_API_KEY=xxx
```

---

## 12. Checklist Przed Wdrożeniem

- [ ] Prisma schema zaktualizowany
- [ ] Migracja wykonana
- [ ] API endpoints działają
- [ ] Komponenty UI gotowe
- [ ] Galeria Explore działa
- [ ] System kredytów zintegrowany
- [ ] Rate limiting skonfigurowany
- [ ] Obsługa błędów zaimplementowana
- [ ] Responsywność sprawdzona
- [ ] Testy na produkcji
