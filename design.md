# DataTable Component - Comprehensive Technical Documentation

## Table of Contents
1. [Component Overview](#component-overview)
2. [Architecture & Structure](#architecture--structure)
3. [Core Features](#core-features)
4. [Component Details](#component-details)
5. [Styling System](#styling-system)
6. [State Management](#state-management)
7. [Implementation Details](#implementation-details)
8. [API Reference](#api-reference)

## Component Overview

The DataTable component is a sophisticated, enterprise-grade data grid implementation built on top of AG-Grid Enterprise. It provides extensive customization capabilities, profile management, and Excel-like formatting features.

### Key Technologies
- **AG-Grid Enterprise**: Core grid engine with all enterprise modules
- **React**: Component framework
- **Zustand**: State management for profiles and column customization
- **TypeScript**: Type safety throughout
- **Tailwind CSS**: Styling framework
- **Lucide Icons**: Icon library

### Main Components
- `DataTable`: Main grid component
- `DataTableToolbar`: Top toolbar with profile management and export
- `ColumnCustomizationDialog`: Comprehensive column configuration UI
- `ProfileManager`: Save/load grid configurations
- Excel-compatible formatters and styling system

## Architecture & Structure

### File Organization
```
src/components/datatable/
├── data-table.tsx                 # Main DataTable component
├── data-table-toolbar.tsx         # Toolbar with profile & export controls
├── profile-manager.tsx            # Profile management UI
├── debug-profile.tsx              # Debug component for profiles
├── alignment-styles.css           # CSS for cell/header alignment
├── format-styles.css              # CSS for number formatting
├── dialogs/
│   └── columnSettings/
│       ├── ColumnCustomizationDialog.tsx
│       ├── column-customization-dialog.css
│       ├── store/
│       │   └── column-customization.store.ts
│       ├── components/            # Reusable UI components
│       ├── panels/               # Main dialog panels
│       ├── tabs/                 # Property editor tabs
│       ├── editors/              # Style editors
│       └── types.ts              # TypeScript definitions
└── utils/
    └── formatters.ts             # Excel-compatible formatters
```

### Component Hierarchy
```
DataTable
├── DataTableToolbar
│   ├── ProfileManager
│   ├── Font Selector
│   └── Export Buttons (Excel/CSV)
├── AgGridReact (Main Grid)
│   ├── Column Definitions
│   ├── Row Data
│   └── Grid Options
├── ColumnCustomizationDialog
│   ├── ColumnSelectorPanel
│   ├── PropertyEditorPanel
│   │   ├── GeneralTab
│   │   ├── StylingTab
│   │   ├── FormatTab
│   │   ├── FiltersTab
│   │   ├── EditorsTab
│   │   └── AdvancedTab
│   └── BulkActionsPanel
└── DebugProfile
```

## Core Features

### 1. Profile Management
The profile system allows users to save and restore complete grid configurations.

**Features:**
- Save current grid state (columns, filters, sorts, styles)
- Create/edit/delete profiles
- Import/export profiles as JSON
- Default profile with initial configuration
- Auto-save option

**Profile Structure:**
```typescript
interface GridProfile {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
  description?: string;
  gridState: {
    columnDefs: any[];      // Complete column definitions
    columnState: any[];     // Column order, width, visibility
    filterModel: any;       // Active filters
    sortModel: any[];       // Active sorts
    font?: string;          // Selected font
    gridOptions?: {         // Grid-level options
      rowHeight?: number;
      headerHeight?: number;
      // ... more options
    };
  };
}
```

### 2. Column Customization Dialog
A comprehensive UI for configuring all aspects of grid columns.

**Features:**
- Multi-column selection and bulk editing
- Property inheritance and mixed value handling
- Template system for reusable configurations
- Real-time preview of changes
- Undo/redo support (UI prepared, logic pending)

**Property Categories:**
- **General**: Field, header name, data types, sizing
- **Styling**: Alignment, colors, fonts, custom CSS
- **Formatting**: Excel-style number formats, value formatters
- **Filters**: Filter types and configurations
- **Editors**: Cell editor setup
- **Advanced**: Aggregations, tooltips, renderers

### 3. Excel-Compatible Formatting
Advanced number formatting system supporting Excel format strings.

**Supported Formats:**
- Numbers: `#,##0.00`, `0`, `0.0`
- Currency: `$#,##0.00`, `€#,##0.00`, `($#,##0.00)`
- Percentages: `0%`, `0.00%`
- Dates: `YYYY-MM-DD`, `MM/DD/YYYY`, `DD/MM/YYYY`
- Scientific: `0.00E+00`
- Conditional formatting: `[Green]↑0.00%;[Red]↓-0.00%;0.00%`
- Traffic lights: `[>0][Green]"↑";[<0][Red]"↓";"-"`

**Implementation:**
```typescript
// Example: Create Excel formatter
const formatter = createExcelFormatter('$#,##0.00');
// formatter(params) => "$1,234.56"

// Conditional formatting with colors
const conditionalFormatter = createExcelFormatter(
  '[Green]↑#,##0.00;[Red]↓-#,##0.00;0.00'
);
```

### 4. Alignment System
Flexible alignment system using CSS classes for performance.

**Header Alignment:**
- Horizontal: `header-align-left`, `header-align-center`, `header-align-right`
- Vertical: `header-valign-top`, `header-valign-middle`, `header-valign-bottom`

**Cell Alignment:**
- Horizontal: `cell-align-left`, `cell-align-center`, `cell-align-right`
- Vertical: `cell-valign-top`, `cell-valign-middle`, `cell-valign-bottom`

**Implementation:**
- Uses `cellClass` and `headerClass` for alignment
- CSS-based for optimal performance
- Separate from inline styles to avoid conflicts

### 5. Export Functionality
Built-in export to Excel and CSV with formatting preservation.

**Features:**
- Excel export with formatting
- CSV export with clean data
- Custom filename generation
- Value formatter support in exports
- Column header preservation

## Component Details

### DataTable Component

**Props:**
```typescript
interface DataTableProps {
  columnDefs: ColumnDef[];          // Column definitions
  dataRow: Record<string, unknown>[]; // Row data
}

interface ColumnDef extends Omit<AgColDef, 'field' | 'headerName' | 'type'> {
  field: string;                    // Required field name
  headerName: string;               // Required display name
  type?: string | string[];         // Legacy column type
  cellDataType?: 'text' | 'number' | 'date' | 'boolean'; // AG-Grid v33+
}
```

**Key State:**
- `currentColumnDefs`: Active column definitions with customizations
- `selectedFont`: Currently selected font
- `showColumnDialog`: Dialog visibility state
- `gridApiRef`: Reference to AG-Grid API
- `columnDefsWithStylesRef`: Reference storing columns with styles

**Profile Integration:**
The component automatically loads and applies the active profile on mount and profile changes.

### Column Customization Dialog

**Main Panels:**

1. **Column Selector Panel**
   - Virtual scrolling for performance
   - Search and filter capabilities
   - Template column marking
   - Visibility indicators
   - Multi-select with checkboxes

2. **Property Editor Panel**
   - Tabbed interface for property categories
   - Mixed value handling for bulk edits
   - Real-time property updates
   - Context-sensitive help

3. **Bulk Actions Panel**
   - Template management
   - Quick actions
   - Clear functionality
   - Status indicators

### Profile Manager

**Features:**
- Profile dropdown selector
- Save current state button
- Profile actions menu:
  - New profile
  - Duplicate current
  - Import/Export
  - Delete profile
  - Auto-save toggle

**State Persistence:**
- Uses localStorage via Zustand persist
- Automatic migration for schema changes
- Profile validation on import

### Style Editors

**Cell Style Editor:**
- Visual CSS property editor
- Common style presets
- Real-time preview
- Supports all CSS properties

**Header Style Editor:**
- Similar to cell editor
- Floating filter protection
- Conditional style application

## Styling System

### CSS Architecture

1. **Alignment Classes** (`alignment-styles.css`)
   - Flexbox-based alignment
   - High specificity for reliability
   - Floating filter protection

2. **Format Classes** (`format-styles.css`)
   - Numeric cell alignment
   - Tabular number formatting
   - Color classes for conditions

3. **Theme Integration**
   - AG-Grid theme customization
   - Dark/light mode support
   - Custom spacing and fonts

### Style Application Priority
1. Inline styles (highest priority)
2. CSS classes
3. Theme defaults
4. AG-Grid defaults

### Floating Filter Protection
Special handling to prevent header styles from affecting floating filters:
```css
.ag-header-row-floating-filter .ag-header-cell[col-id] {
  background-color: var(--ag-background-color) !important;
}
```

## State Management

### Profile Store (Zustand)

**Store Structure:**
```typescript
interface ProfileStore {
  profiles: GridProfile[];
  activeProfileId: string;
  autoSave: boolean;
  
  // Actions
  createProfile: (name: string, description?: string) => GridProfile;
  updateProfile: (profileId: string, updates: Partial<GridProfile>) => void;
  deleteProfile: (profileId: string) => void;
  setActiveProfile: (profileId: string) => void;
  saveCurrentState: (gridState: Partial<GridProfile['gridState']>) => void;
  // ... more actions
}
```

**Persistence:**
- localStorage with key: `grid-profile-storage`
- Automatic schema migration
- Version tracking

### Column Customization Store

**Store Structure:**
```typescript
interface DialogState {
  selectedColumns: Set<string>;
  columnDefinitions: Map<string, ColDef>;
  pendingChanges: Map<string, Partial<ColDef>>;
  activeTab: string;
  // ... more state
}
```

**Performance Optimizations:**
- Memoized selectors
- Batch updates
- Minimal re-renders

## Implementation Details

### Performance Considerations

1. **Virtual Scrolling**
   - Column selector uses @tanstack/react-virtual
   - Handles thousands of columns efficiently

2. **Memoization**
   - React.memo on all dialog components
   - useMemo for expensive computations
   - useCallback for event handlers

3. **Batch Operations**
   - Bulk property updates
   - Single state update for multiple changes

### Function Serialization

**Challenge:** Storing functions (formatters, styles) in profiles

**Solution:**
```typescript
// Store formatter with metadata
const formatter = createExcelFormatter(formatString);
formatter.__formatString = formatString;
formatter.__formatterType = 'excel';

// Recreate on load
if (config._isFormatterConfig && config.type === 'excel') {
  col.valueFormatter = createExcelFormatter(config.formatString);
}
```

### Mixed Value Handling

When multiple columns are selected with different values:
- Show "~Mixed~" placeholder
- Preserve individual values unless explicitly changed
- Disable property if all selected columns have different values

### Header Style Function Pattern

To avoid affecting floating filters:
```typescript
const headerStyleFn = (params: { floatingFilter?: boolean }) => {
  if (params?.floatingFilter) {
    return null; // No styles for floating filters
  }
  return styleObject;
};
```

## API Reference

### DataTable Props
| Prop | Type | Description |
|------|------|-------------|
| columnDefs | ColumnDef[] | Column definitions with required field and headerName |
| dataRow | Record<string, unknown>[] | Array of row data objects |

### Column Definition Extensions
| Property | Type | Description |
|----------|------|-------------|
| cellDataType | 'text' \| 'number' \| 'date' \| 'boolean' | AG-Grid v33+ optimization |
| headerStyle | Function \| Object | Conditional header styling |
| cellClass | string | Space-separated CSS classes |
| headerClass | string | Space-separated CSS classes |
| valueFormatter | Function | Excel-compatible formatter |

### Profile Manager Methods
| Method | Description |
|--------|-------------|
| saveCurrentState() | Save current grid state to active profile |
| createProfile(name, description?) | Create new profile |
| duplicateProfile(id, name) | Duplicate existing profile |
| importProfile(data) | Import profile from JSON |
| exportProfile(id) | Export profile as JSON |

### Formatter Functions
| Function | Description |
|----------|-------------|
| createExcelFormatter(format) | Create Excel-compatible formatter |
| getExcelStyleClass(format) | Get CSS classes for format |
| createCellStyleFunction(format, baseStyle) | Create conditional style function |

### CSS Classes
| Class Pattern | Description |
|--------------|-------------|
| header-align-{left\|center\|right} | Header horizontal alignment |
| header-valign-{top\|middle\|bottom} | Header vertical alignment |
| cell-align-{left\|center\|right} | Cell horizontal alignment |
| cell-valign-{top\|middle\|bottom} | Cell vertical alignment |
| ag-numeric-cell | Right-aligned numeric cell |
| ag-currency-cell | Currency formatting |
| ag-percentage-cell | Percentage formatting |

## Best Practices

1. **Profile Management**
   - Keep default profile clean
   - Name profiles descriptively
   - Export important profiles for backup

2. **Column Customization**
   - Use templates for repeated patterns
   - Apply bulk changes carefully
   - Test formatters with sample data

3. **Performance**
   - Limit concurrent column selections
   - Use CSS classes over inline styles
   - Avoid complex cell renderers

4. **Styling**
   - Use alignment classes for consistency
   - Combine formatters with conditional styles
   - Test in both light and dark themes

## Future Enhancements

1. **Undo/Redo System**
   - UI is prepared with buttons
   - Needs state history implementation

2. **Advanced Templates**
   - Column group templates
   - Conditional template application

3. **Enhanced Formatters**
   - More Excel format support
   - Custom format builder UI

4. **Performance Monitoring**
   - Render performance metrics
   - Memory usage tracking

5. **Collaborative Features**
   - Shared profiles
   - Real-time updates