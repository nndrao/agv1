# Immediate Fix Implementation Plan

## Problem Summary
The current implementation has these issues:
1. Column settings and grid options are interfering with each other
2. Apply buttons are saving to localStorage instead of just updating the grid
3. Load order on app startup is incorrect
4. State properties are nested incorrectly in some places

## Quick Fix Approach (Without Full Rewrite)

### Step 1: Fix Store Structure
Update the profile store to properly separate concerns:

```typescript
// In profile.store.ts
interface GridProfile {
  id: string;
  name: string;
  description?: string;
  
  // Three separate, independent properties
  columnSettings?: {
    columnCustomizations?: Record<string, ColumnCustomization>;
    baseColumnDefs?: ColDef[];
  };
  
  gridState?: {
    columnState?: ColumnState[];
    filterModel?: FilterModel;
    sortModel?: SortModelItem[];
  };
  
  gridOptions?: GridOptionsConfig & { font?: string };
}
```

### Step 2: Fix Apply Button Behaviors

#### 2.1 Column Customization Dialog
In `FloatingRibbon/hooks/useRibbonState.ts`:
- Remove any calls to save to profile
- Only update the grid

```typescript
const handleApply = useCallback(() => {
  const updatedColumnDefs = applyChanges();
  if (onApply) {
    onApply(updatedColumnDefs);
  }
  // DO NOT call saveColumnSettings here
}, [applyChanges, onApply]);
```

#### 2.2 Grid Options Editor
In `GridOptionsPropertyEditor.tsx`:
- Apply should only update grid, not save to profile
- Keep Save button separate

```typescript
const handleApply = useCallback(() => {
  onApply(localOptions);
  // DO NOT save to profile here
  toast({
    title: 'Grid options applied',
    description: 'Your changes have been applied to the grid.',
  });
}, [localOptions, onApply, toast]);
```

### Step 3: Fix Save Profile Flow

In `ProfileManager.tsx`, the save button should:
1. Get current column definitions from grid
2. Extract grid state using AG-Grid APIs
3. Save all three properties together

```typescript
const handleSaveCurrentState = async () => {
  if (!gridApi || !activeProfile) return;
  
  // Get column definitions with customizations
  const columnDefs = getColumnDefsWithStyles ? 
    getColumnDefsWithStyles() : 
    gridApi.getColumnDefs();
    
  // Save column customizations
  saveColumnCustomizations(columnDefs, baseColumnDefs);
  
  // Extract and save grid state
  const gridState = {
    columnState: gridApi.getColumnState(),
    filterModel: gridApi.getFilterModel(),
    sortModel: getSortModel(gridApi) // Custom extraction
  };
  saveGridState(gridState);
  
  // Grid options are already in store from Apply buttons
  
  toast({
    title: 'Profile saved',
    description: `Saved to "${activeProfile.name}"`,
  });
};
```

### Step 4: Fix Load Order

In `ProfileManager.tsx` `_applyProfileStates`:

```typescript
const _applyProfileStates = (gridApi: GridApi, profile: GridProfile) => {
  // 1. Grid Options FIRST
  if (profile.gridOptions) {
    Object.entries(profile.gridOptions).forEach(([key, value]) => {
      if (value !== undefined && key !== 'font') {
        gridApi.setGridOption(key as any, value);
      }
    });
    if (profile.gridOptions.rowHeight) {
      gridApi.resetRowHeights();
    }
  }
  
  // 2. Column Settings SECOND (via parent callback)
  // This happens in handleProfileChange via onProfileChange callback
  
  // 3. Grid State LAST (with delays)
  setTimeout(() => {
    if (profile.gridState?.columnState) {
      gridApi.applyColumnState({
        state: profile.gridState.columnState,
        applyOrder: true
      });
    }
    
    setTimeout(() => {
      if (profile.gridState?.filterModel) {
        gridApi.setFilterModel(profile.gridState.filterModel);
      }
      
      setTimeout(() => {
        if (profile.gridState?.sortModel) {
          // Apply sorts
        }
      }, 50);
    }, 50);
  }, 100);
};
```

### Step 5: Fix Initialization

In `DataTableContainer.tsx`:
- Ensure profile is loaded after grid is ready
- Apply in correct order

```typescript
useEffect(() => {
  if (gridApiRef.current && activeProfile) {
    // Grid is ready and we have a profile
    const profileColumnDefs = getColumnDefs(activeProfile.id);
    if (profileColumnDefs) {
      setCurrentColumnDefs(profileColumnDefs);
    }
    
    // Grid options and state will be applied by ProfileManager
  }
}, [gridApiRef.current, activeProfile]);
```

## Testing Steps

1. **Test Column Settings**:
   - Open column dialog
   - Change cell colors/formatting
   - Click Apply (should update grid only)
   - Verify localStorage unchanged
   - Click Save Profile
   - Reload and verify settings persist

2. **Test Grid Options**:
   - Open grid options editor
   - Change row height
   - Click Apply (should update grid only)
   - Verify localStorage unchanged
   - Click Save Profile
   - Reload and verify settings persist

3. **Test Combined**:
   - Apply column settings
   - Apply grid options
   - Save profile
   - Reload
   - Verify both persist without conflict

## Key Files to Modify

1. `stores/profile.store.ts` - Ensure clean structure
2. `hooks/useRibbonState.ts` - Remove save on apply
3. `GridOptionsPropertyEditor.tsx` - Fix paths and remove save on apply
4. `ProfileManager.tsx` - Fix save and load flows
5. `hooks/useGridCallbacks.ts` - Fix initialization paths
6. `DataTableContainer.tsx` - Fix initialization order

## Success Metrics

- [ ] Apply buttons don't save to localStorage
- [ ] Save Profile captures all settings
- [ ] Reload restores all settings correctly
- [ ] No settings are lost or overwritten
- [ ] Load order is: Options → Columns → State