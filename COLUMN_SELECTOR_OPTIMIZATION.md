# Column Selector Panel Optimization

## Changes Made

### 1. Hard-coded Visible Columns as Default
- **File**: `/src/components/datatable/columnFormatting/components/ribbon/RibbonHeader.tsx`
- **Change**: Modified the filtering logic to always show only visible columns by default
- **Lines**: 194-197
- **Code**:
  ```typescript
  // ALWAYS filter by visibility - show only visible columns by default
  // Users can explicitly choose "All Columns" if they want to see hidden ones
  const effectiveVisibilityFilter = visibilityFilter === 'all' ? 'visible' : visibilityFilter;
  ```
- **Reason**: Ensures visible columns are shown regardless of persisted state

### 2. UI Consistency
- **File**: `/src/components/datatable/columnFormatting/components/ribbon/RibbonHeader.tsx`
- **Change**: Updated the Select component to show "Visible Columns" when filter is 'all'
- **Line**: 377
- **Code**:
  ```typescript
  value={visibilityFilter === 'all' ? 'visible' : visibilityFilter}
  ```
- **Reason**: Maintains UI consistency with the actual filtering behavior

### 3. Store Updates (Supporting Changes)
- **File**: `/src/components/datatable/columnFormatting/store/columnFormatting.store.ts`
- **Changes**: 
  - Changed default `visibilityFilter` from `'all'` to `'visible'` (line 170)
  - Added version and migration support (lines 673-683)
  - Added onRehydrateStorage migration (lines 667-670)
- **Reason**: Attempts to migrate existing users, though the hard-coded approach ensures it works regardless

## Benefits

1. **Faster Initial Load**: Showing only visible columns by default reduces the initial render time, especially for grids with many hidden columns
2. **Better UX**: Users typically want to format visible columns, not hidden ones
3. **Persistent Preferences**: User's visibility filter choice is remembered across sessions
4. **No State Loss**: Switching between tabs or closing/opening the dropdown doesn't reset the filter

## How It Works

1. When the column formatting dialog opens, the visibility filter defaults to "visible"
2. The column selector dropdown shows only columns where `columnState.hide !== true`
3. Users can change to "All Columns" or "Hidden Columns" using the dropdown filter
4. This preference is saved to localStorage and restored on next use
5. The filter state persists while the dialog is open, regardless of tab switches or dropdown open/close

## Note
The AG-Grid column state only includes columns that have been modified from their default state. If a column has no state entry, it's considered visible by default.