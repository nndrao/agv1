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
import { useColumnTemplateStore } from '../../stores/columnTemplate.store';
import { useColumnCustomizationStore } from '../../dialogs/columnSettings/store/columnCustomization.store';

interface SimpleTemplateControlsProps {
  selectedColumns: Set<string>;
  columnDefinitions: Map<string, any>;
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
  } = useColumnCustomizationStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
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
    const changes = pendingChanges.get(firstColId);
    
    return { ...colDef, ...changes };
  }, [selectedColumns, columnDefinitions, pendingChanges]);

  // Save current settings as template
  const handleSaveAsTemplate = useCallback(() => {
    const settings = getCurrentSettings();
    if (!settings) {
      toast.error("No columns selected");
      return;
    }

    // Include commonly customized properties
    const propertiesToSave = [
      'width', 'minWidth', 'maxWidth', 'hide', 'pinned',
      'cellClass', 'cellStyle', 'headerClass', 'headerStyle',
      'valueFormatter', 'filter', 'floatingFilter',
      'editable', 'sortable', 'resizable'
    ];

    const filteredSettings: Record<string, unknown> = {};
    propertiesToSave.forEach(prop => {
      if (prop in settings && settings[prop] !== undefined) {
        filteredSettings[prop] = settings[prop];
      }
    });

    saveTemplate(
      templateName,
      templateDescription,
      filteredSettings,
      Object.keys(filteredSettings)
    );

    toast.success(`Template "${templateName}" saved successfully`);
    
    // Reset dialog
    setShowSaveDialog(false);
    setTemplateName('');
    setTemplateDescription('');
  }, [getCurrentSettings, saveTemplate, templateName, templateDescription]);

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
          className="ribbon-action-secondary"
          onClick={() => setShowSaveDialog(true)}
        >
          <Save className="h-3 w-3" />
          <span className="hidden sm:inline ml-1">Save as Template</span>
        </Button>
      )}

      {/* Template Selector */}
      <Popover open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="ribbon-action-secondary"
          >
            <Layers className="h-3 w-3" />
            <span className="hidden sm:inline ml-1">
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
                        {template.lastUsed && (
                          <span className="text-xs text-muted-foreground">
                            • Used {new Date(template.lastUsed).toLocaleDateString()}
                          </span>
                        )}
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
                      <Trash2 className="h-3 w-3 text-destructive" />
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
              onClick={handleSaveAsTemplate}
              disabled={!templateName.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};