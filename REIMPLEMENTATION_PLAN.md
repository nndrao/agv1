# DataTable Reimplementation Plan

## Overview
Complete reimplementation of the DataTable with proper separation of concerns and correct data flow.

## Phase 1: Core Store Setup

### 1.1 Create New Profile Store
```typescript
// stores/newProfile.store.ts
interface ProfileStore {
  // State - Three separate properties
  profiles: GridProfile[];
  activeProfileId: string | null;
  
  // Temporary state (not persisted)
  columnSettings: ColumnSettings;
  gridOptions: GridOptionsConfig;
  gridState: GridState;
  
  // Actions
  setActiveProfile: (id: string) => void;
  
  // Column Settings Actions (updates temporary state)
  updateColumnSettings: (settings: Partial<ColumnSettings>) => void;
  applyColumnSettingsToGrid: (api: GridApi) => void;
  
  // Grid Options Actions (updates temporary state)
  updateGridOptions: (options: Partial<GridOptionsConfig>) => void;
  applyGridOptionsToGrid: (api: GridApi) => void;
  
  // Save Profile Action (persists all three properties)
  saveProfile: () => void;
  
  // Load Profile Action
  loadProfile: (profileId: string) => void;
}
```

### 1.2 State Extraction Utilities
```typescript
// utils/gridStateExtractor.ts
export const extractGridState = (api: GridApi): GridState => {
  return {
    columnState: api.getColumnState(),
    filterModel: api.getFilterModel(),
    sortModel: api.getSortModel()
  };
};
```

## Phase 2: Component Architecture

### 2.1 DataTableContainer Rewrite
- Remove complex state management
- Use store directly
- Clear initialization sequence

### 2.2 Column Customization Dialog
- Apply button: Updates store.columnSettings + applies to grid
- No localStorage interaction
- Clear separation from save profile

### 2.3 Grid Options Editor  
- Apply button: Updates store.gridOptions + applies to grid
- No localStorage interaction
- Clear separation from save profile

### 2.4 Profile Manager
- Save button: Extracts grid state + saves all to localStorage
- Load: Applies in correct order (options → columns → state)

## Phase 3: Implementation Steps

### Step 1: New Store Implementation
```typescript
const useNewProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      // Implementation
    }),
    {
      name: 'grid-profiles-v2',
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId
      })
    }
  )
);
```

### Step 2: Column Settings Flow
1. Dialog opens → Load current settings from grid
2. User makes changes → Update local state
3. Apply clicked → `updateColumnSettings()` + `applyColumnSettingsToGrid()`
4. Dialog closes → Changes remain in memory

### Step 3: Grid Options Flow
1. Editor opens → Load current options from grid
2. User makes changes → Update local state  
3. Apply clicked → `updateGridOptions()` + `applyGridOptionsToGrid()`
4. Editor closes → Changes remain in memory

### Step 4: Save Profile Flow
1. Save Profile clicked
2. Extract current grid state: `extractGridState(api)`
3. Save to profile:
   ```typescript
   const profile = {
     columnSettings: get().columnSettings,
     gridOptions: get().gridOptions,
     gridState: extractGridState(api)
   };
   ```
4. Persist to localStorage

### Step 5: Load Profile Flow
```typescript
const loadProfile = (profile: GridProfile) => {
  // 1. Apply Grid Options
  Object.entries(profile.gridOptions).forEach(([key, value]) => {
    api.setGridOption(key, value);
  });
  
  // 2. Apply Column Settings
  const columnDefs = buildColumnDefs(
    baseColumnDefs,
    profile.columnSettings
  );
  api.setColumnDefs(columnDefs);
  
  // 3. Apply Grid State
  setTimeout(() => {
    api.applyColumnState({
      state: profile.gridState.columnState,
      applyOrder: true
    });
    api.setFilterModel(profile.gridState.filterModel);
    api.setSortModel(profile.gridState.sortModel);
  }, 100);
};
```

## Phase 4: Key Components to Rewrite

### 4.1 New DataTableContainer
```typescript
const DataTableContainer = () => {
  const gridApiRef = useRef<GridApi>(null);
  const { 
    applyColumnSettingsToGrid,
    applyGridOptionsToGrid,
    loadProfile,
    activeProfile
  } = useNewProfileStore();
  
  // Clear lifecycle
  useEffect(() => {
    if (gridApiRef.current && activeProfile) {
      loadProfile(activeProfile);
    }
  }, [activeProfile]);
  
  return (
    // Simplified structure
  );
};
```

### 4.2 New Column Dialog Apply Handler
```typescript
const handleApply = () => {
  // Update store
  updateColumnSettings(localChanges);
  
  // Apply to grid
  if (gridApi) {
    applyColumnSettingsToGrid(gridApi);
  }
  
  // Close dialog
  onClose();
};
```

### 4.3 New Grid Options Apply Handler
```typescript
const handleApply = () => {
  // Update store
  updateGridOptions(localOptions);
  
  // Apply to grid
  if (gridApi) {
    applyGridOptionsToGrid(gridApi);
  }
  
  // Show toast
  toast({ title: 'Grid options applied' });
};
```

### 4.4 New Save Profile Handler
```typescript
const handleSaveProfile = () => {
  if (!gridApi) return;
  
  // Extract current state
  const gridState = extractGridState(gridApi);
  
  // Update profile with all three properties
  updateProfile(activeProfileId, {
    columnSettings: store.columnSettings,
    gridOptions: store.gridOptions,
    gridState: gridState
  });
  
  // This triggers localStorage persistence
  toast({ title: 'Profile saved' });
};
```

## Phase 5: Migration Strategy

1. Create new store alongside existing one
2. Implement new components with "New" prefix
3. Test thoroughly
4. Switch over one component at a time
5. Remove old implementation

## Phase 6: Testing Plan

### Unit Tests
- Store actions
- State extraction
- Column definition building
- Load order

### Integration Tests  
- Apply → Save → Reload cycle
- Profile switching
- Import/export
- Error scenarios

### Manual Testing Checklist
- [ ] Column settings apply without save
- [ ] Grid options apply without save  
- [ ] Save profile captures all three states
- [ ] Reload restores all settings
- [ ] Load order is correct
- [ ] No data loss on profile switch

## Success Criteria

1. **Clear Separation**: Each property (columnSettings, gridOptions, gridState) is independent
2. **Correct Flow**: Apply updates store+grid, Save persists everything
3. **Proper Load Order**: Options → Columns → State
4. **No Data Loss**: All settings preserved across reloads
5. **Performance**: Fast profile switching and state updates

## Timeline Estimate

- Phase 1 (Store): 2-3 hours
- Phase 2 (Architecture): 1 hour  
- Phase 3 (Implementation): 4-6 hours
- Phase 4 (Components): 3-4 hours
- Phase 5 (Migration): 2-3 hours
- Phase 6 (Testing): 2-3 hours

Total: 14-22 hours