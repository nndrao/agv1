# Column State Complete Fix

## Issue
When clicking "Apply" in the column formatter dialog, the grid was losing its column state (visibility, width, order) even though we were filtering out column state properties in the store.

## Root Cause
According to AG-Grid documentation, stateful properties should NEVER be included in column definitions when updating columns. The issue was:

1. Original column definitions might contain stateful properties (hide, width, flex, etc.)
2. Even though we filtered these out in `applyChanges`, they were still present in the original column definitions
3. When setting column definitions, AG-Grid was resetting state based on these properties

## Solution
Implemented a three-step approach:

### 1. Filter Column State Properties in Store
In `columnFormatting.store.ts`:
- Filter out column state properties when updating bulk properties
- Skip column state properties when applying changes

### 2. Clean Column Definitions Before Applying
In `useColumnOperations.ts`:
```typescript
// List of ALL stateful properties per AG-Grid docs
const statefulProperties = [
  'width', 'initialWidth', 
  'sort', 'initialSort', 
  'sortIndex', 'initialSortIndex',
  'hide', 'initialHide',
  'pinned', 'initialPinned',
  'rowGroup', 'initialRowGroup',
  'rowGroupIndex', 'initialRowGroupIndex',
  'pivot', 'initialPivot',
  'pivotIndex', 'initialPivotIndex',
  'aggFunc', 'initialAggFunc',
  'flex', 'initialFlex',
  'filter' // Filter state is managed through filter API
];

// Clean all stateful properties from column definitions
const cleanColumns = columns.map(col => {
  const cleanCol = { ...col };
  statefulProperties.forEach(prop => {
    delete cleanCol[prop];
  });
  return cleanCol;
});
```

### 3. Restore Column State After Setting Definitions
```typescript
// Capture state before changes
const columnStateBefore = gridApiRef.current.getColumnState();

// Apply clean column definitions
gridApiRef.current.setGridOption('columnDefs', cleanColumns);

// Restore the state
gridApiRef.current.applyColumnState({
  state: columnStateBefore,
  applyOrder: true
});
```

## Key Insights from AG-Grid Documentation

1. **Stateful vs Non-Stateful Properties**
   - Stateful: Can be changed by user interaction (width, sort, hide, pinned)
   - Non-Stateful: Only changed programmatically (cellStyle, valueFormatter, editable)

2. **Property Behavior**
   - `undefined` in column state: "Do not apply" (preserves current state)
   - `null` in column state: "Clear this attribute" (resets to default)
   - Missing property in column defs: May reset to default

3. **Best Practice**
   - Use `initial*` properties for defaults (initialWidth, initialSort)
   - Never include stateful properties when updating column definitions
   - Always use Column State API for state management

## Result
- Column visibility is preserved when applying formatting
- Column widths remain unchanged
- Column order is maintained
- Only formatting properties are updated
- No visual jumping or state loss

## Testing
1. Hide some columns
2. Resize some columns
3. Open formatter and apply changes
4. Verify: Same columns remain hidden, widths unchanged