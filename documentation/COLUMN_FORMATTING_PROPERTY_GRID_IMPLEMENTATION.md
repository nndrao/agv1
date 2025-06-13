# Column Formatting Property Grid Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture Design](#architecture-design)
3. [Property Grid Structure](#property-grid-structure)
4. [Implementation Components](#implementation-components)
5. [Feature Mapping](#feature-mapping)
6. [Technical Implementation](#technical-implementation)
7. [Migration Strategy](#migration-strategy)

## Overview

This document provides a comprehensive implementation guide for converting the Column Formatting dialog from a ribbon-based interface to a property grid format similar to the Grid Options editor, while maintaining all 1000+ features documented in the original guide.

### Key Requirements
- Maintain all 43+ AG-Grid column properties
- Preserve multi-column selection and bulk editing
- Keep template system fully functional
- Ensure all formatters, styles, and conditional logic work
- Maintain performance with large column sets
- Support undo/redo functionality
- Keep all keyboard shortcuts
- Preserve theme integration

## Architecture Design

### Component Structure
```
ColumnFormattingPropertyGrid/
├── ColumnFormattingPropertyGrid.tsx       // Main container
├── components/
│   ├── PropertyTree.tsx                   // Tree structure for properties
│   ├── PropertyEditor.tsx                 // Individual property editor
│   ├── PropertySearch.tsx                 // Search functionality
│   ├── PropertyToolbar.tsx                // Actions toolbar
│   ├── ColumnSelector.tsx                 // Column selection panel
│   ├── PreviewPanel.tsx                   // Live preview
│   └── TemplateManager.tsx                // Template operations
├── editors/
│   ├── BooleanEditor.tsx                  // Checkbox editor
│   ├── NumberEditor.tsx                   // Numeric input
│   ├── TextEditor.tsx                     // Text input
│   ├── SelectEditor.tsx                   // Dropdown
│   ├── ColorEditor.tsx                    // Color picker
│   ├── StyleEditor.tsx                    // Complex style editor
│   ├── FormatEditor.tsx                   // Format builder
│   ├── FilterEditor.tsx                   // Filter configuration
│   ├── EditorTypeSelector.tsx             // Cell editor selector
│   └── ConditionalEditor.tsx              // Conditional rules
├── config/
│   ├── propertyDefinitions.ts             // Property metadata
│   ├── propertyGroups.ts                  // Grouping configuration
│   ├── editorMappings.ts                  // Property-to-editor mapping
│   └── validationRules.ts                 // Validation logic
└── hooks/
    ├── usePropertyGrid.ts                 // Main state management
    ├── usePropertyValidation.ts           // Validation logic
    ├── usePropertySearch.ts               // Search functionality
    └── usePropertyHistory.ts              // Undo/redo support
```

## Property Grid Structure

### Property Categories (Top Level)
```typescript
interface PropertyCategory {
  id: string;
  label: string;
  icon: React.ComponentType;
  properties: PropertyGroup[];
  expanded: boolean;
  visible: boolean;
}

const categories: PropertyCategory[] = [
  {
    id: 'styling',
    label: 'Styling',
    icon: Palette,
    properties: [
      { id: 'cell-styles', label: 'Cell Styles', properties: [...] },
      { id: 'header-styles', label: 'Header Styles', properties: [...] },
      { id: 'text-wrapping', label: 'Text Wrapping', properties: [...] },
      { id: 'borders', label: 'Borders', properties: [...] },
      { id: 'padding', label: 'Padding', properties: [...] }
    ]
  },
  {
    id: 'format',
    label: 'Format',
    icon: Hash,
    properties: [
      { id: 'value-formatting', label: 'Value Formatting', properties: [...] },
      { id: 'conditional-formatting', label: 'Conditional Formatting', properties: [...] }
    ]
  },
  {
    id: 'general',
    label: 'General',
    icon: Settings,
    properties: [
      { id: 'display', label: 'Display', properties: [...] },
      { id: 'visibility', label: 'Visibility & Position', properties: [...] },
      { id: 'sizing', label: 'Sizing', properties: [...] },
      { id: 'behavior', label: 'Behavior', properties: [...] }
    ]
  },
  {
    id: 'filter',
    label: 'Filter',
    icon: Filter,
    properties: [
      { id: 'filter-config', label: 'Filter Configuration', properties: [...] },
      { id: 'filter-params', label: 'Filter Parameters', properties: [...] },
      { id: 'column-menu', label: 'Column Menu', properties: [...] }
    ]
  },
  {
    id: 'editor',
    label: 'Editor',
    icon: Edit,
    properties: [
      { id: 'edit-config', label: 'Edit Configuration', properties: [...] },
      { id: 'editor-params', label: 'Editor Parameters', properties: [...] },
      { id: 'validation', label: 'Validation', properties: [...] }
    ]
  }
];
```

### Property Definition Structure
```typescript
interface PropertyDefinition {
  key: string;                    // AG-Grid property key
  label: string;                  // Display name
  type: PropertyType;             // Data type
  editor: EditorType;             // Editor component
  category: string;               // Parent category
  group: string;                  // Parent group
  defaultValue?: any;             // Default value
  validation?: ValidationRule[];   // Validation rules
  dependencies?: string[];        // Other properties it depends on
  conditional?: ConditionalRule;  // Show/hide conditions
  tooltip?: string;               // Help text
  advanced?: boolean;             // Advanced property flag
  multiValue?: boolean;           // Supports mixed values
  clearable?: boolean;            // Can be cleared/reset
  metadata?: {
    min?: number;
    max?: number;
    step?: number;
    options?: SelectOption[];
    placeholder?: string;
    format?: string;
    allowCustom?: boolean;
  };
}
```

## Implementation Components

### 1. Main Property Grid Component
```typescript
export const ColumnFormattingPropertyGrid: React.FC = () => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperty,
    updateBulkProperties,
    applyChanges,
    resetChanges
  } = useColumnFormattingStore();

  const {
    searchTerm,
    setSearchTerm,
    filteredProperties,
    expandedCategories,
    toggleCategory
  } = usePropertyGrid();

  return (
    <div className="column-formatting-property-grid">
      <PropertyToolbar
        selectedColumns={selectedColumns}
        onApply={applyChanges}
        onReset={resetChanges}
        hasChanges={pendingChanges.size > 0}
      />
      
      <div className="grid-layout">
        <div className="left-panel">
          <ColumnSelector
            columns={columnDefinitions}
            selectedColumns={selectedColumns}
            onSelectionChange={setSelectedColumns}
          />
        </div>
        
        <div className="center-panel">
          <PropertySearch
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredProperties.length}
          />
          
          <PropertyTree
            categories={categories}
            properties={filteredProperties}
            expandedCategories={expandedCategories}
            onToggleCategory={toggleCategory}
            selectedColumns={selectedColumns}
            pendingChanges={pendingChanges}
            onPropertyChange={updateBulkProperty}
          />
        </div>
        
        <div className="right-panel">
          <PreviewPanel
            selectedColumns={selectedColumns}
            columnDefinitions={columnDefinitions}
            pendingChanges={pendingChanges}
          />
          
          <TemplateManager
            selectedColumns={selectedColumns}
            onApplyTemplate={updateBulkProperties}
          />
        </div>
      </div>
    </div>
  );
};
```

### 2. Property Tree Implementation
```typescript
export const PropertyTree: React.FC<PropertyTreeProps> = ({
  categories,
  properties,
  expandedCategories,
  onToggleCategory,
  selectedColumns,
  pendingChanges,
  onPropertyChange
}) => {
  const renderProperty = (property: PropertyDefinition) => {
    // Get current value(s) for selected columns
    const values = getPropertyValues(
      property.key,
      selectedColumns,
      columnDefinitions,
      pendingChanges
    );

    // Check if property should be visible
    if (property.conditional && !evaluateCondition(property.conditional, values)) {
      return null;
    }

    return (
      <PropertyEditor
        key={property.key}
        property={property}
        values={values}
        onChange={(value) => onPropertyChange(property.key, value)}
        selectedColumnCount={selectedColumns.size}
      />
    );
  };

  return (
    <div className="property-tree">
      {categories.map(category => (
        <div key={category.id} className="property-category">
          <button
            className="category-header"
            onClick={() => onToggleCategory(category.id)}
          >
            <category.icon className="category-icon" />
            <span>{category.label}</span>
            <ChevronIcon expanded={expandedCategories.has(category.id)} />
          </button>
          
          {expandedCategories.has(category.id) && (
            <div className="category-content">
              {category.properties.map(group => (
                <div key={group.id} className="property-group">
                  <h4 className="group-header">{group.label}</h4>
                  <div className="group-properties">
                    {group.properties.map(renderProperty)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

### 3. Property Editor Component
```typescript
export const PropertyEditor: React.FC<PropertyEditorProps> = ({
  property,
  values,
  onChange,
  selectedColumnCount
}) => {
  const isMixed = values.length > 1 && !values.every(v => v === values[0]);
  
  // Select appropriate editor based on property type
  const EditorComponent = getEditorComponent(property.editor);
  
  return (
    <div className="property-editor">
      <label className="property-label">
        {property.label}
        {property.tooltip && (
          <TooltipIcon content={property.tooltip} />
        )}
      </label>
      
      <div className="property-value">
        <EditorComponent
          property={property}
          value={isMixed ? undefined : values[0]}
          isMixed={isMixed}
          onChange={onChange}
          metadata={property.metadata}
        />
        
        {property.clearable && values[0] !== property.defaultValue && (
          <button
            className="clear-button"
            onClick={() => onChange(property.defaultValue)}
            title="Reset to default"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      
      {selectedColumnCount > 1 && isMixed && (
        <div className="mixed-value-indicator">
          Mixed values across {selectedColumnCount} columns
        </div>
      )}
    </div>
  );
};
```

## Feature Mapping

### Styling Tab → Styling Category
| Original Feature | Property Grid Implementation |
|-----------------|----------------------------|
| Cell/Header Toggle | Separate "Cell Styles" and "Header Styles" groups |
| Live Preview | Dedicated preview panel with real-time updates |
| Font Controls | Grouped under "Typography" with compound editor |
| Text Style Toggles | Boolean properties with icon visualization |
| Alignment Controls | Custom alignment grid editor |
| Color Controls | Advanced color picker with theme awareness |
| Border Grid | Custom border selector component |
| Padding Controls | Compound padding editor with sync option |

### Format Tab → Format Category
| Original Feature | Property Grid Implementation |
|-----------------|----------------------------|
| Format Categories | Dropdown selector that shows relevant properties |
| Format Presets | Quick-apply buttons in format editor |
| Custom Patterns | Text input with validation and examples |
| Conditional Formatting | Dedicated rule builder dialog |

### Implementation for Complex Properties

#### 1. Style Properties (cellStyle, headerStyle)
```typescript
export const StyleEditor: React.FC<StyleEditorProps> = ({ 
  property, 
  value, 
  onChange 
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const styleObject = parseStyleValue(value);
  
  return (
    <div className="style-editor">
      <div className="style-summary">
        {getStyleSummary(styleObject)}
      </div>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowDialog(true)}
      >
        <Edit className="h-3 w-3 mr-1" />
        Edit Style
      </Button>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <StyleBuilderDialog
            initialStyle={styleObject}
            onSave={(newStyle) => {
              onChange(createStyleFunction(newStyle));
              setShowDialog(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
```

#### 2. Value Formatter
```typescript
export const FormatEditor: React.FC<FormatEditorProps> = ({ 
  property, 
  value, 
  onChange 
}) => {
  const [formatType, setFormatType] = useState(detectFormatType(value));
  const [showBuilder, setShowBuilder] = useState(false);
  
  return (
    <div className="format-editor">
      <Select
        value={formatType}
        onValueChange={(type) => {
          setFormatType(type);
          if (type !== 'custom') {
            onChange(createFormatter(type, getDefaultOptions(type)));
          }
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="number">Number</SelectItem>
          <SelectItem value="currency">Currency</SelectItem>
          <SelectItem value="percentage">Percentage</SelectItem>
          <SelectItem value="date">Date/Time</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
      
      {formatType !== 'none' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowBuilder(true)}
        >
          Configure
        </Button>
      )}
      
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent>
          <FormatBuilderDialog
            type={formatType}
            currentFormat={value}
            onSave={(format) => {
              onChange(format);
              setShowBuilder(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
```

#### 3. Filter Configuration
```typescript
export const FilterEditor: React.FC<FilterEditorProps> = ({ 
  property, 
  value, 
  onChange,
  columnType 
}) => {
  const filterOptions = getFilterOptionsForType(columnType);
  const [showParams, setShowParams] = useState(false);
  
  return (
    <div className="filter-editor">
      <Select
        value={value || 'none'}
        onValueChange={(filterType) => {
          onChange(filterType === 'none' ? undefined : filterType);
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Filter</SelectItem>
          {filterOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {value && value !== 'none' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowParams(true)}
        >
          Parameters
        </Button>
      )}
      
      <Dialog open={showParams} onOpenChange={setShowParams}>
        <DialogContent>
          <FilterParamsDialog
            filterType={value}
            columnType={columnType}
            onSave={(params) => {
              // Update filterParams property
              onPropertyChange('filterParams', params);
              setShowParams(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
```

## Template System Implementation

### Template Integration
```typescript
export const TemplateManager: React.FC<TemplateManagerProps> = ({
  selectedColumns,
  onApplyTemplate
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  
  const handleSaveTemplate = () => {
    // Get all modified properties from property grid
    const modifiedProperties = getModifiedProperties();
    setSelectedProperties(modifiedProperties);
    setShowSaveDialog(true);
  };
  
  return (
    <div className="template-manager">
      <h3>Templates</h3>
      
      <div className="template-actions">
        <Button
          size="sm"
          onClick={handleSaveTemplate}
          disabled={selectedColumns.size === 0}
        >
          <Save className="h-4 w-4 mr-1" />
          Save as Template
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Layers className="h-4 w-4 mr-1" />
              Apply Template
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <TemplateList
              onSelect={(template) => {
                onApplyTemplate(template.settings);
              }}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <PropertySelectionDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        availableProperties={getAllProperties()}
        selectedProperties={selectedProperties}
        onSave={(name, description, properties) => {
          saveTemplate(name, description, properties);
          setShowSaveDialog(false);
        }}
      />
    </div>
  );
};
```

## Advanced Features

### 1. Multi-Column Value Handling
```typescript
const getPropertyValues = (
  propertyKey: string,
  selectedColumns: Set<string>,
  columnDefinitions: Map<string, ColDef>,
  pendingChanges: Map<string, Partial<ColDef>>
): any[] => {
  const values: any[] = [];
  
  selectedColumns.forEach(colId => {
    const colDef = columnDefinitions.get(colId);
    const changes = pendingChanges.get(colId);
    
    // Check pending changes first, then column definition
    const value = changes?.[propertyKey] !== undefined 
      ? changes[propertyKey]
      : colDef?.[propertyKey];
      
    values.push(value);
  });
  
  return values;
};
```

### 2. Conditional Property Display
```typescript
interface ConditionalRule {
  property: string;
  operator: 'equals' | 'notEquals' | 'in' | 'notIn';
  value: any;
}

const evaluateCondition = (
  rule: ConditionalRule,
  currentValues: Record<string, any>
): boolean => {
  const propertyValue = currentValues[rule.property];
  
  switch (rule.operator) {
    case 'equals':
      return propertyValue === rule.value;
    case 'notEquals':
      return propertyValue !== rule.value;
    case 'in':
      return rule.value.includes(propertyValue);
    case 'notIn':
      return !rule.value.includes(propertyValue);
    default:
      return true;
  }
};
```

### 3. Property Validation
```typescript
const validateProperty = (
  property: PropertyDefinition,
  value: any
): ValidationResult => {
  const errors: string[] = [];
  
  // Type validation
  if (property.type === 'number' && isNaN(value)) {
    errors.push('Value must be a number');
  }
  
  // Range validation
  if (property.metadata?.min !== undefined && value < property.metadata.min) {
    errors.push(`Value must be at least ${property.metadata.min}`);
  }
  
  if (property.metadata?.max !== undefined && value > property.metadata.max) {
    errors.push(`Value must be at most ${property.metadata.max}`);
  }
  
  // Custom validation rules
  property.validation?.forEach(rule => {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};
```

### 4. Search and Filter
```typescript
const usePropertySearch = (properties: PropertyDefinition[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const filteredProperties = useMemo(() => {
    if (!searchTerm) {
      return showAdvanced ? properties : properties.filter(p => !p.advanced);
    }
    
    const term = searchTerm.toLowerCase();
    return properties.filter(property => {
      // Search in property key, label, group, category, and tooltip
      return (
        property.key.toLowerCase().includes(term) ||
        property.label.toLowerCase().includes(term) ||
        property.group.toLowerCase().includes(term) ||
        property.category.toLowerCase().includes(term) ||
        property.tooltip?.toLowerCase().includes(term)
      ) && (showAdvanced || !property.advanced);
    });
  }, [properties, searchTerm, showAdvanced]);
  
  return {
    searchTerm,
    setSearchTerm,
    showAdvanced,
    setShowAdvanced,
    filteredProperties
  };
};
```

### 5. Undo/Redo Support
```typescript
const usePropertyHistory = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  const addToHistory = (entry: HistoryEntry) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(entry);
      return newHistory;
    });
    setCurrentIndex(prev => prev + 1);
  };
  
  const undo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1];
    }
  };
  
  const redo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1];
    }
  };
  
  return { addToHistory, undo, redo, canUndo: currentIndex > 0, canRedo: currentIndex < history.length - 1 };
};
```

## Property Configuration

### Complete Property Definitions
```typescript
export const propertyDefinitions: PropertyDefinition[] = [
  // Styling Properties
  {
    key: 'cellClass',
    label: 'Cell CSS Class',
    type: 'string',
    editor: 'text',
    category: 'styling',
    group: 'cell-styles',
    tooltip: 'CSS class(es) to apply to cells',
    clearable: true,
    metadata: {
      placeholder: 'e.g., highlight-cell custom-style'
    }
  },
  {
    key: 'cellStyle',
    label: 'Cell Style',
    type: 'object',
    editor: 'style',
    category: 'styling',
    group: 'cell-styles',
    tooltip: 'Inline styles for cells',
    clearable: true,
    advanced: true
  },
  {
    key: 'wrapText',
    label: 'Wrap Text',
    type: 'boolean',
    editor: 'boolean',
    category: 'styling',
    group: 'text-wrapping',
    defaultValue: false,
    tooltip: 'Enable text wrapping in cells'
  },
  {
    key: 'autoHeight',
    label: 'Auto Height',
    type: 'boolean',
    editor: 'boolean',
    category: 'styling',
    group: 'text-wrapping',
    defaultValue: false,
    tooltip: 'Automatically adjust row height to fit content',
    dependencies: ['wrapText']
  },
  
  // Format Properties
  {
    key: 'valueFormatter',
    label: 'Value Formatter',
    type: 'function',
    editor: 'format',
    category: 'format',
    group: 'value-formatting',
    tooltip: 'Format cell values for display',
    clearable: true
  },
  
  // General Properties
  {
    key: 'headerName',
    label: 'Header Name',
    type: 'string',
    editor: 'text',
    category: 'general',
    group: 'display',
    tooltip: 'Display name for column header',
    metadata: {
      placeholder: 'Column header text'
    }
  },
  {
    key: 'width',
    label: 'Width',
    type: 'number',
    editor: 'number',
    category: 'general',
    group: 'sizing',
    tooltip: 'Column width in pixels',
    clearable: true,
    metadata: {
      min: 20,
      max: 2000,
      step: 10,
      placeholder: 'Auto'
    }
  },
  {
    key: 'pinned',
    label: 'Pin Column',
    type: 'string',
    editor: 'select',
    category: 'general',
    group: 'visibility',
    defaultValue: null,
    tooltip: 'Pin column to left or right side',
    metadata: {
      options: [
        { value: null, label: 'None' },
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' }
      ]
    }
  },
  
  // Filter Properties
  {
    key: 'filter',
    label: 'Filter Type',
    type: 'string',
    editor: 'filter',
    category: 'filter',
    group: 'filter-config',
    tooltip: 'Type of filter to use',
    clearable: true,
    conditional: {
      property: 'type',
      operator: 'notEquals',
      value: 'group'
    }
  },
  
  // Editor Properties
  {
    key: 'editable',
    label: 'Editable',
    type: 'boolean',
    editor: 'boolean',
    category: 'editor',
    group: 'edit-config',
    defaultValue: false,
    tooltip: 'Allow cell editing'
  },
  {
    key: 'cellEditor',
    label: 'Cell Editor',
    type: 'string',
    editor: 'editor-type',
    category: 'editor',
    group: 'edit-config',
    tooltip: 'Type of editor to use',
    conditional: {
      property: 'editable',
      operator: 'equals',
      value: true
    },
    metadata: {
      options: [
        { value: 'agTextCellEditor', label: 'Text' },
        { value: 'agNumberCellEditor', label: 'Number' },
        { value: 'agDateCellEditor', label: 'Date' },
        { value: 'agSelectCellEditor', label: 'Select' },
        { value: 'agRichSelectCellEditor', label: 'Rich Select' },
        { value: 'agLargeTextCellEditor', label: 'Large Text' }
      ]
    }
  }
  // ... continue for all 43+ properties
];
```

## Migration Strategy

### Phase 1: Core Implementation
1. Create property grid component structure
2. Implement basic property editors
3. Set up property definitions and grouping
4. Integrate with existing store

### Phase 2: Feature Parity
1. Implement all custom editors
2. Add template system integration
3. Implement preview functionality
4. Add search and filtering

### Phase 3: Advanced Features
1. Add undo/redo support
2. Implement keyboard shortcuts
3. Add property validation
4. Optimize performance

### Phase 4: UI Polish
1. Add animations and transitions
2. Implement theme support
3. Add accessibility features
4. Create comprehensive tooltips

### Backward Compatibility
```typescript
// Wrapper component to support both UIs during transition
export const ColumnFormattingDialog: React.FC<{ mode?: 'ribbon' | 'grid' }> = ({ 
  mode = 'grid' 
}) => {
  if (mode === 'ribbon') {
    return <ColumnFormattingRibbon />;
  }
  
  return <ColumnFormattingPropertyGrid />;
};
```

## Performance Considerations

### 1. Virtual Scrolling
```typescript
// Use virtual scrolling for large property lists
import { FixedSizeList } from 'react-window';

const VirtualPropertyList: React.FC = ({ properties, itemHeight = 40 }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={properties.length}
      itemSize={itemHeight}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <PropertyEditor property={properties[index]} />
        </div>
      )}
    </FixedSizeList>
  );
};
```

### 2. Memoization
```typescript
// Memoize expensive computations
const PropertyEditor = React.memo(({ property, values, onChange }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return (
    prevProps.property.key === nextProps.property.key &&
    JSON.stringify(prevProps.values) === JSON.stringify(nextProps.values)
  );
});
```

### 3. Debounced Updates
```typescript
const useDebouncedPropertyUpdate = () => {
  const updateBulkProperty = useColumnFormattingStore(s => s.updateBulkProperty);
  
  return useMemo(
    () => debounce((property: string, value: any) => {
      updateBulkProperty(property, value);
    }, 300),
    [updateBulkProperty]
  );
};
```

## Testing Strategy

### Unit Tests
- Test each property editor component
- Test validation logic
- Test conditional display logic
- Test value transformation

### Integration Tests
- Test multi-column selection
- Test template save/load
- Test undo/redo functionality
- Test search and filter

### E2E Tests
- Test complete user workflows
- Test keyboard navigation
- Test performance with large datasets
- Test theme switching

## Accessibility

### ARIA Support
```typescript
<div
  role="tree"
  aria-label="Column properties"
  aria-multiselectable="false"
>
  <div
    role="treeitem"
    aria-expanded={expanded}
    aria-level={1}
    tabIndex={0}
  >
    {/* Property content */}
  </div>
</div>
```

### Keyboard Navigation
- Tab: Navigate between properties
- Space: Toggle boolean properties
- Enter: Open dialogs/dropdowns
- Escape: Close dialogs
- Ctrl+Z/Y: Undo/Redo

## Conclusion

This implementation maintains all features of the original Column Formatting dialog while providing:
- Better organization through property grouping
- Improved searchability
- Consistent UI with Grid Options editor
- Enhanced performance for large column sets
- Better accessibility
- More extensible architecture

The property grid approach provides a more scalable and maintainable solution while preserving the full functionality documented in the original 1000+ line specification.