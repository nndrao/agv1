import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { 
  Type, 
  Hash, 
  Calendar, 
  ToggleLeft, 
  List, 
  Edit3,
  Info,
  Settings,
  FileText,
  Code,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

// Cell editor types based on AG-Grid documentation
const CELL_EDITORS = {
  text: {
    value: 'agTextCellEditor',
    label: 'Text Editor',
    icon: Type,
    description: 'Standard text input editor',
    dataTypes: ['text', 'string'],
  },
  largeText: {
    value: 'agLargeTextCellEditor',
    label: 'Large Text Editor',
    icon: FileText,
    description: 'Multi-line text editor (textarea)',
    dataTypes: ['text', 'string'],
  },
  select: {
    value: 'agSelectCellEditor',
    label: 'Select Editor',
    icon: List,
    description: 'Dropdown select editor',
    dataTypes: ['text', 'string', 'number'],
  },
  richSelect: {
    value: 'agRichSelectCellEditor',
    label: 'Rich Select Editor',
    icon: List,
    description: 'Advanced dropdown with search and custom rendering',
    dataTypes: ['text', 'string', 'number'],
  },
  number: {
    value: 'agNumberCellEditor',
    label: 'Number Editor',
    icon: Hash,
    description: 'Numeric input with validation',
    dataTypes: ['number', 'numeric'],
  },
  date: {
    value: 'agDateCellEditor',
    label: 'Date Editor',
    icon: Calendar,
    description: 'Date picker editor',
    dataTypes: ['date', 'dateString'],
  },
  checkbox: {
    value: 'agCheckboxCellEditor',
    label: 'Checkbox Editor',
    icon: ToggleLeft,
    description: 'Boolean checkbox editor',
    dataTypes: ['boolean'],
  },
};

export const EditorsTab: React.FC = () => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperty,
    updateBulkProperties,
  } = useColumnCustomizationStore();

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get current editor configuration
  const currentEditorConfig = useMemo(() => {
    if (selectedColumns.size === 0) return null;

    const configs = new Map<string, any>();
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const changes = pendingChanges.get(colId);
      
      const cellEditor = changes?.cellEditor || colDef?.cellEditor || '';
      const cellEditorParams = changes?.cellEditorParams || colDef?.cellEditorParams || {};
      const cellEditorPopup = changes?.cellEditorPopup ?? colDef?.cellEditorPopup ?? false;
      const cellEditorPopupPosition = changes?.cellEditorPopupPosition || colDef?.cellEditorPopupPosition || 'over';
      const editable = changes?.editable ?? colDef?.editable ?? true;
      const singleClickEdit = changes?.singleClickEdit ?? colDef?.singleClickEdit ?? false;
      const stopEditingWhenCellsLoseFocus = changes?.stopEditingWhenCellsLoseFocus ?? colDef?.stopEditingWhenCellsLoseFocus ?? true;
      
      configs.set(colId, {
        cellEditor,
        cellEditorParams,
        cellEditorPopup,
        cellEditorPopupPosition,
        editable,
        singleClickEdit,
        stopEditingWhenCellsLoseFocus,
      });
    });

    // Check if all selected columns have the same config
    const firstConfig = Array.from(configs.values())[0];
    const allSame = Array.from(configs.values()).every(config => 
      JSON.stringify(config) === JSON.stringify(firstConfig)
    );

    return allSame ? firstConfig : null;
  }, [selectedColumns, columnDefinitions, pendingChanges]);

  // Get recommended editor type based on data type
  const recommendedEditor = useMemo(() => {
    if (selectedColumns.size === 0) return null;

    const dataTypes = new Set<string>();
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const dataType = colDef?.cellDataType || colDef?.type || 'text';
      dataTypes.add(dataType);
    });

    if (dataTypes.size === 1) {
      const dataType = Array.from(dataTypes)[0];
      
      // Find best matching editor
      for (const [key, editor] of Object.entries(CELL_EDITORS)) {
        if (editor.dataTypes.includes(dataType)) {
          return editor.value;
        }
      }
    }

    return 'agTextCellEditor'; // Default
  }, [selectedColumns, columnDefinitions]);

  const handleEditorTypeChange = (editorType: string) => {
    if (editorType === 'none') {
      updateBulkProperty('cellEditor', undefined);
      updateBulkProperty('cellEditorParams', undefined);
    } else {
      updateBulkProperty('cellEditor', editorType);
      // Set default params for the editor type
      updateBulkProperty('cellEditorParams', getDefaultEditorParams(editorType));
    }
  };

  const handleEditorParamChange = (param: string, value: any) => {
    const currentParams = currentEditorConfig?.cellEditorParams || {};
    const newParams = { ...currentParams, [param]: value };
    updateBulkProperty('cellEditorParams', newParams);
  };

  const handleBulkUpdate = (updates: Record<string, any>) => {
    updateBulkProperties(updates);
  };

  const getDefaultEditorParams = (editorType: string): any => {
    switch (editorType) {
      case 'agTextCellEditor':
        return {
          maxLength: undefined,
          useFormatter: false,
        };
      
      case 'agLargeTextCellEditor':
        return {
          maxLength: undefined,
          rows: 5,
          cols: 50,
        };
      
      case 'agSelectCellEditor':
        return {
          values: ['Option 1', 'Option 2', 'Option 3'],
          valueListGap: 0,
          valueListMaxHeight: undefined,
          valueListMaxWidth: undefined,
        };
      
      case 'agRichSelectCellEditor':
        return {
          values: ['Option 1', 'Option 2', 'Option 3'],
          cellHeight: 30,
          searchType: 'fuzzy',
          allowTyping: true,
          filterList: true,
          highlightMatch: true,
          valueListGap: 0,
          valueListMaxHeight: undefined,
          valueListMaxWidth: undefined,
        };
      
      case 'agNumberCellEditor':
        return {
          min: undefined,
          max: undefined,
          precision: undefined,
          step: 1,
          showStepperButtons: true,
        };
      
      case 'agDateCellEditor':
        return {
          min: undefined,
          max: undefined,
          format: undefined,
        };
      
      default:
        return {};
    }
  };

  const isDisabled = selectedColumns.size === 0;
  const currentEditor = currentEditorConfig?.cellEditor || 'none';

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-5">
        {/* Editable Configuration */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Edit Configuration</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="editable" className="text-sm">
              Enable Editing
            </Label>
            <Switch
              id="editable"
              checked={currentEditorConfig?.editable ?? true}
              onCheckedChange={(checked) => updateBulkProperty('editable', checked)}
              disabled={isDisabled}
            />
          </div>

          {currentEditorConfig?.editable !== false && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="single-click" className="text-sm">
                  Single Click Edit
                  <span className="block text-xs text-muted-foreground font-normal">
                    Start editing with single click instead of double click
                  </span>
                </Label>
                <Switch
                  id="single-click"
                  checked={currentEditorConfig?.singleClickEdit ?? false}
                  onCheckedChange={(checked) => updateBulkProperty('singleClickEdit', checked)}
                  disabled={isDisabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="stop-editing" className="text-sm">
                  Stop Editing When Focus Lost
                  <span className="block text-xs text-muted-foreground font-normal">
                    Automatically stop editing when clicking outside
                  </span>
                </Label>
                <Switch
                  id="stop-editing"
                  checked={currentEditorConfig?.stopEditingWhenCellsLoseFocus ?? true}
                  onCheckedChange={(checked) => updateBulkProperty('stopEditingWhenCellsLoseFocus', checked)}
                  disabled={isDisabled}
                />
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Cell Editor Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cell Editor Type</Label>
            <Select
              value={currentEditor}
              onValueChange={handleEditorTypeChange}
              disabled={isDisabled || currentEditorConfig?.editable === false}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an editor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default (Auto)</SelectItem>
                {Object.entries(CELL_EDITORS).map(([key, editor]) => {
                  const Icon = editor.icon;
                  return (
                    <SelectItem key={key} value={editor.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{editor.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
                <SelectItem value="custom">Custom Editor</SelectItem>
              </SelectContent>
            </Select>
            
            {currentEditor && currentEditor !== 'none' && (
              <p className="text-xs text-muted-foreground">
                {CELL_EDITORS[Object.keys(CELL_EDITORS).find(k => CELL_EDITORS[k as keyof typeof CELL_EDITORS].value === currentEditor) as keyof typeof CELL_EDITORS]?.description}
              </p>
            )}
            
            {recommendedEditor && currentEditor !== recommendedEditor && currentEditor === 'none' && (
              <Alert className="mt-2">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Based on your column data type, we recommend using{' '}
                  <strong>{CELL_EDITORS[Object.keys(CELL_EDITORS).find(k => CELL_EDITORS[k as keyof typeof CELL_EDITORS].value === recommendedEditor) as keyof typeof CELL_EDITORS]?.label}</strong>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Popup Configuration */}
          {currentEditor && currentEditor !== 'none' && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="popup-editor" className="text-sm">
                  Popup Editor
                  <span className="block text-xs text-muted-foreground font-normal">
                    Show editor in a popup instead of inline
                  </span>
                </Label>
                <Switch
                  id="popup-editor"
                  checked={currentEditorConfig?.cellEditorPopup ?? false}
                  onCheckedChange={(checked) => updateBulkProperty('cellEditorPopup', checked)}
                  disabled={isDisabled}
                />
              </div>

              {currentEditorConfig?.cellEditorPopup && (
                <div className="space-y-2">
                  <Label>Popup Position</Label>
                  <Select
                    value={currentEditorConfig?.cellEditorPopupPosition || 'over'}
                    onValueChange={(value) => updateBulkProperty('cellEditorPopupPosition', value)}
                    disabled={isDisabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="over">Over Cell</SelectItem>
                      <SelectItem value="under">Under Cell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </div>

        {/* Editor-specific Parameters */}
        {currentEditor && currentEditor !== 'none' && currentEditor !== 'custom' && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Editor Parameters</h4>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  {currentEditor === 'agTextCellEditor' && (
                    <TextEditorParams
                      editorParams={currentEditorConfig?.cellEditorParams || {}}
                      onParamChange={handleEditorParamChange}
                      disabled={isDisabled}
                    />
                  )}
                  
                  {currentEditor === 'agLargeTextCellEditor' && (
                    <LargeTextEditorParams
                      editorParams={currentEditorConfig?.cellEditorParams || {}}
                      onParamChange={handleEditorParamChange}
                      disabled={isDisabled}
                    />
                  )}
                  
                  {(currentEditor === 'agSelectCellEditor' || currentEditor === 'agRichSelectCellEditor') && (
                    <SelectEditorParams
                      editorType={currentEditor}
                      editorParams={currentEditorConfig?.cellEditorParams || {}}
                      onParamChange={handleEditorParamChange}
                      disabled={isDisabled}
                    />
                  )}
                  
                  {currentEditor === 'agNumberCellEditor' && (
                    <NumberEditorParams
                      editorParams={currentEditorConfig?.cellEditorParams || {}}
                      onParamChange={handleEditorParamChange}
                      disabled={isDisabled}
                    />
                  )}
                  
                  {currentEditor === 'agDateCellEditor' && (
                    <DateEditorParams
                      editorParams={currentEditorConfig?.cellEditorParams || {}}
                      onParamChange={handleEditorParamChange}
                      disabled={isDisabled}
                    />
                  )}
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <AdvancedEditorParams
                    editorType={currentEditor}
                    editorParams={currentEditorConfig?.cellEditorParams || {}}
                    onParamChange={handleEditorParamChange}
                    disabled={isDisabled}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}

        {/* Custom Editor Configuration */}
        {currentEditor === 'custom' && (
          <>
            <Separator />
            <CustomEditorConfig
              disabled={isDisabled}
            />
          </>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
            <CardDescription className="text-xs">
              Apply common editor configurations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => handleBulkUpdate({
                editable: true,
                cellEditor: recommendedEditor || 'agTextCellEditor',
                cellEditorParams: getDefaultEditorParams(recommendedEditor || 'agTextCellEditor'),
                singleClickEdit: true,
              })}
              disabled={isDisabled}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Enable Recommended Editor
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => handleBulkUpdate({
                editable: false,
                cellEditor: undefined,
                cellEditorParams: undefined,
              })}
              disabled={isDisabled}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Make Read-Only
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => handleBulkUpdate({
                editable: true,
                cellEditor: undefined,
                cellEditorParams: undefined,
                cellEditorPopup: false,
                singleClickEdit: false,
                stopEditingWhenCellsLoseFocus: true,
              })}
              disabled={isDisabled}
            >
              <Settings className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

// Text Editor Parameters
const TextEditorParams: React.FC<{
  editorParams: any;
  onParamChange: (param: string, value: any) => void;
  disabled: boolean;
}> = ({ editorParams, onParamChange, disabled }) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="max-length">Max Length</Label>
        <Input
          id="max-length"
          type="number"
          value={editorParams.maxLength || ''}
          onChange={(e) => onParamChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="No limit"
          disabled={disabled}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="use-formatter" className="text-sm">
          Use Value Formatter
          <span className="block text-xs text-muted-foreground font-normal">
            Format value while editing
          </span>
        </Label>
        <Switch
          id="use-formatter"
          checked={editorParams.useFormatter ?? false}
          onCheckedChange={(checked) => onParamChange('useFormatter', checked)}
          disabled={disabled}
        />
      </div>
    </>
  );
};

// Large Text Editor Parameters
const LargeTextEditorParams: React.FC<{
  editorParams: any;
  onParamChange: (param: string, value: any) => void;
  disabled: boolean;
}> = ({ editorParams, onParamChange, disabled }) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="rows">Rows</Label>
          <Input
            id="rows"
            type="number"
            value={editorParams.rows || 5}
            onChange={(e) => onParamChange('rows', parseInt(e.target.value))}
            min={1}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cols">Columns</Label>
          <Input
            id="cols"
            type="number"
            value={editorParams.cols || 50}
            onChange={(e) => onParamChange('cols', parseInt(e.target.value))}
            min={1}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="max-length-large">Max Length</Label>
        <Input
          id="max-length-large"
          type="number"
          value={editorParams.maxLength || ''}
          onChange={(e) => onParamChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="No limit"
          disabled={disabled}
        />
      </div>
    </>
  );
};

// Select Editor Parameters
const SelectEditorParams: React.FC<{
  editorType: string;
  editorParams: any;
  onParamChange: (param: string, value: any) => void;
  disabled: boolean;
}> = ({ editorType, editorParams, onParamChange, disabled }) => {
  const [valuesInput, setValuesInput] = useState(
    Array.isArray(editorParams.values) ? editorParams.values.join('\n') : ''
  );

  const handleValuesChange = (input: string) => {
    setValuesInput(input);
    const values = input.split('\n').filter(v => v.trim()).map(v => v.trim());
    onParamChange('values', values);
  };

  return (
    <>
      <div className="space-y-2">
        <Label>Options (one per line)</Label>
        <Textarea
          value={valuesInput}
          onChange={(e) => handleValuesChange(e.target.value)}
          placeholder="Option 1&#10;Option 2&#10;Option 3"
          rows={5}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Enter each option on a new line
        </p>
      </div>

      {editorType === 'agRichSelectCellEditor' && (
        <>
          <div className="space-y-2">
            <Label>Search Type</Label>
            <Select
              value={editorParams.searchType || 'fuzzy'}
              onValueChange={(value) => onParamChange('searchType', value)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fuzzy">Fuzzy Search</SelectItem>
                <SelectItem value="text">Text Search</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="allow-typing" className="text-sm">
              Allow Typing
            </Label>
            <Switch
              id="allow-typing"
              checked={editorParams.allowTyping ?? true}
              onCheckedChange={(checked) => onParamChange('allowTyping', checked)}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="filter-list" className="text-sm">
              Filter List
            </Label>
            <Switch
              id="filter-list"
              checked={editorParams.filterList ?? true}
              onCheckedChange={(checked) => onParamChange('filterList', checked)}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="highlight-match" className="text-sm">
              Highlight Match
            </Label>
            <Switch
              id="highlight-match"
              checked={editorParams.highlightMatch ?? true}
              onCheckedChange={(checked) => onParamChange('highlightMatch', checked)}
              disabled={disabled}
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="value-list-gap">List Gap (px)</Label>
          <Input
            id="value-list-gap"
            type="number"
            value={editorParams.valueListGap || 0}
            onChange={(e) => onParamChange('valueListGap', parseInt(e.target.value))}
            min={0}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cell-height">Cell Height (px)</Label>
          <Input
            id="cell-height"
            type="number"
            value={editorParams.cellHeight || 30}
            onChange={(e) => onParamChange('cellHeight', parseInt(e.target.value))}
            min={20}
            disabled={disabled}
          />
        </div>
      </div>
    </>
  );
};

// Number Editor Parameters
const NumberEditorParams: React.FC<{
  editorParams: any;
  onParamChange: (param: string, value: any) => void;
  disabled: boolean;
}> = ({ editorParams, onParamChange, disabled }) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="min">Min Value</Label>
          <Input
            id="min"
            type="number"
            value={editorParams.min ?? ''}
            onChange={(e) => onParamChange('min', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="No minimum"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max">Max Value</Label>
          <Input
            id="max"
            type="number"
            value={editorParams.max ?? ''}
            onChange={(e) => onParamChange('max', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="No maximum"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="precision">Decimal Places</Label>
          <Input
            id="precision"
            type="number"
            value={editorParams.precision ?? ''}
            onChange={(e) => onParamChange('precision', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Any"
            min={0}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="step">Step</Label>
          <Input
            id="step"
            type="number"
            value={editorParams.step || 1}
            onChange={(e) => onParamChange('step', parseFloat(e.target.value))}
            min={0}
            step="any"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="stepper-buttons" className="text-sm">
          Show Stepper Buttons
          <span className="block text-xs text-muted-foreground font-normal">
            Show increment/decrement buttons
          </span>
        </Label>
        <Switch
          id="stepper-buttons"
          checked={editorParams.showStepperButtons ?? true}
          onCheckedChange={(checked) => onParamChange('showStepperButtons', checked)}
          disabled={disabled}
        />
      </div>
    </>
  );
};

// Date Editor Parameters
const DateEditorParams: React.FC<{
  editorParams: any;
  onParamChange: (param: string, value: any) => void;
  disabled: boolean;
}> = ({ editorParams, onParamChange, disabled }) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="date-format">Date Format</Label>
        <Input
          id="date-format"
          value={editorParams.format || ''}
          onChange={(e) => onParamChange('format', e.target.value)}
          placeholder="e.g., YYYY-MM-DD"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Format string for displaying dates
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="min-date">Min Date</Label>
          <Input
            id="min-date"
            type="date"
            value={editorParams.min || ''}
            onChange={(e) => onParamChange('min', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-date">Max Date</Label>
          <Input
            id="max-date"
            type="date"
            value={editorParams.max || ''}
            onChange={(e) => onParamChange('max', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    </>
  );
};

// Advanced Editor Parameters
const AdvancedEditorParams: React.FC<{
  editorType: string;
  editorParams: any;
  onParamChange: (param: string, value: any) => void;
  disabled: boolean;
}> = ({ editorType, editorParams, onParamChange, disabled }) => {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Advanced parameters for fine-tuning editor behavior
        </AlertDescription>
      </Alert>

      {(editorType === 'agSelectCellEditor' || editorType === 'agRichSelectCellEditor') && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="list-max-height">Max Height (px)</Label>
              <Input
                id="list-max-height"
                type="number"
                value={editorParams.valueListMaxHeight || ''}
                onChange={(e) => onParamChange('valueListMaxHeight', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Auto"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="list-max-width">Max Width (px)</Label>
              <Input
                id="list-max-width"
                type="number"
                value={editorParams.valueListMaxWidth || ''}
                onChange={(e) => onParamChange('valueListMaxWidth', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Auto"
                disabled={disabled}
              />
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="char-press">Start Editing Key</Label>
        <Input
          id="char-press"
          value={editorParams.charPress || ''}
          onChange={(e) => onParamChange('charPress', e.target.value)}
          placeholder="Any key"
          maxLength={1}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Specific key that starts editing (leave empty for any key)
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="format-after-edit" className="text-sm">
          Format After Edit
          <span className="block text-xs text-muted-foreground font-normal">
            Apply value formatter after editing completes
          </span>
        </Label>
        <Switch
          id="format-after-edit"
          checked={editorParams.formatAfterEdit ?? true}
          onCheckedChange={(checked) => onParamChange('formatAfterEdit', checked)}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

// Custom Editor Configuration
const CustomEditorConfig: React.FC<{
  disabled: boolean;
}> = ({ disabled }) => {
  return (
    <div className="space-y-4">
      <Alert>
        <Code className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Custom editors require implementing a cell editor component
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Custom Editor Setup</CardTitle>
          <CardDescription className="text-xs">
            Steps to implement a custom cell editor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm">1. Create Editor Component</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                class CustomEditor implements ICellEditorComp
              </code>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm">2. Implement Required Methods</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                getValue(), isPopup(), getGui()
              </code>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm">3. Register the Component</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                cellEditor: CustomEditor
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="component-name">Component Name</Label>
        <Input
          id="component-name"
          placeholder="e.g., MyCustomEditor"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Enter the name of your custom editor component
        </p>
      </div>
    </div>
  );
};