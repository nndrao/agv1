import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { DockviewDataTableApp } from '@/components/dockview/DockviewDataTableApp';

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center p-8 bg-background">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-xl font-semibold text-destructive">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          An error occurred while loading the application.
        </p>
        <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-32">
          {error.message}
        </pre>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

/**
 * Main App component using Dockview for multiple DataTable instances
 */
function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <DockviewDataTableApp />
    </ErrorBoundary>
  );
}

export default App;