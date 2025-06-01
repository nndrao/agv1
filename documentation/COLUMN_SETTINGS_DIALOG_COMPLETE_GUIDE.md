# Column Settings Dialog - Complete Feature Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture & Integration](#architecture--integration)
3. [Design Language](#design-language)
4. [UI Components & Layout](#ui-components--layout)
5. [Features](#features)
6. [Store Management](#store-management)
7. [Profile Integration](#profile-integration)
8. [Performance Optimizations](#performance-optimizations)

## Overview

The Column Settings Dialog is a comprehensive interface for customizing AG-Grid column properties. It provides a three-panel layout with advanced customization capabilities, template management, and seamless integration with the profile system.

### Key Capabilities
- **Multi-column selection and bulk editing**
- **Template system for reusable configurations**
- **Real-time preview of changes**
- **Customization tracking with visual indicators**
- **Sound and haptic feedback**
- **Accessibility support**

## Architecture & Integration

### Component Hierarchy
```
ColumnCustomizationDialog
├── Header (with sound toggle)
├── Body Layout
│   ├── ColumnSelectorPanel (left)
│   ├── PropertyEditorPanel (center)
│   │   ├── GeneralTab
│   │   ├── StylingTab
│   │   ├── FormatTab
│   │   ├── FiltersTab
│   │   └── EditorsTab
│   └── BulkActionsPanel (right, collapsible)
└── Footer (action buttons)
```

### Integration Points

#### 1. AG-Grid Instance
- Receives column definitions via `columnDefs` prop
- Gets column state (visibility, width, position) via `columnState` prop
- Applies changes through `onApply` callback
- Preserves grid state during updates

#### 2. Zustand Store (`column-customization.store.ts`)
- Manages dialog state and pending changes
- Tracks selected columns
- Handles template application tracking
- Persists UI preferences

#### 3. Profile Management System
- Changes are staged but not auto-saved
- Applied when user clicks "Save Profile" in toolbar
- Supports lightweight serialization for performance
- Integrates with profile optimizer for smooth transitions

## Design Language

### Visual Principles
1. **Clean, Professional Aesthetic**
   - Muted color palette with subtle accents
   - Consistent spacing (using Tailwind classes)
   - Clear visual hierarchy

2. **Color System**
   ```css
   - Primary: Brand color for active states
   - Muted: Subtle backgrounds and borders
   - Secondary: Badges and indicators
   - Destructive: Warning states
   - Success: Completion states
   ```

3. **Typography**
   - Headers: `text-lg font-semibold`
   - Section titles: `text-sm font-semibold`
   - Labels: `text-xs font-medium`
   - Body text: `text-sm`
   - Muted text: `text-muted-foreground`

4. **Spacing & Layout**
   - Consistent padding: `px-4 py-3` for sections
   - Gap between elements: `gap-2` or `gap-3`
   - Border radius: `rounded-md` for containers
   - Subtle shadows for depth

## UI Components & Layout

### 1. Dialog Header
```typescript
<DialogHeader className="px-6 py-4 border-b shrink-0 bg-background">
```
- **Settings Icon**: Primary colored icon in rounded container
- **Title**: "Column Settings" with screen reader description
- **Status Badges**: 
  - Selected count (secondary variant)
  - Total columns (outline variant)
  - Pending changes (default variant)
- **Sound Toggle**: Circular button with dynamic icon

### 2. Column Selector Panel (Left - 260px)
```typescript
<div className="w-[260px] border-r bg-muted/30 overflow-hidden flex flex-col">
```

#### Features:
- **Header**: Gradient background with column icon
- **Search Bar**: Real-time filtering with icon
- **Filters**:
  - Data type filter (dropdown)
  - Visibility filter (all/visible/hidden)
- **Selection Controls**: 
  - Select all checkbox with indeterminate state
  - Selection counter badge
- **Column List**:
  - Virtual scrolling for performance
  - Column items with:
    - Checkbox for selection
    - Data type icon
    - Column name
    - Hidden indicator (eye-off icon)
    - Customization count badge
    - Template star (on hover)
    - Applied template indicator

#### Customization Indicators:
- **Count Badge**: Small circular indicator showing total customizations
- **Popover on Click**: Shows:
  - Applied template name with remove button
  - Individual customization badges
  - Hover to remove functionality

### 3. Property Editor Panel (Center - Flex)
```typescript
<div className="flex-1 overflow-hidden flex flex-col min-w-0 bg-background">
```

#### Tab System:
```typescript
<TabsList className="grid w-full grid-cols-5 shrink-0 h-9 bg-muted/30 gap-0.5 p-0.5">
```
- **Tab Design**: Icon + text, compact spacing
- **Active State**: Primary background with shadow
- **Tab Content**: Scrollable with consistent padding

#### Tabs Detail:

##### General Tab
- **Simple Mode**: Basic properties only
  - Header name, width, sortable, resizable
  - Initially hidden, floating filter
- **Advanced Mode**: Two-column layout
  - Identity & Basic Info (expanded by default)
  - Column Sizing
  - Column Behavior
  - Visibility & Pinning

##### Styling Tab
- **Text Styling Section**:
  - Alignment picker (custom icon grid)
  - Text wrapping options
  - Font weight, style, decoration
- **Colors Section**:
  - Text color with opacity
  - Background color with opacity
  - Border configuration
- **Cell Styling Section**:
  - Padding controls
  - Border sides toggle

##### Format Tab
- **Quick Format Buttons**: Grid layout with icons
- **Template Selector**: Dropdown with preview
- **Custom Format Editor**: Monaco-based code editor
- **Format Wizard**: Step-by-step formatter builder

##### Filters Tab
- **Filter Type Selection**: Icon-based dropdown
- **Filter Parameters**: Dynamic based on type
- **Advanced Options**: Collapsible sections

##### Editors Tab
- **Editor Type Selection**: Dropdown with descriptions
- **Editor Parameters**: Type-specific configuration

### 4. Bulk Actions Panel (Right - 260px, Collapsible)
```typescript
<div className="w-[260px] border-l bg-muted/30 overflow-hidden flex flex-col">
```

#### Features:
- **Collapsible Design**: Slide-out with chevron toggle
- **Template Management**:
  - Save current configuration as template
  - Apply saved templates
  - Edit/delete templates
  - Template storage in localStorage
- **Quick Actions**:
  - Clear all customizations
  - Reset to defaults

### 5. Dialog Footer
```typescript
<DialogFooter className="px-6 py-3 border-t flex items-center justify-between shrink-0 bg-muted/20">
```
- **Left Side**: Undo/Redo buttons (currently disabled)
- **Right Side**: 
  - Reset button (outline variant)
  - Apply button (saves to dialog state)
  - Apply & Close button (with progress indicator)

## Features

### 1. Multi-Column Selection
- Select multiple columns for bulk editing
- Visual indicators for selected columns
- Mixed value handling with "~Mixed~" display
- Intelligent property filtering for bulk operations

### 2. Template System
- **Save Templates**: Capture column configuration
- **Apply Templates**: One-click application
- **Template Tracking**: Shows which template is applied
- **Template Properties**: Comprehensive list excluding field/headerName

### 3. Customization Tracking
- **Visual Badges**: Show applied customizations
- **Categories**:
  - Style (blue): cellStyle, headerStyle, etc.
  - Formatter (green): valueFormatter
  - Filter (purple): filter settings
  - Editor (orange): cell editors
  - General (gray): width, pinning, etc.
- **Remove on Hover**: X button appears for removal

### 4. Mixed Value Handling
- **Visual Indicator**: Orange background for mixed values
- **Three-State Checkbox**: Checked/Unchecked/Indeterminate
- **Smart Updates**: Only changes modified properties

### 5. Performance Features
- **Virtual Scrolling**: For large column lists
- **Debounced Search**: Prevents excessive re-renders
- **Optimized State Updates**: Batched changes
- **Memoized Components**: Prevents unnecessary re-renders

### 6. Accessibility
- **ARIA Labels**: Comprehensive labeling
- **Keyboard Navigation**: Full support
- **Screen Reader Announcements**: Live regions
- **Focus Management**: Proper focus handling

### 7. Feedback Systems
- **Sound Effects**: Toggle-able audio feedback
- **Visual Feedback**: Progress indicators
- **Toast Notifications**: Success/error messages
- **Haptic Feedback**: Platform-specific vibration

## Store Management

### State Structure
```typescript
interface DialogState {
  // Dialog control
  open: boolean;
  
  // Column management
  selectedColumns: Set<string>;
  columnDefinitions: Map<string, ColDef>;
  columnState: Map<string, ColumnState>;
  pendingChanges: Map<string, Partial<ColDef>>;
  
  // UI preferences
  activeTab: string;
  searchTerm: string;
  cellDataTypeFilter: string;
  visibilityFilter: 'all' | 'visible' | 'hidden';
  
  // Template tracking
  templateColumns: Set<string>;
  appliedTemplates: Map<string, {
    templateId: string;
    templateName: string;
    appliedAt: number;
  }>;
}
```

### Key Actions
- `updateBulkProperty`: Updates single property across selected columns
- `updateBulkProperties`: Batch update multiple properties
- `applyChanges`: Applies pending changes to column definitions
- `setAppliedTemplate`: Tracks template application
- `removeColumnCustomization`: Removes specific customization type

### Persistence
- UI preferences are persisted in localStorage
- Column changes are temporary until profile save
- Template definitions stored separately

## Profile Integration

### Save Flow
1. User makes changes in dialog
2. Changes stored in `pendingChanges`
3. User clicks "Apply" - changes applied to grid
4. User clicks "Save Profile" - changes persisted

### Lightweight Serialization
- Only stores changed properties
- Reduces storage size by 70-80%
- Faster profile switching
- Automatic migration from old format

### Integration with Profile Optimizer
```typescript
// Profile switching with optimization
profileOptimizer.applyProfile(
  gridApi,
  newProfile,
  previousProfile,
  { showTransition: true }
);
```

## Performance Optimizations

### 1. Virtual Scrolling
- Renders only visible columns
- Smooth scrolling performance
- Handles 1000+ columns efficiently

### 2. Memoization
- React.memo on all major components
- Custom comparison functions
- Selective re-rendering

### 3. Debouncing
- Search input debounced
- State updates batched
- Animations use requestAnimationFrame

### 4. Lazy Loading
- Tabs load content on demand
- Heavy components use suspense
- Code splitting for editors

### 5. State Management
- Immutable updates with Immer
- Selective subscriptions
- Optimized selectors

## Usage Examples

### Opening the Dialog
```typescript
<ColumnCustomizationDialog
  open={showColumnDialog}
  onOpenChange={setShowColumnDialog}
  columnDefs={currentColumnDefs}
  columnState={gridApi.getColumnState()}
  onApply={handleApplyColumnChanges}
/>
```

### Applying Changes
```typescript
const handleApplyColumnChanges = (updatedColumns: ColDef[]) => {
  // Preserve current grid state
  const currentState = gridApi.getColumnState();
  
  // Apply new column definitions
  gridApi.setGridOption('columnDefs', updatedColumns);
  
  // Restore state
  gridApi.applyColumnState({ state: currentState });
};
```

### Template Usage
```typescript
// Save template
const template = {
  id: generateId(),
  name: 'Financial Format',
  properties: extractColumnProperties(selectedColumn)
};

// Apply template
selectedColumns.forEach(colId => {
  updateBulkProperties(template.properties);
  setAppliedTemplate(colId, template.id, template.name);
});
```

## Best Practices

1. **Always preserve grid state** when applying changes
2. **Use bulk operations** for multiple columns
3. **Test with large datasets** for performance
4. **Provide visual feedback** for all actions
5. **Handle edge cases** (empty selection, mixed values)
6. **Follow accessibility guidelines**
7. **Optimize for mobile** (drawer pattern)

## Future Enhancements

1. **Undo/Redo System**: Full history tracking
2. **Advanced Templates**: Conditional templates
3. **Export/Import**: Share configurations
4. **Keyboard Shortcuts**: Power user features
5. **AI Suggestions**: Smart formatting recommendations
6. **Real-time Preview**: Live grid updates
7. **Column Groups**: Hierarchical editing