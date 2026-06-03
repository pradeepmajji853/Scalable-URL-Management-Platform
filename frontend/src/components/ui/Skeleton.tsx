import { cn } from '../../lib/utils';

type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card';

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export default function Skeleton({
  variant = 'text',
  className,
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  if (variant === 'circle') {
    return (
      <div
        className={cn('skeleton rounded-full w-10 h-10', className)}
        style={style}
      />
    );
  }

  if (variant === 'rect') {
    return (
      <div
        className={cn('skeleton rounded-xl w-full h-32', className)}
        style={style}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('rounded-2xl border border-surface-200 dark:border-surface-700 p-6 space-y-4', className)}>
        <div className="flex items-center gap-3">
          <div className="skeleton rounded-full w-10 h-10" />
          <div className="space-y-2 flex-1">
            <div className="skeleton rounded h-4 w-1/3" />
            <div className="skeleton rounded h-3 w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="skeleton rounded h-3 w-full" />
          <div className="skeleton rounded h-3 w-5/6" />
          <div className="skeleton rounded h-3 w-4/6" />
        </div>
      </div>
    );
  }

  // Text variant
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'skeleton rounded h-4',
            i === lines - 1 && lines > 1 ? 'w-4/6' : 'w-full',
          )}
          style={i === 0 ? style : undefined}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="skeleton rounded h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex gap-4 px-4 py-4 border-t border-surface-100 dark:border-surface-800">
          {Array.from({ length: columns }).map((_, ci) => (
            <div key={ci} className="skeleton rounded h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
