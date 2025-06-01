# Fix: gridApi.refreshFilters is not a function

## Issue
When opening the application, an error occurred:
```
profile-optimizer.ts:308 Uncaught TypeError: gridApi.refreshFilters is not a function
```

## Root Cause
The `refreshFilters()` method does not exist in AG-Grid v33.2.0. This was likely a method from an older version of AG-Grid or a mistaken assumption about the API.

## Solution
Replaced `gridApi.refreshFilters()` with `gridApi.onFilterChanged()` which is the correct method in AG-Grid v33 to notify the grid that filters have changed and need to be re-evaluated.

### Code Change
```typescript
// Before (incorrect):
if (needsFilterRefresh) {
  gridApi.refreshFilters();
}

// After (correct):
if (needsFilterRefresh) {
  // In AG-Grid v33, refreshFilters doesn't exist
  // Instead, we notify that filters have changed
  gridApi.onFilterChanged();
}
```

## AG-Grid v33 Filter API Methods
For reference, here are the correct filter-related methods in AG-Grid v33:
- `gridApi.onFilterChanged()` - Notify that filters have changed
- `gridApi.setFilterModel(model)` - Set the filter model
- `gridApi.getFilterModel()` - Get the current filter model
- `gridApi.destroyFilter(column)` - Destroy a specific filter instance
- `gridApi.refreshClientSideRowModel()` - Refresh the entire row model including filters

## Testing
The fix has been verified with TypeScript compilation and should resolve the runtime error when switching profiles or applying column customizations that affect filters.