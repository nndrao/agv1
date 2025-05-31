# AG Grid Options Reference Guide (v33.2.0)

This document organizes AG Grid options into logical categories, with types and appropriate UI elements for editing each option. For dropdown and select elements, the available options are listed.

**Note**: Options marked with (Enterprise) require an AG Grid Enterprise license. Community users will see watermarks and console warnings if attempting to use these features.

## 1. Basic Grid Configuration

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `rowData` | Array | JSON Editor | The data to be displayed in the grid. Each item represents a row. |
| `columnDefs` | Array | JSON Editor/Form Builder | Definitions for the columns in the grid. |
| `defaultColDef` | Object | Form/Key-Value Editor | Default column definitions applied to all columns. |
| `rowHeight` | Number | Number Input | Height in pixels for each row. |
| `headerHeight` | Number | Number Input | Height in pixels for the header row. |
| `rowModelType` | String | Dropdown | The row model to use. **Options:** `clientSide`, `infinite`, `serverSide`, `viewport` |

## 2. Selection Options

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `rowSelection` | String | Radio Buttons | Type of row selection. **Options:** `single`, `multiple` |
| `rowMultiSelectWithClick` | Boolean | Checkbox | Allow multiple row selection with single click. |
| `suppressRowClickSelection` | Boolean | Checkbox | Prevent rows from being selected when clicked. |
| `suppressCellSelection` | Boolean | Checkbox | Prevent cells from being selected. |
| `enableRangeSelection` | Boolean | Checkbox | Enable range selection (multiple cells). |
| `enableRangeHandle` | Boolean | Checkbox | Show range handle for extending selection. |
| `suppressRowDeselection` | Boolean | Checkbox | Prevent rows from being deselected. |

## 3. Sorting & Filtering

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `sortingOrder` | Array | Multi-select Dropdown | Order of sort cycles. **Options:** Array containing any combination of `asc`, `desc`, and `null`. **Example:** `['asc', 'desc', null]` |
| `multiSortKey` | String | Dropdown | Key to hold for multi-column sorting. **Options:** `ctrl`, `shift`, `alt` |
| `accentedSort` | Boolean | Checkbox | Use locale-specific rules for sorting accented characters. |
| `enableAdvancedFilter` | Boolean | Checkbox | Enable Advanced Filter feature (Enterprise). |
| `quickFilterText` | String | Text Input | Text for quick filtering across all columns. |
| `cacheQuickFilter` | Boolean | Checkbox | Cache quick filter results for better performance. |
| `excludeChildrenWhenTreeDataFiltering` | Boolean | Checkbox | Whether to exclude children when filtering tree data. |

## 4. Pagination Options

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `pagination` | Boolean | Checkbox | Enable pagination. |
| `paginationPageSize` | Number | Number Input | Number of rows per page. |
| `paginationAutoPageSize` | Boolean | Checkbox | Automatically adjust page size based on the height of the grid. |
| `suppressPaginationPanel` | Boolean | Checkbox | Hide the pagination panel. |
| `paginationPageSizeSelector` | Array | Multi-select Input | Array of page sizes to display in the size selector. **Example:** `[10, 20, 50, 100]` |

