import React, { useEffect, useState, useRef } from 'react';
import { GridApi } from 'ag-grid-community';
import { DataTableSimplified } from '@/components/datatable/DataTableSimplified';
import { ColumnDef } from '@/components/datatable/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TestData {
  id: number;
  name: string;
  value: number;
  timestamp: string;
}

// Generate initial test data
function generateInitialData(count: number): TestData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    value: Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
  }));
}

// Test component for real-time updates
export function TestRealTimeUpdates() {
  const [data, setData] = useState<TestData[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const gridApiRef = useRef<GridApi | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Column definitions with cell flashing enabled
  const columns: ColumnDef[] = [
    { 
      field: 'id', 
      headerName: 'ID', 
      type: 'number',
      enableCellChangeFlash: true,
    },
    { 
      field: 'name', 
      headerName: 'Name', 
      type: 'text',
      enableCellChangeFlash: true,
    },
    { 
      field: 'value', 
      headerName: 'Value', 
      type: 'number',
      enableCellChangeFlash: true,
      cellDataType: 'number',
    },
    { 
      field: 'timestamp', 
      headerName: 'Last Updated', 
      type: 'text',
      enableCellChangeFlash: true,
    },
  ];

  // Initialize data
  useEffect(() => {
    const initialData = generateInitialData(100);
    setData(initialData);
    console.log('[TestRealTimeUpdates] Initialized with', initialData.length, 'rows');
  }, []);

  // Handle grid ready
  const onGridReady = (api: GridApi) => {
    gridApiRef.current = api;
    console.log('[TestRealTimeUpdates] Grid ready, API available');
    
    // Configure grid for updates
    api.setGridOption('getRowId', (params: any) => params.data.id);
    api.setGridOption('enableCellChangeFlash', true);
    api.setGridOption('cellFlashDelay', 500);
    api.setGridOption('cellFadeDelay', 500);
  };

  // Start real-time updates
  const startUpdates = () => {
    if (!gridApiRef.current) {
      toast({
        title: 'Error',
        description: 'Grid not ready',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    console.log('[TestRealTimeUpdates] Starting real-time updates');

    // Update random rows every 500ms
    intervalRef.current = setInterval(() => {
      const numUpdates = Math.floor(Math.random() * 5) + 1; // 1-5 updates
      const updates: TestData[] = [];

      for (let i = 0; i < numUpdates; i++) {
        const rowId = Math.floor(Math.random() * 100) + 1;
        updates.push({
          id: rowId,
          name: `Item ${rowId}`,
          value: Math.floor(Math.random() * 1000),
          timestamp: new Date().toISOString(),
        });
      }

      // Apply updates using applyTransactionAsync
      const result = gridApiRef.current!.applyTransactionAsync({
        update: updates,
      });

      console.log(`[TestRealTimeUpdates] Applied ${updates.length} updates`, {
        updates,
        result,
      });
    }, 500);

    toast({
      title: 'Updates started',
      description: 'Simulating real-time data updates',
    });
  };

  // Stop real-time updates
  const stopUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsUpdating(false);
    console.log('[TestRealTimeUpdates] Stopped real-time updates');

    toast({
      title: 'Updates stopped',
      description: 'Real-time updates have been stopped',
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-lg font-semibold">Real-Time Updates Test</h1>
          <div className="flex gap-2">
            <Button
              onClick={startUpdates}
              disabled={isUpdating}
              variant={isUpdating ? 'secondary' : 'default'}
            >
              {isUpdating ? 'Updates Running...' : 'Start Updates'}
            </Button>
            <Button
              onClick={stopUpdates}
              disabled={!isUpdating}
              variant="destructive"
            >
              Stop Updates
            </Button>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 p-4">
        <div className="h-full rounded-lg border bg-card shadow-sm overflow-hidden">
          <DataTableSimplified 
            columnDefs={columns} 
            dataRow={data}
            onGridReady={onGridReady}
          />
        </div>
      </main>
    </div>
  );
}