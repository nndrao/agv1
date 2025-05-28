import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { ColDef } from 'ag-grid-community';
import {
  Copy,
  Eraser,
  Zap,
  Save,
  Trash2,
  Plus,
  AlertCircle,
  Edit2
} from 'lucide-react';

// Template storage key
const TEMPLATES_STORAGE_KEY = 'column-customization-templates';

// Template interface
interface ColumnTemplate {
  id: string;
  name: string;
  createdAt: number;
  properties: Record<string, any>;
}

export const BulkActionsPanel: React.FC = () => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperties
  } = useColumnCustomizationStore();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templates, setTemplates] = useState<ColumnTemplate[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateToDelete, setTemplateToDelete] = useState<string>('');
  const [editingTemplateId, setEditingTemplateId] = useState<string>('');

  // Properties to save in templates - comprehensive list
  const TEMPLATE_PROPERTIES = [
    // Data type and basic properties
    'cellDataType', 'type', 'valueGetter', 'valueSetter',
    
    // Filter configurations
    'filter', 'filterParams', 'floatingFilter', 'floatingFilterComponent', 'floatingFilterComponentParams',
    'suppressMenu', 'suppressFiltersToolPanel', 'filterValueGetter',
    
    // Editor configurations
    'editable', 'cellEditor', 'cellEditorParams', 'cellEditorPopup', 'cellEditorPopupPosition',
    'singleClickEdit', 'stopEditingWhenCellsLoseFocus', 'cellEditorSelector',
    
    // Format configurations
    'valueFormat', 'valueFormatter', 'exportValueFormatter', 'excelFormat',
    'cellClass', 'cellClassRules', 'cellStyle',
    
    // Header configurations
    'headerClass', 'headerStyle', 'headerTooltip', 'headerComponent', 'headerComponentParams',
    'headerTextAlign', 'headerCheckboxSelection', 'headerCheckboxSelectionFilteredOnly',
    
    // Cell renderer
    'cellRenderer', 'cellRendererParams', 'cellRendererSelector',
    
    // Layout and display
    'wrapText', 'autoHeight', 'rowSpan', 'colSpan',
    'textAlign', 'verticalAlign',
    
    // Sorting and aggregation
    'sortable', 'sort', 'sortingOrder', 'comparator',
    'unSortIcon', 'aggFunc', 'allowedAggFuncs',
    
    // Pinning and sizing
    'pinned', 'lockPosition', 'lockPinned', 'lockVisible',
    'width', 'minWidth', 'maxWidth', 'flex',
    'resizable', 'suppressSizeToFit',
    
    // Tooltips
    'tooltip', 'tooltipField', 'tooltipValueGetter', 'tooltipComponent', 'tooltipComponentParams',
    
    // Other properties
    'suppressKeyboardEvent', 'suppressNavigable', 'suppressPaste',
    'checkboxSelection', 'showDisabledCheckboxes'
  ];

  // Load templates from localStorage
  useEffect(() => {
    const storedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (storedTemplates) {
      try {
        setTemplates(JSON.parse(storedTemplates));
      } catch (e) {
        console.error('Failed to load templates:', e);
      }
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = useCallback((newTemplates: ColumnTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(newTemplates));
  }, []);

  // Get current column configuration
  const getCurrentColumnConfig = useCallback(() => {
    if (selectedColumns.size === 0) return null;
    
    // Get the first selected column's configuration
    const firstColumnId = Array.from(selectedColumns)[0];
    const columnDef = columnDefinitions.get(firstColumnId);
    const changes = pendingChanges.get(firstColumnId);
    
    if (!columnDef) return null;
    
    const config: Record<string, any> = {};
    
    TEMPLATE_PROPERTIES.forEach(property => {
      // Check pending changes first, then column definition
      const value = changes?.[property] ?? columnDef[property as keyof ColDef];
      if (value !== undefined) {
        // Special handling for functions - convert to serializable format
        if (typeof value === 'function') {
          // For formatters, we always save the valueFormat if available
          if (property === 'valueFormatter' || property === 'exportValueFormatter') {
            // Always store the valueFormat which can recreate the formatter
            const format = changes?.valueFormat ?? columnDef.valueFormat;
            if (format) {
              config.valueFormat = format;
              // Also store a flag indicating this uses a formatter
              config._hasFormatter = true;
            }
          } else if (property === 'headerStyle' || property === 'cellStyle') {
            // Extract style by calling the function if it's a function
            try {
              const extractedStyle = value({ floatingFilter: false });
              if (extractedStyle && typeof extractedStyle === 'object') {
                config[property] = extractedStyle;
              }
            } catch (e) {
              // If function fails, try to store as is
              console.warn(`Failed to extract ${property}:`, e);
            }
          } else if (property === 'comparator' || property === 'valueGetter' || property === 'valueSetter') {
            // For other functions, store a flag that they exist
            config[`_has${property.charAt(0).toUpperCase() + property.slice(1)}`] = true;
          }
        } else {
          // For non-function values, store directly
          config[property] = value;
        }
      }
    });
    
    return config;
  }, [selectedColumns, columnDefinitions, pendingChanges]);

  // Save current configuration as template
  const saveAsTemplate = useCallback(() => {
    const config = getCurrentColumnConfig();
    if (!config || !templateName.trim()) return;
    
    const newTemplate: ColumnTemplate = {
      id: editingTemplateId || Date.now().toString(),
      name: templateName.trim(),
      createdAt: Date.now(),
      properties: config
    };
    
    let newTemplates: ColumnTemplate[];
    if (editingTemplateId) {
      // Update existing template
      newTemplates = templates.map(t => 
        t.id === editingTemplateId ? newTemplate : t
      );
    } else {
      // Add new template
      newTemplates = [...templates, newTemplate];
    }
    
    saveTemplates(newTemplates);
    setShowSaveDialog(false);
    setTemplateName('');
    setEditingTemplateId('');
  }, [getCurrentColumnConfig, templateName, templates, saveTemplates, editingTemplateId]);

  // Apply template to selected columns
  const applyTemplate = useCallback(() => {
    if (!selectedTemplateId) return;
    
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;
    
    // Prepare properties to apply
    const propertiesToApply: Record<string, any> = { ...template.properties };
    
    // If template has a valueFormat and the formatter flag, we need to recreate the formatter
    if (template.properties.valueFormat && template.properties._hasFormatter) {
      // Import the formatter creator function
      import('@/components/datatable/utils/formatters').then(({ createExcelFormatter, getExcelStyleClass, getExcelExportFormat, createCellStyleFunction }) => {
        const format = template.properties.valueFormat;
        
        // Create the formatter function
        const formatter = createExcelFormatter(format);
        propertiesToApply.valueFormatter = formatter;
        propertiesToApply.exportValueFormatter = formatter;
        
        // Set appropriate cell class
        const cellClass = getExcelStyleClass(format);
        if (cellClass) {
          const existingClasses = template.properties.cellClass || '';
          const currentClasses = typeof existingClasses === 'string' ? 
            existingClasses.split(' ').filter(c => !c.startsWith('ag-')) : [];
          const newClasses = [...new Set([...currentClasses, ...cellClass.split(' ')])];
          propertiesToApply.cellClass = newClasses.join(' ').trim();
        }
        
        // Handle cell style for dynamic color formatting
        if (format.includes('[') && format.includes(']')) {
          const baseStyle = template.properties.cellStyle || {};
          propertiesToApply.cellStyle = createCellStyleFunction(format, baseStyle);
        }
        
        // Set Excel export format
        const excelFormat = getExcelExportFormat(format);
        if (excelFormat) {
          propertiesToApply.excelFormat = excelFormat;
        }
        
        // Apply all properties after formatter is created
        updateBulkProperties(propertiesToApply);
      });
    } else {
      // Apply all template properties at once
      updateBulkProperties(propertiesToApply);
    }
    
    setSelectedTemplateId(''); // Clear selection after applying
  }, [selectedTemplateId, templates, updateBulkProperties]);

  // Delete template
  const deleteTemplate = useCallback(() => {
    if (!templateToDelete) return;
    
    const newTemplates = templates.filter(t => t.id !== templateToDelete);
    saveTemplates(newTemplates);
    setShowDeleteDialog(false);
    setTemplateToDelete('');
    
    // Clear selection if deleted template was selected
    if (selectedTemplateId === templateToDelete) {
      setSelectedTemplateId('');
    }
  }, [templateToDelete, templates, saveTemplates, selectedTemplateId]);

  // Clear all customizations
  const clearAllCustomizations = useCallback(() => {
    // Use the same comprehensive list as templates
    const propertiesToClear = TEMPLATE_PROPERTIES.filter(prop => !prop.startsWith('_'));
    
    // Build object with all properties set to undefined
    const clearProperties: Record<string, undefined> = {};
    propertiesToClear.forEach(property => {
      clearProperties[property] = undefined;
    });
    
    // Batch clear all properties at once
    updateBulkProperties(clearProperties);
  }, [updateBulkProperties]);

  // Count pending changes
  const changeCount = useMemo(() => {
    let count = 0;
    pendingChanges.forEach((changes) => {
      count += Object.keys(changes).length;
    });
    return count;
  }, [pendingChanges]);

  const isDisabled = selectedColumns.size === 0;
  const canSaveTemplate = selectedColumns.size === 1;
  const hasTemplates = templates.length > 0;

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
          {/* Template Management */}
          <div>
            <h3 className="section-header">
              Templates
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Save and apply column configurations
            </p>
            {selectedColumns.size > 1 && (
              <Alert className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Select only one column to save as a template
                </AlertDescription>
              </Alert>
            )}
            
            {/* Template Selection */}
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
              disabled={!hasTemplates}
            >
              <SelectTrigger className="h-8 text-sm compact-input">
                <SelectValue placeholder={
                  hasTemplates ? "Select a template" : "No templates saved"
                } />
              </SelectTrigger>
              <SelectContent>
                {!hasTemplates ? (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                    <p className="mb-1">No templates saved</p>
                    <p className="text-xs opacity-70">Save current settings as a template</p>
                  </div>
                ) : (
                  <>
                    {templates.map((template) => (
                      <div key={template.id} className="relative">
                        <SelectItem value={template.id} className="text-sm pr-16">
                          {template.name}
                        </SelectItem>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingTemplateId(template.id);
                              setTemplateName(template.name);
                              setShowSaveDialog(true);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setTemplateToDelete(template.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <SelectSeparator />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 justify-start text-sm"
                      onClick={() => {
                        setEditingTemplateId('');
                        setTemplateName('');
                        setShowSaveDialog(true);
                      }}
                      disabled={!canSaveTemplate}
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Save current as new template
                    </Button>
                  </>
                )}
              </SelectContent>
            </Select>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1 h-8 text-sm gap-2"
                onClick={applyTemplate}
                disabled={!selectedTemplateId}
              >
                <Copy className="h-3.5 w-3.5" />
                Apply Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-sm gap-2"
                onClick={() => {
                  setEditingTemplateId('');
                  setTemplateName('');
                  setShowSaveDialog(true);
                }}
                disabled={!canSaveTemplate}
                title={!canSaveTemplate ? "Select only one column to save as template" : "Save current column as template"}
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
            </div>
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
              <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Saved Templates</span>
                <span className="font-medium">{templates.length}</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingTemplateId ? 'Update Template' : 'Save as Template'}
            </DialogTitle>
            <DialogDescription>
              Save the current column configuration as a reusable template
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="template-name" className="text-sm font-medium">
                Template Name
              </label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Currency Column"
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveDialog(false);
                setTemplateName('');
                setEditingTemplateId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveAsTemplate}
              disabled={!templateName.trim()}
            >
              {editingTemplateId ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setTemplateToDelete('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteTemplate}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};