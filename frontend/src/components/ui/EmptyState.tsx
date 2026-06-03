import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import Button from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      {icon && (
        <div className="mb-6 p-4 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 text-center max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
