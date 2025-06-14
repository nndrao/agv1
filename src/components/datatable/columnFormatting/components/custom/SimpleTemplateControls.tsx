import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Save,
  Layers,
  Check,
  X,
  Trash2
} from 'lucide-react';
import { useColumnTemplateStore } from '@/components/datatable/stores/columnTemplate.store';
import { useColumnFormattingStore } from '../../store/columnFormatting.store';
import { useProfileStore } from '@/components/datatable/stores/profile.store';

interface SimpleTemplateControlsProps {
  selectedColumns: Set<string>;
  columnDefinitions: Map<string, any>;
  gridApi?: any; // Optional grid API to get current column state
}

export const SimpleTemplateControls: React.FC<SimpleTemplateControlsProps> = ({
  selectedColumns,
  columnDefinitions
}) => {
  const {
    templates,
    saveTemplate,
    applyTemplate,
    deleteTemplate
  } = useColumnTemplateStore();
  
  const {
    pendingChanges,
    updateBulkProperties
  } = useColumnFormattingStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [savedTemplateDetails, setSavedTemplateDetails] = useState<{
    templateInfo: any;
    savedSettings: any;
    localStorage: any;
  } | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  // Get current column settings for selected columns
  const getCurrentSettings = useCallback(() => {
    if (selectedColumns.size === 0) return null;
    
    // Get the first selected column's settings as a base
    const firstColId = Array.from(selectedColumns)[0];
    const colDef = columnDefinitions.get(firstColId);
    const changes = pendingChanges.get(firstColId) || {};
    
    // First check if we have any applied customizations from a previous save
    
    // If we have pending changes, those take priority
    let allSettings = {};
    
    if (Object.keys(changes).length > 0) {
      // Use pending changes combined with column def
      allSettings = { ...colDef, ...changes };
    } else {
      // No pending changes - get the current column state from the grid
      // The column def should have all applied formatting
      allSettings = { ...colDef };
      
      // Also check if there are any previously applied customizations
      // that might be stored in the profile system
      const profileStore = useProfileStore.getState();
      const activeProfile = profileStore.getActiveProfile();
      if (activeProfile) {
        const columnCustomization = activeProfile?.columnSettings?.columnCustomizations?.[firstColId];
        if (columnCustomization) {
          console.log('[SimpleTemplateControls] Found column customization in profile:', columnCustomization);
          allSettings = { ...allSettings, ...columnCustomization };
        }
      }
    }
    
    // Debug: Log what we have
    console.log('[SimpleTemplateControls] getCurrentSettings:', {
      firstColId,
      hasColDef: !!colDef,
      colDefKeys: colDef ? Object.keys(colDef).filter(k => (colDef as any)[k] !== undefined) : [],
      pendingChangesKeys: Object.keys(changes),
      allSettingsKeys: Object.keys(allSettings).filter(k => (allSettings as any)[k] !== undefined),
      allSettings
    });
    
    // Extract only formatting-related properties (exclude column identity and state)
    const formattingProps = [
      // Style properties
      'cellStyle', 'cellClass', 'cellClassRules',
      'headerClass', 'headerStyle',
      
      // Text wrapping
      'wrapText', 'autoHeight', 'wrapHeaderText', 'autoHeaderHeight',
      
      // Formatting
      'valueFormatter', 'valueGetter', 'type',
      
      // Filter properties
      'filter', 'filterParams', 'floatingFilter',
      
      // Editor properties
      'editable', 'cellEditor', 'cellEditorParams',
      'singleClickEdit', 'cellEditorPopup',
      
      // Other formatting
      'tooltipField', 'tooltipValueGetter',
      'suppressMenu', 'menuTabs',
      
      // Additional common properties
      'sortable', 'resizable', 'suppressSizeToFit',
      'suppressAutoSize', 'suppressColumnsToolPanel',
      'suppressFiltersToolPanel', 'suppressHeaderMenuButton'
    ];
    
    const formattingSettings = {};
    formattingProps.forEach(prop => {
      if (prop in allSettings && (allSettings as any)[prop] !== undefined) {
        (formattingSettings as any)[prop] = (allSettings as any)[prop];
      }
    });
    
    // If we still don't have any settings, try to create a minimal template
    // with at least the column type (this ensures the template is not empty)
    if (Object.keys(formattingSettings).length === 0 && colDef) {
      // Add at least the type if available
      if (colDef.type) {
        (formattingSettings as any).type = colDef.type;
      }
      
      // Check for any basic properties that might be set
      const basicProps = ['sortable', 'resizable', 'editable', 'filter'];
      basicProps.forEach(prop => {
        if ((colDef as any)[prop] !== undefined) {
          (formattingSettings as any)[prop] = (colDef as any)[prop];
        }
      });
      
      // Add a note that this is a minimal template
      (formattingSettings as any)._minimal = true;
    }
    
    // Log the final formatting settings
    console.log('[SimpleTemplateControls] Extracted formatting settings:', {
      settingsCount: Object.keys(formattingSettings).length,
      settings: formattingSettings
    });
    
    return formattingSettings;
  }, [selectedColumns, columnDefinitions, pendingChanges]);

  // Save current settings as template
  const handleSaveAsTemplate = useCallback(() => {
    const settings = getCurrentSettings();
    if (!settings || Object.keys(settings).length === 0) {
      toast.error("No formatting settings to save. Please apply some formatting to the column first, or click 'Apply' if you have pending changes.");
      return;
    }

    // The settings from getCurrentSettings are already filtered for formatting-only properties
    const filteredSettings = { ...settings };
    
    // Define properties that should never be in templates (additional safety check)
    const excludedProps = [
      // Column identity properties
      'field', 'headerName', 'colId', 'columnGroupShow', 
      'headerComponentFramework', 'headerComponentParams',
      'floatingFilterComponent', 'floatingFilterComponentFramework',
      'floatingFilterComponentParams',
      'keyCreator', 'checkboxSelection',
      'showRowGroup', 'dndSource', 'dndSourceOnRowDrag',
      'rowDrag', 'rowDragText', 'aggFunc', 'initialAggFunc',
      'defaultAggFunc', 'allowedAggFuncs',
      // Column state properties (should be managed separately, not in formatter)
      'width', 'minWidth', 'maxWidth', 'flex',
      'hide', 'pinned', 'lockPosition', 'lockVisible',
      'sort', 'sortIndex', 'sortedAt'
    ];
    
    // Additional safety: remove any excluded properties that might have slipped through
    excludedProps.forEach(prop => {
      delete (filteredSettings as any)[prop];
    });

    console.log('[SimpleTemplateControls] Final settings to save:', {
      templateName,
      properties: Object.keys(filteredSettings),
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
      Object.keys(filteredSettings)
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
        includedProperties: Object.keys(filteredSettings)
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

    toast.success(`Template "${templateName}" saved successfully`);
    
    // Reset dialog
    setShowSaveDialog(false);
    setTemplateName('');
    setTemplateDescription('');
  }, [getCurrentSettings, saveTemplate, templateName, templateDescription, selectedColumns, pendingChanges]);

  // Apply selected templates to columns
  const handleApplyTemplates = useCallback(() => {
    if (selectedTemplates.size === 0) {
      toast.error("No templates selected");
      return;
    }

    // Apply each selected template
    selectedTemplates.forEach(templateId => {
      const settings = applyTemplate(templateId);
      if (settings) {
        updateBulkProperties(settings);
      }
    });

    const templateCount = selectedTemplates.size;
    toast.success(`Applied ${templateCount} template${templateCount > 1 ? 's' : ''} to selected columns`);
    
    // Reset selection
    setSelectedTemplates(new Set());
    setShowTemplateSelector(false);
  }, [selectedTemplates, applyTemplate, updateBulkProperties]);

  // Toggle template selection
  const toggleTemplate = useCallback((templateId: string) => {
    const newSelection = new Set(selectedTemplates);
    if (newSelection.has(templateId)) {
      newSelection.delete(templateId);
    } else {
      newSelection.add(templateId);
    }
    setSelectedTemplates(newSelection);
  }, [selectedTemplates]);

  // Handle template deletion
  const handleDeleteTemplate = useCallback((templateId: string, templateName: string) => {
    // Remove from selection if selected
    const newSelection = new Set(selectedTemplates);
    newSelection.delete(templateId);
    setSelectedTemplates(newSelection);
    
    // Delete the template
    deleteTemplate(templateId);
    toast.success(`Template "${templateName}" deleted`);
  }, [selectedTemplates, deleteTemplate]);

  const isSingleColumn = selectedColumns.size === 1;

  return (
    <>
      {/* Save as Template Button - Only show for single column */}
      {isSingleColumn && (
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-[11px] border border-border/60 bg-background/80 hover:bg-muted/50 transition-all duration-200"
          onClick={() => setShowSaveDialog(true)}
        >
          <Save className="h-3 w-3" />
          <span className="hidden md:inline ml-1 font-medium">As Template</span>
        </Button>
      )}

      {/* Template Selector */}
      <Popover open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[11px] border border-border/60 bg-background/80 hover:bg-muted/50 transition-all duration-200"
          >
            <Layers className="h-3 w-3" />
            <span className="hidden md:inline ml-1 font-medium">
              {selectedTemplates.size > 0 ? `Templates (${selectedTemplates.size})` : 'Templates'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm">Select Templates to Apply</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Choose multiple templates to apply to selected columns
            </p>
          </div>
          
          <ScrollArea className="h-64">
            <div className="p-2 space-y-1">
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No templates available
                </p>
              ) : (
                templates.map(template => (
                  <div
                    key={template.id}
                    className="flex items-start gap-2 p-2 rounded hover:bg-accent group"
                    onMouseEnter={() => setHoveredTemplate(template.id)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                  >
                    <Checkbox
                      checked={selectedTemplates.has(template.id)}
                      onCheckedChange={() => toggleTemplate(template.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleTemplate(template.id)}>
                      <div className="font-medium text-sm">{template.name}</div>
                      {template.description && (
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {template.includedProperties.length} properties
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                        hoveredTemplate === template.id ? 'opacity-100' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id, template.name);
                      }}
                      title="Delete template"
                    >
                      <Trash2 className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          <div className="p-3 border-t flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTemplates(new Set());
                setShowTemplateSelector(false);
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApplyTemplates}
              disabled={selectedTemplates.size === 0 || selectedColumns.size === 0}
            >
              <Check className="h-3 w-3 mr-1" />
              Apply {selectedTemplates.size > 0 && `(${selectedTemplates.size})`}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Column Template</DialogTitle>
            <DialogDescription>
              Save the current column settings as a reusable template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Financial Column"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe what this template is for..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                console.log('[SimpleTemplateControls] Save Template button clicked');
                handleSaveAsTemplate();
              }}
              disabled={!templateName.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <div className="flex-1 overflow-auto space-y-4 py-4">
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