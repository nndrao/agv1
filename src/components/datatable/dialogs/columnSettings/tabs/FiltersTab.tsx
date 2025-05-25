import React from 'react';
import { DialogState } from '../types';
import { PropertyGroup } from '../components/PropertyGroup';
import { ThreeStateCheckbox } from '../components/ThreeStateCheckbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FiltersTabProps {
  state: DialogState;
  updateBulkProperty: (property: string, value: unknown) => void;
}

export const FiltersTab: React.FC<FiltersTabProps> = ({ state, updateBulkProperty }) => {
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
    <div className="p-6 space-y-6">
      <PropertyGroup title="Filter Setup">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filterType" className="text-sm">Filter Type</Label>
            <Select
              value={getMixedValue('filter').value as string || ''}
              onValueChange={(value) => updateBulkProperty('filter', value)}
              disabled={isDisabled}
            >
              <SelectTrigger id="filterType" className={getMixedValue('filter').isMixed ? 'bg-orange-50 dark:bg-orange-900/20' : ''}>
                <SelectValue placeholder={getMixedValue('filter').isMixed ? '~Mixed~' : 'Select filter'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agTextColumnFilter">Text Filter</SelectItem>
                <SelectItem value="agNumberColumnFilter">Number Filter</SelectItem>
                <SelectItem value="agDateColumnFilter">Date Filter</SelectItem>
                <SelectItem value="agSetColumnFilter">Set Filter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PropertyGroup>

      <PropertyGroup title="Floating Filter">
        <div className="space-y-3">
          <ThreeStateCheckbox
            label="Enable Floating Filter"
            property="floatingFilter"
            mixedValue={getMixedValue('floatingFilter')}
            onChange={(value) => updateBulkProperty('floatingFilter', value)}
            disabled={isDisabled}
            description="Show filter input below column header"
          />
          
          <ThreeStateCheckbox
            label="Suppress Floating Filter Button"
            property="suppressFloatingFilterButton"
            mixedValue={getMixedValue('suppressFloatingFilterButton')}
            onChange={(value) => updateBulkProperty('suppressFloatingFilterButton', value)}
            disabled={isDisabled}
            description="Hide the floating filter button"
          />
        </div>
      </PropertyGroup>
    </div>
  );
};