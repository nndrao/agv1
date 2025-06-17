# Column Formatting Dialog - Implementation Specification

## Overview

The Column Formatting Dialog is implemented as a floating, draggable ribbon UI (900px × auto height) that provides comprehensive column customization through 5 tabs. It uses a modern, compact design with a focus on usability and performance.

## Architecture

### Component Structure
```
ColumnFormattingDialog (Entry Component)
└── FloatingRibbonUI (Main Container)
    ├── CustomHeader (Row 1: Header with column selector)
    ├── CustomTabs (Row 2: Tab navigation)
    └── CustomContent (Row 3: Dynamic tab content)
        ├── GeneralCustomContent
        ├── StylingCustomContent
        ├── FormatCustomContent
        ├── FilterCustomContent
        └── EditorCustomContent
```

### State Management
- Uses Zustand store (`columnFormatting.store`)
- Manages column definitions, selections, and pending changes
- Handles apply/reset operations
- Maintains tab state and format configurations

## Dialog Specifications

### Container (FloatingRibbonUI)
- **Dimensions**: 900px width, auto height (max 90vw)
- **Position**: Draggable, saves position to localStorage
- **Style**: Rounded corners, shadow, border
- **Z-index**: 50 (floating above content)

### Header Row
- **Height**: 40px
- **Components**:
  - Multi-select column dropdown (left)
  - Selected count badge
  - Action buttons: Apply, Reset, Clear Selected
  - Close button (right)
- **Features**:
  - Drag handle for moving dialog
  - Shows pending changes indicator

### Tab Strip
- **Height**: 32px
- **Tabs**: General, Styling, Format, Filter, Editor
- **Icons**: Each tab has an associated Lucide icon
- **Active state**: Highlighted with primary color

## Tab 1: General

### Purpose
Basic column configuration and metadata settings.

### Features
1. **Header Name**
   - Text input field
   - Disabled for multi-column selection
   - Updates column headerName property

2. **Column Type Selection**
   - Dropdown with options: Text, Numeric, Date, Boolean
   - Affects available formatting options in other tabs
   - Updates column data type metadata

3. **Quick Toggles** (Compact strip)
   - **Floating Filter**: Enable/disable floating filter row
   - **Enable Filter**: Toggle column filtering capability
   - **Editable**: Allow/disable cell editing
   - All toggles show mixed state for multi-column with different values

4. **Advanced Settings**
   - Button placeholder for future advanced options
   - Currently non-functional

### Layout
```
┌─────────────────────────────────────────────┐
│ Header Name: [___________] Type: [Text ▼]  │
├─────────────────────────────────────────────┤
│ [√] Floating Filter  [√] Filter  [ ] Edit  │
│                          [Advanced Settings] │
└─────────────────────────────────────────────┘
```

## Tab 2: Styling

### Purpose
Comprehensive visual customization for cells and headers.

### Features

#### 1. Target Selection
- Toggle between Cell and Header styling
- Separate configurations maintained for each

#### 2. Typography Controls
- **Font Family**: Dropdown with web-safe fonts
  - Options: Default, Arial, Helvetica, Times New Roman, Georgia, Courier New, Verdana, Tahoma, Trebuchet MS, Impact, Comic Sans MS
- **Font Size**: Range 10px-24px
- **Font Weight**: 100-900 (Light to Bold)
- **Font Style Toggles**: Bold, Italic, Underline, Strikethrough
- **Text Alignment**: Left, Center, Right, Justify
- **Vertical Alignment**: Top, Middle, Bottom, Stretch

#### 3. Color Controls
- **Text Color**:
  - Enable/disable switch
  - Color picker with preset colors
  - Custom color input
- **Background Color**:
  - Enable/disable switch
  - Color picker with preset colors
  - Custom color input

#### 4. Border Controls
- **Enable/disable switch**
- **Border Sides**: Multi-select (top, right, bottom, left)
- **Border Style**: solid, dashed, dotted, double
- **Border Width**: 1-4px
- **Border Color**: Color picker

#### 5. Text Options
- **Wrap Text**: Enable text wrapping
- **Auto Height**: Adjust row height to content

#### 6. Live Preview
- Shows both cell and header preview
- Real-time updates as settings change
- Uses actual column data for realistic preview

