/**
 * AI Image Generator - Database Functions
 * Handles storage and retrieval of generated images
 */

import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const DATA_DIR = path.join(process.cwd(), 'data');
const GENERATED_IMAGES_FILE = path.join(DATA_DIR, 'generated-images.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface GeneratedImage {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  userImage?: string;

  // Generation parameters
  prompt: string;
  negativePrompt?: string;
  model: string;
  mode: 'text-to-image' | 'image-to-image';
  aspectRatio: string;
  width: number;
  height: number;
  seed?: number;

  // Source image for image-to-image
  sourceImageUrl?: string;

  // Generated output
  outputUrl: string;
  thumbnailUrl?: string;

  // Metadata
  creditsUsed: number;
  processingTime?: number; // milliseconds

  // Privacy & Sharing
  isPublic: boolean;
  likes: number;
  views: number;
  likedBy: string[]; // array of user IDs

  // Timestamps
  createdAt: string;
}

export interface CreateGeneratedImageInput {
  userId: string;
  userEmail: string;
  userName?: string;
  userImage?: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  mode: 'text-to-image' | 'image-to-image';
  aspectRatio: string;
  width: number;
  height: number;
  seed?: number;
  sourceImageUrl?: string;
  outputUrl: string;
  thumbnailUrl?: string;
  creditsUsed: number;
  processingTime?: number;
  isPublic?: boolean;
}

// File helpers
function ensureFile(filePath: string, defaultData: unknown = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

function readJSON<T>(filePath: string, defaultData: T): T {
  ensureFile(filePath, defaultData);
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return defaultData;
  }
}

function writeJSON(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// CRUD Operations

export function getAllGeneratedImages(): GeneratedImage[] {
  return readJSON<GeneratedImage[]>(GENERATED_IMAGES_FILE, []);
}

export function getGeneratedImageById(id: string): GeneratedImage | null {
  const images = getAllGeneratedImages();
  return images.find(img => img.id === id) || null;
}

export function getGeneratedImagesByUserId(userId: string): GeneratedImage[] {
  const images = getAllGeneratedImages();
  return images
    .filter(img => img.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getPublicGalleryImages(options: {
  page?: number;
  limit?: number;
  model?: string;
}): { images: GeneratedImage[]; total: number; hasMore: boolean } {
  const { page = 1, limit = 20, model } = options;

  let images = getAllGeneratedImages()
    .filter(img => img.isPublic);

  if (model) {
    images = images.filter(img => img.model === model);
  }

  // Sort by createdAt descending (newest first)
  images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = images.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedImages = images.slice(startIndex, endIndex);

  return {
    images: paginatedImages,
    total,
    hasMore: endIndex < total,
  };
}

export function createGeneratedImage(input: CreateGeneratedImageInput): GeneratedImage {
  const images = getAllGeneratedImages();

  const newImage: GeneratedImage = {
    ...input,
    id: nanoid(),
    isPublic: input.isPublic ?? false,
    likes: 0,
    views: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
  };

  images.push(newImage);
  writeJSON(GENERATED_IMAGES_FILE, images);

  return newImage;
}

export function updateGeneratedImage(
  id: string,
  updates: Partial<Pick<GeneratedImage, 'isPublic' | 'likes' | 'views' | 'likedBy'>>
): GeneratedImage | null {
  const images = getAllGeneratedImages();
  const index = images.findIndex(img => img.id === id);

  if (index === -1) return null;

  images[index] = {
    ...images[index],
    ...updates,
  };

  writeJSON(GENERATED_IMAGES_FILE, images);
  return images[index];
}

export function deleteGeneratedImage(id: string): boolean {
  const images = getAllGeneratedImages();
  const filtered = images.filter(img => img.id !== id);

  if (filtered.length === images.length) return false;

  writeJSON(GENERATED_IMAGES_FILE, filtered);
  return true;
}

export function toggleLike(imageId: string, userId: string): { liked: boolean; likes: number } | null {
  const images = getAllGeneratedImages();
  const index = images.findIndex(img => img.id === imageId);

  if (index === -1) return null;

  const image = images[index];
  const likedBy = image.likedBy || [];
  const alreadyLiked = likedBy.includes(userId);

  if (alreadyLiked) {
    // Unlike
    images[index] = {
      ...image,
      likedBy: likedBy.filter(id => id !== userId),
      likes: Math.max(0, image.likes - 1),
    };
  } else {
    // Like
    images[index] = {
      ...image,
      likedBy: [...likedBy, userId],
      likes: image.likes + 1,
    };
  }

  writeJSON(GENERATED_IMAGES_FILE, images);

  return {
    liked: !alreadyLiked,
    likes: images[index].likes,
  };
}

export function incrementViews(imageId: string): void {
  const images = getAllGeneratedImages();
  const index = images.findIndex(img => img.id === imageId);

  if (index !== -1) {
    images[index].views += 1;
    writeJSON(GENERATED_IMAGES_FILE, images);
  }
}

export function togglePublic(imageId: string, userId: string): boolean | null {
  const images = getAllGeneratedImages();
  const index = images.findIndex(img => img.id === imageId);

  if (index === -1) return null;

  // Verify ownership
  if (images[index].userId !== userId) return null;

  images[index].isPublic = !images[index].isPublic;
  writeJSON(GENERATED_IMAGES_FILE, images);

  return images[index].isPublic;
}

// Stats
export function getUserGenerationStats(userId: string): {
  totalGenerated: number;
  totalCreditsUsed: number;
  publicImages: number;
  totalLikes: number;
} {
  const images = getAllGeneratedImages().filter(img => img.userId === userId);

  return {
    totalGenerated: images.length,
    totalCreditsUsed: images.reduce((sum, img) => sum + img.creditsUsed, 0),
    publicImages: images.filter(img => img.isPublic).length,
    totalLikes: images.reduce((sum, img) => sum + img.likes, 0),
  };
}
