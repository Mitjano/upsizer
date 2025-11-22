# Pixelift.pl - Multi-Tool Photo Editor Implementation

## 🎯 Vision: Transform pixelift.pl into a Multi-Tool AI Photo Editor

### Current State:
- Single tool: AI Upscaler (Real-ESRGAN)
- Navigation: Features, Pricing, Blog, FAQ

### Target State:
- Multi-tool platform: Upscaler + Background Remover + (future tools)
- Navigation: **Tools dropdown**, Pricing, Blog, FAQ

---

## 📐 New Navigation Structure

### Before:
```
[Logo] Features | Pricing | Blog | FAQ [Get Started]
```

### After:
```
[Logo] Tools ▼ | Pricing | Blog | FAQ [Get Started]
       ├─ Image Upscaler
       ├─ Background Remover
       └─ (Face Restoration - future)
```

---

## 🔧 Implementation Steps

### Step 1: Create Unified Tools Layout

**New file**: `/components/ToolsLayout.tsx`

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Tool {
  name: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
}

const tools: Tool[] = [
  {
    name: 'Image Upscaler',
    href: '/tools/upscaler',
    description: 'Enhance and enlarge images up to 8x',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
    ),
  },
  {
    name: 'Background Remover',
    href: '/tools/remove-bg',
    description: 'Remove backgrounds with AI precision',
    badge: 'NEW',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
];

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Tools Navigation Bar */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-lg sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-4">
            {tools.map((tool) => {
              const isActive = pathname === tool.href;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`flex items-center gap-3 px-6 py-3 rounded-lg whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {tool.icon}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{tool.name}</span>
                      {tool.badge && (
                        <span className="px-2 py-0.5 text-xs bg-green-500 text-white rounded-full">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{tool.description}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tool Content */}
      <main>{children}</main>
    </div>
  );
}
```

---

### Step 2: Update Header Navigation

**Update**: `/components/Header.tsx` (or wherever your header is)

```typescript
'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowToolsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              PixelLift
            </span>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {/* Tools Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                className="flex items-center gap-1 text-gray-300 hover:text-white font-medium transition-colors"
              >
                Tools
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showToolsDropdown ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showToolsDropdown && (
                <div className="absolute left-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                  <div className="py-2">
                    {/* Image Upscaler */}
                    <Link
                      href="/tools/upscaler"
                      onClick={() => setShowToolsDropdown(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-700 transition-colors"
                    >
                      <div className="mt-1 text-purple-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-white">Image Upscaler</div>
                        <div className="text-sm text-gray-400">Enhance images up to 8x resolution</div>
                      </div>
                    </Link>

                    {/* Background Remover */}
                    <Link
                      href="/tools/remove-bg"
                      onClick={() => setShowToolsDropdown(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-700 transition-colors"
                    >
                      <div className="mt-1 text-pink-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">Background Remover</span>
                          <span className="px-2 py-0.5 text-xs bg-green-500 text-white rounded-full">
                            NEW
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">Remove backgrounds with AI precision</div>
                      </div>
                    </Link>

                    {/* Coming Soon - Face Restoration */}
                    <div className="flex items-start gap-3 px-4 py-3 opacity-50 cursor-not-allowed">
                      <div className="mt-1 text-blue-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-400">Face Restoration</span>
                          <span className="px-2 py-0.5 text-xs bg-gray-600 text-gray-300 rounded-full">
                            SOON
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">Restore and enhance face photos</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Other Navigation Links */}
            <Link href="/pricing" className="text-gray-300 hover:text-white font-medium transition-colors">
              Pricing
            </Link>
            <Link href="/blog" className="text-gray-300 hover:text-white font-medium transition-colors">
              Blog
            </Link>
            <Link href="/#faq" className="text-gray-300 hover:text-white font-medium transition-colors">
              FAQ
            </Link>

            {/* CTA Button */}
            <Link
              href="/tools/upscaler"
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
```

---

### Step 3: Restructure Upscaler to Tools Route

**Move/Rename**: Current upscaler page → `/app/tools/upscaler/page.tsx`

```typescript
import ToolsLayout from '@/components/ToolsLayout';
import ImageUpscaler from '@/components/ImageUpscaler'; // Your existing upscaler component

export const metadata = {
  title: 'AI Image Upscaler - PixelLift',
  description: 'Enhance and enlarge images up to 8x with AI-powered upscaling',
};

export default function UpscalerPage() {
  return (
    <ToolsLayout>
      <div className="max-w-6xl mx-auto p-6">
        <ImageUpscaler />
      </div>
    </ToolsLayout>
  );
}
```

---

### Step 4: Create Background Remover Page

**New file**: `/app/tools/remove-bg/page.tsx`

```typescript
import ToolsLayout from '@/components/ToolsLayout';
import BackgroundRemover from '@/components/BackgroundRemover';

export const metadata = {
  title: 'AI Background Remover - PixelLift',
  description: 'Remove backgrounds from images with AI precision using BRIA RMBG 2.0',
};

export default function RemoveBackgroundPage() {
  return (
    <ToolsLayout>
      <div className="max-w-6xl mx-auto p-6">
        <BackgroundRemover />
      </div>
    </ToolsLayout>
  );
}
```

---

### Step 5: Create Background Remover Component

**New file**: `/components/BackgroundRemover.tsx`

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

export default function BackgroundRemover() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setProcessedImage(null);

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setOriginalImage(e.target?.result as string);
    reader.readAsDataURL(file);

    // Process
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/remove-background', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process image');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'removed-background.png';
    link.click();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Background Remover
          </span>
        </h1>
        <p className="text-gray-400 text-lg">
          Remove backgrounds from images using state-of-the-art BRIA RMBG 2.0 AI
        </p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-gray-700 hover:border-purple-500 hover:bg-gray-800/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">
              {isDragActive ? 'Drop image here' : 'Drag & drop an image here'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              or click to browse (JPG, PNG, WebP up to 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Processing */}
      {isProcessing && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500/30 border-t-purple-500"></div>
          <p className="mt-4 text-gray-400 font-medium">Removing background with AI...</p>
        </div>
      )}

      {/* Results */}
      {(originalImage || processedImage) && !isProcessing && (
        <div className="grid md:grid-cols-2 gap-8">
          {originalImage && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Original Image</h3>
              <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-700">
                <Image src={originalImage} alt="Original" fill className="object-contain" />
              </div>
            </div>
          )}
          {processedImage && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Background Removed</h3>
              <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%,transparent_75%,#1f2937_75%,#1f2937),linear-gradient(45deg,#1f2937_25%,transparent_25%,transparent_75%,#1f2937_75%,#1f2937)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
                <Image src={processedImage} alt="Processed" fill className="object-contain" />
              </div>
              <button
                onClick={downloadImage}
                className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Download Image
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### Step 6: Create API Route

**New file**: `/app/api/remove-background/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64Image}`;

    // Run BRIA RMBG 2.0
    const output = await replicate.run(
      "bria/remove-background:e62372ec9304f309dc216065f5c6823d477d16c1cd0f34609137d8eae79b5fd1",
      { input: { image: dataUri } }
    );

    if (typeof output === 'string') {
      const imageResponse = await fetch(output);
      const imageBlob = await imageResponse.blob();
      const imageBuffer = await imageBlob.arrayBuffer();

      return new NextResponse(Buffer.from(imageBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'attachment; filename="removed-bg.png"',
        },
      });
    }

    throw new Error('Unexpected output format');
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### Step 7: Update Homepage CTA

**Update**: `/app/page.tsx` - Change CTA buttons to point to tools

```typescript
// Change from:
<Link href="/upload">Get Started</Link>

// To:
<Link href="/tools/upscaler">Try Image Upscaler</Link>
<Link href="/tools/remove-bg">Try Background Remover</Link>
```

---

## 📦 Dependencies

Check `package.json` and install if needed:

```bash
npm install replicate react-dropzone
```

---

## 🎨 Visual Preview

```
┌─────────────────────────────────────────────────────┐
│  PixelLift  [Tools ▼] Pricing  Blog  FAQ  Get Started  │
│             ├─ Image Upscaler                        │
│             ├─ Background Remover [NEW]              │
│             └─ Face Restoration [SOON]               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  [Image Upscaler] [Background Remover] ← Sub-nav    │
└─────────────────────────────────────────────────────┘

        Tool Content Area (Upscaler or BG Remover)
```

---

## ✅ Deployment Checklist

1. [ ] Stworzyć `/components/ToolsLayout.tsx`
2. [ ] Zaktualizować header z dropdown "Tools"
3. [ ] Przenieść upscaler do `/app/tools/upscaler/page.tsx`
4. [ ] Stworzyć `/app/tools/remove-bg/page.tsx`
5. [ ] Stworzyć `/components/BackgroundRemover.tsx`
6. [ ] Stworzyć `/app/api/remove-background/route.ts`
7. [ ] Dodać `REPLICATE_API_TOKEN` do `.env.local`
8. [ ] Zainstalować dependencies
9. [ ] Testować lokalnie
10. [ ] Deploy na production

---

## 🚀 Future Tools to Add

- **Face Restoration** (GFPGAN) - już gotowe w kodzie
- **Object Removal** (LaMa) - ~$0.002/image
- **Photo Colorization** (DDColor) - ~$0.001/image
- **Batch Processing** - Multiple images at once

---

**This transforms pixelift.pl from single-purpose tool into a comprehensive AI photo editing suite!**
