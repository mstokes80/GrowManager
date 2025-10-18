import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
  text?: string;
  className?: string;
}

/**
 * LoadingSpinner component displays a loading indicator.
 * Can be used inline or as a full-page overlay.
 */
export function LoadingSpinner({
  size = 'md',
  fullPage = false,
  text,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const spinner = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullPage && 'min-h-screen',
        className
      )}
    >
      <Loader2
        className={cn('animate-spin text-grow', sizeClasses[size])}
        aria-hidden="true"
      />
      {text && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {text}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );

  return spinner;
}