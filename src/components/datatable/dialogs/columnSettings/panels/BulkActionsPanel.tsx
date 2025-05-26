import React, { useMemo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    updateBulkProperty
  } = useColumnCustomizationStore();

  const [sourceColumnId, setSourceColumnId] = useState<string>('');

  // Simple template configurations
  const templates = {
    numeric: {
      label: 'Numeric',
      icon: <BarChart3 className="h-4 w-4" />,
      config: {
        cellDataType: 'number',
        type: 'numericColumn',
        filter: 'agNumberColumnFilter'
      }
    },
    currency: {
      label: 'Currency',
      icon: <DollarSign className="h-4 w-4" />,
      config: {
        cellDataType: 'number',
        type: 'numericColumn',
        filter: 'agNumberColumnFilter',
        valueFormatter: (params: any) => {
          if (params.value == null) return '';
          return `$${params.value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
        }
      }
    },
    date: {
      label: 'Date',
      icon: <Calendar className="h-4 w-4" />,
      config: {
        cellDataType: 'date',
        type: 'dateColumn',
        filter: 'agDateColumnFilter'
      }
    },
    text: {
      label: 'Text',
      icon: <FileText className="h-4 w-4" />,
      config: {
        cellDataType: 'text',
        type: 'textColumn',
        filter: 'agTextColumnFilter'
      }
    }
  };

  // Apply template to selected columns
  const applyTemplate = useCallback((templateId: keyof typeof templates) => {
    const template = templates[templateId];
    if (!template) return;

    Object.entries(template.config).forEach(([property, value]) => {
      updateBulkProperty(property, value);
    });
  }, [updateBulkProperty]);

  // Clear all customizations
  const clearAllCustomizations = useCallback(() => {
    const propertiesToClear = [
      'cellStyle', 'headerStyle', 'cellClass', 'headerClass',
      'valueFormatter', 'cellRenderer', 'type', 'cellDataType',
      'filter', 'aggFunc', 'wrapText', 'autoHeight'
    ];
    
    propertiesToClear.forEach(property => {
      updateBulkProperty(property, undefined);
    });
  }, [updateBulkProperty]);

  // Copy from another column
  const copyFromColumn = useCallback(() => {
    if (!sourceColumnId) return;
    
    const sourceColumn = columnDefinitions.get(sourceColumnId);
    if (!sourceColumn) return;

    // Only copy formatting-related properties
    const propertiesToCopy = [
      'cellDataType', 'type', 'filter',
      'cellStyle', 'headerStyle', 'cellClass', 'headerClass',
      'valueFormatter', 'cellRenderer',
      'wrapText', 'autoHeight'
    ];

    propertiesToCopy.forEach(property => {
      const value = sourceColumn[property as keyof ColDef];
      if (value !== undefined) {
        // Special handling for headerStyle functions
        if (property === 'headerStyle' && typeof value === 'function') {
          // Extract the style from the function by calling it with a non-floating filter context
          const extractedStyle = value({ floatingFilter: false });
          if (extractedStyle && typeof extractedStyle === 'object') {
            // Pass the extracted style object, which will be converted back to a function in the store
            updateBulkProperty(property, extractedStyle);
          }
        } else {
          updateBulkProperty(property, value);
        }
      }
    });

    setSourceColumnId(''); // Clear selection after copying
  }, [sourceColumnId, columnDefinitions, updateBulkProperty]);

  // Get columns available for copying (those with customizations)
  const customizedColumns = useMemo(() => {
    return Array.from(columnDefinitions.entries())
      .filter(([colId]) => !selectedColumns.has(colId))
      .filter(([, colDef]) => {
        // Check if column has any customizations
        return colDef.cellStyle || colDef.headerStyle || 
               colDef.valueFormatter || colDef.cellRenderer ||
               (colDef.type && colDef.type !== 'textColumn') ||
               (colDef.cellDataType && colDef.cellDataType !== 'text');
      })
      .sort((a, b) => {
        const nameA = a[1].headerName || a[1].field || '';
        const nameB = b[1].headerName || b[1].field || '';
        return nameA.localeCompare(nameB);
      });
  }, [columnDefinitions, selectedColumns]);

  // Count pending changes
  const changeCount = useMemo(() => {
    let count = 0;
    pendingChanges.forEach((changes) => {
      count += Object.keys(changes).length;
    });
    return count;
  }, [pendingChanges]);

  const isDisabled = selectedColumns.size === 0;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Bulk Actions</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Quick Templates */}
          <div>
            <h3 className="text-xs font-semibold mb-3 uppercase text-muted-foreground">
              Quick Templates
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(templates).map(([id, template]) => (
                <Button
                  key={id}
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2"
                  onClick={() => applyTemplate(id as keyof typeof templates)}
                  disabled={isDisabled}
                >
                  {template.icon}
                  {template.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Copy From Column */}
          <div>
            <h3 className="text-xs font-semibold mb-3 uppercase text-muted-foreground">
              Copy From Column
            </h3>
            <Select
              value={sourceColumnId}
              onValueChange={setSourceColumnId}
              disabled={isDisabled || customizedColumns.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={
                  customizedColumns.length === 0
                    ? "No customized columns available"
                    : "Select a column to copy from"
                } />
              </SelectTrigger>
              <SelectContent>
                {customizedColumns.map(([colId, col]) => (
                  <SelectItem key={colId} value={colId}>
                    {col.headerName || col.field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={copyFromColumn}
              disabled={isDisabled || !sourceColumnId}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy to Selected
            </Button>
          </div>

          {/* Clear All */}
          <div>
            <h3 className="text-xs font-semibold mb-3 uppercase text-muted-foreground">
              Reset
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={clearAllCustomizations}
              disabled={isDisabled}
            >
              <Eraser className="h-4 w-4 mr-2" />
              Clear All Customizations
            </Button>
          </div>

          {/* Status */}
          {selectedColumns.size > 0 && (
            <div className="pt-4 border-t text-center">
              <p className="text-sm text-muted-foreground">
                {selectedColumns.size} column{selectedColumns.size !== 1 ? 's' : ''} selected
              </p>
              {changeCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {changeCount} pending change{changeCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};