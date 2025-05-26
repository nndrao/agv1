import React, { useState } from 'react';
import { PropertyGroup } from '../components/PropertyGroup';
import { ThreeStateCheckbox } from '../components/ThreeStateCheckbox';
import { Button } from '@/components/ui/button';
import { Palette, Eraser } from 'lucide-react';
import { StyleEditor } from '../editors/StyleEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useColumnCustomizationStore } from '../store/column-customization.store';

export const StylingTab: React.FC = () => {
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

  const handleCellStyleSave = (style: React.CSSProperties) => {
    updateBulkProperty('cellStyle', style);
  };

  const handleHeaderStyleSave = (style: React.CSSProperties) => {
    updateBulkProperty('headerStyle', style);
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
    updateBulkProperty('cellStyle', undefined);
    updateBulkProperty('cellClass', undefined);
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

  // Handle header alignment changes using headerClass (separate from headerStyle)
  const handleHeaderAlignmentChange = (alignment: string, type: 'horizontal' | 'vertical') => {
    const currentHeaderClass = getMixedValue('headerClass');
    const currentClasses = (currentHeaderClass.value as string || '').trim();
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
    const currentClasses = (currentCellClass.value as string || '').trim();
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
    const headerClass = (headerClassValue.value as string || '').trim();
    
    if (headerClassValue.isMixed) {
      return 'default';
    }
    
    const prefix = type === 'horizontal' ? 'header-align-' : 'header-valign-';
    const regex = new RegExp(prefix + '(\\w+)');
    const match = headerClass.match(regex);
    
    return match ? match[1] : 'default';
  };

  // Extract current cell alignment from cellClass
  const getCurrentCellAlignment = (type: 'horizontal' | 'vertical') => {
    const cellClassValue = getMixedValue('cellClass');
    const cellClass = (cellClassValue.value as string || '').trim();
    
    if (cellClassValue.isMixed) {
      return 'default';
    }
    
    const prefix = type === 'horizontal' ? 'cell-align-' : 'cell-valign-';
    const regex = new RegExp(prefix + '(\\w+)');
    const match = cellClass.match(regex);
    
    return match ? match[1] : 'default';
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
              <div className="space-y-2">
                <Label htmlFor="headerHAlign" className="text-xs font-medium">Horizontal</Label>
                <Select
                  value={getCurrentHeaderAlignment('horizontal')}
                  onValueChange={(value) => handleHeaderAlignmentChange(value, 'horizontal')}
                  disabled={isDisabled}
                >
                  <SelectTrigger id="headerHAlign" className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="headerVAlign" className="text-xs font-medium">Vertical</Label>
                <Select
                  value={getCurrentHeaderAlignment('vertical')}
                  onValueChange={(value) => handleHeaderAlignmentChange(value, 'vertical')}
                  disabled={isDisabled}
                >
                  <SelectTrigger id="headerVAlign" className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="middle">Middle</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                disabled={isDisabled}
                description="Wrap long text within cells"
              />
              
              <ThreeStateCheckbox
                label="Auto Height"
                property="autoHeight"
                mixedValue={getMixedValue('autoHeight')}
                onChange={(value) => updateBulkProperty('autoHeight', value)}
                disabled={isDisabled}
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
              <div className="space-y-2">
                <Label htmlFor="cellHAlign" className="text-xs font-medium">Horizontal</Label>
                <Select
                  value={getCurrentCellAlignment('horizontal')}
                  onValueChange={(value) => handleCellAlignmentChange(value, 'horizontal')}
                  disabled={isDisabled}
                >
                  <SelectTrigger id="cellHAlign" className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cellVAlign" className="text-xs font-medium">Vertical</Label>
                <Select
                  value={getCurrentCellAlignment('vertical')}
                  onValueChange={(value) => handleCellAlignmentChange(value, 'vertical')}
                  disabled={isDisabled}
                >
                  <SelectTrigger id="cellVAlign" className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="middle">Middle</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                disabled={isDisabled}
                description="Wrap long text in column headers"
              />
              
              <ThreeStateCheckbox
                label="Auto Header Height"
                property="autoHeaderHeight"
                mixedValue={getMixedValue('autoHeaderHeight')}
                onChange={(value) => updateBulkProperty('autoHeaderHeight', value)}
                disabled={isDisabled}
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
        initialStyle={currentCellStyle.isMixed ? {} : (currentCellStyle.value as React.CSSProperties || {})}
        onSave={handleCellStyleSave}
        isHeaderStyle={false}
      />

      <StyleEditor
        open={showHeaderStyleEditor}
        onOpenChange={setShowHeaderStyleEditor}
        title="Header Style Editor"
        initialStyle={currentHeaderStyle.isMixed ? {} : (currentHeaderStyle.value as React.CSSProperties || {})}
        onSave={handleHeaderStyleSave}
        isHeaderStyle={true}
      />
    </div>
  );
};