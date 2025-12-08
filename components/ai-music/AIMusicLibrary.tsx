'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface MusicTrack {
  id: string;
  title?: string;
  prompt: string;
  style?: string;
  mood?: string;
  duration: number;
  instrumental: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  masteringStatus: 'none' | 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  masteredUrl?: string;
  localPath?: string;
  masteredLocalPath?: string;
  isPublic: boolean;
  plays: number;
  likes: number;
  createdAt: string;
  folderId?: string;
  folder?: MusicFolder;
}

interface MusicFolder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  trackCount: number;
  totalDuration: number;
  createdAt: string;
  _count?: {
    tracks: number;
  };
}

type SortOption = 'createdAt' | 'title' | 'duration';
type FilterOption = 'all' | 'mastered' | 'notMastered';

const FOLDER_COLORS = [
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function AIMusicLibrary() {
  const t = useTranslations('aiMusic');
  const { data: session } = useSession();

  // State
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [folders, setFolders] = useState<MusicFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<MusicFolder | null>(null);
  const [showMoveModal, setShowMoveModal] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showFolderDeleteConfirm, setShowFolderDeleteConfirm] = useState<string | null>(null);

  // Folder form state
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [folderColor, setFolderColor] = useState(FOLDER_COLORS[0]);

  // Audio playback
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch tracks and folders
  const fetchData = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    setError(null);

    try {
      const [tracksRes, foldersRes] = await Promise.all([
        fetch(`/api/ai-music/list?folderId=${selectedFolder || ''}&orderBy=${sortBy}`),
        fetch('/api/ai-music/folders'),
      ]);

      if (!tracksRes.ok || !foldersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const tracksData = await tracksRes.json();
      const foldersData = await foldersRes.json();

      setTracks(tracksData.tracks || []);
      setFolders(foldersData.folders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library');
    } finally {
      setIsLoading(false);
    }
  }, [session, selectedFolder, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter tracks
  const filteredTracks = tracks.filter((track) => {
    if (filterBy === 'mastered') return track.masteringStatus === 'completed';
    if (filterBy === 'notMastered') return track.masteringStatus !== 'completed';
    return true;
  });

  // Play/Pause track
  const togglePlay = useCallback((track: MusicTrack) => {
    const audioUrl = track.masteredUrl || track.audioUrl || track.masteredLocalPath || track.localPath;
    if (!audioUrl) return;

    if (playingTrack === track.id) {
      audioRef.current?.pause();
      setPlayingTrack(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener('ended', () => setPlayingTrack(null));
      audioRef.current.play();
      setPlayingTrack(track.id);

      // Increment plays
      fetch(`/api/ai-music/${track.id}/play`, { method: 'POST' }).catch(console.error);
    }
  }, [playingTrack]);

  // Create/Update folder
  const handleSaveFolder = async () => {
    try {
      const method = editingFolder ? 'PATCH' : 'POST';
      const body = editingFolder
        ? { id: editingFolder.id, name: folderName, description: folderDescription, color: folderColor }
        : { name: folderName, description: folderDescription, color: folderColor };

      const res = await fetch('/api/ai-music/folders', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save folder');
      }

      setShowFolderModal(false);
      setEditingFolder(null);
      setFolderName('');
      setFolderDescription('');
      setFolderColor(FOLDER_COLORS[0]);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save folder');
    }
  };

  // Delete folder
  const handleDeleteFolder = async (folderId: string) => {
    try {
      const res = await fetch(`/api/ai-music/folders?id=${folderId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete folder');
      }

      setShowFolderDeleteConfirm(null);
      if (selectedFolder === folderId) {
        setSelectedFolder(null);
      }
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete folder');
    }
  };

  // Move track to folder
  const handleMoveToFolder = async (trackId: string, folderId: string | null) => {
    try {
      const res = await fetch(`/api/ai-music/${trackId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });

      if (!res.ok) {
        throw new Error('Failed to move track');
      }

      setShowMoveModal(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move track');
    }
  };

  // Delete track
  const handleDeleteTrack = async (trackId: string) => {
    try {
      const res = await fetch(`/api/ai-music/${trackId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete track');
      }

      setShowDeleteConfirm(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete track');
    }
  };

  // Toggle public/private
  const handleTogglePublic = async (track: MusicTrack) => {
    try {
      const res = await fetch(`/api/ai-music/${track.id}/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !track.isPublic }),
      });

      if (!res.ok) {
        throw new Error('Failed to update visibility');
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update visibility');
    }
  };

  // Open edit folder modal
  const openEditFolder = (folder: MusicFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderDescription(folder.description || '');
    setFolderColor(folder.color || FOLDER_COLORS[0]);
    setShowFolderModal(true);
  };

  // Open new folder modal
  const openNewFolder = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderDescription('');
    setFolderColor(FOLDER_COLORS[0]);
    setShowFolderModal(true);
  };

  if (!session) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold mb-2">Sign in Required</h3>
        <p className="text-gray-400 mb-6">Please sign in to view your music library</p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t('library.title')}</h2>
        <button
          onClick={openNewFolder}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {t('library.newFolder')}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar - Folders */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-400 mb-3">{t('library.folders')}</h3>

            {/* All Songs */}
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-left ${
                selectedFolder === null
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                  : 'hover:bg-gray-700/50 text-gray-300'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span className="flex-1 truncate">{t('library.allSongs')}</span>
              <span className="text-sm text-gray-500">{tracks.length}</span>
            </button>

            {/* Folders */}
            {folders.map((folder) => (
              <div key={folder.id} className="group relative">
                <button
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-left ${
                    selectedFolder === folder.id
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                      : 'hover:bg-gray-700/50 text-gray-300'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs"
                    style={{ backgroundColor: folder.color || FOLDER_COLORS[0] }}
                  >
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  </div>
                  <span className="flex-1 truncate">{folder.name}</span>
                  <span className="text-sm text-gray-500">{folder._count?.tracks || 0}</span>
                </button>

                {/* Folder Actions */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditFolder(folder);
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFolderDeleteConfirm(folder.id);
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Tracks */}
        <div className="lg:col-span-3">
          {/* Filters & Sort */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{t('library.sort')}:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="createdAt">{t('library.sortDate')}</option>
                <option value="title">{t('library.sortName')}</option>
                <option value="duration">{t('library.sortDuration')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{t('library.filter')}:</span>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">{t('library.filterAll')}</option>
                <option value="mastered">{t('library.filterMastered')}</option>
                <option value="notMastered">{t('library.filterNotMastered')}</option>
              </select>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredTracks.length === 0 && (
            <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700">
              <div className="text-5xl mb-4">🎵</div>
              <h3 className="text-xl font-semibold mb-2">
                {selectedFolder ? t('library.emptyFolder') : t('library.emptyLibrary')}
              </h3>
              <p className="text-gray-400 mb-6">{t('library.emptyLibraryHint')}</p>
              <Link
                href="/ai-music"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
              >
                {t('tabs.generate')}
              </Link>
            </div>
          )}

          {/* Tracks Grid */}
          {!isLoading && filteredTracks.length > 0 && (
            <div className="grid gap-4">
              {filteredTracks.map((track) => (
                <div
                  key={track.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition group"
                >
                  <div className="flex items-center gap-4">
                    {/* Play Button */}
                    <button
                      onClick={() => togglePlay(track)}
                      disabled={track.status !== 'completed'}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition flex-shrink-0 ${
                        track.status === 'completed'
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-gray-700 cursor-not-allowed'
                      }`}
                    >
                      {track.status !== 'completed' ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : playingTrack === track.id ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                    </button>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white truncate">
                          {track.title || track.prompt.slice(0, 40)}
                          {!track.title && track.prompt.length > 40 ? '...' : ''}
                        </h4>
                        {track.masteringStatus === 'completed' && (
                          <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full">
                            Mastered
                          </span>
                        )}
                        {track.instrumental && (
                          <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                            Instrumental
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        {track.style && <span>{t(`styles.${track.style}`)}</span>}
                        {track.style && track.mood && <span>•</span>}
                        {track.mood && <span>{t(`moods.${track.mood}`)}</span>}
                        <span>•</span>
                        <span>{formatDuration(track.duration)}</span>
                        <span>•</span>
                        <span>{track.plays} {t('stats.plays')}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {track.status !== 'completed' && (
                      <div className="flex-shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          track.status === 'failed'
                            ? 'bg-red-600/20 text-red-400'
                            : 'bg-yellow-600/20 text-yellow-400'
                        }`}>
                          {t(`status.${track.status}`)}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    {track.status === 'completed' && (
                      <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
                        {/* Download */}
                        <a
                          href={track.masteredUrl || track.audioUrl || track.masteredLocalPath || track.localPath}
                          download
                          className="p-2 hover:bg-gray-700 rounded-lg transition"
                          title={t('player.download')}
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>

                        {/* Master */}
                        {track.masteringStatus !== 'completed' && (
                          <Link
                            href={`/ai-music/${track.id}`}
                            className="p-2 hover:bg-gray-700 rounded-lg transition"
                            title={t('mastering.master')}
                          >
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </Link>
                        )}

                        {/* Move to folder */}
                        <button
                          onClick={() => setShowMoveModal(track.id)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition"
                          title={t('library.moveToFolder')}
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </button>

                        {/* Public/Private */}
                        <button
                          onClick={() => handleTogglePublic(track)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition"
                          title={track.isPublic ? t('actions.makePrivate') : t('actions.makePublic')}
                        >
                          {track.isPublic ? (
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setShowDeleteConfirm(track.id)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition"
                          title={t('actions.delete')}
                        >
                          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              {editingFolder ? t('library.editFolder') : t('library.createFolder')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('library.folderName')} *
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="My Playlist"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('library.folderColor')}
                </label>
                <div className="flex gap-2">
                  {FOLDER_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFolderColor(color)}
                      className={`w-8 h-8 rounded-full transition ${
                        folderColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowFolderModal(false);
                  setEditingFolder(null);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFolder}
                disabled={!folderName.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingFolder ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move to Folder Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">{t('library.moveToFolder')}</h3>

            <div className="space-y-2">
              <button
                onClick={() => handleMoveToFolder(showMoveModal, null)}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-700 rounded-lg transition text-left"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <span>{t('library.removeFromFolder')}</span>
              </button>

              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleMoveToFolder(showMoveModal, folder.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-700 rounded-lg transition text-left"
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-xs"
                    style={{ backgroundColor: folder.color || FOLDER_COLORS[0] }}
                  >
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  </div>
                  <span>{folder.name}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowMoveModal(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Track Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">{t('actions.delete')}</h3>
            <p className="text-gray-400 mb-6">{t('actions.confirmDelete')}</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTrack(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Confirm Modal */}
      {showFolderDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">{t('library.deleteFolder')}</h3>
            <p className="text-gray-400 mb-6">{t('library.deleteFolderConfirm')}</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowFolderDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteFolder(showFolderDeleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
