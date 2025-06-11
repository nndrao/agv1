import { GridOptionsSection } from './types';

export const gridOptionsSections: GridOptionsSection[] = [
  {
    id: 'appearance',
    title: 'Appearance & Layout',
    icon: null as any, // Will be set in component
    options: [
      {
        key: 'headerHeight',
        label: 'Header Height',
        type: 'number',
        description: 'Height of the column headers',
        defaultValue: 40,
        min: 20,
        max: 100,
        step: 5,
        unit: 'px'
      },
      {
        key: 'rowHeight',
        label: 'Row Height',
        type: 'number',
        description: 'Height of the data rows',
        defaultValue: 40,
        min: 20,
        max: 100,
        step: 5,
        unit: 'px'
      },
      {
        key: 'floatingFiltersHeight',
        label: 'Floating Filters Height',
        type: 'number',
        description: 'Height of floating filter row',
        defaultValue: 40,
        min: 20,
        max: 80,
        step: 5,
        unit: 'px'
      },
      {
        key: 'groupHeaderHeight',
        label: 'Group Header Height',
        type: 'number',
        description: 'Height of group headers',
        defaultValue: 40,
        min: 20,
        max: 100,
        step: 5,
        unit: 'px'
      },
      {
        key: 'enableRtl',
        label: 'Right-to-Left Layout',
        type: 'boolean',
        description: 'Enable RTL layout for the grid',
        defaultValue: false
      },
      {
        key: 'domLayout',
        label: 'DOM Layout',
        type: 'select',
        description: 'Control how the grid is sized',
        defaultValue: 'normal',
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'autoHeight', label: 'Auto Height' },
          { value: 'print', label: 'Print' }
        ]
      },
      {
        key: 'font',
        label: 'Font Family',
        type: 'select',
        description: 'Font family for the grid',
        defaultValue: 'monospace',
        options: [
          { value: 'JetBrains Mono', label: 'JetBrains Mono' },
          { value: 'Fira Code', label: 'Fira Code' },
          { value: 'Source Code Pro', label: 'Source Code Pro' },
          { value: 'IBM Plex Mono', label: 'IBM Plex Mono' },
          { value: 'Roboto Mono', label: 'Roboto Mono' },
          { value: 'Monaco', label: 'Monaco' },
          { value: 'Consolas', label: 'Consolas' },
          { value: 'Courier New', label: 'Courier New' },
          { value: 'monospace', label: 'System Monospace' }
        ]
      }
    ]
  },
  {
    id: 'performance',
    title: 'Performance',
    icon: null as any,
    options: [
      {
        key: 'rowBuffer',
        label: 'Row Buffer',
        type: 'number',
        description: 'Number of rows rendered outside visible area',
        defaultValue: 10,
        min: 0,
        max: 50,
        step: 5
      },
      {
        key: 'suppressRowVirtualisation',
        label: 'Disable Row Virtualisation',
        type: 'boolean',
        description: 'Render all rows at once (impacts performance)',
        defaultValue: false
      },
      {
        key: 'suppressColumnVirtualisation',
        label: 'Disable Column Virtualisation',
        type: 'boolean',
        description: 'Render all columns at once (impacts performance)',
        defaultValue: false
      },
      {
        key: 'animateRows',
        label: 'Animate Rows',
        type: 'boolean',
        description: 'Enable row animations',
        defaultValue: true
      }
    ]
  },
  {
    id: 'behavior',
    title: 'Behavior',
    icon: null as any,
    options: [
      {
        key: 'pagination',
        label: 'Enable Pagination',
        type: 'boolean',
        description: 'Show data in pages',
        defaultValue: false
      },
      {
        key: 'paginationPageSize',
        label: 'Page Size',
        type: 'number',
        description: 'Number of rows per page',
        defaultValue: 100,
        min: 10,
        max: 1000,
        step: 10
      },
      {
        key: 'paginationPageSizeSelector',
        label: 'Page Size Selector',
        type: 'multiselect',
        description: 'Options for page size selector',
        defaultValue: [20, 50, 100, 200],
        options: [
          { value: 10, label: '10' },
          { value: 20, label: '20' },
          { value: 50, label: '50' },
          { value: 100, label: '100' },
          { value: 200, label: '200' },
          { value: 500, label: '500' },
          { value: 1000, label: '1000' }
        ]
      },
      {
        key: 'editType',
        label: 'Edit Type',
        type: 'select',
        description: 'How cells are edited',
        defaultValue: null,
        options: [
          { value: null, label: 'Cell Edit' },
          { value: 'fullRow', label: 'Full Row Edit' }
        ]
      },
      {
        key: 'singleClickEdit',
        label: 'Single Click Edit',
        type: 'boolean',
        description: 'Start editing with single click',
        defaultValue: false
      },
      {
        key: 'stopEditingWhenCellsLoseFocus',
        label: 'Stop Editing on Blur',
        type: 'boolean',
        description: 'Stop editing when grid loses focus',
        defaultValue: true
      },
      {
        key: 'enterNavigatesVertically',
        label: 'Enter Navigates Vertically',
        type: 'boolean',
        description: 'Enter key moves to cell below',
        defaultValue: false
      }
    ]
  },
  {
    id: 'selection',
    title: 'Selection',
    icon: null as any,
    options: [
      {
        key: 'rowSelection',
        label: 'Row Selection',
        type: 'select',
        description: 'Row selection mode',
        defaultValue: undefined,
        options: [
          { value: undefined, label: 'Disabled' },
          { value: 'single', label: 'Single' },
          { value: 'multiple', label: 'Multiple' }
        ]
      },
      {
        key: 'suppressRowDeselection',
        label: 'Suppress Row Deselection',
        type: 'boolean',
        description: 'Prevent row deselection',
        defaultValue: false
      },
      {
        key: 'suppressRowClickSelection',
        label: 'Suppress Row Click Selection',
        type: 'boolean',
        description: 'Disable row selection on click',
        defaultValue: false
      },
      {
        key: 'suppressCellFocus',
        label: 'Suppress Cell Focus',
        type: 'boolean',
        description: 'Disable cell focus',
        defaultValue: false
      },
      {
        key: 'enableRangeSelection',
        label: 'Enable Range Selection',
        type: 'boolean',
        description: 'Allow selecting cell ranges',
        defaultValue: false
      },
      {
        key: 'enableRangeHandle',
        label: 'Enable Range Handle',
        type: 'boolean',
        description: 'Show range selection handle',
        defaultValue: false
      },
      {
        key: 'enableFillHandle',
        label: 'Enable Fill Handle',
        type: 'boolean',
        description: 'Show fill handle for copying values',
        defaultValue: false
      }
    ]
  },
  {
    id: 'data',
    title: 'Data Management',
    icon: null as any,
    options: [
      {
        key: 'maintainColumnOrder',
        label: 'Maintain Column Order',
        type: 'boolean',
        description: 'Keep column order when updating columns',
        defaultValue: false
      },
      {
        key: 'deltaSort',
        label: 'Delta Sort',
        type: 'boolean',
        description: 'Only re-sort changed rows',
        defaultValue: false
      },
      {
        key: 'accentedSort',
        label: 'Accented Sort',
        type: 'boolean',
        description: 'Consider accents when sorting',
        defaultValue: false
      },
      {
        key: 'suppressMultiSort',
        label: 'Suppress Multi Sort',
        type: 'boolean',
        description: 'Disable sorting by multiple columns',
        defaultValue: false
      },
      {
        key: 'alwaysMultiSort',
        label: 'Always Multi Sort',
        type: 'boolean',
        description: 'Always sort by multiple columns',
        defaultValue: false
      },
      {
        key: 'suppressMovableColumns',
        label: 'Suppress Movable Columns',
        type: 'boolean',
        description: 'Prevent column reordering',
        defaultValue: false
      },
      {
        key: 'suppressDragLeaveHidesColumns',
        label: 'Suppress Drag Leave Hides',
        type: 'boolean',
        description: 'Prevent hiding columns by dragging out',
        defaultValue: false
      }
    ]
  },
  {
    id: 'clipboard',
    title: 'Clipboard',
    icon: null as any,
    options: [
      {
        key: 'copyHeadersToClipboard',
        label: 'Copy Headers',
        type: 'boolean',
        description: 'Include headers when copying',
        defaultValue: true
      },
      {
        key: 'copyGroupHeadersToClipboard',
        label: 'Copy Group Headers',
        type: 'boolean',
        description: 'Include group headers when copying',
        defaultValue: false
      },
      {
        key: 'clipboardDelimiter',
        label: 'Clipboard Delimiter',
        type: 'select',
        description: 'Delimiter for clipboard data',
        defaultValue: '\t',
        options: [
          { value: '\t', label: 'Tab' },
          { value: ',', label: 'Comma' },
          { value: ';', label: 'Semicolon' },
          { value: '|', label: 'Pipe' }
        ]
      },
      {
        key: 'suppressCopyRowsToClipboard',
        label: 'Suppress Copy Rows',
        type: 'boolean',
        description: 'Disable copying rows to clipboard',
        defaultValue: false
      },
      {
        key: 'suppressCopySingleCellRanges',
        label: 'Suppress Copy Single Cell',
        type: 'boolean',
        description: 'Disable copying single cell ranges',
        defaultValue: false
      }
    ]
  },
  {
    id: 'interaction',
    title: 'Interaction',
    icon: null as any,
    options: [
      {
        key: 'rowDragManaged',
        label: 'Row Drag Managed',
        type: 'boolean',
        description: 'Enable managed row dragging',
        defaultValue: false
      },
      {
        key: 'rowDragEntireRow',
        label: 'Drag Entire Row',
        type: 'boolean',
        description: 'Drag using entire row',
        defaultValue: false
      },
      {
        key: 'rowDragMultiRow',
        label: 'Multi Row Drag',
        type: 'boolean',
        description: 'Enable dragging multiple rows',
        defaultValue: false
      },
      {
        key: 'suppressMoveWhenRowDragging',
        label: 'Suppress Move When Dragging',
        type: 'boolean',
        description: 'Prevent row movement while dragging',
        defaultValue: false
      }
    ]
  },
  {
    id: 'grouping',
    title: 'Row Grouping',
    icon: null as any,
    options: [
      {
        key: 'groupDefaultExpanded',
        label: 'Default Expanded Level',
        type: 'number',
        description: 'Number of group levels expanded by default (-1 for all)',
        defaultValue: 0,
        min: -1,
        max: 10,
        step: 1
      },
      {
        key: 'groupMaintainOrder',
        label: 'Maintain Group Order',
        type: 'boolean',
        description: 'Keep original order within groups',
        defaultValue: false
      },
      {
        key: 'groupSelectsChildren',
        label: 'Group Selects Children',
        type: 'boolean',
        description: 'Selecting group selects all children',
        defaultValue: false
      },
      {
        key: 'groupIncludeFooter',
        label: 'Include Group Footer',
        type: 'boolean',
        description: 'Show footer for each group',
        defaultValue: false
      },
      {
        key: 'groupIncludeTotalFooter',
        label: 'Include Total Footer',
        type: 'boolean',
        description: 'Show total footer for all groups',
        defaultValue: false
      },
      {
        key: 'groupSuppressAutoColumn',
        label: 'Suppress Auto Column',
        type: 'boolean',
        description: 'Hide the auto-generated group column',
        defaultValue: false
      },
      {
        key: 'groupRemoveSingleChildren',
        label: 'Remove Single Children',
        type: 'boolean',
        description: 'Remove groups with only one child',
        defaultValue: false
      },
      {
        key: 'groupRemoveLowestSingleChildren',
        label: 'Remove Lowest Single Children',
        type: 'boolean',
        description: 'Remove single children at lowest level only',
        defaultValue: false
      },
      {
        key: 'groupDisplayType',
        label: 'Group Display Type',
        type: 'select',
        description: 'How groups are displayed',
        defaultValue: 'singleColumn',
        options: [
          { value: 'singleColumn', label: 'Single Column' },
          { value: 'multipleColumns', label: 'Multiple Columns' },
          { value: 'groupRows', label: 'Group Rows' },
          { value: 'custom', label: 'Custom' }
        ]
      },
      {
        key: 'groupRowsSticky',
        label: 'Sticky Group Rows',
        type: 'boolean',
        description: 'Keep group rows visible when scrolling',
        defaultValue: false
      },
      {
        key: 'rowGroupPanelShow',
        label: 'Row Group Panel',
        type: 'select',
        description: 'Show panel for managing row groups',
        defaultValue: 'never',
        options: [
          { value: 'never', label: 'Never' },
          { value: 'always', label: 'Always' },
          { value: 'onlyWhenGrouping', label: 'Only When Grouping' }
        ]
      },
      {
        key: 'suppressRowGroupHidesColumns',
        label: 'Suppress Hide Grouped Columns',
        type: 'boolean',
        description: 'Prevent hiding columns used for grouping',
        defaultValue: false
      },
      {
        key: 'suppressMakeColumnVisibleAfterUnGroup',
        label: 'Keep Hidden After Ungroup',
        type: 'boolean',
        description: 'Keep columns hidden after ungrouping',
        defaultValue: false
      }
    ]
  },
  {
    id: 'sidebar',
    title: 'Sidebar & Panels',
    icon: null as any,
    options: [
      {
        key: 'sideBar',
        label: 'Show Sidebar',
        type: 'boolean',
        description: 'Show or hide the sidebar',
        defaultValue: true
      },
      {
        key: 'suppressMenuHide',
        label: 'Keep Sidebar Open',
        type: 'boolean',
        description: 'Prevent sidebar from closing automatically',
        defaultValue: false
      }
    ]
  },
  {
    id: 'statusbar',
    title: 'Status Bar',
    icon: null as any,
    options: [
      {
        key: 'statusBar',
        label: 'Show Status Bar',
        type: 'boolean',
        description: 'Show status bar at bottom of grid',
        defaultValue: false
      },
      {
        key: 'statusBarPanelTotalAndFiltered',
        label: 'Total & Filtered Count',
        type: 'boolean',
        description: 'Show total and filtered row count',
        defaultValue: true
      },
      {
        key: 'statusBarPanelTotalRows',
        label: 'Total Row Count',
        type: 'boolean',
        description: 'Show total row count',
        defaultValue: false
      },
      {
        key: 'statusBarPanelFilteredRows',
        label: 'Filtered Row Count',
        type: 'boolean',
        description: 'Show filtered row count',
        defaultValue: false
      },
      {
        key: 'statusBarPanelSelectedRows',
        label: 'Selected Row Count',
        type: 'boolean',
        description: 'Show selected row count',
        defaultValue: true
      },
      {
        key: 'statusBarPanelAggregation',
        label: 'Aggregation Panel',
        type: 'boolean',
        description: 'Show sum/avg/min/max/count for selected cells',
        defaultValue: true
      }
    ]
  },
  {
    id: 'other',
    title: 'Other',
    icon: null as any,
    options: [
      {
        key: 'tooltipShowDelay',
        label: 'Tooltip Show Delay',
        type: 'number',
        description: 'Delay before showing tooltip (ms)',
        defaultValue: 500,
        min: 0,
        max: 2000,
        step: 100,
        unit: 'ms'
      },
      {
        key: 'tooltipHideDelay',
        label: 'Tooltip Hide Delay',
        type: 'number',
        description: 'Delay before hiding tooltip (ms)',
        defaultValue: 10000,
        min: 0,
        max: 20000,
        step: 1000,
        unit: 'ms'
      },
      {
        key: 'tooltipMouseTrack',
        label: 'Tooltip Mouse Track',
        type: 'boolean',
        description: 'Tooltip follows mouse cursor',
        defaultValue: false
      }
    ]
  }
];