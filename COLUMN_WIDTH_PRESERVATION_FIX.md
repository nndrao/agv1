# Column Width Preservation Fix

## Issue
When clicking the Apply button in the Grid Options editor (especially when changing row height or header height), all columns would resize to fill the viewport, losing their saved widths.

## Root Cause
In `useGridOptions.ts`, the `applyGridOptions` function was calling `api.sizeColumnsToFit()` whenever header height or row height changed. This AG-Grid method forces all columns to resize proportionally to fill the entire grid width, overriding any saved column widths.

```typescript
// The problematic code:
if ('headerHeight' in localOptions || 'rowHeight' in localOptions) {
  setTimeout(() => {
    api.sizeColumnsToFit(); // This was resizing all columns!
  }, 100);
}
```

## Fix Applied
Removed the `sizeColumnsToFit()` call to preserve user's column widths. The grid will now maintain the column widths that were saved in the profile, regardless of what grid options are changed.

## Why This Matters
- Users expect their carefully adjusted column widths to be preserved
- Column widths are part of the saved grid state in the profile
- Auto-sizing should only happen when explicitly requested by the user

## Testing
1. Set custom column widths by dragging column borders
2. Save the profile
3. Open Grid Options editor
4. Change row height or header height
5. Click Apply
6. Column widths should remain unchanged (not resize to fill viewport)

## Note
If users want to auto-size columns, they can still:
- Right-click and choose "Auto-size all columns" from the context menu
- Double-click column borders to auto-size individual columns
- Use the AG-Grid API directly if needed