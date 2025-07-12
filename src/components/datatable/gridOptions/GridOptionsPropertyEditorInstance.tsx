import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  RotateCcw, 
  Settings,
  Layout,
  Filter,
  Columns,
  Eye,
  Database,
  ArrowUpDown,
  Search,
  X
} from 'lucide-react';
import { GridOptionsConfig } from './types';
import { useInstanceProfile } from '../ProfileStoreProvider';
import { GridOptionsPropertyGrid } from './components/GridOptionsPropertyGrid';
import { gridOptionsSections } from './gridOptionsConfig';

interface GridOptionsPropertyEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (options: GridOptionsConfig) => void;
  currentOptions?: Partial<GridOptionsConfig>;
}

export const GridOptionsPropertyEditorInstance: React.FC<GridOptionsPropertyEditorProps> = ({
  isOpen,
  onClose,
  onApply,
  currentOptions = {}
}) => {
  const { toast } = useToast();
  const getActiveProfile = useInstanceProfile(state => state.getActiveProfile);
  const updateProfile = useInstanceProfile(state => state.updateProfile);
  
  // Local state for editing
  const [localOptions, setLocalOptions] = useState<GridOptionsConfig>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('display');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Initialize options when dialog opens
  useEffect(() => {
    if (isOpen) {
      const activeProfile = getActiveProfile();
      const profileOptions = activeProfile?.gridOptions || {};
      
      // Merge current options with profile options
      const mergedOptions = {
        ...profileOptions,
        ...currentOptions
      };
      
      setLocalOptions(mergedOptions);
      setHasChanges(false);
      
      // Expand all sections by default
      const allSections = new Set<string>();
      Object.values(gridOptionsSections).forEach(sections => {
        if (Array.isArray(sections)) {
          sections.forEach(section => allSections.add(section.id));
        }
      });
      setExpandedSections(allSections);
    }
  }, [isOpen, currentOptions, getActiveProfile]);

  // Handle option changes
  const handleOptionChange = useCallback((key: string, value: any) => {
    console.log(`[GridOptionsPropertyEditorInstance] Option changed: ${key} =`, value);
    setLocalOptions(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  }, []);

  // Handle apply
  const handleApply = useCallback(() => {
    console.log('[GridOptionsPropertyEditorInstance] Applying options:', localOptions);
    
    // Apply the options through the callback
    onApply(localOptions);
    
    setHasChanges(false);
    
    toast({
      title: "Grid options applied",
      description: "Your changes have been applied to the grid",
    });
  }, [localOptions, onApply, toast]);

  // Handle save to profile
  const handleSaveToProfile = useCallback(() => {
    const activeProfile = getActiveProfile();
    if (!activeProfile) {
      toast({
        title: "No active profile",
        description: "Please select a profile first",
        variant: "destructive",
      });
      return;
    }
    
    // Update the profile with new grid options
    updateProfile(activeProfile.id, {
      gridOptions: localOptions
    });
    
    toast({
      title: "Saved to profile",
      description: `Grid options saved to "${activeProfile.name}"`,
    });
    
    setHasChanges(false);
  }, [localOptions, toast, getActiveProfile, updateProfile]);

  // Handle reset
  const handleReset = useCallback(() => {
    const activeProfile = getActiveProfile();
    const profileOptions = activeProfile?.gridOptions || {};
    
    setLocalOptions(profileOptions);
    setHasChanges(false);
    
    toast({
      title: "Options reset",
      description: "Grid options reset to profile defaults",
    });
  }, [toast, getActiveProfile]);

  // Toggle section expansion
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Get icon for tab
  const getTabIcon = (tabId: string) => {
    switch (tabId) {
      case 'display': return <Layout className="h-4 w-4" />;
      case 'columns': return <Columns className="h-4 w-4" />;
      case 'rows': return <Database className="h-4 w-4" />;
      case 'interaction': return <ArrowUpDown className="h-4 w-4" />;
      case 'filtering': return <Filter className="h-4 w-4" />;
      case 'appearance': return <Eye className="h-4 w-4" />;
      case 'advanced': return <Settings className="h-4 w-4" />;
      default: return null;
    }
  };

  // Filter sections based on search
  const getFilteredSections = (tabSections: typeof gridOptionsSections[keyof typeof gridOptionsSections]) => {
    if (!searchTerm || !Array.isArray(tabSections)) return tabSections as any[];
    
    return tabSections.map((section: any) => ({
      ...section,
      properties: section.properties.filter((prop: any) =>
        prop.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(section => section.properties.length > 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Grid Options Editor
            </DialogTitle>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  • Unsaved changes
                </span>
              )}
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search options..."
              className="pl-9 pr-9"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid grid-cols-7 w-full rounded-none border-b h-auto p-0">
              {Object.keys(gridOptionsSections).map((tabId) => (
                <TabsTrigger
                  key={tabId}
                  value={tabId}
                  className="rounded-none border-r last:border-r-0 data-[state=active]:bg-muted"
                >
                  <div className="flex items-center gap-2 py-2">
                    {getTabIcon(tabId)}
                    <span className="capitalize">{tabId}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(gridOptionsSections).map(([tabId, sections]) => {
              const filteredSections = Array.isArray(sections) ? getFilteredSections(sections) : [];
              return (
                <TabsContent
                  key={tabId}
                  value={tabId}
                  className="flex-1 m-0 overflow-hidden"
                >
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-6">
                      {filteredSections.map((section: any) => (
                        <GridOptionsPropertyGrid
                          key={section.id}
                          sections={[section]}
                          options={localOptions}
                          onOptionChange={handleOptionChange}
                          isExpanded={expandedSections.has(section.id)}
                          onToggleExpanded={() => toggleSection(section.id)}
                        />
                      ))}
                      
                      {filteredSections.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No options found matching "{searchTerm}"
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveToProfile}
                disabled={!hasChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                Save to Profile
              </Button>
              <Button
                onClick={handleApply}
                disabled={!hasChanges}
              >
                Apply Changes
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

GridOptionsPropertyEditorInstance.displayName = 'GridOptionsPropertyEditorInstance';