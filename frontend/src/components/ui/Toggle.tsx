import { Moon, Sun } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  showIcons?: boolean;
  className?: string;
}

export default function Toggle({ enabled, onChange, label, showIcons = false, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn('flex items-center gap-3', className)}
    >
      {label && (
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
          {label}
        </span>
      )}
      <div
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300',
          enabled
            ? 'bg-gradient-to-r from-primary-500 to-accent-500'
            : 'bg-surface-300 dark:bg-surface-600',
        )}
      >
        <span
          className={cn(
            'inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300',
            enabled ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        >
          {showIcons && (
            enabled ? (
              <Moon className="w-3 h-3 text-primary-600" />
            ) : (
              <Sun className="w-3 h-3 text-amber-500" />
            )
          )}
        </span>
      </div>
    </button>
  );
}
