# Column Customization Debug Guide

## Overview
This guide helps debug why column customization settings are not being applied when the app loads or when profiles change.

## Console Logging Added

I've added strategic console.log statements throughout the codebase to track the flow of column customization data. The logs are prefixed with component names for easy filtering:

### 1. Profile Store (`[ProfileStore]`)
- `updateProfile` - Logs when a profile is updated with column definitions
- `setActiveProfile` - Logs when the active profile is changed
- `getActiveProfile` - Logs when retrieving the active profile
- `saveCurrentState` - Logs when saving the current grid state

### 2. Profile Manager (`[ProfileManager]`)
- `handleProfileChange` - Logs when switching profiles and applying grid state
- `handleSaveCurrentState` - Logs when saving current state to profile
- `handleCreateProfile` - Logs when creating a new profile

### 3. Data Table (`[DataTable]`)
- `onGridReady` - Logs when grid is initialized and profile is loaded
- `handleProfileChange` - Logs when profile changes are handled
- `handleApplyColumnChanges` - Logs when column changes are applied from dialog
- Default profile initialization - Logs when initializing empty default profile

### 4. Column Customization Store (`[ColumnCustomizationStore]`)
- `applyChanges` - Logs detailed information about column changes being applied

### 5. Column Customization Dialog (`[ColumnCustomizationDialog]`)
- `handleApplyChanges` - Logs when applying changes
- `handleApplyAndClose` - Logs when applying and closing dialog

## Debug Steps

### 1. Check Browser localStorage

First, run the debug script in your browser console:

```javascript
// Copy and paste the contents of debug-profile-storage.js into the browser console
```

This will show:
- What profiles are stored
- The structure of each profile's gridState
- Column definitions and their customizations
- Active profile ID

### 2. Monitor Console Logs

Open browser DevTools and monitor the console while:

#### A. Initial App Load
Look for these logs in sequence:
1. `[DataTable] onGridReady` - Shows if profile is loaded on startup
2. `[ProfileStore] getActiveProfile` - Shows active profile details
3. `[DataTable] Applying profile columnDefs` - Shows if customizations are applied

#### B. Applying Column Customizations
1. Open column customization dialog
2. Make changes (e.g., add cell styles, formatters)
3. Click Apply
4. Look for:
   - `[ColumnCustomizationStore] applyChanges` - Shows pending changes
   - `[ColumnCustomizationDialog] handleApplyChanges` - Shows columns being sent
   - `[DataTable] handleApplyColumnChanges` - Shows columns being applied to grid
   - `[ProfileStore] saveCurrentState` - Shows auto-save (if enabled)

#### C. Switching Profiles
1. Select a different profile from dropdown
2. Look for:
   - `[ProfileManager] handleProfileChange` - Shows profile being loaded
   - `[ProfileStore] setActiveProfile` - Shows profile activation
   - `[ProfileManager] Applying columnDefs` - Shows customizations being applied

### 3. Common Issues to Check

#### Issue 1: Customizations Not Saved
Check logs for:
- Is `[ProfileStore] updateProfile` being called with columnDefs?
- Does the columnDefs array contain customization properties?
- Is auto-save enabled?

#### Issue 2: Customizations Not Applied on Load
Check logs for:
- Does `[DataTable] onGridReady` show columnDefs in profile?
- Is `gridApi.setGridOption('columnDefs', ...)` being called?
- Are there any timing issues (check setTimeout delays)?

#### Issue 3: Customizations Lost on Profile Switch
Check logs for:
- Is the profile's gridState populated before switching?
- Does `[ProfileManager] handleProfileChange` show the correct columnDefs?
- Are customizations present in the columnDefs being applied?

### 4. Key Data Flow

1. **Saving Customizations:**
   ```
   ColumnCustomizationDialog → applyChanges() → DataTable.handleApplyColumnChanges() 
   → Auto-save → ProfileStore.saveCurrentState() → ProfileStore.updateProfile()
   ```

2. **Loading on Startup:**
   ```
   DataTable.onGridReady() → ProfileStore.getActiveProfile() → Apply columnDefs to grid
   ```

3. **Profile Switching:**
   ```
   ProfileManager.handleProfileChange() → ProfileStore.setActiveProfile() 
   → Apply gridState to grid API → Trigger profile change callback
   ```

### 5. Verification Checklist

- [ ] localStorage contains profile data with columnDefs
- [ ] columnDefs include customization properties (cellStyle, valueFormatter, etc.)
- [ ] Console shows customizations being applied without errors
- [ ] Grid refreshes after applying customizations
- [ ] Auto-save is enabled if expecting automatic saves
- [ ] No JavaScript errors in console

## Quick Debug Commands

```javascript
// Check current profile in console
const storage = JSON.parse(localStorage.getItem('grid-profile-storage'));
console.log('Active Profile:', storage.state.profiles.find(p => p.id === storage.state.activeProfileId));

// Check if customizations exist
const activeProfile = storage.state.profiles.find(p => p.id === storage.state.activeProfileId);
const customizedColumns = activeProfile.gridState.columnDefs.filter(col => 
  col.cellStyle || col.valueFormatter || col.cellClass || col.headerClass
);
console.log('Columns with customizations:', customizedColumns);

// Force refresh grid (run in console if needed)
if (window.gridApi) {
  window.gridApi.refreshCells({ force: true });
  window.gridApi.refreshHeader();
}
```