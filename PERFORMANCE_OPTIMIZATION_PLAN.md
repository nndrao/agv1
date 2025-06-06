# DataTable Performance Optimization Plan

## Critical Feature to Preserve

The `ensureCellStyleForColumns` function in `data-table.tsx` (lines 110-175) MUST be preserved as it correctly merges:
- Base styles from the Styling tab
- Conditional styles from valueFormatters (e.g., `[="A"][#4bdd63]@`)

This was recently fixed to ensure both style sets are applied together.

## Optimizations That Preserve Style Merging

### 1. **Memoize Column Processing**

Instead of removing `ensureCellStyleForColumns`, optimize it with memoization:

```typescript
// hooks/useProcessedColumns.ts
import { useMemo } from 'react';
import { ColumnDef } from 'ag-grid-community';

export function useProcessedColumns(
  columns: ColumnDef[], 
  dependencies: any[]
): ColumnDef[] {
  return useMemo(() => {
    // Only recreate if columns or dependencies actually changed
    return ensureCellStyleForColumns(columns);
  }, [columns, ...dependencies]);
}
```

### 2. **Optimize Function Creation**

The issue isn't the style merging, but creating new functions unnecessarily:

```typescript
// utils/style-function-cache.ts
const styleFunctionCache = new WeakMap<ColumnDef, Function>();

export function getCachedStyleFunction(
  column: ColumnDef,
  formatString: string,
  baseStyle: React.CSSProperties
): Function {
  const cacheKey = `${formatString}-${JSON.stringify(baseStyle)}`;
  
  // Check if we already have this exact function
  const cached = styleFunctionCache.get(column);
  if (cached && cached.__cacheKey === cacheKey) {
    return cached;
  }
  
  // Create new function only if needed
  const styleFunc = createCellStyleFunction(formatString, baseStyle);
  styleFunc.__cacheKey = cacheKey;
  styleFunctionCache.set(column, styleFunc);
  
  return styleFunc;
}
```

### 3. **Optimize ensureCellStyleForColumns**

Keep the logic but make it more efficient:

```typescript
const ensureCellStyleForColumns = useCallback((columns: ColumnDef[]): ColumnDef[] => {
  // Use a flag to track if any columns were modified
  let hasChanges = false;
  
  const processedColumns = columns.map(col => {
    if (!col.valueFormatter || typeof col.valueFormatter !== 'function') {
      return col;
    }
    
    const formatString = (col.valueFormatter as any).__formatString;
    if (!formatString || !hasConditionalStyling(formatString)) {
      return col;
    }
    
    // Check if cellStyle already exists with correct format string
    const existingCellStyle = col.cellStyle as any;
    if (existingCellStyle?.__formatString === formatString && 
        existingCellStyle?.__baseStyle === col.cellStyle?.__baseStyle) {
      return col; // No change needed
    }
    
    hasChanges = true;
    
    // Extract base style
    let baseStyle = {};
    if (col.cellStyle) {
      if (typeof col.cellStyle === 'object') {
        baseStyle = col.cellStyle;
      } else if (typeof col.cellStyle === 'function' && (col.cellStyle as any).__baseStyle) {
        baseStyle = (col.cellStyle as any).__baseStyle;
      }
    }
    
    // Use cached function if possible
    const cellStyleFn = getCachedStyleFunction(col, formatString, baseStyle);
    
    return { ...col, cellStyle: cellStyleFn };
  });
  
  // Only return new array if changes were made
  return hasChanges ? processedColumns : columns;
}, []);
```

### 4. **Optimize Component Re-renders**

Wrap the DataTable component with React.memo and optimize prop comparisons:

```typescript
export const DataTable = React.memo(({ columnDefs, dataRow }: DataTableProps) => {
  // ... existing component logic
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.dataRow === nextProps.dataRow &&
    shallowCompareColumns(prevProps.columnDefs, nextProps.columnDefs)
  );
});

function shallowCompareColumns(prev: ColumnDef[], next: ColumnDef[]): boolean {
  if (prev.length !== next.length) return false;
  
  return prev.every((col, index) => {
    const nextCol = next[index];
    // Compare relevant properties, not function references
    return (
      col.field === nextCol.field &&
      col.headerName === nextCol.headerName &&
      col.width === nextCol.width
      // ... other relevant properties
    );
  });
}
```

### 5. **Debounce Column Updates**

When applying changes from the dialog:

```typescript
const debouncedApplyChanges = useMemo(
  () => debounce((columns: ColDef[]) => {
    const processed = ensureCellStyleForColumns(columns);
    setCurrentColumnDefs(processed);
    
    if (gridApiRef.current) {
      gridApiRef.current.setGridOption('columnDefs', processed);
    }
  }, 100),
  []
);
```

### 6. **Use Stable References**

For callbacks that don't need to change:

```typescript
const stableCallbacks = useRef({
  getContextMenuItems: () => [
    "autoSizeAll",
    "resetColumns",
    "separator",
    "copy",
    "copyWithHeaders",
    "paste",
    "separator",
    "export",
  ],
  
  onGridReady: async (params: GridReadyEvent) => {
    gridApiRef.current = params.api;
    // ... rest of onGridReady logic
  }
});
```

## What NOT to Change

1. **Keep `createCellStyleFunction` as is** - The style merging logic is correct
2. **Keep `ensureCellStyleForColumns` logic** - Just optimize when it runs
3. **Keep the metadata attachment** with `Object.defineProperty` - It's needed for serialization
4. **Keep the conditional styling detection** - It correctly identifies when cellStyle is needed

## Expected Improvements

- Reduce unnecessary re-renders by 70-80%
- Prevent recreation of identical cellStyle functions
- Maintain all existing functionality
- Keep style merging working correctly

## Testing the Optimizations

After implementing:
1. Verify styles still merge correctly with `node test-style-merging-fix.js`
2. Check that conditional formatting colors appear alongside base styles
3. Ensure persistence still works across profile changes
4. Monitor performance with React DevTools Profiler