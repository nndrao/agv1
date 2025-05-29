import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { Info, Settings, Filter, Calendar, Hash, Type, ToggleLeft, X, Plus, Lightbulb } from 'lucide-react';

interface FilterConfig {
  filter: string;
  filterParams: Record<string, unknown>;
  floatingFilter: boolean;
  suppressMenu: boolean;
  suppressFiltersToolPanel: boolean;
}

// Filter types based on AG-Grid documentation
const FILTER_TYPES = {
  text: {
    value: 'agTextColumnFilter',
    label: 'Text Filter',
    icon: Type,
    description: 'Filter text values with contains, equals, starts with, etc.',
    dataTypes: ['text', 'string'],
  },
  number: {
    value: 'agNumberColumnFilter',
    label: 'Number Filter',
    icon: Hash,
    description: 'Filter numeric values with ranges and comparisons',
    dataTypes: ['number', 'numeric'],
  },
  date: {
    value: 'agDateColumnFilter',
    label: 'Date Filter',
    icon: Calendar,
    description: 'Filter dates with ranges and relative dates',
    dataTypes: ['date', 'dateString'],
  },
  boolean: {
    value: 'agBooleanColumnFilter',
    label: 'Boolean Filter',
    icon: ToggleLeft,
    description: 'Filter true/false values',
    dataTypes: ['boolean'],
  },
  set: {
    value: 'agSetColumnFilter',
    label: 'Set Filter',
    icon: Filter,
    description: 'Select from a list of unique values',
    dataTypes: ['text', 'number', 'date', 'boolean'],
  },
  multiFilter: {
    value: 'agMultiColumnFilter',
    label: 'Multi Filter',
    icon: Settings,
    description: 'Combine multiple filter types',
    dataTypes: ['text', 'number', 'date'],
  },
};

// Filter comparator options
const TEXT_FILTER_OPTIONS = [
  { value: 'contains', label: 'Contains' },
  { value: 'notContains', label: 'Not contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'notEqual', label: 'Not equal' },
  { value: 'startsWith', label: 'Starts with' },
  { value: 'endsWith', label: 'Ends with' },
  { value: 'blank', label: 'Blank' },
  { value: 'notBlank', label: 'Not blank' },
];

const NUMBER_FILTER_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEqual', label: 'Not equal' },
  { value: 'lessThan', label: 'Less than' },
  { value: 'lessThanOrEqual', label: 'Less than or equal' },
  { value: 'greaterThan', label: 'Greater than' },
  { value: 'greaterThanOrEqual', label: 'Greater than or equal' },
  { value: 'inRange', label: 'In range' },
  { value: 'blank', label: 'Blank' },
  { value: 'notBlank', label: 'Not blank' },
];

const DATE_FILTER_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEqual', label: 'Not equal' },
  { value: 'lessThan', label: 'Before' },
  { value: 'greaterThan', label: 'After' },
  { value: 'inRange', label: 'Between' },
  { value: 'blank', label: 'Blank' },
  { value: 'notBlank', label: 'Not blank' },
];

