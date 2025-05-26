import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { ColDef } from 'ag-grid-community';
import { 
  BarChart3, 
  DollarSign, 
  Calendar, 
  FileText,
  Copy
} from 'lucide-react';

export const BulkActionsPanel: React.FC = () => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    applyMode,
    setApplyMode,
    updateBulkProperty
  } = useColumnCustomizationStore();

  const [sourceColumnId, setSourceColumnId] = useState<string>('');

  // Reset source column if it becomes selected or invalid
  useEffect(() => {
    if (sourceColumnId && (selectedColumns.has(sourceColumnId) || !columnDefinitions.has(sourceColumnId))) {
      setSourceColumnId('');
    }
  }, [selectedColumns, sourceColumnId, columnDefinitions]);

  // Quick templates
  const templates = [
    { id: 'numeric', label: 'Numeric', icon: <BarChart3 className="h-4 w-4" />, color: 'blue' },
    { id: 'currency', label: 'Currency', icon: <DollarSign className="h-4 w-4" />, color: 'green' },
    { id: 'date', label: 'Date', icon: <Calendar className="h-4 w-4" />, color: 'orange' },
    { id: 'text', label: 'Text', icon: <FileText className="h-4 w-4" />, color: 'purple' },
  ];

  // Template configurations
  const templateConfigs: Record<string, Partial<ColDef>> = useMemo(() => ({
    numeric: {
      cellDataType: 'number',
      type: 'numericColumn',
      filter: 'agNumberColumnFilter',
      sortable: true,
      resizable: true,
      aggFunc: 'sum'
    },
    currency: {
      cellDataType: 'number',
      type: 'numericColumn',
      filter: 'agNumberColumnFilter',
      sortable: true,
      resizable: true,
      aggFunc: 'sum',
      valueFormatter: (params: { value: number | null }) => {
        if (params.value == null) return '';
        return '$' + params.value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
    },
    date: {
      cellDataType: 'date',
      type: 'dateColumn',
      filter: 'agDateColumnFilter',
      sortable: true,
      resizable: true
    },
    text: {
      cellDataType: 'text',
      type: 'textColumn',
      filter: 'agTextColumnFilter',
      sortable: true,
      resizable: true,
      wrapText: false,
      autoHeight: false
    }
  }), []);

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const config = templateConfigs[templateId];
    if (config) {
      Object.entries(config).forEach(([property, value]) => {
        updateBulkProperty(property, value);
      });
    }
  }, [templateConfigs, updateBulkProperty]);

  // Copy settings from source column to selected columns
  const copySettingsFromColumn = useCallback(() => {
    if (!sourceColumnId) return;
    
    const sourceColumn = columnDefinitions.get(sourceColumnId);
    if (!sourceColumn) return;

    // Properties to copy (excluding field and headerName which should be unique)
    const propertiesToCopy = [
      'type', 'cellDataType', 'sortable', 'resizable', 'editable', 'filter',
      'initialWidth', 'minWidth', 'maxWidth', 'initialHide', 'initialPinned',
      'cellStyle', 'headerStyle', 'cellClass', 'headerClass',
      'wrapText', 'autoHeight', 'wrapHeaderText', 'autoHeaderHeight',
      'valueFormatter', 'valueParser', 'cellRenderer', 'cellEditor',
      'aggFunc', 'enableValue', 'enableRowGroup', 'enablePivot'
    ];

    propertiesToCopy.forEach(property => {
      const value = sourceColumn[property as keyof typeof sourceColumn];
      if (value !== undefined) {
        updateBulkProperty(property, value);
      }
    });
  }, [sourceColumnId, columnDefinitions, updateBulkProperty]);

  // Calculate changes preview - memoized to prevent recalculation
  const changesPreview = useMemo(() => {
    return Array.from(pendingChanges.entries()).map(([colId, changes]) => ({
      colId,
      changes: Object.entries(changes).map(([key, value]) => ({
        property: key,
        value: value
      }))
    }));
  }, [pendingChanges]);

  const totalChanges = useMemo(() => {
    return changesPreview.reduce((acc, item) => acc + item.changes.length, 0);
  }, [changesPreview]);

  // Available columns to copy from (excluding selected ones)
  const availableSourceColumns = useMemo(() => {
    return Array.from(columnDefinitions.entries())
      .filter(([colId]) => !selectedColumns.has(colId));
  }, [columnDefinitions, selectedColumns]);

  return (
    <div className="h-full flex flex-col p-4">
      {/* Quick Templates */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Quick Templates</h3>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              size="sm"
              className="justify-start gap-2 h-9"
              onClick={() => applyTemplate(template.id)}
              disabled={selectedColumns.size === 0}
            >
              {template.icon}
              {template.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Bulk Apply Mode */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Bulk Apply Mode</h3>
        <RadioGroup 
          value={applyMode} 
          onValueChange={(value: 'immediate' | 'onSave') => setApplyMode(value)}
        >
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="immediate" id="immediate" className="mt-1" />
              <Label htmlFor="immediate" className="text-sm font-normal cursor-pointer">
                <div>Apply Immediately</div>
                <div className="text-xs text-muted-foreground">Changes apply instantly</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="onSave" id="onSave" className="mt-1" />
              <Label htmlFor="onSave" className="text-sm font-normal cursor-pointer">
                <div>Apply on Save</div>
                <div className="text-xs text-muted-foreground">Changes apply when dialog is saved</div>
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Copy Settings From */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Copy Settings From</h3>
        <p className="text-xs text-muted-foreground mb-2">
          Copy all properties from another column to the selected columns
        </p>
        <Select 
          value={sourceColumnId} 
          onValueChange={setSourceColumnId}
          disabled={selectedColumns.size === 0 || availableSourceColumns.length === 0}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder={
              availableSourceColumns.length === 0 
                ? "No columns available" 
                : "Select a column"
            } />
          </SelectTrigger>
          <SelectContent>
            {availableSourceColumns.map(([colId, col]) => (
              <SelectItem key={colId} value={colId}>
                {col.headerName || col.field}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2 gap-2"
          disabled={selectedColumns.size === 0 || !sourceColumnId || availableSourceColumns.length === 0}
          onClick={copySettingsFromColumn}
        >
          <Copy className="h-4 w-4" />
          Apply to Selected
        </Button>
      </div>

      {/* Changes Preview */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Changes Preview</h3>
          {totalChanges > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalChanges} change{totalChanges !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        <ScrollArea className="flex-1 border rounded-md bg-muted/30">
          <div className="p-3">
            {changesPreview.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No pending changes
              </p>
            ) : (
              <div className="space-y-3">
                {changesPreview.map(({ colId, changes }) => {
                  const col = columnDefinitions.get(colId);
                  return (
                    <div key={colId} className="text-sm">
                      <div className="font-medium mb-1 text-foreground">
                        {col?.headerName || col?.field || colId}
                      </div>
                      <div className="space-y-1">
                        {changes.map(({ property, value }, idx) => (
                          <div 
                            key={`${property}-${idx}`} 
                            className="ml-3 text-xs text-muted-foreground flex items-center gap-1"
                          >
                            <span className="text-primary">•</span>
                            <span className="font-mono">{property}</span>
                            <span>→</span>
                            <span className="text-foreground truncate max-w-[120px]" title={JSON.stringify(value)}>
                              {typeof value === 'function' ? '[Function]' : JSON.stringify(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
        
        {selectedColumns.size > 0 && (
          <div className="mt-3 text-sm text-muted-foreground text-center">
            {selectedColumns.size} column{selectedColumns.size !== 1 ? 's' : ''} affected
          </div>
        )}
      </div>
    </div>
  );
};