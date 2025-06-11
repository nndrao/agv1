# Column Customizations Being Removed - Fix Summary

## Problem
Column customizations were being removed from localStorage when grid options were saved. After saving grid options, the `columnCustomizations` object was missing from the profile's `gridState`.

## Root Cause
The issue was in the grid options editor components (`GridOptionsEditor.tsx` and `GridOptionsPropertyEditor.tsx`). When saving grid options to the profile, they were using a stale reference to `activeProfile` that was captured when the component mounted. This could lead to:

1. The `activeProfile` reference not having the latest `columnCustomizations` if they were saved after the dialog opened
2. The spread operation `...activeProfile.gridState` using outdated state

## Solution Applied
Updated both grid options editor components to fetch the latest profile state before saving:

### GridOptionsPropertyEditor.tsx (lines 106-130)
```typescript
// Get fresh profile state to ensure we don't overwrite columnCustomizations
const currentProfile = useProfileStore.getState().getActiveProfile();
if (!currentProfile) {
  // Handle error
  return;
}

updateProfile(currentProfile.id, {
  gridState: {
    ...currentProfile.gridState,  // Now using fresh state
    gridOptions: localOptions
  }
});
```

### GridOptionsEditor.tsx (lines 100-124)
Applied the same fix to ensure fresh profile state is used.

## Why This Works

1. **Fresh State**: By calling `useProfileStore.getState().getActiveProfile()` inside the save handler, we get the current state from the store, not a potentially stale closure value.

2. **Proper Spreading**: The spread operation `...currentProfile.gridState` now includes all the latest data, including any `columnCustomizations` that may have been saved since the dialog opened.

3. **Existing Safeguards**: The `updateProfile` function in `profile.store.ts` already properly spreads the existing profile state, and `saveCurrentState` filters out undefined values to prevent accidental overwrites.

## Testing Instructions

1. Open the application and customize some columns (styles, formatters, etc.)
2. Open browser console and run:
   ```javascript
   const data = JSON.parse(localStorage.getItem('grid-profile-storage'));
   console.log('Has customizations:', !!data.state.profiles[0].gridState.columnCustomizations);
   ```
3. Open Grid Options dialog and change some settings
4. Save the grid options
5. Run the same console command again - customizations should still be present

## Additional Debug Script
Created `/test-column-customizations.js` that provides helper functions to inspect localStorage state:
- `checkLocalStorage()` - Shows detailed profile state including customizations
- `simulateGridOptionsSave()` - Helps demonstrate the before/after state

## Related Files Modified
- `/src/components/datatable/gridOptions/GridOptionsPropertyEditor.tsx`
- `/src/components/datatable/gridOptions/GridOptionsEditor.tsx`

## No Additional Issues Found
- `useGridOptions` hook already uses fresh state correctly
- `ProfileManager` correctly separates column customizations from other grid state
- `saveCurrentState` properly filters undefined values to prevent overwrites