export const FiltersTab: React.FC = () => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperty,
    updateBulkProperties,
  } = useColumnCustomizationStore();

  const [activeSection, setActiveSection] = useState<'basic' | 'advanced'>('basic');

  // Get current filter configuration
  const currentFilterConfig = useMemo(() => {
    if (selectedColumns.size === 0) return null;

    const configs = new Map<string, FilterConfig>();
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const changes = pendingChanges.get(colId);
      
      const filter = changes?.filter || colDef?.filter || '';
      const filterParams = changes?.filterParams || colDef?.filterParams || {};
      const floatingFilter = changes?.floatingFilter ?? colDef?.floatingFilter ?? true;
      const suppressMenu = changes?.suppressMenu ?? colDef?.suppressMenu ?? false;
      const suppressFiltersToolPanel = changes?.suppressFiltersToolPanel ?? colDef?.suppressFiltersToolPanel ?? false;
      
      configs.set(colId, {
        filter,
        filterParams,
        floatingFilter,
        suppressMenu,
        suppressFiltersToolPanel,
      });
    });

    // Check if all selected columns have the same config
    const firstConfig = Array.from(configs.values())[0];
    const allSame = Array.from(configs.values()).every(config => 
      JSON.stringify(config) === JSON.stringify(firstConfig)
    );

    return allSame ? firstConfig : null;
  }, [selectedColumns, columnDefinitions, pendingChanges]);

  // Get recommended filter type based on data type
  const recommendedFilterType = useMemo(() => {
    if (selectedColumns.size === 0) return null;

    const dataTypes = new Set<string>();
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const dataType = colDef?.cellDataType || colDef?.type || 'text';
      dataTypes.add(dataType);
    });

    if (dataTypes.size === 1) {
      const dataType = Array.from(dataTypes)[0];
      
      // Find best matching filter type
      for (const [, filterType] of Object.entries(FILTER_TYPES)) {
        if (filterType.dataTypes.includes(dataType)) {
          return filterType.value;
        }
      }
    }

    return 'agTextColumnFilter'; // Default
  }, [selectedColumns, columnDefinitions]);

  const handleFilterTypeChange = (filterType: string) => {
    if (filterType === 'none') {
      updateBulkProperty('filter', undefined);
      updateBulkProperty('filterParams', undefined);
    } else {
      updateBulkProperty('filter', filterType);
      // Reset filter params when changing filter type
      updateBulkProperty('filterParams', getDefaultFilterParams(filterType));
    }
  };

  const handleFilterParamChange = (param: string, value: unknown) => {
    const currentParams = currentFilterConfig?.filterParams || {};
    const newParams = { ...currentParams, [param]: value };
    updateBulkProperty('filterParams', newParams);
  };

  const handleBulkUpdate = (updates: Record<string, unknown>) => {
    updateBulkProperties(updates);
  };

  const getDefaultFilterParams = (filterType: string): Record<string, unknown> => {
    switch (filterType) {
      case 'agTextColumnFilter':
        return {
          filterOptions: ['contains', 'notContains', 'equals', 'notEqual', 'startsWith', 'endsWith', 'blank', 'notBlank'],
          defaultOption: 'contains',
          trimInput: true,
          debounceMs: 200,
        };
      
      case 'agNumberColumnFilter':
        return {
          filterOptions: ['equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'inRange', 'blank', 'notBlank'],
          defaultOption: 'equals',
          debounceMs: 200,
          includeBlanksInEquals: false,
          includeBlanksInLessThan: false,
          includeBlanksInGreaterThan: false,
        };
      
      case 'agDateColumnFilter':
        return {
          filterOptions: ['equals', 'notEqual', 'lessThan', 'greaterThan', 'inRange', 'blank', 'notBlank'],
          defaultOption: 'equals',
          debounceMs: 200,
          comparator: (filterDate: Date, cellValue: string) => {
            const cellDate = new Date(cellValue);
            if (filterDate.getTime() === cellDate.getTime()) return 0;
            return cellDate < filterDate ? -1 : 1;
          },
        };
      
      case 'agSetColumnFilter':
        return {
          suppressMiniFilter: false,
          suppressRemoveEntries: false,
          suppressSorting: false,
          showTooltips: true,
          debounceMs: 200,
        };
      
      case 'agMultiColumnFilter':
        return {
          filters: [
            {
              filter: 'agTextColumnFilter',
              display: 'subMenu',
            },
            {
              filter: 'agSetColumnFilter',
            },
          ],
        };
      
      default:
        return {};
    }
  };

  const isDisabled = selectedColumns.size === 0;
  const currentFilterType = currentFilterConfig?.filter || 'none';

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header with description */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Column Filters</h3>
          <p className="text-sm text-muted-foreground">
            Configure filtering options for selected columns. Choose a filter type and customize its behavior.
          </p>
        </div>

        {/* Filter Type Selection */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Filter Type</CardTitle>
            <CardDescription className="text-sm">
              Select the appropriate filter type for your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={currentFilterType}
              onValueChange={handleFilterTypeChange}
              disabled={isDisabled}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select a filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Filter</SelectItem>
                <Separator className="my-1" />
                {Object.entries(FILTER_TYPES).map(([key, filterType]) => {
                  const Icon = filterType.icon;
                  return (
                    <SelectItem key={key} value={filterType.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{filterType.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            {currentFilterType && currentFilterType !== 'none' && (
              <Alert className="border-muted">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {FILTER_TYPES[Object.keys(FILTER_TYPES).find(k => FILTER_TYPES[k as keyof typeof FILTER_TYPES].value === currentFilterType) as keyof typeof FILTER_TYPES]?.description}
                </AlertDescription>
              </Alert>
            )}
            
            {recommendedFilterType && currentFilterType !== recommendedFilterType && currentFilterType === 'none' && (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle className="text-sm">Recommendation</AlertTitle>
                <AlertDescription className="text-sm">
                  Based on your column data type, we recommend using{' '}
                  <strong>{FILTER_TYPES[Object.keys(FILTER_TYPES).find(k => FILTER_TYPES[k as keyof typeof FILTER_TYPES].value === recommendedFilterType) as keyof typeof FILTER_TYPES]?.label}</strong>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Filter Options */}
        {currentFilterType && currentFilterType !== 'none' && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Filter Options</CardTitle>
              <CardDescription className="text-sm">
                Configure how filters are displayed and accessed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="floating-filter" className="text-sm font-medium">
                      Floating Filter
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Show filter inputs below column headers
                    </p>
                  </div>
                  <Switch
                    id="floating-filter"
                    checked={currentFilterConfig?.floatingFilter ?? true}
                    onCheckedChange={(checked) => updateBulkProperty('floatingFilter', checked)}
                    disabled={isDisabled}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="suppress-menu" className="text-sm font-medium">
                      Hide Filter Menu
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Remove filter option from column menu
                    </p>
                  </div>
                  <Switch
                    id="suppress-menu"
                    checked={currentFilterConfig?.suppressMenu ?? false}
                    onCheckedChange={(checked) => updateBulkProperty('suppressMenu', checked)}
                    disabled={isDisabled}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="suppress-tool-panel" className="text-sm font-medium">
                      Hide in Filters Panel
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Exclude from the filters tool panel
                    </p>
                  </div>
                  <Switch
                    id="suppress-tool-panel"
                    checked={currentFilterConfig?.suppressFiltersToolPanel ?? false}
                    onCheckedChange={(checked) => updateBulkProperty('suppressFiltersToolPanel', checked)}
                    disabled={isDisabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Parameters */}
        {currentFilterType && currentFilterType !== 'none' && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Filter Parameters</CardTitle>
                  <CardDescription className="text-sm">
                    Customize filter behavior and options
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant={activeSection === 'basic' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveSection('basic')}
                    className="h-7 px-3"
                  >
                    Basic
                  </Button>
                  <Button
                    variant={activeSection === 'advanced' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveSection('advanced')}
                    className="h-7 px-3"
                  >
                    Advanced
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeSection === 'basic' ? (
                <div className="space-y-4">
                  {currentFilterType === 'agTextColumnFilter' && (
                    <TextFilterParams
                      filterParams={currentFilterConfig?.filterParams || {}}
                      onParamChange={handleFilterParamChange}
                      disabled={isDisabled}
                    />
                  )}
                  
                  {currentFilterType === 'agNumberColumnFilter' && (
                    <NumberFilterParams
                      filterParams={currentFilterConfig?.filterParams || {}}
                      onParamChange={handleFilterParamChange}
                      disabled={isDisabled}
                    />
                  )}
                  
                  {currentFilterType === 'agDateColumnFilter' && (
                    <DateFilterParams
                      filterParams={currentFilterConfig?.filterParams || {}}
                      onParamChange={handleFilterParamChange}
                      disabled={isDisabled}
                    />
                  )}
                  
                  {currentFilterType === 'agSetColumnFilter' && (
                    <SetFilterParams
                      filterParams={currentFilterConfig?.filterParams || {}}
                      onParamChange={handleFilterParamChange}
                      disabled={isDisabled}
                    />
                  )}
                  
                  {currentFilterType === 'agMultiColumnFilter' && (
                    <MultiFilterParams
                      filterParams={currentFilterConfig?.filterParams || {}}
                      onParamChange={handleFilterParamChange}
                      disabled={isDisabled}
                    />
                  )}
                </div>
              ) : (
                <AdvancedFilterParams
                  filterType={currentFilterType}
                  filterParams={currentFilterConfig?.filterParams || {}}
                  onParamChange={handleFilterParamChange}
                  disabled={isDisabled}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription className="text-sm">
              Apply common filter configurations with one click
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start h-9"
              onClick={() => handleBulkUpdate({
                filter: 'agSetColumnFilter',
                filterParams: getDefaultFilterParams('agSetColumnFilter'),
                floatingFilter: true,
              })}
              disabled={isDisabled}
            >
              <Filter className="h-4 w-4 mr-2" />
              Enable Set Filter with Search
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start h-9"
              onClick={() => handleBulkUpdate({
                filter: recommendedFilterType || 'agTextColumnFilter',
                filterParams: getDefaultFilterParams(recommendedFilterType || 'agTextColumnFilter'),
                floatingFilter: true,
              })}
              disabled={isDisabled}
            >
              <Settings className="h-4 w-4 mr-2" />
              Apply Recommended Filter
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start h-9"
              onClick={() => handleBulkUpdate({
                filter: undefined,
                filterParams: undefined,
                floatingFilter: false,
                suppressMenu: false,
                suppressFiltersToolPanel: false,
              })}
              disabled={isDisabled}
            >
              <X className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
          </CardContent>
        </Card>

        {/* Tips */}
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle className="text-sm">Quick Tips</AlertTitle>
          <AlertDescription className="text-xs space-y-1">
            <p>• Set filters show a list of unique values for easy selection</p>
            <p>• Text filters support wildcards and regular expressions</p>
            <p>• Number and date filters can handle ranges and comparisons</p>
            <p>• Multi filters combine multiple filter types for flexibility</p>
          </AlertDescription>
        </Alert>
      </div>
    </ScrollArea>
  );
};

// Text Filter Parameters Component
const TextFilterParams: React.FC<{
  filterParams: Record<string, unknown>;
  onParamChange: (param: string, value: unknown) => void;
  disabled: boolean;
}> = ({ filterParams, onParamChange, disabled }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="default-option" className="text-sm">Default Filter Option</Label>
        <Select
          value={filterParams.defaultOption || 'contains'}
          onValueChange={(value) => onParamChange('defaultOption', value)}
          disabled={disabled}
        >
          <SelectTrigger id="default-option" className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEXT_FILTER_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="trim-input" className="text-sm">
            Trim Input
          </Label>
          <Switch
            id="trim-input"
            checked={filterParams.trimInput ?? true}
            onCheckedChange={(checked) => onParamChange('trimInput', checked)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="case-sensitive" className="text-sm">
            Case Sensitive
          </Label>
          <Switch
            id="case-sensitive"
            checked={filterParams.caseSensitive ?? false}
            onCheckedChange={(checked) => onParamChange('caseSensitive', checked)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="debounce" className="text-sm">Debounce Delay (ms)</Label>
        <Input
          id="debounce"
          type="number"
          value={filterParams.debounceMs || 200}
          onChange={(e) => onParamChange('debounceMs', parseInt(e.target.value))}
          disabled={disabled}
          className="h-8"
        />
      </div>
    </div>
  );
};

// Number Filter Parameters Component
const NumberFilterParams: React.FC<{
  filterParams: Record<string, unknown>;
  onParamChange: (param: string, value: unknown) => void;
  disabled: boolean;
}> = ({ filterParams, onParamChange, disabled }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="default-option-number" className="text-sm">Default Filter Option</Label>
        <Select
          value={filterParams.defaultOption || 'equals'}
          onValueChange={(value) => onParamChange('defaultOption', value)}
          disabled={disabled}
        >
          <SelectTrigger id="default-option-number" className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NUMBER_FILTER_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="include-blanks-equals" className="text-sm">
            Include Blanks in Equals
          </Label>
          <Switch
            id="include-blanks-equals"
            checked={filterParams.includeBlanksInEquals ?? false}
            onCheckedChange={(checked) => onParamChange('includeBlanksInEquals', checked)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="include-blanks-less" className="text-sm">
            Include Blanks in Less Than
          </Label>
          <Switch
            id="include-blanks-less"
            checked={filterParams.includeBlanksInLessThan ?? false}
            onCheckedChange={(checked) => onParamChange('includeBlanksInLessThan', checked)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="number-parser" className="text-sm">Custom Number Parser</Label>
        <Input
          id="number-parser"
          placeholder="e.g., text => parseFloat(text.replace(',', ''))"
          value={filterParams.numberParser || ''}
          onChange={(e) => onParamChange('numberParser', e.target.value)}
          disabled={disabled}
          className="h-8 font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          JavaScript function to parse custom number formats
        </p>
      </div>
    </div>
  );
};

// Date Filter Parameters Component
const DateFilterParams: React.FC<{
  filterParams: Record<string, unknown>;
  onParamChange: (param: string, value: unknown) => void;
  disabled: boolean;
}> = ({ filterParams, onParamChange, disabled }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="default-option-date" className="text-sm">Default Filter Option</Label>
        <Select
          value={filterParams.defaultOption || 'equals'}
          onValueChange={(value) => onParamChange('defaultOption', value)}
          disabled={disabled}
        >
          <SelectTrigger id="default-option-date" className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_FILTER_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="include-blanks-date" className="text-sm">
            Include Blanks in Comparisons
          </Label>
          <Switch
            id="include-blanks-date"
            checked={filterParams.includeBlanksInEquals ?? false}
            onCheckedChange={(checked) => onParamChange('includeBlanksInEquals', checked)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="in-range-inclusive" className="text-sm">
            In Range Inclusive
          </Label>
          <Switch
            id="in-range-inclusive"
            checked={filterParams.inRangeInclusive ?? false}
            onCheckedChange={(checked) => onParamChange('inRangeInclusive', checked)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date-format" className="text-sm">Date Format</Label>
        <Input
          id="date-format"
          placeholder="e.g., YYYY-MM-DD"
          value={filterParams.dateFormat || ''}
          onChange={(e) => onParamChange('dateFormat', e.target.value)}
          disabled={disabled}
          className="h-8"
        />
      </div>
    </div>
  );
};

// Set Filter Parameters Component
const SetFilterParams: React.FC<{
  filterParams: Record<string, unknown>;
  onParamChange: (param: string, value: unknown) => void;
  disabled: boolean;
}> = ({ filterParams, onParamChange, disabled }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="suppress-mini-filter" className="text-sm">
            Hide Search Box
          </Label>
          <Switch
            id="suppress-mini-filter"
            checked={filterParams.suppressMiniFilter ?? false}
            onCheckedChange={(checked) => onParamChange('suppressMiniFilter', checked)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="suppress-select-all" className="text-sm">
            Hide Select All
          </Label>
          <Switch
            id="suppress-select-all"
            checked={filterParams.suppressSelectAll ?? false}
            onCheckedChange={(checked) => onParamChange('suppressSelectAll', checked)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-tooltips" className="text-sm">
            Show Tooltips
          </Label>
          <Switch
            id="show-tooltips"
            checked={filterParams.showTooltips ?? true}
            onCheckedChange={(checked) => onParamChange('showTooltips', checked)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comparator" className="text-sm">Sort Order</Label>
        <Select
          value={filterParams.comparator || 'default'}
          onValueChange={(value) => onParamChange('comparator', value)}
          disabled={disabled}
        >
          <SelectTrigger id="comparator" className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default (Alphabetical)</SelectItem>
            <SelectItem value="caseInsensitive">Case Insensitive</SelectItem>
            <SelectItem value="natural">Natural Sort</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// Advanced Filter Parameters Component
const AdvancedFilterParams: React.FC<{
  filterType: string;
  filterParams: Record<string, unknown>;
  onParamChange: (param: string, value: unknown) => void;
  disabled: boolean;
}> = ({ filterType, filterParams, onParamChange, disabled }) => {
  return (
    <div className="space-y-4">
      <Alert className="border-muted">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Advanced parameters allow fine-tuning of filter behavior. Use with caution.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="suppress-and-or" className="text-sm">
            Hide AND/OR Conditions
          </Label>
          <Switch
            id="suppress-and-or"
            checked={filterParams.suppressAndOrCondition ?? false}
            onCheckedChange={(checked) => onParamChange('suppressAndOrCondition', checked)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="clear-button" className="text-sm">
            Show Clear Button
          </Label>
          <Switch
            id="clear-button"
            checked={filterParams.buttons?.includes('clear') ?? true}
            onCheckedChange={(checked) => {
              const buttons = checked ? ['clear', 'apply'] : ['apply'];
              onParamChange('buttons', buttons);
            }}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="close-on-apply" className="text-sm">
            Close on Apply
          </Label>
          <Switch
            id="close-on-apply"
            checked={filterParams.closeOnApply ?? false}
            onCheckedChange={(checked) => onParamChange('closeOnApply', checked)}
            disabled={disabled}
          />
        </div>

        {filterType === 'agDateColumnFilter' && (
          <div className="space-y-2">
            <Label htmlFor="max-valid-year" className="text-sm">Max Valid Year</Label>
            <Input
              id="max-valid-year"
              type="number"
              value={filterParams.maxValidYear || 2099}
              onChange={(e) => onParamChange('maxValidYear', parseInt(e.target.value))}
              disabled={disabled}
              className="h-8"
            />
          </div>
        )}

        {filterType === 'agSetColumnFilter' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="excel-mode" className="text-sm">Excel Mode</Label>
              <Select
                value={filterParams.excelMode || 'windows'}
                onValueChange={(value) => onParamChange('excelMode', value)}
                disabled={disabled}
              >
                <SelectTrigger id="excel-mode" className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="windows">Windows</SelectItem>
                  <SelectItem value="mac">Mac</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-rows-action" className="text-sm">New Rows Action</Label>
              <Select
                value={filterParams.newRowsAction || 'keep'}
                onValueChange={(value) => onParamChange('newRowsAction', value)}
                disabled={disabled}
              >
                <SelectTrigger id="new-rows-action" className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">Keep Filter</SelectItem>
                  <SelectItem value="clear">Clear Filter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Multi Filter Parameters Component
const MultiFilterParams: React.FC<{
  filterParams: Record<string, unknown>;
  onParamChange: (param: string, value: unknown) => void;
  disabled: boolean;
}> = ({ filterParams, onParamChange, disabled }) => {
  // Available filter types for multi filter (excluding multi filter itself)
  const MULTI_FILTER_OPTIONS = [
    { value: 'agTextColumnFilter', label: 'Text Filter', icon: Type },
    { value: 'agNumberColumnFilter', label: 'Number Filter', icon: Hash },
    { value: 'agDateColumnFilter', label: 'Date Filter', icon: Calendar },
    { value: 'agSetColumnFilter', label: 'Set Filter', icon: Filter },
  ];

  // Default filters configuration
  const defaultFilters = filterParams.filters || [
    { filter: 'agTextColumnFilter', display: 'subMenu' },
    { filter: 'agSetColumnFilter' }
  ];

  const handleFilterChange = (index: number, field: 'filter' | 'display' | 'title', value: string) => {
    const newFilters = [...defaultFilters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    onParamChange('filters', newFilters);
  };

  const addFilter = () => {
    const newFilters = [...defaultFilters, { filter: 'agTextColumnFilter' }];
    onParamChange('filters', newFilters);
  };

  const removeFilter = (index: number) => {
    if (defaultFilters.length <= 1) return; // Keep at least one filter
    const newFilters = defaultFilters.filter((_: unknown, i: number) => i !== index);
    onParamChange('filters', newFilters);
  };

  return (
    <div className="space-y-4">
      <Alert className="border-muted">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Multi Filter allows combining multiple filter types. Users can switch between filters using tabs or accordion.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <Label className="text-sm">Filter Configuration</Label>
        
        {defaultFilters.map((filterConfig: unknown, index: number) => {
          const Icon = MULTI_FILTER_OPTIONS.find(opt => opt.value === filterConfig.filter)?.icon || Filter;
          
          return (
            <Card key={index} className="p-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filter {index + 1}</span>
                  </div>
                  {defaultFilters.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilter(index)}
                      disabled={disabled}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Filter Type</Label>
                    <Select
                      value={filterConfig.filter}
                      onValueChange={(value) => handleFilterChange(index, 'filter', value)}
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MULTI_FILTER_OPTIONS.map(option => {
                          const OptIcon = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <OptIcon className="h-3.5 w-3.5" />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Display Mode</Label>
                    <Select
                      value={filterConfig.display || 'inline'}
                      onValueChange={(value) => handleFilterChange(index, 'display', value)}
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inline">Inline (Tabs)</SelectItem>
                        <SelectItem value="subMenu">Sub Menu</SelectItem>
                        <SelectItem value="accordion">Accordion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Custom Title (Optional)</Label>
                    <Input
                      value={filterConfig.title || ''}
                      onChange={(e) => handleFilterChange(index, 'title', e.target.value)}
                      placeholder={`e.g., ${MULTI_FILTER_OPTIONS.find(opt => opt.value === filterConfig.filter)?.label || 'Filter'}`}
                      disabled={disabled}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={addFilter}
          disabled={disabled || defaultFilters.length >= 4}
          className="w-full h-8"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Filter
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <h5 className="text-sm font-medium">Multi Filter Options</h5>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="hide-child-filter" className="text-sm">
            Hide Child Filter Buttons
          </Label>
          <Switch
            id="hide-child-filter"
            checked={filterParams.hideChildFilterButtons ?? false}
            onCheckedChange={(checked) => onParamChange('hideChildFilterButtons', checked)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="display-key" className="text-sm">Display Style</Label>
          <Select
            value={filterParams.display || 'inline'}
            onValueChange={(value) => onParamChange('display', value)}
            disabled={disabled}
          >
            <SelectTrigger id="display-key" className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inline">Inline (Tabs)</SelectItem>
              <SelectItem value="subMenu">Sub Menu</SelectItem>
              <SelectItem value="accordion">Accordion</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Default display mode for all filters (can be overridden per filter)
          </p>
        </div>
      </div>
    </div>
  );
};