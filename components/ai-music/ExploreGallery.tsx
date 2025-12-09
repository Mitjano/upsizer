'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

interface ExploreTrack {
  id: string;
  title?: string;
  prompt: string;
  style?: string;
  mood?: string;
  duration: number;
  instrumental: boolean;
  audioUrl?: string;
  coverImageUrl?: string;
  plays: number;
  likes: number;
  views: number;
  likedBy: string[];
  createdAt: string;
  userName?: string;
  userId: string;
}

type SortOption = 'trending' | 'newest' | 'mostPlayed' | 'mostLiked';

const STYLE_OPTIONS = [
  { id: '', label: 'All Styles' },
  { id: 'pop', label: 'Pop' },
  { id: 'rock', label: 'Rock' },
  { id: 'hiphop', label: 'Hip-Hop' },
  { id: 'electronic', label: 'Electronic' },
  { id: 'jazz', label: 'Jazz' },
  { id: 'classical', label: 'Classical' },
  { id: 'country', label: 'Country' },
  { id: 'metal', label: 'Metal' },
  { id: 'ambient', label: 'Ambient' },
];

const MOOD_OPTIONS = [
  { id: '', label: 'All Moods' },
  { id: 'happy', label: 'Happy' },
  { id: 'sad', label: 'Sad' },
  { id: 'energetic', label: 'Energetic' },
  { id: 'calm', label: 'Calm' },
  { id: 'romantic', label: 'Romantic' },
  { id: 'dark', label: 'Dark' },
  { id: 'epic', label: 'Epic' },
];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function ExploreGallery() {
  const t = useTranslations('aiMusic');
  const { data: session } = useSession();

  const [tracks, setTracks] = useState<ExploreTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Filters
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [filterStyle, setFilterStyle] = useState('');
  const [filterMood, setFilterMood] = useState('');

  // Playback
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch tracks
  const fetchTracks = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (!reset && !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: currentOffset.toString(),
        sort: sortBy,
      });
      if (filterStyle) params.set('style', filterStyle);
      if (filterMood) params.set('mood', filterMood);

      const res = await fetch(`/api/ai-music/explore?${params}`);
      if (!res.ok) throw new Error('Failed to fetch tracks');

      const data = await res.json();

      if (reset) {
        setTracks(data.tracks);
        setOffset(data.tracks.length);
      } else {
        setTracks((prev) => [...prev, ...data.tracks]);
        setOffset((prev) => prev + data.tracks.length);
      }
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracks');
    } finally {
      setIsLoading(false);
    }
  }, [offset, hasMore, sortBy, filterStyle, filterMood]);

  // Initial fetch and refetch on filter change
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchTracks(true);
  }, [sortBy, filterStyle, filterMood]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle play
  const togglePlay = useCallback((track: ExploreTrack) => {
    if (!track.audioUrl) return;

    if (playingTrack === track.id) {
      audioRef.current?.pause();
      setPlayingTrack(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const streamUrl = `/api/ai-music/${track.id}/stream`;
      audioRef.current = new Audio(streamUrl);
      audioRef.current.addEventListener('ended', () => setPlayingTrack(null));
      audioRef.current.addEventListener('error', () => setPlayingTrack(null));
      audioRef.current.play().catch(() => setPlayingTrack(null));
      setPlayingTrack(track.id);

      // Increment plays
      fetch(`/api/ai-music/${track.id}/play`, { method: 'POST' }).catch(console.error);
    }
  }, [playingTrack]);

  // Toggle like
  const toggleLike = useCallback(async (trackId: string) => {
    if (!session) return;

    try {
      const res = await fetch(`/api/ai-music/${trackId}/like`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to like');

      const data = await res.json();

      setTracks((prev) =>
        prev.map((track) =>
          track.id === trackId
            ? { ...track, likes: data.likes, likedBy: data.isLiked
                ? [...track.likedBy, session.user?.email || '']
                : track.likedBy.filter(id => id !== session.user?.email) }
            : track
        )
      );
    } catch (err) {
      console.error('Like error:', err);
    }
  }, [session]);

  // Check if current user liked the track
  const isLikedByUser = useCallback((track: ExploreTrack) => {
    if (!session?.user?.email) return false;
    // likedBy contains user IDs, we need to check against our user
    return track.likedBy.some((id) => id === session.user?.email || id.includes(session.user?.email || ''));
  }, [session]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">{t('explore.title') || 'Explore Music'}</h2>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          >
            <option value="trending">{t('explore.trending') || 'Trending'}</option>
            <option value="newest">{t('explore.newest') || 'Newest'}</option>
            <option value="mostPlayed">{t('explore.mostPlayed') || 'Most Played'}</option>
            <option value="mostLiked">{t('explore.mostLiked') || 'Most Liked'}</option>
          </select>

          {/* Style Filter */}
          <select
            value={filterStyle}
            onChange={(e) => setFilterStyle(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          >
            {STYLE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>

          {/* Mood Filter */}
          <select
            value={filterMood}
            onChange={(e) => setFilterMood(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          >
            {MOOD_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && tracks.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tracks.length === 0 && (
        <div className="text-center py-16 bg-gray-800/30 rounded-xl border border-gray-700">
          <div className="text-5xl mb-4">🎵</div>
          <h3 className="text-xl font-semibold mb-2">{t('explore.empty') || 'No tracks found'}</h3>
          <p className="text-gray-400">{t('explore.emptyHint') || 'Be the first to share your music!'}</p>
        </div>
      )}

      {/* Tracks Grid */}
      {tracks.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-purple-500/50 transition group"
            >
              {/* Cover / Play Area */}
              <div
                className="relative aspect-square bg-gradient-to-br from-purple-900/40 to-pink-900/40 flex items-center justify-center cursor-pointer"
                onClick={() => togglePlay(track)}
              >
                {track.coverImageUrl ? (
                  <img
                    src={track.coverImageUrl}
                    alt={track.title || 'Cover'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl">{track.instrumental ? '🎹' : '🎵'}</span>
                )}

                {/* Play Button Overlay */}
                <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition ${
                  playingTrack === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition ${
                    playingTrack === track.id ? 'bg-purple-600' : 'bg-white/20 hover:bg-white/30'
                  }`}>
                    {playingTrack === track.id ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </div>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                  {formatDuration(track.duration)}
                </div>
              </div>

              {/* Track Info */}
              <div className="p-4">
                <h4 className="font-semibold text-white truncate mb-1">
                  {track.title || track.prompt.slice(0, 30)}
                  {!track.title && track.prompt.length > 30 ? '...' : ''}
                </h4>
                <p className="text-sm text-gray-400 truncate mb-3">
                  {track.userName || 'Anonymous'}
                  {track.style && ` • ${track.style}`}
                </p>

                {/* Stats & Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatNumber(track.plays)}
                    </span>
                  </div>

                  {/* Like Button */}
                  <button
                    onClick={() => toggleLike(track.id)}
                    disabled={!session}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg transition ${
                      isLikedByUser(track)
                        ? 'text-pink-500 bg-pink-500/10'
                        : 'text-gray-400 hover:text-pink-500 hover:bg-pink-500/10'
                    } ${!session ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill={isLikedByUser(track) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-sm">{formatNumber(track.likes)}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && tracks.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => fetchTracks(false)}
            disabled={isLoading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </span>
            ) : (
              t('explore.loadMore') || 'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
