/**
 * AI Music Database Operations
 *
 * Operacje CRUD dla GeneratedMusic i MusicFolder
 */

import { prisma } from '@/lib/prisma';
import type { MusicGenerationStatus, MasteringStatus } from '@/lib/generated/prisma';

export type { MusicGenerationStatus, MasteringStatus };

export interface CreateMusicParams {
  userId: string;
  userEmail: string;
  userName?: string;
  prompt: string;
  enhancedPrompt?: string;
  lyrics?: string;
  style?: string;
  mood?: string;
  model: string;
  provider: string;
  duration: number;
  instrumental?: boolean;
  bpm?: number;
  key?: string;
  genre?: string;
  title?: string;
  folderId?: string;
  creditsReserved: number;
  jobId?: string;
}

export interface UpdateMusicParams {
  status?: MusicGenerationStatus;
  progress?: number;
  jobId?: string;
  audioUrl?: string;
  localPath?: string;
  waveformUrl?: string;
  coverImageUrl?: string;
  masteringStatus?: MasteringStatus;
  masteringIntensity?: string;
  masteredUrl?: string;
  masteredLocalPath?: string;
  masteringProvider?: string;
  masteringJobId?: string;
  masteringCost?: number;
  fileSize?: number;
  actualDuration?: number;
  processingTime?: number;
  sampleRate?: number;
  bitDepth?: number;
  format?: string;
  seed?: number;
  creditsUsed?: number;
  errorMessage?: string;
  errorCode?: string;
  completedAt?: Date;
  masteredAt?: Date;
}

/**
 * Create a new music record
 */
export async function createMusicRecord(params: CreateMusicParams) {
  return prisma.generatedMusic.create({
    data: {
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      prompt: params.prompt,
      enhancedPrompt: params.enhancedPrompt,
      lyrics: params.lyrics,
      style: params.style,
      mood: params.mood,
      model: params.model,
      provider: params.provider,
      duration: params.duration,
      instrumental: params.instrumental || false,
      bpm: params.bpm,
      key: params.key,
      genre: params.genre,
      title: params.title,
      folderId: params.folderId,
      creditsReserved: params.creditsReserved,
      jobId: params.jobId,
      status: 'pending',
      isPublic: true,
    },
  });
}

/**
 * Update music record
 */
export async function updateMusicRecord(id: string, params: UpdateMusicParams) {
  return prisma.generatedMusic.update({
    where: { id },
    data: params,
  });
}

/**
 * Get music by ID
 */
export async function getMusicById(id: string) {
  return prisma.generatedMusic.findUnique({
    where: { id },
    include: {
      folder: true,
    },
  });
}

/**
 * Get music by job ID
 */
export async function getMusicByJobId(jobId: string) {
  return prisma.generatedMusic.findFirst({
    where: { jobId },
  });
}

/**
 * Get user's music tracks
 */
export async function getUserMusic(
  userId: string,
  options: {
    folderId?: string | null;
    status?: MusicGenerationStatus;
    masteringStatus?: MasteringStatus;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'title' | 'duration';
    order?: 'asc' | 'desc';
    search?: string;
  } = {}
) {
  const {
    folderId,
    status,
    masteringStatus,
    limit = 20,
    offset = 0,
    orderBy = 'createdAt',
    order = 'desc',
    search,
  } = options;

  const where: Record<string, unknown> = {
    userId,
  };

  if (folderId !== undefined) {
    where.folderId = folderId;
  }

  if (status) {
    where.status = status;
  }

  if (masteringStatus) {
    where.masteringStatus = masteringStatus;
  }

  // Search in title, prompt, style, mood
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { prompt: { contains: search, mode: 'insensitive' } },
      { style: { contains: search, mode: 'insensitive' } },
      { mood: { contains: search, mode: 'insensitive' } },
    ];
  }

  return prisma.generatedMusic.findMany({
    where,
    orderBy: { [orderBy]: order },
    take: limit,
    skip: offset,
    include: {
      folder: true,
    },
  });
}

/**
 * Count user's music tracks
 */
