# Column Customization Dialog - Detailed Tab Specifications

## Overview
The Column Customization Dialog is a 700px × 250px modal dialog that provides comprehensive column formatting capabilities through a tabbed interface.

## Dialog Structure

### Layout Components
1. **Column List Panel** (Left - 180px wide)
   - Shows all available columns
   - Single selection mode
   - Scrollable list with custom scrollbar
   - Visual indicators for formatted columns

2. **Tab Panel** (Right - Variable width)
   - Four tabs: Data Type, Format, Style, Custom
   - Tab content changes based on selected column
   - Real-time preview functionality

3. **Action Bar** (Bottom)
   - Apply and Cancel buttons
   - Copy format functionality in Custom tab

## Tab 1: Data Type

### Purpose
Define how the system interprets and processes the column data.

### UI Elements

#### Type Selection (Radio Group)
```
○ Auto-detect (Let system determine type)
● Text (Treat as text string)
○ Number (Numeric values)
○ Date (Date/time values)
○ Boolean (True/false values)
```

#### Type-Specific Options

**When "Text" is selected:**
- Case Transform dropdown:
  - None (default)
  - UPPERCASE
  - lowercase
  - Title Case
  - Sentence case
- Trim whitespace checkbox
- Maximum length input (with ellipsis option)

**When "Number" is selected:**
- Parse as dropdown:
  - Auto
  - Integer
  - Decimal
  - Currency
  - Percentage
- Decimal places spinner (0-20)
- Use thousands separator checkbox
- Null value handling:
  - Show as empty
  - Show as zero
  - Show as custom text

**When "Date" is selected:**
- Input format dropdown:
  - Auto-detect
  - ISO 8601 (YYYY-MM-DD)
  - US Format (MM/DD/YYYY)
  - EU Format (DD/MM/YYYY)
  - Unix Timestamp
  - Custom pattern
- Parse strict mode checkbox
- Timezone handling dropdown

**When "Boolean" is selected:**
- True values input (comma-separated)
  - Default: "true, yes, y, 1, on"
- False values input (comma-separated)
  - Default: "false, no, n, 0, off"
- Case sensitive checkbox

### Preview Panel
- Shows 5 sample values from the column
- Displays how they'll be interpreted with current settings
- Error indicators for values that can't be parsed

## Tab 2: Format

### Purpose
Control how values are displayed without changing the underlying data.

### UI Elements

#### Format Type Selector
Dropdown with options based on detected/selected data type:

**For Text columns:**
- No formatting
- Add prefix/suffix
- Truncate with ellipsis
- Word wrap
- Mask sensitive data

**For Number columns:**
- General number
- Currency
- Percentage  
- Scientific notation
- Custom pattern

**For Date columns:**
- Short date (12/31/2023)
- Long date (December 31, 2023)
- ISO date (2023-12-31)
- Relative time (2 days ago)
- Custom pattern

**For Boolean columns:**
- Yes/No
- True/False
- On/Off
- Custom values
- Icons (✓/✗)

#### Format Configuration Panel

**Number Format Configuration:**
```
Pattern: [#,##0.00     ] [?]
         
Decimal places: [2] ▲▼
Thousands separator: [✓]
Currency symbol: [$] Position: [Before ▼]

Negative numbers:
○ -1,234.00
● (1,234.00)
○ - 1,234.00
○ 1,234.00-
```

**Date Format Configuration:**
```
Pattern: [MM/dd/yyyy  ] [?]

Common formats:
[Short Date] [Long Date] [Time] [Date & Time]

Components:
Year: [yyyy ▼] Month: [MM ▼] Day: [dd ▼]
Hour: [--  ▼] Minute: [-- ▼] Second: [-- ▼]

Show timezone: [ ]
Relative dates: [ ] (shows "yesterday", "2 hours ago")
```

**Text Format Configuration:**
```
Prefix: [         ]
Suffix: [         ]

Transform:
[None ▼]

Max length: [   ] Show ellipsis: [✓]
Word wrap: [ ]
```

#### Excel Format String Input
Advanced mode with direct Excel format string input:
```
Format string: [              ]
               
Examples:
• 0.00 → 1234.00
• #,##0 → 1,234
• $#,##0.00 → $1,234.00
• 0% → 12%
• [Red]-0;[Green]+0 → colored based on value
```

### Live Preview
- Shows current value → formatted value
- Updates in real-time as settings change
- Shows multiple examples with different values

