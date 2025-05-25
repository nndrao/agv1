import React from 'react';
import { DialogState } from '../types';
import { PropertyGroup } from '../components/PropertyGroup';
import { ThreeStateCheckbox } from '../components/ThreeStateCheckbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdvancedTabProps {
  state: DialogState;
  updateBulkProperty: (property: string, value: unknown) => void;
}

export const AdvancedTab: React.FC<AdvancedTabProps> = ({ state, updateBulkProperty }) => {
  const getMixedValue = (property: string) => {
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
  };

  const isDisabled = state.selectedColumns.size === 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <PropertyGroup title="Movement & Locking">
          <div className="space-y-3">
            <ThreeStateCheckbox
              label="Lock Position"
              property="lockPosition"
              mixedValue={getMixedValue('lockPosition')}
              onChange={(value) => updateBulkProperty('lockPosition', value)}
              disabled={isDisabled}
              description="Prevent column from being moved"
            />
            
            <ThreeStateCheckbox
              label="Suppress Movable"
              property="suppressMovable"
              mixedValue={getMixedValue('suppressMovable')}
              onChange={(value) => updateBulkProperty('suppressMovable', value)}
              disabled={isDisabled}
              description="Hide column from column tool panel"
            />
            
            <ThreeStateCheckbox
              label="Lock Visible"
              property="lockVisible"
              mixedValue={getMixedValue('lockVisible')}
              onChange={(value) => updateBulkProperty('lockVisible', value)}
              disabled={isDisabled}
              description="Prevent column from being hidden"
            />
          </div>
        </PropertyGroup>

        <PropertyGroup title="Selection">
          <div className="space-y-3">
            <ThreeStateCheckbox
              label="Checkbox Selection"
              property="checkboxSelection"
              mixedValue={getMixedValue('checkboxSelection')}
              onChange={(value) => updateBulkProperty('checkboxSelection', value)}
              disabled={isDisabled}
              description="Show checkbox for row selection"
            />
            
            <ThreeStateCheckbox
              label="Header Checkbox Selection"
              property="headerCheckboxSelection"
              mixedValue={getMixedValue('headerCheckboxSelection')}
              onChange={(value) => updateBulkProperty('headerCheckboxSelection', value)}
              disabled={isDisabled}
              description="Show select all checkbox in header"
            />
          </div>
        </PropertyGroup>

        <PropertyGroup title="Grouping & Aggregation">
          <div className="space-y-4">
            <ThreeStateCheckbox
              label="Enable Row Group"
              property="enableRowGroup"
              mixedValue={getMixedValue('enableRowGroup')}
              onChange={(value) => updateBulkProperty('enableRowGroup', value)}
              disabled={isDisabled}
              description="Allow grouping by this column"
            />
            
            <ThreeStateCheckbox
              label="Enable Pivot"
              property="enablePivot"
              mixedValue={getMixedValue('enablePivot')}
              onChange={(value) => updateBulkProperty('enablePivot', value)}
              disabled={isDisabled}
              description="Allow pivoting by this column"
            />

            <div className="space-y-2">
              <Label htmlFor="aggFunc" className="text-sm">Aggregation Function</Label>
              <Select
                value={getMixedValue('aggFunc').value as string || ''}
                onValueChange={(value) => updateBulkProperty('aggFunc', value)}
                disabled={isDisabled}
              >
                <SelectTrigger id="aggFunc" className={getMixedValue('aggFunc').isMixed ? 'bg-orange-50 dark:bg-orange-900/20' : ''}>
                  <SelectValue placeholder={getMixedValue('aggFunc').isMixed ? '~Mixed~' : 'Select function'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="min">Min</SelectItem>
                  <SelectItem value="max">Max</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="avg">Average</SelectItem>
                  <SelectItem value="first">First</SelectItem>
                  <SelectItem value="last">Last</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </PropertyGroup>

        <PropertyGroup title="Tooltips">
          <div className="space-y-3">
            <ThreeStateCheckbox
              label="Enable Tooltips"
              property="tooltipField"
              mixedValue={getMixedValue('tooltipField')}
              onChange={(value) => updateBulkProperty('tooltipField', value ? 'field' : null)}
              disabled={isDisabled}
              description="Show tooltips on hover"
            />
          </div>
        </PropertyGroup>
      </div>
    </ScrollArea>
  );
};