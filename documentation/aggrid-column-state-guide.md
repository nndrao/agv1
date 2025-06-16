# ag-Grid Column State Management Guide

## Overview

Column Definitions in ag-Grid contain both stateful and non-stateful attributes. Understanding the difference is crucial for properly managing column state and avoiding unintended overwrites of user interactions.

**Key Principle**: Stateful attributes can have their values changed by the grid through user interaction (e.g., column sort can be changed by clicking on the column header). Non-stateful attributes do not change from what is set in the Column Definition.

## Stateful Properties - DO NOT MODIFY DIRECTLY

These properties should NOT be set directly in column definitions when updating columns, as they will override user changes:

| Property | Initial Property | Description |
|----------|-----------------|-------------|
| `width` | `initialWidth` | Column width (user can resize) |
| `sort` | `initialSort` | Sort direction: 'asc', 'desc', or null |
| `sortIndex` | `initialSortIndex` | Order of sorting in multi-sort scenarios |
| `hide` | `initialHide` | Column visibility state |
| `pinned` | `initialPinned` | Column pinning: 'left', 'right', or null |
| `rowGroup` | `initialRowGroup` | Whether column is used for row grouping |
| `rowGroupIndex` | `initialRowGroupIndex` | Order in row grouping hierarchy |
| `pivot` | `initialPivot` | Whether column is pivoted |
| `pivotIndex` | `initialPivotIndex` | Order in pivot |
| `aggFunc` | `initialAggFunc` | Aggregation function for grouped data |
| `flex` | `initialFlex` | Flex sizing for column |
| `filter` | - | Filter state (managed through filter API) |

## Non-Stateful Properties - SAFE TO MODIFY

These properties can be safely updated without affecting user-applied column state:

### Display Properties
- `headerName` - Column header display text
- `headerTooltip` - Tooltip for column header
- `cellClass` - CSS classes for cells
- `headerClass` - CSS classes for header
- `cellStyle` - Inline styles for cells
- `headerComponentParams` - Parameters for custom header components

### Data Properties
- `field` - Field name in row data
- `colId` - Unique column identifier
- `valueGetter` - Function to derive cell values
- `valueFormatter` - Function to format display values
- `valueSetter` - Function to update cell values
- `valueParser` - Function to parse user input

### Behavior Properties
- `editable` - Whether cells are editable
- `cellEditor` - Editor component for cells
- `cellEditorParams` - Parameters for cell editor
- `sortable` - Whether column can be sorted
- `resizable` - Whether column can be resized
- `suppressMenu` - Hide column menu
- `menuTabs` - Available menu tabs
- `tooltipField` - Field for tooltips
- `tooltipValueGetter` - Function to get tooltip values

### Rendering Properties
- `cellRenderer` - Custom cell renderer component
- `cellRendererParams` - Parameters for cell renderer
- `autoHeight` - Auto-size row height to content
- `wrapText` - Enable text wrapping
- `enableRowGroup` - Allow column to be row grouped
- `enablePivot` - Allow column to be pivoted

## Best Practices

### 1. Use Initial Properties for Default State

```javascript
// ❌ WRONG - Overwrites user changes
columnDefs: [
  { 
    field: 'price',
    width: 150,        // Will reset user's column width
    sort: 'asc',       // Will override user's sorting
    pinned: 'left'     // Will reset user's pinning
  }
]

// ✅ CORRECT - Preserves user changes
columnDefs: [
  { 
    field: 'price',
    initialWidth: 150,     // Only applied when column is first created
    initialSort: 'asc',    // User changes are preserved
    initialPinned: 'left'  // Won't reset if user unpins
  }
]
```

### 2. Use Column State API for Programmatic Changes

```javascript
// Get current column state
const currentState = gridApi.getColumnState();

// Apply specific state changes without affecting other properties
gridApi.applyColumnState({
  state: [
    { colId: 'price', sort: 'asc' },
    { colId: 'quantity', width: 200 }
  ],
  defaultState: { sort: null }  // Applied to columns not in state array
});

// Save complete column state
const savedState = gridApi.getColumnState();
localStorage.setItem('gridColumnState', JSON.stringify(savedState));

// Restore complete column state
const restoredState = JSON.parse(localStorage.getItem('gridColumnState'));
gridApi.applyColumnState({ state: restoredState });
```

### 3. Understanding State Value Behavior

- **`undefined`** - "Do not apply this attribute" (preserves current state)
- **`null`** - "Clear this attribute" (resets to default)
- **Exception**: For `width`, both `undefined` and `null` skip the attribute