## 5. Row Grouping & Pivoting (Enterprise)

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `groupUseEntireRow` | Boolean | Checkbox | Display group rows spanning entire width of grid. |
| `groupSelectsChildren` | Boolean | Checkbox | Selecting a group selects all children. |
| `groupSelectsFiltered` | Boolean | Checkbox | When selecting a group, select only filtered children. |
| `groupRemoveSingleChildren` | Boolean | Checkbox | Remove groups with only one child. |
| `groupSuppressAutoColumn` | Boolean | Checkbox | Suppress the auto-created group column. |
| `pivotMode` | Boolean | Checkbox | Enable pivot mode. |
| `pivotPanelShow` | String | Dropdown | When to show pivot panel. **Options:** `always`, `onlyWhenPivoting`, `never` |
| `groupDefaultExpanded` | Number | Number Input | Default expansion level for groups (-1 for all expanded). |
| `rowGroupPanelShow` | String | Dropdown | When to show row group panel. **Options:** `always`, `onlyWhenGrouping`, `never` |
| `groupDisplayType` | String | Dropdown | How to display groups. **Options:** `singleColumn`, `multipleColumns`, `groupRows`, `custom` |
| `groupIncludeFooter` | Boolean | Checkbox | If using footer, add an extra group row where aggregates are displayed. |
| `groupIncludeTotalFooter` | Boolean | Checkbox | Set to true to add a total row to the end of the grid. |
| `groupSuppressBlankHeader` | Boolean | Checkbox | If true, the group header won't be displayed for the top level groups. |
| `groupRemoveLowestSingleChildren` | Boolean | Checkbox | If true, single children rows are removed from the lowest level group. |
| `groupSuppressRow` | Boolean | Checkbox | If true, the group row will not be rendered, useful when doing custom grouping. |
| `groupHideOpenParents` | Boolean | Checkbox | If true, when a group is expanded, the parent group row is hidden. |
| `pivotDefaultExpanded` | Number | Number Input | Default expansion level for pivot rows. |
| `functionsReadOnly` | Boolean | Checkbox | Set to true to prevent the grid from allowing the user to modify functions. |
| `suppressMakeColumnVisibleAfterUnGroup` | Boolean | Checkbox | When de-grouping, columns in the group get placed at the position where the group was. |
| `treeDataDisplayType` | String | Dropdown | For tree data, display type. **Options:** `auto`, `custom` |
| `showOpenedGroup` | Boolean | Checkbox | Shows the open group in the group column. |
| `suppressGroupZeroSticky` | Boolean | Checkbox | If true, group zero will not be sticky. |
| `groupRowsSticky` | Boolean | Checkbox | If true, group rows will stick to the top of the grid. |
| `groupRowRenderer` | String/Component | Dropdown/Component Picker | Component to use for the group row renderer. |
| `suppressAggFuncInHeader` | Boolean | Checkbox | When true, the aggregation function names won't be shown in the column headers. |
| `suppressGroupMaintainValueType` | Boolean | Checkbox | When true, the column's value type will be preserved when moving in/out of the row group panel. |

## 6. Editing Options

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `editType` | String | Radio Buttons | Type of editing. **Options:** `fullRow`, `singleClick`, `none` |
| `singleClickEdit` | Boolean | Checkbox | Enter edit mode with a single click. |
| `suppressClickEdit` | Boolean | Checkbox | Disable entering edit mode with mouse clicks. |
| `enterMovesDown` | Boolean | Checkbox | Enter key moves focus down. |
| `enterMovesDownAfterEdit` | Boolean | Checkbox | Enter key moves down after editing. |
| `undoRedoCellEditing` | Boolean | Checkbox | Enable undo/redo for cell editing. |
| `undoRedoCellEditingLimit` | Number | Number Input | Set the undo stack size. |

## 7. Styling & Appearance

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `theme` | String | Dropdown | Grid theme. **Options:** `ag-theme-alpine`, `ag-theme-alpine-dark`, `ag-theme-balham`, `ag-theme-balham-dark`, `ag-theme-material`, `ag-theme-quartz`, `ag-theme-quartz-dark` |
| `rowClass` | String/Function | Text Input/Code Editor | CSS class to apply to rows. |
| `rowStyle` | Object/Function | JSON Editor/Code Editor | Inline styles to apply to rows. |
| `getRowClass` | Function | Code Editor | Function to return CSS class for a row. |
| `getRowStyle` | Function | Code Editor | Function to return style for a row. |
| `alwaysShowVerticalScroll` | Boolean | Checkbox | Always show vertical scrollbar. |
| `domLayout` | String | Dropdown | Type of DOM layout. **Options:** `normal`, `autoHeight`, `print` |
| `animateRows` | Boolean | Checkbox | Enable row animation when sorting or filtering. |

