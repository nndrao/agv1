# Floating Ribbon Design Documentation

## Overview
This document outlines the design and implementation plan for a Microsoft Office-inspired floating ribbon interface for column formatting in the AG-Grid data table. The ribbon provides a modern, intuitive alternative to the complex column settings dialog.

## Design Philosophy
- **Context-aware**: Invoked from column header context menu, knows which column to format
- **Progressive disclosure**: Shows common options first, advanced features behind dropdowns
- **Multi-column support**: Can format multiple columns simultaneously
- **Template-driven**: Save and reuse formatting configurations
- **Draggable**: Can be repositioned anywhere on screen

## Architecture

### Component Structure
```
FloatingRibbon/
├── FloatingRibbonUI.tsx       # Pure UI component (current implementation)
├── FloatingRibbon.tsx         # Logic container (to be refactored)
├── hooks/
│   ├── useRibbonDrag.ts      # Dragging logic
│   ├── useColumnFormat.ts    # Formatting operations
│   └── useTemplates.ts       # Template management
└── components/
    ├── RibbonHeader.tsx      # Row 1: Column selector, templates, actions
    ├── RibbonTabs.tsx        # Row 2: Section navigation
    └── sections/
        ├── GeneralSection.tsx
        ├── StylingSection.tsx
        ├── FormatSection.tsx
        ├── FilterSection.tsx
        ├── EditorSection.tsx
        └── PreviewSection.tsx
```

## UI Design

### Three-Row Layout

#### Row 1: Header (Context & Actions)
```
┌─────────────────────────────────────────────────────────────────────┐
│ 📊 Column(s)      │ Templates: [⭐ Currency ▼] │ 💾│ 🗑️│ ✕         │
│    + 2 more ▼     │ [✓ Apply to all selected] │   │   │           │
└─────────────────────────────────────────────────────────────────────┘
```

**Components:**
- **Column Selector**: Dropdown with search and multi-select
- **Template System**: Categorized templates with favorites
- **Actions**: Save template, Clear settings (dropdown), Close
- **Multi-column indicator**: Shows count when multiple columns selected

