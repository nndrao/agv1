# Column Settings Debug Guide

## Steps to Debug

1. Open the browser console (F12)
2. Click the "Debug Profile" button in the bottom right
3. Apply some column customizations
4. Click "Debug Profile" again to see if they were saved
5. Refresh the page
6. Click "Debug Profile" to see if they were loaded

## What to Look For

### In Console Logs:

1. When applying customizations:
   - Look for `[ColumnCustomizationDialog] handleApplyChanges`
   - Check if `hasCustomizations: true`
   - Verify the column count matches

2. When saving to profile:
   - Look for `[DataTable] handleApplyColumnChanges`
   - Check `Grid state being saved:` shows columnDefs with customizations
   - Verify `[ProfileStore] updateProfile` shows the columnDefs

3. When loading on startup:
   - Look for `=== GRID READY ===`
   - Check `Has saved columnDefs: true`
   - Verify `hasCustomizations: true`

4. When switching profiles:
   - Look for `[ProfileManager] handleProfileChange`
   - Check `hasCustomizations: true`
   - Verify `[ProfileManager] Applying columnDefs`

## Common Issues

1. **Customizations not saved**: Check if auto-save is enabled
2. **Customizations saved but not loaded**: Check if the profile has columnDefs
3. **Customizations loaded but not visible**: Check if grid is refreshing properly

## Quick Test

1. Open console and run:
```javascript
const store = JSON.parse(localStorage.getItem('grid-profile-storage'));
console.log('Profiles:', store.state.profiles);
console.log('Active Profile:', store.state.profiles.find(p => p.id === store.state.activeProfileId));
```

2. Check if columnDefs have customization properties like:
   - cellStyle
   - valueFormatter
   - cellClass
   - headerClass
   - filter