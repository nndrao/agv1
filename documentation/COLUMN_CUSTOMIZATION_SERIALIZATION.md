# Column Customization Serialization & Deserialization Documentation

## Overview

This document provides granular details on how column settings are serialized from the Column Customization dialog, stored, and then deserialized back to AG-Grid column definitions. The process involves multiple layers of state management, function serialization, and metadata preservation.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tab-by-Tab Serialization](#tab-by-tab-serialization)
3. [Storage Mechanism](#storage-mechanism)
4. [Deserialization Process](#deserialization-process)
5. [Column Definition Creation](#column-definition-creation)
6. [AG-Grid Application](#ag-grid-application)

## Architecture Overview

### Key Components

1. **Column Formatting Store** (`columnFormatting.store.ts`)
   - Manages pending changes for selected columns
   - Handles bulk property updates
   - Maintains column definitions map

2. **Profile Store** (`profile.store.ts`)
   - Persists column customizations to localStorage
   - Manages multiple profiles
   - Handles state restoration

3. **Column Processor Hook** (`useColumnProcessor.ts`)
   - Processes column definitions before AG-Grid rendering
   - Ensures cellStyle functions are properly attached
   - Maintains metadata for serialization

## Tab-by-Tab Serialization

### 1. General Tab

**Component**: `GeneralCustomContent.tsx`

**Serialized Properties**:
```typescript
{
  headerName: string,              // Column display name
  width: number,                   // Column width in pixels
  hide: boolean,                   // Column visibility
  lockPosition: boolean | 'left' | 'right', // Pin state
  lockVisible: boolean,            // Lock visibility toggle
  sort: 'asc' | 'desc' | null,   // Sort direction
  sortIndex: number | null,        // Multi-sort order
  flex: number | null,            // Flex sizing ratio
  maxWidth: number | null,        // Maximum width constraint
  minWidth: number | null         // Minimum width constraint
}
```

**Update Process**:
```typescript
// Width update example
updateBulkProperty('width', 150);

// Pin state update
updateBulkProperty('lockPosition', 'left');
updateBulkProperty('pinned', 'left'); // AG-Grid property
```

### 2. Styling Tab

**Component**: `StylingCustomContent.tsx`

**Serialized Properties**:
```typescript
{
  // Cell styles (static object or function with metadata)
  cellStyle: CSSProperties | Function,
  
  // Header styles (function to exclude floating filters)
  headerStyle: Function,
  
  // CSS classes for alignment
  cellClass: string,        // e.g., "cell-align-middle-center"
  headerClass: string,      // e.g., "header-h-center header-v-middle"
}
```

**Critical Metadata Preservation**:
```typescript
// For conditional formatting, functions have metadata
cellStyleFunction.__formatString = "[Red][<0]#,##0;[Green]#,##0";
cellStyleFunction.__baseStyle = {
  fontSize: "14px",
  fontFamily: "Inter",
  color: "#000000",
  backgroundColor: "#FFFFFF",
  border: "1px solid #CCCCCC"
};
```

**Style Function Creation**:
```typescript
// When conditional formatting exists
const cellStyleFn = (params: { value: unknown }) => {
  const conditionalStyleFn = createCellStyleFunction(existingFormatString, {});
  const conditionalStyles = conditionalStyleFn(params) || {};
  const mergedStyles = { ...baseStyle, ...conditionalStyles };
  return Object.keys(mergedStyles).length > 0 ? mergedStyles : undefined;
};

// Attach metadata for serialization
Object.defineProperty(cellStyleFn, '__formatString', {
  value: existingFormatString,
  writable: false,
  enumerable: false,
  configurable: true
});
```

### 3. Format Tab

**Component**: `FormatCustomContent.tsx`

**Serialized Properties**:
```typescript
{
  // Value formatter function with metadata
  valueFormatter: Function,
  
  // Cell style for color formatting
  cellStyle: Function | CSSProperties,
  
  // CSS classes for numeric formatting
  cellClass: string  // e.g., "ag-numeric-cell ag-currency-cell"
}
```

**Format String Examples**:
```typescript
// Standard formats
"#,##0.00"                          // Number with decimals
"$#,##0.00"                         // Currency
"0.00%"                             // Percentage
"MM/DD/YYYY"                        // Date

// Conditional formats
"[Red][<0]($0.00);[Green]$0.00"    // Currency with colors
"[<50]\"🔴 \"0;[<80]\"🟡 \"0;\"🟢 \"0"  // Traffic lights
```

**Formatter Function Metadata**:
```typescript
valueFormatter.__formatString = "[Red][<0]($0.00);[Green]$0.00";
valueFormatter.__formatterType = "excel";
```

### 4. Filter Tab

**Component**: `FilterCustomContent.tsx`

**Serialized Properties**:
```typescript
{
  filter: string | boolean,         // Filter type or enabled state
  floatingFilter: boolean,          // Show floating filter
  filterParams: {                   // Filter configuration
    buttons: string[],              // e.g., ['apply', 'clear']
    closeOnApply: boolean,
    filterOptions: string[],        // Available filter operations
    defaultOption: string,
    suppressAndOrCondition: boolean,
    caseSensitive: boolean,
    textFormatter: Function,        // Custom text formatting
    numberParser: Function,         // Custom number parsing
    
    // For set filters
    values: string[] | Function,    // Predefined values
    cellHeight: number,
    suppressSelectAll: boolean,
    suppressMiniFilter: boolean,
    
    // For date filters
    comparator: Function,
    browserDatePicker: boolean,
    minValidYear: number,
    maxValidYear: number
  }
}
```

### 5. Editor Tab

**Component**: `EditorCustomContent.tsx`

**Serialized Properties**:
```typescript
{
  editable: boolean | Function,     // Cell editability
  cellEditor: string,               // Editor type
  cellEditorParams: {               // Editor configuration
    // For select editor
    values: string[],
    
    // For number editor
    min: number,
    max: number,
    precision: number,
    step: number,
    
    // For large text editor
    maxLength: number,
    rows: number,
    cols: number
  },
  
  // Validation
  valueSetter: Function,            // Custom value setting
  valueParser: Function,            // Parse user input
  
  // Edit behavior
  singleClickEdit: boolean,
  stopEditingWhenCellsLoseFocus: boolean
}
```

## Storage Mechanism

### Profile Store Structure

```typescript
interface ProfileData {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
  columnSettings: {
    version: string;  // "2.0.0"
    columnCustomizations: Record<string, ColumnCustomization>;
    baseColumns: ColDef[];
  };
  gridOptions: GridOptions;
}

interface ColumnCustomization {
  // All properties from tabs merged
  headerName?: string;
  width?: number;
  cellStyle?: any;  // Serialized function or object
  valueFormatter?: any;  // Serialized function
  filter?: string | boolean;
  cellEditor?: string;
  // ... etc
}
```

### Function Serialization

Functions are serialized with their metadata:

```typescript
function serializeFunction(fn: Function): SerializedFunction {
  const metadata: any = {};
  
  // Extract all non-enumerable metadata
  if (fn.__formatString) metadata.formatString = fn.__formatString;
  if (fn.__baseStyle) metadata.baseStyle = fn.__baseStyle;
  if (fn.__formatterType) metadata.formatterType = fn.__formatterType;
  
  return {
    type: 'function',
    metadata,
    toString: fn.toString()
  };
}
```

## Deserialization Process

### 1. Profile Loading

```typescript
// In useProfileSync hook
const loadProfile = (profile: ProfileData) => {
  if (profile.columnSettings?.version === "2.0.0") {
    const baseColumns = profile.columnSettings.baseColumns || columnDefs;
    const customizations = profile.columnSettings.columnCustomizations || {};
    
    // Merge base columns with customizations
    const mergedColumns = mergeColumnDefinitions(baseColumns, customizations);
    setCurrentColumnDefs(mergedColumns);
  }
};
```

### 2. Function Reconstruction

```typescript
function deserializeFunction(serialized: SerializedFunction): Function {
  let fn: Function;
  
  if (serialized.metadata?.formatString) {
    // Reconstruct formatter
    fn = createExcelFormatter(serialized.metadata.formatString);
  } else if (serialized.metadata?.baseStyle) {
    // Reconstruct cell style function
    fn = createCellStyleFunction(
      serialized.metadata.formatString || '',
      serialized.metadata.baseStyle
    );
  }
  
  // Reattach metadata
  Object.keys(serialized.metadata).forEach(key => {
    Object.defineProperty(fn, `__${key}`, {
      value: serialized.metadata[key],
      writable: false,
      enumerable: false,
      configurable: true
    });
  });
  
  return fn;
}
```

### 3. Column Merging

```typescript
function mergeColumnDefinitions(
  baseColumns: ColDef[],
  customizations: Record<string, ColumnCustomization>
): ColDef[] {
  return baseColumns.map(baseCol => {
    const customization = customizations[baseCol.field || ''];
    if (!customization) return baseCol;
    
    const merged = { ...baseCol };
    
    // Apply each customization
    Object.entries(customization).forEach(([key, value]) => {
      if (key === 'cellStyle' && typeof value === 'object' && value.type === 'function') {
        merged.cellStyle = deserializeFunction(value);
      } else if (key === 'valueFormatter' && typeof value === 'object' && value.type === 'function') {
        merged.valueFormatter = deserializeFunction(value);
      } else {
        merged[key] = value;
      }
    });
    
    return merged;
  });
}
```

## Column Definition Creation

### Column Processor Hook

The `useColumnProcessor` hook ensures all columns have proper cellStyle functions:

```typescript
export function useColumnProcessor(columnDefs: ColumnDef[]): ColumnDef[] {
  return useMemo(() => {
    return columnDefs.map(colDef => {
      // Skip if no valueFormatter
      if (!colDef.valueFormatter || typeof colDef.valueFormatter !== 'function') {
        return colDef;
      }
      
      // Check for format string metadata
      const formatString = (colDef.valueFormatter as any).__formatString;
      if (!formatString) return colDef;
      
      // Ensure cellStyle exists for conditional formatting
      if (formatString.includes('[Red]') || formatString.includes('[Green]') || 
          formatString.includes('[Blue]') || formatString.includes('[Yellow]')) {
        
        const existingCellStyle = colDef.cellStyle;
        let baseStyle = {};
        
        if (existingCellStyle && typeof existingCellStyle === 'function') {
          baseStyle = (existingCellStyle as any).__baseStyle || {};
        } else if (existingCellStyle && typeof existingCellStyle === 'object') {
          baseStyle = existingCellStyle;
        }
        
        // Create new cellStyle function
        const cellStyleFn = createCellStyleFunction(formatString, baseStyle);
        
        return {
          ...colDef,
          cellStyle: cellStyleFn
        };
      }
      
      return colDef;
    });
  }, [columnDefs]);
}
```

## AG-Grid Application

### 1. Column Definition Application

```typescript
// In DataTableContainer
const processedColumns = useColumnProcessor(currentColumnDefs);

// Pass to AG-Grid
<AgGridReact
  columnDefs={processedColumns}
  onGridReady={onGridReady}
  // ... other props
/>
```

### 2. Runtime Updates

When applying changes from the dialog:

```typescript
const handleApplyChanges = () => {
  const updatedColumns = getColumnDefsWithStyles();
  
  // Update grid API
  if (gridApi) {
    gridApi.setColumnDefs(updatedColumns);
  }
  
  // Save to profile
  saveColumnCustomizations(updatedColumns, baseColumns);
  
  // Update local state
  setCurrentColumnDefs(updatedColumns);
};
```

### 3. Style Application Flow

1. **Cell Rendering**:
   ```typescript
   // AG-Grid calls cellStyle function
   cellStyle: (params) => {
     // Evaluate conditions
     if (params.value < 0) {
       return { color: '#FF6B6B', ...baseStyle };
     }
     return baseStyle;
   }
   ```

2. **Value Formatting**:
   ```typescript
   // AG-Grid calls valueFormatter
   valueFormatter: (params) => {
     const formatter = createExcelFormatter(formatString);
     return formatter(params);
   }
   ```

3. **Class Application**:
   ```typescript
   // AG-Grid applies CSS classes
   cellClass: "cell-align-middle-center ag-numeric-cell"
   headerClass: "header-h-center header-v-middle"
   ```

## Critical Considerations

1. **Function Serialization**: Functions cannot be directly stored in JSON. They must be reconstructed from metadata.

2. **Metadata Preservation**: Non-enumerable properties on functions must be explicitly handled during serialization.

3. **Style Merging**: Base styles and conditional styles must be merged in the correct order (conditional overrides base).

4. **Performance**: Column processing happens in useMemo to avoid unnecessary re-renders.

5. **Backward Compatibility**: The version field in columnSettings allows for migration strategies.

6. **State Synchronization**: Changes must be synchronized between:
   - Local component state
   - Column formatting store
   - Profile store
   - AG-Grid API

This architecture ensures that complex column customizations, including conditional formatting and custom functions, can be persisted and restored accurately across sessions.