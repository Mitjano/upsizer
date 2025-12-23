'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import ImageModal from './ImageModal';
import { FaPlay } from 'react-icons/fa';

type TimeFilter = 'today' | '7days' | '30days' | 'all';
type SortBy = 'newest' | 'best';

interface GalleryImage {
  id: string;
  type?: 'image' | 'video';
  thumbnailUrl: string;
  outputUrl: string;
  videoUrl?: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  width: number;
  height: number;
  duration?: number;
  user: {
    name: string;
    image?: string;
  };
  likes: number;
  views: number;
  isPublic?: boolean;
  createdAt: string;
}

interface ExploreGalleryProps {
  showMyCreations?: boolean;
}

const TIME_FILTERS: { id: TimeFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7days', label: '7 Days' },
  { id: '30days', label: '30 Days' },
  { id: 'all', label: 'All Time' },
];

const SORT_OPTIONS: { id: SortBy; label: string; icon: string }[] = [
  { id: 'newest', label: 'Newest', icon: '🕐' },
  { id: 'best', label: 'Best', icon: '🔥' },
];

export default function ExploreGallery({ showMyCreations = false }: ExploreGalleryProps) {
  const { data: session } = useSession();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const fetchImages = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let endpoint: string;
      if (showMyCreations) {
        endpoint = `/api/ai-image/my-creations?page=${pageNum}&limit=20`;
      } else {
        endpoint = `/api/ai-image/gallery?page=${pageNum}&limit=20&timeFilter=${timeFilter}&sortBy=${sortBy}`;
      }

      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch images');
      }

      if (append) {
        setImages(prev => [...prev, ...data.images]);
      } else {
        setImages(data.images);
      }
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Gallery fetch error:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [showMyCreations, timeFilter, sortBy]);

  useEffect(() => {
    setPage(1);
    setImages([]);
    fetchImages(1, false);
  }, [showMyCreations, timeFilter, sortBy, fetchImages]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchImages(nextPage, true);
    }
  };

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleLikeUpdate = (imageId: string, likes: number) => {
    setImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, likes } : img
    ));
  };

  const handlePublishToggle = (imageId: string, isPublic: boolean) => {
    if (showMyCreations) {
      setImages(prev => prev.map(img =>
        img.id === imageId ? { ...img, isPublic } : img
      ));
    }
  };

  const handleDelete = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    setSelectedImage(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Filters UI component (only for Explore, not My Creations)
  const FiltersUI = () => !showMyCreations ? (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      {/* Sort By */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Sort:</span>
        <div className="flex bg-gray-700/50 rounded-lg p-1">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                sortBy === option.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Time:</span>
        <div className="flex bg-gray-700/50 rounded-lg p-1">
          {TIME_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setTimeFilter(filter.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                timeFilter === filter.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  if (images.length === 0) {
    return (
      <>
        <FiltersUI />
        <div className="text-center py-12">
          <div className="text-5xl mb-4">{showMyCreations ? '🎨' : '🔍'}</div>
          <h3 className="text-xl font-semibold mb-2">
            {showMyCreations ? 'No creations yet' : 'No images found'}
          </h3>
          <p className="text-gray-400">
            {showMyCreations
              ? 'Start generating images to see them here!'
              : timeFilter !== 'all'
                ? 'Try changing the time filter to see more images'
                : 'Be the first to share your AI creations with the community'
            }
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Filters */}
      <FiltersUI />

      {/* Image/Video Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => {
          const isVideo = image.type === 'video';
          const isHovered = hoveredVideoId === image.id;

          return (
            <div
              key={image.id}
              onClick={() => handleImageClick(image)}
              onMouseEnter={() => {
                if (isVideo) {
                  setHoveredVideoId(image.id);
                  videoRefs.current[image.id]?.play().catch(() => {});
                }
              }}
              onMouseLeave={() => {
                if (isVideo) {
                  setHoveredVideoId(null);
                  const video = videoRefs.current[image.id];
                  if (video) {
                    video.pause();
                    video.currentTime = 0;
                  }
                }
              }}
              className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-800 aspect-square"
            >
              {isVideo ? (
                <>
                  {/* Video thumbnail - use video element with preload=metadata to show first frame */}
                  <video
                    ref={(el) => { videoRefs.current[image.id] = el; }}
                    src={image.videoUrl || image.outputUrl}
                    className="w-full h-full object-cover transition group-hover:scale-105"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                  {/* Play icon overlay */}
                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                      <FaPlay className="text-white text-lg ml-1" />
                    </div>
                  </div>
                  {/* Duration badge */}
                  {image.duration && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-xs text-white">
                      {image.duration}s
                    </div>
                  )}
                </>
              ) : (
                <img
                  src={image.thumbnailUrl || image.outputUrl}
                  alt={image.prompt.substring(0, 50)}
                  className="w-full h-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-sm text-white line-clamp-2 mb-2">
                    {image.prompt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {image.user.image ? (
                        <img
                          src={image.user.image}
                          alt={image.user.name}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-xs">
                          {image.user.name[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs text-gray-300">{image.user.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <span>❤️ {image.likes}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Video type badge */}
              {isVideo && !showMyCreations && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 rounded bg-purple-600/80 text-xs font-medium text-white">
                    🎬 Video
                  </span>
                </div>
              )}
              {/* Public/Private badge for my creations */}
              {showMyCreations && (
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    image.isPublic
                      ? 'bg-green-600/80 text-white'
                      : 'bg-gray-600/80 text-gray-200'
                  }`}>
                    {image.isPublic ? '🌐' : '🔒'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg font-medium transition flex items-center gap-2 mx-auto"
          >
            {loadingMore ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={handleCloseModal}
          onLikeUpdate={handleLikeUpdate}
          onPublishToggle={handlePublishToggle}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
