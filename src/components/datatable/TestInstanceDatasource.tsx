import React from 'react';
import { DataTableContainer } from './DataTableContainer';
import { DatasourceProvider } from '@/contexts/DatasourceContext';

/**
 * Test component to verify that datasource selection is instance-specific
 */
export const TestInstanceDatasource: React.FC = () => {
  // Sample data for testing
  const sampleData = [
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 },
    { id: 3, name: 'Item 3', value: 300 },
  ];

  const columnDefs = [
    { field: 'id', headerName: 'ID' },
    { field: 'name', headerName: 'Name' },
    { field: 'value', headerName: 'Value' },
  ];

  return (
    <DatasourceProvider>
      <div className="flex flex-col gap-4 p-4">
        <h2 className="text-xl font-bold">Test: Instance-Specific Datasource Selection</h2>
        <p className="text-sm text-muted-foreground">
          Each table below should maintain its own datasource selection independently.
          Changing the datasource in one table should NOT affect the others.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Table Instance 1</h3>
            <DataTableContainer
              instanceId="test-table-1"
              columnDefs={columnDefs}
              dataRow={sampleData}
            />
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Table Instance 2</h3>
            <DataTableContainer
              instanceId="test-table-2"
              columnDefs={columnDefs}
              dataRow={sampleData}
            />
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Table Instance 3</h3>
          <DataTableContainer
            instanceId="test-table-3"
            columnDefs={columnDefs}
            dataRow={sampleData}
          />
        </div>
      </div>
    </DatasourceProvider>
  );
};