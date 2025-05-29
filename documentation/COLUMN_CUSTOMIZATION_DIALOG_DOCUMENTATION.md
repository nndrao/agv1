# Column Customization Dialog - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Dialog Structure](#dialog-structure)
4. [Column Selector Panel](#column-selector-panel)
5. [Property Editor Panel](#property-editor-panel)
   - [General Tab](#general-tab)
   - [Styling Tab](#styling-tab)
   - [Format Tab](#format-tab)
   - [Filters Tab](#filters-tab)
   - [Editors Tab](#editors-tab)
   - [Advanced Tab](#advanced-tab)
6. [Bulk Actions Panel](#bulk-actions-panel)
7. [State Management](#state-management)
8. [Implementation Details](#implementation-details)
9. [Special Features](#special-features)

---

## Overview

The Column Customization Dialog is a comprehensive interface for customizing AG-Grid column properties. It provides a user-friendly way to modify column behavior, appearance, filtering, editing, and formatting options.

### Key Features
- Multi-column selection and bulk editing
- Real-time preview with immediate apply mode
- Template column system for quick styling copy
- Persistent settings across sessions
- Smart recommendations based on data types
- Mixed value handling for bulk edits

### File Structure
```
/src/components/datatable/dialogs/columnSettings/
├── ColumnCustomizationDialog.tsx    # Main dialog component
├── column-customization-dialog.css   # Dialog-specific styles
├── components/                       # Reusable components
│   ├── AlignmentIconPicker.tsx
│   ├── MixedValueInput.tsx
│   ├── NumericInput.tsx
│   ├── PropertyGroup.tsx
│   └── ThreeStateCheckbox.tsx
├── editors/                         # Custom editors
│   ├── StyleEditor.tsx
│   └── ValueFormatterEditor.tsx
├── panels/                          # Main panels
│   ├── BulkActionsPanel.tsx
│   ├── ColumnSelectorPanel.tsx
│   └── PropertyEditorPanel.tsx
├── store/                           # State management
│   └── column-customization.store.ts
├── tabs/                            # Property tabs
│   ├── GeneralTab.tsx
│   ├── StylingTab.tsx
│   ├── FormatTab.tsx
│   ├── FiltersTab.tsx
│   ├── EditorsTab.tsx
│   └── AdvancedTab.tsx
└── types.ts                         # TypeScript definitions
```

---

## Architecture

### Component Hierarchy
```
ColumnCustomizationDialog
├── DialogHeader
├── DialogContent
│   ├── ColumnSelectorPanel (25% width)
│   ├── PropertyEditorPanel (50% width)
│   └── BulkActionsPanel (25% width)
└── DialogFooter
```

### State Management
The dialog uses Zustand for state management with persistence:

```typescript
interface DialogState {
  // Dialog state
  open: boolean;
  
  // Column management
  selectedColumns: Set<string>;
  columnDefinitions: Map<string, ColDef>;
  pendingChanges: Map<string, Partial<ColDef>>;
  
  // UI state
  activeTab: string;
  applyMode: 'immediate' | 'onSave';
  showOnlyCommon: boolean;
  compareMode: boolean;
  searchTerm: string;
  cellDataTypeFilter: string;
  
  // Template columns
  templateColumns: Set<string>;
}
```

---

## Dialog Structure

### Dialog Header
- **Title**: "Column Settings" with icon
- **Badges**: Shows selected count, total columns, and pending changes
- **Apply Mode Toggle**: Switch between immediate and save modes
- **Close Button**: Standard dialog close

### Dialog Footer
- **Discard Button**: Resets all pending changes
- **Apply Button**: Applies changes and closes dialog (only in save mode)

---

## Column Selector Panel

### Features

#### 1. **Search Functionality**
- Real-time search by column name or header
- Filters columns as you type
- Search icon indicator

#### 2. **CellDataType Filter**
- Dropdown filter by data type (text, number, date, boolean)
- Shows data type icons
- "All Data Types" option

#### 3. **Column List**
- Virtual scrolling for performance
- Shows column header name
- Data type icon indicator
- Checkbox for selection

#### 4. **Bulk Selection**
- Select/Deselect all visible columns
- Indeterminate state for partial selection
- Selected count badge

#### 5. **Template Column System**
- Star icon to mark columns as templates
- Templates appear in "Copy From" dropdown
- Persistent across sessions
- Visual feedback on hover

### Implementation Details

```typescript
// Virtual scrolling setup
const virtualizer = useVirtualizer({
  count: flatItems.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 40,
  overscan: 5
});

// Template column toggle
const toggleTemplateColumn = (columnId: string) => {
  const newTemplates = new Set(templateColumns);
  if (newTemplates.has(columnId)) {
    newTemplates.delete(columnId);
  } else {
    newTemplates.add(columnId);
  }
  setTemplateColumns(newTemplates);
};
```

---

## Property Editor Panel

### Mixed Value Handling
When multiple columns are selected with different values:
- Shows "~Mixed~" placeholder
- Yellow warning alert
- Changes apply to all selected columns
- Preserves individual values if not modified

---

### General Tab

#### 1. **Column Information**
- **Field**: Read-only field name
- **Header Name**: Editable display name
- **Description**: Optional column description

#### 2. **Data Type**
- Dropdown with icons for each type
- Options: Text, Number, Date, Boolean, Object
- Affects filter and editor recommendations

#### 3. **Column Type**
- AG-Grid column types
- Options: Text Column, Numeric Column, Date Column, etc.

#### 4. **Visibility & Interaction**
- **Hide**: Toggle column visibility
- **Sortable**: Enable/disable sorting
- **Resizable**: Enable/disable resizing
- **Lockable**: Enable/disable locking
- **Lock Position**: Left/Right when locked

#### 5. **Width Configuration**
- **Width**: Fixed width in pixels
- **Min Width**: Minimum width constraint
- **Max Width**: Maximum width constraint
- **Flex**: Flexible width ratio
- **Auto Size**: Fit content automatically
- **Suppress Size to Fit**: Exclude from size-to-fit

#### 6. **Header Configuration**
- **Wrap Header Text**: Multi-line headers
- **Auto Header Height**: Automatic height adjustment

### Implementation Details
```typescript
// Three-state checkbox for mixed values
const ThreeStateCheckbox = ({ 
  value, 
  onChange, 
  label 
}: ThreeStateCheckboxProps) => {
  const isMixed = value === 'mixed';
  const isChecked = value === true;
  const isIndeterminate = isMixed;
  
  return (
    <Checkbox
      checked={isChecked}
      indeterminate={isIndeterminate}
      onCheckedChange={(checked) => {
        if (isMixed) onChange(true);
        else onChange(checked);
      }}
    />
  );
};
```

---

### Styling Tab

#### 1. **Text Alignment**
- **Header Alignment**: Left, Center, Right
- **Cell Alignment**: Left, Center, Right
- Visual icon-based selector
- Independent header/cell alignment

#### 2. **Cell Styling**
- **Cell Style Editor**:
  - Background Color picker
  - Text Color picker
  - Font Weight (Normal, Bold, Light)
  - Font Size (px)
  - Font Style (Normal, Italic)
  - Border configuration
  - Padding settings
- **Cell Class**: CSS class names

#### 3. **Header Styling**
- **Header Style Editor**: Same options as cell
- **Header Class**: CSS class names
- **Special Handling**: Prevents floating filter contamination

#### 4. **Text Wrapping**
- **Wrap Text**: Enable text wrapping in cells
- **Auto Height**: Adjust row height to fit content

#### 5. **CSS Class Management**
- Text input for class names
- Space-separated multiple classes
- Validation for valid CSS class names

### Special Implementation: Header Style Function
```typescript
// Convert static style to function to prevent floating filter styling
if (property === 'headerStyle' && typeof value === 'object') {
  const styleObject = value as React.CSSProperties;
  value = (params: any) => {
    if (!params.floatingFilter) {
      return styleObject;
    }
    return null;
  };
}
```

---

### Format Tab

#### 1. **Pre-defined Formatters**
Organized by categories with live preview:

**Number Formats**:
- Integer (1234)
- 1 Decimal (1234.5)
- 2 Decimals (1234.50)
- Thousands (1,234)
- Thousands + Decimals (1,234.50)

**Currency Formats**:
- USD Integer ($1,234)
- USD 2 Decimals ($1,234.50)
- EUR (€1,234.50)
- GBP (£1,234.50)
- JPY (¥1,234)
- Suffix format (1,234.50 USD)
- Accounting (negative in red)

**Percentage Formats**:
- Integer (12%)
- 1 Decimal (12.3%)
- 2 Decimals (12.34%)

**Date Formats**:
- US Date (12/31/2024)
- UK Date (31/12/2024)
- ISO Date (2024-12-31)
- Medium Date (Dec 31, 2024)
- Long Date (December 31, 2024)

**Time Formats**:
- 24-hour (14:30)
- 24-hour with seconds (14:30:45)
- 12-hour (02:30 PM)

**Scientific & Special**:
- Scientific notation (1.23E+03)
- Abbreviated (1.2M, 450K)
- Show +/- signs
- Parentheses format

#### 2. **Custom Format String**
- Excel-style format string input
- Placeholder with examples
- Real-time validation

#### 3. **Format Guide Dialog**
Comprehensive guide with four tabs:

**Basic Formats Tab**:
- Common number patterns
- Simple examples with preview
- Copy-to-clipboard functionality

**Conditional Tab**:
- Value-based conditions
- Color formatting
- Multiple conditions syntax

**Prefix/Suffix Tab**:
- Adding currency symbols
- Unit suffixes
- Wrapping in characters

**Advanced Tab**:
- Scientific notation
- Fractions
- Custom patterns
- Complete syntax reference

### Implementation Detail: Format Function Creation
```typescript
const createFormatterFunction = (format: string): ((params: any) => string) => {
  return (params: any) => {
    if (params.value == null) return '';
    
    // Handle percentage
    if (format.includes('%')) {
      return (value * 100).toFixed(decimals) + '%';
    }
    
    // Handle currency
    if (format.startsWith('$')) {
      return symbol + value.toLocaleString('en-US', options);
    }
    
    // Additional format handling...
  };
};
```

---

### Filters Tab

#### 1. **Filter Type Selection**
Available filter types with icons and descriptions:
- **Text Filter**: Contains, equals, starts with, etc.
- **Number Filter**: Range and comparison operations
- **Date Filter**: Before/after/between dates
- **Boolean Filter**: True/false values
- **Set Filter**: Select from unique values
- **Multi Filter**: Combine multiple filters

#### 2. **Smart Recommendations**
- Analyzes column data type
- Shows recommendation alert
- One-click apply recommended filter

#### 3. **Filter Options**
- **Floating Filter**: Toggle inline filter row
- **Hide Filter Menu**: Suppress menu icon
- **Hide in Filters Tool Panel**: Exclude from panel

#### 4. **Filter-Specific Parameters**

**Text Filter Parameters**:
- Default filter option (contains, equals, etc.)
- Trim input toggle
- Case sensitivity
- Debounce delay (ms)

**Number Filter Parameters**:
- Default comparison option
- Include blanks in equals/less than
- Custom number parser function
- Range settings

**Date Filter Parameters**:
- Default date comparison
- Date format specification
- Include blanks option
- In-range inclusive toggle

**Set Filter Parameters**:
- Search box visibility
- Select all checkbox toggle
- Tooltips display
- Sort order (alphabetical, case insensitive, natural)

**Multi Filter Configuration**:
- Add/remove sub-filters (up to 4)
- Configure each filter:
  - Filter type selection
  - Display mode (inline/tabs, sub menu, accordion)
  - Custom title
- Global options:
  - Hide child filter buttons
  - Default display style

#### 5. **Advanced Filter Options**
- AND/OR condition visibility
- Clear button in filter menu
- Close on apply behavior
- Max valid year (date filter)
- Excel mode (set filter)
- New rows action

#### 6. **Quick Actions**
- Enable Set Filter with Search
- Apply Recommended Filter
- Reset to Default

### Multi Filter Implementation
```typescript
const MultiFilterParams = ({ filterParams, onParamChange }) => {
  const defaultFilters = filterParams.filters || [
    { filter: 'agTextColumnFilter', display: 'subMenu' },
    { filter: 'agSetColumnFilter' }
  ];

  const handleFilterChange = (index, field, value) => {
    const newFilters = [...defaultFilters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    onParamChange('filters', newFilters);
  };
  
  // Add/remove filter logic...
};
```

---

### Editors Tab

#### 1. **Edit Configuration**
- **Enable Editing**: Master toggle
- **Single Click Edit**: vs double click
- **Stop Editing When Focus Lost**: Auto-stop on blur

#### 2. **Cell Editor Types**
All AG-Grid built-in editors:
- **Text Editor**: Standard input
- **Large Text Editor**: Multi-line textarea
- **Select Editor**: Basic dropdown
- **Rich Select Editor**: Advanced with search
- **Number Editor**: Numeric with validation
- **Date Editor**: Date picker
- **Checkbox Editor**: Boolean toggle
- **Custom Editor**: User components

#### 3. **Popup Configuration**
- **Popup Editor**: Show as popup vs inline
- **Popup Position**: Over or under cell

#### 4. **Editor-Specific Parameters**

**Text Editor**:
- Max length restriction
- Use formatter while editing

**Large Text Editor**:
- Rows configuration (default: 5)
- Columns configuration (default: 50)
- Max length

**Select/Rich Select**:
- Options list (one per line)
- For Rich Select only:
  - Search type (fuzzy/text)
  - Allow typing toggle
  - Filter list toggle
  - Highlight matches
- List dimensions (gap, height)
- Cell height

**Number Editor**:
- Min/Max value constraints
- Decimal precision
- Step increment
- Stepper buttons visibility

**Date Editor**:
- Date format string
- Min/Max date constraints

#### 5. **Advanced Editor Options**
- List max height/width
- Start editing key
- Format after edit

#### 6. **Custom Editor Support**
Step-by-step guide:
1. Create component implementing ICellEditorComp
2. Implement required methods
3. Register component
4. Component name input

#### 7. **Quick Actions**
- Enable Recommended Editor
- Make Read-Only
- Reset to Default

### Editor Parameter State Management
```typescript
const getDefaultEditorParams = (editorType: string): any => {
  switch (editorType) {
    case 'agTextCellEditor':
      return { maxLength: undefined, useFormatter: false };
    case 'agSelectCellEditor':
      return { values: ['Option 1', 'Option 2', 'Option 3'] };
    // ... other editors
  }
};
```

---

### Advanced Tab

#### 1. **Aggregation**
- **Enable Value**: Allow aggregation
- **Aggregation Function**: Sum, Avg, Min, Max, Count, etc.
- **Allow Functions**: Let users select in UI

#### 2. **Row Grouping**
- **Enable Row Group**: Allow grouping
- **Row Group Index**: Order in group hierarchy
- **Show Row Group**: Display in grid

#### 3. **Pivoting**
- **Enable Pivot**: Allow pivot operations
- **Pivot Index**: Order in pivot
- **Agg Function**: Specific pivot aggregation

#### 4. **Column Menu**
- **Suppress Menu**: Hide column menu
- **Column Menu Tabs**: Configure visible tabs

#### 5. **Tooltip**
- **Tooltip Field**: Data field for tooltip
- **Tooltip Component**: Custom component
- **Tooltip Value Getter**: Function input

#### 6. **Cell Rendering**
- **Cell Renderer**: Component name
- **Cell Renderer Params**: JSON configuration

---

## Bulk Actions Panel

### 1. **Quick Templates**
Pre-configured column types:
- **Numeric**: Number column with formatting
- **Currency**: Currency with symbol
- **Date**: Date column with picker
- **Text**: Standard text column

### 2. **Copy From Column**
- Dropdown shows only template columns
- Copies all formatting properties:
  - Cell/Header styles
  - Value formatters
  - Cell renderers
  - Data types and filters
  - Editor configurations
- Special handling for headerStyle functions

### 3. **Clear All Customizations**
Removes all custom properties:
- Styles and classes
- Formatters and renderers
- Custom types and filters
- Editor configurations

### 4. **Status Display**
- Selected columns count
- Pending changes count
- Real-time updates

### Template System Implementation
```typescript
// Copy from template column
const copyFromColumn = useCallback(() => {
  const sourceColumn = columnDefinitions.get(sourceColumnId);
  const propertiesToCopy = [
    'cellDataType', 'type', 'filter',
    'cellStyle', 'headerStyle', 'cellClass', 'headerClass',
    'valueFormatter', 'cellRenderer',
    'wrapText', 'autoHeight'
  ];

  // Build batch update
  const propertiesToUpdate: Record<string, any> = {};
  propertiesToCopy.forEach(property => {
    const value = sourceColumn[property];
    if (value !== undefined) {
      // Special handling for headerStyle
      if (property === 'headerStyle' && typeof value === 'function') {
        const extractedStyle = value({ floatingFilter: false });
        propertiesToUpdate[property] = extractedStyle;
      } else {
        propertiesToUpdate[property] = value;
      }
    }
  });

  // Batch update for performance
  updateBulkProperties(propertiesToUpdate);
}, [sourceColumnId, columnDefinitions, updateBulkProperties]);
```

---

## State Management

### Zustand Store Structure

```typescript
const useColumnCustomizationStore = create<ColumnCustomizationStore>()(
  persist(
    (set, get) => ({
      // State
      open: false,
      selectedColumns: new Set<string>(),
      columnDefinitions: new Map<string, ColDef>(),
      pendingChanges: new Map<string, Partial<ColDef>>(),
      templateColumns: new Set<string>(),
      
      // Actions
      updateBulkProperty: (property, value) => {
        // Update logic with headerStyle handling
      },
      
      updateBulkProperties: (properties) => {
        // Batch update for performance
      },
      
      toggleTemplateColumn: (columnId) => {
        // Template management
      },
    }),
    {
      name: 'column-customization-store',
      partialize: (state) => ({
        // Persist only UI preferences
        applyMode: state.applyMode,
        activeTab: state.activeTab,
        templateColumns: Array.from(state.templateColumns),
      }),
      onRehydrateStorage: () => (state) => {
        // Convert arrays back to Sets
        if (state && Array.isArray(state.templateColumns)) {
          state.templateColumns = new Set(state.templateColumns);
        }
      },
    }
  )
);
```

### Performance Optimizations

1. **Batch Updates**: `updateBulkProperties` for multiple property changes
2. **Virtual Scrolling**: Column list uses @tanstack/react-virtual
3. **Memoization**: Heavy computations use useMemo
4. **Lazy Loading**: Tab content loads on demand

---

## Implementation Details

### Custom Components

#### 1. **AlignmentIconPicker**
```typescript
const AlignmentIconPicker = ({ value, onChange }) => {
  const options = [
    { value: 'left', icon: AlignLeft },
    { value: 'center', icon: AlignCenter },
    { value: 'right', icon: AlignRight }
  ];
  
  return (
    <div className="flex gap-1">
      {options.map(option => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "outline"}
          onClick={() => onChange(option.value)}
        >
          <option.icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
};
```

#### 2. **MixedValueInput**
Handles mixed values across selected columns:
- Shows "~Mixed~" placeholder
- Clears on focus
- Preserves individual values if unchanged

#### 3. **NumericInput**
Enhanced number input:
- Min/Max constraints
- Step increment
- Null/undefined handling
- Validation

#### 4. **StyleEditor**
Visual style configuration:
- Color pickers with preview
- Font controls
- Border configuration
- Live preview

### CSS Architecture

```css
/* Modern styling approach */
.column-dialog-content {
  @apply bg-gradient-to-br from-background via-background to-background/95;
}

/* Virtual scrolling optimization */
.virtual-list-container {
  contain: strict;
  will-change: transform;
}

/* Smooth transitions */
.property-input {
  @apply transition-all duration-200 ease-in-out;
}

/* Focus states */
.property-input:focus-within {
  @apply ring-2 ring-primary/20 border-primary;
}
```

### Error Handling

1. **Empty State Management**: Graceful handling of no selection
2. **Invalid Input Prevention**: Validation before state updates
3. **Type Safety**: Full TypeScript coverage
4. **Fallback Values**: Sensible defaults for all properties

### Accessibility

1. **Keyboard Navigation**: Full keyboard support
2. **ARIA Labels**: Proper labeling for screen readers
3. **Focus Management**: Logical tab order
4. **Color Contrast**: WCAG AA compliant

---

## Special Features

### 1. **Immediate Apply Mode**
- Real-time grid updates
- No save button needed
- Instant visual feedback
- Undo capability

### 2. **Mixed Value Handling**
- Intelligent placeholder display
- Preserve unchanged values
- Clear visual indicators
- Bulk operations safety

### 3. **Smart Recommendations**
- Data type analysis
- Context-aware suggestions
- One-click optimizations
- Best practice defaults

### 4. **Template Column System**
- Quick style copying
- Persistent templates
- Visual marking system
- Efficient reuse

### 5. **Performance Features**
- Virtual scrolling for large datasets
- Batch state updates
- Lazy component loading
- Optimized re-renders

### 6. **Persistence**
- UI preferences saved
- Template selections retained
- Active tab remembered
- Apply mode preserved

### 7. **Header Style Protection**
- Prevents floating filter contamination
- Maintains header-only styles
- Automatic function conversion
- Backward compatibility

---

## Usage Examples

### Basic Column Styling
```typescript
// Select columns
setSelectedColumns(new Set(['name', 'age', 'email']));

// Apply styles
updateBulkProperties({
  headerStyle: { backgroundColor: '#f0f0f0', fontWeight: 'bold' },
  cellStyle: { padding: '8px' },
  cellClass: 'custom-cell'
});
```

### Advanced Filtering Setup
```typescript
// Configure multi-filter
updateBulkProperties({
  filter: 'agMultiColumnFilter',
  filterParams: {
    filters: [
      { filter: 'agTextColumnFilter', display: 'subMenu' },
      { filter: 'agSetColumnFilter' }
    ]
  },
  floatingFilter: true
});
```

### Custom Editor Configuration
```typescript
// Setup rich select editor
updateBulkProperties({
  cellEditor: 'agRichSelectCellEditor',
  cellEditorParams: {
    values: ['Option 1', 'Option 2', 'Option 3'],
    searchType: 'fuzzy',
    allowTyping: true,
    filterList: true
  },
  editable: true,
  singleClickEdit: true
});
```

---

## Troubleshooting

### Common Issues

1. **Template columns not persisting**
   - Check localStorage permissions
   - Verify store hydration

2. **Styles not applying to headers**
   - Ensure headerStyle is a function
   - Check floating filter configuration

3. **Editor not appearing**
   - Verify editable is true
   - Check column type compatibility

4. **Filter recommendations incorrect**
   - Ensure cellDataType is set correctly
   - Update column definitions

### Debug Mode
```typescript
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  store.subscribe((state) => {
    console.log('Column Customization State:', state);
  });
}
```

---

## Future Enhancements

1. **Import/Export Settings**: Save and share column configurations
2. **Preset Management**: Save multiple configuration sets
3. **Undo/Redo System**: Full history tracking
4. **Advanced Validation**: Complex business rules
5. **AI-Powered Suggestions**: ML-based optimizations
6. **Collaborative Editing**: Multi-user support
7. **Performance Monitoring**: Usage analytics
8. **Mobile Optimization**: Touch-friendly interface

---

## Conclusion

The Column Customization Dialog represents a comprehensive solution for AG-Grid column configuration. With its intuitive interface, powerful features, and careful attention to performance and user experience, it provides users with complete control over their grid columns while maintaining ease of use and reliability.