## 8. Column Features

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `suppressDragLeaveHidesColumns` | Boolean | Checkbox | Prevent column hiding when dragged out of grid. |
| `suppressMovableColumns` | Boolean | Checkbox | Prevent column moving. |
| `suppressFieldDotNotation` | Boolean | Checkbox | Disable dot notation for accessing nested properties. |
| `autoGroupColumnDef` | Object | Form/JSON Editor | Definition for auto-generated group column. |
| `suppressAutoSize` | Boolean | Checkbox | Prevent automatic column sizing. |

## 9. UI Components

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `components` | Object | JSON Editor/Key-Value Editor | Map of component names to component definitions. |
| `frameworkComponents` | Object | JSON Editor/Key-Value Editor | Map of component names to framework components. |
| `loadingCellRenderer` | String/Component | Dropdown/Component Picker | Component for loading cells. **Options:** Default is 'agLoadingCellRenderer', or custom component name. |
| `loadingOverlayComponent` | String/Component | Dropdown/Component Picker | Component for loading overlay. **Options:** Default is 'agLoadingOverlay', or custom component name. |
| `noRowsOverlayComponent` | String/Component | Dropdown/Component Picker | Component for no-rows overlay. **Options:** Default is 'agNoRowsOverlay', or custom component name. |
| `suppressLoadingOverlay` | Boolean | Checkbox | Hide loading overlay. |
| `suppressNoRowsOverlay` | Boolean | Checkbox | Hide no-rows overlay. |

## 10. Status Bar (Enterprise)

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `statusBar` | Object | Object Editor | Status bar configuration. Contains `statusPanels` array. |

### Status Panel Configuration

Each panel in the `statusPanels` array accepts:

| Property | Type | Default | UI Element | Description |
|:---------|:-----|:--------|:-----------|:------------|
| `statusPanel` | String/Component | (required) | Dropdown/Component Picker | Panel name or component reference. **Built-in Options:** `agTotalRowCountComponent`, `agTotalAndFilteredRowCountComponent`, `agFilteredRowCountComponent`, `agSelectedRowCountComponent`, `agAggregationComponent` |
| `align` | String | 'right' | Dropdown | Panel position. **Options:** `left`, `center`, `right` |
| `key` | String | undefined | Text Input | Unique identifier for accessing via API |
| `statusPanelParams` | Object | {} | JSON Editor | Additional parameters for the panel |

### Built-in Status Bar Panels (Enterprise)

1. **`agTotalRowCountComponent`**
   - Shows the total number of rows in the grid
   - Displays format: "Rows: [total]"
   - Always visible when configured

2. **`agTotalAndFilteredRowCountComponent`**
   - Shows both total and filtered row counts  
   - Displays format: "Total Rows: [total] (Filtered: [filtered])"
   - Useful when filters are applied to show both counts

3. **`agFilteredRowCountComponent`**
   - Shows only the filtered row count
   - Displays format: "Filtered: [filtered]"
   - Only works with the client-side row model
   - Hidden when no filters are active

4. **`agSelectedRowCountComponent`**
   - Shows the count of selected rows
   - Displays format: "Selected: [count]"  
   - Updates as rows are selected/deselected

5. **`agAggregationComponent`**
   - Shows aggregations on selected cell ranges
   - Displays multiple aggregation functions: count, sum, min, max, avg
   - Only visible when cells are selected
   - Can be configured to show specific aggregation functions only

### Status Panel Params

#### Aggregation Component Params

| Property | Type | UI Element | Description |
|:---------|:-----|:-----------|:------------|
| `aggFuncs` | Array | Multi-select | Aggregation functions to display. **Options:** `count`, `sum`, `min`, `max`, `avg` |
| `valueFormatter` | Function | Code Editor | Function to format displayed values (new in v33.2.0) |

### Configuration Example