#### Row 2: Section Tabs
```
┌─────────────────────────────────────────────────────────────────────┐
│  📝      🎨       💯      🔽       ✏️      👁️                     │
│ General  Styling  Format  Filter  Editor  Preview                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Tabs:**
- General: Column properties (name, width, visibility, pinning)
- Styling: Visual formatting (text style, alignment, colors)
- Format: Number/date formatting, patterns
- Filter: Column filtering options
- Editor: Cell editor configuration
- Preview: Live preview with sample data

#### Row 3: Dynamic Content Area
Content changes based on active tab, using compact controls with expandable sections.

### Section Designs

#### Format Section
```
Quick: [$] [%] [,] [📅] │ Custom: [#,##0.00 ▼] │ Preview: 1,234.56
```
- Quick format buttons for common formats
- Custom pattern dropdown with expanded options
- Live preview showing formatted result

#### Styling Section
```
[B][I][U] │ [◀][▬][▶] │ Color: [A ▼] │ Fill: [■ ▼] │ More ▼
```
- Text style toggles
- Alignment options
- Color pickers with popover palettes
- Expandable for advanced options

#### Filter Section
```
Quick Filter: [🔍 Search...] │ [= ▼] │ Values ▼ │ Advanced ▼
```
- Quick filter input
- Operator selection
- Value list dropdown
- Advanced filter builder

## Features

### 1. Multi-Column Selection
- Select multiple columns from dropdown
- "Apply to all selected" checkbox
- Visual indicator showing selected count
- Bulk operations support

### 2. Template System
**Template Structure:**
```typescript
interface ColumnTemplate {
  id: string;
  name: string;
  category: 'financial' | 'statistical' | 'datetime' | 'custom';
  isFavorite: boolean;
  settings: {
    format?: string;
    style?: CellStyle;
    width?: number;
    filter?: FilterModel;
    editor?: EditorConfig;
  };
}
```

**Template Categories:**
- ⭐ Favorites (user-starred templates)
- 💰 Financial (currency, accounting formats)
- 📊 Statistical (percentages, scientific notation)
- 📅 Date/Time (various date formats)
- 🎨 Custom (user-created templates)

### 3. Draggable Interface
- Drag from header area
- Stays within viewport bounds
- Visual feedback (cursor, opacity)
- Remembers position (localStorage)

### 4. Column Context Menu Integration
```javascript
// Added to AG-Grid context menu
{
  name: 'Format Column',
  action: () => {
    // Dispatch event with column info and position
    window.dispatchEvent(new CustomEvent('format-column', {
      detail: { colId, colDef, x, y }
    }));
  },
  icon: '🎨'
}
```

### 5. Preview System
- Shows before/after comparison
- Sample data from actual column
- Visual indicators for changes
- Updates in real-time

## Implementation Status

### Completed ✅
1. **UI Design** - `FloatingRibbonUI.tsx`
   - Three-row layout structure
   - All section designs
   - Draggable functionality
   - Microsoft Office-inspired styling

2. **Basic Integration**
   - Context menu integration
   - Event system for invocation
   - Position calculation

### To Be Implemented 🚧

1. **Logic Implementation**
   - Connect UI to actual column operations
   - Template save/load functionality
   - Multi-column selection handling
   - Format application logic

2. **Template Management**
   - Template storage (localStorage/backend)
   - Import/export templates
   - Template sharing between users
   - Default template sets

3. **Advanced Features**
   - Keyboard shortcuts
   - Undo/redo (if decided)
   - Search within templates
   - Recent formats history

4. **Performance Optimization**
   - Lazy loading of sections
   - Memoization of format previews
   - Debounced updates

## Technical Decisions

### Why Floating Ribbon vs Modal Dialog?
- **Accessibility**: Can see grid while formatting
- **Efficiency**: Quick access to common operations
- **Familiarity**: Office-like interface users know
- **Multi-column**: Better UX for bulk operations

### Why Column Context Menu Invocation?
- **Contextual**: Clear which column is being formatted
- **Discoverable**: Right-click is intuitive
- **Efficient**: No need to select columns first
- **Scalable**: Can add more column operations

### Component Library: shadcn/ui
- Consistent with existing codebase
- Highly customizable
- Accessible by default
- Small bundle size

## Usage Flow

1. **Single Column Format**:
   - Right-click column header → "Format Column"
   - Ribbon appears near column
   - Make changes (instant preview)
   - Close or save as template

2. **Multi-Column Format**:
   - Open ribbon on any column
   - Use column selector to add more
   - Check "Apply to all selected"
   - Changes apply to all selected columns

3. **Template Application**:
   - Select template from dropdown
   - Preview changes
   - Click apply or auto-apply if enabled
   - Optionally save modifications as new template

## Future Enhancements

1. **AI-Powered Formatting**
   - Suggest formats based on data type
   - Auto-detect currency, dates, etc.
   - Smart template recommendations

2. **Collaborative Templates**
   - Share templates across team
   - Organization template library
   - Version control for templates

3. **Advanced Conditional Formatting**
   - Multiple conditions
   - Gradient colors
   - Icon sets
   - Data bars

4. **Export/Import**
   - Export column formatting as JSON
   - Import formatting from Excel
   - Apply formatting via API

## Code Examples

### Opening Ribbon for Specific Column
```typescript
// From context menu or programmatically
const openRibbonForColumn = (colId: string, position?: { x: number, y: number }) => {
  window.dispatchEvent(new CustomEvent('format-column', {
    detail: {
      colId,
      colDef: gridApi.getColumn(colId)?.getColDef(),
      x: position?.x || window.innerWidth / 2,
      y: position?.y || 100
    }
  }));
};
```

### Applying Template to Columns
```typescript
const applyTemplate = (template: ColumnTemplate, columnIds: string[]) => {
  columnIds.forEach(colId => {
    const colDef = gridApi.getColumn(colId)?.getColDef();
    if (!colDef) return;
    
    // Apply format
    if (template.settings.format) {
      colDef.valueFormatter = createExcelFormatter(template.settings.format);
    }
    
    // Apply style
    if (template.settings.style) {
      colDef.cellStyle = template.settings.style;
    }
    
    // Apply other settings...
  });
  
  gridApi.refreshCells({ force: true });
};
```

### Saving Current Settings as Template
```typescript
const saveAsTemplate = (name: string, columns: string[]) => {
  const template: ColumnTemplate = {
    id: generateId(),
    name,
    category: 'custom',
    isFavorite: false,
    settings: {}
  };
  
  // Extract common settings from selected columns
  columns.forEach(colId => {
    const colDef = gridApi.getColumn(colId)?.getColDef();
    // Merge common settings into template.settings
  });
  
  // Save to storage
  saveTemplate(template);
};
```

## Related Files
- `/src/components/datatable/FloatingRibbonUI.tsx` - Current UI implementation
- `/src/components/datatable/FloatingRibbon.tsx` - Original implementation (to be refactored)
- `/src/components/datatable/hooks/useGridCallbacks.ts` - Context menu integration
- `/src/components/datatable/DataTableContainer.tsx` - Event handling and ribbon mounting