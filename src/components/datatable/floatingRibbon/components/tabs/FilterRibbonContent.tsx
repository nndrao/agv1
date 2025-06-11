import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Filter,
  Type,
  Hash,
  Calendar,
  ListFilter,
  Settings,
  Sparkles,
  ToggleLeft,
  X,
  ChevronDown,
  Plus
} from 'lucide-react';
import { useColumnCustomizationStore } from '../../../columnCustomizations/store/columnCustomization.store';
import type { FilterTabProps } from '../../types';
import '../../ribbon-styles.css';

// Filter types with icons
const FILTER_TYPES = [
  { value: 'agTextColumnFilter', label: 'Text Filter', icon: Type },
  { value: 'agNumberColumnFilter', label: 'Number Filter', icon: Hash },
  { value: 'agDateColumnFilter', label: 'Date Filter', icon: Calendar },
  { value: 'agBooleanColumnFilter', label: 'Boolean Filter', icon: ToggleLeft },
  { value: 'agSetColumnFilter', label: 'Set Filter', icon: ListFilter },
  { value: 'agMultiColumnFilter', label: 'Multi Filter', icon: Settings }
];

interface MultiFilterConfig {
  filter: string;
  display?: 'inline' | 'subMenu' | 'accordion';
  title?: string;
}

