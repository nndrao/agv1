import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Save, 
  Download,
  Upload,
  Clock,
  Star,
  Layers
} from 'lucide-react';
import { useColumnTemplateStore, DEFAULT_TEMPLATES } from '@/components/datatable/stores/columnTemplate.store';
import { useColumnFormattingStore } from '../../store/columnFormatting.store';
import { BulkTemplateApplication } from './BulkTemplateApplication';

interface TemplateSelectorProps {
  onApplyTemplate?: (templateId: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onApplyTemplate }) => {
  const { toast } = useToast();
  const {
    templates,
    recentTemplates,
    saveTemplate,
    applyTemplate,
    getTemplatesByRecent,
    exportTemplates,
    importTemplates
  } = useColumnTemplateStore();
  
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperties
  } = useColumnFormattingStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [savedTemplateDetails, setSavedTemplateDetails] = useState<{
    templateInfo: any;
    savedSettings: any;
    localStorage: any;
  } | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  // Get current column settings for selected columns
  const getCurrentSettings = () => {
    if (selectedColumns.size === 0) return null;
    
    console.log('[TemplateSelector] getCurrentSettings called');
    
    // Get the first selected column's settings as a base
    const firstColId = Array.from(selectedColumns)[0];
    const colDef = columnDefinitions.get(firstColId);
    const changes = pendingChanges.get(firstColId) || {};
    
    console.log('[TemplateSelector] Column state:', {
      firstColId,
      hasColDef: !!colDef,
      hasChanges: !!changes,
      changesKeys: changes ? Object.keys(changes) : [],
      wrapTextInChanges: changes?.wrapText,
      autoHeightInChanges: changes?.autoHeight
    });
    
    // IMPORTANT: Only use pending changes for templates, not the entire column definition
    // Templates should be independent of the original column
    const settingsToSave = { ...changes };
    
    // For certain style properties that might be in the colDef but not in changes,
    // we need to check if they're actually custom styles (not defaults)
    const styleProperties = ['cellStyle', 'headerStyle', 'cellClass', 'headerClass'];
    styleProperties.forEach(prop => {
      if (!(prop in settingsToSave) && colDef && (colDef as any)[prop]) {
        // Only include if it's not a default value
        const value = (colDef as any)[prop];
        if (value && (typeof value === 'object' || typeof value === 'string')) {
          (settingsToSave as any)[prop] = value;
        }
      }
    });
    
    // For formatter properties that might be custom
    if (!(('valueFormatter' in settingsToSave)) && colDef?.valueFormatter) {
      settingsToSave.valueFormatter = colDef.valueFormatter;
    }
    
    // Explicitly check for wrap properties that might be undefined
    // and convert them to false to ensure they're saved
    const wrapProperties = ['wrapText', 'autoHeight', 'wrapHeaderText', 'autoHeaderHeight'];
    wrapProperties.forEach(prop => {
      if (prop in settingsToSave && (settingsToSave as any)[prop] === undefined) {
        (settingsToSave as any)[prop] = false;
      }
    });
    
    // Only log if wrap properties exist
    if (Object.keys(settingsToSave).some(key => ['wrapText', 'autoHeight', 'wrapHeaderText', 'autoHeaderHeight'].includes(key))) {
      console.log('[TemplateSelector] Wrap properties in settingsToSave:', {
        wrapText: settingsToSave.wrapText,
        autoHeight: settingsToSave.autoHeight,
        wrapHeaderText: settingsToSave.wrapHeaderText,
        autoHeaderHeight: settingsToSave.autoHeaderHeight
      });
    }
    
    // Special handling for function-based properties
    const processedSettings: Record<string, unknown> = {};
    
    Object.entries(settingsToSave).forEach(([key, value]) => {
      // Skip column-specific and state properties to ensure templates are formatting-only
      const excludedProps = [
        // Column identity properties
        'field', 'headerName', 'colId', 'columnGroupShow', 
        'headerComponentFramework', 'headerComponentParams',
        'floatingFilterComponent', 'floatingFilterComponentFramework',
        'floatingFilterComponentParams', 'tooltipField',
        'tooltipValueGetter', 'keyCreator', 'checkboxSelection',
        'showRowGroup', 'dndSource', 'dndSourceOnRowDrag',
        'rowDrag', 'rowDragText', 'aggFunc', 'initialAggFunc',
        'defaultAggFunc', 'allowedAggFuncs',
        // Column state properties (should be managed separately, not in formatter)
        'width', 'minWidth', 'maxWidth', 'flex',
        'hide', 'pinned', 'lockPosition', 'lockVisible',
        'sort', 'sortIndex', 'sortedAt'
      ];
      
      if (excludedProps.includes(key)) {
        return;
      }
      
      if (key === 'cellStyle' && typeof value === 'function') {
        // For cellStyle functions, extract the base style if available
        const styleFunc = value as any;
        if (styleFunc.__baseStyle) {
          processedSettings[key] = styleFunc.__baseStyle;
        } else {
          // Try to extract style by calling the function with a dummy params
          try {
            const style = value({ value: null, data: {}, node: {}, colDef: {} } as any);
            processedSettings[key] = style;
          } catch (e) {
            // If function call fails, skip this property
            console.warn('Could not extract cellStyle for template', e);
          }
        }
      } else if (key === 'headerStyle' && typeof value === 'function') {
        // For headerStyle functions, extract styles for both regular and floating headers
        const styleFunc = value as any;
        if (styleFunc._isHeaderStyleConfig) {
          // Already in the right format
          processedSettings[key] = styleFunc;
        } else {
          try {
            const regularStyle = value({ floatingFilter: false } as any);
            const floatingStyle = value({ floatingFilter: true } as any);
            processedSettings[key] = {
              _isHeaderStyleConfig: true,
              regular: regularStyle,
              floating: floatingStyle
            };
          } catch (e) {
            console.warn('Could not extract headerStyle for template', e);
          }
        }
      } else if (key === 'valueFormatter' && typeof value === 'function') {
        // For formatters, check if they have a format string
        const formatterFunc = value as any;
        if (formatterFunc.__formatString) {
          processedSettings[key] = {
            _isFormatterConfig: true,
            type: 'excel',
            formatString: formatterFunc.__formatString
          };
        } else {
          // Skip function-based formatters that don't have format strings
          console.warn('Skipping function-based valueFormatter without format string');
        }
      } else if (typeof value !== 'function') {
        // For non-function values, just copy them as-is
        processedSettings[key] = value;
      }
      // Skip other function-based properties that we can't serialize
    });
    
    // Ensure wrap properties are always included, even if they're false
    const ensureWrapProperties = ['wrapText', 'autoHeight', 'wrapHeaderText', 'autoHeaderHeight'];
    ensureWrapProperties.forEach(prop => {
      if (!(prop in processedSettings)) {
        processedSettings[prop] = (settingsToSave as any)[prop] || false;
        console.log(`[TemplateSelector] Added missing wrap property ${prop}:`, (settingsToSave as any)[prop] || false);
      } else {
        console.log(`[TemplateSelector] Wrap property ${prop} already in processedSettings:`, processedSettings[prop]);
      }
    });
    
    // Only log wrap properties if they exist
    const hasWrapInProcessed = ['wrapText', 'autoHeight', 'wrapHeaderText', 'autoHeaderHeight']
      .some(prop => prop in processedSettings);
    
    if (hasWrapInProcessed) {
      console.log('[TemplateSelector] Wrap properties in processedSettings:', {
        wrapText: processedSettings.wrapText,
        autoHeight: processedSettings.autoHeight,
        wrapHeaderText: processedSettings.wrapHeaderText,
        autoHeaderHeight: processedSettings.autoHeaderHeight
      });
    }
    
    return processedSettings;
  };

  // Available properties that can be saved in a template
  const availableProperties = [
    // General Properties
    // Note: Column state properties (width, visibility, position) are excluded
    // Templates should only contain formatting/styling properties
    { key: 'type', label: 'Column Type' },
    { key: 'sortable', label: 'Sortable' },
    { key: 'resizable', label: 'Resizable' },
    
    // Styling Properties
    { key: 'cellClass', label: 'Cell CSS Class' },
    { key: 'cellStyle', label: 'Cell Style' },
    { key: 'headerClass', label: 'Header CSS Class' },
    { key: 'headerStyle', label: 'Header Style' },
    { key: 'wrapText', label: 'Wrap Text' },
    { key: 'autoHeight', label: 'Auto Height' },
    { key: 'wrapHeaderText', label: 'Wrap Header Text' },
    { key: 'autoHeaderHeight', label: 'Auto Header Height' },
    
    // Format Properties
    { key: 'valueFormatter', label: 'Value Formatter' },
    
    // Filter Properties
    { key: 'filter', label: 'Filter Type' },
    { key: 'filterParams', label: 'Filter Parameters' },
    { key: 'floatingFilter', label: 'Floating Filter' },
    { key: 'suppressHeaderMenuButton', label: 'Hide Header Menu' },
    { key: 'suppressFiltersToolPanel', label: 'Hide in Filters Panel' },
    
    // Editor Properties
    { key: 'editable', label: 'Editable' },
    { key: 'cellEditor', label: 'Cell Editor' },
    { key: 'cellEditorParams', label: 'Editor Parameters' },
    { key: 'singleClickEdit', label: 'Single Click Edit' },
    { key: 'cellEditorPopup', label: 'Editor Popup' },
  ];

  // Get properties that have been modified by the user
  const getModifiedProperties = () => {
    const modifiedProps = new Set<string>();
    
    // Check pending changes for all selected columns
    selectedColumns.forEach(colId => {
      const changes = pendingChanges.get(colId);
      const colDef = columnDefinitions.get(colId);
      
      if (changes) {
        // Add all properties that have been modified
        Object.keys(changes).forEach(prop => {
          if (availableProperties.some(available => available.key === prop)) {
            modifiedProps.add(prop);
          }
        });
      }
      
      // Also check for wrap properties that might be set in the column definition
      // but not in pending changes (e.g., set before dialog opened)
      if (colDef) {
        const wrapProperties = ['wrapText', 'autoHeight', 'wrapHeaderText', 'autoHeaderHeight'];
        wrapProperties.forEach(prop => {
          // Include wrap properties if they're true in either colDef or changes
          const value = (changes as any)?.[prop] !== undefined ? (changes as any)[prop] : (colDef as any)[prop];
          if (value === true && availableProperties.some(available => available.key === prop)) {
            modifiedProps.add(prop);
          }
        });
      }
    });
    
    return Array.from(modifiedProps);
  };

  // Select only modified properties by default when dialog opens
  useEffect(() => {
    if (showSaveDialog && selectedProperties.length === 0) {
      const modifiedProps = getModifiedProperties();
      
      if (modifiedProps.length > 0) {
        // Only select properties that have been modified
        setSelectedProperties(modifiedProps);
      } else {
        // Fallback: if no modifications detected, suggest common properties
        const commonProps = ['width', 'cellClass', 'cellStyle', 'valueFormatter'];
        const availableCommon = commonProps.filter(prop => 
          availableProperties.some(available => available.key === prop)
        );
        setSelectedProperties(availableCommon);
      }
    }
  }, [showSaveDialog, selectedProperties.length, selectedColumns, pendingChanges, availableProperties]);

  // Reset dialog when closing
  const handleSaveDialogChange = (open: boolean) => {
    if (open) {
      console.log('[TemplateSelector] Opening save dialog');
    }
    setShowSaveDialog(open);
    if (!open) {
      setTemplateName('');
      setTemplateDescription('');
      setSelectedProperties([]);
    }
  };

  const handleSaveTemplate = () => {
    console.log('[TemplateSelector] Save Template button clicked');
    
    const settings = getCurrentSettings();
    if (!settings) {
      toast({
        title: "No columns selected",
        description: "Please select columns before saving a template",
        variant: "destructive"
      });
      return;
    }
    
    console.log('[TemplateSelector] Settings to save:', {
      templateName,
      selectedProperties,
      allAvailableSettings: settings,
      wrapText: settings.wrapText,
      autoHeight: settings.autoHeight,
      wrapHeaderText: settings.wrapHeaderText,
      autoHeaderHeight: settings.autoHeaderHeight
    });

    // Filter settings to only include selected properties
    const filteredSettings: Record<string, unknown> = {};
    selectedProperties.forEach(prop => {
      if (prop in settings) {
        filteredSettings[prop] = settings[prop as keyof typeof settings];
      } else {
        // For wrap properties, check the combined object directly
        const wrapProperties = ['wrapText', 'autoHeight', 'wrapHeaderText', 'autoHeaderHeight'];
        if (wrapProperties.includes(prop)) {
          const firstColId = Array.from(selectedColumns)[0];
          const colDef = columnDefinitions.get(firstColId);
          const changes = pendingChanges.get(firstColId);
          const combined = { ...colDef, ...changes };
          
          if (prop in combined) {
            (filteredSettings as any)[prop] = (combined as any)[prop];
            console.log(`[TemplateSelector] Added wrap property ${prop} from combined:`, (combined as any)[prop]);
          }
        }
      }
    });
    
    // Always log what we're about to save
    console.log('[TemplateSelector] Final filtered settings to save:', {
      templateName,
      selectedProperties,
      filteredSettings,
      wrapPropsIncluded: ['wrapText', 'autoHeight', 'wrapHeaderText', 'autoHeaderHeight']
        .filter(prop => prop in filteredSettings),
      wrapText: (filteredSettings as any).wrapText,
      autoHeight: (filteredSettings as any).autoHeight,
      wrapHeaderText: (filteredSettings as any).wrapHeaderText,
      autoHeaderHeight: (filteredSettings as any).autoHeaderHeight
    });
    
    // Save the template and get the generated ID
    const templateId = saveTemplate(
      templateName,
      templateDescription,
      filteredSettings,
      selectedProperties
    );

    // Get the full template store state to show what was persisted
    const storeState = useColumnTemplateStore.getState();
    const savedTemplate = storeState.templates.find(t => t.id === templateId);
    
    // Get localStorage data
    const localStorageKey = 'column-template-store';
    const localStorageData = localStorage.getItem(localStorageKey);
    const parsedLocalStorage = localStorageData ? JSON.parse(localStorageData) : null;

    // Prepare details for the popup
    setSavedTemplateDetails({
      templateInfo: {
        id: templateId,
        name: templateName,
        description: templateDescription,
        createdAt: new Date().toISOString(),
        includedProperties: selectedProperties
      },
      savedSettings: filteredSettings,
      localStorage: {
        key: localStorageKey,
        totalTemplates: parsedLocalStorage?.state?.templates?.length || 0,
        savedTemplate: savedTemplate || null
      }
    });

    // Show the details dialog
    setShowDetailsDialog(true);

    toast({
      title: "Template saved",
      description: `Template "${templateName}" has been saved successfully`,
    });

    // Reset dialog
    setShowSaveDialog(false);
    setTemplateName('');
    setTemplateDescription('');
    setSelectedProperties([]);
  };

  const handleApplyTemplate = (templateId: string) => {
    const settings = applyTemplate(templateId);
    
    if (settings) {
      updateBulkProperties(settings);
      onApplyTemplate?.(templateId);
      
      const template = templates.find(t => t.id === templateId);
      toast({
        title: "Template applied",
        description: `Applied "${template?.name}" to ${selectedColumns.size} column${selectedColumns.size === 1 ? '' : 's'}`,
      });
    } else {
      console.warn('[TemplateSelector] No settings returned from applyTemplate');
    }
  };

  const handleExport = () => {
    const json = exportTemplates();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'column-templates.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Templates exported",
      description: "Your templates have been downloaded",
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (importTemplates(content)) {
          toast({
            title: "Templates imported",
            description: "Templates have been imported successfully",
          });
        } else {
          toast({
            title: "Import failed",
            description: "Failed to import templates. Please check the file format.",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const sortedTemplates = getTemplatesByRecent();
  const hasDefaultTemplates = DEFAULT_TEMPLATES.length > 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Column Templates</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Save current settings */}
          <DropdownMenuItem 
            onClick={() => setShowSaveDialog(true)}
            disabled={selectedColumns.size === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Current Settings
          </DropdownMenuItem>
          
          {/* Bulk template application */}
          <DropdownMenuItem 
            onClick={() => setShowBulkDialog(true)}
            disabled={selectedColumns.size === 0}
          >
            <Layers className="h-4 w-4 mr-2" />
            Bulk Apply Templates
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Recent templates */}
          {recentTemplates.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Recent
              </DropdownMenuLabel>
              {recentTemplates.slice(0, 3).map(templateId => {
                const template = templates.find(t => t.id === templateId);
                if (!template) return null;
                return (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={() => handleApplyTemplate(template.id)}
                  >
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1">{template.name}</span>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Default templates */}
          {hasDefaultTemplates && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Star className="h-4 w-4 mr-2" />
                Default Templates
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {DEFAULT_TEMPLATES.map((template, index) => (
                  <DropdownMenuItem
                    key={`default-${index}`}
                    onClick={() => {
                      // Create and apply default template
                      const id = saveTemplate(
                        template.name,
                        template.description || '',
                        template.settings,
                        template.includedProperties
                      );
                      handleApplyTemplate(id);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{template.name}</span>
                      {template.description && (
                        <span className="text-xs text-muted-foreground">{template.description}</span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          
          {/* User templates */}
          {sortedTemplates.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                My Templates
              </DropdownMenuLabel>
              {sortedTemplates.map(template => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => handleApplyTemplate(template.id)}
                >
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="flex-1">{template.name}</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                    {template.includedProperties.length}
                  </Badge>
                </DropdownMenuItem>
              ))}
            </>
          )}
          
          <DropdownMenuSeparator />
          
          {/* Import/Export */}
          <DropdownMenuItem onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Templates
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Import Templates
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </label>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={handleSaveDialogChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Save Column Template</DialogTitle>
            <DialogDescription>
              Save the current column settings as a reusable template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Financial Report Format"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-description">Description (optional)</Label>
              <Textarea
                id="template-description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe what this template is for..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Properties to Include</Label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Modified</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span>Available</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        const modifiedProps = getModifiedProperties();
                        setSelectedProperties(modifiedProps);
                      }}
                      disabled={getModifiedProperties().length === 0}
                    >
                      Modified Only
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setSelectedProperties(availableProperties.map(p => p.key))}
                    >
                      Select All
                    </Button>
                  </div>
                </div>
              </div>
              <ScrollArea className="h-48 p-2 border rounded-md">
                <div className="grid grid-cols-2 gap-2">
                {(() => {
                  console.log('[TemplateSelector] Rendering properties grid, availableProperties:', availableProperties.length);
                  const modifiedProps = getModifiedProperties();
                  const settings = getCurrentSettings();
                  
                  return availableProperties.map(prop => {
                    const isModified = modifiedProps.includes(prop.key);
                    const currentValue = settings?.[prop.key];
                    const isWrapProperty = ['wrapText', 'autoHeight', 'wrapHeaderText', 'autoHeaderHeight'].includes(prop.key);
                    const isEnabled = currentValue === true;
                    
                    // Build tooltip
                    let tooltip = '';
                    if (isModified) {
                      tooltip = 'This property has been modified in the current session';
                    }
                    if (isWrapProperty && isEnabled) {
                      tooltip = tooltip ? `${tooltip} (Currently: ON)` : 'Currently: ON';
                    } else if (isWrapProperty && currentValue === false) {
                      tooltip = tooltip ? `${tooltip} (Currently: OFF)` : 'Currently: OFF';
                    }
                    
                    return (
                      <label
                        key={prop.key}
                        className={`flex items-center space-x-2 cursor-pointer hover:bg-accent p-1 rounded ${
                          isModified ? 'bg-blue-50 border border-blue-200' : ''
                        } ${isWrapProperty && isEnabled ? 'ring-1 ring-green-400' : ''}`}
                        title={tooltip}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProperties.includes(prop.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newProps = [...selectedProperties, prop.key];
                              setSelectedProperties(newProps);
                              if (['wrapText', 'autoHeight', 'wrapHeaderText', 'autoHeaderHeight'].includes(prop.key)) {
                                console.log(`[TemplateSelector] Selected wrap property: ${prop.key}, total selected: ${newProps.length}`);
                              }
                            } else {
                              const newProps = selectedProperties.filter(p => p !== prop.key);
                              setSelectedProperties(newProps);
                              if (['wrapText', 'autoHeight', 'wrapHeaderText', 'autoHeaderHeight'].includes(prop.key)) {
                                console.log(`[TemplateSelector] Deselected wrap property: ${prop.key}, total selected: ${newProps.length}`);
                              }
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className={`text-sm ${isModified ? 'font-medium text-blue-700' : ''} ${isWrapProperty && isEnabled ? 'text-green-700' : ''}`}>
                          {prop.label}
                          {isWrapProperty && isEnabled && ' ✓'}
                        </span>
                        {isModified && !isWrapProperty && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto" />
                        )}
                        {isWrapProperty && isEnabled && (
                          <div className="w-2 h-2 bg-green-500 rounded-full ml-auto" />
                        )}
                      </label>
                    );
                  });
                })()}
                </div>
              </ScrollArea>
              {(() => {
                const modifiedCount = getModifiedProperties().length;
                return modifiedCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {modifiedCount} propert{modifiedCount === 1 ? 'y' : 'ies'} modified in current session
                  </p>
                );
              })()}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => handleSaveDialogChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                console.log('[TemplateSelector] Save button clicked, validation:', {
                  templateName,
                  hasTemplateName: !!templateName,
                  selectedPropertiesCount: selectedProperties.length,
                  selectedProperties,
                  isDisabled: !templateName || selectedProperties.length === 0
                });
                handleSaveTemplate();
              }}
              disabled={!templateName || selectedProperties.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Template Application Dialog */}
      <BulkTemplateApplication
        open={showBulkDialog}
        onOpenChange={setShowBulkDialog}
      />

      {/* Template Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Template Saved Successfully</DialogTitle>
            <DialogDescription>
              Here are the details of what was saved and persisted
            </DialogDescription>
          </DialogHeader>
          
          {savedTemplateDetails && (
            <div className="flex-1 overflow-auto space-y-4">
              {/* Template Information */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Template Information</h3>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                  {JSON.stringify(savedTemplateDetails.templateInfo, null, 2)}
                </pre>
              </div>

              {/* Saved Settings */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Saved Settings</h3>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                  {JSON.stringify(savedTemplateDetails.savedSettings, null, 2)}
                </pre>
              </div>

              {/* LocalStorage Information */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">LocalStorage Persistence</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Storage Key:</strong> {savedTemplateDetails.localStorage.key}</p>
                  <p><strong>Total Templates Stored:</strong> {savedTemplateDetails.localStorage.totalTemplates}</p>
                </div>
                {savedTemplateDetails.localStorage.savedTemplate && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Full Template Object in Storage:</p>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                      {JSON.stringify(savedTemplateDetails.localStorage.savedTemplate, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Profile Settings Note */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Profile Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Templates are stored independently from profiles. To include this template in a profile, 
                  apply the template to columns and then save the profile.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};