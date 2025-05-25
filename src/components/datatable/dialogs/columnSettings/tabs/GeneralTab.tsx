import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { PropertyGroup } from '../components/PropertyGroup';
import { MixedValueInput } from '../components/MixedValueInput';
import { NumericInput } from '../components/NumericInput';

export const GeneralTab: React.FC = () => {
  const { selectedColumns, columnDefinitions, updateBulkProperty, pendingChanges } = useColumnCustomizationStore();
  
  // Get mixed values for each property (considering pending changes)
  const getMixedValue = (property: string) => {
    const values = new Set();
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const pending = pendingChanges.get(colId);
      
      if (colDef) {
        // Use pending value if it exists, otherwise use original value
        const value = pending?.[property as keyof typeof pending] ?? colDef[property as keyof typeof colDef];
        values.add(value);
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
          
          <ThreeStateCheckbox
            label="Floating Filter"
            property="floatingFilter"
            mixedValue={getMixedValue('floatingFilter')}
            onChange={(value) => updateBulkProperty('floatingFilter', value)}
            disabled={selectedColumns.size === 0}
          />
          
          <ThreeStateCheckbox
            label="Enable Row Group"
            property="enableRowGroup"
            mixedValue={getMixedValue('enableRowGroup')}
            onChange={(value) => updateBulkProperty('enableRowGroup', value)}
            disabled={selectedColumns.size === 0}
          />
          
          <ThreeStateCheckbox
            label="Enable Pivot"
            property="enablePivot"
            mixedValue={getMixedValue('enablePivot')}
            onChange={(value) => updateBulkProperty('enablePivot', value)}
            disabled={selectedColumns.size === 0}
          />
          
          <ThreeStateCheckbox
            label="Enable Value"
            property="enableValue"
            mixedValue={getMixedValue('enableValue')}
            onChange={(value) => updateBulkProperty('enableValue', value)}
            disabled={selectedColumns.size === 0}
          />
        </div>
      </PropertyGroup>

      <Separator />

      {/* Column Sizing */}
      <PropertyGroup title="Column Sizing">
        <div className="grid grid-cols-3 gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="flex">Flex</Label>
            <NumericInput
              id="flex"
              property="flex"
              mixedValue={getMixedValue('flex')}
              onChange={(value) => updateBulkProperty('flex', value)}
              min={0}
              max={10}
              step={1}
              disabled={selectedColumns.size === 0}
            />
          </div>
        </div>
      </PropertyGroup>

      <Separator />

      {/* Additional Properties */}
      <PropertyGroup title="Additional Properties">
        <div className="space-y-4">
          <ThreeStateCheckbox
            label="Lock Position"
            property="lockPosition"
            mixedValue={getMixedValue('lockPosition')}
            onChange={(value) => updateBulkProperty('lockPosition', value)}
            disabled={selectedColumns.size === 0}
          />
          
          <ThreeStateCheckbox
            label="Lock Visible"
            property="lockVisible"
            mixedValue={getMixedValue('lockVisible')}
            onChange={(value) => updateBulkProperty('lockVisible', value)}
            disabled={selectedColumns.size === 0}
          />
          
          <ThreeStateCheckbox
            label="Suppress Menu"
            property="suppressMenu"
            mixedValue={getMixedValue('suppressMenu')}
            onChange={(value) => updateBulkProperty('suppressMenu', value)}
            disabled={selectedColumns.size === 0}
          />

          <ThreeStateCheckbox
            label="Auto Height"
            property="autoHeight"
            mixedValue={getMixedValue('autoHeight')}
            onChange={(value) => updateBulkProperty('autoHeight', value)}
            disabled={selectedColumns.size === 0}
          />

          <ThreeStateCheckbox
            label="Wrap Text"
            property="wrapText"
            mixedValue={getMixedValue('wrapText')}
            onChange={(value) => updateBulkProperty('wrapText', value)}
            disabled={selectedColumns.size === 0}
          />
        </div>
      </PropertyGroup>
    </div>
  );
};

// Three-State Checkbox Component
const ThreeStateCheckbox: React.FC<{
  label: string;
  property: string;
  mixedValue: { value: boolean | undefined; isMixed: boolean };
  onChange: (value: boolean) => void;
  disabled?: boolean;
}> = ({ label, property, mixedValue, onChange, disabled }) => {
  const checkboxState = mixedValue.isMixed 
    ? "indeterminate" 
    : mixedValue.value === true;
  
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={property}
        checked={checkboxState}
        onCheckedChange={(checked) => onChange(!!checked)}
        disabled={disabled}
      />
      <Label htmlFor={property} className="text-sm font-normal cursor-pointer">
        {label}
      </Label>
    </div>
  );
};