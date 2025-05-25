import React, { useState } from 'react';
import { DialogState } from '../types';
import { PropertyGroup } from '../components/PropertyGroup';
import { Button } from '@/components/ui/button';
import { Code } from 'lucide-react';
import { ValueFormatterEditor } from '../editors/ValueFormatterEditor';

interface ValueFormattersTabProps {
  state: DialogState;
  updateBulkProperty: (property: string, value: unknown) => void;
}

export const ValueFormattersTab: React.FC<ValueFormattersTabProps> = ({ state, updateBulkProperty }) => {
  const [showValueFormatterEditor, setShowValueFormatterEditor] = useState(false);
  const [showExportFormatterEditor, setShowExportFormatterEditor] = useState(false);

  const isDisabled = state.selectedColumns.size === 0;

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

  // Get the column type for the selected columns (if consistent)
  const getColumnType = (): 'text' | 'number' | 'date' | 'boolean' => {
    const types = new Set<string>();
    state.selectedColumns.forEach(colId => {
      const colDef = state.columnDefinitions.get(colId);
      if (colDef && colDef.cellDataType) {
        types.add(String(colDef.cellDataType));
      }
    });
    
    if (types.size === 1) {
      const type = Array.from(types)[0];
      if (['text', 'number', 'date', 'boolean'].includes(type)) {
        return type as 'text' | 'number' | 'date' | 'boolean';
      }
    }
    return 'text'; // Default fallback
  };

  const handleValueFormatterSave = (formatter: (params: { value: unknown }) => string) => {
    updateBulkProperty('valueFormatter', formatter);
  };

  const handleExportFormatterSave = (formatter: (params: { value: unknown }) => string) => {
    updateBulkProperty('exportValueFormatter', formatter);
  };

  // Get current formatters
  const currentValueFormatter = getMixedValue('valueFormatter');
  const currentExportFormatter = getMixedValue('exportValueFormatter');
  const columnType = getColumnType();

  return (
    <div className="p-6 space-y-6">
      <PropertyGroup title="Display Formatting">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Value Formatter</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Format cell values for display without changing the underlying data
            </p>
            <Button 
              variant="outline" 
              className="gap-2" 
              disabled={isDisabled}
              onClick={() => setShowValueFormatterEditor(true)}
            >
              <Code className="h-4 w-4" />
              Edit Value Formatter
            </Button>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Export Value Formatter</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Format values specifically for export operations
            </p>
            <Button 
              variant="outline" 
              className="gap-2" 
              disabled={isDisabled}
              onClick={() => setShowExportFormatterEditor(true)}
            >
              <Code className="h-4 w-4" />
              Edit Export Formatter
            </Button>
          </div>
        </div>
      </PropertyGroup>

      {/* Formatter Editors */}
      <ValueFormatterEditor
        open={showValueFormatterEditor}
        onOpenChange={setShowValueFormatterEditor}
        title="Value Formatter Editor"
        columnType={columnType}
        initialFormatter={currentValueFormatter.isMixed ? undefined : currentValueFormatter.value as ((params: { value: unknown }) => string) | undefined}
        onSave={handleValueFormatterSave}
      />

      <ValueFormatterEditor
        open={showExportFormatterEditor}
        onOpenChange={setShowExportFormatterEditor}
        title="Export Value Formatter Editor"
        columnType={columnType}
        initialFormatter={currentExportFormatter.isMixed ? undefined : currentExportFormatter.value as ((params: { value: unknown }) => string) | undefined}
        onSave={handleExportFormatterSave}
      />
    </div>
  );
};