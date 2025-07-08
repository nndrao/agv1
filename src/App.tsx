import { useState, useEffect, useCallback, Suspense } from 'react';
import { AppWithContainer } from './AppWithContainer';
import { Menu } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';

import { ThemeToggle } from '@/components/datatable/ThemeToggle';
import { GridSkeleton, usePreloadAgGrid } from '@/components/datatable/LazyAgGrid';
import { DataTableSimplified } from '@/components/datatable/DataTableSimplified';
import { generateFixedIncomeData, type FixedIncomePosition } from '@/components/datatable/lib/dataGenerator';
import { inferColumnDefinitions } from '@/utils/columnUtils';
import { type ColumnDef } from '@/components/datatable/types';

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h2 className="text-lg font-semibold text-destructive">Something went wrong</h2>
        <pre className="text-sm text-muted-foreground">{error.message}</pre>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// Async data generation wrapper
async function generateDataAsync(rowCount: number): Promise<FixedIncomePosition[]> {
  return new Promise((resolve) => {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const data = generateFixedIncomeData(rowCount);
        resolve(data);
      });
    } else {
      setTimeout(() => {
        const data = generateFixedIncomeData(rowCount);
        resolve(data);
      }, 0);
    }
  });
}

// Legacy App component - will be replaced by AppWithContainer
function LegacyApp() {
  const [data, setData] = useState<FixedIncomePosition[]>([]);
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  // Preload AG-Grid modules
  usePreloadAgGrid();

  // Generate data asynchronously
  const loadData = useCallback(async () => {
    try {
      const generatedData = await generateDataAsync(10000);
      const inferredColumns = inferColumnDefinitions(generatedData);
      
      setData(generatedData);
      setColumns(inferredColumns);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to generate data:', error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Menu className="h-6 w-6" />
            <h1 className="text-lg font-semibold">Fixed Income Portfolio</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content - Full Width DataTable */}
      <main className="flex-1 flex items-center justify-center p-2 min-h-0">
        <div className="w-full h-full">
          <div className="h-full rounded-lg border bg-card shadow-sm overflow-hidden">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Suspense fallback={<GridSkeleton />}>
                {!isLoading && data.length > 0 ? (
                  <DataTableSimplified columnDefs={columns} dataRow={data} />
                ) : (
                  <GridSkeleton />
                )}
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t">
        <div className="flex h-12 items-center justify-center px-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Your Company. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const [useContainer] = useState(false); // Set to false to use simplified version
  
  if (useContainer) {
    return <AppWithContainer />;
  }
  
  return <LegacyApp />;
}

export default App;