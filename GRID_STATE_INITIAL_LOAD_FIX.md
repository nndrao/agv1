# Grid State Initial Load Fix

## Issue
When the app loads, the grid state (column widths, order, etc.) is not applied properly. The columns auto-size to fit the viewport instead of using the saved widths. However, when switching profiles, the grid state is restored correctly.

## Root Cause
The `onGridReady` handler was:
1. Not loading column definitions from the profile (was using default columns)
2. Applying settings in the wrong order
3. Missing the critical step of setting columnDefs from the profile

The difference between initial load and profile switch:
- **Profile switch**: Loads column definitions from profile → applies grid options → applies grid state
- **Initial load**: Was only applying grid state to default columns

## Fix Applied
Updated `onGridReady` in `useGridCallbacks.ts` to follow the exact same flow as profile switching:

1. **Apply grid options first** (row height, header height, etc.)
2. **Load and set column definitions from profile** (includes all customizations)
3. **Apply grid state** (column widths, visibility, order, filters, sorts)
4. **Apply font**

## Key Changes

```typescript
// Before: Was starting with column state
if (activeProfile.gridState.columnState) {
  params.api.applyColumnState({...});
}

// After: Now follows correct order
// 1. Grid options first
if (activeProfile.gridOptions) {
  // Apply options...
}

// 2. Get column definitions from profile
const profileColumnDefs = getColumnDefs(activeProfile.id);
if (profileColumnDefs) {
  params.api.setGridOption('columnDefs', profileColumnDefs);
}

// 3. Then apply grid state with proper delays
setTimeout(() => {
  if (activeProfile.gridState.columnState) {
    params.api.applyColumnState({...});
  }
}, 100);
```

## Why This Works
- Setting column definitions from the profile prevents AG-Grid from auto-sizing columns
- Following the same order as profile switching ensures consistency
- Proper delays ensure each step completes before the next

## Testing
1. Set custom column widths
2. Save profile
3. Reload the app
4. Column widths should be preserved (not auto-sized)
5. All other grid state (filters, sorts) should also be applied