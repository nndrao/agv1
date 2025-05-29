// Utility to serialize and deserialize style functions for localStorage

import { ColDef } from 'ag-grid-community';

export interface SerializedStyle {
  type: 'static' | 'function';
  value?: React.CSSProperties;
  formatString?: string;
  baseStyle?: React.CSSProperties;
}

export interface SerializedColumnDef extends Omit<ColDef, 'cellStyle' | 'headerStyle'> {
  cellStyle?: SerializedStyle;
  headerStyle?: SerializedStyle;
}

// Serialize a column definition with style functions
export function serializeColumnDef(colDef: ColDef): SerializedColumnDef {
  const serialized = { ...colDef };
  
  // Handle cellStyle
  if (colDef.cellStyle) {
    if (typeof colDef.cellStyle === 'function') {
      // Try to extract format string from function (this is a workaround)
      // In production, you'd want to store the format configuration separately
      serialized.cellStyle = {
        type: 'function',
        // Store function as string for now - we'll need to improve this
        formatString: colDef._cellStyleFormat || '',
        baseStyle: colDef._cellStyleBase || {}
      };
    } else {
      serialized.cellStyle = {
        type: 'static',
        value: colDef.cellStyle
      };
    }
  }
  
  // Handle headerStyle
  if (colDef.headerStyle) {
    if (typeof colDef.headerStyle === 'function') {
      serialized.headerStyle = {
        type: 'function',
        value: {} // Header style functions typically return empty for floating filters
      };
    } else {
      serialized.headerStyle = {
        type: 'static',
        value: colDef.headerStyle
      };
    }
  }
  
  return serialized;
}

// Deserialize a column definition and recreate style functions
export function deserializeColumnDef(serialized: SerializedColumnDef): ColDef {
  const colDef = { ...serialized };
  
  // Handle cellStyle
  if (serialized.cellStyle && typeof serialized.cellStyle === 'object' && 'type' in serialized.cellStyle) {
    const styleConfig = serialized.cellStyle as SerializedStyle;
    
    if (styleConfig.type === 'static' && styleConfig.value) {
      colDef.cellStyle = styleConfig.value;
    } else if (styleConfig.type === 'function' && styleConfig.formatString) {
      // Recreate the cell style function
      // This is a simplified version - you'd need the actual createCellStyleFunction
      colDef.cellStyle = () => {
        // For now, just return the base style
        // In production, you'd recreate the conditional logic
        return styleConfig.baseStyle || {};
      };
    }
  }
  
  // Handle headerStyle
  if (serialized.headerStyle && typeof serialized.headerStyle === 'object' && 'type' in serialized.headerStyle) {
    const styleConfig = serialized.headerStyle as SerializedStyle;
    
    if (styleConfig.type === 'static' && styleConfig.value) {
      colDef.headerStyle = styleConfig.value;
    } else if (styleConfig.type === 'function') {
      // Recreate header style function that avoids floating filter
      colDef.headerStyle = (params: { floatingFilter?: boolean }) => {
        if (params?.floatingFilter) {
          return null;
        }
        return styleConfig.value || {};
      };
    }
  }
  
  return colDef;
}

// Serialize all column definitions
export function serializeColumnDefs(columnDefs: ColDef[]): SerializedColumnDef[] {
  return columnDefs.map(serializeColumnDef);
}

// Deserialize all column definitions
export function deserializeColumnDefs(serialized: SerializedColumnDef[]): ColDef[] {
  return serialized.map(deserializeColumnDef);
}