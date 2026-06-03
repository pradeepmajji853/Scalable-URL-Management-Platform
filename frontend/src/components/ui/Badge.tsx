import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-500/30',
  warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-500/30',
  error: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-red-600/20 dark:ring-red-500/30',
  info: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-600/20 dark:ring-blue-500/30',
  neutral: 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 ring-surface-500/20',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  neutral: 'bg-surface-400',
};

export default function Badge({ children, variant = 'neutral', dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ring-1 ring-inset',
        variantStyles[variant],
        className,
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