### Layout
```
┌─────────────────────────────────────────────────────┐
│ Target: [Cell|Header]                    Preview    │
├─────────────────────────────────────────────────────┤
│ Font: [Arial▼] Size:[14▼] Weight:[400▼] │ Cell     │
│ [B][I][U][S] Align:[◀][■][▶][≡]        │ [Sample] │
│                                          │          │
│ [√] Text Color [■]_____ Background [■]_____│ Header│
│ [√] Border [▢▢▢▢] Style:[solid▼] W:[1▼] │ [Column]│
│                                          │          │
│ [ ] Wrap Text  [ ] Auto Height  [Reset] │          │
└─────────────────────────────────────────────────────┘
```

## Tab 3: Format

### Purpose
Data formatting with Excel-like syntax and templates.

### Features

#### 1. Format Mode Toggle
- **Standard**: Pre-defined format types
- **Custom**: Manual format strings and templates

#### 2. Standard Format Types

**Number Format**:
- Decimal places (0-10)
- Prefix/suffix text inputs
- Thousands separator toggle
- Negative number color (red)
- Positive number color (green)

**Currency Format**:
- Currency symbol selector (20+ currencies)
- Symbol position (before/after)
- Decimal places
- Accounting format option
- Negative handling (parentheses, minus)

**Percentage Format**:
- Decimal places
- Multiply by 100 option
- Show % symbol toggle

**Date Format**:
- Format presets: Short, Long, ISO, Relative
- Custom pattern support
- Timezone handling

**Text Format**:
- Case transformation
- Truncation options

#### 3. Custom Format Mode

**Template Selector**:
- Categories: Status, Progress, Rating, Special
- Templates:
  - Status Badge
  - Progress Bar
  - Star Rating
  - Temperature
  - Emoji Status
  - Check/Cross
  - Score Grade
  - Trend Arrows
  - Custom patterns

**Format String Editor**:
- Direct Excel format syntax
- Syntax highlighting
- Emoji picker integration
- Format validation

**Format Guide**:
- Comprehensive help popup
- Excel format syntax reference
- Examples grid
- Common patterns

#### 4. Testing & Preview
- Quick test values: 1234.56, -1234.56, 0, "Text", dates
- Live preview showing:
  - Test value
  - Formatted output
  - Active format string
- Format validation messages

### Layout
```
┌──────────────────────────────────────────────────┐
│ Mode: [Standard|Custom]              Preview     │
├──────────────────────────────────────────────────┤
│ Format Type: [Number▼]               Test: 1234  │
│                                      Output: 1,234│
│ Decimals: [2▼] Prefix:[__] Suffix:[__]          │
│ [√] Thousands [√] -Red [√] +Green   Format: #,##0│
│                                                   │
│ Test Values: [1234][−1234][0][Text] [Clear][Reset]│
└──────────────────────────────────────────────────┘
```

## Tab 4: Filter

### Purpose
Configure column filtering behavior and options.

### Features

#### 1. Filter Type Selection
- Text Filter (with pattern matching)
- Number Filter (with comparisons)
- Date Filter (with date ranges)
- Set Filter (dropdown selection)
- Boolean Filter (true/false)
- Multi Filter (combine multiple)

#### 2. Quick Options
- **Floating Filter**: Show filter in column header
- **Hide Menu Button**: Remove filter menu icon
- **Hide Filter Panel**: Disable filter panel

#### 3. Filter-Specific Settings

**Text Filter**:
- Default operator (contains, equals, starts with, etc.)
- Trim input values
- Case sensitive matching
- Debounce delay

**Number Filter**:
- Default operator (equals, greater than, less than, etc.)
- Include blanks option
- Number formatting in filter

**Date Filter**:
- Default operator (equals, after, before, etc.)
- Date format in filter
- Include blanks option

**Set Filter**:
- Enable search box
- Select all button
- Sort filter values
- Max height setting

**Multi Filter**:
- Add/remove sub-filters
- Display mode (tabs, submenu, accordion)
- Default visible filter

#### 4. Advanced Settings
- Debounce delay (ms)
- Show clear button
- Close on apply
- Apply button visibility

