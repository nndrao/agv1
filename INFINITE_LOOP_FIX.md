# Infinite Loop Fix - Maximum Update Depth Exceeded

## Issue
When clicking the "Apply" button in the column formatter dialog, React threw a "Maximum update depth exceeded" error, indicating an infinite render loop.

## Root Causes

### 1. Duplicate setState Calls
In `useColumnOperations.ts`, the `handleApplyColumnChanges` function was calling `setCurrentColumnDefs` twice:
- Line 183: `setCurrentColumnDefs(updatedColumns as ColumnDef[])`
- Line 204: `setCurrentColumnDefs(updatedColumns.map(...))`

This caused React to re-render multiple times unnecessarily.

### 2. Circular Dependency in useEffect
In `ColumnFormattingDialog.tsx`, the useEffect had a dependency on `columnDefs` which would change when Apply was clicked, causing the effect to run again, potentially triggering more updates.

## Solutions Applied

### 1. Fixed Duplicate setState in useColumnOperations.ts
```typescript
// BEFORE: Two calls to setCurrentColumnDefs
setCurrentColumnDefs(updatedColumns as ColumnDef[]);
// ... some code ...
setCurrentColumnDefs(updatedColumns.map((col) => { ... }));

// AFTER: Single call with normalized columns
const normalizedColumns = updatedColumns.map((col) => {
  if (col.field && col.headerName) {
    return col as ColumnDef;
  }
  return {
    ...col,
    field: col.field || '',
    headerName: col.headerName || col.field || ''
  };
});

// Update React state ONCE
setCurrentColumnDefs(normalizedColumns);
```

### 2. Fixed useEffect Dependencies in ColumnFormattingDialog.tsx
```typescript
// BEFORE: Depended on columnDefs which would change on Apply
useEffect(() => {
  if (open) {
    // ... initialization logic
  }
  setOpen(open);
}, [open, columnDefs, columnState, ...]);

// AFTER: Only depend on 'open' and check store state
useEffect(() => {
  // Only process when dialog is opening, not on every prop change
  if (open && !useColumnFormattingStore.getState().open) {
    // ... initialization logic
  }
  
  // Always sync the open state
  if (open !== useColumnFormattingStore.getState().open) {
    setOpen(open);
  }
}, [open]); // Only depend on 'open'
```

## Key Changes

1. **Single State Update**: Ensure each action only calls setState once
2. **Minimal Dependencies**: useEffect hooks should have minimal dependencies to prevent unnecessary re-runs
3. **State Checks**: Check current state before updating to prevent redundant updates

## Testing

1. Open the column formatter dialog
2. Make some changes
3. Click Apply
4. Verify no "Maximum update depth exceeded" error
5. Verify changes are applied correctly

## Prevention

To prevent similar issues in the future:
- Always review setState calls to ensure no duplicates
- Keep useEffect dependencies minimal
- Use state checks to prevent unnecessary updates
- Test Apply/Save operations thoroughly for render loops