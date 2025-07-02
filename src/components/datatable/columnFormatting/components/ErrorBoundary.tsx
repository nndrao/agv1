import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;
  // private previousResetKeys: Array<string | number> = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError } = this.props;
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Error Info:', errorInfo);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Update state with error info
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Auto-recover after 3 errors to prevent infinite loops
    if (this.state.errorCount >= 3) {
      this.scheduleReset(5000);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset on prop changes if enabled
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }

    // Reset when reset keys change
    if (
      resetKeys &&
      hasError &&
      !this.arraysEqual(prevProps.resetKeys || [], resetKeys)
    ) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  arraysEqual = (a: Array<string | number>, b: Array<string | number>): boolean => {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  };

  scheduleReset = (delay: number) => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary();
    }, delay);
  };

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  render() {
    const { hasError, error, errorCount } = this.state;
    const { fallback, children, isolate } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default error UI
      return (
        <div className={`error-boundary-fallback ${isolate ? 'p-4' : 'p-8'}`}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                <p className="text-sm">
                  {error.message || 'An unexpected error occurred'}
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer">
                      Error details (Development only)
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto p-2 bg-muted rounded">
                      {error.stack}
                    </pre>
                  </details>
                )}
                {errorCount >= 3 && (
                  <p className="text-xs text-muted-foreground">
                    Auto-recovery in progress...
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={this.resetErrorBoundary}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Try Again
            </Button>
            {!isolate && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook to create error boundary wrapper
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Specialized error boundary for isolated components
 */
export const IsolatedErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}> = ({ children, fallback, componentName }) => {
  return (
    <ErrorBoundary
      isolate
      fallback={
        fallback || (
          <div className="p-2 text-xs text-muted-foreground text-center">
            {componentName ? `Error in ${componentName}` : 'Component error'}
          </div>
        )
      }
      resetOnPropsChange
    >
      {children}
    </ErrorBoundary>
  );
};