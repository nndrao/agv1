import React from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { BarChart, DollarSign, Calendar, Type, Copy } from 'lucide-react';

export const BulkActionsPanel: React.FC = () => {
  const {
    applyMode,
    setApplyMode,
    pendingChanges,
    selectedColumns,
    columnDefinitions,
    updateBulkProperty
  } = useColumnCustomizationStore();

  // Quick templates
  const templates = [
    { id: 'numeric', label: 'Numeric', icon: BarChart },
    { id: 'currency', label: 'Currency', icon: DollarSign },
    { id: 'date', label: 'Date', icon: Calendar },
    { id: 'text', label: 'Text', icon: Type },
  ];

  // Calculate changes preview
  const changesPreview = Array.from(pendingChanges.entries()).map(([colId, changes]) => ({
    colId,
    columnName: columnDefinitions.get(colId)?.headerName || colId,
    changes: Object.entries(changes).map(([key, value]) => ({
      property: key,
      value: value
    }))
  }));

  const applyTemplate = (templateId: string) => {
    switch (templateId) {
      case 'numeric':
        updateBulkProperty('cellDataType', 'number');
        updateBulkProperty('type', 'numericColumn');
        updateBulkProperty('filter', 'agNumberColumnFilter');
        updateBulkProperty('sortable', true);
        break;
      case 'currency':
        updateBulkProperty('cellDataType', 'number');
        updateBulkProperty('type', 'numericColumn');
        updateBulkProperty('filter', 'agNumberColumnFilter');
        updateBulkProperty('sortable', true);
        // Add currency formatter
        break;
      case 'date':
        updateBulkProperty('cellDataType', 'date');
        updateBulkProperty('type', 'dateColumn');
        updateBulkProperty('filter', 'agDateColumnFilter');
        updateBulkProperty('sortable', true);
        break;
      case 'text':
        updateBulkProperty('cellDataType', 'text');
        updateBulkProperty('type', 'textColumn');
        updateBulkProperty('filter', 'agTextColumnFilter');
        updateBulkProperty('sortable', true);
        break;
    }
  };

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
              className="justify-start"
              onClick={() => applyTemplate(template.id)}
              disabled={selectedColumns.size === 0}
            >
              <template.icon className="h-4 w-4 mr-2" />
              {template.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Bulk Apply Mode */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Bulk Apply Mode</h3>
        <RadioGroup value={applyMode} onValueChange={(value) => setApplyMode(value as 'override' | 'merge' | 'empty')}>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="override" id="override" />
              <Label htmlFor="override" className="text-sm font-normal">
                Override All
                <span className="block text-xs text-muted-foreground">Replace all values</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="merge" id="merge" />
              <Label htmlFor="merge" className="text-sm font-normal">
                Merge Changes
                <span className="block text-xs text-muted-foreground">Only update modified properties</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="empty" id="empty" />
              <Label htmlFor="empty" className="text-sm font-normal">
                Only Empty
                <span className="block text-xs text-muted-foreground">Only set undefined properties</span>
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Copy Settings From */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Copy Settings From</h3>
        <Select disabled={selectedColumns.size === 0}>
          <SelectTrigger>
            <SelectValue placeholder="Select a column" />
          </SelectTrigger>
          <SelectContent>
            {Array.from(columnDefinitions.entries()).map(([id, col]) => (
              <SelectItem key={id} value={id}>
                {col.headerName || col.field}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2"
          disabled={selectedColumns.size === 0}
        >
          <Copy className="h-4 w-4 mr-2" />
          Apply to Selected
        </Button>
      </div>

      {/* Changes Preview */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-sm font-medium mb-3">Changes Preview</h3>
        <ScrollArea className="flex-1 border rounded-md p-3 bg-muted/30">
          {changesPreview.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No pending changes</p>
          ) : (
            <div className="space-y-3">
              {changesPreview.map(({ colId, columnName, changes }) => (
                <div key={colId} className="text-sm">
                  <div className="font-medium mb-1">{columnName}</div>
                  <div className="space-y-1">
                    {changes.map(({ property, value }) => (
                      <div key={property} className="ml-3 text-xs text-muted-foreground flex items-center gap-2">
                        <span>• {property}:</span>
                        <Badge variant="secondary" className="text-xs">
                          {JSON.stringify(value)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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