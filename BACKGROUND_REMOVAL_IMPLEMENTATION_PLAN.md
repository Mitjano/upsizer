# Plan Wdrożenia Background Removal do Pixelift

**Data:** 24 listopada 2024
**Projekt źródłowy:** https://github.com/Mitjano/bg-remover
**Projekt docelowy:** https://github.com/Mitjano/pixelift (Pixelift)

---

## 📋 Podsumowanie Analizy bg-remover

### Architektura bg-remover:
- **Backend:** FastAPI + Python
  - PostgreSQL (baza danych)
  - Redis (cache)
  - rembg (AI - lokalne przetwarzanie)
  - Replicate API (opcjonalne, premium)
  - Stripe (płatności)

- **Frontend:** Next.js 14
  - react-dropzone (drag & drop upload)
  - Axios (HTTP client)
  - JWT authentication

### Kluczowe komponenty do przeniesienia:

#### 1. **Backend - Image Processing Service**
Plik: `backend/app/services/image_processing.py`
- `remove_background()` - główna funkcja usuwania tła
- `_remove_background_rembg()` - lokalne przetwarzanie (rembg)
- `_remove_background_replicate()` - premium API (Replicate)
- `validate_image()` - walidacja plików
- `save_file()` - zapis plików
- `get_image_dimensions()` - wymiary obrazu

#### 2. **Backend - API Routes**
Plik: `backend/app/api/images.py`
- `POST /images/upload` - upload + przetwarzanie (dla zalogowanych)
- `POST /images/instant-upload` - instant demo (bez logowania)
- `GET /images/` - lista obrazów użytkownika
- `GET /images/{id}/download` - pobieranie przetworzonego
- `DELETE /images/{id}` - usuwanie obrazu

#### 3. **Database Model**
Plik: `backend/app/models/image.py`
- Image model z polami: original_path, processed_path, is_processed, file_size, width, height

#### 4. **Dependencies**
```python
rembg==2.0.56          # AI background removal
pillow==10.1.0         # Image processing
replicate==0.25.1      # Premium API (optional)
fastapi==0.104.1       # Web framework
```

---

## 🎯 Plan Adaptacji dla Pixelift (Next.js)

### OPCJA A: Prosta integracja - Next.js API Routes ⭐ POLECANE

Pixelift używa Next.js 15, więc możemy zaimplementować wszystko w JavaScript/TypeScript bez Pythona.

#### Zalety:
- ✅ Jeden stack technologiczny (Next.js)
- ✅ Brak potrzeby dodatkowego backendu Python
- ✅ Łatwiejsze wdrożenie i maintenance
- ✅ Wykorzystanie istniejącego systemu autoryzacji (NextAuth)
- ✅ Wykorzystanie istniejącego file storage

#### Komponenty do stworzenia:

##### 1. **API Route dla usuwania tła**
Lokalizacja: `app/api/remove-background/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import Replicate from 'replicate'

export async function POST(req: NextRequest) {
  // 1. Sprawdź autoryzację
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Sprawdź limity kredytów
  // 3. Pobierz plik z formData
  // 4. Waliduj plik
  // 5. Wywołaj Replicate API
  // 6. Zapisz przetworzony obraz
  // 7. Zaktualizuj kredyty użytkownika
  // 8. Zwróć URL do przetworzonego obrazu
}
```

##### 2. **Service dla Image Processing**
Lokalizacja: `lib/image-processor.ts`

```typescript
export class ImageProcessor {
  static async removeBackground(imageBuffer: Buffer): Promise<Buffer>
  static async validateImage(file: File): Promise<boolean>
  static async saveFile(buffer: Buffer, filename: string): Promise<string>
  static getImageDimensions(buffer: Buffer): Promise<{ width: number, height: number }>
}
```

##### 3. **Frontend Upload Component**
Lokalizacja: `components/BackgroundRemover.tsx`

```typescript
'use client'
import { useDropzone } from 'react-dropzone'
import { useState } from 'react'

export function BackgroundRemover() {
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const onDrop = async (files: File[]) => {
    // Upload i przetwarzanie
  }

  return (
    // UI z drag & drop
  )
}
```

##### 4. **Database Schema Extension**
Dodać do Prisma schema lub JSON database:

