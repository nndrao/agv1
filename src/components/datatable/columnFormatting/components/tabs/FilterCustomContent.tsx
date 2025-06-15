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
  Plus,
  RotateCcw
} from 'lucide-react';
import { useColumnFormattingStore } from '../../store/columnFormatting.store';
import type { FilterTabProps } from '../../types';
import '../../custom-styles.css';

// Filter types with icons
const FILTER_TYPES = [
  { value: 'agTextColumnFilter', label: 'Text Filter', icon: Type, description: 'Filter text values' },
  { value: 'agNumberColumnFilter', label: 'Number Filter', icon: Hash, description: 'Filter numeric values' },
  { value: 'agDateColumnFilter', label: 'Date Filter', icon: Calendar, description: 'Filter date values' },
  { value: 'agSetColumnFilter', label: 'Set Filter', icon: ListFilter, description: 'Select from list' },
  { value: 'agBooleanColumnFilter', label: 'Boolean Filter', icon: ToggleLeft, description: 'True/False filter' },
  { value: 'agMultiColumnFilter', label: 'Multi Filter', icon: Settings, description: 'Combine multiple filters' }
];

interface MultiFilterConfig {
  filter: string;
  display?: 'inline' | 'subMenu' | 'accordion';
  title?: string;
}

export const FilterCustomContent: React.FC<FilterTabProps> = ({ selectedColumns }) => {
  const { updateBulkProperty, columnDefinitions, pendingChanges } = useColumnFormattingStore();
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

  const resetFilter = () => {
    updateBulkProperty('filter', undefined);
    updateBulkProperty('filterParams', undefined);
    updateBulkProperty('floatingFilter', false);
    updateBulkProperty('suppressHeaderMenuButton', false);
    updateBulkProperty('suppressFiltersToolPanel', false);
    setShowAdvanced(false);
    setExpandedMultiFilter(false);
  };

  return (
    <div className="flex h-full gap-4">
      {/* Main controls section */}
      <div className="flex-1">

        {/* Main content - Grid layout */}
        <div className="space-y-3">
          {/* Filter Type and Options Row */}
          <div className="flex items-center gap-4">
            {/* Filter Type Selector */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">FILTER TYPE</Label>
              <Select
                value={getCurrentFilterType()}
                onValueChange={handleFilterTypeChange}
              >
                <SelectTrigger className="h-7 w-40 text-xs">
                  <SelectValue placeholder="Select filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <X className="h-3 w-3" />
                      <span>No Filter</span>
                    </div>
                  </SelectItem>
                  <Separator className="my-1" />
                  {FILTER_TYPES.map((filter) => {
                    const Icon = filter.icon;
                    return (
                      <SelectItem key={filter.value} value={filter.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-3 w-3" />
                          <span>{filter.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Floating Filter */}
            <div className="flex items-center gap-2">
              <Label htmlFor="floating-filter" className="text-xs">Floating</Label>
              <Switch 
                id="floating-filter"
                checked={!floatingFilterValue.isMixed && floatingFilterValue.value === true}
                onCheckedChange={(checked) => updateBulkProperty('floatingFilter', checked)}
                className="h-4 w-7"
              />
            </div>

            {/* Hide Menu Button */}
            <div className="flex items-center gap-2">
              <Label htmlFor="hide-menu" className="text-xs">Hide Menu</Label>
              <Switch 
                id="hide-menu"
                checked={!suppressMenuButtonValue.isMixed && suppressMenuButtonValue.value === true}
                onCheckedChange={(checked) => updateBulkProperty('suppressHeaderMenuButton', checked)}
                className="h-4 w-7"
              />
            </div>

            {/* Hide Filter Panel */}
            <div className="flex items-center gap-2">
              <Label htmlFor="hide-panel" className="text-xs">Hide Panel</Label>
              <Switch 
                id="hide-panel"
                checked={!suppressFiltersPanelValue.isMixed && suppressFiltersPanelValue.value === true}
                onCheckedChange={(checked) => updateBulkProperty('suppressFiltersToolPanel', checked)}
                className="h-4 w-7"
              />
            </div>

            {/* Advanced and Reset Buttons */}
            <div className="ml-auto flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-3 text-xs"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="h-3 w-3 mr-1" />
                Advanced
                <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilter}
                className="h-7 w-7 p-0"
                title="Reset"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Default Option and Filter-specific controls */}
          {(getCurrentFilterType() === 'agTextColumnFilter' || 
            getCurrentFilterType() === 'agNumberColumnFilter' || 
            getCurrentFilterType() === 'agDateColumnFilter') && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Default</Label>
                <Select
                  value={currentFilterParams.defaultOption || 'contains'}
                  onValueChange={(value) => handleFilterParamChange('defaultOption', value)}
                >
                  <SelectTrigger className="h-7 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getCurrentFilterType() === 'agTextColumnFilter' && (
                      <>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="startsWith">Starts With</SelectItem>
                        <SelectItem value="endsWith">Ends With</SelectItem>
                        <SelectItem value="notContains">Not Contains</SelectItem>
                        <SelectItem value="notEqual">Not Equal</SelectItem>
                        <SelectItem value="blank">Blank</SelectItem>
                        <SelectItem value="notBlank">Not Blank</SelectItem>
                      </>
                    )}
                    {getCurrentFilterType() === 'agNumberColumnFilter' && (
                      <>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="notEqual">Not Equal</SelectItem>
                        <SelectItem value="lessThan">Less Than</SelectItem>
                        <SelectItem value="lessThanOrEqual">≤ Less or Equal</SelectItem>
                        <SelectItem value="greaterThan">Greater Than</SelectItem>
                        <SelectItem value="greaterThanOrEqual">≥ Greater or Equal</SelectItem>
                        <SelectItem value="inRange">In Range</SelectItem>
                        <SelectItem value="blank">Blank</SelectItem>
                        <SelectItem value="notBlank">Not Blank</SelectItem>
                      </>
                    )}
                    {getCurrentFilterType() === 'agDateColumnFilter' && (
                      <>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="notEqual">Not Equal</SelectItem>
                        <SelectItem value="lessThan">Before</SelectItem>
                        <SelectItem value="greaterThan">After</SelectItem>
                        <SelectItem value="inRange">Between</SelectItem>
                        <SelectItem value="blank">Blank</SelectItem>
                        <SelectItem value="notBlank">Not Blank</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Text Filter specific options */}
              {getCurrentFilterType() === 'agTextColumnFilter' && (
                <>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="trim-input" className="text-xs">Trim</Label>
                    <Switch 
                      id="trim-input"
                      checked={currentFilterParams.trimInput !== false}
                      onCheckedChange={(checked) => handleFilterParamChange('trimInput', checked)}
                      className="h-4 w-7"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="case-sensitive" className="text-xs">Case Sensitive</Label>
                    <Switch 
                      id="case-sensitive"
                      checked={currentFilterParams.caseSensitive === true}
                      onCheckedChange={(checked) => handleFilterParamChange('caseSensitive', checked)}
                      className="h-4 w-7"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Set Filter specific options */}
          {getCurrentFilterType() === 'agSetColumnFilter' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="mini-filter" className="text-xs">Search Box</Label>
                <Switch 
                  id="mini-filter"
                  checked={currentFilterParams.suppressMiniFilter !== true}
                  onCheckedChange={(checked) => handleFilterParamChange('suppressMiniFilter', !checked)}
                  className="h-4 w-7"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="select-all" className="text-xs">Select All</Label>
                <Switch 
                  id="select-all"
                  checked={currentFilterParams.suppressSelectAll !== true}
                  onCheckedChange={(checked) => handleFilterParamChange('suppressSelectAll', !checked)}
                  className="h-4 w-7"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="sorting" className="text-xs">Sort Values</Label>
                <Switch 
                  id="sorting"
                  checked={currentFilterParams.suppressSorting !== true}
                  onCheckedChange={(checked) => handleFilterParamChange('suppressSorting', !checked)}
                  className="h-4 w-7"
                />
              </div>
            </div>
          )}


          {/* Multi Filter Configuration */}
          {getCurrentFilterType() === 'agMultiColumnFilter' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="ribbon-section-header">FILTER CONFIGURATION</Label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={addMultiFilter}
                    disabled={multiFilters.length >= 4}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Filter
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={() => setExpandedMultiFilter(!expandedMultiFilter)}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                    <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${expandedMultiFilter ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Filter List */}
              <div className="grid grid-cols-2 gap-2">
                {multiFilters.map((filterConfig, index) => {
                  const filterType = FILTER_TYPES.find(f => f.value === filterConfig.filter);
                  const Icon = filterType?.icon || Filter;
                  return (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted/20 rounded border">
                      <Icon className="h-3 w-3" />
                      <span className="text-xs flex-1">{filterType?.label || 'Filter'}</span>
                      <span className="text-xs text-muted-foreground">{filterConfig.display || 'inline'}</span>
                      {multiFilters.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMultiFilter(index)}
                          className="h-5 w-5 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Expanded Configuration */}
              {expandedMultiFilter && (
                <div className="border rounded-md p-3 bg-muted/5 space-y-3">
                  {multiFilters.map((filterConfig, index) => (
                    <div key={index} className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Filter {index + 1} Type</Label>
                        <Select
                          value={filterConfig.filter}
                          onValueChange={(value) => updateMultiFilter(index, 'filter', value)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FILTER_TYPES.filter(f => f.value !== 'agMultiColumnFilter').map((filter) => {
                              const Icon = filter.icon;
                              return (
                                <SelectItem key={filter.value} value={filter.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-3 w-3" />
                                    <span>{filter.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Display Mode</Label>
                        <Select
                          value={filterConfig.display || 'inline'}
                          onValueChange={(value) => updateMultiFilter(index, 'display', value)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inline">Tabs</SelectItem>
                            <SelectItem value="subMenu">Sub Menu</SelectItem>
                            <SelectItem value="accordion">Accordion</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Advanced Settings Panel */}
          {showAdvanced && getCurrentFilterType() !== 'none' && getCurrentFilterType() !== 'agMultiColumnFilter' && (
            <div className="border rounded-md p-3 space-y-3 bg-muted/5">
              <div className="flex items-center gap-4">
                {/* Debounce */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Debounce</Label>
                  <div className="flex items-center gap-1">
                    <Input 
                      type="number"
                      className="h-7 w-20 text-xs"
                      value={currentFilterParams.debounceMs || 200}
                      onChange={(e) => handleFilterParamChange('debounceMs', parseInt(e.target.value))}
                    />
                    <span className="text-xs text-muted-foreground">ms</span>
                  </div>
                </div>

                {/* Clear Button */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="clear-button" className="text-xs">Clear Button</Label>
                  <Switch 
                    id="clear-button"
                    checked={currentFilterParams.buttons?.includes('clear') !== false}
                    onCheckedChange={(checked) => {
                      const buttons = checked ? ['clear', 'apply'] : ['apply'];
                      handleFilterParamChange('buttons', buttons);
                    }}
                    className="h-4 w-7"
                  />
                </div>

                {/* Close on Apply */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="close-apply" className="text-xs">Close on Apply</Label>
                  <Switch 
                    id="close-apply"
                    checked={currentFilterParams.closeOnApply === true}
                    onCheckedChange={(checked) => handleFilterParamChange('closeOnApply', checked)}
                    className="h-4 w-7"
                  />
                </div>

              </div>

              {/* Filter-specific advanced options */}
              <div className="flex items-center gap-4">
                {/* Date Format for Date Filter */}
                {getCurrentFilterType() === 'agDateColumnFilter' && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Date Format</Label>
                    <Input 
                      className="h-7 w-32 text-xs"
                      placeholder="YYYY-MM-DD"
                      value={currentFilterParams.dateFormat || ''}
                      onChange={(e) => handleFilterParamChange('dateFormat', e.target.value)}
                    />
                  </div>
                )}

                {/* Include Blanks for Number Filter */}
                {getCurrentFilterType() === 'agNumberColumnFilter' && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="include-blanks" className="text-xs">Include Blanks in Equals</Label>
                    <Switch 
                      id="include-blanks"
                      checked={currentFilterParams.includeBlanksInEquals === true}
                      onCheckedChange={(checked) => handleFilterParamChange('includeBlanksInEquals', checked)}
                      className="h-4 w-7"
                    />
                  </div>
                )}

                {/* Set Filter specific advanced options */}
                {getCurrentFilterType() === 'agSetColumnFilter' && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Excel Mode</Label>
                      <Select
                        value={currentFilterParams.excelMode || 'windows'}
                        onValueChange={(value) => handleFilterParamChange('excelMode', value)}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="windows">Windows</SelectItem>
                          <SelectItem value="mac">Mac</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">New Rows</Label>
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
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info section */}
      <div className="w-48 border-l pl-3">
        <Label className="ribbon-section-header mb-2 block">FILTER INFO</Label>
        <div className="space-y-3">
          {/* Current Filter */}
          <div>
            <div className="text-[10px] text-muted-foreground mb-1">Current Filter</div>
            <div className={`p-2 border rounded min-h-[32px] flex items-center ${
              getCurrentFilterType() !== 'none' && getCurrentFilterType() !== '' 
                ? 'bg-primary/10 border-primary/30' 
                : 'bg-muted/20'
            }`}>
              {getCurrentFilterType() === 'none' ? (
                <span className="text-xs text-muted-foreground">No filter configured</span>
              ) : getCurrentFilterType() === '' ? (
                <span className="text-xs text-muted-foreground">Mixed values</span>
              ) : (
                <div className="flex items-center gap-2">
                  {(() => {
                    const filter = FILTER_TYPES.find(f => f.value === getCurrentFilterType());
                    if (filter) {
                      const Icon = filter.icon;
                      return (
                        <>
                          <Icon className="h-3 w-3 text-primary" />
                          <span className="text-xs font-semibold text-primary">{filter.label}</span>
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          </div>
          
          {/* Filter Description */}
          {getCurrentFilterType() !== 'none' && getCurrentFilterType() !== '' && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Description</div>
              <div className="text-xs text-muted-foreground">
                {FILTER_TYPES.find(f => f.value === getCurrentFilterType())?.description}
              </div>
            </div>
          )}

          {/* Filter Settings Summary */}
          {getCurrentFilterType() !== 'none' && getCurrentFilterType() !== '' && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Settings</div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Floating:</span>
                  <span className="font-medium">{floatingFilterValue.value ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Menu Hidden:</span>
                  <span className="font-medium">{suppressMenuButtonValue.value ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Panel Hidden:</span>
                  <span className="font-medium">{suppressFiltersPanelValue.value ? 'Yes' : 'No'}</span>
                </div>
                {currentFilterParams.defaultOption && (
                  <div className="pt-1 border-t">
                    <span className="text-muted-foreground">Default: </span>
                    <span className="font-medium">{currentFilterParams.defaultOption}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => {
                updateBulkProperty('filter', 'agSetColumnFilter');
                updateBulkProperty('filterParams', getDefaultFilterParams('agSetColumnFilter'));
              }}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Enable Set Filter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};