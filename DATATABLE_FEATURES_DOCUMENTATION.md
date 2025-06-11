# DataTable Features - Comprehensive Documentation

## Table of Contents
1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Architecture](#architecture)
4. [Component Details](#component-details)
5. [State Management](#state-management)
6. [Data Flow](#data-flow)
7. [Implementation Requirements](#implementation-requirements)

## Overview

The DataTable is a sophisticated AG-Grid based data grid with advanced customization capabilities. It provides:
- Profile management for saving/loading grid configurations
- Column customization (styles, formatters, filters, editors)
- Grid options editor (row height, header height, etc.)
- State persistence via localStorage
- Theme support (light/dark)
- Excel-like formatting
- Floating ribbon interface for column settings

## Core Features

### 1. Profile Management
- **Purpose**: Save and load complete grid configurations
- **Features**:
  - Create/delete/duplicate profiles
  - Import/export profiles as JSON
  - Auto-save option
  - Default profile that cannot be deleted
  - Profile switching with state restoration

### 2. Column Customization Dialog
- **Purpose**: Customize individual column properties
- **Access**: Via toolbar button or right-click context menu
- **Features**:
  - **General Tab**: Header name, width, visibility, pinning
  - **Format Tab**: Number/date/currency formatting with live preview
  - **Styling Tab**: Cell and header styles (colors, alignment, borders)
  - **Filters Tab**: Filter type selection and configuration
  - **Editors Tab**: Cell editor configuration
  - **Advanced Tab**: Additional column properties
  - **Bulk Actions**: Apply settings to multiple columns
  - **Template System**: Save and apply formatting templates

### 3. Grid Options Editor
- **Purpose**: Configure grid-level settings
- **Access**: Via toolbar button
- **Features**:
  - Row height
  - Header height
  - Floating filters height
  - Pagination settings
  - Row selection
  - Column borders
  - Row/column hover effects
  - Property grid UI (Windows-style)

### 4. Floating Ribbon
- **Purpose**: Quick access to column formatting
- **Features**:
  - Tabs matching column customization dialog
  - Apply/Cancel buttons
  - Template selector
  - Live preview
  - Multi-column selection support

### 5. State Persistence
- **Storage**: localStorage
- **Saved Data**:
  - Column customizations (styles, formatters)
  - Grid state (column order, width, visibility, sorts, filters)
  - Grid options (row height, etc.)
  - Font selection
  - Active profile

## Architecture

### Component Hierarchy
```
App.tsx
└── DataTableContainer.tsx
    ├── DataTableToolbar.tsx
    │   └── ProfileManager.tsx
    ├── DataTableGrid.tsx (AG-Grid wrapper)
    ├── ColumnCustomizationDialog.tsx
    │   └── FloatingRibbon.tsx
    └── GridOptionsPropertyEditor.tsx
```

### State Management (Zustand)
```
profile.store.ts
├── Profiles (array)
├── Active Profile ID
└── Profile Structure:
    ├── columnSettings
    │   ├── columnCustomizations (Record<colId, customization>)
    │   └── baseColumnDefs (original column definitions)
    ├── gridState
    │   ├── columnState (AG-Grid column state)
    │   ├── filterModel (AG-Grid filter state)
    │   └── sortModel (AG-Grid sort state)
    └── gridOptions
        ├── rowHeight
        ├── headerHeight
        ├── font
        └── other AG-Grid options
```

## Component Details

### DataTableContainer
- Main orchestrator component
- Manages all state and callbacks
- Provides context to child components
- Handles initialization

### ProfileManager
- Profile CRUD operations
- Save current state to profile
- Load profile and apply to grid
- Import/export functionality

### ColumnCustomizationDialog
- Multi-tab interface for column settings
- Contains FloatingRibbon component
- Manages column selection
- Applies changes to selected columns

### GridOptionsPropertyEditor
- Property grid for grid-level settings
- Categorized/alphabetical view
- Search functionality
- Apply/Save/Reset buttons

### FloatingRibbon
- Embedded in ColumnCustomizationDialog
- Mirrors dialog functionality in ribbon format
- Template management
- Quick formatting controls

## State Management

### Zustand Store Structure
```typescript
interface ProfileStore {
  // State
  profiles: GridProfile[];
  activeProfileId: string | null;
  autoSave: boolean;

  // Actions
  setActiveProfile: (id: string) => void;
  createProfile: (name: string, description?: string) => GridProfile;
  updateProfile: (id: string, updates: Partial<GridProfile>) => void;
  deleteProfile: (id: string) => void;
  
  // Column Settings Actions
  saveColumnCustomizations: (columnDefs: ColDef[], baseColumnDefs: ColDef[]) => void;
  getColumnDefs: (profileId: string) => ColDef[] | null;
  
  // Grid State Actions
  saveGridState: (state: GridState) => void;
  
  // Grid Options Actions
  saveGridOptions: (options: GridOptionsConfig) => void;
  
  // Persistence
  persist: {
    name: 'grid-profiles';
    storage: localStorage;
  }
}
```

## Data Flow

### 1. Column Customization Flow
```
User Action (Dialog/Ribbon)
    ↓
Update Local State
    ↓
Click Apply
    ↓
saveColumnCustomizations() → Updates columnSettings in store
    ↓
Apply to AG-Grid via setColumnDefs()
    ↓
(Optional) Click Save Profile
    ↓
Extract AG-Grid state → Update gridState in store
    ↓
Persist to localStorage
```

### 2. Grid Options Flow
```
User Action (Property Editor)
    ↓
Update Local State
    ↓
Click Apply
    ↓
saveGridOptions() → Updates gridOptions in store
    ↓
Apply to AG-Grid via setGridOption()
    ↓
(Optional) Click Save Profile
    ↓
Extract AG-Grid state → Update gridState in store
    ↓
Persist to localStorage
```

### 3. Profile Load Flow
```
App Start / Profile Switch
    ↓
Load Profile from Store
    ↓
Apply in Order:
1. Grid Options (row height, etc.)
2. Column Settings (build column defs with customizations)
3. Grid State (column state, filters, sorts)
    ↓
Update AG-Grid
```

## Implementation Requirements

### 1. Apply Button Behavior
- **Column Customization Dialog**:
  - Updates only `columnSettings` in Zustand store
  - Applies changes to AG-Grid immediately
  - Does NOT save to localStorage
  
- **Grid Options Editor**:
  - Updates only `gridOptions` in Zustand store
  - Applies changes to AG-Grid immediately
  - Does NOT save to localStorage

### 2. Save Profile Button Behavior
- Extracts complete AG-Grid state using extraction functions
- Updates `gridState` in store with extracted state
- Saves all three properties to localStorage:
  - `columnSettings` (from store)
  - `gridOptions` (from store)
  - `gridState` (freshly extracted)

### 3. Load Order on App Start
1. **Grid Options**: Apply row height, header height, etc.
2. **Column Settings**: Build and apply column definitions with customizations
3. **Grid State**: Apply column state, filters, sorts

### 4. Key Principles
- Clear separation of concerns between the three state properties
- Apply buttons update store and grid, but not localStorage
- Save Profile is the only action that persists to localStorage
- Load order is critical for proper state restoration
- Each property type has its own dedicated update method

### 5. Column Customization Storage
```typescript
interface ColumnCustomization {
  // Styling
  cellStyle?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
  cellClass?: string | string[];
  headerClass?: string;
  
  // Formatting
  valueFormatter?: ValueFormatterConfig;
  
  // Display
  headerName?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  hide?: boolean;
  pinned?: 'left' | 'right' | null;
  
  // Behavior
  sortable?: boolean;
  resizable?: boolean;
  filter?: boolean | string;
  floatingFilter?: boolean;
  editable?: boolean;
  cellEditor?: string;
  cellEditorParams?: any;
}
```

### 6. Grid State Extraction
Use AG-Grid's state management APIs:
- `api.getColumnState()` - Column visibility, width, order
- `api.getFilterModel()` - Active filters
- `api.getSortModel()` - Active sorts

### 7. Template System
- Predefined formatting templates
- Custom template creation
- Template application to multiple columns
- Template storage within profiles

## Error Handling
- Validate profile data on load
- Handle missing or corrupted localStorage data
- Provide fallbacks for failed state restoration
- User feedback via toast notifications

## Performance Considerations
- Debounce state updates
- Optimize column definition rebuilding
- Lazy load AG-Grid modules
- Minimize re-renders with proper memoization

## Testing Requirements
1. Profile CRUD operations
2. State persistence across reloads
3. Apply/Save button behaviors
4. Load order verification
5. Multi-column operations
6. Template system
7. Import/export functionality
8. Error scenarios