```javascript
const gridOptions = {
  statusBar: {
    statusPanels: [
      { 
        statusPanel: 'agTotalRowCountComponent', 
        align: 'left' 
      },
      { 
        statusPanel: 'agFilteredRowCountComponent', 
        align: 'center' 
      },
      { 
        statusPanel: 'agSelectedRowCountComponent', 
        align: 'center' 
      },
      { 
        statusPanel: 'agAggregationComponent', 
        align: 'right',
        statusPanelParams: {
          aggFuncs: ['avg', 'sum']
        }
      }
    ]
  }
}
```

### Notes
- These panels are **Enterprise-only features**
- All panels can be positioned using the `align` property
- The `agFilteredRowCountComponent` only works with the client-side row model
- The `agAggregationComponent` only appears when range selection is enabled and cells are selected
- As of v33.2.0, value formatting can be applied to customize how values are displayed

## 11. Data & Rendering

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `rowBuffer` | Number | Number Input | Number of rows rendered outside visible area. |
| `dataTypeDefinitions` | Object | JSON Editor | Define custom data types. |
| `valueCache` | Boolean | Checkbox | Enable value caching for rendering. |
| `immutableData` | Boolean | Checkbox | Indicate data objects are immutable. |
| `enableCellChangeFlash` | Boolean | Checkbox | Flash cells that change value. |
| `asyncTransactionWaitMillis` | Number | Number Input | Milliseconds to wait for asynchronous transaction batching. |

## 11. Data & Rendering

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `rowBuffer` | Number | Number Input | Number of rows rendered outside visible area. |
| `dataTypeDefinitions` | Object | JSON Editor | Define custom data types. |
| `valueCache` | Boolean | Checkbox | Enable value caching for rendering. |
| `immutableData` | Boolean | Checkbox | Indicate data objects are immutable. |
| `enableCellChangeFlash` | Boolean | Checkbox | Flash cells that change value. |
| `asyncTransactionWaitMillis` | Number | Number Input | Milliseconds to wait for asynchronous transaction batching. |

## 12. Clipboard & Export

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `enableCellTextSelection` | Boolean | Checkbox | Enable cell text selection. |
| `suppressCopyRowsToClipboard` | Boolean | Checkbox | Prevents rows being copied to clipboard. |
| `suppressCopySingleCellRanges` | Boolean | Checkbox | Prevent copying to clipboard when only a single cell is selected. |
| `clipboardDelimiter` | String | Text Input | The delimiter to use when copying to clipboard. |
| `processClipboardCopy` | Function | Code Editor | Function to process clipboard data before copy (Enterprise). |
| `processClipboardPaste` | Function | Code Editor | Function to process clipboard data before paste (Enterprise). |
| `suppressExcelExport` | Boolean | Checkbox | Prevent Excel export (Enterprise). |
| `suppressCsvExport` | Boolean | Checkbox | Prevent CSV export. |
| `exporterCsvFilename` | String | Text Input | Default filename for CSV export. |
| `exporterExcelFilename` | String | Text Input | Default filename for Excel export (Enterprise). |

## 13. Events & Callbacks

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `onGridReady` | Function | Code Editor | Callback when grid is ready. |
| `onCellClicked` | Function | Code Editor | Callback when cell is clicked. |
| `onRowClicked` | Function | Code Editor | Callback when row is clicked. |
| `onSelectionChanged` | Function | Code Editor | Callback when selection changes. |
| `onFilterChanged` | Function | Code Editor | Callback when filter changes. |
| `onSortChanged` | Function | Code Editor | Callback when sort changes. |
| `onRowGroupOpened` | Function | Code Editor | Callback when row group is opened/closed. |
| `onColumnResized` | Function | Code Editor | Callback when column is resized. |
| `onGridSizeChanged` | Function | Code Editor | Callback when grid changes size. |
| `onDragStarted` | Function | Code Editor | Callback when drag operation starts. |
| `onDragStopped` | Function | Code Editor | Callback when drag operation stops. |
| `onPaginationChanged` | Function | Code Editor | Callback when pagination changes. |
| `onFirstDataRendered` | Function | Code Editor | Callback after the first time data is rendered. |
| `onRowDataUpdated` | Function | Code Editor | Callback when row data is updated. |

