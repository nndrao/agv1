# AG-Grid Column Customization Dialog - Implementation Guide

## Project Setup and Dependencies

### 1. Initialize Project with Required Dependencies

```bash
# Create a new React TypeScript project
npx create-react-app ag-grid-column-dialog --template typescript

# Install core dependencies
npm install ag-grid-react ag-grid-enterprise ag-grid-community
npm install @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-checkbox
npm install @radix-ui/react-select @radix-ui/react-tooltip @radix-ui/react-popover
npm install @radix-ui/react-switch @radix-ui/react-radio-group
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install zustand immer react-hook-form zod
npm install @tanstack/react-virtual lodash debounce
npm install @monaco-editor/react react-color

# Install shadcn/ui CLI
npx shadcn-ui@latest init

# Add required shadcn components
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add select
npx shadcn-ui@latest add input
npx shadcn-ui@latest add button
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add toast
```

### 2. Configure AG-Grid License

```typescript
// src/config/ag-grid-license.ts
import { LicenseManager } from 'ag-grid-enterprise';

LicenseManager.setLicenseKey('YOUR_LICENSE_KEY_HERE');
```

## Core Type Definitions

### 3. Create Type Definitions

```typescript
// src/types/column-customization.types.ts
import { ColDef, ColumnApi, GridApi } from 'ag-grid-community';

export interface DialogState {
  // Selection state
  selectedColumns: Set<string>;
  columnDefinitions: Map<string, ColDef>;
  
  // Edit state
  pendingChanges: Map<string, Partial<ColDef>>;
  bulkChanges: Partial<ColDef>;
  applyMode: 'override' | 'merge' | 'empty';
  
  // UI state
  activeTab: string;
  searchTerm: string;
  groupBy: 'none' | 'type' | 'dataType';
  showOnlyCommon: boolean;
  compareMode: boolean;
  
  // History
  undoStack: ChangeSet[];
  redoStack: ChangeSet[];
}

export interface ChangeSet {
  timestamp: number;
  changes: Map<string, Partial<ColDef>>;
  description: string;
}

export interface ColumnGroup {
  name: string;
  icon: string;
  columns: ColDef[];
  expanded: boolean;
}

export interface PropertyDefinition {
  name: keyof ColDef;
  label: string;
  type: 'boolean' | 'string' | 'number' | 'select' | 'style' | 'function' | 'json';
  group: string;
  tab: string;
  options?: { value: any; label: string }[];
  validation?: (value: any) => boolean | string;
  description?: string;
}

export interface MixedValueInfo {
  hasMultipleValues: boolean;
  values: any[];
  commonValue?: any;
}
```

## State Management Setup

### 4. Create Zustand Store with Immer

```typescript
// src/store/column-customization.store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ColDef } from 'ag-grid-community';
import { DialogState, ChangeSet } from '@/types/column-customization.types';

interface ColumnCustomizationStore extends DialogState {
  // Actions
  setSelectedColumns: (columns: string[]) => void;
  toggleColumnSelection: (columnId: string) => void;
  selectAllColumns: () => void;
  deselectAllColumns: () => void;
  
  updateColumnProperty: (columnId: string, property: string, value: any) => void;
  updateBulkProperty: (property: string, value: any) => void;
  
  applyChanges: () => void;
  discardChanges: () => void;
  
  undo: () => void;
  redo: () => void;
  
  setActiveTab: (tab: string) => void;
  setSearchTerm: (term: string) => void;
  setGroupBy: (groupBy: 'none' | 'type' | 'dataType') => void;
  setApplyMode: (mode: 'override' | 'merge' | 'empty') => void;
}

export const useColumnCustomizationStore = create<ColumnCustomizationStore>()(
  immer((set, get) => ({
    // Initial state
    selectedColumns: new Set(),
    columnDefinitions: new Map(),
    pendingChanges: new Map(),
    bulkChanges: {},
    applyMode: 'override',
    activeTab: 'general',
    searchTerm: '',
    groupBy: 'none',
    showOnlyCommon: false,
    compareMode: false,
    undoStack: [],
    redoStack: [],
    
    // Action implementations
    setSelectedColumns: (columns) => set((state) => {
      state.selectedColumns = new Set(columns);
    }),
    
    toggleColumnSelection: (columnId) => set((state) => {
      if (state.selectedColumns.has(columnId)) {
        state.selectedColumns.delete(columnId);
      } else {
        state.selectedColumns.add(columnId);
      }
    }),
    
    // ... implement other actions
  }))
);
```

## Main Dialog Component

