// GridOptions types based on AG-Grid documentation
export interface GridOptionsConfig {
  // Appearance and Layout
  headerHeight?: number;
  rowHeight?: number;
  floatingFiltersHeight?: number;
  groupHeaderHeight?: number;
  pivotHeaderHeight?: number;
  pivotGroupHeaderHeight?: number;
  enableRtl?: boolean;
  domLayout?: 'normal' | 'autoHeight' | 'print';
  
  // Performance
  rowBuffer?: number;
  suppressRowVirtualisation?: boolean;
  suppressColumnVirtualisation?: boolean;
  animateRows?: boolean;
  
  // Behavior
  pagination?: boolean;
  paginationPageSize?: number;
  paginationPageSizeSelector?: number[] | boolean;
  editType?: 'fullRow' | null;
  singleClickEdit?: boolean;
  stopEditingWhenCellsLoseFocus?: boolean;
  enterNavigatesVertically?: boolean;
  enterNavigatesVerticallyAfterEdit?: boolean;
  
  // Selection
  rowSelection?: 'single' | 'multiple';
  suppressRowDeselection?: boolean;
  suppressRowClickSelection?: boolean;
  suppressCellFocus?: boolean;
  enableRangeSelection?: boolean;
  enableRangeHandle?: boolean;
  enableFillHandle?: boolean;
  
  // Interaction
  suppressMovableColumns?: boolean;
  suppressDragLeaveHidesColumns?: boolean;
  rowDragManaged?: boolean;
  rowDragEntireRow?: boolean;
  rowDragMultiRow?: boolean;
  
  // Data Management
  maintainColumnOrder?: boolean;
  deltaSort?: boolean;
  accentedSort?: boolean;
  suppressMultiSort?: boolean;
  alwaysMultiSort?: boolean;
  
  // Clipboard
  copyHeadersToClipboard?: boolean;
  copyGroupHeadersToClipboard?: boolean;
  clipboardDelimiter?: string;
  suppressCopyRowsToClipboard?: boolean;
  suppressCopySingleCellRanges?: boolean;
  
  // Row Grouping
  groupDefaultExpanded?: number;
  groupMaintainOrder?: boolean;
  groupSelectsChildren?: boolean;
  groupIncludeFooter?: boolean;
  groupIncludeTotalFooter?: boolean;
  groupSuppressAutoColumn?: boolean;
  groupRemoveSingleChildren?: boolean;
  groupRemoveLowestSingleChildren?: boolean;
  groupDisplayType?: 'singleColumn' | 'multipleColumns' | 'groupRows' | 'custom';
  groupRowsSticky?: boolean;
  rowGroupPanelShow?: 'never' | 'always' | 'onlyWhenGrouping';
  suppressRowGroupHidesColumns?: boolean;
  suppressMakeColumnVisibleAfterUnGroup?: boolean;
  
  // Row Dragging
  suppressMoveWhenRowDragging?: boolean;
  
  // Sidebar
  sideBar?: boolean | any; // Can be boolean or sidebar config object
  suppressMenuHide?: boolean;
  
  // Status Bar
  statusBar?: boolean | any; // Can be boolean or statusBar config object
  enableStatusBar?: boolean; // Legacy option
  
  // Status Bar Panel Controls (not direct AG-Grid options, used to build statusBar config)
  statusBarPanelTotalAndFiltered?: boolean;
  statusBarPanelTotalRows?: boolean;
  statusBarPanelFilteredRows?: boolean;
  statusBarPanelSelectedRows?: boolean;
  statusBarPanelAggregation?: boolean;
  
  // Other
  tooltipShowDelay?: number;
  tooltipHideDelay?: number;
  tooltipMouseTrack?: boolean;
  popupParent?: HTMLElement | null;
  
  // UI Preferences (not AG-Grid options but saved with them)
  font?: string;
}

export interface GridOptionsSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  options: GridOptionField[];
}

export interface GridOptionField {
  key: keyof GridOptionsConfig | string; // Allow string for future options
  label: string;
  type: 'number' | 'boolean' | 'select' | 'multiselect';
  description?: string;
  defaultValue?: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: any; label: string }[];
  unit?: string;
}