```typescript
interface ProcessedImage {
  id: string
  userId: string
  originalPath: string
  processedPath: string
  originalFilename: string
  fileSize: number
  width: number
  height: number
  isProcessed: boolean
  processingError?: string
  createdAt: Date
  processedAt?: Date
}
```

---

### OPCJA B: Hybrydowa - Next.js + Python Microservice

Jeśli chcesz używać rembg (lokalny AI), musisz dodać Python microservice.

#### Zalety:
- ✅ Można używać rembg (darmowe, lokalne przetwarzanie)
- ✅ Lepsza jakość niż tylko Replicate

#### Wady:
- ❌ Wymaga uruchomienia osobnego serwisu Python
- ❌ Bardziej skomplikowane wdrożenie
- ❌ Potrzeba dockera na serwerze

---

## 📝 Szczegółowy Plan Implementacji (OPCJA A - Polecana)

### Faza 1: Setup & Konfiguracja (30 min)

#### 1.1 Instalacja zależności
```bash
npm install replicate
npm install react-dropzone
npm install sharp  # do przetwarzania obrazów
```

#### 1.2 Konfiguracja .env.local
```env
# Replicate API dla background removal
REPLICATE_API_TOKEN=r8_xxx...

# Storage (już masz Firebase)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket

# Limity
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_EXTENSIONS=jpg,jpeg,png,webp
```

#### 1.3 Dodanie do database schema
Jeśli używasz Prisma:
```prisma
model ProcessedImage {
  id              String   @id @default(cuid())
  userId          String
  originalPath    String
  processedPath   String?
  originalFilename String
  fileSize        Int
  width           Int
  height          Int
  isProcessed     Boolean  @default(false)
  processingError String?
  createdAt       DateTime @default(now())
  processedAt     DateTime?

  user User @relation(fields: [userId], references: [id])
}
```

Jeśli używasz JSON files (jak teraz):
```typescript
// data/processed-images.json
{
  "images": [
    {
      "id": "img_123",
      "userId": "user_123",
      "originalPath": "uploads/original/image.jpg",
      "processedPath": "uploads/processed/image.png",
      "originalFilename": "photo.jpg",
      "fileSize": 1234567,
      "width": 1920,
      "height": 1080,
      "isProcessed": true,
      "createdAt": "2024-11-24T18:00:00Z",
      "processedAt": "2024-11-24T18:00:05Z"
    }
  ]
}
```

---

### Faza 2: Backend Implementation (2-3 godziny)

#### 2.1 Image Processing Service
**Plik:** `lib/image-processor.ts`

```typescript
import Replicate from 'replicate'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export class ImageProcessor {
  private static replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN!,
  })

  /**
   * Remove background from image using Replicate API
   */
  static async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Convert buffer to base64 for Replicate
      const base64Image = imageBuffer.toString('base64')
      const dataUri = `data:image/jpeg;base64,${base64Image}`

      // Call Replicate API
      const output = await this.replicate.run(
        "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
        {
          input: {
            image: dataUri
          }
        }
      ) as string

      // Download result
      const response = await fetch(output)
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      throw new Error(`Background removal failed: ${error}`)
    }
  }

  /**
   * Validate uploaded image
   */
  static async validateImage(file: File): Promise<{ valid: boolean; error?: string }> {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760')
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    // Check size
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large. Maximum size is 10MB' }
    }

    // Check type
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Use JPG, PNG, or WEBP' }
    }

    return { valid: true }
  }

  /**
   * Get image dimensions
   */
  static async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    const metadata = await sharp(buffer).metadata()
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    }
  }

  /**
   * Save file to local storage
   */
  static async saveFile(
    buffer: Buffer,
    filename: string,
    subfolder: 'original' | 'processed'
  ): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subfolder)

    // Create directory if not exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const ext = path.extname(filename)
    const name = path.basename(filename, ext)
    const uniqueFilename = `${name}_${timestamp}${ext}`
    const filePath = path.join(uploadDir, uniqueFilename)

    // Save file
    await writeFile(filePath, buffer)

    // Return relative path
    return `uploads/${subfolder}/${uniqueFilename}`
  }
}
```

#### 2.2 Database Helper
**Plik:** `lib/processed-images-db.ts`

