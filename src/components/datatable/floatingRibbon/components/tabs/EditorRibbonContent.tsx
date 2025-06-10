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
    <div className="ribbon-section-container">
      {/* Prerequisites Notice */}
      {!editableValue.value && !editableValue.isMixed && (
        <div className="ribbon-notice-container">
          <div className="ribbon-notice-content">
            <div className="ribbon-notice-text">
              Enable editing in the General tab to configure cell editors
            </div>
          </div>
        </div>
      )}

      {/* Editor Type Selection & Options */}
      <div className="ribbon-primary-controls">
        {/* Editor Type Selector */}
        <div className="ribbon-control-group">
          <div className="ribbon-control-label">
            <Edit3 className="ribbon-icon" />
            <Label className="ribbon-section-header">TYPE</Label>
          </div>
          <div className="ribbon-control-content">
            <ToggleGroup 
              type="single" 
              value={getCurrentEditorType()}
              onValueChange={handleEditorTypeChange}
              className="ribbon-toggle-group-compact"
            >
              <ToggleGroupItem 
                value="none" 
                className="ribbon-toggle-group-item ribbon-toggle-square"
                title="No Editor"
              >
                <X className="ribbon-icon-xs" />
              </ToggleGroupItem>
              {EDITOR_TYPES.map((editor) => {
                const Icon = editor.icon;
                return (
                  <ToggleGroupItem 
                    key={editor.value} 
                    value={editor.value}
                    className="ribbon-toggle-group-item ribbon-toggle-square"
                    title={`${editor.label} - ${editor.description}`}
                  >
                    <Icon className="ribbon-icon-xs" />
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          </div>
        </div>
        
        <Separator orientation="vertical" className="ribbon-separator" />
        
        {/* Editor Options */}
        <div className="ribbon-control-group">
          <div className="ribbon-control-label">
            <Label className="ribbon-section-header">OPTIONS</Label>
          </div>
          <div className="ribbon-control-content ribbon-options-grid">
            <div className="ribbon-option-item">
              <Label htmlFor="single-click">Single Click</Label>
              <Switch 
                id="single-click" 
                className="ribbon-switch" 
                checked={!singleClickEditValue.isMixed && singleClickEditValue.value === true}
                onCheckedChange={(checked) => updateBulkProperty('singleClickEdit', checked)}
                disabled={!editableValue.value}
              />
            </div>
            <div className="ribbon-option-item">
              <Label htmlFor="popup-editor">Popup</Label>
              <Switch 
                id="popup-editor" 
                className="ribbon-switch" 
                checked={!cellEditorPopupValue.isMixed && cellEditorPopupValue.value === true}
                onCheckedChange={(checked) => updateBulkProperty('cellEditorPopup', checked)}
                disabled={!editableValue.value}
              />
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="ribbon-action-group">
          <Button 
            variant="outline" 
            size="sm" 
            className="ribbon-action-button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            disabled={!editableValue.value || getCurrentEditorType() === 'none'}
          >
            <Settings className="ribbon-icon-xs" />
            <span>CONFIGURE</span>
            <ChevronDown className={`ribbon-icon-xs ribbon-chevron ${showAdvanced ? 'ribbon-chevron-expanded' : ''}`} />
          </Button>
        </div>
      </div>
      
      {/* Editor Description & Quick Actions */}
      {getCurrentEditorType() !== 'none' && getCurrentEditorType() !== '' && (
        <div className="ribbon-editor-info">
          <div className="ribbon-editor-description">
            <div className="ribbon-editor-title">
              {EDITOR_TYPES.find(e => e.value === getCurrentEditorType())?.label || 'Editor'}
            </div>
            <div className="ribbon-editor-subtitle">
              {EDITOR_TYPES.find(e => e.value === getCurrentEditorType())?.description || 'Configure editor settings below'}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="ribbon-quick-actions">
            {getCurrentEditorType() === 'agTextCellEditor' && (
              <Button
                variant="outline"
                size="sm"
                className="ribbon-quick-action"
                onClick={() => handleEditorParamChange('useFormatter', !currentEditorParams.useFormatter)}
              >
                <Check className={`ribbon-icon-xs ${currentEditorParams.useFormatter ? 'ribbon-check-active' : 'ribbon-check-inactive'}`} />
                <span>Use Formatter</span>
              </Button>
            )}
            
            {(getCurrentEditorType() === 'agSelectCellEditor' || getCurrentEditorType() === 'agRichSelectCellEditor') && (
              <Button
                variant="outline"
                size="sm"
                className="ribbon-quick-action"
                onClick={() => setShowAdvanced(true)}
              >
                <List className="ribbon-icon-xs" />
                <span>Edit Options</span>
              </Button>
            )}
            
            {getCurrentEditorType() === 'agNumberCellEditor' && (
              <Button
                variant="outline"
                size="sm"
                className="ribbon-quick-action"
                onClick={() => handleEditorParamChange('showStepperButtons', !currentEditorParams.showStepperButtons)}
              >
                <Check className={`ribbon-icon-xs ${currentEditorParams.showStepperButtons !== false ? 'ribbon-check-active' : 'ribbon-check-inactive'}`} />
                <span>Stepper</span>
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="ribbon-quick-action ribbon-destructive-action"
              onClick={() => handleEditorTypeChange('none')}
            >
              <X className="ribbon-icon-xs" />
              <span>Disable</span>
            </Button>
          </div>
        </div>
      )}
      
      {/* Advanced Configuration Panel */}
      {showAdvanced && getCurrentEditorType() !== 'none' && getCurrentEditorType() !== '' && (
        <div className="ribbon-config-panel">
          <div className="ribbon-config-header">
            <Label className="ribbon-config-title">EDITOR CONFIGURATION</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ribbon-config-close"
              onClick={() => setShowAdvanced(false)}
            >
              <X className="ribbon-icon-xs" />
            </Button>
          </div>
          
          <div className="ribbon-config-content">
            {/* Auto-detect Option */}
            <div className="ribbon-config-section">
              <Button
                variant="outline"
                size="sm"
                className="ribbon-auto-detect-button"
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
                <Sparkles className="ribbon-icon-xs" />
                <span>Auto-detect Best Editor</span>
              </Button>
              <p className="ribbon-auto-detect-description">
                Automatically selects the most appropriate editor based on your column data type
              </p>
            </div>

            {/* Text Editor Parameters */}
            {getCurrentEditorType() === 'agTextCellEditor' && (
              <div className="ribbon-config-section">
                <div className="ribbon-field-group">
                  <Label className="ribbon-field-label">Max Length</Label>
                  <Input 
                    type="number"
                    className="ribbon-input"
                    placeholder="No limit"
                    value={currentEditorParams.maxLength || ''}
                    onChange={(e) => handleEditorParamChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              </div>
            )}
            
            {/* Large Text Editor Parameters */}
            {getCurrentEditorType() === 'agLargeTextCellEditor' && (
              <div className="ribbon-config-section">
                <div className="ribbon-field-grid">
                  <div className="ribbon-field-group">
                    <Label className="ribbon-field-label">Rows</Label>
                    <Input 
                      type="number"
                      className="ribbon-input"
                      value={currentEditorParams.rows || 5}
                      onChange={(e) => handleEditorParamChange('rows', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="ribbon-field-group">
                    <Label className="ribbon-field-label">Columns</Label>
                    <Input 
                      type="number"
                      className="ribbon-input"
                      value={currentEditorParams.cols || 50}
                      onChange={(e) => handleEditorParamChange('cols', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="ribbon-field-group">
                  <Label className="ribbon-field-label">Max Length</Label>
                  <Input 
                    type="number"
                    className="ribbon-input"
                    placeholder="No limit"
                    value={currentEditorParams.maxLength || ''}
                    onChange={(e) => handleEditorParamChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              </div>
            )}
            
            {/* Select Editor Parameters */}
            {(getCurrentEditorType() === 'agSelectCellEditor' || getCurrentEditorType() === 'agRichSelectCellEditor') && (
              <div className="ribbon-config-section">
                <div className="ribbon-field-group">
                  <div className="ribbon-field-header">
                    <Label className="ribbon-field-label">Options (one per line)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ribbon-field-action"
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
                    className="ribbon-textarea"
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
                    <div className="ribbon-field-grid">
                      <div className="ribbon-field-group">
                        <Label className="ribbon-field-label">Search Type</Label>
                        <Select
                          value={currentEditorParams.searchType || 'fuzzy'}
                          onValueChange={(value) => handleEditorParamChange('searchType', value)}
                        >
                          <SelectTrigger className="ribbon-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[100]">
                            <SelectItem value="fuzzy">Fuzzy</SelectItem>
                            <SelectItem value="text">Text</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="ribbon-field-group">
                        <Label className="ribbon-field-label">Cell Height</Label>
                        <Input 
                          type="number"
                          className="ribbon-input"
                          value={currentEditorParams.cellHeight || 30}
                          onChange={(e) => handleEditorParamChange('cellHeight', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="ribbon-switches-row">
                      <div className="ribbon-switch-item">
                        <Switch 
                          className="ribbon-switch" 
                          checked={currentEditorParams.allowTyping !== false}
                          onCheckedChange={(checked) => handleEditorParamChange('allowTyping', checked)}
                        />
                        <Label className="ribbon-switch-label">Allow Typing</Label>
                      </div>
                      <div className="ribbon-switch-item">
                        <Switch 
                          className="ribbon-switch" 
                          checked={currentEditorParams.filterList !== false}
                          onCheckedChange={(checked) => handleEditorParamChange('filterList', checked)}
                        />
                        <Label className="ribbon-switch-label">Filter List</Label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Number Editor Parameters */}
            {getCurrentEditorType() === 'agNumberCellEditor' && (
              <div className="ribbon-config-section">
                <div className="ribbon-field-grid">
                  <div className="ribbon-field-group">
                    <Label className="ribbon-field-label">Min Value</Label>
                    <Input 
                      type="number"
                      className="ribbon-input"
                      placeholder="No minimum"
                      value={currentEditorParams.min ?? ''}
                      onChange={(e) => handleEditorParamChange('min', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                  <div className="ribbon-field-group">
                    <Label className="ribbon-field-label">Max Value</Label>
                    <Input 
                      type="number"
                      className="ribbon-input"
                      placeholder="No maximum"
                      value={currentEditorParams.max ?? ''}
                      onChange={(e) => handleEditorParamChange('max', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                </div>
                <div className="ribbon-field-grid">
                  <div className="ribbon-field-group">
                    <Label className="ribbon-field-label">Decimal Places</Label>
                    <Input 
                      type="number"
                      className="ribbon-input"
                      placeholder="Any"
                      value={currentEditorParams.precision ?? ''}
                      onChange={(e) => handleEditorParamChange('precision', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                  <div className="ribbon-field-group">
                    <Label className="ribbon-field-label">Step</Label>
                    <Input 
                      type="number"
                      className="ribbon-input"
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
              <div className="ribbon-config-section">
                <div className="ribbon-field-group">
                  <Label className="ribbon-field-label">Date Format</Label>
                  <Input 
                    className="ribbon-input"
                    placeholder="e.g., YYYY-MM-DD"
                    value={currentEditorParams.format || ''}
                    onChange={(e) => handleEditorParamChange('format', e.target.value)}
                  />
                </div>
                <div className="ribbon-field-grid">
                  <div className="ribbon-field-group">
                    <Label className="ribbon-field-label">Min Date</Label>
                    <Input 
                      type="date"
                      className="ribbon-input"
                      value={currentEditorParams.min || ''}
                      onChange={(e) => handleEditorParamChange('min', e.target.value)}
                    />
                  </div>
                  <div className="ribbon-field-group">
                    <Label className="ribbon-field-label">Max Date</Label>
                    <Input 
                      type="date"
                      className="ribbon-input"
                      value={currentEditorParams.max || ''}
                      onChange={(e) => handleEditorParamChange('max', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Checkbox Editor Parameters */}
            {getCurrentEditorType() === 'agCheckboxCellEditor' && (
              <div className="ribbon-config-section">
                <div className="ribbon-field-grid">
                  <div className="ribbon-field-group">
                    <Label className="ribbon-field-label">Checked Value</Label>
                    <Input 
                      className="ribbon-input"
                      value={currentEditorParams.checkedValue?.toString() || 'true'}
                      onChange={(e) => handleEditorParamChange('checkedValue', e.target.value)}
                    />
                  </div>
                  <div className="ribbon-field-group">
                    <Label className="ribbon-field-label">Unchecked Value</Label>
                    <Input 
                      className="ribbon-input"
                      value={currentEditorParams.uncheckedValue?.toString() || 'false'}
                      onChange={(e) => handleEditorParamChange('uncheckedValue', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};