### 5. Create Main Dialog Component

```typescript
// src/components/column-customization/ColumnCustomizationDialog.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useColumnCustomizationStore } from '@/store/column-customization.store';
import { ColumnSelectorPanel } from './panels/ColumnSelectorPanel';
import { PropertyEditorPanel } from './panels/PropertyEditorPanel';
import { BulkActionsPanel } from './panels/BulkActionsPanel';
import { GridApi, ColumnApi } from 'ag-grid-community';

interface ColumnCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gridApi: GridApi;
  columnApi: ColumnApi;
}

export const ColumnCustomizationDialog: React.FC<ColumnCustomizationDialogProps> = ({
  open,
  onOpenChange,
  gridApi,
  columnApi
}) => {
  const {
    selectedColumns,
    activeTab,
    setActiveTab,
    applyChanges,
    discardChanges,
    undo,
    redo,
    undoStack,
    redoStack
  } = useColumnCustomizationStore();

  const selectedCount = selectedColumns.size;
  const totalColumns = columnApi.getAllColumns()?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[1400px] h-[85vh] p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            Column Customization - {selectedCount} of {totalColumns} columns selected
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Column Selector Panel */}
          <div className="w-[280px] border-r bg-gray-50 dark:bg-gray-900">
            <ColumnSelectorPanel gridApi={gridApi} columnApi={columnApi} />
          </div>

          {/* Property Editor Panel */}
          <div className="flex-1 overflow-hidden">
            <PropertyEditorPanel />
          </div>

          {/* Bulk Actions Panel */}
          <div className="w-[280px] border-l bg-gray-50 dark:bg-gray-900">
            <BulkActionsPanel />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={undoStack.length === 0}
            >
              ↶ Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={redoStack.length === 0}
            >
              ↷ Redo
            </Button>
            <Button variant="outline" size="sm">
              👁️ Preview
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={discardChanges}>
              Reset
            </Button>
            <Button variant="default" onClick={applyChanges}>
              Apply
            </Button>
            <Button 
              variant="default" 
              onClick={() => {
                applyChanges();
                onOpenChange(false);
              }}
            >
              Apply & Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

## Column Selector Panel

### 6. Create Column Selector Panel

```typescript
// src/components/column-customization/panels/ColumnSelectorPanel.tsx
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useColumnCustomizationStore } from '@/store/column-customization.store';
import { ColDef, GridApi, ColumnApi } from 'ag-grid-community';

interface ColumnSelectorPanelProps {
  gridApi: GridApi;
  columnApi: ColumnApi;
}

