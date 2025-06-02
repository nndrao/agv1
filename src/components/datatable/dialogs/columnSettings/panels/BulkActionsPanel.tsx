import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  Edit2,
  Sparkles
} from 'lucide-react';

// Template storage key
const TEMPLATES_STORAGE_KEY = 'column-customization-templates';

// Template interface
interface ColumnTemplate {
  id: string;
  name: string;
  createdAt: number;
  properties: Partial<ColDef>;
  isSystem?: boolean; // Flag to identify system templates
}

// Predefined system templates
const SYSTEM_TEMPLATES: ColumnTemplate[] = [
  {
    id: 'system-currency',
    name: 'Currency Format',
    createdAt: Date.now(),
    isSystem: true,
    properties: {
      valueFormatter: (params: any) => {
        if (params.value == null) return '';
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(params.value);
      },
      cellStyle: { textAlign: 'right', fontWeight: '500' },
      headerStyle: () => ({ textAlign: 'right', fontWeight: '600' }),
      type: 'numericColumn'
    }
  },
  {
    id: 'system-percentage',
    name: 'Percentage Format',
    createdAt: Date.now(),
    isSystem: true,
    properties: {
      valueFormatter: (params: any) => {
        if (params.value == null) return '';
        return `${(params.value * 100).toFixed(2)}%`;
      },
      cellStyle: { textAlign: 'right', color: '#059669' },
      headerStyle: () => ({ textAlign: 'right' }),
      type: 'numericColumn'
    }
  },
  {
    id: 'system-date',
    name: 'Date Format',
    createdAt: Date.now(),
    isSystem: true,
    properties: {
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      },
      cellStyle: { textAlign: 'center' },
      headerStyle: () => ({ textAlign: 'center' }),
      filter: 'agDateColumnFilter'
    }
  },
  {
    id: 'system-bold-header',
    name: 'Bold Headers',
    createdAt: Date.now(),
    isSystem: true,
    properties: {
      headerStyle: () => ({ 
        fontWeight: '700', 
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0'
      }),
      wrapHeaderText: true,
      autoHeaderHeight: true
    }
  },
  {
    id: 'system-center-align',
    name: 'Center Aligned',
    createdAt: Date.now(),
    isSystem: true,
    properties: {
      cellStyle: { textAlign: 'center' },
      headerStyle: () => ({ textAlign: 'center' })
    }
  },
  {
    id: 'system-highlight',
    name: 'Highlighted Column',
    createdAt: Date.now(),
    isSystem: true,
    properties: {
      cellStyle: { 
        backgroundColor: '#fef3c7', 
        borderLeft: '3px solid #f59e0b',
        fontWeight: '500'
      },
      headerStyle: () => ({ 
        backgroundColor: '#fbbf24', 
        color: '#92400e',
        fontWeight: '600'
      })
    }
  },
  {
    id: 'system-compact',
    name: 'Compact Layout',
    createdAt: Date.now(),
    isSystem: true,
    properties: {
      cellStyle: { 
        fontSize: '12px', 
        padding: '4px 8px',
        lineHeight: '1.2'
      },
      headerStyle: () => ({ 
        fontSize: '11px', 
        fontWeight: '600',
        padding: '4px 8px'
      }),
      autoHeight: false
    }
  },
  {
    id: 'system-status',
    name: 'Status Badges',
    createdAt: Date.now(),
    isSystem: true,
    properties: {
      cellRenderer: (params: any) => {
        if (!params.value) return '';
        const status = params.value.toLowerCase();
        const colors = {
          active: '#10b981',
          inactive: '#6b7280',
          pending: '#f59e0b',
          completed: '#3b82f6',
          error: '#ef4444'
        };
        const color = colors[status as keyof typeof colors] || '#6b7280';
        return `<span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">${params.value}</span>`;
      },
      cellStyle: { textAlign: 'center' },
      headerStyle: () => ({ textAlign: 'center' })
    }
  }
];

// Helper function to get system template descriptions
const getSystemTemplateDescription = (templateId: string): string => {
  const descriptions: Record<string, string> = {
    'system-currency': 'Formats numbers as currency with right alignment',
    'system-percentage': 'Displays values as percentages with green color',
    'system-date': 'Formats dates in readable format with center alignment',
    'system-bold-header': 'Makes headers bold with enhanced styling',
    'system-center-align': 'Centers text in both cells and headers',
    'system-highlight': 'Highlights column with yellow background',
    'system-compact': 'Reduces font size and padding for compact view',
    'system-status': 'Renders status values as colored badges'
  };
  return descriptions[templateId] || 'System template';
};

