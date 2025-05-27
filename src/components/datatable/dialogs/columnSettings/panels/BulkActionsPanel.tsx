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
    templateColumns,
    updateBulkProperties
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
        valueFormatter: (params: { value: number | null | undefined }) => {
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

    // Batch update all template properties at once
    updateBulkProperties(template.config);
  }, [updateBulkProperties]);

  // Clear all customizations
  const clearAllCustomizations = useCallback(() => {
    const propertiesToClear = [
      'cellStyle', 'headerStyle', 'cellClass', 'headerClass',
      'valueFormatter', 'cellRenderer', 'type', 'cellDataType',
      'filter', 'aggFunc', 'wrapText', 'autoHeight'
    ];
    
    // Build object with all properties set to undefined
    const clearProperties: Record<string, undefined> = {};
    propertiesToClear.forEach(property => {
      clearProperties[property] = undefined;
    });
    
    // Batch clear all properties at once
    updateBulkProperties(clearProperties);
  }, [updateBulkProperties]);

  // Copy from another column
  const copyFromColumn = useCallback(() => {
    if (!sourceColumnId) return;
    
    const sourceColumn = columnDefinitions.get(sourceColumnId);
    if (!sourceColumn) return;

    // Copy formatting, filter, editor, and style properties
    const propertiesToCopy = [
      // Data type and basic properties
      'cellDataType', 'type',
      // Filter configurations
      'filter', 'filterParams', 'floatingFilter', 'suppressMenu', 'suppressFiltersToolPanel',
      // Editor configurations
      'editable', 'cellEditor', 'cellEditorParams', 'cellEditorPopup', 'cellEditorPopupPosition',
      'singleClickEdit', 'stopEditingWhenCellsLoseFocus',
      // Format configurations
      'valueFormat', 'valueFormatter',
      // Style properties
      'cellStyle', 'headerStyle', 'cellClass', 'headerClass',
      'cellRenderer', 'wrapText', 'autoHeight'
    ];

    // Build properties object for batch update
    const propertiesToUpdate: Record<string, any> = {};
    
    propertiesToCopy.forEach(property => {
      const value = sourceColumn[property as keyof ColDef];
      if (value !== undefined) {
        // Special handling for headerStyle functions
        if (property === 'headerStyle' && typeof value === 'function') {
          // Extract the style from the function by calling it with a non-floating filter context
          const extractedStyle = value({ floatingFilter: false });
          if (extractedStyle && typeof extractedStyle === 'object') {
            propertiesToUpdate[property] = extractedStyle;
          }
        } else {
          propertiesToUpdate[property] = value;
        }
      }
    });

    // Batch update all properties at once
    if (Object.keys(propertiesToUpdate).length > 0) {
      updateBulkProperties(propertiesToUpdate);
    }

    setSourceColumnId(''); // Clear selection after copying
  }, [sourceColumnId, columnDefinitions, updateBulkProperties]);

  // Get template columns available for copying
  const templateColumnsList = useMemo(() => {
    // Ensure templateColumns is a Set
    const templates = templateColumns instanceof Set ? templateColumns : new Set();
    return Array.from(columnDefinitions.entries())
      .filter(([colId]) => templates.has(colId) && !selectedColumns.has(colId))
      .sort((a, b) => {
        const nameA = a[1].headerName || a[1].field || '';
        const nameB = b[1].headerName || b[1].field || '';
        return nameA.localeCompare(nameB);
      });
  }, [columnDefinitions, selectedColumns, templateColumns]);

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
          <Zap className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Quick Actions</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Quick Templates */}
          <div>
            <h3 className="section-header">
              Apply Template
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(templates).map(([id, template]) => (
                <Button
                  key={id}
                  variant="outline"
                  size="sm"
                  className="h-9 justify-start gap-2 text-sm hover-lift"
                  onClick={() => applyTemplate(id as keyof typeof templates)}
                  disabled={isDisabled}
                >
                  <span className="text-muted-foreground">
                    {template.icon}
                  </span>
                  {template.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Copy From Column */}
          <div>
            <h3 className="section-header">
              Copy From Column
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Copies styles, format, filters, and editor settings
            </p>
            <Select
              value={sourceColumnId}
              onValueChange={setSourceColumnId}
              disabled={isDisabled || templateColumnsList.length === 0}
            >
              <SelectTrigger className="h-8 text-sm compact-input">
                <SelectValue placeholder={
                  templateColumnsList.length === 0
                    ? "No template columns"
                    : "Select template column"
                } />
              </SelectTrigger>
              <SelectContent>
                {templateColumnsList.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                    <p className="mb-1">No template columns</p>
                    <p className="text-xs opacity-70">Star columns to use as templates</p>
                  </div>
                ) : (
                  templateColumnsList.map(([colId, col]) => (
                    <SelectItem key={colId} value={colId} className="text-sm">
                      {col.headerName || col.field}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              variant="default"
              size="sm"
              className="w-full mt-2 h-8 text-sm gap-2"
              onClick={copyFromColumn}
              disabled={isDisabled || !sourceColumnId}
              title="Copy styles, format, filters, and editor settings"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy All Settings
            </Button>
          </div>

          {/* Clear All */}
          <div>
            <h3 className="section-header">
              Reset
            </h3>
            <Button
              variant="destructive"
              size="sm"
              className="w-full h-8 text-sm gap-2"
              onClick={clearAllCustomizations}
              disabled={isDisabled}
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear All Customizations
            </Button>
          </div>

          {/* Status */}
          <div className="pt-5 mt-5 border-t">
            <h3 className="section-header">
              Status
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Selected Columns</span>
                <span className="font-medium">{selectedColumns.size}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Pending Changes</span>
                <span className="font-medium">{changeCount}</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};