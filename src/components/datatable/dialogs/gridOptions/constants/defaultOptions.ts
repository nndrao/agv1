// Default Grid Options based on AG-Grid defaults
export const DEFAULT_GRID_OPTIONS: Record<string, any> = {
  // Basic Grid Configuration
  rowData: undefined,
  columnDefs: undefined,
  defaultColDef: undefined,
  rowHeight: 25,
  headerHeight: 25,
  rowModelType: 'clientSide',
  
  // Selection Options
  rowSelection: undefined,
  rowMultiSelectWithClick: false,
  suppressRowClickSelection: false,
  suppressCellSelection: false,
  enableRangeSelection: false,
  enableRangeHandle: false,
  suppressRowDeselection: false,
  
  // Sorting & Filtering
  sortingOrder: ['asc', 'desc', null],
  multiSortKey: 'ctrl',
  accentedSort: false,
  enableAdvancedFilter: false,
  quickFilterText: '',
  cacheQuickFilter: false,
  excludeChildrenWhenTreeDataFiltering: false,
  
  // Pagination Options
  pagination: false,
  paginationPageSize: 100,
  paginationAutoPageSize: false,
  suppressPaginationPanel: false,
  paginationPageSizeSelector: [20, 50, 100],
  
  // Row Grouping & Pivoting (Enterprise)
  groupUseEntireRow: false,
  groupSelectsChildren: false,
  groupSelectsFiltered: false,
  groupRemoveSingleChildren: false,
  groupSuppressAutoColumn: false,
  pivotMode: false,
  pivotPanelShow: 'never',
  groupDefaultExpanded: 0,
  rowGroupPanelShow: 'never',
  groupDisplayType: 'singleColumn',
  groupIncludeFooter: false,
  groupIncludeTotalFooter: false,
  groupSuppressBlankHeader: false,
  groupRemoveLowestSingleChildren: false,
  groupSuppressRow: false,
  groupHideOpenParents: false,
  pivotDefaultExpanded: 0,
  functionsReadOnly: false,
  suppressMakeColumnVisibleAfterUnGroup: false,
  treeDataDisplayType: 'auto',
  showOpenedGroup: false,
  suppressGroupZeroSticky: false,
  groupRowsSticky: false,
  groupRowRenderer: undefined,
  suppressAggFuncInHeader: false,
  suppressGroupMaintainValueType: false,
  
  // Editing Options
  editType: undefined,
  singleClickEdit: false,
  suppressClickEdit: false,
  enterMovesDown: false,
  enterMovesDownAfterEdit: false,
  undoRedoCellEditing: false,
  undoRedoCellEditingLimit: 10,
  
  // Styling & Appearance
  theme: undefined,
  rowClass: undefined,
  rowStyle: undefined,
  getRowClass: undefined,
  getRowStyle: undefined,
  alwaysShowVerticalScroll: false,
  domLayout: 'normal',
  animateRows: true,
  
  // Column Features
  suppressDragLeaveHidesColumns: false,
  suppressMovableColumns: false,
  suppressFieldDotNotation: false,
  autoGroupColumnDef: undefined,
  suppressAutoSize: false,
  
  // UI Components
  components: undefined,
  frameworkComponents: undefined,
  loadingCellRenderer: undefined,
  loadingOverlayComponent: undefined,
  noRowsOverlayComponent: undefined,
  suppressLoadingOverlay: false,
  suppressNoRowsOverlay: false,
  
  // Status Bar (Enterprise)
  statusBar: undefined,
  
  // Data & Rendering
  rowBuffer: 10,
  dataTypeDefinitions: undefined,
  valueCache: false,
  immutableData: false,
  enableCellChangeFlash: false,
  asyncTransactionWaitMillis: 50,
  
  // Clipboard & Export
  enableCellTextSelection: false,
  suppressCopyRowsToClipboard: false,
  suppressCopySingleCellRanges: false,
  clipboardDelimiter: '\t',
  processClipboardCopy: undefined,
  processClipboardPaste: undefined,
  suppressExcelExport: false,
  suppressCsvExport: false,
  exporterCsvFilename: undefined,
  exporterExcelFilename: undefined,
  
  // Advanced Features
  enableCharts: false,
  masterDetail: false,
  detailCellRendererParams: undefined,
  treeData: false,
  getDataPath: undefined,
  getRowNodeId: undefined,
  
  // Localization & Accessibility
  localeText: undefined,
  localeTextFunc: undefined,
  ensureDomOrder: false,
  suppressColumnVirtualisation: false,
  suppressRowVirtualisation: false,
  navigateToNextCell: undefined,
  tabToNextCell: undefined,
  
  // Sizing & Dimensions
  pivotHeaderHeight: undefined,
  pivotGroupHeaderHeight: undefined,
  groupHeaderHeight: undefined,
  floatingFiltersHeight: undefined,
  detailRowHeight: undefined,
  groupRowHeight: undefined,
  
  // Column Default Values
  columnTypes: undefined,
  
  // Find Options (Enterprise - New in v33.2.0)
  find: false,
  findCellValueMatcher: undefined,
  findNextParams: undefined,
  findPreviousParams: undefined
};