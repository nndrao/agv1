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
import { useColumnTemplateStore, DEFAULT_TEMPLATES } from '../../stores/columnTemplate.store';
import { useColumnCustomizationStore } from '../../columnCustomizations/store/columnCustomization.store';
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
  } = useColumnCustomizationStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  // Get current column settings for selected columns
  const getCurrentSettings = () => {
    if (selectedColumns.size === 0) return null;
    
    // Get the first selected column's settings as a base
    const firstColId = Array.from(selectedColumns)[0];
    const colDef = columnDefinitions.get(firstColId);
    const changes = pendingChanges.get(firstColId);
    
    return { ...colDef, ...changes };
  };

  // Available properties that can be saved in a template
  const availableProperties = [
    { key: 'width', label: 'Column Width' },
    { key: 'minWidth', label: 'Min Width' },
    { key: 'maxWidth', label: 'Max Width' },
    { key: 'hide', label: 'Visibility' },
    { key: 'pinned', label: 'Pin Position' },
    { key: 'sortable', label: 'Sortable' },
    { key: 'resizable', label: 'Resizable' },
    { key: 'editable', label: 'Editable' },
    { key: 'filter', label: 'Filter Type' },
    { key: 'floatingFilter', label: 'Floating Filter' },
    { key: 'cellClass', label: 'Cell CSS Class' },
    { key: 'cellStyle', label: 'Cell Style' },
    { key: 'headerClass', label: 'Header CSS Class' },
    { key: 'headerStyle', label: 'Header Style' },
    { key: 'valueFormatter', label: 'Value Formatter' },
    { key: 'wrapText', label: 'Wrap Text' },
    { key: 'autoHeight', label: 'Auto Height' },
    { key: 'cellEditor', label: 'Cell Editor' },
  ];

  // Get properties that have been modified by the user
  const getModifiedProperties = () => {
    const modifiedProps = new Set<string>();
    
    // Check pending changes for all selected columns
    selectedColumns.forEach(colId => {
      const changes = pendingChanges.get(colId);
      if (changes) {
        // Add all properties that have been modified
        Object.keys(changes).forEach(prop => {
          if (availableProperties.some(available => available.key === prop)) {
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
    setShowSaveDialog(open);
    if (!open) {
      setTemplateName('');
      setTemplateDescription('');
      setSelectedProperties([]);
    }
  };

  const handleSaveTemplate = () => {
    const settings = getCurrentSettings();
    if (!settings) {
      toast({
        title: "No columns selected",
        description: "Please select columns before saving a template",
        variant: "destructive"
      });
      return;
    }

    // Filter settings to only include selected properties
    const filteredSettings: Record<string, unknown> = {};
    selectedProperties.forEach(prop => {
      if (prop in settings) {
        filteredSettings[prop] = settings[prop];
      }
    });

    saveTemplate(
      templateName,
      templateDescription,
      filteredSettings,
      selectedProperties
    );

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
        description: `Applied "${template?.name}" to selected columns`,
      });
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
        <DialogContent className="sm:max-w-[500px]">
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
                  const modifiedProps = getModifiedProperties();
                  
                  return availableProperties.map(prop => {
                    const isModified = modifiedProps.includes(prop.key);
                    
                    return (
                      <label
                        key={prop.key}
                        className={`flex items-center space-x-2 cursor-pointer hover:bg-accent p-1 rounded ${
                          isModified ? 'bg-blue-50 border border-blue-200' : ''
                        }`}
                        title={isModified ? 'This property has been modified in the current session' : ''}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProperties.includes(prop.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProperties([...selectedProperties, prop.key]);
                            } else {
                              setSelectedProperties(selectedProperties.filter(p => p !== prop.key));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className={`text-sm ${isModified ? 'font-medium text-blue-700' : ''}`}>
                          {prop.label}
                        </span>
                        {isModified && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto" />
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
              onClick={handleSaveTemplate}
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
    </>
  );
};