## Tab 3: Style

### Purpose
Control visual appearance of cells including colors, fonts, and conditional formatting.

### UI Elements

#### Basic Styling
```
Text color: [■] [#000000]
Background: [□] [#FFFFFF]

Font style:
[B] Bold  [I] Italic  [U] Underline  [S] Strikethrough

Text alignment:
[◀] Left  [■] Center  [▶] Right

Vertical alignment:
[▲] Top  [■] Middle  [▼] Bottom
```

#### Conditional Formatting Rules

**Rule Builder:**
```
When cell value [equals ▼] [         ] 

Apply:
Text color: [■] [#FF0000]
Background: [■] [#FFEEEE]
[B] [I] [U] [S]

[+ Add another condition]
```

**Condition Types:**
- equals / not equals
- contains / not contains
- starts with / ends with
- greater than / less than
- between / not between
- is empty / is not empty
- matches pattern (regex)

**Multiple Rules:**
- Rules evaluated top to bottom
- First matching rule wins
- Drag to reorder rules
- Enable/disable individual rules

#### Color Scales
For numeric data:
```
Color scale: [Enable ▼]

Type:
○ 2-Color Scale
● 3-Color Scale
○ Data Bars

Minimum: [■] [#FF0000] Value: [Auto ▼]
Midpoint: [■] [#FFFF00] Value: [50% ▼]
Maximum: [■] [#00FF00] Value: [Auto ▼]
```

#### Icon Sets
```
Icon set: [3 Arrows ▼]

Available sets:
- 3 Arrows (↑ → ↓)
- 3 Flags (🚩)
- 3 Traffic Lights (🔴🟡🟢)
- 4 Ratings (★)
- 5 Ratings (★)
- 3 Symbols (✓ ! ✗)

Thresholds:
Icon 1: when >= [67] [% ▼]
Icon 2: when >= [33] [% ▼]
Icon 3: when < [33] [% ▼]
```

### Theme-Aware Styling
```
□ Adjust colors for dark mode
   When enabled, colors automatically adjust:
   - Brightens colors in dark mode
   - Darkens colors in light mode
   - Maintains contrast ratios
```

## Tab 4: Custom

### Purpose
Apply pre-built formatting templates for common use cases.

### UI Elements

#### Template Selector
```
Template: [Select a template... ▼]

Categories:
├─ Status & Indicators
│  ├─ Status Badge
│  ├─ Priority Label  
│  ├─ Traffic Light
│  └─ Warning Icon
├─ Data Visualization
│  ├─ Progress Bar
│  ├─ Bullet Chart
│  ├─ Sparkline
│  └─ Mini Bar Chart
├─ Ratings & Scores
│  ├─ Star Rating
│  ├─ Numeric Score
│  ├─ Letter Grade
│  └─ Pass/Fail
├─ Special Formats
│  ├─ Email Link
│  ├─ URL Link
│  ├─ Phone Number
│  └─ Social Handle
└─ Custom Patterns
   ├─ Temperature
   ├─ File Size
   ├─ Duration
   └─ Distance
```

#### Template Configuration Panel

Each template has specific configuration options:

**Status Badge Template:**
```
Badge Style: [Rounded ▼]
├─ Rounded
├─ Square
└─ Pill

Status Mapping:
"active"   → [■] Green  [Active    ]
"pending"  → [■] Yellow [Pending   ]
"inactive" → [■] Gray   [Inactive  ]
[+ Add status]

Show icon: [✓] Position: [Before ▼]
```

**Progress Bar Template:**
```
Style: [Solid ▼]
├─ Solid
├─ Striped
└─ Animated

Min value: [0    ]
Max value: [100  ]

Colors:
0-33%:   [■] [#FF4444]
34-66%:  [■] [#FFAA00]  
67-100%: [■] [#00C851]

Show value: [✓] Position: [Inside ▼]
Bar height: [20] px
```

**Star Rating Template:**
```
Maximum stars: [5] ▲▼
Allow half stars: [✓]

Icons:
Filled: [★] Empty: [☆]

Colors:
Filled: [■] [#FFD700]
Empty:  [■] [#CCCCCC]

Value source:
● Numeric value (0-5)
○ Percentage (0-100%)
○ Custom scale: [0] to [10]
```