export const BulkActionsPanel: React.FC = () => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperties,
    setAppliedTemplate
  } = useColumnCustomizationStore();

  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [userTemplates, setUserTemplates] = useState<ColumnTemplate[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateToDelete, setTemplateToDelete] = useState<string>('');
  const [editingTemplateId, setEditingTemplateId] = useState<string>('');

  // Combine system and user templates
  const templates = useMemo(() => {
    return [...SYSTEM_TEMPLATES, ...userTemplates];
  }, [userTemplates]);

  // Properties to save in templates - comprehensive list
  const TEMPLATE_PROPERTIES = [
    // NOTE: 'field' and 'headerName' are intentionally excluded from templates
    // They should only be applied to single columns, not in bulk
    
    // Data type and basic properties
    'cellDataType', 'type', 'valueGetter', 'valueSetter',
    
    // Filter configurations
    'filter', 'filterParams', 'floatingFilter', 'floatingFilterComponent', 'floatingFilterComponentParams',
    'suppressHeaderMenuButton', 'suppressFiltersToolPanel', 'filterValueGetter',
    
    // Editor configurations
    'editable', 'cellEditor', 'cellEditorParams', 'cellEditorPopup', 'cellEditorPopupPosition',
    'singleClickEdit', 'stopEditingWhenCellsLoseFocus', 'cellEditorSelector',
    
    // Format configurations
    'valueFormatter', 'useValueFormatterForExport',
    'cellClass', 'cellClassRules', 'cellStyle',
    
    // Header configurations
    'headerClass', 'headerStyle', 'headerTooltip', 'headerComponent', 'headerComponentParams',
    'headerTextAlign', 'headerCheckboxSelection', 'headerCheckboxSelectionFilteredOnly',
    'wrapHeaderText', 'autoHeaderHeight',  // Added from StylingTab
    
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
    'initialWidth', 'initialHide', 'initialPinned',  // Added from GeneralTab
    
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
        setUserTemplates(JSON.parse(storedTemplates));
      } catch (e) {
        console.error('Failed to load templates:', e);
      }
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = useCallback((newTemplates: ColumnTemplate[]) => {
    setUserTemplates(newTemplates);
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
    
    const config: Partial<ColDef> = {};
    
    TEMPLATE_PROPERTIES.forEach(property => {
      // Check pending changes first, then column definition
      const value = changes?.[property] ?? columnDef[property as keyof ColDef];
      if (value !== undefined) {
        // Special handling for functions - convert to serializable format
        if (typeof value === 'function') {
          // For formatters, we just copy the function reference
          if (property === 'valueFormatter') {
            // Store the formatter function directly
            if (value && typeof value === 'function') {
              config[property] = value;
            }
          } else if (property === 'headerStyle') {
            // Special handling for headerStyle function
            try {
              // Extract styles for both regular header and floating filter
              const regularStyle = value({ floatingFilter: false });
              const floatingStyle = value({ floatingFilter: true });
              
              // Store as an object that preserves the conditional logic
              config[property] = {
                _isHeaderStyleConfig: true,
                regular: regularStyle,
                floating: floatingStyle
              };
            } catch (e) {
              console.warn(`Failed to extract headerStyle:`, e);
              // Try to store just the regular style
              try {
                const regularStyle = value({});
                if (regularStyle && typeof regularStyle === 'object') {
                  config[property] = regularStyle;
                }
              } catch (e2) {
                console.warn(`Failed to extract headerStyle completely:`, e2);
              }
            }
          } else if (property === 'cellStyle') {
            // Extract style by calling the function if it's a function
            try {
              const extractedStyle = value({});
              if (extractedStyle && typeof extractedStyle === 'object') {
                config[property] = extractedStyle;
              }
            } catch (e) {
              // If function fails, try to store as is
              console.warn(`Failed to extract cellStyle:`, e);
            }
          } else if (property === 'comparator' || property === 'valueGetter' || property === 'valueSetter' || 
                     property === 'cellRenderer' || property === 'cellEditor' || property === 'filterValueGetter' ||
                     property === 'tooltipValueGetter') {
            // For other functions, store a flag that they exist
            config[`_has${property.charAt(0).toUpperCase() + property.slice(1)}`] = true;
          }
        } else if (value && typeof value === 'object' && property === 'headerStyle' && 
                   value._isHeaderStyleConfig) {
          // If it's already in our special format, store it as is
          config[property] = value;
        } else {
          // For non-function values, store directly
          config[property] = value;
        }
      }
    });
    
    console.log('[BulkActionsPanel] Template configuration captured:', {
      columnId: firstColumnId,
      propertiesFound: Object.keys(config),
      hasHeaderStyle: !!config.headerStyle,
      headerStyleType: config.headerStyle ? typeof config.headerStyle : 'none',
      hasCellStyle: !!config.cellStyle,
      hasValueFormatter: !!config.valueFormatter,
      totalProperties: Object.keys(config).length
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
      newTemplates = userTemplates.map(t => 
        t.id === editingTemplateId ? newTemplate : t
      );
    } else {
      // Add new template
      newTemplates = [...userTemplates, newTemplate];
    }
    
    saveTemplates(newTemplates);
    setShowSaveDialog(false);
    setTemplateName('');
    setEditingTemplateId('');
  }, [getCurrentColumnConfig, templateName, userTemplates, saveTemplates, editingTemplateId]);

  // Apply template to selected columns
  const applyTemplate = useCallback(() => {
    if (!selectedTemplateIds.length) return;
    
    console.log('[BulkActionsPanel] Applying multiple templates:', {
      templateIds: selectedTemplateIds,
      templateNames: selectedTemplateIds.map(id => templates.find(t => t.id === id)?.name).filter(Boolean),
      selectedColumnsCount: selectedColumns.size
    });
    
    // Merge all selected templates - later templates override earlier ones
    const mergedProperties: Partial<ColDef> = {};
    const appliedTemplateNames: string[] = [];
    
    selectedTemplateIds.forEach(templateId => {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;
      
      appliedTemplateNames.push(template.name);
      
      // Create a copy of template properties
      const templateProps = { ...template.properties };
      
      // Remove field and headerName to ensure they're never applied from templates
      delete templateProps.field;
      delete templateProps.headerName;
      
      // Special handling for certain properties
      
      // If template has a valueFormatter, apply it directly
      if (templateProps.valueFormatter && typeof templateProps.valueFormatter === 'function') {
        mergedProperties.valueFormatter = templateProps.valueFormatter;
      }
      // Handle useValueFormatterForExport (boolean flag)
      if (templateProps.useValueFormatterForExport !== undefined) {
        mergedProperties.useValueFormatterForExport = templateProps.useValueFormatterForExport;
      }
      
      // Handle headerStyle - convert back to function if needed
      if (templateProps.headerStyle) {
        const headerStyle = templateProps.headerStyle;
        if (headerStyle._isHeaderStyleConfig) {
          // Convert to function format
          mergedProperties.headerStyle = (params: { floatingFilter?: boolean }) => {
            if (params?.floatingFilter) {
              return headerStyle.floating || null;
            }
            return headerStyle.regular || null;
          };
        } else if (typeof headerStyle === 'object') {
          // Legacy format - just a style object
          mergedProperties.headerStyle = (params: { floatingFilter?: boolean }) => {
            if (!params?.floatingFilter) {
              return headerStyle;
            }
            return null;
          };
        }
      }
      
      // Merge all other properties (later templates override earlier ones)
      Object.keys(templateProps).forEach(key => {
        if (key !== 'valueFormatter' && key !== 'headerStyle' && key !== 'useValueFormatterForExport') {
          mergedProperties[key] = templateProps[key];
        }
      });
    });
    
    console.log('[BulkActionsPanel] Merged template properties:', {
      appliedTemplates: appliedTemplateNames,
      mergedPropertiesCount: Object.keys(mergedProperties).length,
      properties: Object.keys(mergedProperties),
      hasHeaderStyle: !!mergedProperties.headerStyle,
      headerStyleType: mergedProperties.headerStyle ? typeof mergedProperties.headerStyle : 'none',
      hasValueFormatter: !!mergedProperties.valueFormatter
    });
    
    // Apply all merged properties at once
    updateBulkProperties(mergedProperties);
    
    // Track which templates were applied to each selected column
    selectedColumns.forEach(columnId => {
      // For multiple templates, we'll track the combined template names
      const combinedTemplateName = appliedTemplateNames.join(' + ');
      const combinedTemplateId = selectedTemplateIds.join('+');
      setAppliedTemplate(columnId, combinedTemplateId, combinedTemplateName);
    });
    
    setSelectedTemplateIds([]); // Clear selection after applying
  }, [selectedTemplateIds, templates, updateBulkProperties, selectedColumns, setAppliedTemplate]);

  // Delete template
  const deleteTemplate = useCallback(() => {
    if (!templateToDelete) return;
    
    // Prevent deleting system templates
    const templateToDeleteObj = templates.find(t => t.id === templateToDelete);
    if (templateToDeleteObj?.isSystem) {
      console.warn('Cannot delete system template');
      setShowDeleteDialog(false);
      setTemplateToDelete('');
      return;
    }
    
    const newTemplates = userTemplates.filter(t => t.id !== templateToDelete);
    saveTemplates(newTemplates);
    setShowDeleteDialog(false);
    setTemplateToDelete('');
    
    // Clear selection if deleted template was selected
    if (selectedTemplateIds.includes(templateToDelete)) {
      setSelectedTemplateIds(selectedTemplateIds.filter(id => id !== templateToDelete));
    }
  }, [templateToDelete, userTemplates, saveTemplates, selectedTemplateIds, templates]);

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
  const hasTemplates = userTemplates.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Fixed header section */}
      <div className="px-4 py-3 border-b bg-card/50">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
          Templates
        </h3>
        <p className="text-xs text-muted-foreground">
          Save and apply column configurations
        </p>
        {selectedColumns.size > 1 && (
          <Alert className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Select only one column to save as a template
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4">
          {/* Template Selection */}
          {!hasTemplates ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground border rounded-md bg-muted/20">
              <p className="mb-1">No templates saved</p>
              <p className="text-xs opacity-70">Save current settings as a template</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Select templates ({selectedTemplateIds.length} selected)
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setSelectedTemplateIds(templates.map(t => t.id))}
                    disabled={selectedTemplateIds.length === templates.length}
                  >
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setSelectedTemplateIds([])}
                    disabled={selectedTemplateIds.length === 0}
                  >
                    None
                  </Button>
                </div>
              </div>
              
              {/* Template list - this is the only scrollable area */}
              <div className="max-h-64 overflow-y-auto border rounded-lg bg-background">
                <div className="p-2 space-y-1">
                  {templates.map((template) => (
                    <div 
                      key={template.id} 
                      className={`group flex items-center gap-3 p-3 rounded-md border transition-all hover:bg-muted/50 ${
                        selectedTemplateIds.includes(template.id) 
                          ? 'bg-muted/30 border-primary/20' 
                          : 'border-transparent hover:border-border'
                      } ${
                        template.isSystem 
                          ? 'bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent' 
                          : ''
                      }`}
                    >
                      <Checkbox
                        id={`template-${template.id}`}
                        checked={selectedTemplateIds.includes(template.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTemplateIds([...selectedTemplateIds, template.id]);
                          } else {
                            setSelectedTemplateIds(selectedTemplateIds.filter(id => id !== template.id));
                          }
                        }}
                        className="shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <label 
                            htmlFor={`template-${template.id}`} 
                            className="text-sm font-medium cursor-pointer truncate"
                          >
                            {template.name}
                          </label>
                          {template.isSystem && (
                            <Sparkles className="h-3 w-3 text-blue-500 shrink-0" title="System template" />
                          )}
                        </div>
                        {template.isSystem && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {getSystemTemplateDescription(template.id)}
                          </p>
                        )}
                      </div>
                      
                      {!template.isSystem && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTemplateId(template.id);
                              setTemplateName(template.name);
                              setShowSaveDialog(true);
                            }}
                            title="Edit template"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTemplateToDelete(template.id);
                              setShowDeleteDialog(true);
                            }}
                            title="Delete template"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed footer section with all action buttons */}
      <div className="border-t bg-card/50 p-4 space-y-4">
        {/* Apply Templates Button */}
        <div>
          <Button
            variant="default"
            size="sm"
            className="w-full h-9 text-sm gap-2"
            onClick={applyTemplate}
            disabled={!selectedTemplateIds.length}
            title={selectedTemplateIds.length ? `Apply ${selectedTemplateIds.length} template${selectedTemplateIds.length !== 1 ? 's' : ''}` : "Select templates to apply"}
          >
            <Copy className="h-4 w-4" />
            Apply Templates {selectedTemplateIds.length > 0 && `(${selectedTemplateIds.length})`}
          </Button>
        </div>

        {/* Template Management */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-sm gap-2"
              onClick={() => {
                setEditingTemplateId('');
                setTemplateName('');
                setShowSaveDialog(true);
              }}
              disabled={!canSaveTemplate}
              title={!canSaveTemplate ? "Select only one column to save as template" : "Save current column as template"}
            >
              <Save className="h-3.5 w-3.5" />
              Save New
            </Button>
            {selectedTemplateIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-sm gap-2"
                onClick={() => setSelectedTemplateIds([])}
                title="Clear template selection"
              >
                Clear Selection
              </Button>
            )}
          </div>
        </div>

        {/* Clear All */}
        <div className="pt-2 border-t">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
            Reset
          </h4>
          <Button
            variant="destructive"
            size="sm"
            className="w-full h-8 text-sm gap-2"
            onClick={clearAllCustomizations}
            disabled={isDisabled}
          >
            <Eraser className="h-3.5 w-3.5" />
            Clear Selected
          </Button>
        </div>

        {/* Status */}
        <div className="pt-2 border-t">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
            Status
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-muted/30">
              <span className="text-muted-foreground">Selected</span>
              <span className="font-medium">{selectedColumns.size}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/30">
              <span className="text-muted-foreground">Changes</span>
              <span className="font-medium">{changeCount}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-blue-50 dark:bg-blue-950/20">
              <span className="text-muted-foreground">System</span>
              <span className="font-medium">{SYSTEM_TEMPLATES.length}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/30">
              <span className="text-muted-foreground">User</span>
              <span className="font-medium">{userTemplates.length}</span>
            </div>
          </div>
        </div>
      </div>

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