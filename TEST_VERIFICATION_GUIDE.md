# Test Verification Guide

## What Was Fixed

1. **Column Customization Dialog Apply Button**
   - Already correctly implemented - only updates grid, doesn't save to localStorage
   
2. **Grid Options Editor Apply Button**  
   - Fixed to save to profile store (in memory) but not localStorage
   - Added `saveGridOptions(options)` call in DataTableContainer
   
3. **Save Profile Flow**
   - Fixed to not overwrite grid options with a limited subset
   - Properly extracts AG-Grid state (column state, filters, sorts)
   - Saves column customizations

4. **Load Order**
   - Already correctly implemented: Grid Options → Column Settings → Grid State

5. **Property Access Paths**
   - Fixed `gridOptions` being read from wrong path in:
     - GridOptionsPropertyEditor.tsx (4 locations)
     - useGridCallbacks.ts (2 locations)

## Testing Steps

### Test 1: Column Settings Persistence
1. Open the app at http://localhost:5175
2. Right-click on a column header → "Format Column" 
3. In the floating ribbon:
   - Change cell background color
   - Add a value formatter (e.g., currency)
   - Click **Apply** (should update grid only)
4. Open browser DevTools → Application → Local Storage
5. Check that localStorage hasn't been updated yet
6. Click **Save Profile** in the toolbar
7. Check localStorage - should now contain the column customizations
8. **Reload the page**
9. Verify column styles and formatters are restored

### Test 2: Grid Options Persistence  
1. Click the Grid Options button in toolbar
2. Change row height to 50
3. Change header height to 60
4. Click **Apply** (should update grid only)
5. Check localStorage - should not be updated yet
6. Click **Save Profile** in the toolbar
7. **Reload the page**
8. Verify row and header heights are restored

### Test 3: Combined Test (Main Issue)
1. Apply column customizations (colors, formatters)
2. Apply grid options (row height)
3. Save Profile
4. **Reload the page**
5. Both settings should persist without conflict

### Test 4: Profile Switching
1. Create a new profile
2. Apply different column styles
3. Apply different grid options
4. Save the profile
5. Switch between profiles
6. Verify each profile maintains its own settings

## Debug Commands

Run this in browser console to check profile structure:

```javascript
// Check localStorage structure
const storage = JSON.parse(localStorage.getItem('grid-profiles'));
const profiles = storage?.state?.profiles || [];
profiles.forEach(p => {
  console.log(`Profile: ${p.name}`);
  console.log('- columnSettings:', !!p.columnSettings);
  console.log('- gridState:', !!p.gridState);
  console.log('- gridOptions:', !!p.gridOptions);
  console.log('- gridOptions content:', p.gridOptions);
});
```

## Expected Behavior

1. **Apply Buttons**: Update grid immediately, don't save to localStorage
2. **Save Profile**: Extracts current state and saves all three properties to localStorage
3. **Page Reload**: Restores all settings in correct order
4. **No Data Loss**: Column customizations preserved when grid options are saved

## Common Issues to Check

1. If column settings are lost:
   - Check browser console for errors
   - Verify columnSettings is in the profile
   - Check if gridOptions is overwriting other properties

2. If grid options don't persist:
   - Verify gridOptions is at root level, not nested in gridState
   - Check that Apply button calls saveGridOptions

3. If nothing saves:
   - Check for localStorage quota exceeded
   - Verify profile store persistence is enabled