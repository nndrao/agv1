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
  Check,
  RotateCcw,
  Square
} from 'lucide-react';
import { useColumnFormattingStore } from '../../store/columnFormatting.store';
import type { TabContentProps } from '../../types';
import '../../custom-styles.css';

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

export const EditorCustomContent: React.FC<TabContentProps> = ({ selectedColumns }) => {
  const { updateBulkProperty, columnDefinitions, pendingChanges } = useColumnFormattingStore();
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

  const resetEditor = () => {
    updateBulkProperty('cellEditor', undefined);
    updateBulkProperty('cellEditorParams', undefined);
    updateBulkProperty('singleClickEdit', false);
    updateBulkProperty('cellEditorPopup', false);
    setShowAdvanced(false);
  };

  return (
    <div className="flex h-full gap-4">
      {/* Main controls section */}
      <div className="flex-1">
        {/* Prerequisites Notice */}
        {!editableValue.value && !editableValue.isMixed && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 rounded-md p-2 mb-3">
            <div className="text-xs text-amber-700 dark:text-amber-300">
              Enable editing in the General tab to configure cell editors
            </div>
          </div>
        )}

        {/* Editor Type Selection */}
        <div className="flex items-center justify-between mb-3">
          <Label className="ribbon-section-header">EDITOR TYPE</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetEditor}
            className="h-6 px-2 text-xs"
            disabled={!editableValue.value}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>

        {/* Main content - Grid layout */}
        <div className="space-y-3">
          {/* Editor Type Toggle Group */}
          <div className="flex flex-wrap gap-1">
            <ToggleGroup 
              type="single" 
              value={getCurrentEditorType()}
              onValueChange={handleEditorTypeChange}
              disabled={!editableValue.value}
            >
              <ToggleGroupItem 
                value="none" 
                className="h-8 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
                title="No Editor"
              >
                <X className="h-3 w-3 mr-1" />
                None
              </ToggleGroupItem>
              {EDITOR_TYPES.map((editor) => {
                const Icon = editor.icon;
                return (
                  <ToggleGroupItem 
                    key={editor.value} 
                    value={editor.value}
                    className="h-8 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
                    title={editor.description}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {editor.label}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          </div>

          {/* Editor Options */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">
            {/* Single Click Edit */}
            <div className="flex items-center gap-2">
              <Switch 
                id="single-click" 
                checked={!singleClickEditValue.isMixed && singleClickEditValue.value === true}
                onCheckedChange={(checked) => updateBulkProperty('singleClickEdit', checked)}
                disabled={!editableValue.value}
                className="h-4 w-7"
              />
              <Label htmlFor="single-click" className="text-xs cursor-pointer">
                Single Click Edit
              </Label>
            </div>

            {/* Popup Editor */}
            <div className="flex items-center gap-2">
              <Switch 
                id="popup-editor" 
                checked={!cellEditorPopupValue.isMixed && cellEditorPopupValue.value === true}
                onCheckedChange={(checked) => updateBulkProperty('cellEditorPopup', checked)}
                disabled={!editableValue.value}
                className="h-4 w-7"
              />
              <Label htmlFor="popup-editor" className="text-xs cursor-pointer">
                Popup Editor
              </Label>
            </div>

            {/* Configure Button */}
            {getCurrentEditorType() !== 'none' && (
              <div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-3 text-xs"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  disabled={!editableValue.value}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Configure
                  <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            )}
          </div>

          {/* Configuration Panel */}
          {showAdvanced && getCurrentEditorType() !== 'none' && (
            <div className="border rounded-md p-4 space-y-4 bg-muted/5">
              {/* Text Editor Parameters */}
              {getCurrentEditorType() === 'agTextCellEditor' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="ribbon-section-header">MAX LENGTH</Label>
                    <Input 
                      type="number"
                      className="h-7 text-xs"
                      placeholder="No limit"
                      value={currentEditorParams.maxLength || ''}
                      onChange={(e) => handleEditorParamChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="use-formatter"
                      checked={currentEditorParams.useFormatter === true}
                      onCheckedChange={(checked) => handleEditorParamChange('useFormatter', checked)}
                      className="h-4 w-7"
                    />
                    <Label htmlFor="use-formatter" className="text-xs cursor-pointer">
                      Use Formatter
                    </Label>
                  </div>
                </div>
              )}
              
              {/* Large Text Editor Parameters */}
              {getCurrentEditorType() === 'agLargeTextCellEditor' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="ribbon-section-header">ROWS</Label>
                    <Input 
                      type="number"
                      className="h-7 text-xs"
                      value={currentEditorParams.rows || 5}
                      onChange={(e) => handleEditorParamChange('rows', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="ribbon-section-header">COLUMNS</Label>
                    <Input 
                      type="number"
                      className="h-7 text-xs"
                      value={currentEditorParams.cols || 50}
                      onChange={(e) => handleEditorParamChange('cols', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="ribbon-section-header">MAX LENGTH</Label>
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
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="ribbon-section-header">OPTIONS (ONE PER LINE)</Label>
                    <Textarea 
                      className="min-h-[80px] text-xs font-mono"
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="ribbon-section-header">SEARCH TYPE</Label>
                        <Select
                          value={currentEditorParams.searchType || 'fuzzy'}
                          onValueChange={(value) => handleEditorParamChange('searchType', value)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fuzzy">Fuzzy</SelectItem>
                            <SelectItem value="text">Text</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="ribbon-section-header">CELL HEIGHT</Label>
                        <Input 
                          type="number"
                          className="h-7 text-xs"
                          value={currentEditorParams.cellHeight || 30}
                          onChange={(e) => handleEditorParamChange('cellHeight', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={currentEditorParams.allowTyping !== false}
                          onCheckedChange={(checked) => handleEditorParamChange('allowTyping', checked)}
                          className="h-4 w-7"
                        />
                        <Label className="text-xs cursor-pointer">Allow Typing</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={currentEditorParams.filterList !== false}
                          onCheckedChange={(checked) => handleEditorParamChange('filterList', checked)}
                          className="h-4 w-7"
                        />
                        <Label className="text-xs cursor-pointer">Filter List</Label>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Number Editor Parameters */}
              {getCurrentEditorType() === 'agNumberCellEditor' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="ribbon-section-header">MIN VALUE</Label>
                      <Input 
                        type="number"
                        className="h-7 text-xs"
                        placeholder="No minimum"
                        value={currentEditorParams.min ?? ''}
                        onChange={(e) => handleEditorParamChange('min', e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="ribbon-section-header">MAX VALUE</Label>
                      <Input 
                        type="number"
                        className="h-7 text-xs"
                        placeholder="No maximum"
                        value={currentEditorParams.max ?? ''}
                        onChange={(e) => handleEditorParamChange('max', e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="ribbon-section-header">DECIMAL PLACES</Label>
                      <Input 
                        type="number"
                        className="h-7 text-xs"
                        placeholder="Any"
                        value={currentEditorParams.precision ?? ''}
                        onChange={(e) => handleEditorParamChange('precision', e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="ribbon-section-header">STEP</Label>
                      <Input 
                        type="number"
                        className="h-7 text-xs"
                        value={currentEditorParams.step || 1}
                        step="any"
                        onChange={(e) => handleEditorParamChange('step', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={currentEditorParams.showStepperButtons !== false}
                      onCheckedChange={(checked) => handleEditorParamChange('showStepperButtons', checked)}
                      className="h-4 w-7"
                    />
                    <Label className="text-xs cursor-pointer">Show Stepper Buttons</Label>
                  </div>
                </div>
              )}
              
              {/* Date Editor Parameters */}
              {getCurrentEditorType() === 'agDateCellEditor' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="ribbon-section-header">MIN DATE</Label>
                      <Input 
                        type="date"
                        className="h-7 text-xs"
                        value={currentEditorParams.min || ''}
                        onChange={(e) => handleEditorParamChange('min', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="ribbon-section-header">MAX DATE</Label>
                      <Input 
                        type="date"
                        className="h-7 text-xs"
                        value={currentEditorParams.max || ''}
                        onChange={(e) => handleEditorParamChange('max', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="ribbon-section-header">DATE FORMAT</Label>
                    <Input 
                      className="h-7 text-xs"
                      placeholder="e.g., YYYY-MM-DD"
                      value={currentEditorParams.format || ''}
                      onChange={(e) => handleEditorParamChange('format', e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              {/* Checkbox Editor Parameters */}
              {getCurrentEditorType() === 'agCheckboxCellEditor' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="ribbon-section-header">CHECKED VALUE</Label>
                    <Input 
                      className="h-7 text-xs"
                      value={currentEditorParams.checkedValue?.toString() || 'true'}
                      onChange={(e) => handleEditorParamChange('checkedValue', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="ribbon-section-header">UNCHECKED VALUE</Label>
                    <Input 
                      className="h-7 text-xs"
                      value={currentEditorParams.uncheckedValue?.toString() || 'false'}
                      onChange={(e) => handleEditorParamChange('uncheckedValue', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview section */}
      <div className="w-48 border-l pl-3">
        <Label className="ribbon-section-header mb-2 block">EDITOR INFO</Label>
        <div className="space-y-3">
          {/* Current Editor */}
          <div>
            <div className="text-[10px] text-muted-foreground mb-1">Current Editor</div>
            <div className={`p-2 border rounded min-h-[32px] flex items-center ${
              getCurrentEditorType() !== 'none' && getCurrentEditorType() !== '' 
                ? 'bg-primary/10 border-primary/30' 
                : 'bg-muted/20'
            }`}>
              {getCurrentEditorType() === 'none' ? (
                <span className="text-xs text-muted-foreground">No editor configured</span>
              ) : getCurrentEditorType() === '' ? (
                <span className="text-xs text-muted-foreground">Mixed values</span>
              ) : (
                <div className="flex items-center gap-2">
                  {(() => {
                    const editor = EDITOR_TYPES.find(e => e.value === getCurrentEditorType());
                    if (editor) {
                      const Icon = editor.icon;
                      return (
                        <>
                          <Icon className="h-3 w-3 text-primary" />
                          <span className="text-xs font-semibold text-primary">{editor.label}</span>
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          </div>
          
          {/* Editor Description */}
          {getCurrentEditorType() !== 'none' && getCurrentEditorType() !== '' && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Description</div>
              <div className="text-xs text-muted-foreground">
                {EDITOR_TYPES.find(e => e.value === getCurrentEditorType())?.description}
              </div>
            </div>
          )}

          {/* Editor Settings Summary */}
          {getCurrentEditorType() !== 'none' && getCurrentEditorType() !== '' && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-1">Settings</div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Single Click:</span>
                  <span className="font-medium">{singleClickEditValue.value ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Popup:</span>
                  <span className="font-medium">{cellEditorPopupValue.value ? 'Yes' : 'No'}</span>
                </div>
                {currentEditorParams && Object.keys(currentEditorParams).length > 0 && (
                  <div className="pt-1 border-t">
                    <span className="text-muted-foreground">Configured</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};