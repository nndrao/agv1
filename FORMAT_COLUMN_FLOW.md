# AG-Grid "Format Column" Context Menu Flow

## Overview
When you right-click on a column header in AG-Grid and select "Format Column" from the context menu, it opens the **ColumnCustomizationDialog** component.

## Flow Sequence

### 1. Context Menu Click
**File**: `src/components/datatable/hooks/useGridCallbacks.ts` (lines 30-47)
```javascript
getContextMenuItems: (params) => {
  if (params.column) {
    return [
      {
        name: 'Format Column',
        action: () => {
          // Dispatch custom event with column info and click position
          const event = new CustomEvent('format-column', {
            detail: {
              colId: params.column.getColId(),
              colDef: params.column.getColDef(),
              x: params.event?.clientX || 0,
              y: params.event?.clientY || 0
            }
          });
          window.dispatchEvent(event);
        },
        icon: '<span class="ag-icon ag-icon-columns" style="font-size: 14px;">🎨</span>'
      },
      // ... other menu items
    ];
  }
}
```

### 2. Event Listener
**File**: `src/components/datatable/DataTableContainer.tsx` (lines 163-179)
```javascript
const handleFormatColumn = (event: Event) => {
  const customEvent = event as CustomEvent;
  const { colId } = customEvent.detail;
  
  // Open the dialog (which now shows the ribbon)
  setShowColumnDialog(true);
  
  // Pre-select the column in the store
  if (colId) {
    // Use the store directly to select the column
    setTimeout(() => {
      const store = useColumnCustomizationStore.getState();
      store.setSelectedColumns(new Set([colId]));
    }, 100);
  }
};

window.addEventListener('format-column', handleFormatColumn);
```

### 3. Dialog Component
**File**: `src/components/datatable/DataTableContainer.tsx` (lines 277-283)
```javascript
<ColumnCustomizationDialog
  open={showColumnDialog}
  onOpenChange={setShowColumnDialog}
  columnDefs={processedColumns}
  columnState={columnState}
  onApply={handleApplyColumnChanges}
/>
```

## Component Details

### ColumnCustomizationDialog
- **Location**: `src/components/datatable/columnCustomizations/ColumnCustomizationDialog.tsx`
- **Purpose**: A comprehensive column formatting and customization interface
- **Features**:
  - Column selection panel
  - Multiple customization tabs (General, Format, Styling, Filters, Editors, Advanced)
  - Bulk actions for applying changes to multiple columns
  - Template system for reusable column configurations
  - Live preview of changes

### Key Features When Opened from Context Menu
1. **Auto-selection**: The column you right-clicked is automatically selected
2. **Context-aware**: The dialog knows which column triggered it
3. **Full access**: All column customization options are available
4. **Bulk operations**: Can still select additional columns for bulk changes

## Implementation Notes

- The dialog uses a **floating ribbon UI** for better user experience
- Changes are applied through the column customization store
- The dialog integrates with the profile system for saving configurations
- It supports both individual column edits and bulk operations

## Alternative Access
The same ColumnCustomizationDialog can also be opened by:
- Clicking the column settings button in the toolbar
- Using the keyboard shortcut (if configured)
- Programmatically via the `open-column-settings` event