"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { DownloadOptionsModal } from "@/components/DownloadOptionsModal";
import toast from "react-hot-toast";

interface ProcessedImage {
  id: string;
  originalFilename: string;
  fileSize: number;
  width: number;
  height: number;
  isProcessed: boolean;
  processingError?: string;
  createdAt: string;
  processedAt?: string;
}

type SortOption = 'newest' | 'oldest' | 'name' | 'size';
type FilterOption = 'all' | 'processed' | 'failed';

export default function ImagesHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadModalImage, setDownloadModalImage] = useState<ProcessedImage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchImages = useCallback(async () => {
    try {
      const response = await fetch('/api/processed-images');
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchImages();
    }
  }, [status, router, fetchImages]);

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    setDeletingId(imageId);
    try {
      const response = await fetch(`/api/processed-images/${imageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setImages(images.filter(img => img.id !== imageId));
        toast.success('Image deleted successfully');
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      toast.error('Failed to delete image');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    const processedImages = images.filter(img => img.isProcessed);
    if (processedImages.length === 0) {
      toast.error('No images to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${processedImages.length} processed images? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    let deleted = 0;
    let failed = 0;

    for (const image of processedImages) {
      try {
        const response = await fetch(`/api/processed-images/${image.id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          deleted++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    await fetchImages();
    toast.success(`Deleted ${deleted} images${failed > 0 ? `, ${failed} failed` : ''}`);
  };

  // Filter and sort images
  const filteredImages = images
    .filter(img => {
      if (filterBy === 'processed') return img.isProcessed;
      if (filterBy === 'failed') return img.processingError;
      return true;
    })
    .filter(img => {
      if (!searchQuery) return true;
      return img.originalFilename.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.originalFilename.localeCompare(b.originalFilename);
        case 'size':
          return b.fileSize - a.fileSize;
        default:
          return 0;
      }
    });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!session) return null;

  const stats = {
    total: images.length,
    processed: images.filter(img => img.isProcessed).length,
    failed: images.filter(img => img.processingError).length,
    totalSize: images.reduce((acc, img) => acc + img.fileSize, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-white mb-4 inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold mb-2 mt-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Image History
            </h1>
            <p className="text-gray-400">View and manage all your processed images</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/remove-background"
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Process New Image
            </Link>
            {stats.processed > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-3 bg-red-600/20 border border-red-600/50 text-red-400 rounded-lg font-medium hover:bg-red-600/30 transition"
              >
                Delete All
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
            <div className="text-blue-400 text-2xl mb-1">🖼️</div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-400">Total Images</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
            <div className="text-green-400 text-2xl mb-1">✅</div>
            <div className="text-2xl font-bold">{stats.processed}</div>
            <div className="text-sm text-gray-400">Processed</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
            <div className="text-red-400 text-2xl mb-1">❌</div>
            <div className="text-2xl font-bold">{stats.failed}</div>
            <div className="text-sm text-gray-400">Failed</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
            <div className="text-purple-400 text-2xl mb-1">💾</div>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
            <div className="text-sm text-gray-400">Total Size</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by filename..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Images</option>
              <option value="processed">Processed Only</option>
              <option value="failed">Failed Only</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">By Name</option>
              <option value="size">By Size</option>
            </select>
          </div>
        </div>

        {/* Images Grid */}
        {filteredImages.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🖼️</div>
            <h2 className="text-2xl font-bold mb-2">
              {images.length === 0 ? 'No images yet' : 'No matching images'}
            </h2>
            <p className="text-gray-400 mb-6">
              {images.length === 0
                ? 'Start by processing your first image'
                : 'Try adjusting your filters or search query'}
            </p>
            {images.length === 0 && (
              <Link
                href="/remove-background"
                className="inline-block px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Remove Background
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-green-500/50 transition group"
              >
                {/* Image Preview */}
                <div className="relative aspect-square bg-gray-900/50 overflow-hidden">
                  {image.isProcessed ? (
                    <Image
                      src={`/api/processed-images/${image.id}/view`}
                      alt={image.originalFilename}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : image.processingError ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-4">
                        <div className="text-4xl mb-2">❌</div>
                        <p className="text-sm text-red-400">Processing failed</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-400">Processing...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Image Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-white truncate" title={image.originalFilename}>
                      {image.originalFilename}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span>{formatFileSize(image.fileSize)}</span>
                      <span>•</span>
                      <span>{image.width} x {image.height}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(image.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  {image.isProcessed && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDownloadModalImage(image)}
                        className="flex-1 inline-flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 rounded-lg font-medium transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                      <a
                        href={`/api/processed-images/${image.id}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 p-2 rounded-lg transition"
                        title="View Full Size"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                      <button
                        onClick={() => handleDelete(image.id)}
                        disabled={deletingId === image.id}
                        className="inline-flex items-center justify-center bg-red-600/20 hover:bg-red-600/30 text-red-400 p-2 rounded-lg transition disabled:opacity-50"
                        title="Delete Image"
                      >
                        {deletingId === image.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}

                  {image.processingError && (
                    <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
                      Error: {image.processingError}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Showing count */}
        {filteredImages.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-400">
            Showing {filteredImages.length} of {images.length} images
          </div>
        )}
      </div>

      {/* Download Options Modal */}
      {downloadModalImage && (
        <DownloadOptionsModal
          imageId={downloadModalImage.id}
          originalFilename={downloadModalImage.originalFilename}
          userRole={(session?.user as { role?: string })?.role as 'user' | 'premium' | 'admin' || 'user'}
          onClose={() => setDownloadModalImage(null)}
        />
      )}
    </div>
  );
}
