import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useColumnCustomizationStore } from '../store/columnCustomization.store';
import { 
  Type, 
  Hash, 
  Calendar, 
  ToggleLeft, 
  List, 
  Info,
  FileText,
  Code,
  Lightbulb
} from 'lucide-react';
import { debounce } from 'lodash';

interface EditorConfig {
  cellEditor: string;
  cellEditorParams: Record<string, unknown>;
  editable: boolean;
}

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

// Memoized component to prevent re-renders
export const EditorsTab: React.FC = React.memo(() => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperty,
  } = useColumnCustomizationStore();

  // Cache for editor configurations
  const editorConfigCache = useRef<Map<string, EditorConfig | null>>(new Map());

  // Get current editor configuration with caching
  const currentEditorConfig = useMemo(() => {
    if (selectedColumns.size === 0) return null;

    // Create a cache key from selected columns
    const cacheKey = Array.from(selectedColumns).sort().join(',');
    
    // Check cache first
    if (editorConfigCache.current.has(cacheKey)) {
      return editorConfigCache.current.get(cacheKey);
    }

    const configs = new Map<string, EditorConfig>();
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const changes = pendingChanges.get(colId);
      
      const cellEditor = changes?.cellEditor || colDef?.cellEditor || '';
      const cellEditorParams = changes?.cellEditorParams || colDef?.cellEditorParams || {};
      const editable = changes?.editable ?? colDef?.editable ?? true;
      
      configs.set(colId, {
        cellEditor,
        cellEditorParams,
        editable,
      });
    });

    // Check if all selected columns have the same config
    const firstConfig = Array.from(configs.values())[0];
    const allSame = Array.from(configs.values()).every(config => 
      JSON.stringify(config) === JSON.stringify(firstConfig)
    );

    const result = allSame ? firstConfig : null;
    
    // Cache the result
    editorConfigCache.current.set(cacheKey, result);
    
    // Limit cache size
    if (editorConfigCache.current.size > 50) {
      const firstKey = editorConfigCache.current.keys().next().value;
      editorConfigCache.current.delete(firstKey);
    }
    
    return result;
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
      for (const [, editor] of Object.entries(CELL_EDITORS)) {
        if (editor.dataTypes.includes(dataType)) {
          return editor.value;
        }
      }
    }

    return 'agTextCellEditor'; // Default
  }, [selectedColumns, columnDefinitions]);

  const handleEditorTypeChange = useCallback((editorType: string) => {
    if (editorType === 'none') {
      updateBulkProperty('cellEditor', undefined);
      updateBulkProperty('cellEditorParams', undefined);
    } else {
      updateBulkProperty('cellEditor', editorType);
      // Set default params for the editor type
      updateBulkProperty('cellEditorParams', getDefaultEditorParams(editorType));
    }
  }, [updateBulkProperty]);

  const handleEditorParamChange = useCallback((param: string, value: unknown) => {
    const currentParams = currentEditorConfig?.cellEditorParams || {};
    const newParams = { ...currentParams, [param]: value };
    updateBulkProperty('cellEditorParams', newParams);
  }, [currentEditorConfig, updateBulkProperty]);

  const getDefaultEditorParams = (editorType: string): Record<string, unknown> => {
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
        };
      
      case 'agRichSelectCellEditor':
        return {
          values: ['Option 1', 'Option 2', 'Option 3'],
          cellHeight: 30,
          searchType: 'fuzzy',
          allowTyping: true,
          filterList: true,
          highlightMatch: true,
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
      <div className="px-6 py-4 space-y-6">
        {/* Header with description */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold leading-none">Cell Editors</h3>
          <p className="text-sm text-muted-foreground">
            Choose editor types and customize their behavior for selected columns.
          </p>
        </div>

        {/* Cell Editor Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Editor Type</CardTitle>
            {recommendedEditor && currentEditor === 'none' && (
              <Alert className="mt-3">
                <Lightbulb className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Recommended: <strong>{CELL_EDITORS[Object.keys(CELL_EDITORS).find(k => CELL_EDITORS[k as keyof typeof CELL_EDITORS].value === recommendedEditor) as keyof typeof CELL_EDITORS]?.label}</strong> based on your column data type
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={currentEditor}
              onValueChange={handleEditorTypeChange}
              disabled={isDisabled}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select an editor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default (Auto)</SelectItem>
                <Separator className="my-1" />
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
                <Separator className="my-1" />
                <SelectItem value="custom">Custom Editor</SelectItem>
              </SelectContent>
            </Select>
            
            {currentEditor && currentEditor !== 'none' && currentEditor !== 'custom' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {CELL_EDITORS[Object.keys(CELL_EDITORS).find(k => CELL_EDITORS[k as keyof typeof CELL_EDITORS].value === currentEditor) as keyof typeof CELL_EDITORS]?.description}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Editor Parameters */}
        {currentEditor && currentEditor !== 'none' && currentEditor !== 'custom' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Editor Settings</CardTitle>
              <CardDescription className="text-sm">
                Configure editor-specific options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Editor Configuration */}
        {currentEditor === 'custom' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Custom Editor Setup</CardTitle>
              <CardDescription className="text-sm">
                Steps to implement a custom cell editor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomEditorConfig disabled={isDisabled} />
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
});

EditorsTab.displayName = 'EditorsTab';

// Text Editor Parameters - Memoized
const TextEditorParams: React.FC<{
  editorParams: Record<string, unknown>;
  onParamChange: (param: string, value: unknown) => void;
  disabled: boolean;
}> = React.memo(({ editorParams, onParamChange, disabled }) => {
  const handleMaxLengthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onParamChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined);
  }, [onParamChange]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="max-length" className="text-sm">Max Length</Label>
        <Input
          id="max-length"
          type="number"
          value={editorParams.maxLength || ''}
          onChange={handleMaxLengthChange}
          placeholder="No limit"
          disabled={disabled}
          className="h-8"
        />
        <p className="text-xs text-muted-foreground">
          Maximum number of characters allowed
        </p>
      </div>
    </div>
  );
});

