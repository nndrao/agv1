import React, { useMemo, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DialogState } from '../types';
import { PropertyGroup } from '../components/PropertyGroup';
import { MixedValueInput } from '../components/MixedValueInput';
import { NumericInput } from '../components/NumericInput';
import { ThreeStateCheckbox } from '../components/ThreeStateCheckbox';

interface GeneralTabProps {
  state: DialogState;
  updateBulkProperty: (property: string, value: unknown) => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ state, updateBulkProperty }) => {
  // Memoized function to get mixed values for properties
  const getMixedValue = useCallback((property: string) => {
    const values = new Set();
    const allValues: unknown[] = [];
    
    state.selectedColumns.forEach(colId => {
      const colDef = state.columnDefinitions.get(colId);
      if (colDef) {
        const value = colDef[property as keyof typeof colDef];
        values.add(value);
        allValues.push(value);
      }
    });
    
    if (values.size === 0) return { value: undefined, isMixed: false };
    if (values.size === 1) return { value: Array.from(values)[0], isMixed: false };
    return { value: undefined, isMixed: true, values: allValues };
  }, [state.selectedColumns, state.columnDefinitions]);

  // Pre-compute mixed values for all properties to avoid recalculation
  const mixedValues = useMemo(() => {
    const properties = ['field', 'headerName', 'type', 'cellDataType', 'sortable', 'resizable', 
                       'editable', 'filter', 'initialWidth', 'minWidth', 'maxWidth', 'initialHide', 'initialPinned'];
    
    const values: Record<string, { value: unknown; isMixed: boolean; values?: unknown[] }> = {};
    properties.forEach(property => {
      values[property] = getMixedValue(property);
    });
    return values;
  }, [getMixedValue]);

  const isDisabled = state.selectedColumns.size === 0;

  return (
    <div className="p-6 space-y-6">
      {/* Identity & Basic Info */}
      <PropertyGroup title="Identity & Basic Info">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="field" className="text-sm">Field</Label>
            <MixedValueInput
              id="field"
              mixedValue={mixedValues.field}
              onChange={(value) => updateBulkProperty('field', value)}
              disabled={isDisabled}
              placeholder="Column field name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="headerName" className="text-sm">Header Name</Label>
            <MixedValueInput
              id="headerName"
              mixedValue={mixedValues.headerName}
              onChange={(value) => updateBulkProperty('headerName', value)}
              disabled={isDisabled}
              placeholder="Display name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm">Column Type</Label>
            <Select
              value={mixedValues.type.value as string || ''}
              onValueChange={(value) => updateBulkProperty('type', value)}
              disabled={isDisabled}
            >
              <SelectTrigger id="type" className={mixedValues.type.isMixed ? 'bg-orange-50 dark:bg-orange-900/20' : ''}>
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
            <Label htmlFor="cellDataType" className="text-sm">Cell Data Type</Label>
            <Select
              value={mixedValues.cellDataType.value as string || ''}
              onValueChange={(value) => updateBulkProperty('cellDataType', value)}
              disabled={isDisabled}
            >
              <SelectTrigger id="cellDataType" className={mixedValues.cellDataType.isMixed ? 'bg-orange-50 dark:bg-orange-900/20' : ''}>
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
      </PropertyGroup>

      <Separator />

      {/* Column Behavior */}
      <PropertyGroup title="Column Behavior">
        <div className="space-y-3">
          <ThreeStateCheckbox
            label="Sortable"
            property="sortable"
            mixedValue={mixedValues.sortable}
            onChange={(value) => updateBulkProperty('sortable', value)}
            disabled={isDisabled}
            description="Allow sorting by clicking column header"
          />
          
          <ThreeStateCheckbox
            label="Resizable"
            property="resizable"
            mixedValue={mixedValues.resizable}
            onChange={(value) => updateBulkProperty('resizable', value)}
            disabled={isDisabled}
            description="Allow resizing column width by dragging"
          />
          
          <ThreeStateCheckbox
            label="Editable"
            property="editable"
            mixedValue={mixedValues.editable}
            onChange={(value) => updateBulkProperty('editable', value)}
            disabled={isDisabled}
            description="Allow cell editing"
          />
          
          <ThreeStateCheckbox
            label="Enable Filtering"
            property="filter"
            mixedValue={mixedValues.filter}
            onChange={(value) => updateBulkProperty('filter', value)}
            disabled={isDisabled}
            description="Show filter in column menu"
          />
        </div>
      </PropertyGroup>

      <Separator />

      {/* Column Sizing */}
      <PropertyGroup title="Column Sizing">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="initialWidth" className="text-sm">Initial Width</Label>
            <NumericInput
              id="initialWidth"
              mixedValue={mixedValues.initialWidth}
              onChange={(value) => updateBulkProperty('initialWidth', value)}
              min={50}
              max={500}
              step={10}
              disabled={isDisabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="minWidth" className="text-sm">Min Width</Label>
            <NumericInput
              id="minWidth"
              mixedValue={mixedValues.minWidth}
              onChange={(value) => updateBulkProperty('minWidth', value)}
              min={10}
              max={300}
              step={10}
              disabled={isDisabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxWidth" className="text-sm">Max Width</Label>
            <NumericInput
              id="maxWidth"
              mixedValue={mixedValues.maxWidth}
              onChange={(value) => updateBulkProperty('maxWidth', value)}
              min={50}
              max={1000}
              step={10}
              disabled={isDisabled}
            />
          </div>
        </div>
      </PropertyGroup>

      <Separator />

      {/* Visibility & Pinning */}
      <PropertyGroup title="Visibility & Pinning">
        <div className="space-y-4">
          <ThreeStateCheckbox
            label="Initially Hidden"
            property="initialHide"
            mixedValue={mixedValues.initialHide}
            onChange={(value) => updateBulkProperty('initialHide', value)}
            disabled={isDisabled}
            description="Hide column on initial load"
          />
          
          <div className="space-y-2">
            <Label htmlFor="initialPinned" className="text-sm">Initial Pinned</Label>
            <Select
              value={mixedValues.initialPinned.value as string || 'none'}
              onValueChange={(value) => updateBulkProperty('initialPinned', value === 'none' ? null : value)}
              disabled={isDisabled}
            >
              <SelectTrigger id="initialPinned" className={mixedValues.initialPinned.isMixed ? 'bg-orange-50 dark:bg-orange-900/20' : ''}>
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
      </PropertyGroup>
    </div>
  );
};