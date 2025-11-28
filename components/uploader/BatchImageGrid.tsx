"use client";

import { FaTimes } from "react-icons/fa";
import { BatchImageItem } from "./types";

interface BatchImageGridProps {
  images: BatchImageItem[];
  scale: number;
  processing: boolean;
  onRemove: (id: string) => void;
}

/**
 * Grid display for batch image processing
 */
export default function BatchImageGrid({
  images,
  scale,
  processing,
  onRemove
}: BatchImageGridProps) {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4">Images Queue</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
        {images.map((item) => (
          <BatchImageCard
            key={item.id}
            item={item}
            scale={scale}
            processing={processing}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}

interface BatchImageCardProps {
  item: BatchImageItem;
  scale: number;
  processing: boolean;
  onRemove: (id: string) => void;
}

function BatchImageCard({ item, scale, processing, onRemove }: BatchImageCardProps) {
  const statusClasses = {
    completed: 'border-green-500 bg-green-500/10',
    processing: 'border-blue-500 bg-blue-500/10',
    error: 'border-red-500 bg-red-500/10',
    pending: 'border-gray-600'
  };

  return (
    <div
      className={`relative rounded-lg border-2 p-3 ${statusClasses[item.status]}`}
    >
      {/* Remove button */}
      {item.status === 'pending' && !processing && (
        <button
          onClick={() => onRemove(item.id)}
          className="absolute top-2 right-2 z-10 p-1 rounded-full bg-red-500/80 hover:bg-red-500"
        >
          <FaTimes className="text-white text-xs" />
        </button>
      )}

      {/* Image preview */}
      {item.previewUrl && (
        <img
          src={item.previewUrl}
          alt={item.file.name}
          className="w-full h-32 object-cover rounded mb-2"
        />
      )}

      {/* File info */}
      <p className="text-xs font-medium truncate mb-1">{item.file.name}</p>
      {item.imageInfo && (
        <p className="text-xs text-gray-400">
          {item.imageInfo.width}×{item.imageInfo.height}
        </p>
      )}

      {/* Status */}
      <div className="mt-2">
        <StatusBadge item={item} scale={scale} />
      </div>
    </div>
  );
}

function StatusBadge({ item, scale }: { item: BatchImageItem; scale: number }) {
  switch (item.status) {
    case 'pending':
      return <span className="text-xs text-gray-400">⏳ Pending</span>;
    case 'processing':
      return <span className="text-xs text-blue-400">⚙️ Processing...</span>;
    case 'completed':
      return item.upscaledUrl ? (
        <a
          href={item.upscaledUrl}
          download={`pixelift_${scale}x_${item.file.name}`}
          className="text-xs text-green-400 hover:underline flex items-center gap-1"
        >
          ✅ Download
        </a>
      ) : null;
    case 'error':
      return <span className="text-xs text-red-400">❌ {item.error}</span>;
    default:
      return null;
  }
}
