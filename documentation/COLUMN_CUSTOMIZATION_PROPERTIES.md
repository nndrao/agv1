# Column Customization Dialog Properties

This document lists all attributes and nested attributes with their types available in each tab of the column customization dialog.

## 1. General Tab

```typescript
{
  headerName: string              // Column display name
  type: 'text' | 'numeric' | 'date' | 'boolean'  // Data type
  floatingFilter: boolean         // Show floating filter
  filter: string | undefined      // Filter type (e.g., 'agTextColumnFilter')
  editable: boolean              // Enable cell editing
}
```

## 2. Styling Tab

Has two sub-modes: **Cell** and **Header**

```typescript
{
  // Typography
  fontFamily: string             // 'Inter', 'Arial', etc.
  fontSize: string               // '10', '12', '14', etc. (in pixels)
  fontWeight: string             // '300', 'normal', '500', '600', 'bold'
  fontStyle: 'normal' | 'italic'
  textDecoration: string[]       // ['underline', 'line-through']
  
  // Alignment
  textAlign: 'left' | 'center' | 'right' | 'justify'
  verticalAlign: 'top' | 'middle' | 'bottom' | 'stretch'
  
  // Colors
  textColor: string              // Hex color (e.g., '#000000')
  backgroundColor: string        // Hex color
  applyTextColor: boolean        // Toggle to apply/remove text color
  applyBackgroundColor: boolean  // Toggle to apply/remove background
  
  // Borders
  borderWidth: string            // '1', '2', '3', '4' (pixels)
  borderStyle: 'none' | 'solid' | 'dashed' | 'dotted' | 'double'
  borderColor: string            // Hex color
  borderSides: 'all' | 'top' | 'right' | 'bottom' | 'left' | 'none'
  applyBorder: boolean           // Toggle to apply/remove border
  
  // Text Layout
  wrapText: boolean              // Enable text wrapping
  autoHeight: boolean            // Auto-adjust row/header height
  
  // Applied as AG-Grid properties:
  cellStyle: object | function   // For cell styling
  cellClass: string              // CSS class for cell alignment
  headerStyle: object | function // For header styling
  headerClass: string            // CSS class for header alignment
  autoHeaderHeight: boolean      // Auto-adjust header height
  wrapHeaderText: boolean        // Wrap header text
}
```

## 3. Format Tab

```typescript
{
  // Mode selection
  mode: 'standard' | 'custom'
  
  // Standard Format
  selectedStandardFormat: 'number' | 'currency' | 'percentage' | 'date' | 'text'
  decimalPlaces: number          // 0-10
  prefix: string                 // Text before value
  suffix: string                 // Text after value
  currencySymbol: '$' | '€' | '£' | '¥' | 'CHF' | 'R' | '₹' | 'kr'
  multiplyBy100: boolean         // For percentage format
  dateFormat: string             // Date pattern (e.g., 'yyyy-MM-dd')
  useThousandsSeparator: boolean // Format with commas
  useColorForSign: boolean       // Color positive/negative differently
  
  // Custom Format
  manualFormat: string           // Excel-style format string
  selectedCustomFormat: string   // Pre-defined template
  
  // Applied as:
  valueFormatter: function       // AG-Grid value formatter
}
```

## 4. Filter Tab

```typescript
{
  filter: string | undefined     // Filter type
  floatingFilter: boolean        // Show floating filter
  suppressHeaderMenuButton: boolean
  suppressFiltersToolPanel: boolean
  
  filterParams: {
    // Text Filter
    filterOptions: string[]      // ['contains', 'equals', 'startsWith', etc.]
    defaultOption: string
    trimInput: boolean
    caseSensitive: boolean
    debounceMs: number
    
    // Number Filter
    filterOptions: string[]      // ['equals', 'greaterThan', 'lessThan', etc.]
    defaultOption: string
    allowedCharPattern: string   // Regex pattern
    numberParser: function
    includeBlanksInEquals: boolean
    
    // Date Filter
    filterOptions: string[]
    defaultOption: string
    comparator: function
    dateFormat: string
    
    // Set Filter
    suppressMiniFilter: boolean
    suppressSelectAll: boolean
    suppressSorting: boolean
    excelMode: 'windows' | 'mac'
    newRowsAction: 'keep' | 'clear'
    
    // Multi Filter
    filters: Array<{
      filter: string
      title: string
      filterParams: object
    }>
  }
}
```

## 5. Editor Tab

```typescript
{
  editable: boolean              // Must be true for editing
  cellEditor: string | undefined // Editor type
  singleClickEdit: boolean       // Edit on single click
  cellEditorPopup: boolean       // Show in popup
  
  cellEditorParams: {
    // Text Editor
    maxLength: number | undefined
    useFormatter: boolean
    
    // Large Text Editor
    rows: number
    cols: number
    maxLength: number | undefined
    
    // Select/Rich Select Editor
    values: string[]             // Option values
    cellHeight: number           // Rich select only
    searchType: 'fuzzy' | 'text' // Rich select only
    allowTyping: boolean         // Rich select only
    filterList: boolean          // Rich select only
    highlightMatch: boolean      // Rich select only
    
    // Number Editor
    min: number | undefined
    max: number | undefined
    precision: number | undefined
    step: number
    showStepperButtons: boolean
    
    // Date Editor
    min: string                  // Min date
    max: string                  // Max date
    format: string               // Date format
    
    // Checkbox Editor
    checkedValue: any
    uncheckedValue: any
  }
}
```

## Available Filter Types

- `agTextColumnFilter` - Text filtering
- `agNumberColumnFilter` - Number filtering  
- `agDateColumnFilter` - Date filtering
- `agSetColumnFilter` - Select from set of values
- `agBooleanColumnFilter` - Boolean filtering
- `agMultiColumnFilter` - Multiple filter types

## Available Editor Types

- `agTextCellEditor` - Basic text input
- `agLargeTextCellEditor` - Multi-line text input
- `agNumberCellEditor` - Number input with validation
- `agDateCellEditor` - Date picker
- `agSelectCellEditor` - Basic dropdown
- `agRichSelectCellEditor` - Enhanced dropdown with search
- `agCheckboxCellEditor` - Checkbox input

## Store Management

All these properties are managed through the `useColumnFormattingStore` and can be applied to single or multiple selected columns using the `updateBulkProperty` function:

```typescript
updateBulkProperty(property: string, value: any): void
```

The store maintains:
- `columnDefinitions` - Current column configurations
- `pendingChanges` - Uncommitted changes
- `selectedColumns` - Currently selected columns for bulk editing