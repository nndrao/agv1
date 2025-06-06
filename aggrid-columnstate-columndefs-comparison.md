# ag-Grid Column State vs Column Definitions Comparison

## Overview

ag-Grid maintains a separation between Column Definitions (configuration) and Column State (runtime state). Understanding the common attributes and differences between these two concepts is crucial for proper grid state management.

## Common Attributes (Stateful Properties)

The following properties exist in both Column State and Column Definitions. These are properties that users can modify through grid interaction:

| Column State Property | Column Definition Property | Initial Property in ColDef | Description |
|----------------------|---------------------------|---------------------------|-------------|
| `width` | `width` | `initialWidth` | Column width in pixels |
| `hide` | `hide` | `initialHide` | Whether column is hidden |
| `pinned` | `pinned` | `initialPinned` | Column pinning ('left', 'right', or null) |
| `sort` | `sort` | `initialSort` | Sort direction ('asc', 'desc', or null) |
| `sortIndex` | `sortIndex` | `initialSortIndex` | Order of sorting when multi-sorting |
| `flex` | `flex` | `initialFlex` | Flex value for column sizing |
| `rowGroup` | `rowGroup` | `initialRowGroup` | Whether column is used for row grouping |
| `rowGroupIndex` | `rowGroupIndex` | `initialRowGroupIndex` | Order in row grouping |
| `pivot` | `pivot` | `initialPivot` | Whether column is used for pivoting |
| `pivotIndex` | `pivotIndex` | `initialPivotIndex` | Order in pivot |
| `aggFunc` | `aggFunc` | `initialAggFunc` | Aggregation function |
| `colId` | `colId` | - | Column identifier (read-only in state) |

### Column State Properties

Based on ag-Grid documentation, `getColumnState()` returns objects containing:
- `aggFunc` - Aggregation function applied
- `colId` - Column identifier
- `hide` - Visibility state
- `pinned` - Pin state ('left', 'right', or null)
- `pivotIndex` - Position in pivot
- `rowGroupIndex` - Position in row grouping
- `width` - Current width

## Key Differences

### 1. **Stateful vs Non-Stateful Properties**

**Stateful Properties** (can be changed by user interaction):
- Width, visibility, pinning, sorting, grouping, pivot, aggregation

**Non-Stateful Properties** (only in Column Definitions):
- `field` - Data field binding
- `headerName` - Column header text
- `cellRenderer` - Cell rendering function/component
- `valueFormatter` - Value formatting function
- `editable` - Whether cells are editable
- `filter` - Filter type
- `cellStyle` - Cell styling
- `headerTooltip` - Header tooltip text
- And many more...

### 2. **Initial Properties Pattern**

Column Definitions support "initial" versions of stateful properties to avoid overwriting user changes:

```typescript
// Good Practice - Using initial properties
const columnDef: ColDef = {
  field: 'price',
  headerName: 'Price',
  initialWidth: 150,      // Won't override user resizing
  initialSort: 'asc',     // Won't override user sorting
  initialHide: false      // Won't override user visibility changes
};

// Avoid - Using direct properties
const columnDef: ColDef = {
  field: 'price',
  headerName: 'Price',
  width: 150,            // Will reset to 150 on column update!
  sort: 'asc',           // Will reset sorting on column update!
  hide: false            // Will reset visibility on column update!
};
```

### 3. **Usage Patterns**

#### Getting and Setting Column State
```typescript
// Get current column state
const columnState = gridApi.getColumnState();
// Returns: [{ colId: 'price', width: 200, hide: false, pinned: null, ... }]

// Apply column state
gridApi.applyColumnState({
  state: [
    { colId: 'price', width: 250, sort: 'desc' }
  ]
});
```

#### Updating Column Definitions
```typescript
// Update column definitions (non-stateful properties)
gridApi.setGridOption('columnDefs', [
  {
    field: 'price',
    headerName: 'Product Price',  // Update header text
    cellRenderer: 'agAnimateShowChangeCellRenderer', // Change renderer
    // Use initial properties to preserve state
    initialWidth: 150
  }
]);
```

## Best Practices

### 1. **Preserve User State**
- Use `initial*` properties in Column Definitions to avoid resetting user changes
- Column Definitions should be updated for properties users cannot control
- Use Column State API for properties users can control

### 2. **State Management**
```typescript
// Save state
const saveGridState = () => {
  const state = {
    columnState: gridApi.getColumnState(),
    columnGroupState: gridApi.getColumnGroupState(),
    sortModel: gridApi.getSortModel(),
    filterModel: gridApi.getFilterModel()
  };
  localStorage.setItem('gridState', JSON.stringify(state));
};

// Restore state
const restoreGridState = () => {
  const state = JSON.parse(localStorage.getItem('gridState'));
  if (state) {
    gridApi.applyColumnState({ state: state.columnState });
    gridApi.setColumnGroupState(state.columnGroupState);
    gridApi.setSortModel(state.sortModel);
    gridApi.setFilterModel(state.filterModel);
  }
};
```

### 3. **Partial State Updates**
```typescript
// Update only specific properties
gridApi.applyColumnState({
  state: [
    { colId: 'price', pinned: 'left' },
    { colId: 'quantity', hide: true }
  ],
  applyOrder: false  // Don't change column order
});
```

## Important Considerations

1. **State Preservation**: When updating column definitions, user modifications are preserved only when using `initial*` properties

2. **Column State Priority**: When both regular and initial properties are present, initial properties are used only if no user state exists

3. **API Method Choice**: 
   - Use `applyColumnState()` for stateful properties
   - Use `setGridOption('columnDefs', ...)` for non-stateful properties

4. **Event Triggering**: Column state changes trigger appropriate events (e.g., `columnPinned`, `columnVisible`, `sortChanged`)

## Complete Example

```typescript
import { ColDef, GridApi, ColumnState } from 'ag-grid-community';

// Column Definition with both stateful and non-stateful properties
const columnDefs: ColDef[] = [
  {
    // Non-stateful properties
    field: 'product',
    headerName: 'Product Name',
    cellRenderer: 'agGroupCellRenderer',
    filter: 'agTextColumnFilter',
    
    // Initial stateful properties (preserve user changes)
    initialWidth: 200,
    initialSort: 'asc',
    initialHide: false
  },
  {
    field: 'price',
    headerName: 'Price',
    valueFormatter: params => `$${params.value}`,
    
    // Initial stateful properties
    initialWidth: 150,
    initialPinned: 'right'
  }
];

// Working with Column State
class GridStateManager {
  private gridApi: GridApi;
  
  // Get current state
  getCurrentState(): ColumnState[] {
    return this.gridApi.getColumnState();
  }
  
  // Apply saved state
  applyState(state: ColumnState[]): void {
    this.gridApi.applyColumnState({ state });
  }
  
  // Update specific columns
  updateColumns(updates: Partial<ColumnState>[]): void {
    this.gridApi.applyColumnState({ 
      state: updates,
      applyOrder: false  // Preserve column order
    });
  }
  
  // Reset to initial state
  resetState(): void {
    this.gridApi.resetColumnState();
  }
}
```

## Summary

- **Column State** represents the current runtime state of columns (width, visibility, sort, etc.)
- **Column Definitions** contain the full configuration including both stateful and non-stateful properties
- Use `initial*` properties in Column Definitions to preserve user modifications
- Use Column State API for runtime changes to stateful properties
- Use Column Definition updates for non-stateful property changes