```typescript
import fs from 'fs/promises'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'processed-images.json')

export interface ProcessedImage {
  id: string
  userId: string
  originalPath: string
  processedPath: string | null
  originalFilename: string
  fileSize: number
  width: number
  height: number
  isProcessed: boolean
  processingError?: string
  createdAt: string
  processedAt?: string
}

export class ProcessedImagesDB {
  private static async readDB(): Promise<{ images: ProcessedImage[] }> {
    try {
      const data = await fs.readFile(DB_PATH, 'utf-8')
      return JSON.parse(data)
    } catch {
      return { images: [] }
    }
  }

  private static async writeDB(data: { images: ProcessedImage[] }): Promise<void> {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2))
  }

  static async create(image: Omit<ProcessedImage, 'id' | 'createdAt'>): Promise<ProcessedImage> {
    const db = await this.readDB()
    const newImage: ProcessedImage = {
      ...image,
      id: `img_${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    db.images.push(newImage)
    await this.writeDB(db)
    return newImage
  }

  static async update(id: string, updates: Partial<ProcessedImage>): Promise<void> {
    const db = await this.readDB()
    const index = db.images.findIndex(img => img.id === id)
    if (index !== -1) {
      db.images[index] = { ...db.images[index], ...updates }
      await this.writeDB(db)
    }
  }

  static async getByUserId(userId: string): Promise<ProcessedImage[]> {
    const db = await this.readDB()
    return db.images.filter(img => img.userId === userId)
  }

  static async getById(id: string): Promise<ProcessedImage | null> {
    const db = await this.readDB()
    return db.images.find(img => img.id === id) || null
  }

  static async delete(id: string): Promise<void> {
    const db = await this.readDB()
    db.images = db.images.filter(img => img.id !== id)
    await this.writeDB(db)
  }
}
```

#### 2.3 API Route - Remove Background
**Plik:** `app/api/remove-background/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ImageProcessor } from '@/lib/image-processor'
import { ProcessedImagesDB } from '@/lib/processed-images-db'
import { getUserCredits, updateUserCredits } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Check user credits
    const user = await getUserCredits(session.user.email)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.creditsUsed >= user.creditsLimit) {
      return NextResponse.json(
        { error: 'Credit limit reached. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // 3. Get file from formData
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // 4. Validate file
    const validation = await ImageProcessor.validateImage(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // 5. Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 6. Get dimensions
    const dimensions = await ImageProcessor.getImageDimensions(buffer)

    // 7. Save original
    const originalPath = await ImageProcessor.saveFile(
      buffer,
      file.name,
      'original'
    )

    // 8. Create database record
    const imageRecord = await ProcessedImagesDB.create({
      userId: session.user.email,
      originalPath,
      processedPath: null,
      originalFilename: file.name,
      fileSize: file.size,
      width: dimensions.width,
      height: dimensions.height,
      isProcessed: false
    })

    // 9. Process image - remove background
    try {
      const processedBuffer = await ImageProcessor.removeBackground(buffer)

      // Save processed image (as PNG for transparency)
      const processedFilename = file.name.replace(/\.[^.]+$/, '.png')
      const processedPath = await ImageProcessor.saveFile(
        processedBuffer,
        processedFilename,
        'processed'
      )

      // Update record
      await ProcessedImagesDB.update(imageRecord.id, {
        processedPath,
        isProcessed: true,
        processedAt: new Date().toISOString()
      })

      // 10. Update user credits
      await updateUserCredits(session.user.email, user.creditsUsed + 1)

      // 11. Return success
      return NextResponse.json({
        success: true,
        image: {
          id: imageRecord.id,
          originalUrl: `/${originalPath}`,
          processedUrl: `/${processedPath}`,
          filename: file.name
        }
      })

    } catch (processingError) {
      // Update record with error
      await ProcessedImagesDB.update(imageRecord.id, {
        processingError: String(processingError),
        isProcessed: false
      })

      throw processingError
    }

  } catch (error) {
    console.error('Background removal error:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}
```

#### 2.4 API Route - Get User Images
**Plik:** `app/api/processed-images/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ProcessedImagesDB } from '@/lib/processed-images-db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const images = await ProcessedImagesDB.getByUserId(session.user.email)
  return NextResponse.json({ images })
}
```

#### 2.5 API Route - Download Image
**Plik:** `app/api/processed-images/[id]/download/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ProcessedImagesDB } from '@/lib/processed-images-db'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const image = await ProcessedImagesDB.getById(params.id)
  if (!image || image.userId !== session.user.email) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  if (!image.isProcessed || !image.processedPath) {
    return NextResponse.json({ error: 'Image not processed' }, { status: 400 })
  }

  const filePath = path.join(process.cwd(), 'public', image.processedPath)
  const fileBuffer = await readFile(filePath)

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${path.basename(image.processedPath)}"`
    }
  })
}
```

---

### Faza 3: Frontend Implementation (2-3 godziny)

#### 3.1 Upload Component
**Plik:** `components/BackgroundRemover.tsx`

```typescript
'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'