TextEditorParams.displayName = 'TextEditorParams';

// Large Text Editor Parameters - Memoized
const LargeTextEditorParams: React.FC<{
  editorParams: Record<string, unknown>;
  onParamChange: (param: string, value: unknown) => void;
  disabled: boolean;
}> = React.memo(({ editorParams, onParamChange, disabled }) => {
  const handleRowsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onParamChange('rows', parseInt(e.target.value));
  }, [onParamChange]);

  const handleColsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onParamChange('cols', parseInt(e.target.value));
  }, [onParamChange]);

  const handleMaxLengthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onParamChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined);
  }, [onParamChange]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="rows" className="text-sm">Rows</Label>
          <Input
            id="rows"
            type="number"
            value={editorParams.rows || 5}
            onChange={handleRowsChange}
            min={1}
            disabled={disabled}
            className="h-8"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cols" className="text-sm">Columns</Label>
          <Input
            id="cols"
            type="number"
            value={editorParams.cols || 50}
            onChange={handleColsChange}
            min={1}
            disabled={disabled}
            className="h-8"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="max-length-large" className="text-sm">Max Length</Label>
        <Input
          id="max-length-large"
          type="number"
          value={editorParams.maxLength || ''}
          onChange={handleMaxLengthChange}
          placeholder="No limit"
          disabled={disabled}
          className="h-8"
        />
      </div>
    </div>
  );
});

LargeTextEditorParams.displayName = 'LargeTextEditorParams';

// Select Editor Parameters - Memoized with debouncing
const SelectEditorParams: React.FC<{
  editorType: string;
  editorParams: Record<string, unknown>;
  onParamChange: (param: string, value: unknown) => void;
  disabled: boolean;
}> = React.memo(({ editorType, editorParams, onParamChange, disabled }) => {
  const [valuesInput, setValuesInput] = useState(
    Array.isArray(editorParams.values) ? editorParams.values.join('\n') : ''
  );

  // Debounced values change handler
  const debouncedValuesChange = useMemo(
    () => debounce((input: string) => {
      const values = input.split('\n').filter(v => v.trim()).map(v => v.trim());
      onParamChange('values', values);
    }, 300),
    [onParamChange]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedValuesChange.cancel();
    };
  }, [debouncedValuesChange]);

  const handleValuesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    setValuesInput(input);
    debouncedValuesChange(input);
  }, [debouncedValuesChange]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm">Options (one per line)</Label>
        <Textarea
          value={valuesInput}
          onChange={handleValuesChange}
          placeholder="Option 1&#10;Option 2&#10;Option 3"
          rows={5}
          disabled={disabled}
          className="resize-none font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Enter each option on a new line
        </p>
      </div>

      {editorType === 'agRichSelectCellEditor' && (
        <>
          <div className="space-y-2">
            <Label className="text-sm">Search Type</Label>
            <Select
              value={editorParams.searchType || 'fuzzy'}
              onValueChange={(value) => onParamChange('searchType', value)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fuzzy">Fuzzy Search</SelectItem>
                <SelectItem value="text">Text Search</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cell-height" className="text-sm">Cell Height (px)</Label>
            <Input
              id="cell-height"
              type="number"
              value={editorParams.cellHeight || 30}
              onChange={(e) => onParamChange('cellHeight', parseInt(e.target.value))}
              min={20}
              disabled={disabled}
              className="h-8"
            />
          </div>
        </>
      )}
    </div>
  );
});

