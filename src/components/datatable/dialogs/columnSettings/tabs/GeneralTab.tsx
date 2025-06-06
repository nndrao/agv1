import React, { useMemo, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { MixedValueInput } from '../components/MixedValueInput';
import { NumericInput } from '../components/NumericInput';
import { ThreeStateCheckbox } from '../components/ThreeStateCheckbox';
import { Badge } from '@/components/ui/badge';

interface GeneralTabProps {
  uiMode?: 'simple' | 'advanced';
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ uiMode = 'simple' }) => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperty,
    updateBulkProperties
  } = useColumnCustomizationStore();

  // Memoized function to get mixed values for properties
  const getMixedValue = useCallback((property: string) => {
    const values = new Set();
    const allValues: unknown[] = [];

    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const pendingChange = pendingChanges.get(colId);

      // Check pending changes first, then fall back to column definition
      let value;
      if (pendingChange && property in pendingChange) {
        value = pendingChange[property as keyof typeof pendingChange];
      } else if (colDef) {
        value = colDef[property as keyof typeof colDef];
      }

      values.add(value);
      allValues.push(value);
    });

    if (values.size === 0) return { value: undefined, isMixed: false };
    if (values.size === 1) return { value: Array.from(values)[0], isMixed: false };
    return { value: undefined, isMixed: true, values: allValues };
  }, [selectedColumns, columnDefinitions, pendingChanges]);

  // Pre-compute mixed values for all properties to avoid recalculation
  const mixedValues = useMemo(() => {
    const properties = ['field', 'headerName', 'type', 'cellDataType', 'sortable', 'resizable',
                       'editable', 'filter', 'floatingFilter', 'initialWidth', 'minWidth', 'maxWidth', 'initialHide', 'initialPinned'];

    const values: Record<string, { value: unknown; isMixed: boolean; values?: unknown[] }> = {};
    properties.forEach(property => {
      values[property] = getMixedValue(property);
    });
    return values;
  }, [getMixedValue]);

  const isDisabled = selectedColumns.size === 0;
  const isMultipleSelection = selectedColumns.size > 1;

  return (
    <div className="px-6 py-4 space-y-6">
      {uiMode === 'simple' ? (
        // Simple mode - Essential properties only
        <div className="space-y-6">
          <CollapsibleSection
            id="general-basic"
            title="Basic Properties"
            description="Essential column settings"
            defaultExpanded={true}
            badge={selectedColumns.size > 1 && <Badge variant="secondary" className="text-xs">Bulk Edit</Badge>}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="headerName" className="text-sm font-medium">
                  Header Name
                  {isMultipleSelection && (
                    <span className="text-xs text-muted-foreground ml-2">(Single column only)</span>
                  )}
                </Label>
                <MixedValueInput
                  id="headerName"
                  mixedValue={mixedValues.headerName}
                  onChange={(value) => updateBulkProperty('headerName', value)}
                  disabled={isDisabled || isMultipleSelection}
                  placeholder="Display name"
                  title={isMultipleSelection ? "Header Name can only be edited for single columns" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialWidth" className="text-sm font-medium">Width</Label>
                <NumericInput
                  id="initialWidth"
                  mixedValue={mixedValues.initialWidth}
                  onChange={(value) => updateBulkProperty('initialWidth', value)}
                  min={50}
                  max={500}
                  step={10}
                  disabled={isDisabled || (isMultipleSelection && mixedValues.initialWidth.isMixed)}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <ThreeStateCheckbox
                label="Sortable"
                property="sortable"
                mixedValue={mixedValues.sortable}
                onChange={(value) => updateBulkProperty('sortable', value)}
                disabled={isDisabled || (isMultipleSelection && mixedValues.sortable.isMixed)}
                description="Allow sorting by clicking column header"
              />

              <ThreeStateCheckbox
                label="Resizable"
                property="resizable"
                mixedValue={mixedValues.resizable}
                onChange={(value) => updateBulkProperty('resizable', value)}
                disabled={isDisabled || (isMultipleSelection && mixedValues.resizable.isMixed)}
                description="Allow resizing column width by dragging"
              />

              <ThreeStateCheckbox
                label="Initially Hidden"
                property="initialHide"
                mixedValue={mixedValues.initialHide}
                onChange={(value) => updateBulkProperty('initialHide', value)}
                disabled={isDisabled || (isMultipleSelection && mixedValues.initialHide.isMixed)}
                description="Hide column on initial load"
              />

              <ThreeStateCheckbox
                label="Floating Filter"
                property="floatingFilter"
                mixedValue={mixedValues.floatingFilter}
                onChange={(checked) => {
                  // When enabling floating filter, also set appropriate filter type based on data type
                  if (checked) {
                    const updates: Record<string, unknown> = { floatingFilter: checked };
                    
                    // Get the data type of selected columns
                    const dataTypes = new Set<string>();
                    selectedColumns.forEach(colId => {
                      const colDef = columnDefinitions.get(colId);
                      const pendingChange = pendingChanges.get(colId);
                      const dataType = pendingChange?.cellDataType || colDef?.cellDataType || pendingChange?.type || colDef?.type || 'text';
                      dataTypes.add(dataType);
                    });
                    
                    // If all columns have the same data type, set appropriate filter
                    if (dataTypes.size === 1 && !mixedValues.filter.value) {
                      const dataType = Array.from(dataTypes)[0];
                      let filterType = 'agTextColumnFilter'; // default
                      
                      if (dataType === 'number' || dataType === 'numericColumn') {
                        filterType = 'agNumberColumnFilter';
                      } else if (dataType === 'date' || dataType === 'dateColumn') {
                        filterType = 'agDateColumnFilter';
                      } else if (dataType === 'boolean' || dataType === 'booleanColumn') {
                        filterType = 'agBooleanColumnFilter';
                      }
                      
                      updates.filter = filterType;
                    }
                    
                    updateBulkProperties(updates);
                  } else {
                    updateBulkProperty('floatingFilter', checked);
                  }
                }}
                disabled={isDisabled || (isMultipleSelection && mixedValues.floatingFilter.isMixed)}
                description="Show filter inputs below column headers"
              />
            </div>
          </CollapsibleSection>
        </div>
      ) : (
        // Advanced mode - All properties with better organization
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
          {/* Identity & Basic Info */}
          <CollapsibleSection
            id="general-identity"
            title="Identity & Basic Info"
            description="Core column properties"
            defaultExpanded={true}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="field" className="text-sm font-medium">Field</Label>
                <MixedValueInput
                  id="field"
                  mixedValue={mixedValues.field}
                  onChange={(value) => updateBulkProperty('field', value)}
                  disabled={true} // Field should never be editable
                  placeholder="Column field name"
                  title="Field cannot be edited"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="headerName" className="text-sm font-medium">
                  Header Name
                  {isMultipleSelection && (
                    <span className="text-xs text-muted-foreground ml-2">(Single column only)</span>
                  )}
                </Label>
                <MixedValueInput
                  id="headerName"
                  mixedValue={mixedValues.headerName}
                  onChange={(value) => updateBulkProperty('headerName', value)}
                  disabled={isDisabled || isMultipleSelection} // Disable for multiple selection
                  placeholder="Display name"
                  title={isMultipleSelection ? "Header Name can only be edited for single columns" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">Column Type</Label>
                <Select
                  value={mixedValues.type.value as string || ''}
                  onValueChange={(value) => updateBulkProperty('type', value)}
                  disabled={isDisabled || (isMultipleSelection && mixedValues.type.isMixed)}
                >
                  <SelectTrigger id="type" className={`h-9 ${mixedValues.type.isMixed ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                    <SelectValue placeholder={mixedValues.type.isMixed ? '~Mixed~' : 'Select type'} />
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
                <Label htmlFor="cellDataType" className="text-sm font-medium">Cell Data Type</Label>
                <Select
                  value={mixedValues.cellDataType.value as string || ''}
                  onValueChange={(value) => updateBulkProperty('cellDataType', value)}
                  disabled={isDisabled || (isMultipleSelection && mixedValues.cellDataType.isMixed)}
                >
                  <SelectTrigger id="cellDataType" className={`h-9 ${mixedValues.cellDataType.isMixed ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                    <SelectValue placeholder={mixedValues.cellDataType.isMixed ? '~Mixed~' : 'Select data type'} />
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
          </CollapsibleSection>

          {/* Column Sizing */}
          <CollapsibleSection
            id="general-sizing"
            title="Column Sizing"
            description="Width constraints and defaults"
            defaultExpanded={true}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="initialWidth" className="text-sm font-medium">Initial Width</Label>
                <NumericInput
                  id="initialWidth"
                  mixedValue={mixedValues.initialWidth}
                  onChange={(value) => updateBulkProperty('initialWidth', value)}
                  min={50}
                  max={500}
                  step={10}
                  disabled={isDisabled || (isMultipleSelection && mixedValues.initialWidth.isMixed)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="minWidth" className="text-sm font-medium">Min Width</Label>
                  <NumericInput
                    id="minWidth"
                    mixedValue={mixedValues.minWidth}
                    onChange={(value) => updateBulkProperty('minWidth', value)}
                    min={10}
                    max={300}
                    step={10}
                    disabled={isDisabled || (isMultipleSelection && mixedValues.minWidth.isMixed)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxWidth" className="text-sm font-medium">Max Width</Label>
                  <NumericInput
                    id="maxWidth"
                    mixedValue={mixedValues.maxWidth}
                    onChange={(value) => updateBulkProperty('maxWidth', value)}
                    min={50}
                    max={1000}
                    step={10}
                    disabled={isDisabled || (isMultipleSelection && mixedValues.maxWidth.isMixed)}
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Column Behavior */}
          <CollapsibleSection
            id="general-behavior"
            title="Column Behavior"
            description="Control how users interact with this column"
            defaultExpanded={true}
          >
            <div className="space-y-3">
              <ThreeStateCheckbox
                label="Sortable"
                property="sortable"
                mixedValue={mixedValues.sortable}
                onChange={(value) => updateBulkProperty('sortable', value)}
                disabled={isDisabled || (isMultipleSelection && mixedValues.sortable.isMixed)}
                description="Allow sorting by clicking column header"
              />

              <ThreeStateCheckbox
                label="Resizable"
                property="resizable"
                mixedValue={mixedValues.resizable}
                onChange={(value) => updateBulkProperty('resizable', value)}
                disabled={isDisabled || (isMultipleSelection && mixedValues.resizable.isMixed)}
                description="Allow resizing column width by dragging"
              />

              <ThreeStateCheckbox
                label="Editable"
                property="editable"
                mixedValue={mixedValues.editable}
                onChange={(value) => updateBulkProperty('editable', value)}
                disabled={isDisabled || (isMultipleSelection && mixedValues.editable.isMixed)}
                description="Allow cell editing"
              />

              <ThreeStateCheckbox
                label="Enable Filtering"
                property="filter"
                mixedValue={mixedValues.filter}
                onChange={(value) => updateBulkProperty('filter', value)}
                disabled={isDisabled || (isMultipleSelection && mixedValues.filter.isMixed)}
                description="Show filter in column menu"
              />

              <ThreeStateCheckbox
                label="Floating Filter"
                property="floatingFilter"
                mixedValue={mixedValues.floatingFilter}
                onChange={(checked) => {
                  // When enabling floating filter, also set appropriate filter type based on data type
                  if (checked) {
                    const updates: Record<string, unknown> = { floatingFilter: checked };
                    
                    // Get the data type of selected columns
                    const dataTypes = new Set<string>();
                    selectedColumns.forEach(colId => {
                      const colDef = columnDefinitions.get(colId);
                      const pendingChange = pendingChanges.get(colId);
                      const dataType = pendingChange?.cellDataType || colDef?.cellDataType || pendingChange?.type || colDef?.type || 'text';
                      dataTypes.add(dataType);
                    });
                    
                    // If all columns have the same data type, set appropriate filter
                    if (dataTypes.size === 1 && !mixedValues.filter.value) {
                      const dataType = Array.from(dataTypes)[0];
                      let filterType = 'agTextColumnFilter'; // default
                      
                      if (dataType === 'number' || dataType === 'numericColumn') {
                        filterType = 'agNumberColumnFilter';
                      } else if (dataType === 'date' || dataType === 'dateColumn') {
                        filterType = 'agDateColumnFilter';
                      } else if (dataType === 'boolean' || dataType === 'booleanColumn') {
                        filterType = 'agBooleanColumnFilter';
                      }
                      
                      updates.filter = filterType;
                    }
                    
                    updateBulkProperties(updates);
                  } else {
                    updateBulkProperty('floatingFilter', checked);
                  }
                }}
                disabled={isDisabled || (isMultipleSelection && mixedValues.floatingFilter.isMixed)}
                description="Show filter inputs below column headers"
              />
            </div>
          </CollapsibleSection>

          {/* Visibility & Pinning */}
          <CollapsibleSection
            id="general-visibility"
            title="Visibility & Pinning"
            description="Control column display and position"
            defaultExpanded={false}
          >
            <div className="space-y-4">
              <ThreeStateCheckbox
                label="Initially Hidden"
                property="initialHide"
                mixedValue={mixedValues.initialHide}
                onChange={(value) => updateBulkProperty('initialHide', value)}
                disabled={isDisabled || (isMultipleSelection && mixedValues.initialHide.isMixed)}
                description="Hide column on initial load"
              />

              <div className="space-y-2">
                <Label htmlFor="initialPinned" className="text-sm font-medium">Initial Pinned</Label>
                <Select
                  value={mixedValues.initialPinned.value as string || 'none'}
                  onValueChange={(value) => updateBulkProperty('initialPinned', value === 'none' ? null : value)}
                  disabled={isDisabled || (isMultipleSelection && mixedValues.initialPinned.isMixed)}
                >
                  <SelectTrigger id="initialPinned" className={`h-9 ${mixedValues.initialPinned.isMixed ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                    <SelectValue placeholder={mixedValues.initialPinned.isMixed ? '~Mixed~' : 'Not pinned'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Pinned</SelectItem>
                    <SelectItem value="left">Pin Left</SelectItem>
                    <SelectItem value="right">Pin Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      </div>
      )}
    </div>
  );
};