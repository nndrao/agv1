import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Search,
  Trash2,
  Clock,
  Check,
  X,
  AlertTriangle,
  Columns3,
  Palette,
  Filter,
  Edit3,
  Settings
} from 'lucide-react';
import { useColumnTemplateStore } from '../../stores/columnTemplate.store';
import { useColumnCustomizationStore } from '../../dialogs/columnSettings/store/columnCustomization.store';
import { parseColorValue } from '../../utils/styleUtils';

interface BulkTemplateApplicationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


export const BulkTemplateApplication: React.FC<BulkTemplateApplicationProps> = ({
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const {
    templates,
    recentTemplates,
    deleteTemplate,
    applyTemplate,
    getTemplatesByRecent
  } = useColumnTemplateStore();
  
  const {
    selectedColumns,
    columnDefinitions,
    updateBulkProperties
  } = useColumnCustomizationStore();

  const [assignments, setAssignments] = useState<Map<string, string | null>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');

  // Get available templates organized by category
  const { recentTemplateList, userTemplates } = useMemo(() => {
    const sortedTemplates = getTemplatesByRecent();
    const recentSet = new Set(recentTemplates);
    
    return {
      recentTemplateList: templates.filter(t => recentSet.has(t.id)).slice(0, 5),
      userTemplates: sortedTemplates.filter(t => !recentSet.has(t.id))
    };
  }, [templates, recentTemplates, getTemplatesByRecent]);

  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
    if (!searchTerm) return templates;
    const term = searchTerm.toLowerCase();
    return templates.filter(t => 
      t.name.toLowerCase().includes(term) || 
      t.description?.toLowerCase().includes(term)
    );
  }, [templates, searchTerm]);

  // Get selected columns information
  const selectedColumnsInfo = useMemo(() => {
    return Array.from(selectedColumns).map(colId => {
      const colDef = columnDefinitions.get(colId);
      return {
        id: colId,
        name: colDef?.headerName || colDef?.field || colId,
        colDef
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedColumns, columnDefinitions]);

  // Handle template assignment to column
  const handleTemplateAssignment = (columnId: string, templateId: string | null) => {
    const newAssignments = new Map(assignments);
    newAssignments.set(columnId, templateId);
    setAssignments(newAssignments);
  };

  // Handle applying same template to all columns
  const handleApplyToAll = (templateId: string) => {
    const newAssignments = new Map();
    selectedColumnsInfo.forEach(col => {
      newAssignments.set(col.id, templateId);
    });
    setAssignments(newAssignments);
  };

  // Handle template deletion
  const handleDeleteTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    if (window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      // Remove from any current assignments
      const newAssignments = new Map(assignments);
      Array.from(newAssignments.entries()).forEach(([colId, tId]) => {
        if (tId === templateId) {
          newAssignments.set(colId, null);
        }
      });
      setAssignments(newAssignments);

      deleteTemplate(templateId);
      toast({
        title: "Template deleted",
        description: `Template "${template.name}" has been deleted`,
      });
    }
  };

  // Apply all assignments
  const handleApplyAll = () => {
    let appliedCount = 0;
    const errors: string[] = [];

    // Group assignments by template
    const templateGroups = new Map<string, string[]>();
    
    assignments.forEach((templateId, columnId) => {
      if (templateId) {
        if (!templateGroups.has(templateId)) {
          templateGroups.set(templateId, []);
        }
        templateGroups.get(templateId)!.push(columnId);
      }
    });

    // Apply each template to its assigned columns
    templateGroups.forEach((columnIds, templateId) => {
      const settings = applyTemplate(templateId);
      if (settings) {
        // Temporarily change selection to apply to specific columns
        const originalSelection = new Set(selectedColumns);
        
        // Update store selection to target columns
        const store = useColumnCustomizationStore.getState();
        store.setSelectedColumns(new Set(columnIds));
        
        // Apply template settings
        updateBulkProperties(settings);
        
        // Restore original selection
        store.setSelectedColumns(originalSelection);
        
        appliedCount += columnIds.length;
      } else {
        const template = templates.find(t => t.id === templateId);
        errors.push(`Failed to apply template "${template?.name}"`);
      }
    });

    if (appliedCount > 0) {
      toast({
        title: "Templates applied",
        description: `Successfully applied templates to ${appliedCount} column${appliedCount !== 1 ? 's' : ''}`,
      });
    }

    if (errors.length > 0) {
      toast({
        title: "Some applications failed",
        description: errors.join(', '),
        variant: "destructive"
      });
    }

    onOpenChange(false);
  };

  // Get template icon based on properties
  const getTemplateIcon = (template: { includedProperties: string[] }) => {
    const props = template.includedProperties || [];
    if (props.includes('cellStyle') || props.includes('headerStyle')) return Palette;
    if (props.includes('filter')) return Filter;
    if (props.includes('cellEditor')) return Edit3;
    return Settings;
  };

  // Reset assignments
  const handleReset = () => {
    setAssignments(new Map());
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Columns3 className="h-5 w-5" />
            Bulk Template Application
          </DialogTitle>
          <DialogDescription>
            Apply different templates to multiple columns at once. Select a template for each column or apply one template to all.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 gap-6 min-h-0">
          {/* Left Panel - Templates */}
          <div className="w-1/2 flex flex-col min-h-0">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-4">
                {/* Recent Templates */}
                {recentTemplateList.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Recent</span>
                    </div>
                    <div className="space-y-1">
                      {recentTemplateList.map(template => {
                        const IconComponent = getTemplateIcon(template);
                        return (
                          <div
                            key={template.id}
                            className="flex items-center gap-2 p-2 rounded-md border hover:bg-accent cursor-pointer group"
                            onClick={() => handleApplyToAll(template.id)}
                          >
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 text-sm">{template.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {template.includedProperties.length}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(template.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* User Templates */}
                {userTemplates.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">My Templates</span>
                    </div>
                    <div className="space-y-1">
                      {userTemplates.filter(template => 
                        !searchTerm || 
                        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        template.description?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map(template => {
                        const IconComponent = getTemplateIcon(template);
                        return (
                          <div
                            key={template.id}
                            className="flex items-center gap-2 p-2 rounded-md border hover:bg-accent cursor-pointer group"
                            onClick={() => handleApplyToAll(template.id)}
                          >
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{template.name}</div>
                              {template.description && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {template.description}
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {template.includedProperties.length}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(template.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {filteredTemplates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No templates found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <Separator orientation="vertical" />

          {/* Right Panel - Column Assignments */}
          <div className="w-1/2 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Column Assignments</span>
                <Badge variant="outline">{selectedColumnsInfo.length} columns</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {selectedColumnsInfo.map(column => {
                  const assignedTemplateId = assignments.get(column.id);
                  const assignedTemplate = assignedTemplateId ? templates.find(t => t.id === assignedTemplateId) : null;
                  
                  return (
                    <div key={column.id} className="p-3 border rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{column.name}</span>
                        {assignedTemplate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleTemplateAssignment(column.id, null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      {assignedTemplate ? (
                        <div className="flex items-center gap-2 p-2 bg-accent rounded-sm">
                          <Check 
                            className="h-4 w-4" 
                            style={{ 
                              color: parseColorValue('green', document.documentElement.classList.contains('dark'))
                            }} 
                          />
                          <span className="flex-1 text-sm">{assignedTemplate.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {assignedTemplate.includedProperties.length}
                          </Badge>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground p-2 border border-dashed rounded-sm text-center">
                          Click a template to assign
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            Templates will be applied to selected columns only
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplyAll}
              disabled={assignments.size === 0}
            >
              Apply Templates ({Array.from(assignments.values()).filter(Boolean).length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};