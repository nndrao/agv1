import React from 'react';
import { DataTableContainer } from './DataTableContainer';
import { DataTableErrorBoundary } from './DataTableErrorBoundary';
import { DataTableProps } from './types';

/**
 * Main DataTable component that wraps the container with error boundary.
 * This is the public API that consumers import.
 */
export function DataTable(props: DataTableProps) {
  return (
    <DataTableErrorBoundary>
      <DataTableContainer {...props} />
    </DataTableErrorBoundary>
  );
}