export const FilterRibbonContent: React.FC<FilterTabProps> = ({ selectedColumns }) => {
  const { updateBulkProperty, columnDefinitions, pendingChanges } = useColumnCustomizationStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedMultiFilter, setExpandedMultiFilter] = useState(false);
  const [multiFilters, setMultiFilters] = useState<MultiFilterConfig[]>([
    { filter: 'agTextColumnFilter', display: 'subMenu' },
    { filter: 'agSetColumnFilter', display: 'inline' }
  ]);

  // Helper function to get mixed values for multi-column editing
  const getMixedValueLocal = (property: string) => {
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
  };

  const filterValue = getMixedValueLocal('filter');
  const floatingFilterValue = getMixedValueLocal('floatingFilter');
  const suppressMenuButtonValue = getMixedValueLocal('suppressHeaderMenuButton');
  const suppressFiltersPanelValue = getMixedValueLocal('suppressFiltersToolPanel');
  const filterParamsValue = getMixedValueLocal('filterParams');

  const handleFilterTypeChange = (value: string) => {
    if (value === 'none') {
      updateBulkProperty('filter', undefined);
      updateBulkProperty('filterParams', undefined);
    } else {
      updateBulkProperty('filter', value);
      // Set default filter params based on type
      const defaultParams = getDefaultFilterParams(value);
      if (defaultParams) {
        updateBulkProperty('filterParams', defaultParams);
      }
    }
  };

  const getDefaultFilterParams = (filterType: string) => {
    switch (filterType) {
      case 'agTextColumnFilter':
        return {
          filterOptions: ['contains', 'equals', 'startsWith', 'endsWith'],
          defaultOption: 'contains',
          trimInput: true,
          caseSensitive: false,
          debounceMs: 200
        };
      case 'agNumberColumnFilter':
        return {
          filterOptions: ['equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'inRange'],
          defaultOption: 'equals',
          allowedCharPattern: '[\\d\\-\\.\\,]',
          numberParser: (text: string) => parseFloat(text)
        };
      case 'agDateColumnFilter':
        return {
          filterOptions: ['equals', 'notEqual', 'lessThan', 'greaterThan', 'inRange'],
          defaultOption: 'equals',
          comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
            const cellDate = new Date(cellValue);
            if (cellDate < filterLocalDateAtMidnight) return -1;
            if (cellDate > filterLocalDateAtMidnight) return 1;
            return 0;
          }
        };
      case 'agSetColumnFilter':
        return {
          suppressMiniFilter: false,
          suppressSelectAll: false,
          suppressSorting: false
        };
      case 'agMultiColumnFilter':
        return {
          filters: multiFilters
        };
      default:
        return undefined;
    }
  };

  const getCurrentFilterType = () => {
    if (filterValue.isMixed) return '';
    return filterValue.value as string || 'none';
  };

  const currentFilterParams = filterParamsValue.value as Record<string, any> || {};

  const handleFilterParamChange = (param: string, value: any) => {
    const newParams = { ...currentFilterParams, [param]: value };
    updateBulkProperty('filterParams', newParams);
  };

  const addMultiFilter = () => {
    const newFilter: MultiFilterConfig = { filter: 'agTextColumnFilter', display: 'inline' };
    const newFilters = [...multiFilters, newFilter];
    setMultiFilters(newFilters);
    handleFilterParamChange('filters', newFilters);
  };

  const removeMultiFilter = (index: number) => {
    const newFilters = multiFilters.filter((_, i) => i !== index);
    setMultiFilters(newFilters);
    handleFilterParamChange('filters', newFilters);
  };

  const updateMultiFilter = (index: number, field: keyof MultiFilterConfig, value: string) => {
    const newFilters = [...multiFilters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setMultiFilters(newFilters);
    handleFilterParamChange('filters', newFilters);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: Filter Type Selection as Dropdown */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Filter className="ribbon-icon text-muted-foreground" />
          <Label className="ribbon-section-header">FILTER TYPE</Label>
          <Select
            value={getCurrentFilterType()}
            onValueChange={handleFilterTypeChange}
          >
            <SelectTrigger className="ribbon-select-trigger flex-1">
              <SelectValue placeholder="Select filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <X className="ribbon-icon-xs" />
                  <span>No Filter</span>
                </div>
              </SelectItem>
              <Separator className="my-1" />
              {FILTER_TYPES.map((filter) => {
                const Icon = filter.icon;
                return (
                  <SelectItem key={filter.value} value={filter.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="ribbon-icon-xs" />
                      <span>{filter.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Filter Options */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="floating-filter">Floating</Label>
            <Switch 
              id="floating-filter"
              checked={!floatingFilterValue.isMixed && floatingFilterValue.value === true}
              onCheckedChange={(checked) => updateBulkProperty('floatingFilter', checked)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="hide-menu">Hide Menu</Label>
            <Switch 
              id="hide-menu"
              checked={!suppressMenuButtonValue.isMixed && suppressMenuButtonValue.value === true}
              onCheckedChange={(checked) => updateBulkProperty('suppressHeaderMenuButton', checked)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="hide-panel">Hide Panel</Label>
            <Switch 
              id="hide-panel"
              checked={!suppressFiltersPanelValue.isMixed && suppressFiltersPanelValue.value === true}
              onCheckedChange={(checked) => updateBulkProperty('suppressFiltersToolPanel', checked)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {getCurrentFilterType() !== 'agMultiColumnFilter' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="ribbon-action-secondary"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="ribbon-icon-xs mr-1" />
              Advanced
              <ChevronDown className={`ribbon-icon-xs ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={() => {
              updateBulkProperty('filter', 'agSetColumnFilter');
              updateBulkProperty('filterParams', getDefaultFilterParams('agSetColumnFilter'));
            }}
            title="Enable Set Filter with Search"
          >
            <Sparkles className="ribbon-icon-xs" />
          </Button>
        </div>
      </div>
      
      {/* Row 2: Filter Parameters - only show for specific filter types */}
      {getCurrentFilterType() !== 'none' && getCurrentFilterType() !== '' && getCurrentFilterType() !== 'agMultiColumnFilter' && (
        <div className="px-3 py-2 bg-muted/30 rounded-md">
          <div className="flex items-center gap-4">
            {/* Text Filter Options */}
            {getCurrentFilterType() === 'agTextColumnFilter' && (
              <div className="flex items-center gap-3 flex-1">
                <Label>Default</Label>
                <Select
                  value={currentFilterParams.defaultOption || 'contains'}
                  onValueChange={(value) => handleFilterParamChange('defaultOption', value)}
                >
                  <SelectTrigger className="h-7 w-[100px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="startsWith">Starts With</SelectItem>
                    <SelectItem value="endsWith">Ends With</SelectItem>
                    <SelectItem value="notContains">Not Contains</SelectItem>
                    <SelectItem value="notEqual">Not Equal</SelectItem>
                    <SelectItem value="blank">Blank</SelectItem>
                    <SelectItem value="notBlank">Not Blank</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2">
                  <Label>Trim</Label>
                  <Switch 
                    className="" 
                    checked={currentFilterParams.trimInput !== false}
                    onCheckedChange={(checked) => handleFilterParamChange('trimInput', checked)}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Label>Case Sensitive</Label>
                  <Switch 
                    className="" 
                    checked={currentFilterParams.caseSensitive === true}
                    onCheckedChange={(checked) => handleFilterParamChange('caseSensitive', checked)}
                  />
                </div>
              </div>
            )}
            
            {/* Number Filter Options */}
            {getCurrentFilterType() === 'agNumberColumnFilter' && (
              <div className="flex items-center gap-3 flex-1">
                <Label>Default</Label>
                <Select
                  value={currentFilterParams.defaultOption || 'equals'}
                  onValueChange={(value) => handleFilterParamChange('defaultOption', value)}
                >
                  <SelectTrigger className="h-7 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="notEqual">Not Equal</SelectItem>
                    <SelectItem value="lessThan">Less Than</SelectItem>
                    <SelectItem value="lessThanOrEqual">≤ Less or Equal</SelectItem>
                    <SelectItem value="greaterThan">Greater Than</SelectItem>
                    <SelectItem value="greaterThanOrEqual">≥ Greater or Equal</SelectItem>
                    <SelectItem value="inRange">In Range</SelectItem>
                    <SelectItem value="blank">Blank</SelectItem>
                    <SelectItem value="notBlank">Not Blank</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2">
                  <Label>Include Blanks</Label>
                  <Switch 
                    className="" 
                    checked={currentFilterParams.includeBlanksInEquals === true}
                    onCheckedChange={(checked) => handleFilterParamChange('includeBlanksInEquals', checked)}
                  />
                </div>
              </div>
            )}
            
            {/* Date Filter Options */}
            {getCurrentFilterType() === 'agDateColumnFilter' && (
              <div className="flex items-center gap-3 flex-1">
                <Label>Default</Label>
                <Select
                  value={currentFilterParams.defaultOption || 'equals'}
                  onValueChange={(value) => handleFilterParamChange('defaultOption', value)}
                >
                  <SelectTrigger className="h-7 w-[100px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="notEqual">Not Equal</SelectItem>
                    <SelectItem value="lessThan">Before</SelectItem>
                    <SelectItem value="greaterThan">After</SelectItem>
                    <SelectItem value="inRange">Between</SelectItem>
                    <SelectItem value="blank">Blank</SelectItem>
                    <SelectItem value="notBlank">Not Blank</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2">
                  <Label>Format</Label>
                  <Input 
                    className="h-7 w-[100px] text-xs"
                    placeholder="YYYY-MM-DD"
                    value={currentFilterParams.dateFormat || ''}
                    onChange={(e) => handleFilterParamChange('dateFormat', e.target.value)}
                  />
                </div>
              </div>
            )}
            
            {/* Set Filter Options */}
            {getCurrentFilterType() === 'agSetColumnFilter' && (
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <Label>Search</Label>
                  <Switch 
                    className="" 
                    checked={currentFilterParams.suppressMiniFilter !== true}
                    onCheckedChange={(checked) => handleFilterParamChange('suppressMiniFilter', !checked)}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Label>Select All</Label>
                  <Switch 
                    className="" 
                    checked={currentFilterParams.suppressSelectAll !== true}
                    onCheckedChange={(checked) => handleFilterParamChange('suppressSelectAll', !checked)}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Label>Sort</Label>
                  <Switch 
                    className="" 
                    checked={currentFilterParams.suppressSorting !== true}
                    onCheckedChange={(checked) => handleFilterParamChange('suppressSorting', !checked)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Row 3: Multi Filter Configuration - Ribbon Style */}
      {getCurrentFilterType() === 'agMultiColumnFilter' && (
        <div className="flex flex-col gap-2">
          {/* Multi Filter Quick Config */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Settings className="ribbon-icon text-muted-foreground" />
              <Label className="ribbon-section-header">FILTERS</Label>
            </div>
            
            {/* Show first 2 filters inline */}
            <div className="flex items-center gap-2 flex-1">
              {multiFilters.slice(0, 2).map((filterConfig, index) => {
                const filterType = FILTER_TYPES.find(f => f.value === filterConfig.filter);
                const Icon = filterType?.icon || Filter;
                return (
                  <div key={index} className="flex items-center gap-1 px-2 py-1 bg-muted/30 rounded-md">
                    <Icon className="h-3 w-3" />
                    <span className="text-xs">{filterType?.label || 'Filter'}</span>
                    {multiFilters.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMultiFilter(index)}
                        className="h-4 w-4 p-0 ml-1"
                      >
                        <X className="ribbon-icon-xs" />
                      </Button>
                    )}
                  </div>
                );
              })}
              
              {multiFilters.length > 2 && (
                <span className="text-xs text-muted-foreground">+{multiFilters.length - 2} more</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="ribbon-action-secondary"
                onClick={addMultiFilter}
                disabled={multiFilters.length >= 4}
              >
                <Plus className="ribbon-icon-xs mr-1" />
                Add
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="ribbon-action-secondary"
                onClick={() => setExpandedMultiFilter(!expandedMultiFilter)}
              >
                <Settings className="ribbon-icon-xs mr-1" />
                Configure
                <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${expandedMultiFilter ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
          
          {/* Expanded Multi Filter Config */}
          {expandedMultiFilter && (
            <div className="px-3 py-2 bg-muted/30 rounded-md">
              <div className="grid grid-cols-2 gap-3">
                {multiFilters.map((filterConfig, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground w-12">F{index + 1}:</Label>
                    <Select
                      value={filterConfig.filter}
                      onValueChange={(value) => updateMultiFilter(index, 'filter', value)}
                    >
                      <SelectTrigger className="ribbon-select-trigger flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FILTER_TYPES.filter(f => f.value !== 'agMultiColumnFilter').map((filter) => {
                          const Icon = filter.icon;
                          return (
                            <SelectItem key={filter.value} value={filter.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="ribbon-icon-xs" />
                                <span>{filter.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Select
                      value={filterConfig.display || 'inline'}
                      onValueChange={(value) => updateMultiFilter(index, 'display', value)}
                    >
                      <SelectTrigger className="h-7 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inline">Tabs</SelectItem>
                        <SelectItem value="subMenu">Menu</SelectItem>
                        <SelectItem value="accordion">Accordion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Hide Buttons:</Label>
                  <Switch 
                    className="" 
                    checked={currentFilterParams.hideChildFilterButtons === true}
                    onCheckedChange={(checked) => handleFilterParamChange('hideChildFilterButtons', checked)}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Default Display:</Label>
                  <Select
                    value={currentFilterParams.display || 'inline'}
                    onValueChange={(value) => handleFilterParamChange('display', value)}
                  >
                    <SelectTrigger className="h-7 w-20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inline">Tabs</SelectItem>
                      <SelectItem value="subMenu">Menu</SelectItem>
                      <SelectItem value="accordion">Accordion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Row 4: Advanced Options - Ribbon Style */}
      {showAdvanced && getCurrentFilterType() !== 'none' && getCurrentFilterType() !== 'agMultiColumnFilter' && (
        <div className="px-3 py-2 bg-muted/30 rounded-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Debounce</Label>
              <Input 
                type="number"
                className="h-7 w-16 text-xs"
                value={currentFilterParams.debounceMs || 200}
                onChange={(e) => handleFilterParamChange('debounceMs', parseInt(e.target.value))}
              />
              <span className="text-xs text-muted-foreground">ms</span>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label>Clear Button</Label>
                <Switch 
                  className="" 
                  checked={currentFilterParams.buttons?.includes('clear') !== false}
                  onCheckedChange={(checked) => {
                    const buttons = checked ? ['clear', 'apply'] : ['apply'];
                    handleFilterParamChange('buttons', buttons);
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label>Close on Apply</Label>
                <Switch 
                  className="" 
                  checked={currentFilterParams.closeOnApply === true}
                  onCheckedChange={(checked) => handleFilterParamChange('closeOnApply', checked)}
                />
              </div>
            </div>
            
            {/* Set Filter specific options */}
            {getCurrentFilterType() === 'agSetColumnFilter' && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Excel Mode:</Label>
                    <Select
                      value={currentFilterParams.excelMode || 'windows'}
                      onValueChange={(value) => handleFilterParamChange('excelMode', value)}
                    >
                      <SelectTrigger className="h-7 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="windows">Windows</SelectItem>
                        <SelectItem value="mac">Mac</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">New Rows:</Label>
                    <Select
                      value={currentFilterParams.newRowsAction || 'keep'}
                      onValueChange={(value) => handleFilterParamChange('newRowsAction', value)}
                    >
                      <SelectTrigger className="h-7 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keep">Keep</SelectItem>
                        <SelectItem value="clear">Clear</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};