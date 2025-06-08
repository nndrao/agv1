import { Menu } from 'lucide-react';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ThemeToggle } from '@/components/datatable/ThemeToggle';
import { LazyDataTable, GridSkeleton, usePreloadAgGrid } from '@/components/datatable/LazyAgGrid';
import { generateFixedIncomeData, type FixedIncomePosition } from '@/components/datatable/lib/dataGenerator';
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

function inferColumnDefinitions(data: FixedIncomePosition[]): ColumnDef[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  // Use a fixed sample size for efficiency
  const SAMPLE_SIZE = 10;
  const sampleData = data.slice(0, SAMPLE_SIZE);

  // Get all unique keys from the first row
  const keys = Object.keys(data[0]);

  // Improved type inference: handle null/undefined, mixed types
  const inferType = (values: unknown[]): string => {
    let hasNumber = false, hasDate = false, hasBoolean = false, hasString = false;
    for (const value of values) {
      if (value === null || value === undefined) continue;
      if (typeof value === 'number' && !isNaN(value)) hasNumber = true;
      else if (typeof value === 'boolean') hasBoolean = true;
      else if (typeof value === 'string') {
        if (!isNaN(Date.parse(value))) hasDate = true;
        else hasString = true;
      } else if (value instanceof Date && !isNaN(value.getTime())) hasDate = true;
      else hasString = true;
    }
    if (hasNumber && !hasString && !hasDate && !hasBoolean) return 'number';
    if (hasDate && !hasString && !hasNumber && !hasBoolean) return 'date';
    if (hasBoolean && !hasString && !hasNumber && !hasDate) return 'boolean';
    return 'string';
  };

  return keys.map(key => {
    const sampleValues = sampleData.map(row => row[key]);
    const inferredType = inferType(sampleValues);
    let cellDataType: 'text' | 'number' | 'date' | 'boolean' = 'text';
    switch (inferredType) {
      case 'number': cellDataType = 'number'; break;
      case 'date': cellDataType = 'date'; break;
      case 'boolean': cellDataType = 'boolean'; break;
      default: cellDataType = 'text';
    }
    return {
      field: key,
      headerName: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim(),
      cellDataType,
    };
  });
}

// Async data generation wrapper
async function generateDataAsync(rowCount: number): Promise<FixedIncomePosition[]> {
  return new Promise((resolve) => {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // perfMonitor.mark('data-generation-start');
        const data = generateFixedIncomeData(rowCount);
        // perfMonitor.mark('data-generation-end');
        // perfMonitor.measure('dataGenerationTime', 'data-generation-start', 'data-generation-end');
        resolve(data);
      });
    } else {
      setTimeout(() => {
        // perfMonitor.mark('data-generation-start');
        const data = generateFixedIncomeData(rowCount);
        // perfMonitor.mark('data-generation-end');
        // perfMonitor.measure('dataGenerationTime', 'data-generation-start', 'data-generation-end');
        resolve(data);
      }, 0);
    }
  });
}

function App() {
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
      
      // perfMonitor.measureFromStart('dataReadyTime');
    } catch (error) {
      console.error('Failed to generate data:', error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    // Mark when app is fully loaded
    if (!isLoading && data.length > 0) {
      // perfMonitor.measureFromStart('fullyLoadedTime');
      // perfMonitor.logSummary();
    }
  }, [isLoading, data.length]);

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
                  <LazyDataTable columnDefs={columns} dataRow={data} />
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


export default App;