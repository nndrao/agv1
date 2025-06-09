import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  Edit3,
  Type,
  Hash,
  Calendar,
  ChevronDown,
  Settings,
  Sparkles,
  X,
  ToggleLeft,
  List,
  FileText,
  Check
} from 'lucide-react';
import { useColumnCustomizationStore } from '../../../dialogs/columnSettings/store/columnCustomization.store';
import type { TabContentProps } from '../../types';
import '../../ribbon-styles.css';

// Editor types with icons
const EDITOR_TYPES = [
  { value: 'agTextCellEditor', label: 'Text', icon: Type, description: 'Standard text input' },
  { value: 'agLargeTextCellEditor', label: 'Large Text', icon: FileText, description: 'Multi-line text area' },
  { value: 'agNumberCellEditor', label: 'Number', icon: Hash, description: 'Numeric input with validation' },
  { value: 'agDateCellEditor', label: 'Date', icon: Calendar, description: 'Date picker' },
  { value: 'agSelectCellEditor', label: 'Select', icon: List, description: 'Dropdown list' },
  { value: 'agRichSelectCellEditor', label: 'Rich Select', icon: ChevronDown, description: 'Advanced dropdown' },
  { value: 'agCheckboxCellEditor', label: 'Checkbox', icon: ToggleLeft, description: 'Boolean checkbox' }
];

