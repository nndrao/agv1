import React, { useState } from 'react';
import { PropertyGroup } from '../components/PropertyGroup';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette } from 'lucide-react';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { StyleEditor } from '../editors/StyleEditor';

export const StylingTab: React.FC = () => {
  const { selectedColumns, updateBulkProperty, columnDefinitions, pendingChanges } = useColumnCustomizationStore();
  const [showCellStyleEditor, setShowCellStyleEditor] = useState(false);
  const [showHeaderStyleEditor, setShowHeaderStyleEditor] = useState(false);

  // Get current style values
  const getCellStyle = () => {
    if (selectedColumns.size === 0) return {};
    const firstColId = Array.from(selectedColumns)[0];
    const pending = pendingChanges.get(firstColId);
    const colDef = columnDefinitions.get(firstColId);
    return (pending?.cellStyle || colDef?.cellStyle || {}) as React.CSSProperties;
  };

  const getHeaderStyle = () => {
    if (selectedColumns.size === 0) return {};
    const firstColId = Array.from(selectedColumns)[0];
    const pending = pendingChanges.get(firstColId);
    const colDef = columnDefinitions.get(firstColId);
    return (pending?.headerStyle || colDef?.headerStyle || {}) as React.CSSProperties;
  };

  const getCellClass = () => {
    if (selectedColumns.size === 0) return '';
    const firstColId = Array.from(selectedColumns)[0];
    const pending = pendingChanges.get(firstColId);
    const colDef = columnDefinitions.get(firstColId);
    return pending?.cellClass || colDef?.cellClass || '';
  };

  const getHeaderClass = () => {
    if (selectedColumns.size === 0) return '';
    const firstColId = Array.from(selectedColumns)[0];
    const pending = pendingChanges.get(firstColId);
    const colDef = columnDefinitions.get(firstColId);
    return pending?.headerClass || colDef?.headerClass || '';
  };

  return (
    <div className="p-6 space-y-6">
      <PropertyGroup title="Cell Styling">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cell Style</Label>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setShowCellStyleEditor(true)}
              disabled={selectedColumns.size === 0}
            >
              <Palette className="h-4 w-4 mr-2" />
              Open Style Editor
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label>Header Style</Label>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setShowHeaderStyleEditor(true)}
              disabled={selectedColumns.size === 0}
            >
              <Palette className="h-4 w-4 mr-2" />
              Open Style Editor
            </Button>
          </div>
        </div>
      </PropertyGroup>

      <PropertyGroup title="CSS Classes">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cellClass">Cell Class</Label>
            <Input 
              id="cellClass"
              type="text" 
              value={getCellClass()}
              onChange={(e) => updateBulkProperty('cellClass', e.target.value)}
              placeholder="Enter CSS class names"
              disabled={selectedColumns.size === 0}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="headerClass">Header Class</Label>
            <Input 
              id="headerClass"
              type="text"
              value={getHeaderClass()}
              onChange={(e) => updateBulkProperty('headerClass', e.target.value)}
              placeholder="Enter CSS class names"
              disabled={selectedColumns.size === 0}
            />
          </div>
        </div>
      </PropertyGroup>

      {/* Style Editors */}
      <StyleEditor
        open={showCellStyleEditor}
        onOpenChange={setShowCellStyleEditor}
        initialStyle={getCellStyle()}
        onSave={(style) => updateBulkProperty('cellStyle', style)}
        title="Edit Cell Style"
      />

      <StyleEditor
        open={showHeaderStyleEditor}
        onOpenChange={setShowHeaderStyleEditor}
        initialStyle={getHeaderStyle()}
        onSave={(style) => updateBulkProperty('headerStyle', style)}
        title="Edit Header Style"
      />
    </div>
  );
};