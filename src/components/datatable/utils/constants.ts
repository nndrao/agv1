import { ColDef } from 'ag-grid-community';

/**
 * Default column properties for AG-Grid
 */
export const DEFAULT_COL_DEF: Partial<ColDef> = {
  flex: 1,
  minWidth: 100,
  filter: true,
  floatingFilter: true,
  enableValue: true,
  enableRowGroup: true,
  enablePivot: true,
  resizable: true,
  sortable: true,
  // Enable value formatter for Excel export by default
  useValueFormatterForExport: true,
};

/**
 * Default column defaults for comparison
 */
export const COLUMN_DEFAULTS: Partial<ColDef> = {
  sortable: true,
  resizable: true,
  filter: true,
  floatingFilter: true,
  editable: false,
  hide: false,
  lockPosition: false,
  lockVisible: false,
  lockPinned: false,
  suppressHeaderMenuButton: false,
  flex: 1,
  minWidth: 100,
};

/**
 * Default grid spacing
 */
export const DEFAULT_GRID_SPACING = 6;

/**
 * Default font
 */
export const DEFAULT_FONT = 'monospace';

/**
 * Context menu items
 */
export const CONTEXT_MENU_ITEMS = [
  "autoSizeAll",
  "resetColumns",
  "separator",
  "copy",
  "copyWithHeaders",
  "paste",
  "separator",
  "export",
];

/**
 * Properties that should be explicitly cleared when removing customizations
 */
export const CLEARABLE_PROPERTIES = [
  'cellStyle', 'headerStyle', 'cellClass', 'headerClass', 'cellClassRules',
  'valueFormatter', 'valueGetter', 'valueSetter', 'useValueFormatterForExport',
  'filter', 'filterParams', 'floatingFilter', 'floatingFilterComponent', 
  'floatingFilterComponentParams', 'suppressHeaderMenuButton', 
  'suppressFiltersToolPanel', 'filterValueGetter',
  'editable', 'cellEditor', 'cellEditorParams', 'cellEditorPopup',
  'cellEditorPopupPosition', 'singleClickEdit', 'stopEditingWhenCellsLoseFocus',
  'cellEditorSelector', 'cellRenderer', 'cellRendererParams', 'cellRendererSelector',
  'wrapText', 'autoHeight', 'rowSpan', 'colSpan', 'textAlign', 'verticalAlign',
  'headerTooltip', 'headerComponent', 'headerComponentParams', 'headerTextAlign',
  'headerCheckboxSelection', 'headerCheckboxSelectionFilteredOnly',
  'wrapHeaderText', 'autoHeaderHeight', 'sortable', 'sort', 'sortingOrder',
  'comparator', 'unSortIcon', 'aggFunc', 'allowedAggFuncs',
  'pinned', 'lockPosition', 'lockPinned', 'lockVisible',
  'width', 'minWidth', 'maxWidth', 'flex', 'resizable', 'suppressSizeToFit',
  'initialWidth', 'initialHide', 'initialPinned',
  'tooltip', 'tooltipField', 'tooltipValueGetter', 'tooltipComponent',
  'tooltipComponentParams', 'suppressKeyboardEvent', 'suppressNavigable',
  'suppressPaste', 'checkboxSelection', 'showDisabledCheckboxes'
];

/**
 * Debounce delay for column updates
 */
export const COLUMN_UPDATE_DEBOUNCE_MS = 100;

/**
 * Delay for state restoration after column updates
 */
export const STATE_RESTORATION_DELAY_MS = 50;