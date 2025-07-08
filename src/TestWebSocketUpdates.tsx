import React, { useEffect, useState } from 'react';
import { DataTableContainer } from '@/components/datatable/DataTableContainer';
import { useDatasourceStore } from '@/stores/datasource.store';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Mock datasource configuration
const MOCK_DATASOURCE_CONFIG = {
  id: 'mock-websocket-test',
  name: 'Mock WebSocket Test',
  type: 'stomp' as const,
  websocketUrl: 'ws://localhost:8080/mock',
  listenerTopic: '/topic/mock',
  requestMessage: '/app/mock/request',
  snapshotEndToken: 'SNAPSHOT_END',
  keyColumn: 'id',
  columnDefinitions: [
    { field: 'id', headerName: 'ID', cellDataType: 'number' as const },
    { field: 'symbol', headerName: 'Symbol', cellDataType: 'text' as const },
    { field: 'price', headerName: 'Price', cellDataType: 'number' as const },
    { field: 'quantity', headerName: 'Quantity', cellDataType: 'number' as const },
    { field: 'side', headerName: 'Side', cellDataType: 'text' as const },
    { field: 'timestamp', headerName: 'Last Updated', cellDataType: 'text' as const },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  autoStart: true,
};

export function TestWebSocketUpdates() {
  const { addDatasource, getDatasource, deleteDatasource } = useDatasourceStore();
  const [isSetup, setIsSetup] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if mock datasource already exists
    const existing = getDatasource(MOCK_DATASOURCE_CONFIG.id);
    if (!existing) {
      // Add mock datasource
      addDatasource(MOCK_DATASOURCE_CONFIG);
      console.log('[TestWebSocketUpdates] Added mock datasource');
      toast({
        title: 'Mock Datasource Added',
        description: 'Mock WebSocket datasource has been configured',
      });
    }
    setIsSetup(true);

    // Cleanup on unmount
    return () => {
      // Optionally remove the mock datasource
      // deleteDatasource(MOCK_DATASOURCE_CONFIG.id);
    };
  }, []);

  const handleRemoveDatasource = () => {
    deleteDatasource(MOCK_DATASOURCE_CONFIG.id);
    toast({
      title: 'Datasource Removed',
      description: 'Mock datasource has been removed',
    });
  };

  if (!isSetup) {
    return <div>Setting up mock datasource...</div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-lg font-semibold">WebSocket Real-Time Updates Test</h1>
          <div className="flex gap-2">
            <Button
              onClick={handleRemoveDatasource}
              variant="destructive"
              size="sm"
            >
              Remove Mock Datasource
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - DataTableContainer with mock datasource */}
      <main className="flex-1 overflow-hidden">
        <DataTableContainer 
          columnDefs={[]} 
          dataRow={[]}
          instanceId="websocket-test"
        />
      </main>
    </div>
  );
}