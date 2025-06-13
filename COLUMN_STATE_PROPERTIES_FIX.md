# Column State Properties Fix

## Issue
When clicking "Apply" in the column formatter dialog, column state properties (width, flex, visibility) were being applied to column definitions, causing columns to lose their original state from before the dialog opened.

## Root Cause
The `applyChanges` method in `columnFormatting.store.ts` was including ALL pending changes in the column definitions, including column state properties that should be managed separately by AG-Grid's column state API.

## Solution
Modified the store to filter out column state properties at two levels:

### 1. **Prevent column state properties from being added to pending changes**
```typescript
// In updateBulkProperty
const columnStateProperties = [
  'width', 'minWidth', 'maxWidth', 'flex',
  'hide', 'pinned', 'lockPosition', 'lockVisible',
  'sort', 'sortIndex', 'sortedAt'
];

if (columnStateProperties.includes(property)) {
  console.warn('[Store] Column state property cannot be edited via formatter:', property);
  return;
}
```

### 2. **Filter out column state properties when applying changes**
```typescript
// In applyChanges
Object.entries(changes).forEach(([key, value]) => {
  // Skip column state properties entirely
  if (columnStateProperties.includes(key)) {
    console.log('[ColumnFormattingStore] Skipping column state property:', key);
    return;
  }
  // ... apply other changes
});
```

## Benefits
1. **Proper separation of concerns** - Column formatting (styles, formatters) is separate from column state (width, visibility)
2. **Preserves user adjustments** - Manual column resizing and visibility changes are maintained
3. **Consistent with AG-Grid architecture** - Column state is managed through AG-Grid's column state API, not column definitions
4. **No visual jumping** - Columns maintain their widths when applying formatting

## Technical Details
- Column state properties include: width, minWidth, maxWidth, flex, hide, pinned, lockPosition, lockVisible, sort, sortIndex, sortedAt
- These properties are managed by AG-Grid's `getColumnState()` and `applyColumnState()` APIs
- The column formatter should only modify formatting properties like cellStyle, valueFormatter, filter, etc.

## Related Files
- `/src/components/datatable/columnFormatting/store/columnFormatting.store.ts` - Main fix implementation
- `/src/components/datatable/hooks/useColumnOperations.ts` - Applies column definitions without state properties