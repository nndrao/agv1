import { useMemo } from 'react';
import { createCellStyleFunction, hasConditionalStyling } from '../utils/style-utils';
import { ColumnDef } from '../types';

/**
 * Custom hook that processes columns to ensure cellStyle functions are created
 * for columns with conditional formatting in their valueFormatters.
 * 
 * This preserves the CRITICAL functionality from ensureCellStyleForColumns
 * that merges base styles with conditional styles.
 */
export function useColumnProcessor(columns: ColumnDef[]): ColumnDef[] {
  return useMemo(() => {
    let hasChanges = false;
    
    const processed = columns.map(col => {
      // Check if valueFormatter has conditional styling that needs cellStyle
      if (!col.valueFormatter || typeof col.valueFormatter !== 'function') {
        return col;
      }
      
      const formatString = (col.valueFormatter as any).__formatString;
      
      if (!formatString || !hasConditionalStyling(formatString)) {
        return col;
      }
      
      // Check if cellStyle needs to be created or updated
      const existingCellStyle = col.cellStyle as any;
      const needsCellStyle = !col.cellStyle || 
                            (typeof col.cellStyle === 'function' && 
                             existingCellStyle.__formatString !== formatString);
      
      if (!needsCellStyle) {
        return col;
      }
      
      hasChanges = true;
      
      console.log('[useColumnProcessor] Creating cellStyle for conditional formatting:', {
        field: col.field,
        formatString,
        hasExistingCellStyle: !!col.cellStyle
      });
      
      // Extract base style if it exists
      let baseStyle: React.CSSProperties = {};
      if (col.cellStyle) {
        if (typeof col.cellStyle === 'object') {
          baseStyle = col.cellStyle as React.CSSProperties;
        } else if (typeof col.cellStyle === 'function' && existingCellStyle.__baseStyle) {
          baseStyle = existingCellStyle.__baseStyle;
        }
      }
      
      // Create cellStyle function with proper base style merging
      const cellStyleFn = createCellStyleFunction(formatString, baseStyle);
      
      // Attach metadata for future serialization
      Object.defineProperty(cellStyleFn, '__formatString', { 
        value: formatString, 
        writable: false,
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(cellStyleFn, '__baseStyle', { 
        value: baseStyle, 
        writable: false,
        enumerable: false,
        configurable: true
      });
      
      return { ...col, cellStyle: cellStyleFn };
    });
    
    // Only return new array if changes were made
    return hasChanges ? processed : columns;
  }, [columns]);
}