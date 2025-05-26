import React, { useState } from 'react';
import { PropertyGroup } from '../components/PropertyGroup';
import { ThreeStateCheckbox } from '../components/ThreeStateCheckbox';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
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
    <div className="p-6 space-y-6">
      <PropertyGroup title="Header Alignment (via headerClass)">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="headerHAlign" className="text-sm">Horizontal Alignment</Label>
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
            <Label htmlFor="headerVAlign" className="text-sm">Vertical Alignment</Label>
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

      <PropertyGroup title="Cell Alignment (via cellClass)">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cellHAlign" className="text-sm">Horizontal Alignment</Label>
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
            <Label htmlFor="cellVAlign" className="text-sm">Vertical Alignment</Label>
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

      <PropertyGroup title="Styling (via headerStyle & cellStyle)">
        <div className="space-y-4">
          <Button 
            variant="outline" 
            className="gap-2" 
            disabled={isDisabled}
            onClick={() => setShowCellStyleEditor(true)}
          >
            <Palette className="h-4 w-4" />
            Edit Cell Style
          </Button>
          <Button 
            variant="outline" 
            className="gap-2" 
            disabled={isDisabled}
            onClick={() => setShowHeaderStyleEditor(true)}
          >
            <Palette className="h-4 w-4" />
            Edit Header Style
          </Button>
        </div>
      </PropertyGroup>

      <PropertyGroup title="Text Display">
        <div className="space-y-3">
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