### Layout
```
┌───────────────────────────────────────────────────┐
│ Filter Type: [Text Filter▼]          Info Panel   │
├───────────────────────────────────────────────────┤
│ [√] Floating [√] Hide Menu [ ] Hide Panel         │
│                                      Current:      │
│ Default Op: [contains▼] Debounce: [250]ms        │
│ [√] Trim Input [ ] Case Sensitive   Type: Text   │
│                                      Enabled: Yes  │
│ [▼ Advanced Settings]                              │
└───────────────────────────────────────────────────┘
```

## Tab 5: Editor

### Purpose
Configure inline cell editing behavior.

### Features

#### 1. Prerequisites Check
- Shows warning if column not editable
- Links to General tab to enable editing

#### 2. Editor Type Selection
- None (no editor)
- Text (simple text input)
- Large Text (textarea)
- Number (numeric input)
- Date (date picker)
- Select (dropdown)
- Rich Select (searchable dropdown)
- Checkbox (boolean toggle)

#### 3. Editor Options
- **Single Click Edit**: Start editing with single click
- **Popup Editor**: Use popup instead of inline

#### 4. Editor-Specific Configuration

**Text Editor**:
- Maximum length
- Use formatter for display

**Large Text Editor**:
- Rows (height)
- Columns (width)
- Maximum length

**Number Editor**:
- Minimum value
- Maximum value
- Decimal places
- Step increment
- Show stepper buttons

**Date Editor**:
- Minimum date
- Maximum date
- Date format

**Select/Rich Select**:
- Options list management
- Search configuration
- Cell height adjustment

**Checkbox**:
- Checked value
- Unchecked value

### Layout
```
┌──────────────────────────────────────────────────┐
│ Editor Type:                         Info Panel   │
│ [None][Text][Large][Number][Date]                 │
│ [Select][Rich][Checkbox]             Type: Text   │
├──────────────────────────────────────────────────┤
│ [ ] Single Click Edit                Editable: Yes│
│ [ ] Popup Editor                                  │
│                                                   │
│ [▼ Configuration]                    [Reset]      │
│ Max Length: [___] [ ] Use Formatter               │
└──────────────────────────────────────────────────┘
```

## Common UI Components

### Color Picker
- Custom popover component
- Preset colors grid
- Custom color input
- Hex color validation
- Alpha channel support

### Format Examples Grid
- Shows common format patterns
- Interactive examples
- Copy-to-clipboard functionality
- Categorized by type

### Preview Panels
- Live updates
- Multiple test cases
- Error state handling
- Dark mode support

### Mixed Value Indicators
- Shows when multi-column selection has different values
- Checkbox indeterminate state
- Placeholder text "Mixed"

## Interaction Patterns

### Multi-Column Selection
- Shift+click for range selection
- Ctrl/Cmd+click for individual selection
- Select All/Clear buttons
- Mixed value handling

### Apply/Reset Flow
1. Changes tracked in pending changes map
2. Apply button enabled when changes exist
3. Apply updates all selected columns
4. Reset reverts to original values
5. Success toast on apply

### Keyboard Navigation
- Tab through controls
- Enter to apply
- Escape to close
- Arrow keys in dropdowns

## Performance Optimizations

### Lazy Loading
- Tab content loaded on demand
- Format templates loaded when needed
- Preview throttled to 100ms

### Memoization
- Column definitions cached
- Format configurations memoized
- Preview calculations cached

### Batch Updates
- Multiple column updates batched
- Single grid refresh after apply
- Debounced preview updates

## Theme Support

### Dark Mode
- All colors adjust for contrast
- Borders lighter in dark mode
- Shadows adjusted for visibility
- Preview shows theme context

### Custom Properties
- CSS variables for theming
- Consistent spacing variables
- Responsive to theme changes

## Error Handling

### Validation
- Format string validation
- Color format validation
- Number range validation
- Required field validation

### User Feedback
- Error messages inline
- Warning for performance impacts
- Success confirmations
- Loading states

## Accessibility

### ARIA Labels
- All controls properly labeled
- Role attributes set
- State announcements

### Keyboard Support
- Full keyboard navigation
- Focus management
- Shortcut keys

### Screen Reader
- Descriptive labels
- Status announcements
- Error announcements

This specification provides a complete implementation guide for the Column Formatting Dialog as it currently exists in the codebase, with all features, layouts, and behaviors documented.