**Temperature Template:**
```
Unit: [Celsius ▼]
├─ Celsius (°C)
├─ Fahrenheit (°F)
└─ Kelvin (K)

Display format:
● Value + unit (25°C)
○ Value + unit + icon (25°C 🌡️)
○ Custom: [{value}°{unit} {icon}]

Color coding:
[✓] Enable temperature colors
Cold (< [0]°):    [■] [#3B82F6]
Cool ([0-15]°):   [■] [#10B981]
Warm ([16-25]°):  [■] [#F59E0B]
Hot (> [25]°):    [■] [#EF4444]

Icons:
Cold: [❄️] Cool: [🌤️] Warm: [☀️] Hot: [🔥]
```

**Email Link Template:**
```
Display as:
● Email address
○ "Email" text
○ Icon only (✉️)
○ Name (extract from email)

Link behavior:
[✓] Open in mail client
[✓] Copy on click
[ ] Show tooltip

Style:
[✓] Underline
Color: [■] [#0066CC]
```

#### Format Expression Builder
For advanced users:
```
Expression: [{value|currency} ({change|percent})]

Available variables:
• {value} - Cell value
• {row.field} - Other field from same row
• {index} - Row index

Available filters:
• |currency - Format as currency
• |percent - Format as percentage  
• |round:2 - Round to 2 decimals
• |upper - Uppercase
• |lower - Lowercase
```

#### Copy Format Feature
```
[Copy Format] [Paste Format]

Quick apply to:
[ ] All numeric columns
[ ] All text columns
[ ] All date columns
[ ] Selected columns: [Choose... ▼]

[Apply to Selected]
```

### Template Preview Panel
- Shows live preview with actual data
- Multiple examples for different values
- Template-specific preview (e.g., progress bars show different fill levels)
- Dark/light mode preview toggle

## Common Features Across All Tabs

### Column Selection Behavior
- Clicking a column loads its current configuration
- Modified columns show a dot indicator
- Shift-click to select multiple columns (Custom tab only)
- Search/filter columns functionality

### Real-time Preview
- Always visible at bottom of each tab
- Shows 3-5 examples from actual data
- Updates immediately with changes
- Error states for invalid configurations

### Validation
- Invalid patterns show error messages
- Incompatible options are disabled
- Warning for performance-heavy operations
- Suggests optimizations

### Keyboard Shortcuts
- Tab/Shift+Tab: Navigate between controls
- Ctrl+Enter: Apply changes
- Escape: Cancel dialog
- Ctrl+C/V: Copy/paste formats (Custom tab)
- Alt+1/2/3/4: Switch tabs

### Responsive Behavior
- Minimum width: 700px
- Maximum width: 1200px
- Height adjusts to content (max 600px)
- Scrollable content areas
- Collapsible advanced options

## State Management

### Per-Column State
```typescript
interface ColumnFormatState {
  field: string;
  dataType: {
    type: 'auto' | 'text' | 'number' | 'date' | 'boolean';
    parseOptions: DataTypeOptions;
  };
  format: {
    type: string;
    pattern?: string;
    options: FormatOptions;
  };
  style: {
    basic: BasicStyle;
    conditional: ConditionalRule[];
    colorScale?: ColorScaleConfig;
    iconSet?: IconSetConfig;
  };
  custom: {
    template?: string;
    config?: any;
    expression?: string;
  };
}
```

### Dialog State
```typescript
interface DialogState {
  selectedColumn: string | null;
  selectedColumns: Set<string>; // Multi-select in Custom tab
  activeTab: 'dataType' | 'format' | 'style' | 'custom';
  unsavedChanges: boolean;
  copiedFormat: ColumnFormatState | null;
  previewData: any[];
}
```

## Behavior Specifications

### Apply Button Behavior
1. Validates all settings
2. Shows spinner during application
3. Updates grid immediately
4. Saves to current profile
5. Shows success toast
6. Keeps dialog open for more changes

### Cancel Button Behavior
1. Checks for unsaved changes
2. Shows confirmation if changes exist
3. Reverts preview to original
4. Closes dialog

### Tab Switching Behavior
1. Preserves unsaved changes
2. Updates preview for new tab
3. Shows relevant options for column type
4. Maintains column selection

### Error Handling
1. Invalid format patterns show inline errors
2. Parse errors show in preview
3. Network errors (for custom templates) show retry option
4. Graceful fallback for unsupported features

This detailed specification ensures that every aspect of the Column Customization dialog is thoroughly documented for implementation in any UI framework.