export async function countUserMusic(
  userId: string,
  options: {
    folderId?: string | null;
    status?: MusicGenerationStatus;
    search?: string;
  } = {}
) {
  const where: Record<string, unknown> = {
    userId,
  };

  if (options.folderId !== undefined) {
    where.folderId = options.folderId;
  }

  if (options.status) {
    where.status = options.status;
  }

  // Search in title, prompt, style, mood
  if (options.search) {
    where.OR = [
      { title: { contains: options.search, mode: 'insensitive' } },
      { prompt: { contains: options.search, mode: 'insensitive' } },
      { style: { contains: options.search, mode: 'insensitive' } },
      { mood: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  return prisma.generatedMusic.count({ where });
}

/**
 * Get public music tracks (for explore page)
 */
export async function getPublicMusic(
  options: {
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'likes' | 'plays';
    order?: 'asc' | 'desc';
  } = {}
) {
  const {
    limit = 20,
    offset = 0,
    orderBy = 'createdAt',
    order = 'desc',
  } = options;

  return prisma.generatedMusic.findMany({
    where: {
      isPublic: true,
      status: 'completed',
    },
    orderBy: { [orderBy]: order },
    take: limit,
    skip: offset,
  });
}

/**
 * Delete music record and files
 */
export async function deleteMusic(id: string) {
  // The actual file deletion should be handled separately
  return prisma.generatedMusic.delete({
    where: { id },
  });
}

/**
 * Set music public/private
 */
export async function setMusicPublic(id: string, isPublic: boolean) {
  return prisma.generatedMusic.update({
    where: { id },
    data: { isPublic },
  });
}

/**
 * Like/unlike music track
 */
export async function likeMusic(id: string, userId: string) {
  const music = await prisma.generatedMusic.findUnique({
    where: { id },
    select: { likedBy: true, likes: true },
  });

  if (!music) return null;

  const isLiked = music.likedBy.includes(userId);

  return prisma.generatedMusic.update({
    where: { id },
    data: {
      likedBy: isLiked
        ? { set: music.likedBy.filter((uid) => uid !== userId) }
        : { push: userId },
      likes: isLiked ? music.likes - 1 : music.likes + 1,
    },
  });
}

/**
 * Increment play count
 */
export async function incrementPlays(id: string) {
  return prisma.generatedMusic.update({
    where: { id },
    data: {
      plays: { increment: 1 },
    },
  });
}

/**
 * Increment view count
 */
export async function incrementViews(id: string) {
  return prisma.generatedMusic.update({
    where: { id },
    data: {
      views: { increment: 1 },
    },
  });
}

/**
 * Move music to folder
 */
export async function moveToFolder(musicId: string, folderId: string | null) {
  return prisma.generatedMusic.update({
    where: { id: musicId },
    data: { folderId },
  });
}

/**
 * Get processing music tracks (for status polling)
 */
export async function getProcessingMusic() {
  return prisma.generatedMusic.findMany({
    where: {
      status: { in: ['pending', 'processing'] },
    },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Get music tracks with pending mastering
 */
export async function getMasteringPendingMusic() {
  return prisma.generatedMusic.findMany({
    where: {
      masteringStatus: { in: ['pending', 'processing'] },
    },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Get user music stats
 */
export async function getUserMusicStats(userId: string) {
  const [total, completed, totalPlays, totalLikes] = await Promise.all([
    prisma.generatedMusic.count({ where: { userId } }),
    prisma.generatedMusic.count({ where: { userId, status: 'completed' } }),
    prisma.generatedMusic.aggregate({
      where: { userId },
      _sum: { plays: true },
    }),
    prisma.generatedMusic.aggregate({
      where: { userId },
      _sum: { likes: true },
    }),
  ]);

  return {
    totalTracks: total,
    completedTracks: completed,
    totalPlays: totalPlays._sum.plays || 0,
    totalLikes: totalLikes._sum.likes || 0,
  };
}

// ==================
// Music Folder Operations
// ==================

export interface CreateFolderParams {
  userId: string;
  name: string;
  description?: string;
  color?: string;
  coverImage?: string;
}

export interface UpdateFolderParams {
  name?: string;
  description?: string;
  color?: string;
  coverImage?: string;
  trackCount?: number;
  totalDuration?: number;
}

/**
 * Create a new folder
 */
export async function createFolder(params: CreateFolderParams) {
  return prisma.musicFolder.create({
    data: params,
  });
}

/**
 * Update folder
 */
export async function updateFolder(id: string, params: UpdateFolderParams) {
  return prisma.musicFolder.update({
    where: { id },
    data: params,
  });
}

/**
 * Get folder by ID
 */
export async function getFolderById(id: string) {
  return prisma.musicFolder.findUnique({
    where: { id },
    include: {
      tracks: {
        where: { status: 'completed' },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

/**
 * Get user's folders
 */
export async function getUserFolders(userId: string) {
  return prisma.musicFolder.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { tracks: true },
      },
    },
  });
}

/**
 * Delete folder (tracks will be set to folderId: null)
 */
export async function deleteFolder(id: string) {
  // First, remove folder reference from all tracks
  await prisma.generatedMusic.updateMany({
    where: { folderId: id },
    data: { folderId: null },
  });

  // Then delete the folder
  return prisma.musicFolder.delete({
    where: { id },
  });
}

/**
 * Update folder track count and duration
 */
export async function updateFolderStats(folderId: string) {
  const stats = await prisma.generatedMusic.aggregate({
    where: { folderId, status: 'completed' },
    _count: true,
    _sum: { duration: true },
  });

  return prisma.musicFolder.update({
    where: { id: folderId },
    data: {
      trackCount: stats._count,
      totalDuration: stats._sum.duration || 0,
    },
  });
}
