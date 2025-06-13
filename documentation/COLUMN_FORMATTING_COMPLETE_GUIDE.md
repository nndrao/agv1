# Column Formatting Dialog - Complete Feature Documentation

## Table of Contents
1. [Overview](#overview)
2. [Dialog Structure](#dialog-structure)
3. [Header Section](#header-section)
4. [Tab System](#tab-system)
5. [Styling Tab](#styling-tab)
6. [Format Tab](#format-tab)
7. [General Tab](#general-tab)
8. [Filter Tab](#filter-tab)
9. [Editor Tab](#editor-tab)
10. [Template System](#template-system)
11. [Helper Components](#helper-components)
12. [State Management](#state-management)
13. [Keyboard Shortcuts](#keyboard-shortcuts)

## Overview

The Column Formatting Dialog is a floating, draggable ribbon interface that provides comprehensive column customization capabilities for AG-Grid. It appears when users right-click on a column header and select "Format Column" or through the toolbar's "Customize Columns" option.

### Key Features
- Multi-column selection and bulk editing
- Real-time preview of changes
- Template system for saving and applying configurations
- Undo/redo functionality (planned)
- Profile integration for persistent settings

## Dialog Structure

### Main Container (FloatingRibbonUI)
- **Position**: Draggable, remembers last position in localStorage
- **Dimensions**: 900px width, 90vw max-width
- **Z-index**: 50 (always on top)
- **Border**: 2px border with rounded corners
- **Shadow**: Box shadow for depth perception

### Layout Rows
1. **Header Row** (60px height)
2. **Tab Strip Row** (40px height)
3. **Content Area** (variable height, ~400px)

## Header Section

### Components

#### 1. Column Selector (ColumnSelectorTable)
- **Location**: Left side of header
- **Type**: Dropdown with multi-select table
- **Features**:
  - Search box for filtering columns
  - Column type filter (All/Text/Numeric/Date/Boolean)
  - Visibility filter (All/Visible/Hidden)
  - Select All/Deselect All buttons
  - Bulk selection by type
  - Shows column count badge
  - Visual indicators:
    - Checkboxes for selection
    - Eye icon for visibility status
    - Type icons (text/number/calendar/checkbox)
    - Fixed columns show lock icon

#### 2. Action Buttons
- **Apply Button**:
  - Location: Right side
  - Color: Primary (blue)
  - Behavior: Applies all pending changes to grid
  - Shows change count if changes exist
  - Disabled when no changes pending

- **Reset Button**:
  - Location: Next to Apply
  - Type: Ghost button
  - Icon: Undo icon
  - Behavior: Reverts all pending changes
  - Only visible when changes exist

- **Close Button**:
  - Location: Far right
  - Icon: X
  - Behavior: Closes dialog (prompts if unsaved changes)

#### 3. Template Controls (SimpleTemplateControls)
- **Save as Template** (single column only):
  - Icon: Save
  - Opens simple save dialog
  - Saves all modified properties

- **Templates Dropdown**:
  - Icon: Layers
  - Shows available templates
  - Multi-select with checkboxes
  - Shows property count per template
  - Delete option per template

## Tab System

### Available Tabs
1. **Styling** - Visual appearance and layout
2. **Format** - Value formatting and display
3. **General** - Basic column properties
4. **Filter** - Filtering configuration
5. **Editor** - Cell editing settings

### Tab Behavior
- Active tab highlighted with primary color
- Smooth transition between tabs
- Tab state preserved during session
- Disabled tabs shown in gray (based on column type)

## Styling Tab

### Layout: 3 Columns

#### Column 1: Cell/Header Toggle & Preview
- **Style Target Toggle**:
  - Button Group: "CELLS" | "HEADER"
  - Affects which properties are shown/edited
  - Visual feedback with active state

- **Preview Section**:
  - Live preview of cell/header appearance
  - Shows sample data
  - Updates in real-time
  - Respects theme (light/dark)

#### Column 2: Text Styling

##### Font Section
- **Font Family Dropdown**:
  - Options: Inter, Roboto, Arial, Helvetica, Georgia, JetBrains Mono
  - Default: Inter
  - Applies to: Cell content or header text

- **Font Weight Dropdown**:
  - Options: Light (300), Regular (400), Medium (500), Semibold (600), Bold (700)
  - Width: Flexible
  
- **Font Size Dropdown**:
  - Options: 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32
  - Width: 48px
  - Default: Based on theme

##### Text Style Toggles
- **Bold** (B icon):
  - Size: 26x26px
  - Toggle behavior
  - Updates font-weight to 700

- **Italic** (I icon):
  - Size: 26x26px
  - Toggle behavior
  - Sets font-style: italic

- **Underline** (U icon):
  - Size: 26x26px
  - Toggle behavior
  - Sets text-decoration: underline

##### Alignment Section
- **Horizontal Alignment**:
  - Toggle group (single selection)
  - Options: Left | Center | Right
  - Icons: AlignLeft, AlignCenter, AlignRight
  - Updates cellClass with Tailwind classes

- **Vertical Alignment** (Cells only):
  - Toggle group (single selection)
  - Options: Top | Middle | Bottom
  - Icons: AlignVerticalJustifyStart/Center/End
  - Updates cellStyle display and alignItems

#### Column 3: Colors & Text Options

##### Color Controls
- **Text Color**:
  - Icon: Type (T)
  - Color picker + hex input
  - Default: Theme-based (#000000 light, #FFFFFF dark)
  - Live preview update

- **Background Color**:
  - Icon: PaintBucket
  - Color picker + hex input
  - Default: Transparent or theme background
  - Affects cell/header background

##### Text Options (Conditional)
- **For Headers**:
  - Wrap Text toggle switch
  - Auto Height toggle switch
  
- **For Cells**:
  - Wrap Text toggle switch
  - Auto Height toggle switch

#### Column 4: Borders
- **Border Styles Grid** (3x3):
  - Top row: Top-left, Top, Top-right
  - Middle row: Left, All borders, Right
  - Bottom row: Bottom-left, Bottom, Bottom-right
  - Each button 24x24px
  - Visual feedback on hover/active

- **Border Style Dropdown**:
  - Options: None, Solid, Dashed, Dotted
  - Default: Solid
  - Width: Full

- **Border Width Slider**:
  - Range: 0-5px
  - Step: 1px
  - Shows value label
  - Default: 1px

- **Border Color**:
  - Color picker + hex input
  - Default: #E5E7EB (border color)
  - Preview updates immediately

#### Column 5: Size & Padding

##### Padding Controls
- **Padding Presets**:
  - Grid of 9 options (3x3)
  - Visual representations of padding amounts
  - Quick selection for common patterns

- **Individual Padding Inputs**:
  - Top, Right, Bottom, Left
  - Number inputs with px suffix
  - Sync toggle to link all values
  - Range: 0-50px

##### Size Controls (Cells only)
- **Row Height**:
  - Number input
  - Range: 20-200px
  - Default: Auto
  - Unit: px

## Format Tab

### Layout: 2 Main Sections

#### Left Section: Format Categories
- **Category Buttons** (2x3 grid):
  1. **Numbers**: Hash icon, number formatting
  2. **Currency**: DollarSign icon, currency formats
  3. **Percentage**: Percent icon, percentage display
  4. **Date/Time**: Calendar icon, date formats
  5. **Text**: Type icon, text formatting
  6. **Custom**: Code icon, custom patterns

#### Right Section: Format Options

##### For Numbers Category
- **Decimal Places**: 
  - Slider: 0-10
  - Default: 2
  - Live preview update

- **Thousands Separator**:
  - Toggle switch
  - Default: On
  - Adds commas to large numbers

- **Negative Numbers**:
  - Dropdown options:
    - -1,234.56 (default)
    - (1,234.56) parentheses
    - Red color variants

- **Format Presets**:
  - List of common formats
  - Click to apply
  - Shows example output

##### For Currency Category
- **Currency Symbol**:
  - Dropdown: $, €, £, ¥, ₹, etc.
  - Position: Before/After toggle

- **Decimal Places**: Same as numbers
- **Thousands Separator**: Same as numbers
- **Negative Format**: Currency-specific options

##### For Percentage Category
- **Decimal Places**: 0-10
- **Multiply by 100**: Toggle (default: on)
- **Symbol Position**: Before/After

##### For Date/Time Category
- **Format Presets**:
  - Short date (MM/DD/YYYY)
  - Long date (Month DD, YYYY)
  - ISO format (YYYY-MM-DD)
  - Time formats (12/24 hour)
  - Custom combinations

##### For Text Category
- **Text Transform**:
  - None, Uppercase, Lowercase, Capitalize
  
- **Truncate Options**:
  - Max length input
  - Ellipsis position: End/Middle/Start

##### For Custom Category
- **Pattern Input**:
  - Text field for Excel-style format strings
  - Examples shown below
  - Validation feedback

#### Conditional Formatting Section
- **"Add Conditional Format" Button**:
  - Opens rule builder dialog
  - Supports multiple rules
  - Rule types:
    - Cell value conditions
    - Color scales
    - Data bars
    - Icon sets

## General Tab

### Layout: 2 Columns

#### Column 1: Basic Properties

##### Display Settings
- **Column Header**:
  - Text input
  - Placeholder: Current field name
  - Updates headerName property

- **Column Type**:
  - Dropdown: Text, Numeric, Date, Boolean
  - Affects available options in other tabs
  - Auto-detected but overridable

##### Visibility & Position
- **Initially Hide**:
  - Checkbox
  - Hides column on load
  - Can be shown via column menu

- **Pin Column**:
  - Dropdown: None, Left, Right
  - Pinned columns don't scroll
  - Visual indicator in grid

- **Lock Position**:
  - Checkbox
  - Prevents column reordering
  - Shows lock icon

- **Lock Visible**:
  - Checkbox
  - Prevents hiding via column menu

#### Column 2: Sizing

##### Width Controls
- **Width**:
  - Number input
  - Unit: px
  - Range: 20-2000
  - Default: Auto

- **Min Width**:
  - Number input
  - Prevents resize below value
  - Default: 50px

- **Max Width**:
  - Number input
  - Prevents resize above value
  - Default: None

##### Behavior Options
- **Auto-size**:
  - Button: "Fit Content"
  - Calculates optimal width
  - One-time action

- **Resizable**:
  - Checkbox
  - Default: On
  - Allows manual column resize

- **Sortable**:
  - Checkbox
  - Default: On
  - Enables column sorting

- **Enable Floating Filter**:
  - Checkbox
  - Shows filter below header
  - Quick filter access

## Filter Tab

### Layout: Tabbed Sub-sections

#### Sub-tabs
1. **General** - Basic filter settings
2. **Advanced** - Complex configurations
3. **Custom** - Custom filter components

#### General Sub-tab

##### Filter Type
- **Filter Dropdown**:
  - Options based on column type:
    - Text: Text, Set
    - Number: Number, Set
    - Date: Date, Set
    - Boolean: Boolean
  - None option to disable

##### Quick Filter
- **Include in Quick Filter**:
  - Checkbox
  - Column participates in global search
  - Default: On

- **Case Sensitive**:
  - Checkbox (text filters only)
  - Default: Off

##### Default Filter
- **Default Operator**:
  - Dropdown varies by type
  - Text: Contains, Equals, Starts With, etc.
  - Number: Equals, Greater Than, Less Than, etc.

- **Default Value**:
  - Input field
  - Pre-fills filter on load

#### Advanced Sub-tab

##### Filter Parameters
- **Debounce Time**:
  - Number input (ms)
  - Delays filter execution
  - Default: 200ms

- **Apply Button**:
  - Checkbox
  - Shows Apply button in filter
  - Default: Off (instant filter)

- **Clear Button**:
  - Checkbox
  - Shows Clear button
  - Default: On

##### Number Filter Options
- **In Range Inclusive**:
  - Checkbox
  - Includes range boundaries
  - Default: On

- **Allow Empty**:
  - Checkbox
  - Empty values pass filter
  - Default: Off

##### Text Filter Options
- **Filter Options**:
  - Multi-select checkboxes
  - Available operations to show
  - Default: All enabled

- **Text Formatter**:
  - Lowercase conversion option
  - Trim whitespace option

## Editor Tab

### Layout: 2 Columns

#### Column 1: Editor Settings

##### Enable Editing
- **Editable**:
  - Master toggle switch
  - Enables/disables all editing
  - Default: Off

##### Editor Type
- **Cell Editor**:
  - Dropdown options:
    - Text (default)
    - Number
    - Date
    - Select/Dropdown
    - Large Text (textarea)
    - Rich Select
  - Type-specific options appear below

##### Edit Behavior
- **Single Click Edit**:
  - Checkbox
  - Default: Off (double-click)
  - Speeds up editing

- **Edit on Typing**:
  - Checkbox
  - Start editing on keypress
  - Default: On

- **Tab to Next Cell**:
  - Checkbox
  - Tab key navigation
  - Default: On

#### Column 2: Editor-Specific Options

##### For Text Editor
- **Max Length**:
  - Number input
  - Character limit
  - Shows counter

##### For Number Editor
- **Min Value**:
  - Number input
  - Validation boundary

- **Max Value**:
  - Number input
  - Validation boundary

- **Step**:
  - Number input
  - Increment/decrement amount
  - Default: 1

- **Precision**:
  - Number input
  - Decimal places
  - Default: 2

##### For Select Editor
- **Options Source**:
  - Static list
  - Dynamic from data
  - API endpoint

- **Options List**:
  - Add/remove/reorder items
  - Value and display text
  - Default selection

##### For Date Editor
- **Date Format**:
  - Format string
  - Min/Max date
  - Disable weekends option
  - Disable specific dates

##### Validation
- **Required Field**:
  - Checkbox
  - Shows error if empty

- **Validation Rules**:
  - Add custom validators
  - Error messages
  - Visual feedback

## Template System

### Components

#### 1. Template Selector (Main Dropdown)
- **Features**:
  - Categorized templates (Recent, Default, Custom)
  - Search functionality
  - Preview on hover
  - Property count badges
  - Multi-select for bulk apply

#### 2. Save Template Dialog (Simple)
- **Fields**:
  - Template Name (required)
  - Description (optional)
- **Behavior**:
  - Saves all modified properties
  - No property selection needed
  - Validates unique names

#### 3. Template Management
- **Operations**:
  - Apply (single or multiple)
  - Delete (with confirmation)
  - Export/Import (JSON format)
  - Duplicate template
  - Edit template properties

### Default Templates
1. **Currency Format**:
   - Right alignment
   - $ prefix
   - 2 decimal places
   - Thousands separator
   - Number filter

2. **Percentage Format**:
   - Center alignment
   - % suffix
   - 2 decimal places
   - Number filter

3. **Date Format**:
   - MM/DD/YYYY format
   - Date filter
   - Date editor

4. **Editable Text**:
   - Text editor enabled
   - Single-click edit
   - Text filter with floating filter

5. **Read-only Locked**:
   - Non-editable
   - Position locked
   - Gray background
   - Left pinned

6. **Wrapped Text**:
   - Text wrapping enabled
   - Auto height
   - Large text editor

## Helper Components

### 1. MixedValueInput
- **Purpose**: Handles multi-column editing with different values
- **Features**:
  - Shows "Mixed" placeholder
  - Checkbox to apply same value
  - Preserves individual values until explicitly changed

### 2. ThreeStateCheckbox
- **States**: Checked, Unchecked, Indeterminate
- **Use**: Multi-column boolean properties
- **Visual**: Different icons per state

### 3. CustomizationBadges
- **Shows**: Active customizations as badges
- **Categories**: Styling, Formatting, Filters, etc.
- **Behavior**: Click to jump to relevant tab

### 4. CollapsibleSection
- **Purpose**: Organize UI sections
- **Features**: 
  - Expand/collapse animation
  - Remember state
  - Section count badges

### 5. AlignmentIconPicker
- **Type**: Icon-based selector
- **Options**: 9-point alignment grid
- **Visual**: Highlighted selection

### 6. FormatWizard
- **Purpose**: Guide users through formatting
- **Steps**: Category → Options → Preview → Apply
- **Features**: Back/Next navigation

## State Management

### Store Structure (columnFormatting.store.ts)
```typescript
{
  // UI State
  open: boolean
  activeTab: string
  selectedColumns: Set<string>
  
  // Data State  
  columnDefinitions: Map<string, ColDef>
  columnState: Map<string, ColumnState>
  pendingChanges: Map<string, Partial<ColDef>>
  
  // Filter State
  searchTerm: string
  visibilityFilter: 'all' | 'visible' | 'hidden'
  cellDataTypeFilter: string
  
  // Actions
  updateBulkProperty(property, value)
  updateBulkProperties(properties)
  applyChanges()
  resetChanges()
}
```

### Change Tracking
- **Pending Changes**: Stored separately from actual column definitions
- **Bulk Operations**: Apply to all selected columns
- **Validation**: Type checking and bounds validation
- **Undo/Redo**: Command pattern for reversibility

## Keyboard Shortcuts

### Global
- **Escape**: Close dialog
- **Ctrl/Cmd + Enter**: Apply changes
- **Ctrl/Cmd + Z**: Undo (planned)
- **Ctrl/Cmd + Shift + Z**: Redo (planned)

### Navigation
- **Tab**: Next control
- **Shift + Tab**: Previous control
- **Arrow Keys**: Navigate in grids/lists

### Selection
- **Ctrl/Cmd + A**: Select all columns
- **Ctrl/Cmd + Click**: Toggle column selection
- **Shift + Click**: Range selection

## Performance Optimizations

### Rendering
- **Virtualization**: Column list uses virtual scrolling
- **Memoization**: Heavy components use React.memo
- **Debouncing**: Input changes debounced 200ms
- **Lazy Loading**: Tabs load on demand

### State Updates
- **Batch Updates**: Multiple properties update together
- **Shallow Comparison**: Optimized re-render checks
- **Local State**: Preview uses local state before committing

### Memory
- **Cleanup**: Event listeners removed on unmount
- **WeakMap**: For component references
- **Garbage Collection**: Proper cleanup of closures

## Accessibility

### ARIA Labels
- All interactive elements have proper labels
- Role attributes for custom components
- Live regions for status updates

### Keyboard Navigation
- Full keyboard support
- Focus trap within dialog
- Visible focus indicators

### Screen Reader Support
- Descriptive text for icons
- Status announcements
- Semantic HTML structure

## AG-Grid Column Definition Properties Modified

This section documents all AG-Grid `ColDef` properties that can be modified through the Column Formatting dialog, organized by tab.

### Styling Tab Properties

#### Cell Styling Properties
- **cellClass**: `string | string[]`
  - Modified by: Alignment controls, custom CSS classes
  - Example values: `'text-right'`, `'text-center'`, `'ag-currency-cell'`
  
- **cellStyle**: `CellStyle | ((params: CellClassParams) => CellStyle)`
  - Modified by: Font, colors, padding, borders
  - Properties set:
    - `fontFamily`: Font dropdown selection
    - `fontSize`: Size dropdown (8px-32px)
    - `fontWeight`: Weight dropdown (300-700) or bold toggle
    - `fontStyle`: 'italic' or normal
    - `textDecoration`: 'underline' or none
    - `color`: Text color picker
    - `backgroundColor`: Fill color picker
    - `padding`: Individual or synced values (0-50px)
    - `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`
    - `border`: Combined border property
    - `borderTop`, `borderRight`, `borderBottom`, `borderLeft`
    - `borderStyle`: solid, dashed, dotted
    - `borderWidth`: 0-5px
    - `borderColor`: Hex color value
    - `display`: 'flex' (for vertical alignment)
    - `alignItems`: 'flex-start', 'center', 'flex-end'
    - `justifyContent`: 'flex-start', 'center', 'flex-end'

#### Header Styling Properties
- **headerClass**: `string | string[]`
  - Modified by: Alignment controls, custom CSS classes
  - Example values: `'text-center'`, `'header-bold'`

- **headerStyle**: `HeaderStyle | ((params: HeaderClassParams) => HeaderStyle)`
  - Modified by: Same properties as cellStyle but for headers
  - Special handling for floating filter headers

#### Text Wrapping Properties
- **wrapText**: `boolean`
  - Modified by: Wrap text toggle (cells)
  - Default: false
  - Enables text wrapping in cells

- **autoHeight**: `boolean`
  - Modified by: Auto height toggle (cells)
  - Default: false
  - Automatically adjusts row height

- **wrapHeaderText**: `boolean`
  - Modified by: Wrap text toggle (headers)
  - Default: false
  - Enables text wrapping in headers

- **autoHeaderHeight**: `boolean`
  - Modified by: Auto height toggle (headers)
  - Default: false
  - Automatically adjusts header height

### Format Tab Properties

#### Value Formatting
- **valueFormatter**: `((params: ValueFormatterParams) => string) | string`
  - Modified by: Format category selection and options
  - Created formatters for:
    - Numbers: `#,##0.00`, `#,##0`, etc.
    - Currency: `$#,##0.00`, `€#,##0.00`, etc.
    - Percentage: `0.00%`, `0%`, etc.
    - Date/Time: `MM/DD/YYYY`, `YYYY-MM-DD`, etc.
    - Custom: User-defined Excel-style format strings
  - Formatter functions include `__formatString` property for persistence

#### Conditional Formatting
- **cellStyle**: `(params: CellClassParams) => CellStyle`
  - Extended by conditional formatting rules
  - Returns different styles based on cell value
  - Includes `__baseStyle` property for base styling

- **cellClass**: `(params: CellClassParams) => string | string[]`
  - Can be function for conditional classes
  - Based on value comparisons

### General Tab Properties

#### Display Properties
- **headerName**: `string`
  - Modified by: Column header input field
  - Default: Field name
  - Display name for column header

- **type**: `string | string[]`
  - Modified by: Column type dropdown
  - Values: 'text', 'numericColumn', 'dateColumn', 'booleanColumn'
  - Affects default behavior and available options

#### Visibility and Position
- **hide**: `boolean`
  - Modified by: Initially hide checkbox
  - Default: false
  - Column hidden on grid initialization

- **pinned**: `boolean | 'left' | 'right' | null`
  - Modified by: Pin column dropdown
  - Values: null (none), 'left', 'right'
  - Pins column to side of grid

- **lockPosition**: `boolean | 'left' | 'right'`
  - Modified by: Lock position checkbox
  - Default: false
  - Prevents column reordering

- **lockVisible**: `boolean`
  - Modified by: Lock visible checkbox
  - Default: false
  - Prevents hiding via column menu

#### Sizing Properties
- **width**: `number`
  - Modified by: Width input
  - Range: 20-2000
  - Unit: pixels

- **minWidth**: `number`
  - Modified by: Min width input
  - Default: 50
  - Minimum resize limit

- **maxWidth**: `number`
  - Modified by: Max width input
  - Default: undefined
  - Maximum resize limit

#### Behavior Properties
- **resizable**: `boolean`
  - Modified by: Resizable checkbox
  - Default: true
  - Allows column width adjustment

- **sortable**: `boolean`
  - Modified by: Sortable checkbox
  - Default: true
  - Enables column sorting

- **floatingFilter**: `boolean`
  - Modified by: Enable floating filter checkbox
  - Default: false
  - Shows filter below header

### Filter Tab Properties

#### Filter Configuration
- **filter**: `boolean | string | IFilterComp`
  - Modified by: Filter type dropdown
  - Values: 
    - Text columns: 'agTextColumnFilter', 'agSetColumnFilter'
    - Number columns: 'agNumberColumnFilter', 'agSetColumnFilter'
    - Date columns: 'agDateColumnFilter', 'agSetColumnFilter'
    - Boolean columns: 'agBooleanColumnFilter'
    - false (to disable)

- **filterParams**: `IFilterParams`
  - Modified by: Various filter options
  - Properties include:
    - `buttons`: ['apply', 'clear', 'reset', 'cancel']
    - `closeOnApply`: boolean
    - `debounceMs`: number (0-1000)
    - `caseSensitive`: boolean (text filters)
    - `textFormatter`: function (text filters)
    - `inRangeInclusive`: boolean (number filters)
    - `includeBlanksInEquals`: boolean
    - `includeBlanksInLessThan`: boolean
    - `includeBlanksInGreaterThan`: boolean
    - `allowedCharPattern`: string (regex)
    - `numberParser`: function
    - `comparator`: function (date filters)

- **floatingFilterComponentParams**: `any`
  - Modified by: Floating filter configuration
  - Passes through to floating filter component

#### Column Menu Options
- **suppressHeaderMenuButton**: `boolean`
  - Modified by: Hide header menu checkbox
  - Default: false
  - Removes menu button from header

- **suppressFiltersToolPanel**: `boolean`
  - Modified by: Hide in filters panel checkbox
  - Default: false
  - Excludes from filter tool panel

### Editor Tab Properties

#### Basic Editing
- **editable**: `boolean | ((params: EditableCallbackParams) => boolean)`
  - Modified by: Editable toggle
  - Default: false
  - Master control for cell editing

- **cellEditor**: `string | ICellEditorComp`
  - Modified by: Cell editor dropdown
  - Values:
    - 'agTextCellEditor' (default)
    - 'agNumberCellEditor'
    - 'agDateCellEditor'
    - 'agSelectCellEditor'
    - 'agRichSelectCellEditor'
    - 'agLargeTextCellEditor'

- **cellEditorParams**: `ICellEditorParams`
  - Modified by: Editor-specific options
  - Text editor params:
    - `maxLength`: number
    - `cols`: number
    - `rows`: number
  - Number editor params:
    - `min`: number
    - `max`: number
    - `precision`: number
    - `step`: number
  - Select editor params:
    - `values`: string[]
    - `valueListGap`: number
    - `valueListMaxHeight`: number
  - Date editor params:
    - `min`: string (date)
    - `max`: string (date)
    - `format`: string

#### Editing Behavior
- **singleClickEdit**: `boolean`
  - Modified by: Single click edit checkbox
  - Default: false
  - Start editing with single click

- **cellEditorPopup**: `boolean`
  - Modified by: Editor popup checkbox
  - Default: false
  - Shows editor in popup

- **stopEditingWhenCellsLoseFocus**: `boolean`
  - Modified by: Stop editing on blur
  - Default: true
  - Configurable per column

### Additional Properties Set by Dialog

#### Metadata Properties (Not AG-Grid Standard)
These are custom properties added for tracking:

- **__customized**: `boolean`
  - Indicates column has been modified
  - Used for visual indicators

- **__templateId**: `string`
  - Tracks applied template
  - Used for template management

- **__lastModified**: `number`
  - Timestamp of last modification
  - Used for conflict resolution

### Property Interactions and Dependencies

#### Style Property Handling
- When both `cellClass` and `cellStyle` are set:
  - Classes applied first
  - Inline styles override class styles
  - Functions evaluated at render time

#### Width Property Priority
1. `width` (if set)
2. `minWidth` (as lower bound)
3. `maxWidth` (as upper bound)
4. Auto-sizing (if triggered)

#### Filter and Editor Conflicts
- `editable: false` overrides all editor settings
- `filter: false` overrides all filter params
- `floatingFilter` requires `filter` to be enabled

#### Conditional Property Application
- Header properties only apply to non-grouped columns
- Some properties ignored based on column type
- Pinned columns ignore certain position properties

## Theme Integration

### Light/Dark Mode
- Automatic theme detection
- CSS variables for colors
- Smooth transitions
- Contrast compliance

### Custom Themes
- Override CSS variables
- Custom color schemes
- Font family changes
- Spacing adjustments

## Error Handling

### Validation
- Input validation with feedback
- Boundary checking
- Type coercion where appropriate

### Error States
- Visual indicators (red borders)
- Error messages below inputs
- Toast notifications for actions

### Recovery
- Graceful degradation
- Fallback values
- Error boundaries