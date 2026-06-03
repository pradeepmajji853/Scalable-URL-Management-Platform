import { useEffect, useState, useRef, type ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn, formatNumber } from '../../lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  trend?: number; // percentage change
  icon: ReactNode;
  gradient?: boolean;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const startValue = displayValue;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span>
      {prefix}{formatNumber(displayValue)}{suffix}
    </span>
  );
}

export default function StatsCard({
  title,
  value,
  suffix,
  prefix,
  trend,
  icon,
  gradient = false,
  className,
  gradientFrom = 'from-primary-500',
  gradientTo = 'to-accent-500',
}: StatsCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1',
        gradient
          ? `bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-xl shadow-primary-500/20`
          : 'glass-card',
        className,
      )}
    >
      {/* Background decoration */}
      {gradient && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
      )}

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              'p-2.5 rounded-xl',
              gradient
                ? 'bg-white/20'
                : 'bg-primary-50 dark:bg-primary-500/10',
            )}
          >
            <div className={cn(!gradient && 'text-primary-600 dark:text-primary-400')}>
              {icon}
            </div>
          </div>
          {trend !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                gradient
                  ? 'bg-white/20'
                  : isPositive
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        <div className={cn('text-3xl font-bold tracking-tight', !gradient && 'text-surface-900 dark:text-surface-100')}>
          <AnimatedCounter value={value} suffix={suffix} prefix={prefix} />
        </div>
        <p className={cn('text-sm mt-1', gradient ? 'text-white/80' : 'text-surface-500 dark:text-surface-400')}>
          {title}
        </p>
      </div>
    </div>
  );
}
