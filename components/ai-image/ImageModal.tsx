'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { AI_MODELS, ASPECT_RATIOS } from '@/lib/ai-image/models';

interface GalleryImage {
  id: string;
  thumbnailUrl: string;
  outputUrl: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  width: number;
  height: number;
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
  showMyCreations?: boolean;
  onClose: () => void;
  onLikeUpdate: (imageId: string, likes: number) => void;
  onPublishToggle: (imageId: string, isPublic: boolean) => void;
  onDelete: (imageId: string) => void;
}

export default function ImageModal({
  image,
  showMyCreations = false,
  onClose,
  onLikeUpdate,
  onPublishToggle,
  onDelete,
}: ImageModalProps) {
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

  const modelInfo = AI_MODELS.find(m => m.id === image.model);
  const aspectInfo = ASPECT_RATIOS.find(ar => ar.id === image.aspectRatio);

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
    toast.success('Prompt copied to clipboard!');
  };

  const handleLike = async () => {
    if (!session) {
      toast.error('Sign in to like images');
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
        setDetails(prev => prev ? { ...prev, hasLiked: data.liked } : null);
        toast.success(data.liked ? 'Liked!' : 'Unliked');
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
    if (!confirm('Are you sure you want to delete this image? This cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/ai-image/${image.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (response.ok) {
        toast.success('Image deleted');
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
      const response = await fetch(image.outputUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pixelift-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (error) {
      toast.error('Failed to download');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="lg:w-2/3 bg-black flex items-center justify-center p-4">
          <img
            src={image.outputUrl}
            alt={image.prompt.substring(0, 50)}
            className="max-w-full max-h-[60vh] lg:max-h-[80vh] object-contain rounded-lg"
          />
        </div>

        {/* Details */}
        <div className="lg:w-1/3 p-6 overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-xl transition"
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
              <p className="font-medium">{image.user.name}</p>
              <p className="text-xs text-gray-400">
                {new Date(image.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Prompt */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-300">Prompt</h3>
              <button
                onClick={handleCopyPrompt}
                className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
              >
                📋 Copy
              </button>
            </div>
            <p className={`text-gray-400 text-sm ${!showPrompt && 'line-clamp-3'}`}>
              {image.prompt}
            </p>
            {image.prompt.length > 150 && (
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="text-purple-400 hover:text-purple-300 text-sm mt-1"
              >
                {showPrompt ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>

          {/* Settings */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-300 mb-3">Settings</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Model</span>
                <span className="text-white">{modelInfo?.name || image.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Aspect Ratio</span>
                <span className="text-white">{aspectInfo?.name || image.aspectRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Resolution</span>
                <span className="text-white">{image.width} × {image.height}</span>
              </div>
              {details?.seed && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Seed</span>
                  <span className="text-white">{details.seed}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-6 text-sm text-gray-400">
            <span>❤️ {image.likes} likes</span>
            <span>👁️ {details?.views || image.views} views</span>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Like & Download */}
            <div className="flex gap-3">
              {image.isPublic !== false && (
                <button
                  onClick={handleLike}
                  disabled={liking}
                  className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    details?.hasLiked
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {liking ? '...' : details?.hasLiked ? '❤️ Liked' : '🤍 Like'}
                </button>
              )}
              <button
                onClick={handleDownload}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                💾 Download
              </button>
            </div>

            {/* Owner Actions */}
            {details?.isOwner && showMyCreations && (
              <>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className={`w-full py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    image.isPublic
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {publishing ? '...' : image.isPublic ? '🔒 Make Private' : '🌐 Publish to Gallery'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg font-medium transition"
                >
                  {deleting ? 'Deleting...' : '🗑️ Delete'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
