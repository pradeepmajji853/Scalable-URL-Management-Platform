import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  children,
  className,
  hover = false,
  gradient = false,
  padding = 'md',
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border',
        'bg-white/80 dark:bg-surface-900/80',
        'backdrop-blur-xl',
        'border-surface-200/60 dark:border-surface-700/50',
        'shadow-lg shadow-surface-900/5 dark:shadow-black/20',
        paddingStyles[padding],
        hover && 'hover-card cursor-pointer hover:border-primary-300 dark:hover:border-primary-700',
        gradient && 'gradient-border',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}

// Card sub-components
export function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn('text-lg font-semibold text-surface-900 dark:text-surface-100', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('text-sm text-surface-500 dark:text-surface-400 mt-1', className)}>
      {children}
    </p>
  );
}