SelectEditorParams.displayName = 'SelectEditorParams';

// Number Editor Parameters - Memoized
const NumberEditorParams: React.FC<{
  editorParams: Record<string, unknown>;
  onParamChange: (param: string, value: unknown) => void;
  disabled: boolean;
}> = React.memo(({ editorParams, onParamChange, disabled }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="min" className="text-sm">Min Value</Label>
          <Input
            id="min"
            type="number"
            value={editorParams.min ?? ''}
            onChange={(e) => onParamChange('min', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="No minimum"
            disabled={disabled}
            className="h-8"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max" className="text-sm">Max Value</Label>
          <Input
            id="max"
            type="number"
            value={editorParams.max ?? ''}
            onChange={(e) => onParamChange('max', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="No maximum"
            disabled={disabled}
            className="h-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="precision" className="text-sm">Decimal Places</Label>
          <Input
            id="precision"
            type="number"
            value={editorParams.precision ?? ''}
            onChange={(e) => onParamChange('precision', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Any"
            min={0}
            disabled={disabled}
            className="h-8"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="step" className="text-sm">Step</Label>
          <Input
            id="step"
            type="number"
            value={editorParams.step || 1}
            onChange={(e) => onParamChange('step', parseFloat(e.target.value))}
            min={0}
            step="any"
            disabled={disabled}
            className="h-8"
          />
        </div>
      </div>
    </div>
  );
});

NumberEditorParams.displayName = 'NumberEditorParams';

// Date Editor Parameters - Memoized
const DateEditorParams: React.FC<{
  editorParams: Record<string, unknown>;
  onParamChange: (param: string, value: unknown) => void;
  disabled: boolean;
}> = React.memo(({ editorParams, onParamChange, disabled }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date-format" className="text-sm">Date Format</Label>
        <Input
          id="date-format"
          value={editorParams.format || ''}
          onChange={(e) => onParamChange('format', e.target.value)}
          placeholder="e.g., YYYY-MM-DD"
          disabled={disabled}
          className="h-8"
        />
        <p className="text-xs text-muted-foreground">
          Format string for displaying dates
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="min-date" className="text-sm">Min Date</Label>
          <Input
            id="min-date"
            type="date"
            value={editorParams.min || ''}
            onChange={(e) => onParamChange('min', e.target.value)}
            disabled={disabled}
            className="h-8"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-date" className="text-sm">Max Date</Label>
          <Input
            id="max-date"
            type="date"
            value={editorParams.max || ''}
            onChange={(e) => onParamChange('max', e.target.value)}
            disabled={disabled}
            className="h-8"
          />
        </div>
      </div>
    </div>
  );
});

DateEditorParams.displayName = 'DateEditorParams';

// Custom Editor Configuration - Memoized
const CustomEditorConfig: React.FC<{
  disabled: boolean;
}> = React.memo(({ disabled }) => {
  return (
    <div className="space-y-4">
      <Alert className="border-muted">
        <Code className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Custom editors require implementing a cell editor component
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Badge variant="secondary" className="text-xs">1</Badge>
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium">Create Editor Component</p>
            <code className="text-xs bg-muted px-2 py-1 rounded block">
              class CustomEditor implements ICellEditorComp
            </code>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Badge variant="secondary" className="text-xs">2</Badge>
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium">Implement Required Methods</p>
            <code className="text-xs bg-muted px-2 py-1 rounded block">
              getValue(), isPopup(), getGui()
            </code>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Badge variant="secondary" className="text-xs">3</Badge>
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium">Register the Component</p>
            <code className="text-xs bg-muted px-2 py-1 rounded block">
              cellEditor: CustomEditor
            </code>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="component-name" className="text-sm">Component Name</Label>
        <Input
          id="component-name"
          placeholder="e.g., MyCustomEditor"
          disabled={disabled}
          className="h-8"
        />
        <p className="text-xs text-muted-foreground">
          Enter the name of your custom editor component
        </p>
      </div>
    </div>
  );
});

CustomEditorConfig.displayName = 'CustomEditorConfig';