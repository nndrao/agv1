# Column Width Preservation Fix

## Issue
When clicking "Apply" in the column formatter dialog, columns would briefly expand to fit content and then snap back to their original widths. This was jarring and indicated that column widths were not being properly preserved during the formatting application process.

## Root Cause
When `setGridOption('columnDefs', columns)` is called to apply formatting changes, AG-Grid recalculates column layouts. The previous implementation would then apply column state from the saved profile (if any), but this created a timing issue where:

1. New column definitions are applied → columns auto-size
2. Profile column state is applied → columns return to saved widths

If the user had manually resized columns but hadn't saved the profile, those manual adjustments would be lost.

## Solution
Modified `useColumnOperations.ts` to:

1. **Capture current column state** before applying new column definitions
2. **Preserve the current state** by reapplying it immediately after setting column definitions
3. **Prioritize current state** over profile state to maintain user's manual adjustments

```typescript
// Save current column state before applying changes
const currentColumnState = gridApiRef.current.getColumnState();

// Apply new column definitions
gridApiRef.current.setGridOption('columnDefs', columns);

// Restore column state to preserve widths
if (currentColumnState && currentColumnState.length > 0) {
  gridApiRef.current.applyColumnState({
    state: currentColumnState,
    applyOrder: true
  });
}
```

## Benefits
1. **Smooth experience** - No visual jumping when applying formatting
2. **Preserves manual adjustments** - User's column width changes are maintained
3. **Consistent behavior** - Column widths remain stable during formatting operations

## Technical Details
- Column state includes: width, column order, visibility, pinning
- The fix ensures formatting changes (styles, formatters) are applied without affecting column layout
- Falls back to profile state only if no current state exists

## Testing
1. Resize some columns manually
2. Apply formatting through the column formatter
3. Columns should maintain their widths without jumping
4. Save profile to persist the column widths permanently