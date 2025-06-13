# Deep Analysis: Column Visibility Loss Issue

## Problem Statement
When clicking "Apply" in the column formatter dialog, columns were losing their visibility state - hidden columns became visible.

## Root Cause Analysis

### 1. The Contamination Source
The fundamental issue was that column definitions were being contaminated with AG-Grid state properties at multiple points:

#### a) Profile Save (ProfileManager.tsx)
- When saving profiles, it was using `gridApi.getColumnDefs()`
- This API returns column definitions WITH current state (hide, width, pinned)
- These polluted definitions were being saved to localStorage

#### b) Column Serializer Defaults
- `COLUMN_DEFAULTS` included `hide: false`
- When deserializing, this default was applied to ALL columns
- This forced all columns to be visible regardless of their previous state

#### c) Column Formatter Store
- The store was accepting and storing these polluted column definitions
- When applying changes, it was passing them back to the grid with state properties

### 2. The Flow of Contamination

```
1. User hides columns in grid
2. User saves profile
   → ProfileManager gets columnDefs from grid (includes hide: true)
   → Saves to localStorage with state properties
3. User reopens app/loads profile
   → Profile loads columnDefs with hide properties
   → Grid respects these and hides columns
4. User opens column formatter
   → Dialog receives polluted columnDefs
   → Stores them in formatting store
5. User clicks Apply
   → Store returns columnDefs with hide properties
   → Grid resets visibility based on these properties
```

### 3. Why Previous Fixes Didn't Work

#### Attempt 1: Filter in applyChanges
- Only filtered pending changes, not original column definitions
- Original definitions still had state properties

#### Attempt 2: Clean in useColumnOperations
- Cleaned too late in the process
- Column definitions were already polluted when stored

#### Attempt 3: Restore column state
- Tried to restore state after damage was done
- State was already lost when definitions were applied

## The Complete Solution

### 1. Fix Column Serializer (columnSerializer.ts)
```typescript
// Remove state properties from defaults
const COLUMN_DEFAULTS: Partial<ColDef> = {
  sortable: true,
  resizable: true,
  // REMOVED: hide: false, // This was forcing all columns visible!
  minWidth: 100,
};
```

### 2. Clean at Source (ProfileManager.tsx)
```typescript
// Clean column definitions before saving
const cleanedDefs = columnDefs.map(col => {
  const cleaned = { ...col };
  // Remove ALL state properties
  ['width', 'hide', 'pinned', 'sort', ...].forEach(prop => {
    delete cleaned[prop];
  });
  return cleaned;
});
```

### 3. Clean on Load (ColumnFormattingDialog.tsx)
```typescript
// Clean when initializing store
const cleanedCol = { ...col };
statefulProperties.forEach(prop => {
  delete cleanedCol[prop];
});
```

### 4. Clean Before Apply (useColumnOperations.ts)
```typescript
// Final safety net - clean before applying to grid
const cleanColumns = columns.map(col => {
  const cleanCol = { ...col };
  statefulProperties.forEach(prop => {
    delete cleanCol[prop];
  });
  return cleanCol;
});
```

## Key Principles

### 1. Separation of Concerns
- **Column Definitions**: Structure and formatting only
- **Column State**: Visibility, width, order (managed by AG-Grid)

### 2. AG-Grid Best Practices
- Never include state properties in column definitions
- Use Column State API for state management
- Use `initial*` properties for defaults, not direct properties

### 3. Data Flow
```
Column Definitions (Clean) → Grid → User Interactions → Column State
     ↑                                                        ↓
     └─────────── Should never merge ←───────────────────────┘
```

## Testing the Fix

1. Hide some columns in the grid
2. Save the profile
3. Open column formatter
4. Apply formatting changes
5. Verify hidden columns remain hidden

## Debugging Commands

```javascript
// Check column definitions for state properties
gridApi.getColumnDefs().forEach(col => {
  if ('hide' in col || 'width' in col || 'pinned' in col) {
    console.error('State property found in column:', col.field, {
      hide: col.hide,
      width: col.width,
      pinned: col.pinned
    });
  }
});

// Compare visibility before/after
const before = gridApi.getColumnState().filter(c => !c.hide).length;
// ... apply changes ...
const after = gridApi.getColumnState().filter(c => !c.hide).length;
console.log('Visibility change:', { before, after, diff: after - before });
```

## Conclusion

The issue was caused by mixing column definitions (structure) with column state (user preferences). The fix ensures strict separation between these concerns at every level of the application.