interface ProcessingResult {
  id: string
  originalUrl: string
  processedUrl: string
  filename: string
}

export function BackgroundRemover() {
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setProcessing(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/remove-background', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process image')
      }

      const data = await response.json()
      setResult(data.image)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setProcessing(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: processing
  })

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Upload Area */}
      {!result && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400'
          } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />

          <div className="space-y-4">
            <div className="text-6xl">📸</div>

            {processing ? (
              <>
                <h3 className="text-xl font-semibold">Processing...</h3>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold">
                  {isDragActive ? 'Drop it here!' : 'Drag & drop your image'}
                </h3>
                <p className="text-gray-600">
                  or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports JPG, PNG, WEBP • Max 10MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original */}
            <div className="space-y-2">
              <h4 className="font-semibold">Original</h4>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={result.originalUrl}
                  alt="Original"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Processed */}
            <div className="space-y-2">
              <h4 className="font-semibold">Background Removed</h4>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                <Image
                  src={result.processedUrl}
                  alt="Processed"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <a
              href={`/api/processed-images/${result.id}/download`}
              download
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Download
            </a>
            <button
              onClick={() => setResult(null)}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Process Another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

#### 3.2 Gallery Component
**Plik:** `components/ProcessedImagesGallery.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface ProcessedImage {
  id: string
  originalPath: string
  processedPath: string
  originalFilename: string
  createdAt: string
}

export function ProcessedImagesGallery() {
  const [images, setImages] = useState<ProcessedImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadImages() {
      try {
        const response = await fetch('/api/processed-images')
        const data = await response.json()
        setImages(data.images)
      } catch (error) {
        console.error('Failed to load images:', error)
      } finally {
        setLoading(false)
      }
    }

    loadImages()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No processed images yet. Upload an image to get started!
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((image) => (
        <div key={image.id} className="border rounded-lg overflow-hidden">
          <div className="relative aspect-square bg-gradient-to-br from-purple-100 to-pink-100">
            <Image
              src={`/${image.processedPath}`}
              alt={image.originalFilename}
              fill
              className="object-contain"
            />
          </div>
          <div className="p-4">
            <p className="text-sm font-medium truncate">{image.originalFilename}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(image.createdAt).toLocaleDateString()}
            </p>
            <a
              href={`/api/processed-images/${image.id}/download`}
              download
              className="mt-2 block text-center py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Download
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
```

#### 3.3 Dodać do strony
**Plik:** `app/tools/remove-background/page.tsx`

```typescript
import { BackgroundRemover } from '@/components/BackgroundRemover'
import { ProcessedImagesGallery } from '@/components/ProcessedImagesGallery'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function RemoveBackgroundPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">
          AI Background Remover
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Upload an image and remove its background instantly using AI
        </p>

        <BackgroundRemover />

        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Your Processed Images</h2>
          <ProcessedImagesGallery />
        </div>
      </div>
    </div>
  )
}
```

---

### Faza 4: Integration & Testing (1-2 godziny)

#### 4.1 Dodać do głównego menu
W `components/Header.tsx` dodaj link:

```tsx
<Link href="/tools/remove-background">
  Remove Background
</Link>
```

#### 4.2 Dodać do strony głównej
W `app/page.tsx` dodaj CTA:

```tsx
<section className="py-20">
  <h2 className="text-3xl font-bold text-center mb-4">
    AI Background Remover
  </h2>
  <p className="text-center text-gray-600 mb-8">
    Remove backgrounds from images in seconds
  </p>
  <div className="text-center">
    <Link
      href="/tools/remove-background"
      className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Try Now
    </Link>
  </div>
</section>
```

