import React from 'react';
import { PropertyGroup } from '../components/PropertyGroup';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { Input } from '@/components/ui/input';

export const FiltersTab: React.FC = () => {
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

  // Check if multi column filter is selected
  const isMultiColumnFilter = getMixedValue('filter').value === 'agMultiColumnFilter';

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

  const isDisabled = selectedColumns.size === 0;

  return (
    <div className="p-6 space-y-6">
      <PropertyGroup title="Filter Configuration">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filter-type">Filter Type</Label>
            <Select
              value={getMixedValue('filter').value || ''}
              onValueChange={(value) => updateBulkProperty('filter', value)}
              disabled={isDisabled}
            >
              <SelectTrigger id="filter-type">
                <SelectValue placeholder={getMixedValue('filter').isMixed ? '~Mixed~' : 'Select filter type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agTextColumnFilter">Text Filter</SelectItem>
                <SelectItem value="agNumberColumnFilter">Number Filter</SelectItem>
                <SelectItem value="agDateColumnFilter">Date Filter</SelectItem>
                <SelectItem value="agSetColumnFilter">Set Filter</SelectItem>
                <SelectItem value="agMultiColumnFilter">Multi Column Filter</SelectItem>
                <SelectItem value="true">Default Filter</SelectItem>
                <SelectItem value="false">No Filter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ThreeStateCheckbox
            label="Enable Filtering"
            property="filter"
            mixedValue={{
              value: getMixedValue('filter').value !== false && getMixedValue('filter').value !== undefined,
              isMixed: getMixedValue('filter').isMixed
            }}
            onChange={(value) => updateBulkProperty('filter', value)}
            disabled={isDisabled}
          />

          <ThreeStateCheckbox
            label="Floating Filter"
            property="floatingFilter"
            mixedValue={getMixedValue('floatingFilter')}
            onChange={(value) => updateBulkProperty('floatingFilter', value)}
            disabled={isDisabled}
          />

          <ThreeStateCheckbox
            label="Suppress Filter Menu"
            property="suppressMenu"
            mixedValue={getMixedValue('suppressMenu')}
            onChange={(value) => updateBulkProperty('suppressMenu', value)}
            disabled={isDisabled}
          />
        </div>
      </PropertyGroup>

      {/* Multi Column Filter Options - Only show when Multi Column Filter is selected */}
      {isMultiColumnFilter && (
        <PropertyGroup title="Multi Column Filter Types">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-2">
              Select which filter types should be available in the multi-column filter:
            </p>
            
            <ThreeStateCheckbox
              label="Text Filter"
              property="filterParams.filters.text"
              mixedValue={{
                value: getMixedValue('filterParams').value?.filters?.find((f: any) => f.filter === 'agTextColumnFilter') !== undefined,
                isMixed: getMixedValue('filterParams').isMixed
              }}
              onChange={(value) => {
                const currentParams = getMixedValue('filterParams').value || {};
                let filters = Array.isArray(currentParams.filters) ? [...currentParams.filters] : [];
                
                if (value) {
                  if (!filters.find((f: any) => f.filter === 'agTextColumnFilter')) {
                    filters.push({ filter: 'agTextColumnFilter', filterParams: { filterOptions: ['contains', 'equals', 'startsWith', 'endsWith'] } });
                  }
                } else {
                  filters = filters.filter((f: any) => f.filter !== 'agTextColumnFilter');
                }
                updateBulkProperty('filterParams', { ...currentParams, filters });
              }}
              disabled={isDisabled}
            />

            <ThreeStateCheckbox
              label="Number Filter"
              property="filterParams.filters.number"
              mixedValue={{
                value: getMixedValue('filterParams').value?.filters?.find((f: any) => f.filter === 'agNumberColumnFilter') !== undefined,
                isMixed: getMixedValue('filterParams').isMixed
              }}
              onChange={(value) => {
                const currentParams = getMixedValue('filterParams').value || {};
                let filters = Array.isArray(currentParams.filters) ? [...currentParams.filters] : [];
                
                if (value) {
                  if (!filters.find((f: any) => f.filter === 'agNumberColumnFilter')) {
                    filters.push({ filter: 'agNumberColumnFilter', filterParams: { filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'] } });
                  }
                } else {
                  filters = filters.filter((f: any) => f.filter !== 'agNumberColumnFilter');
                }
                updateBulkProperty('filterParams', { ...currentParams, filters });
              }}
              disabled={isDisabled}
            />

            <ThreeStateCheckbox
              label="Date Filter"
              property="filterParams.filters.date"
              mixedValue={{
                value: getMixedValue('filterParams').value?.filters?.find((f: any) => f.filter === 'agDateColumnFilter') !== undefined,
                isMixed: getMixedValue('filterParams').isMixed
              }}
              onChange={(value) => {
                const currentParams = getMixedValue('filterParams').value || {};
                let filters = Array.isArray(currentParams.filters) ? [...currentParams.filters] : [];
                
                if (value) {
                  if (!filters.find((f: any) => f.filter === 'agDateColumnFilter')) {
                    filters.push({ filter: 'agDateColumnFilter', filterParams: { filterOptions: ['equals', 'greaterThan', 'lessThan', 'inRange'] } });
                  }
                } else {
                  filters = filters.filter((f: any) => f.filter !== 'agDateColumnFilter');
                }
                updateBulkProperty('filterParams', { ...currentParams, filters });
              }}
              disabled={isDisabled}
            />

            <ThreeStateCheckbox
              label="Set Filter"
              property="filterParams.filters.set"
              mixedValue={{
                value: getMixedValue('filterParams').value?.filters?.find((f: any) => f.filter === 'agSetColumnFilter') !== undefined,
                isMixed: getMixedValue('filterParams').isMixed
              }}
              onChange={(value) => {
                const currentParams = getMixedValue('filterParams').value || {};
                let filters = Array.isArray(currentParams.filters) ? [...currentParams.filters] : [];
                
                if (value) {
                  if (!filters.find((f: any) => f.filter === 'agSetColumnFilter')) {
                    filters.push({ filter: 'agSetColumnFilter' });
                  }
                } else {
                  filters = filters.filter((f: any) => f.filter !== 'agSetColumnFilter');
                }
                updateBulkProperty('filterParams', { ...currentParams, filters });
              }}
              disabled={isDisabled}
            />

            <div className="space-y-2 mt-4">
              <Label htmlFor="defaultFilter">Default Filter Type</Label>
              <Select
                value={getMixedValue('filterParams').value?.defaultFilter || ''}
                onValueChange={(value) => {
                  const currentParams = getMixedValue('filterParams').value || {};
                  updateBulkProperty('filterParams', { ...currentParams, defaultFilter: value });
                }}
                disabled={isDisabled}
              >
                <SelectTrigger id="defaultFilter">
                  <SelectValue placeholder={getMixedValue('filterParams').isMixed ? '~Mixed~' : 'Select default filter'} />
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
      )}

      <PropertyGroup title="Filter Parameters">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filterValueGetter">Filter Value Getter</Label>
            <Input
              id="filterValueGetter"
              value={getMixedValue('filterValueGetter').value || ''}
              onChange={(e) => updateBulkProperty('filterValueGetter', e.target.value)}
              placeholder={getMixedValue('filterValueGetter').isMixed ? '~Mixed~' : 'Enter filter value getter'}
              disabled={isDisabled}
            />
          </div>

          <ThreeStateCheckbox
            label="Menu Tabs"
            property="menuTabs"
            mixedValue={getMixedValue('menuTabs')}
            onChange={(value) => updateBulkProperty('menuTabs', value ? ['filterMenuTab', 'generalMenuTab', 'columnsMenuTab'] : undefined)}
            disabled={isDisabled}
          />

          <div className="space-y-2">
            <Label htmlFor="floatingFilterComponentParams">Floating Filter Component Params</Label>
            <Input
              id="floatingFilterComponentParams"
              value={getMixedValue('floatingFilterComponentParams').value || ''}
              onChange={(e) => updateBulkProperty('floatingFilterComponentParams', e.target.value)}
              placeholder={getMixedValue('floatingFilterComponentParams').isMixed ? '~Mixed~' : 'JSON params'}
              disabled={isDisabled}
            />
          </div>
        </div>
      </PropertyGroup>

      <PropertyGroup title="Set Filter Options">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filterParams">Filter Params (JSON)</Label>
            <Input
              id="filterParams"
              value={typeof getMixedValue('filterParams').value === 'object' 
                ? JSON.stringify(getMixedValue('filterParams').value, null, 2)
                : getMixedValue('filterParams').value || ''}
              onChange={(e) => {
                try {
                  const params = e.target.value ? JSON.parse(e.target.value) : undefined;
                  updateBulkProperty('filterParams', params);
                } catch (error) {
                  // Invalid JSON, store as string for now
                  updateBulkProperty('filterParams', e.target.value);
                }
              }}
              placeholder={getMixedValue('filterParams').isMixed ? '~Mixed~' : '{"buttons": ["apply", "reset"]}'}
              disabled={isDisabled || isMultiColumnFilter}
              title={isMultiColumnFilter ? "Filter params are managed automatically for Multi Column Filter" : ""}
            />
          </div>

          <ThreeStateCheckbox
            label="Case Sensitive Filter"
            property="filterParams.caseSensitive"
            mixedValue={{
              value: getMixedValue('filterParams').value?.caseSensitive,
              isMixed: getMixedValue('filterParams').isMixed
            }}
            onChange={(value) => {
              const currentParams = getMixedValue('filterParams').value || {};
              updateBulkProperty('filterParams', { ...currentParams, caseSensitive: value });
            }}
            disabled={isDisabled}
          />

          <ThreeStateCheckbox
            label="Show Apply Button"
            property="filterParams.buttons"
            mixedValue={{
              value: getMixedValue('filterParams').value?.buttons?.includes('apply'),
              isMixed: getMixedValue('filterParams').isMixed
            }}
            onChange={(value) => {
              const currentParams = getMixedValue('filterParams').value || {};
              const buttons = currentParams.buttons || [];
              if (value && !buttons.includes('apply')) {
                buttons.push('apply');
              } else if (!value) {
                const index = buttons.indexOf('apply');
                if (index > -1) buttons.splice(index, 1);
              }
              updateBulkProperty('filterParams', { ...currentParams, buttons });
            }}
            disabled={isDisabled}
          />

          <ThreeStateCheckbox
            label="Show Reset Button"
            property="filterParams.buttons"
            mixedValue={{
              value: getMixedValue('filterParams').value?.buttons?.includes('reset'),
              isMixed: getMixedValue('filterParams').isMixed
            }}
            onChange={(value) => {
              const currentParams = getMixedValue('filterParams').value || {};
              const buttons = currentParams.buttons || [];
              if (value && !buttons.includes('reset')) {
                buttons.push('reset');
              } else if (!value) {
                const index = buttons.indexOf('reset');
                if (index > -1) buttons.splice(index, 1);
              }
              updateBulkProperty('filterParams', { ...currentParams, buttons });
            }}
            disabled={isDisabled}
          />
        </div>
      </PropertyGroup>
    </div>
  );
};