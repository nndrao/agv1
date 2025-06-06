import React, { createContext } from 'react';
import { DataTableContextValue } from './types';

export const DataTableContext = createContext<DataTableContextValue | undefined>(undefined);

export const DataTableProvider: React.FC<{
  children: React.ReactNode;
  value: DataTableContextValue;
}> = ({ children, value }) => {
  return (
    <DataTableContext.Provider value={value}>
      {children}
    </DataTableContext.Provider>
  );
};