#### 4.3 Testy
1. ✅ Upload i przetwarzanie obrazu
2. ✅ Walidacja plików (rozmiar, typ)
3. ✅ Sprawdzenie limitów kredytów
4. ✅ Pobieranie przetworzonego obrazu
5. ✅ Wyświetlanie galerii
6. ✅ Error handling

---

## 📊 Porównanie opcji implementacji

| Aspekt | OPCJA A (Next.js only) | OPCJA B (Next.js + Python) |
|--------|------------------------|----------------------------|
| **Technologia** | TypeScript + Replicate API | TypeScript + Python + rembg |
| **Złożoność** | ⭐⭐ Średnia | ⭐⭐⭐⭐ Wysoka |
| **Koszt** | $0.0002-0.001 per image | Darmowe (local) + server costs |
| **Jakość** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Very Good |
| **Szybkość** | 3-7 sekund | 2-5 sekund |
| **Wdrożenie** | Łatwe (Vercel) | Średnie (Docker) |
| **Maintenance** | Łatwy | Średni |
| **Skalowanie** | Automatyczne | Wymaga konfiguracji |

---

## 🚀 Rekomendacja

### **POLECAM OPCJĘ A** (Next.js + Replicate API)

**Powody:**
1. ✅ Prostsza implementacja (3-6 godzin vs 1-2 dni)
2. ✅ Łatwiejsze wdrożenie (działa na Vercel bez zmian)
3. ✅ Lepsza jakość (BRIA RMBG 2.0 - state-of-the-art)
4. ✅ Nie wymaga dodatkowego serwera Python
5. ✅ Koszt bardzo niski ($0.0002-0.001 per obraz)
6. ✅ Automatyczne skalowanie
7. ✅ Jeden stack technologiczny (łatwiejszy maintenance)

**Koszt przykładowy:**
- 1,000 obrazów/miesiąc = ~$0.50-1.00
- 10,000 obrazów/miesiąc = ~$5-10
- 100,000 obrazów/miesiąc = ~$50-100

Możesz to łatwo pokryć w planie Basic/Pro subscription.

---

## ✅ Checklist Implementacji

### Setup
- [ ] Zainstalować zależności (replicate, react-dropzone, sharp)
- [ ] Dodać REPLICATE_API_TOKEN do .env.local
- [ ] Utworzyć katalog data/processed-images.json

### Backend
- [ ] Stworzyć lib/image-processor.ts
- [ ] Stworzyć lib/processed-images-db.ts
- [ ] Stworzyć app/api/remove-background/route.ts
- [ ] Stworzyć app/api/processed-images/route.ts
- [ ] Stworzyć app/api/processed-images/[id]/download/route.ts

### Frontend
- [ ] Stworzyć components/BackgroundRemover.tsx
- [ ] Stworzyć components/ProcessedImagesGallery.tsx
- [ ] Stworzyć app/tools/remove-background/page.tsx
- [ ] Dodać link w Header.tsx
- [ ] Dodać CTA na stronie głównej

### Testing
- [ ] Test uploadu obrazu
- [ ] Test walidacji plików
- [ ] Test limitów kredytów
- [ ] Test pobierania obrazu
- [ ] Test galerii
- [ ] Test error handling

### Deployment
- [ ] Push na GitHub
- [ ] Deploy na serwer (git pull + npm install + npm run build)
- [ ] Sprawdzić czy działa na produkcji
- [ ] Monitorować logi

---

## 📞 Wsparcie

Jeśli napotkasz problemy podczas implementacji:
1. Sprawdź logi: `npm run dev` (local) lub `pm2 logs pixelift-web` (production)
2. Sprawdź czy REPLICATE_API_TOKEN jest ustawiony
3. Sprawdź czy katalog uploads/ ma odpowiednie uprawnienia
4. Sprawdź limity kredytów użytkownika

---

**Czas implementacji:** 5-8 godzin
**Trudność:** ⭐⭐⭐ Średnia
**ROI:** ⭐⭐⭐⭐⭐ Bardzo wysoki (główna funkcja SaaS)

---

**Autor:** Claude Code
**Data:** 24 listopada 2024
**Wersja:** 1.0