```javascript
// Example showing undefined vs null behavior
gridApi.applyColumnState({
  state: [
    { colId: 'name', sort: undefined },   // Keeps existing sort
    { colId: 'price', sort: null },       // Clears any sorting
    { colId: 'date', sort: 'desc' }       // Sets descending sort
  ]
});
```

## Column Matching Rules

When updating column definitions, ag-Grid matches existing columns using:

1. **Object reference equality** - Same column definition instance
2. **`colId`** - Unique column identifier
3. **`field`** - Field attribute (if no colId)

```javascript
// Ensure columns can be matched properly
columnDefs: [
  { colId: 'product-name', field: 'name' },     // Matched by colId
  { field: 'price' },                            // Matched by field
  { headerName: 'Quantity' }                     // No match - treated as new column!
]
```

## Complete Example

```javascript
// Grid configuration
const gridOptions = {
  // Preserve column order when updating definitions
  maintainColumnOrder: true,
  
  // Default column properties
  defaultColDef: {
    resizable: true,
    sortable: true,
    filter: true
  },
  
  // Column definitions with proper state management
  columnDefs: [
    {
      // Identity (required for matching)
      colId: 'product-col',
      field: 'productName',
      
      // Display properties (safe to update)
      headerName: 'Product Name',
      headerTooltip: 'Name of the product',
      cellClass: 'product-cell',
      
      // Initial state (only on creation)
      initialWidth: 200,
      initialSort: 'asc',
      initialPinned: 'left',
      initialHide: false,
      
      // Behavior (safe to update)
      editable: true,
      filter: 'agTextColumnFilter',
      filterParams: { 
        buttons: ['reset', 'apply'],
        newRowsAction: 'keep'  // Preserve filter on data updates
      },
      
      // Formatting (safe to update)
      valueFormatter: (params) => params.value?.toUpperCase(),
      tooltipValueGetter: (params) => params.value,
      
      // Rendering (safe to update)
      cellRenderer: 'agAnimateShowChangeCellRenderer'
    },
    {
      colId: 'price-col',
      field: 'price',
      headerName: 'Unit Price',
      
      // Type-based configuration
      type: 'numericColumn',
      
      // Initial state
      initialWidth: 120,
      initialSort: null,
      
      // Formatting
      valueFormatter: (params) => {
        return params.value != null 
          ? '$' + params.value.toFixed(2) 
          : '';
      }
    }
  ]
};

// Initialize grid
const gridApi = agGrid.createGrid(gridDiv, gridOptions);

// Function to update column definitions safely
function updateColumnDefinitions(newDefs) {
  // This preserves all user-applied state
  gridApi.setGridOption('columnDefs', newDefs);
}

// Function to save column state
function saveColumnState() {
  const state = {
    columnState: gridApi.getColumnState(),
    columnGroupState: gridApi.getColumnGroupState(),
    sortModel: gridApi.getSortModel(),
    filterModel: gridApi.getFilterModel()
  };
  localStorage.setItem('myGridState', JSON.stringify(state));
}

// Function to restore column state
function restoreColumnState() {
  const state = JSON.parse(localStorage.getItem('myGridState'));
  if (state) {
    gridApi.applyColumnState({ state: state.columnState });
    gridApi.setColumnGroupState(state.columnGroupState);
    gridApi.setSortModel(state.sortModel);
    gridApi.setFilterModel(state.filterModel);
  }
}
```

## Common Pitfalls to Avoid

### 1. Mixing Stateful and Initial Properties
```javascript
// ❌ WRONG - Conflicting properties
{
  field: 'price',
  width: 150,         // Stateful
  initialWidth: 200   // Initial
}
```

### 2. Forgetting Column Identifiers
```javascript
// ❌ RISKY - Column might not match on updates
{
  headerName: 'Total'  // No field or colId!
}

// ✅ BETTER - Always provide identifier
{
  colId: 'total-col',
  headerName: 'Total',
  valueGetter: (params) => params.data.price * params.data.quantity
}
```

### 3. Not Handling State Persistence
```javascript
// ❌ INCOMPLETE - State lost on page reload
gridApi.applyColumnState({ state: newState });

// ✅ COMPLETE - Persist state changes
gridApi.applyColumnState({ state: newState });
saveColumnState(); // Save to localStorage or backend
```

## Summary

1. **Never use stateful properties** directly when updating column definitions
2. **Always use `initial*` properties** for default column state
3. **Use Column State API** for programmatic state changes
4. **Ensure proper column matching** with `colId` or `field`
5. **Understand state values**: `undefined` preserves, `null` clears
6. **Set `maintainColumnOrder: true`** to preserve user's column arrangement
7. **Save and restore state** for better user experience across sessions

Following these guidelines ensures that user interactions with the grid (sorting, filtering, resizing, reordering, etc.) are preserved when column definitions are updated.