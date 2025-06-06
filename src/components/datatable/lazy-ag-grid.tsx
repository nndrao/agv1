import { lazy, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load AG-Grid modules
const loadAgGridModules = () => {
  // perfMonitor.mark('ag-grid-load-start');
  
  return Promise.all([
    import('ag-grid-community'),
    import('ag-grid-enterprise'),
    import('ag-grid-react')
  ]).then(([community, enterprise, react]) => {
    // Register modules
    community.ModuleRegistry.registerModules([enterprise.AllEnterpriseModule]);
    
    // perfMonitor.mark('ag-grid-load-end');
    // perfMonitor.measure('agGridLoadTime', 'ag-grid-load-start', 'ag-grid-load-end');
    
    return {
      ...community,
      ...enterprise,
      AgGridReact: react.AgGridReact
    };
  });
};

// Grid skeleton component
export const GridSkeleton = () => {
  return (
    <div className="h-full w-full flex flex-col p-4 space-y-4">
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      
      {/* Grid skeleton */}
      <div className="flex-1 border rounded-md overflow-hidden">
        {/* Header */}
        <div className="h-12 bg-muted/50 border-b flex">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-1 p-3 border-r">
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
        
        {/* Rows */}
        <div className="space-y-0">
          {Array.from({ length: 12 }).map((_, rowIndex) => (
            <div key={rowIndex} className="h-10 border-b flex">
              {Array.from({ length: 8 }).map((_, colIndex) => (
                <div key={colIndex} className="flex-1 p-2 border-r">
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading grid...</p>
        </div>
      </div>
    </div>
  );
};

// Export the lazy-loaded DataTable
export const LazyDataTable = lazy(() => {
  // perfMonitor.mark('datatable-import-start');
  
  return import('./data-table').then(module => {
    // perfMonitor.mark('datatable-import-end');
    // perfMonitor.measure('dataTableImportTime', 'datatable-import-start', 'datatable-import-end');
    
    return {
      default: module.DataTable
    };
  });
});

// Preload AG-Grid modules function
export const preloadAgGrid = () => {
  return loadAgGridModules();
};

// Hook to preload on idle
export const usePreloadAgGrid = () => {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const handle = requestIdleCallback(() => {
        preloadAgGrid();
      }, { timeout: 2000 });
      
      return () => cancelIdleCallback(handle);
    } else {
      // Fallback for browsers without requestIdleCallback
      const timer = setTimeout(() => {
        preloadAgGrid();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);
};