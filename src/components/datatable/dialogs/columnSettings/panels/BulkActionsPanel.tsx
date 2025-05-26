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
  Copy,
  Eraser,
  Zap
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

  // Clear all styles from selected columns
  const clearAllStyles = useCallback(() => {
    updateBulkProperty('cellStyle', undefined);
    updateBulkProperty('headerStyle', undefined);
    updateBulkProperty('cellClass', undefined);
    updateBulkProperty('headerClass', undefined);
  }, [updateBulkProperty]);

  // Quick templates
  const templates = [
    { id: 'numeric', label: 'Numeric', icon: <BarChart3 className="h-4 w-4" />, color: 'blue' },
    { id: 'currency', label: 'Currency', icon: <DollarSign className="h-4 w-4" />, color: 'green' },
    { id: 'date', label: 'Date', icon: <Calendar className="h-4 w-4" />, color: 'orange' },
    { id: 'text', label: 'Text', icon: <FileText className="h-4 w-4" />, color: 'purple' },
  ];

  // Quick actions
  const quickActions = [
    { id: 'clearStyles', label: 'Clear Styles', icon: <Eraser className="h-4 w-4" />, action: clearAllStyles },
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

  // Available columns to copy from (excluding selected ones and only those with styles)
  const availableSourceColumns = useMemo(() => {
    return Array.from(columnDefinitions.entries())
      .filter(([colId, colDef]) => {
        // Exclude selected columns
        if (selectedColumns.has(colId)) return false;
        
        // Get pending changes for this column
        const pendingChange = pendingChanges.get(colId);
        
        // Combine original column definition with pending changes
        const effectiveColDef = { ...colDef, ...pendingChange };
        
        // Only include columns that have styling properties applied
        const hasStyles = !!(
          effectiveColDef.cellStyle ||
          effectiveColDef.headerStyle ||
          effectiveColDef.cellClass ||
          effectiveColDef.headerClass ||
          effectiveColDef.wrapText ||
          effectiveColDef.autoHeight ||
          effectiveColDef.wrapHeaderText ||
          effectiveColDef.autoHeaderHeight ||
          effectiveColDef.valueFormatter ||
          effectiveColDef.cellRenderer ||
          effectiveColDef.cellEditor ||
          (effectiveColDef.initialWidth && effectiveColDef.initialWidth !== 200) || // Default width is usually 200
          effectiveColDef.minWidth ||
          effectiveColDef.maxWidth ||
          effectiveColDef.initialPinned ||
          effectiveColDef.initialHide
        );
        
        return hasStyles;
      });
  }, [columnDefinitions, selectedColumns, pendingChanges]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border/50 bg-muted/5">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Quick Actions</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-3">
        {/* Compact Quick Templates */}
        <div className="mb-4">
          <h3 className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">Templates</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {templates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                className="justify-start gap-1.5 h-8 text-xs"
                onClick={() => applyTemplate(template.id)}
                disabled={selectedColumns.size === 0}
              >
                {template.icon}
                {template.label}
              </Button>
            ))}
          </div>
          
          {/* Compact Quick Actions */}
          <div className="mt-3">
            <h4 className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">Actions</h4>
            <div className="grid grid-cols-1 gap-1.5">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  className="justify-start gap-1.5 h-8 text-xs"
                  onClick={action.action}
                  disabled={selectedColumns.size === 0}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Compact Bulk Apply Mode */}
        <div className="mb-4">
          <h3 className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">Apply Mode</h3>
          <RadioGroup 
            value={applyMode} 
            onValueChange={(value: 'immediate' | 'onSave') => setApplyMode(value)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="immediate" id="immediate" className="h-3.5 w-3.5" />
              <Label htmlFor="immediate" className="text-xs font-normal cursor-pointer">
                Immediate
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="onSave" id="onSave" className="h-3.5 w-3.5" />
              <Label htmlFor="onSave" className="text-xs font-normal cursor-pointer">
                On Save
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Compact Copy Settings From */}
        <div className="mb-4">
          <h3 className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">Copy From</h3>
          <Select 
            value={sourceColumnId} 
            onValueChange={setSourceColumnId}
            disabled={selectedColumns.size === 0 || availableSourceColumns.length === 0}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={
                availableSourceColumns.length === 0 
                  ? "No styled columns" 
                  : "Select styled column"
              } />
            </SelectTrigger>
            <SelectContent>
              {availableSourceColumns.map(([colId, col]) => (
                <SelectItem key={colId} value={colId} className="text-xs">
                  {col.headerName || col.field}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2 gap-1.5 h-8 text-xs"
            disabled={selectedColumns.size === 0 || !sourceColumnId || availableSourceColumns.length === 0}
            onClick={copySettingsFromColumn}
          >
            <Copy className="h-3.5 w-3.5" />
            Apply to Selected
          </Button>
        </div>

        {/* Compact Changes Preview */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Changes</h3>
            {totalChanges > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {totalChanges}
              </Badge>
            )}
          </div>
          
          <ScrollArea className="flex-1 border rounded-md bg-muted/20">
            <div className="p-2">
              {changesPreview.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No changes
                </p>
              ) : (
                <div className="space-y-2">
                  {changesPreview.map(({ colId, changes }) => {
                    const col = columnDefinitions.get(colId);
                    return (
                      <div key={colId} className="text-xs">
                        <div className="font-medium mb-1 text-foreground truncate">
                          {col?.headerName || col?.field || colId}
                        </div>
                        <div className="space-y-0.5">
                          {changes.map(({ property, value }, idx) => (
                            <div 
                              key={`${property}-${idx}`} 
                              className="ml-2 text-xs text-muted-foreground flex items-center gap-1"
                            >
                              <span className="text-primary text-xs">•</span>
                              <span className="font-mono text-xs">{property}</span>
                              <span className="text-xs">→</span>
                              <span className="text-foreground truncate max-w-[80px] text-xs" title={JSON.stringify(value)}>
                                {typeof value === 'function' ? '[Fn]' : JSON.stringify(value)}
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
            <div className="mt-2 text-xs text-muted-foreground text-center">
              {selectedColumns.size} column{selectedColumns.size !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};