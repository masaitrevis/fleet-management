import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  circle?: boolean;
  count?: number;
}

export default function Skeleton({
  width,
  height,
  className,
  circle = false,
  count = 1,
}: SkeletonProps) {
  const style: CSSProperties = {};
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-gray-200 relative overflow-hidden',
            circle && 'rounded-full',
            !circle && 'rounded-md',
            className
          )}
          style={style}
        >
          {/* Shimmer overlay */}
          <div
            className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            }}
          />
        </div>
      ))}
    </>
  );
}

// Skeleton variants for common use cases
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton circle width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton height={16} className="w-3/4" />
          <Skeleton height={12} className="w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton height={12} />
        <Skeleton height={12} className="w-5/6" />
        <Skeleton height={12} className="w-4/6" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} height={16} />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-200
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <Skeleton key={colIdx} height={12} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}
