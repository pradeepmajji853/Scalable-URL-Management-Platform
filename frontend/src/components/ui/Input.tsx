import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  rightElement?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, rightElement, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400 dark:text-surface-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full rounded-xl border bg-white dark:bg-surface-900',
              'border-surface-300 dark:border-surface-700',
              'text-surface-900 dark:text-surface-100',
              'placeholder:text-surface-400 dark:placeholder:text-surface-500',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 dark:focus:border-primary-500',
              'transition-all duration-200',
              'text-sm py-2.5',
              leftIcon ? 'pl-10' : 'pl-4',
              rightIcon || rightElement ? 'pr-10' : 'pr-4',
              error && 'border-red-500 dark:border-red-500 focus:ring-red-500/50 focus:border-red-500',
              props.disabled && 'opacity-50 cursor-not-allowed bg-surface-50 dark:bg-surface-800',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-surface-400 dark:text-surface-500">
              {rightIcon}
            </div>
          )}
          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500 dark:text-red-400 animate-slide-down">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-surface-500 dark:text-surface-400">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
