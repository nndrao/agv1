# Column State Properties Exclusion Fix

## Issue
Column formatter was including column state properties (width, visibility, position) which should be managed separately from formatting/styling. This caused:
1. Column visibility (`hide`) being changed when applying formatting
2. Column widths being overwritten when applying templates
3. Column positions being affected by formatting operations

## Solution
Enhanced the exclusion lists to separate column state properties from formatting properties.

### Properties Now Excluded

#### Column Identity Properties (already excluded):
- `field` - Data binding
- `headerName` - Display name
- `colId` - Unique identifier
- Column-specific functional properties

#### Column State Properties (newly excluded):
- `width`, `minWidth`, `maxWidth`, `flex` - Column sizing
- `hide` - Column visibility
- `pinned` - Column position (left/right pinning)
- `lockPosition`, `lockVisible` - Column locking
- `sort`, `sortIndex`, `sortedAt` - Sort state

### Changes Made

1. **columnFormatting.store.ts**
   - Enhanced `updateBulkProperties` to exclude column state properties
   - Added comprehensive list of excluded properties with categories

2. **TemplateSelector.tsx**
   - Updated exclusion list in template saving logic
   - Removed state properties from available properties list
   - Updated UI to show only formatting/styling properties

3. **SimpleTemplateControls.tsx**
   - Updated exclusion list to match other components
   - Ensures templates don't include state properties

4. **GeneralRibbonContent.tsx**
   - Removed "Initially Hidden" toggle since `hide` is a state property
   - Column visibility should be managed through column menu or grid API

## Benefits

1. **Clear Separation of Concerns**
   - Formatting/styling is separate from column state
   - Users can change formatting without affecting column layout

2. **Better User Experience**
   - No unexpected column hiding when applying styles
   - Column widths remain stable during formatting
   - Templates don't override column positions

3. **Consistency**
   - Column state is managed through AG-Grid's column menu
   - Formatting dialog focuses only on appearance

## What Remains in Column Formatter

### Allowed Properties:
- **Styling**: `cellClass`, `cellStyle`, `headerClass`, `headerStyle`
- **Text Wrapping**: `wrapText`, `autoHeight`, `wrapHeaderText`, `autoHeaderHeight`
- **Formatting**: `valueFormatter`, `type`
- **Filtering**: `filter`, `filterParams`, `floatingFilter`
- **Editing**: `editable`, `cellEditor`, `cellEditorParams`
- **Behavior**: `sortable`, `resizable`

### Not Allowed:
- Column identity (field, headerName)
- Column state (width, visibility, position)
- Column-specific functions (aggregation, grouping)

## Testing
1. Apply formatting to columns - verify width/visibility unchanged
2. Create and apply templates - verify only styling is applied
3. Use "Initially Hidden" from column menu instead of formatter
4. Verify column state persists separately from formatting