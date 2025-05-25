import React, { useState } from 'react';
import { DialogState } from '../types';
import { PropertyGroup } from '../components/PropertyGroup';
import { ThreeStateCheckbox } from '../components/ThreeStateCheckbox';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import { StyleEditor } from '../editors/StyleEditor';

interface StylingTabProps {
  state: DialogState;
  updateBulkProperty: (property: string, value: unknown) => void;
}

export const StylingTab: React.FC<StylingTabProps> = ({ state, updateBulkProperty }) => {
  const [showCellStyleEditor, setShowCellStyleEditor] = useState(false);
  const [showHeaderStyleEditor, setShowHeaderStyleEditor] = useState(false);

  const getMixedValue = (property: string) => {
    const values = new Set();
    const allValues: unknown[] = [];
    
    state.selectedColumns.forEach(colId => {
      const colDef = state.columnDefinitions.get(colId);
      if (colDef) {
        const value = colDef[property as keyof typeof colDef];
        values.add(value);
        allValues.push(value);
      }
    });
    
    if (values.size === 0) return { value: undefined, isMixed: false };
    if (values.size === 1) return { value: Array.from(values)[0], isMixed: false };
    return { value: undefined, isMixed: true, values: allValues };
  };

  const isDisabled = state.selectedColumns.size === 0;

  const handleCellStyleSave = (style: React.CSSProperties) => {
    updateBulkProperty('cellStyle', style);
  };

  const handleHeaderStyleSave = (style: React.CSSProperties) => {
    updateBulkProperty('headerStyle', style);
  };

  // Get current cell style (if consistent across selected columns)
  const currentCellStyle = getMixedValue('cellStyle');
  const currentHeaderStyle = getMixedValue('headerStyle');

  return (
    <div className="p-6 space-y-6">
      <PropertyGroup title="Cell & Header Styling">
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
      />

      <StyleEditor
        open={showHeaderStyleEditor}
        onOpenChange={setShowHeaderStyleEditor}
        title="Header Style Editor"
        initialStyle={currentHeaderStyle.isMixed ? {} : (currentHeaderStyle.value as React.CSSProperties || {})}
        onSave={handleHeaderStyleSave}
      />
    </div>
  );
};