import React, { useState } from 'react';
import { PropertyGroup } from '../components/PropertyGroup';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { ThreeStateCheckbox } from '../components/ThreeStateCheckbox';
import { AlignmentIconPicker } from '../components/AlignmentIconPicker';
import { Button } from '@/components/ui/button';
import { Palette, Eraser } from 'lucide-react';
import { StyleEditor } from '../editors/StyleEditor';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { createCellStyleFunction } from '@/components/datatable/utils/formatters';

interface StylingTabProps {
  uiMode?: 'simple' | 'advanced';
}

export const StylingTab: React.FC<StylingTabProps> = ({ uiMode = 'simple' }) => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperty
  } = useColumnCustomizationStore();

  const [showCellStyleEditor, setShowCellStyleEditor] = useState(false);
  const [showHeaderStyleEditor, setShowHeaderStyleEditor] = useState(false);

  const getMixedValue = (property: string) => {
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

  const isDisabled = selectedColumns.size === 0;
  const isMultipleSelection = selectedColumns.size > 1;

  const handleCellStyleSave = (style: React.CSSProperties) => {
    // Check if we have conditional formatting that needs to be preserved
    let hasConditionalFormatting = false;
    let formatString = '';
    
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      if (colDef?.valueFormat && colDef.valueFormat.includes('[') && colDef.valueFormat.includes(']')) {
        hasConditionalFormatting = true;
        formatString = colDef.valueFormat;
      }
    });
    
    if (hasConditionalFormatting) {
      // Re-create the conditional style function with the new base style
      const cellStyleFn = createCellStyleFunction(formatString, style);
      updateBulkProperty('cellStyle', cellStyleFn);
    } else {
      // No conditional formatting, just save the style directly
      updateBulkProperty('cellStyle', style);
    }
  };

  const handleHeaderStyleSave = (style: React.CSSProperties) => {
    console.log('[StylingTab] Saving headerStyle:', {
      style,
      selectedColumnsCount: selectedColumns.size,
      selectedColumns: Array.from(selectedColumns)
    });
    
    // Create a function that applies styles only to regular headers, not floating filters
    const headerStyleFn = (params: { floatingFilter?: boolean }) => {
      // Don't apply styles to floating filter row
      if (params?.floatingFilter) {
        return null;
      }
      return style;
    };
    
    updateBulkProperty('headerStyle', headerStyleFn);
  };

  // Clear all styles
  const clearAllStyles = () => {
    updateBulkProperty('cellStyle', undefined);
    updateBulkProperty('headerStyle', undefined);
    updateBulkProperty('cellClass', undefined);
    updateBulkProperty('headerClass', undefined);
  };

  // Clear only cell styles
  const clearCellStyles = () => {
    // Check if we have conditional formatting that needs to be preserved
    let hasConditionalFormatting = false;
    let formatString = '';
    
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      if (colDef?.valueFormat && colDef.valueFormat.includes('[') && colDef.valueFormat.includes(']')) {
        hasConditionalFormatting = true;
        formatString = colDef.valueFormat;
      }
    });
    
    if (hasConditionalFormatting) {
      // Re-create the conditional style function without base styles
      const cellStyleFn = createCellStyleFunction(formatString, {});
      updateBulkProperty('cellStyle', cellStyleFn);
    } else {
      updateBulkProperty('cellStyle', undefined);
    }
    
    // Clear non-format related classes
    const currentCellClass = getMixedValue('cellClass');
    if (currentCellClass.value) {
      const classes = (currentCellClass.value as string).split(' ').filter(c => 
        c.startsWith('ag-numeric-cell') || c.startsWith('ag-currency-cell') || 
        c.startsWith('ag-percentage-cell') || c.startsWith('ag-date-cell')
      );
      updateBulkProperty('cellClass', classes.length > 0 ? classes.join(' ') : undefined);
    }
  };

  // Clear only header styles
  const clearHeaderStyles = () => {
    updateBulkProperty('headerStyle', undefined);
    updateBulkProperty('headerClass', undefined);
  };

  // Clear only alignment classes (keep other styles)
  const clearAlignment = () => {
    const currentHeaderClass = getMixedValue('headerClass');
    const currentCellClass = getMixedValue('cellClass');

    // Remove alignment classes from headerClass
    if (currentHeaderClass.value) {
      const headerClasses = (currentHeaderClass.value as string).split(' ').filter(c =>
        !c.startsWith('header-align-') && !c.startsWith('header-valign-')
      );
      updateBulkProperty('headerClass', headerClasses.length > 0 ? headerClasses.join(' ') : undefined);
    }

    // Remove alignment classes from cellClass
    if (currentCellClass.value) {
      const cellClasses = (currentCellClass.value as string).split(' ').filter(c =>
        !c.startsWith('cell-align-') && !c.startsWith('cell-valign-')
      );
      updateBulkProperty('cellClass', cellClasses.length > 0 ? cellClasses.join(' ') : undefined);
    }
  };

  // Get current cell style (if consistent across selected columns)
  const currentCellStyle = getMixedValue('cellStyle');
  const currentHeaderStyle = getMixedValue('headerStyle');
  
  // Extract style object from headerStyle if it's a function
  const getHeaderStyleObject = () => {
    if (currentHeaderStyle.value && typeof currentHeaderStyle.value === 'function') {
      // Call the function with non-floating filter context to get the style object
      return currentHeaderStyle.value({ floatingFilter: false });
    }
    return currentHeaderStyle.value;
  };

  // Extract style object from cellStyle if it's a function
  const getCellStyleObject = () => {
    if (currentCellStyle.value && typeof currentCellStyle.value === 'function') {
      // Don't pass function-based styles to the editor
      return {};
    }
    return currentCellStyle.value;
  };

  // Handle header alignment changes using headerClass (separate from headerStyle)
  const handleHeaderAlignmentChange = (alignment: string, type: 'horizontal' | 'vertical') => {
    const currentHeaderClass = getMixedValue('headerClass');
    // Ensure we always work with strings, not booleans
    const currentClassesRaw = currentHeaderClass.value;
    const currentClasses = (typeof currentClassesRaw === 'string' ? currentClassesRaw : '').trim();
    const classArray = currentClasses ? currentClasses.split(' ').filter(c => c) : [];

    // Remove existing alignment classes
    const filteredClasses = classArray.filter(c => {
      if (type === 'horizontal') {
        return !c.startsWith('header-align-');
      } else {
        return !c.startsWith('header-valign-');
      }
    });

    // Add new alignment class if not default
    if (alignment !== 'default') {
      const prefix = type === 'horizontal' ? 'header-align-' : 'header-valign-';
      const newClass = prefix + alignment;
      filteredClasses.push(newClass);
    }

    const newHeaderClass = filteredClasses.join(' ').trim();
    updateBulkProperty('headerClass', newHeaderClass || undefined);
  };

  // Handle cell alignment changes using cellClass
  const handleCellAlignmentChange = (alignment: string, type: 'horizontal' | 'vertical') => {
    const currentCellClass = getMixedValue('cellClass');
    // Ensure we always work with strings, not booleans
    const currentClassesRaw = currentCellClass.value;
    const currentClasses = (typeof currentClassesRaw === 'string' ? currentClassesRaw : '').trim();
    const classArray = currentClasses ? currentClasses.split(' ').filter(c => c) : [];

    // Remove existing alignment classes
    const filteredClasses = classArray.filter(c => {
      if (type === 'horizontal') {
        return !c.startsWith('cell-align-');
      } else {
        return !c.startsWith('cell-valign-');
      }
    });

    // Add new alignment class if not default
    if (alignment !== 'default') {
      const prefix = type === 'horizontal' ? 'cell-align-' : 'cell-valign-';
      const newClass = prefix + alignment;
      filteredClasses.push(newClass);
    }

    const newCellClass = filteredClasses.join(' ').trim();
    updateBulkProperty('cellClass', newCellClass || undefined);
  };

  // Extract current header alignment from headerClass
  const getCurrentHeaderAlignment = (type: 'horizontal' | 'vertical') => {
    const headerClassValue = getMixedValue('headerClass');
    const headerClassRaw = headerClassValue.value;
    const headerClass = (typeof headerClassRaw === 'string' ? headerClassRaw : '').trim();

    if (headerClassValue.isMixed) {
      return 'default';
    }

    const prefix = type === 'horizontal' ? 'header-align-' : 'header-valign-';
    const regex = new RegExp(prefix + '(\\w+)');
    const match = headerClass.match(regex);

    return match ? match[1] : 'default';
  };

  // Check if header alignment is mixed
  const isHeaderAlignmentMixed = () => {
    const headerClassValue = getMixedValue('headerClass');
    return headerClassValue.isMixed;
  };

  // Extract current cell alignment from cellClass
  const getCurrentCellAlignment = (type: 'horizontal' | 'vertical') => {
    const cellClassValue = getMixedValue('cellClass');
    const cellClassRaw = cellClassValue.value;
    const cellClass = (typeof cellClassRaw === 'string' ? cellClassRaw : '').trim();

    if (cellClassValue.isMixed) {
      return 'default';
    }

    const prefix = type === 'horizontal' ? 'cell-align-' : 'cell-valign-';
    const regex = new RegExp(prefix + '(\\w+)');
    const match = cellClass.match(regex);

    return match ? match[1] : 'default';
  };

  // Check if cell alignment is mixed
  const isCellAlignmentMixed = () => {
    const cellClassValue = getMixedValue('cellClass');
    return cellClassValue.isMixed;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Two-column layout for better space utilization */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Header Alignment */}
          <PropertyGroup title="Header Alignment">
            <div className="space-y-3">
              <AlignmentIconPicker
                label="Horizontal"
                type="horizontal"
                value={getCurrentHeaderAlignment('horizontal')}
                onChange={(value) => handleHeaderAlignmentChange(value, 'horizontal')}
                disabled={isDisabled || (isMultipleSelection && isHeaderAlignmentMixed('horizontal'))}
                isMixed={isMultipleSelection && isHeaderAlignmentMixed('horizontal')}
              />

              <AlignmentIconPicker
                label="Vertical"
                type="vertical"
                value={getCurrentHeaderAlignment('vertical')}
                onChange={(value) => handleHeaderAlignmentChange(value, 'vertical')}
                disabled={isDisabled || (isMultipleSelection && isHeaderAlignmentMixed('vertical'))}
                isMixed={isMultipleSelection && isHeaderAlignmentMixed('vertical')}
              />
            </div>
          </PropertyGroup>

          {/* Style Editors */}
          <PropertyGroup title="Style Editors">
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 h-8 text-xs"
                disabled={isDisabled}
                onClick={() => setShowHeaderStyleEditor(true)}
              >
                <Palette className="h-3.5 w-3.5" />
                Edit Header Style
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 h-8 text-xs"
                disabled={isDisabled}
                onClick={() => setShowCellStyleEditor(true)}
              >
                <Palette className="h-3.5 w-3.5" />
                Edit Cell Style
              </Button>
            </div>
          </PropertyGroup>

          {/* Text Display Options */}
          <PropertyGroup title="Text Display">
            <div className="space-y-2">
              <ThreeStateCheckbox
                label="Wrap Text"
                property="wrapText"
                mixedValue={getMixedValue('wrapText')}
                onChange={(value) => updateBulkProperty('wrapText', value)}
                disabled={isDisabled || (isMultipleSelection && getMixedValue('wrapText').isMixed)}
                description="Wrap long text within cells"
              />

              <ThreeStateCheckbox
                label="Auto Height"
                property="autoHeight"
                mixedValue={getMixedValue('autoHeight')}
                onChange={(value) => updateBulkProperty('autoHeight', value)}
                disabled={isDisabled || (isMultipleSelection && getMixedValue('autoHeight').isMixed)}
                description="Automatically adjust row height to fit content"
              />
            </div>
          </PropertyGroup>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Cell Alignment */}
          <PropertyGroup title="Cell Alignment">
            <div className="space-y-3">
              <AlignmentIconPicker
                label="Horizontal"
                type="horizontal"
                value={getCurrentCellAlignment('horizontal')}
                onChange={(value) => handleCellAlignmentChange(value, 'horizontal')}
                disabled={isDisabled || (isMultipleSelection && isCellAlignmentMixed('horizontal'))}
                isMixed={isMultipleSelection && isCellAlignmentMixed('horizontal')}
              />

              <AlignmentIconPicker
                label="Vertical"
                type="vertical"
                value={getCurrentCellAlignment('vertical')}
                onChange={(value) => handleCellAlignmentChange(value, 'vertical')}
                disabled={isDisabled || (isMultipleSelection && isCellAlignmentMixed('vertical'))}
                isMixed={isMultipleSelection && isCellAlignmentMixed('vertical')}
              />
            </div>
          </PropertyGroup>

          {/* Clear Styles */}
          <PropertyGroup title="Clear Styles">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  disabled={isDisabled}
                  onClick={clearHeaderStyles}
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Header
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  disabled={isDisabled}
                  onClick={clearCellStyles}
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Cell
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  disabled={isDisabled}
                  onClick={clearAlignment}
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Alignment
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  disabled={isDisabled}
                  onClick={clearAllStyles}
                >
                  <Eraser className="h-3.5 w-3.5" />
                  All
                </Button>
              </div>
            </div>
          </PropertyGroup>

          {/* Header Text Options */}
          <PropertyGroup title="Header Text">
            <div className="space-y-2">
              <ThreeStateCheckbox
                label="Wrap Header Text"
                property="wrapHeaderText"
                mixedValue={getMixedValue('wrapHeaderText')}
                onChange={(value) => updateBulkProperty('wrapHeaderText', value)}
                disabled={isDisabled || (isMultipleSelection && getMixedValue('wrapHeaderText').isMixed)}
                description="Wrap long text in column headers"
              />

              <ThreeStateCheckbox
                label="Auto Header Height"
                property="autoHeaderHeight"
                mixedValue={getMixedValue('autoHeaderHeight')}
                onChange={(value) => updateBulkProperty('autoHeaderHeight', value)}
                disabled={isDisabled || (isMultipleSelection && getMixedValue('autoHeaderHeight').isMixed)}
                description="Automatically adjust header height"
              />
            </div>
          </PropertyGroup>
        </div>
      </div>

      {/* Style Editors */}
      <StyleEditor
        open={showCellStyleEditor}
        onOpenChange={setShowCellStyleEditor}
        title="Cell Style Editor"
        initialStyle={currentCellStyle.isMixed ? {} : (getCellStyleObject() as React.CSSProperties || {})}
        onSave={handleCellStyleSave}
        isHeaderStyle={false}
      />

      <StyleEditor
        open={showHeaderStyleEditor}
        onOpenChange={setShowHeaderStyleEditor}
        title="Header Style Editor"
        initialStyle={currentHeaderStyle.isMixed ? {} : (getHeaderStyleObject() as React.CSSProperties || {})}
        onSave={handleHeaderStyleSave}
        isHeaderStyle={true}
      />
    </div>
  );
};