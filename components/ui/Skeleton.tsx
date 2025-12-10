'use client';

import { cn } from '@/lib/utils';

/**
 * Skeleton Component
 *
 * Used as a placeholder while content is loading.
 * Provides better UX than spinners by showing the approximate shape of content.
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        variants[variant],
        animations[animation],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

// ============================================
// Pre-built Skeleton Presets
// ============================================

/**
 * Skeleton for image placeholders
 */
export function ImageSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      variant="rounded"
      className={cn('w-full aspect-square', className)}
    />
  );
}

/**
 * Skeleton for avatar placeholders
 */
export function AvatarSkeleton({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />;
}

/**
 * Skeleton for text lines
 */
export function TextSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full' // Last line shorter
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for cards
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <Skeleton variant="rounded" className="w-full h-48 mb-4" />
      <Skeleton variant="text" className="w-3/4 h-6 mb-2" />
      <Skeleton variant="text" className="w-full h-4 mb-1" />
      <Skeleton variant="text" className="w-5/6 h-4 mb-4" />
      <div className="flex items-center gap-2">
        <AvatarSkeleton size={32} />
        <Skeleton variant="text" className="w-24 h-4" />
      </div>
    </div>
  );
}

/**
 * Skeleton for tool cards (image processing tools)
 */
export function ToolCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <Skeleton variant="rounded" width={48} height={48} />
        <Skeleton variant="rounded" width={60} height={24} />
      </div>
      <Skeleton variant="text" className="w-2/3 h-6 mb-2" />
      <Skeleton variant="text" className="w-full h-4 mb-1" />
      <Skeleton variant="text" className="w-4/5 h-4 mb-4" />
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={80} height={28} />
        <Skeleton variant="rounded" width={80} height={28} />
      </div>
    </div>
  );
}

/**
 * Skeleton for dashboard stats
 */
export function StatSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <Skeleton variant="text" className="w-20 h-4 mb-2" />
      <Skeleton variant="text" className="w-16 h-8 mb-1" />
      <Skeleton variant="text" className="w-24 h-3" />
    </div>
  );
}

/**
 * Skeleton for table rows
 */
export function TableRowSkeleton({
  columns = 4,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-4 p-4', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(
            'h-4',
            i === 0 ? 'w-8' : i === 1 ? 'w-32' : 'flex-1'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for full table
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            className={cn(
              'h-4',
              i === 0 ? 'w-8' : i === 1 ? 'w-32' : 'flex-1'
            )}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton
          key={i}
          columns={columns}
          className={
            i !== rows - 1
              ? 'border-b border-gray-200 dark:border-gray-700'
              : ''
          }
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for image upload area
 */
export function UploadAreaSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl',
        className
      )}
    >
      <Skeleton variant="circular" width={64} height={64} className="mb-4" />
      <Skeleton variant="text" className="w-48 h-5 mb-2" />
      <Skeleton variant="text" className="w-32 h-4" />
    </div>
  );
}

/**
 * Skeleton for blog post card
 */
export function BlogPostSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('group', className)}>
      <Skeleton variant="rounded" className="w-full aspect-video mb-4" />
      <div className="flex items-center gap-2 mb-2">
        <Skeleton variant="rounded" width={60} height={20} />
        <Skeleton variant="text" className="w-20 h-3" />
      </div>
      <Skeleton variant="text" className="w-full h-6 mb-2" />
      <Skeleton variant="text" className="w-full h-4 mb-1" />
      <Skeleton variant="text" className="w-3/4 h-4" />
    </div>
  );
}

/**
 * Skeleton for pricing card
 */
export function PricingCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <Skeleton variant="text" className="w-24 h-6 mb-2" />
      <Skeleton variant="text" className="w-32 h-10 mb-4" />
      <Skeleton variant="text" className="w-full h-4 mb-6" />
      <div className="space-y-3 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton variant="circular" width={16} height={16} />
            <Skeleton variant="text" className="flex-1 h-4" />
          </div>
        ))}
      </div>
      <Skeleton variant="rounded" className="w-full h-12" />
    </div>
  );
}

// Export all components
export default Skeleton;