export const EditorRibbonContent: React.FC<TabContentProps> = ({ selectedColumns }) => {
  const { updateBulkProperty, columnDefinitions, pendingChanges } = useColumnCustomizationStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectValues, setSelectValues] = useState<string[]>(['Option 1', 'Option 2', 'Option 3']);
  const [selectValuesText, setSelectValuesText] = useState('Option 1\nOption 2\nOption 3');

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

  const editableValue = getMixedValueLocal('editable');
  const cellEditorValue = getMixedValueLocal('cellEditor');
  const singleClickEditValue = getMixedValueLocal('singleClickEdit');
  const cellEditorPopupValue = getMixedValueLocal('cellEditorPopup');
  const cellEditorParamsValue = getMixedValueLocal('cellEditorParams');

  const handleEditorTypeChange = (value: string) => {
    if (value === 'none') {
      updateBulkProperty('cellEditor', undefined);
      updateBulkProperty('cellEditorParams', undefined);
    } else {
      updateBulkProperty('cellEditor', value);
      
      // Set default editor params based on type
      const defaultParams = getDefaultEditorParams(value);
      if (defaultParams) {
        updateBulkProperty('cellEditorParams', defaultParams);
      }
    }
  };

  const getDefaultEditorParams = (editorType: string) => {
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
          values: selectValues,
        };
      case 'agRichSelectCellEditor':
        return {
          values: selectValues,
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
      case 'agCheckboxCellEditor':
        return {
          checkedValue: true,
          uncheckedValue: false,
        };
      default:
        return {};
    }
  };

  const getCurrentEditorType = () => {
    if (cellEditorValue.isMixed) return '';
    if (!cellEditorValue.value) return 'none';
    return cellEditorValue.value as string || 'none';
  };

  const currentEditorParams = cellEditorParamsValue.value as Record<string, any> || {};

  // Sync selectValuesText when editor params change
  useEffect(() => {
    if (currentEditorParams.values && Array.isArray(currentEditorParams.values)) {
      setSelectValues(currentEditorParams.values);
      setSelectValuesText(currentEditorParams.values.join('\n'));
    }
  }, [currentEditorParams.values]);

  const handleEditorParamChange = (param: string, value: any) => {
    const newParams = { ...currentEditorParams, [param]: value };
    updateBulkProperty('cellEditorParams', newParams);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Show notice if editing is not enabled */}
      {!editableValue.value && !editableValue.isMixed && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border border-muted-foreground/20">
          <div className="text-xs text-muted-foreground">
            Enable editing in the General tab to configure cell editors
          </div>
        </div>
      )}
      {/* Row 1: Editor Type Selection and Quick Options */}
      <div className="flex items-center gap-3">
        {/* Editor Type Selector */}
        <div className="flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-muted-foreground" />
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Type:</Label>
          <ToggleGroup 
            type="single" 
            value={getCurrentEditorType()}
            onValueChange={handleEditorTypeChange}
            className="flex gap-1"
          >
            <ToggleGroupItem value="none" className="ribbon-toggle-group-item h-7 px-2 text-xs">
              <X className="h-3 w-3" />
            </ToggleGroupItem>
            {EDITOR_TYPES.map((editor) => {
              const Icon = editor.icon;
              return (
                <ToggleGroupItem 
                  key={editor.value} 
                  value={editor.value}
                  className="ribbon-toggle-group-item h-7 px-2 text-xs"
                  title={editor.label}
                >
                  <Icon className="h-3 w-3" />
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Editor Options */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="single-click" className="text-xs text-muted-foreground">Single Click:</Label>
            <Switch 
              id="single-click" 
              className="h-4 w-7" 
              checked={!singleClickEditValue.isMixed && singleClickEditValue.value === true}
              onCheckedChange={(checked) => updateBulkProperty('singleClickEdit', checked)}
              disabled={!editableValue.value}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="popup-editor" className="text-xs text-muted-foreground">Popup:</Label>
            <Switch 
              id="popup-editor" 
              className="h-4 w-7" 
              checked={!cellEditorPopupValue.isMixed && cellEditorPopupValue.value === true}
              onCheckedChange={(checked) => updateBulkProperty('cellEditorPopup', checked)}
              disabled={!editableValue.value}
            />
          </div>
        </div>
        
        <div className="ml-auto flex items-center gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={() => setShowAdvanced(!showAdvanced)}
            disabled={!editableValue.value || getCurrentEditorType() === 'none'}
          >
            <Settings className="h-3 w-3 mr-1" />
            Configure
            <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={() => {
              // Detect data type and apply recommended editor
              const dataTypes = new Set<string>();
              selectedColumns.forEach(colId => {
                const colDef = columnDefinitions.get(colId);
                const dataType = (colDef?.cellDataType || colDef?.type || 'text') as string;
                dataTypes.add(dataType);
              });
              
              if (dataTypes.size === 1) {
                const dataType = Array.from(dataTypes)[0];
                let recommendedEditor = 'agTextCellEditor';
                
                if (dataType === 'number' || dataType === 'numeric') {
                  recommendedEditor = 'agNumberCellEditor';
                } else if (dataType === 'date' || dataType === 'dateString') {
                  recommendedEditor = 'agDateCellEditor';
                } else if (dataType === 'boolean') {
                  recommendedEditor = 'agCheckboxCellEditor';
                }
                
                handleEditorTypeChange(recommendedEditor);
              }
            }}
          >
            <Sparkles className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Row 2: Editor Description and Quick Setup */}
      {getCurrentEditorType() !== 'none' && getCurrentEditorType() !== '' && (
        <div className="flex items-center gap-4 px-3 py-2 bg-muted/30 rounded-md">
          <div className="flex-1">
            <div className="text-xs font-medium mb-1">
              {EDITOR_TYPES.find(e => e.value === getCurrentEditorType())?.label || 'Editor'}
            </div>
            <div className="text-xs text-muted-foreground">
              {EDITOR_TYPES.find(e => e.value === getCurrentEditorType())?.description || 'Configure editor settings below'}
            </div>
          </div>
          
          {/* Quick Actions based on editor type */}
          <div className="flex items-center gap-2">
            {getCurrentEditorType() === 'agTextCellEditor' && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => handleEditorParamChange('useFormatter', !currentEditorParams.useFormatter)}
              >
                <Check className={`h-3 w-3 ${currentEditorParams.useFormatter ? '' : 'opacity-30'}`} />
                Use Formatter
              </Button>
            )}
            
            {(getCurrentEditorType() === 'agSelectCellEditor' || getCurrentEditorType() === 'agRichSelectCellEditor') && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => setShowAdvanced(true)}
              >
                <List className="h-3 w-3" />
                Edit Options
              </Button>
            )}
            
            {getCurrentEditorType() === 'agNumberCellEditor' && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => handleEditorParamChange('showStepperButtons', !currentEditorParams.showStepperButtons)}
              >
                <Check className={`h-3 w-3 ${currentEditorParams.showStepperButtons !== false ? '' : 'opacity-30'}`} />
                Stepper
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 gap-1 text-xs text-destructive"
              onClick={() => handleEditorTypeChange('none')}
            >
              <X className="h-3 w-3" />
              Disable
            </Button>
          </div>
        </div>
      )}
      
      {/* Row 3: Editor Parameters */}
      {showAdvanced && getCurrentEditorType() !== 'none' && getCurrentEditorType() !== '' && (
        <div className="px-3 py-2 border rounded-md space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Editor Configuration</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => setShowAdvanced(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Text Editor Parameters */}
          {getCurrentEditorType() === 'agTextCellEditor' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Max Length</Label>
                <Input 
                  type="number"
                  className="h-7 text-xs"
                  placeholder="No limit"
                  value={currentEditorParams.maxLength || ''}
                  onChange={(e) => handleEditorParamChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
          )}
          
          {/* Large Text Editor Parameters */}
          {getCurrentEditorType() === 'agLargeTextCellEditor' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Rows</Label>
                  <Input 
                    type="number"
                    className="h-7 text-xs"
                    value={currentEditorParams.rows || 5}
                    onChange={(e) => handleEditorParamChange('rows', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Columns</Label>
                  <Input 
                    type="number"
                    className="h-7 text-xs"
                    value={currentEditorParams.cols || 50}
                    onChange={(e) => handleEditorParamChange('cols', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Max Length</Label>
                <Input 
                  type="number"
                  className="h-7 text-xs"
                  placeholder="No limit"
                  value={currentEditorParams.maxLength || ''}
                  onChange={(e) => handleEditorParamChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
          )}
          
          {/* Select Editor Parameters */}
          {(getCurrentEditorType() === 'agSelectCellEditor' || getCurrentEditorType() === 'agRichSelectCellEditor') && (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Options (one per line)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      const values = selectValuesText.split('\n').filter(v => v.trim());
                      setSelectValues(values);
                      handleEditorParamChange('values', values);
                    }}
                  >
                    Apply
                  </Button>
                </div>
                <Textarea 
                  className="min-h-[80px] text-xs font-mono resize-none"
                  value={selectValuesText}
                  onChange={(e) => setSelectValuesText(e.target.value)}
                  onBlur={() => {
                    const values = selectValuesText.split('\n').filter(v => v.trim());
                    setSelectValues(values);
                    handleEditorParamChange('values', values);
                  }}
                  placeholder="Enter options, one per line"
                />
              </div>
              
              {getCurrentEditorType() === 'agRichSelectCellEditor' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Search Type</Label>
                      <Select
                        value={currentEditorParams.searchType || 'fuzzy'}
                        onValueChange={(value) => handleEditorParamChange('searchType', value)}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                          <SelectItem value="fuzzy">Fuzzy</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Cell Height</Label>
                      <Input 
                        type="number"
                        className="h-7 text-xs"
                        value={currentEditorParams.cellHeight || 30}
                        onChange={(e) => handleEditorParamChange('cellHeight', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch 
                        className="h-4 w-7" 
                        checked={currentEditorParams.allowTyping !== false}
                        onCheckedChange={(checked) => handleEditorParamChange('allowTyping', checked)}
                      />
                      <Label className="text-xs">Allow Typing</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        className="h-4 w-7" 
                        checked={currentEditorParams.filterList !== false}
                        onCheckedChange={(checked) => handleEditorParamChange('filterList', checked)}
                      />
                      <Label className="text-xs">Filter List</Label>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Number Editor Parameters */}
          {getCurrentEditorType() === 'agNumberCellEditor' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Min Value</Label>
                  <Input 
                    type="number"
                    className="h-7 text-xs"
                    placeholder="No minimum"
                    value={currentEditorParams.min ?? ''}
                    onChange={(e) => handleEditorParamChange('min', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Max Value</Label>
                  <Input 
                    type="number"
                    className="h-7 text-xs"
                    placeholder="No maximum"
                    value={currentEditorParams.max ?? ''}
                    onChange={(e) => handleEditorParamChange('max', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Decimal Places</Label>
                  <Input 
                    type="number"
                    className="h-7 text-xs"
                    placeholder="Any"
                    value={currentEditorParams.precision ?? ''}
                    onChange={(e) => handleEditorParamChange('precision', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Step</Label>
                  <Input 
                    type="number"
                    className="h-7 text-xs"
                    value={currentEditorParams.step || 1}
                    step="any"
                    onChange={(e) => handleEditorParamChange('step', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Date Editor Parameters */}
          {getCurrentEditorType() === 'agDateCellEditor' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Date Format</Label>
                <Input 
                  className="h-7 text-xs"
                  placeholder="e.g., YYYY-MM-DD"
                  value={currentEditorParams.format || ''}
                  onChange={(e) => handleEditorParamChange('format', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Min Date</Label>
                  <Input 
                    type="date"
                    className="h-7 text-xs"
                    value={currentEditorParams.min || ''}
                    onChange={(e) => handleEditorParamChange('min', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Max Date</Label>
                  <Input 
                    type="date"
                    className="h-7 text-xs"
                    value={currentEditorParams.max || ''}
                    onChange={(e) => handleEditorParamChange('max', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Checkbox Editor Parameters */}
          {getCurrentEditorType() === 'agCheckboxCellEditor' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Checked Value</Label>
                  <Input 
                    className="h-7 text-xs"
                    value={currentEditorParams.checkedValue?.toString() || 'true'}
                    onChange={(e) => handleEditorParamChange('checkedValue', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Unchecked Value</Label>
                  <Input 
                    className="h-7 text-xs"
                    value={currentEditorParams.uncheckedValue?.toString() || 'false'}
                    onChange={(e) => handleEditorParamChange('uncheckedValue', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};