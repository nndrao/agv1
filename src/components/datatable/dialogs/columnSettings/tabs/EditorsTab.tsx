import React from 'react';
import { DialogState } from '../types';
import { PropertyGroup } from '../components/PropertyGroup';
import { ThreeStateCheckbox } from '../components/ThreeStateCheckbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface EditorsTabProps {
  state: DialogState;
  updateBulkProperty: (property: string, value: unknown) => void;
}

export const EditorsTab: React.FC<EditorsTabProps> = ({ state, updateBulkProperty }) => {
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

  return (
    <div className="p-6 space-y-6">
      <PropertyGroup title="Basic Editing">
        <div className="space-y-3">
          <ThreeStateCheckbox
            label="Single Click Edit"
            property="singleClickEdit"
            mixedValue={getMixedValue('singleClickEdit')}
            onChange={(value) => updateBulkProperty('singleClickEdit', value)}
            disabled={isDisabled}
            description="Enable editing with single click instead of double click"
          />
          
          <ThreeStateCheckbox
            label="Stop Editing When Cells Lose Focus"
            property="stopEditingWhenCellsLoseFocus"
            mixedValue={getMixedValue('stopEditingWhenCellsLoseFocus')}
            onChange={(value) => updateBulkProperty('stopEditingWhenCellsLoseFocus', value)}
            disabled={isDisabled}
            description="Stop editing when clicking outside the cell"
          />
        </div>
      </PropertyGroup>

      <PropertyGroup title="Editor Components">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cellEditor" className="text-sm">Cell Editor</Label>
            <Select
              value={getMixedValue('cellEditor').value as string || ''}
              onValueChange={(value) => updateBulkProperty('cellEditor', value)}
              disabled={isDisabled}
            >
              <SelectTrigger id="cellEditor" className={getMixedValue('cellEditor').isMixed ? 'bg-orange-50 dark:bg-orange-900/20' : ''}>
                <SelectValue placeholder={getMixedValue('cellEditor').isMixed ? '~Mixed~' : 'Select editor'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agTextCellEditor">Text Editor</SelectItem>
                <SelectItem value="agLargeTextCellEditor">Large Text Editor</SelectItem>
                <SelectItem value="agSelectCellEditor">Select Editor</SelectItem>
                <SelectItem value="agRichSelectCellEditor">Rich Select Editor</SelectItem>
                <SelectItem value="agDateCellEditor">Date Editor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PropertyGroup>

      <PropertyGroup title="Display Options">
        <div className="space-y-3">
          <ThreeStateCheckbox
            label="Cell Editor Popup"
            property="cellEditorPopup"
            mixedValue={getMixedValue('cellEditorPopup')}
            onChange={(value) => updateBulkProperty('cellEditorPopup', value)}
            disabled={isDisabled}
            description="Show editor in a popup instead of inline"
          />
        </div>
      </PropertyGroup>
    </div>
  );
};