export const ColumnSelectorPanel: React.FC<ColumnSelectorPanelProps> = ({ gridApi, columnApi }) => {
  const {
    selectedColumns,
    searchTerm,
    groupBy,
    setSearchTerm,
    setGroupBy,
    toggleColumnSelection,
    selectAllColumns,
    deselectAllColumns
  } = useColumnCustomizationStore();

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Get all columns
  const allColumns = useMemo(() => {
    return columnApi.getAllColumns()?.map(col => col.getColDef()) || [];
  }, [columnApi]);

  // Filter columns based on search
  const filteredColumns = useMemo(() => {
    if (!searchTerm) return allColumns;
    
    const term = searchTerm.toLowerCase();
    return allColumns.filter(col => 
      col.field?.toLowerCase().includes(term) ||
      col.headerName?.toLowerCase().includes(term)
    );
  }, [allColumns, searchTerm]);

  // Group columns
  const groupedColumns = useMemo(() => {
    if (groupBy === 'none') {
      return [{ name: 'All Columns', columns: filteredColumns, icon: '📋' }];
    }
    
    // Group by type or dataType
    const groups = new Map<string, ColDef[]>();
    
    filteredColumns.forEach(col => {
      const groupKey = groupBy === 'type' ? col.type || 'default' : col.cellDataType || 'text';
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(col);
    });
    
    return Array.from(groups.entries()).map(([key, cols]) => ({
      name: key,
      columns: cols,
      icon: getIconForType(key)
    }));
  }, [filteredColumns, groupBy]);

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search columns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selection Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedColumns.size === allColumns.length && allColumns.length > 0}
            indeterminate={selectedColumns.size > 0 && selectedColumns.size < allColumns.length}
            onCheckedChange={(checked) => {
              if (checked) {
                selectAllColumns();
              } else {
                deselectAllColumns();
              }
            }}
          />
          <span className="text-sm">Select All</span>
        </div>
        
        <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Grouping</SelectItem>
            <SelectItem value="type">Group by Type</SelectItem>
            <SelectItem value="dataType">Group by Data Type</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Column List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {groupedColumns.map((group) => (
            <div key={group.name}>
              {groupBy !== 'none' && (
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="flex items-center gap-2 w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                >
                  {expandedGroups.has(group.name) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="text-sm font-medium">
                    {group.icon} {group.name} ({group.columns.length})
                  </span>
                </button>
              )}
              
              {(groupBy === 'none' || expandedGroups.has(group.name)) && (
                <div className="space-y-1 ml-6">
                  {group.columns.map((col) => (
                    <ColumnItem
                      key={col.field || col.colId}
                      column={col}
                      selected={selectedColumns.has(col.field || col.colId || '')}
                      onToggle={() => toggleColumnSelection(col.field || col.colId || '')}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Save Selection Set */}
      <Button variant="outline" className="mt-4 w-full" size="sm">
        💾 Save Selection Set
      </Button>
    </div>
  );
};

// Column Item Component
const ColumnItem: React.FC<{
  column: ColDef;
  selected: boolean;
  onToggle: () => void;
}> = ({ column, selected, onToggle }) => {
  return (
    <div className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
      <Checkbox checked={selected} onCheckedChange={onToggle} />
      <span className="text-sm flex-1">{column.headerName || column.field}</span>
      <span className="text-xs text-gray-500">{getIconForType(column.cellDataType || 'text')}</span>
    </div>
  );
};

// Helper function to get icons
const getIconForType = (type: string): string => {
  const icons: Record<string, string> = {
    'number': '📊',
    'currency': '💰',
    'date': '📅',
    'text': '📝',
    'boolean': '✓',
    'object': '📦',
    'default': '📋'
  };
  return icons[type] || icons.default;
};
```

## Property Editor Panel

### 7. Create Property Editor Panel with Tabs

```typescript
// src/components/column-customization/panels/PropertyEditorPanel.tsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useColumnCustomizationStore } from '@/store/column-customization.store';
import { GeneralTab } from '../tabs/GeneralTab';
import { StylingTab } from '../tabs/StylingTab';
import { ValueFormattersTab } from '../tabs/ValueFormattersTab';
import { FiltersTab } from '../tabs/FiltersTab';
import { EditorsTab } from '../tabs/EditorsTab';
import { AdvancedTab } from '../tabs/AdvancedTab';

export const PropertyEditorPanel: React.FC = () => {
  const { selectedColumns, activeTab, setActiveTab } = useColumnCustomizationStore();
  
  const selectedCount = selectedColumns.size;

  return (
    <div className="h-full flex flex-col">
      {/* Selected Columns Header */}
      <div className="px-6 py-4 border-b">
        <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">
          {selectedCount === 0 ? 'No columns selected' : 
           selectedCount === 1 ? '1 column selected' : 
           `${selectedCount} columns selected`}
        </h3>
      </div>

      {/* Mixed Values Warning */}
      {selectedCount > 1 && (
        <Alert className="mx-6 mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Mixed values are shown with a "~Mixed~" placeholder. Editing will apply to all selected columns.
          </AlertDescription>
        </Alert>
      )}

      {/* Property Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-6 mt-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="styling">Styling</TabsTrigger>
          <TabsTrigger value="formatters">Formatters</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="editors">Editors</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="general" className="h-full">
            <GeneralTab />
          </TabsContent>
          <TabsContent value="styling" className="h-full">
            <StylingTab />
          </TabsContent>
          <TabsContent value="formatters" className="h-full">
            <ValueFormattersTab />
          </TabsContent>
          <TabsContent value="filters" className="h-full">
            <FiltersTab />
          </TabsContent>
          <TabsContent value="editors" className="h-full">
            <EditorsTab />
          </TabsContent>
          <TabsContent value="advanced" className="h-full">
            <AdvancedTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
```

## General Tab Implementation

### 8. Create General Tab Component

```typescript
// src/components/column-customization/tabs/GeneralTab.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useColumnCustomizationStore } from '@/store/column-customization.store';
import { PropertyGroup } from '../components/PropertyGroup';
import { MixedValueInput } from '../components/MixedValueInput';
import { NumericInput } from '../components/NumericInput';

export const GeneralTab: React.FC = () => {
  const { selectedColumns, columnDefinitions, updateBulkProperty, pendingChanges } = useColumnCustomizationStore();
  
  // Get mixed values for each property
  const getMixedValue = (property: string) => {
    const values = new Set();
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      if (colDef) {
        values.add(colDef[property as keyof typeof colDef]);
      }
    });
    
    if (values.size === 0) return { value: undefined, isMixed: false };
    if (values.size === 1) return { value: Array.from(values)[0], isMixed: false };
    return { value: undefined, isMixed: true, values: Array.from(values) };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Identity & Basic Info */}
      <PropertyGroup title="Identity & Basic Info">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="field">Field</Label>
            <MixedValueInput
              id="field"
              property="field"
              mixedValue={getMixedValue('field')}
              onChange={(value) => updateBulkProperty('field', value)}
              disabled={selectedColumns.size === 0}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="headerName">Header Name</Label>
            <MixedValueInput
              id="headerName"
              property="headerName"
              mixedValue={getMixedValue('headerName')}
              onChange={(value) => updateBulkProperty('headerName', value)}
              disabled={selectedColumns.size === 0}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={getMixedValue('type').value || ''}
              onValueChange={(value) => updateBulkProperty('type', value)}
              disabled={selectedColumns.size === 0}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder={getMixedValue('type').isMixed ? '~Mixed~' : 'Select type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="numericColumn">Numeric Column</SelectItem>
                <SelectItem value="dateColumn">Date Column</SelectItem>
                <SelectItem value="textColumn">Text Column</SelectItem>
                <SelectItem value="booleanColumn">Boolean Column</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cellDataType">Cell Data Type</Label>
            <Select
              value={getMixedValue('cellDataType').value || ''}
              onValueChange={(value) => updateBulkProperty('cellDataType', value)}
              disabled={selectedColumns.size === 0}
            >
              <SelectTrigger id="cellDataType">
                <SelectValue placeholder={getMixedValue('cellDataType').isMixed ? '~Mixed~' : 'Select data type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="dateString">Date String</SelectItem>
                <SelectItem value="object">Object</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PropertyGroup>

      <Separator />

      {/* Column Behavior */}
      <PropertyGroup title="Column Behavior">
        <div className="space-y-4">
          <ThreeStateCheckbox
            label="Sortable"
            property="sortable"
            mixedValue={getMixedValue('sortable')}
            onChange={(value) => updateBulkProperty('sortable', value)}
            disabled={selectedColumns.size === 0}
          />
          
          <ThreeStateCheckbox
            label="Resizable"
            property="resizable"
            mixedValue={getMixedValue('resizable')}
            onChange={(value) => updateBulkProperty('resizable', value)}
            disabled={selectedColumns.size === 0}
          />
          
          <ThreeStateCheckbox
            label="Editable"
            property="editable"
            mixedValue={getMixedValue('editable')}
            onChange={(value) => updateBulkProperty('editable', value)}
            disabled={selectedColumns.size === 0}
          />
          
          <ThreeStateCheckbox
            label="Enable Filtering"
            property="filter"
            mixedValue={getMixedValue('filter')}
            onChange={(value) => updateBulkProperty('filter', value)}
            disabled={selectedColumns.size === 0}
          />
        </div>
      </PropertyGroup>

      <Separator />

      {/* Sizing */}
      <PropertyGroup title="Column Sizing">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="initialWidth">Initial Width</Label>
            <NumericInput
              id="initialWidth"
              property="initialWidth"
              mixedValue={getMixedValue('initialWidth')}
              onChange={(value) => updateBulkProperty('initialWidth', value)}
              min={50}
              max={500}
              step={10}
              disabled={selectedColumns.size === 0}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="minWidth">Min Width</Label>
            <NumericInput
              id="minWidth"
              property="minWidth"
              mixedValue={getMixedValue('minWidth')}
              onChange={(value) => updateBulkProperty('minWidth', value)}
              min={10}
              max={300}
              step={10}
              disabled={selectedColumns.size === 0}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxWidth">Max Width</Label>
            <NumericInput
              id="maxWidth"
              property="maxWidth"
              mixedValue={getMixedValue('maxWidth')}
              onChange={(value) => updateBulkProperty('maxWidth', value)}
              min={50}
              max={1000}
              step={10}
              disabled={selectedColumns.size === 0}
            />
          </div>
        </div>
      </PropertyGroup>

      <Separator />

      {/* Visibility */}
      <PropertyGroup title="Visibility & Pinning">
        <div className="space-y-4">
          <ThreeStateCheckbox
            label="Initially Hidden"
            property="initialHide"
            mixedValue={getMixedValue('initialHide')}
            onChange={(value) => updateBulkProperty('initialHide', value)}
            disabled={selectedColumns.size === 0}
          />
          
          <div className="space-y-2">
            <Label htmlFor="initialPinned">Initial Pinned</Label>
            <Select
              value={getMixedValue('initialPinned').value || ''}
              onValueChange={(value) => updateBulkProperty('initialPinned', value === 'none' ? null : value)}
              disabled={selectedColumns.size === 0}
            >
              <SelectTrigger id="initialPinned">
                <SelectValue placeholder={getMixedValue('initialPinned').isMixed ? '~Mixed~' : 'Not pinned'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not Pinned</SelectItem>
                <SelectItem value="left">Pin Left</SelectItem>
                <SelectItem value="right">Pin Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PropertyGroup>
    </div>
  );
};

// Three-State Checkbox Component
const ThreeStateCheckbox: React.FC<{
  label: string;
  property: string;
  mixedValue: { value: any; isMixed: boolean };
  onChange: (value: boolean) => void;
  disabled?: boolean;
}> = ({ label, property, mixedValue, onChange, disabled }) => {
  const isChecked = mixedValue.isMixed ? 'indeterminate' : mixedValue.value;
  
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={property}
        checked={isChecked === true}
        indeterminate={isChecked === 'indeterminate'}
        onCheckedChange={(checked) => onChange(!!checked)}
        disabled={disabled}
      />
      <Label htmlFor={property} className="text-sm font-normal cursor-pointer">
        {label}
      </Label>
    </div>
  );
};
```

## Bulk Actions Panel

### 9. Create Bulk Actions Panel

```typescript
// src/components/column-customization/panels/BulkActionsPanel.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useColumnCustomizationStore } from '@/store/column-customization.store';

export const BulkActionsPanel: React.FC = () => {
  const {
    applyMode,
    setApplyMode,
    pendingChanges,
    selectedColumns
  } = useColumnCustomizationStore();

  // Quick templates
  const templates = [
    { id: 'numeric', label: 'Numeric', icon: '📊' },
    { id: 'currency', label: 'Currency', icon: '💰' },
    { id: 'date', label: 'Date', icon: '📅' },
    { id: 'text', label: 'Text', icon: '📝' },
  ];

  // Calculate changes preview
  const changesPreview = Array.from(pendingChanges.entries()).map(([colId, changes]) => ({
    colId,
    changes: Object.entries(changes).map(([key, value]) => ({
      property: key,
      value: value
    }))
  }));

  return (
    <div className="h-full flex flex-col p-4">
      {/* Quick Templates */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Quick Templates</h3>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => {
                // Apply template logic
                console.log('Apply template:', template.id);
              }}
            >
              <span className="mr-2">{template.icon}</span>
              {template.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Bulk Apply Mode */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Bulk Apply Mode</h3>
        <RadioGroup value={applyMode} onValueChange={(value: any) => setApplyMode(value)}>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="override" id="override" />
              <Label htmlFor="override" className="text-sm font-normal">
                Override All
                <span className="block text-xs text-gray-500">Replace all values</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="merge" id="merge" />
              <Label htmlFor="merge" className="text-sm font-normal">
                Merge Changes
                <span className="block text-xs text-gray-500">Only update modified properties</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="empty" id="empty" />
              <Label htmlFor="empty" className="text-sm font-normal">
                Only Empty
                <span className="block text-xs text-gray-500">Only set undefined properties</span>
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Copy Settings From */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Copy Settings From</h3>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a column" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price">Price Column</SelectItem>
            <SelectItem value="date">Date Column</SelectItem>
            <SelectItem value="status">Status Column</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Changes Preview */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-sm font-medium mb-3">Changes Preview</h3>
        <ScrollArea className="flex-1 border rounded-md p-3 bg-gray-50 dark:bg-gray-900">
          {changesPreview.length === 0 ? (
            <p className="text-sm text-gray-500">No pending changes</p>
          ) : (
            <div className="space-y-2">
              {changesPreview.map(({ colId, changes }) => (
                <div key={colId} className="text-sm">
                  <div className="font-medium mb-1">{colId}</div>
                  {changes.map(({ property, value }) => (
                    <div key={property} className="ml-3 text-xs text-gray-600 dark:text-gray-400">
                      • {property} → {JSON.stringify(value)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {selectedColumns.size > 0 && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            {selectedColumns.size} column{selectedColumns.size !== 1 ? 's' : ''} affected
          </div>
        )}
      </div>
    </div>
  );
};
```

## Style Editor Component

### 10. Create Style Editor Popout

```typescript
// src/components/column-customization/editors/StyleEditor.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HexColorPicker } from 'react-colorful';
import MonacoEditor from '@monaco-editor/react';

interface StyleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStyle?: React.CSSProperties;
  onSave: (style: React.CSSProperties) => void;
  title: string;
}

export const StyleEditor: React.FC<StyleEditorProps> = ({
  open,
  onOpenChange,
  initialStyle = {},
  onSave,
  title
}) => {
  const [style, setStyle] = useState<React.CSSProperties>(initialStyle);
  const [cssText, setCssText] = useState(convertStyleToCss(initialStyle));
  const [activeTab, setActiveTab] = useState('visual');

  // Typography state
  const [enableFont, setEnableFont] = useState(!!style.fontFamily);
  const [enableFontSize, setEnableFontSize] = useState(!!style.fontSize);
  const [enableFontWeight, setEnableFontWeight] = useState(!!style.fontWeight);

  // Color state
  const [enableColor, setEnableColor] = useState(!!style.color);
  const [enableBackground, setEnableBackground] = useState(!!style.backgroundColor);

  // Border state
  const [enableBorder, setEnableBorder] = useState(!!style.border);
  const [borderSides, setBorderSides] = useState<'all' | 'individual'>('all');

  const updateStyle = (property: keyof React.CSSProperties, value: any) => {
    const newStyle = { ...style, [property]: value };
    if (value === undefined || value === '') {
      delete newStyle[property];
    }
    setStyle(newStyle);
    setCssText(convertStyleToCss(newStyle));
  };

  const handleCssChange = (css: string) => {
    setCssText(css);
    // Parse CSS back to style object
    try {
      const styleObj = parseCssToStyle(css);
      setStyle(styleObj);
    } catch (e) {
      // Invalid CSS, don't update style
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-full">
          {/* Editor Panel */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="visual">Visual Editor</TabsTrigger>
                <TabsTrigger value="css">CSS Editor</TabsTrigger>
              </TabsList>

              <TabsContent value="visual" className="h-[450px] overflow-auto">
                {/* Typography Section */}
                <div className="space-y-4 p-4">
                  <h3 className="font-medium">Typography</h3>
                  
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={enableFont}
                      onCheckedChange={setEnableFont}
                    />
                    <Label className="flex-1">Font Family</Label>
                    <Select
                      value={style.fontFamily as string || ''}
                      onValueChange={(value) => updateStyle('fontFamily', value)}
                      disabled={!enableFont}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4">
                    <Switch
                      checked={enableFontSize}
                      onCheckedChange={setEnableFontSize}
                    />
                    <Label className="flex-1">Font Size</Label>
                    <Input
                      type="number"
                      value={parseInt(style.fontSize as string) || 14}
                      onChange={(e) => updateStyle('fontSize', `${e.target.value}px`)}
                      disabled={!enableFontSize}
                      className="w-[100px]"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Switch
                      checked={enableFontWeight}
                      onCheckedChange={setEnableFontWeight}
                    />
                    <Label className="flex-1">Font Weight</Label>
                    <Select
                      value={style.fontWeight as string || 'normal'}
                      onValueChange={(value) => updateStyle('fontWeight', value)}
                      disabled={!enableFontWeight}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="lighter">Lighter</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="300">300</SelectItem>
                        <SelectItem value="400">400</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                        <SelectItem value="600">600</SelectItem>
                        <SelectItem value="700">700</SelectItem>
                        <SelectItem value="800">800</SelectItem>
                        <SelectItem value="900">900</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Alignment Section */}
                  <h3 className="font-medium mt-6">Alignment</h3>
                  
                  <div className="flex items-center gap-4">
                    <Label className="w-32">Text Align</Label>
                    <Select
                      value={style.textAlign as string || 'left'}
                      onValueChange={(value) => updateStyle('textAlign', value)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                        <SelectItem value="justify">Justify</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Colors Section */}
                  <h3 className="font-medium mt-6">Colors</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={enableColor}
                        onCheckedChange={setEnableColor}
                      />
                      <Label className="w-32">Text Color</Label>
                      {enableColor && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded border cursor-pointer"
                            style={{ backgroundColor: style.color as string || '#000000' }}
                          />
                          <Input
                            value={style.color as string || '#000000'}
                            onChange={(e) => updateStyle('color', e.target.value)}
                            className="w-[100px]"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <Switch
                        checked={enableBackground}
                        onCheckedChange={setEnableBackground}
                      />
                      <Label className="w-32">Background</Label>
                      {enableBackground && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded border cursor-pointer"
                            style={{ backgroundColor: style.backgroundColor as string || '#ffffff' }}
                          />
                          <Input
                            value={style.backgroundColor as string || '#ffffff'}
                            onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                            className="w-[100px]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="css" className="h-[450px]">
                <MonacoEditor
                  height="100%"
                  language="css"
                  theme="vs-dark"
                  value={cssText}
                  onChange={(value) => handleCssChange(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="w-[300px] border-l pl-4">
            <h3 className="font-medium mb-4">Preview</h3>
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              <div style={style} className="p-4 text-center">
                Sample Content
              </div>
            </div>

            <h3 className="font-medium mt-6 mb-2">CSS Output</h3>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-[200px]">
              {cssText}
            </pre>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            onSave(style);
            onOpenChange(false);
          }}>
            Apply Style
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper functions
function convertStyleToCss(style: React.CSSProperties): string {
  return Object.entries(style)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value};`;
    })
    .join('\n');
}

function parseCssToStyle(css: string): React.CSSProperties {
  const style: any = {};
  css.split(';').forEach(rule => {
    const [key, value] = rule.split(':').map(s => s.trim());
    if (key && value) {
      const jsKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      style[jsKey] = value;
    }
  });
  return style;
}
```

## Custom Components

### 11. Create Reusable Custom Components

```typescript
// src/components/column-customization/components/MixedValueInput.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MixedValueInputProps {
  id: string;
  property: string;
  mixedValue: {
    value: any;
    isMixed: boolean;
    values?: any[];
  };
  onChange: (value: any) => void;
  disabled?: boolean;
  type?: string;
}

export const MixedValueInput: React.FC<MixedValueInputProps> = ({
  id,
  property,
  mixedValue,
  onChange,
  disabled,
  type = 'text'
}) => {
  const displayValue = mixedValue.isMixed ? '' : (mixedValue.value || '');
  const placeholder = mixedValue.isMixed ? '~Mixed~' : 'Enter value';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Input
            id={id}
            type={type}
            value={displayValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={mixedValue.isMixed ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
          />
        </TooltipTrigger>
        {mixedValue.isMixed && mixedValue.values && (
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium mb-1">Current values:</div>
              {mixedValue.values.map((val, idx) => (
                <div key={idx}>{JSON.stringify(val)}</div>
              ))}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

// src/components/column-customization/components/PropertyGroup.tsx
import React from 'react';

interface PropertyGroupProps {
  title: string;
  children: React.ReactNode;
}

export const PropertyGroup: React.FC<PropertyGroupProps> = ({ title, children }) => {
  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
        {title}
      </h3>
      <div className="pl-2">
        {children}
      </div>
    </div>
  );
};

// src/components/column-customization/components/NumericInput.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface NumericInputProps {
  id: string;
  property: string;
  mixedValue: {
    value: any;
    isMixed: boolean;
    values?: any[];
  };
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  id,
  property,
  mixedValue,
  onChange,
  min = 0,
  max = 1000,
  step = 1,
  disabled
}) => {
  const value = mixedValue.isMixed ? '' : (mixedValue.value || '');
  
  const handleIncrement = () => {
    const current = mixedValue.isMixed ? min : (Number(mixedValue.value) || min);
    onChange(Math.min(current + step, max));
  };
  
  const handleDecrement = () => {
    const current = mixedValue.isMixed ? max : (Number(mixedValue.value) || max);
    onChange(Math.max(current - step, min));
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleDecrement}
        disabled={disabled}
      >
        <Minus className="h-3 w-3" />
      </Button>
      
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={mixedValue.isMixed ? '~Mixed~' : '0'}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={`text-center ${mixedValue.isMixed ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
      />
      
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleIncrement}
        disabled={disabled}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
};
```

## Performance Optimization Utilities

### 12. Create Performance Utilities

```typescript
// src/utils/performance.ts
import { useCallback, useEffect, useRef } from 'react';
import debounce from 'lodash/debounce';

// Custom hook for debounced updates
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  return useCallback(
    debounce((...args: Parameters<T>) => {
      callbackRef.current(...args);
    }, delay),
    [delay]
  ) as T;
}

// Batch update utility
export class BatchUpdater<T> {
  private updates: Map<string, T> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private callback: (updates: Map<string, T>) => void;
  private delay: number;

  constructor(callback: (updates: Map<string, T>) => void, delay: number = 100) {
    this.callback = callback;
    this.delay = delay;
  }

  add(key: string, update: T) {
    this.updates.set(key, update);
    this.scheduleFlush();
  }

  private scheduleFlush() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    
    this.timer = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush() {
    if (this.updates.size > 0) {
      const updates = new Map(this.updates);
      this.updates.clear();
      this.callback(updates);
    }
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  clear() {
    this.updates.clear();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

// Virtual scrolling helper
export function getVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);
  
  return { start, end };
}
```

## Integration with AG-Grid

### 13. Create AG-Grid Integration Hook

```typescript
// src/hooks/useColumnCustomization.ts
import { useCallback, useEffect } from 'react';
import { GridApi, ColumnApi, ColDef } from 'ag-grid-community';
import { useColumnCustomizationStore } from '@/store/column-customization.store';

export function useColumnCustomization(gridApi: GridApi, columnApi: ColumnApi) {
  const store = useColumnCustomizationStore();

  // Initialize store with current column definitions
  useEffect(() => {
    if (!columnApi) return;

    const columns = columnApi.getAllColumns();
    const columnDefs = new Map<string, ColDef>();
    
    columns?.forEach(col => {
      const colDef = col.getColDef();
      const colId = colDef.field || colDef.colId || '';
      columnDefs.set(colId, colDef);
    });

    store.columnDefinitions = columnDefs;
  }, [columnApi]);

  // Apply changes to grid
  const applyChangesToGrid = useCallback(() => {
    const { pendingChanges } = store;
    
    if (pendingChanges.size === 0) return;

    const columnDefs: ColDef[] = [];
    
    pendingChanges.forEach((changes, colId) => {
      const currentDef = store.columnDefinitions.get(colId);
      if (currentDef) {
        columnDefs.push({
          ...currentDef,
          ...changes
        });
      }
    });

    // Update grid column definitions
    gridApi.setColumnDefs(columnDefs);
    
    // Clear pending changes
    store.pendingChanges.clear();
    
    // Add to undo stack
    store.undoStack.push({
      timestamp: Date.now(),
      changes: new Map(pendingChanges),
      description: `Updated ${pendingChanges.size} columns`
    });
    
    // Clear redo stack
    store.redoStack = [];
  }, [gridApi, store]);

  return {
    applyChanges: applyChangesToGrid,
    store
  };
}
```

## Usage Example

### 14. Example Implementation

```typescript
// src/App.tsx
import React, { useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { GridApi, ColumnApi } from 'ag-grid-community';
import { Button } from '@/components/ui/button';
import { ColumnCustomizationDialog } from '@/components/column-customization/ColumnCustomizationDialog';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

function App() {
  const [showCustomization, setShowCustomization] = useState(false);
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [columnApi, setColumnApi] = useState<ColumnApi | null>(null);

  const columnDefs = [
    { field: 'make', headerName: 'Make' },
    { field: 'model', headerName: 'Model' },
    { field: 'price', headerName: 'Price', cellDataType: 'number' },
    { field: 'year', headerName: 'Year', cellDataType: 'number' },
    { field: 'date', headerName: 'Date', cellDataType: 'date' },
  ];

  const rowData = [
    { make: 'Toyota', model: 'Celica', price: 35000, year: 2022, date: '2022-01-15' },
    { make: 'Ford', model: 'Mondeo', price: 32000, year: 2021, date: '2021-06-20' },
    { make: 'Porsche', model: 'Boxster', price: 72000, year: 2023, date: '2023-03-10' },
  ];

  const onGridReady = (params: any) => {
    setGridApi(params.api);
    setColumnApi(params.columnApi);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b">
        <Button onClick={() => setShowCustomization(true)}>
          Customize Columns
        </Button>
      </div>
      
      <div className="flex-1 ag-theme-alpine">
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={rowData}
          onGridReady={onGridReady}
        />
      </div>

      {gridApi && columnApi && (
        <ColumnCustomizationDialog
          open={showCustomization}
          onOpenChange={setShowCustomization}
          gridApi={gridApi}
          columnApi={columnApi}
        />
      )}
    </div>
  );
}

export default App;
```

## Additional Implementation Notes

### Key Implementation Considerations:

1. **State Management**: The Zustand store with Immer provides immutable state updates and easy undo/redo functionality.

2. **Performance**: 
   - Virtual scrolling for column lists
   - Debounced property updates
   - Batch API calls to AG-Grid
   - Memoized computations

3. **Accessibility**:
   - Proper ARIA labels
   - Keyboard navigation support
   - Focus management
   - Screen reader compatibility

4. **Error Handling**:
   - Property validation
   - Conflict resolution for mixed values
   - User-friendly error messages

5. **Extensibility**:
   - Plugin system for custom property editors
   - Template system for quick configurations
   - Export/import functionality

This implementation guide provides a solid foundation for building the AG-Grid column customization dialog with all the features specified in the design document.