## 14. Advanced Features

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `enableCharts` | Boolean | Checkbox | Enable integrated charts (Enterprise). |
| `masterDetail` | Boolean | Checkbox | Enable master-detail view (Enterprise). |
| `detailCellRendererParams` | Object | JSON Editor | Parameters for detail cell renderer in master-detail. |
| `treeData` | Boolean | Checkbox | Indicate row data contains tree structure. |
| `getDataPath` | Function | Code Editor | Function to determine hierarchy in tree data. |
| `getRowNodeId` | Function | Code Editor | Function to get unique IDs for row nodes. |
| `serverSideRowModel` | Boolean | Checkbox | **Note**: Set `rowModelType: 'serverSide'` instead (Enterprise). |

## 15. Localization & Accessibility

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `localeText` | Object | JSON Editor | Localization text. |
| `localeTextFunc` | Function | Code Editor | Function for generating localization text. |
| `ensureDomOrder` | Boolean | Checkbox | Ensure DOM order matches visual order (for accessibility). |
| `suppressColumnVirtualisation` | Boolean | Checkbox | Don't virtualize columns (helps screen readers). |
| `suppressRowVirtualisation` | Boolean | Checkbox | Don't virtualize rows (helps screen readers). |
| `navigateToNextCell` | Function | Code Editor | Custom navigation function. |
| `tabToNextCell` | Function | Code Editor | Custom tab navigation function. |

## 16. Sizing & Dimensions

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `pivotHeaderHeight` | Number | Number Input | Height in pixels for pivot header rows. |
| `pivotGroupHeaderHeight` | Number | Number Input | Height in pixels for pivot group header rows. |
| `groupHeaderHeight` | Number | Number Input | Height in pixels for group header rows. |
| `floatingFiltersHeight` | Number | Number Input | Height in pixels for floating filters. |
| `detailRowHeight` | Number | Number Input | Height of detail rows in master-detail. |
| `groupRowHeight` | Number | Number Input | Height in pixels for group rows. |

## 17. Column Default Values

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `columnTypes` | Object | JSON Editor | Define column types to reuse column definitions. |

## 18. Find Options (Enterprise - New in v33.2.0)

| Option | Type | UI Element | Description |
|:-------|:-----|:-----------|:------------|
| `find` | Boolean | Checkbox | Enable find functionality. |
| `findCellValueMatcher` | Function | Code Editor | Function to customize cell value matching during find operations. |
| `findNextParams` | Object | JSON Editor | Parameters for find next function. |
| `findPreviousParams` | Object | JSON Editor | Parameters for find previous function. |

### Common Column Properties for defaultColDef

| Property | Type | UI Element | Description |
|:---------|:-----|:-----------|:------------|
| `sortable` | Boolean | Checkbox | Whether column can be sorted. |
| `resizable` | Boolean | Checkbox | Whether column can be resized. |
| `filter` | Boolean/String | Checkbox/Dropdown | Enable filtering and filter type. **Options:** `true`, `false`, `agTextColumnFilter`, `agNumberColumnFilter`, `agDateColumnFilter`, `agSetColumnFilter` |
| `editable` | Boolean | Checkbox | Whether cells in the column can be edited. |
| `cellRenderer` | String/Component | Dropdown | Cell renderer to use. **Options:** Default is value as string, or custom renderer name like `agGroupCellRenderer` |
| `cellEditor` | String/Component | Dropdown | Cell editor to use. **Options:** `agTextCellEditor`, `agSelectCellEditor`, `agLargeTextCellEditor`, `agNumberCellEditor`, `agDateCellEditor` |
| `cellDataType` | String | Dropdown | Type of data in the cell. **Options:** `text`, `number`, `boolean`, `date`, `dateString`, `object` |
