'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { AI_MODELS, ASPECT_RATIOS } from '@/lib/ai-image/models';
import ShareModal from './ShareModal';

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

interface ImageModalProps {
  image: GalleryImage;
  onClose: () => void;
  onLikeUpdate: (imageId: string, likes: number) => void;
  onPublishToggle: (imageId: string, isPublic: boolean) => void;
  onDelete: (imageId: string) => void;
}

export default function ImageModal({
  image,
  onClose,
  onLikeUpdate,
  onPublishToggle,
  onDelete,
}: ImageModalProps) {
  const t = useTranslations('aiImage');
  const { data: session } = useSession();
  const [details, setDetails] = useState<{
    seed?: number;
    views: number;
    hasLiked: boolean;
    isOwner: boolean;
  } | null>(null);
  const [liking, setLiking] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const modelInfo = AI_MODELS.find(m => m.id === image.model);
  const aspectInfo = ASPECT_RATIOS.find(ar => ar.id === image.aspectRatio);
  const isVideo = image.type === 'video';

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/ai-image/${image.id}`
    : `/ai-image/${image.id}`;

  useEffect(() => {
    // Fetch full details
    fetch(`/api/ai-image/${image.id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setDetails({
            seed: data.seed,
            views: data.views,
            hasLiked: data.hasLiked,
            isOwner: data.isOwner,
          });
        }
      })
      .catch(console.error);
  }, [image.id]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(image.prompt);
    toast.success(t('modal.promptCopied') || 'Prompt copied to clipboard!');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast.success(t('modal.linkCopied') || 'Link copied!');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleCopySeed = () => {
    if (details?.seed) {
      navigator.clipboard.writeText(String(details.seed));
      toast.success(t('modal.seedCopied') || 'Seed copied!');
    }
  };

  const handleLike = async () => {
    if (!session) {
      toast.error(t('modal.signInToLike') || 'Sign in to like images');
      return;
    }

    setLiking(true);
    try {
      const response = await fetch(`/api/ai-image/${image.id}/like`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        onLikeUpdate(image.id, data.likes);
        const isLiked = data.liked === true;
        setDetails(prev => prev ? { ...prev, hasLiked: isLiked } : { hasLiked: isLiked, views: 0, isOwner: false });
        toast.success(isLiked ? (t('modal.liked') || 'Liked!') : (t('modal.unliked') || 'Unliked'));
      } else {
        toast.error(data.error || 'Failed to like');
      }
    } catch (error) {
      toast.error('Failed to like');
    } finally {
      setLiking(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const response = await fetch(`/api/ai-image/${image.id}/publish`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        onPublishToggle(image.id, data.isPublic);
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch (error) {
      toast.error('Failed to update');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('modal.deleteConfirm') || 'Are you sure you want to delete this image? This cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/ai-image/${image.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(t('modal.deleted') || 'Image deleted');
        onDelete(image.id);
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const url = isVideo ? (image.videoUrl || image.outputUrl) : image.outputUrl;
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `pixelift-${image.id}.${isVideo ? 'mp4' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success(t('modal.downloaded') || 'Downloaded!');
    } catch (error) {
      toast.error(t('modal.downloadFailed') || 'Failed to download');
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-gray-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col lg:flex-row shadow-2xl border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image/Video */}
          <div className="lg:w-2/3 bg-black flex items-center justify-center p-4 relative">
            {isVideo ? (
              <video
                src={image.videoUrl || image.outputUrl}
                controls
                autoPlay
                loop
                className="max-w-full max-h-[60vh] lg:max-h-[80vh] object-contain rounded-lg"
              />
            ) : (
              <img
                src={image.outputUrl}
                alt={image.prompt.substring(0, 50)}
                className="max-w-full max-h-[60vh] lg:max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>

          {/* Details */}
          <div className="lg:w-1/3 p-6 overflow-y-auto relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-xl transition text-gray-400 hover:text-white"
            >
              ×
            </button>

            {/* User */}
            <div className="flex items-center gap-3 mb-6">
              {image.user.image ? (
                <img
                  src={image.user.image}
                  alt={image.user.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-lg">
                  {image.user.name[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-white">{image.user.name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(image.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Prompt */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-300 text-sm">{t('modal.prompt') || 'Prompt'}</h3>
                <button
                  onClick={handleCopyPrompt}
                  className="text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1 transition"
                >
                  📋 {t('modal.copy') || 'Copy'}
                </button>
              </div>
              <p className={`text-gray-400 text-sm leading-relaxed ${!showPrompt && 'line-clamp-3'}`}>
                {image.prompt}
              </p>
              {image.prompt.length > 150 && (
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="text-purple-400 hover:text-purple-300 text-xs mt-1 transition"
                >
                  {showPrompt ? (t('modal.showLess') || 'Show less') : (t('modal.readMore') || 'Read more')}
                </button>
              )}
            </div>

            {/* Settings */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-300 mb-3 text-sm">{t('modal.settings') || 'Settings'}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('modal.model') || 'Model'}</span>
                  <span className="text-white">{modelInfo?.name || image.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('modal.aspectRatio') || 'Aspect Ratio'}</span>
                  <span className="text-white">{aspectInfo?.name || image.aspectRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('modal.resolution') || 'Resolution'}</span>
                  <span className="text-white">{image.width} × {image.height}</span>
                </div>
                {details?.seed && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">{t('modal.seed') || 'Seed'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-xs">{details.seed}</span>
                      <button
                        onClick={handleCopySeed}
                        className="text-purple-400 hover:text-purple-300 text-xs transition"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                )}
                {isVideo && image.duration && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('modal.duration') || 'Duration'}</span>
                    <span className="text-white">{image.duration}s</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-6 text-sm text-gray-400">
              <span>❤️ {image.likes} {t('modal.likes') || 'likes'}</span>
              <span>👁️ {details?.views || image.views} {t('modal.views') || 'views'}</span>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {/* Primary Actions Row */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownload}
                  className="py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm"
                >
                  <span>💾</span> {t('modal.download') || 'Download'}
                </button>
                <button
                  onClick={handleCopyLink}
                  className={`py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm ${
                    linkCopied
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span>{linkCopied ? '✓' : '🔗'}</span>
                  {linkCopied ? (t('modal.copied') || 'Copied!') : (t('modal.copyLink') || 'Copy Link')}
                </button>
              </div>

              {/* Share & Like Row */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="py-2.5 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm"
                >
                  <span>📤</span> {t('modal.share') || 'Share'}
                </button>
                {image.isPublic !== false && (
                  <button
                    onClick={handleLike}
                    disabled={liking}
                    className={`py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm ${
                      details?.hasLiked === true
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {liking ? '...' : details?.hasLiked === true ? '❤️' : '🤍'}
                    {details?.hasLiked === true ? (t('modal.liked') || 'Liked') : (t('modal.like') || 'Like')}
                  </button>
                )}
              </div>

              {/* Owner Actions */}
              {details?.isOwner && (
                <>
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className={`w-full py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm ${
                      image.isPublic
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {publishing ? '...' : image.isPublic
                      ? `🔒 ${t('modal.makePrivate') || 'Make Private'}`
                      : `🌐 ${t('modal.publishToGallery') || 'Publish to Gallery'}`}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full py-2.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg font-medium transition text-sm"
                  >
                    {deleting ? (t('modal.deleting') || 'Deleting...') : `🗑️ ${t('modal.delete') || 'Delete'}`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          imageId={image.id}
          imageUrl={image.outputUrl}
          prompt={image.prompt}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}
