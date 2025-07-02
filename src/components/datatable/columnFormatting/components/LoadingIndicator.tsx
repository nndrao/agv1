import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LoadingIndicatorProps {
  isLoading: boolean;
  progress?: number;
  message?: string;
  variant?: 'inline' | 'overlay' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  isLoading,
  progress,
  message = 'Processing...',
  variant = 'inline',
  size = 'md',
  className,
}) => {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (variant === 'minimal') {
    return (
      <Loader2 
        className={cn(
          sizeClasses[size], 
          'animate-spin text-muted-foreground',
          className
        )} 
      />
    );
  }

  if (variant === 'overlay') {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3 p-6 bg-background border rounded-lg shadow-lg">
          <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />
          {message && (
            <p className={cn(textSizeClasses[size], 'text-muted-foreground')}>
              {message}
            </p>
          )}
          {progress !== undefined && (
            <Progress value={progress} className="w-48" />
          )}
        </div>
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />
      {message && (
        <span className={cn(textSizeClasses[size], 'text-muted-foreground')}>
          {message}
        </span>
      )}
      {progress !== undefined && (
        <Progress value={progress} className="w-24" />
      )}
    </div>
  );
};

interface OperationStatusProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const OperationStatus: React.FC<OperationStatusProps> = ({
  status,
  message,
  error,
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (status === 'idle') return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {status === 'loading' && (
        <>
          <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />
          <span className={cn(textSizeClasses[size], 'text-muted-foreground')}>
            {message || 'Processing...'}
          </span>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle className={cn(sizeClasses[size], 'text-green-600')} />
          <span className={cn(textSizeClasses[size], 'text-green-600')}>
            {message || 'Success'}
          </span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className={cn(sizeClasses[size], 'text-destructive')} />
          <span className={cn(textSizeClasses[size], 'text-destructive')}>
            {error || message || 'Error occurred'}
          </span>
        </>
      )}
    </div>
  );
};

// Hook for managing operation status
export function useOperationStatus(autoReset?: number) {
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');
  const timeoutRef = React.useRef<number>();

  React.useEffect(() => {
    if (autoReset && (status === 'success' || status === 'error')) {
      timeoutRef.current = window.setTimeout(() => {
        setStatus('idle');
        setMessage('');
        setError('');
      }, autoReset);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [status, autoReset]);

  const startOperation = (msg?: string) => {
    setStatus('loading');
    setMessage(msg || '');
    setError('');
  };

  const completeOperation = (msg?: string) => {
    setStatus('success');
    setMessage(msg || '');
    setError('');
  };

  const failOperation = (err: string, msg?: string) => {
    setStatus('error');
    setError(err);
    setMessage(msg || '');
  };

  const resetOperation = () => {
    setStatus('idle');
    setMessage('');
    setError('');
  };

  return {
    status,
    message,
    error,
    startOperation,
    completeOperation,
    failOperation,
    resetOperation,
  };
}