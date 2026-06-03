import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950" />

      {/* Decorative elements */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary-400/20 dark:bg-primary-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent-400/20 dark:bg-accent-500/10 rounded-full blur-3xl animate-float animate-delay-300" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-300/10 dark:bg-primary-500/5 rounded-full blur-3xl" />

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-50" />

      {/* Content */}
      <div className="relative w-full max-w-md animate-scale-in">
        {/* Back to home */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Linkly</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-1">
            {title}
          </h1>
          {subtitle && (
            <p className="text-surface-500 dark:text-surface-400 mb-8">
              {subtitle}
            </p>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
