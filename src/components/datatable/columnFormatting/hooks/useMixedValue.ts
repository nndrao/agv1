import { useMemo } from 'react';
import { useColumnFormattingStore } from '../store/columnFormatting.store';

export interface MixedValue<T = any> {
  value: T | null;
  isMixed: boolean;
  allValues: T[];
}

/**
 * Hook to get mixed values for multi-column editing
 * Eliminates duplicate getMixedValueLocal functions across components
 */
export function useMixedValue(property: string, selectedColumns: Set<string>): MixedValue {
  const { columnDefinitions, pendingChanges } = useColumnFormattingStore();

  return useMemo(() => {
    const values = new Set();
    const allValues: unknown[] = [];

    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const pendingChange = pendingChanges.get(colId);
      
      // Check pending changes first, then fall back to column definition
      let value;
      if (pendingChange && property in pendingChange) {
        value = pendingChange[property as keyof typeof pendingChange];
      } else if (colDef) {
        value = (colDef as any)[property];
      }
      
      if (value !== undefined) {
        values.add(JSON.stringify(value));
        allValues.push(value);
      }
    });

    const isMixed = values.size > 1;
    const firstValue = allValues[0];

    return {
      value: isMixed ? null : firstValue ?? null,
      isMixed,
      allValues
    };
  }, [property, selectedColumns, columnDefinitions, pendingChanges]);
}

/**
 * Hook to get multiple mixed values at once
 * Useful for components that need many properties
 */
export function useMixedValues(properties: string[], selectedColumns: Set<string>) {
  const { columnDefinitions, pendingChanges } = useColumnFormattingStore();

  return useMemo(() => {
    const results: Record<string, MixedValue> = {};

    properties.forEach(property => {
      const values = new Set();
      const allValues: unknown[] = [];

      selectedColumns.forEach(colId => {
        const colDef = columnDefinitions.get(colId);
        const pendingChange = pendingChanges.get(colId);
        
        let value;
        if (pendingChange && property in pendingChange) {
          value = pendingChange[property as keyof typeof pendingChange];
        } else if (colDef) {
          value = (colDef as any)[property];
        }
        
        if (value !== undefined) {
          values.add(JSON.stringify(value));
          allValues.push(value);
        }
      });

      const isMixed = values.size > 1;
      const firstValue = allValues[0];

      results[property] = {
        value: isMixed ? null : firstValue ?? null,
        isMixed,
        allValues
      };
    });

    return results;
  }, [properties, selectedColumns, columnDefinitions, pendingChanges]);
}