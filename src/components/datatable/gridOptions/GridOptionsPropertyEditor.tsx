import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './components/DraggableDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Save,
  RotateCcw,
  Check,
  Search,
  Grid3x3,
  SortAsc,
  X
} from 'lucide-react';
import { GridOptionsConfig } from './types';
import { useProfileStore } from '../stores/profile.store';
import { GridOptionsPropertyGrid } from './components/GridOptionsPropertyGrid';
import { gridOptionsSections } from './gridOptionsConfig';
import './grid-options-shadcn.css';

interface GridOptionsPropertyEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (options: GridOptionsConfig) => void;
  currentOptions?: GridOptionsConfig;
}

export const GridOptionsPropertyEditor: React.FC<GridOptionsPropertyEditorProps> = ({
  isOpen,
  onClose,
  onApply,
  currentOptions = {}
}) => {
  const { toast } = useToast();
  const activeProfile = useProfileStore(state => state.getActiveProfile());
  const updateProfile = useProfileStore(state => state.updateProfile);
  
  // Local state for editing
  const [localOptions, setLocalOptions] = useState<GridOptionsConfig>(currentOptions);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'categorized' | 'alphabetical'>('categorized');

  // Initialize local options when dialog opens or currentOptions change
  useEffect(() => {
    if (isOpen) {
      const profileOptions = activeProfile?.gridOptions || {};
      setLocalOptions({ ...profileOptions, ...currentOptions });
      setHasChanges(false);
    }
  }, [isOpen, currentOptions, activeProfile]);

  // Track changes
  useEffect(() => {
    const profileOptions = activeProfile?.gridOptions || {};
    const mergedOriginal = { ...profileOptions, ...currentOptions };
    const hasAnyChanges = Object.keys(localOptions).some(
      key => localOptions[key as keyof GridOptionsConfig] !== mergedOriginal[key as keyof GridOptionsConfig]
    );
    setHasChanges(hasAnyChanges);
  }, [localOptions, currentOptions, activeProfile]);

  // Handle option change
  const handleOptionChange = useCallback((key: keyof GridOptionsConfig, value: any) => {
    setLocalOptions(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Handle apply
  const handleApply = useCallback(() => {
    onApply(localOptions);
    setHasChanges(false);
    
    toast({
      title: 'Grid options applied',
      description: 'Your changes have been applied to the grid.',
      duration: 2000,
    });
  }, [localOptions, onApply, toast]);

  // Handle save to profile
  const handleSaveToProfile = useCallback(() => {
    if (!activeProfile) {
      toast({
        title: 'No active profile',
        description: 'Please select a profile to save grid options.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    // Get fresh profile state to ensure we don't overwrite columnCustomizations
    const currentProfile = useProfileStore.getState().getActiveProfile();
    if (!currentProfile) {
      toast({
        title: 'Profile not found',
        description: 'Could not find the active profile.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    console.log('[GridOptionsPropertyEditor] Saving grid options:', {
      profileId: currentProfile.id,
      hasColumnCustomizations: !!currentProfile.columnSettings?.columnCustomizations,
      customizationsCount: Object.keys(currentProfile.columnSettings?.columnCustomizations || {}).length,
      gridOptionsCount: Object.keys(localOptions).length
    });

    updateProfile(currentProfile.id, {
      gridOptions: localOptions
    });

    toast({
      title: 'Saved to profile',
      description: `Grid options saved to "${currentProfile.name}" profile.`,
      duration: 2000,
    });

    setHasChanges(false);
  }, [activeProfile, localOptions, updateProfile, toast]);

  // Handle reset
  const handleReset = useCallback(() => {
    const profileOptions = activeProfile?.gridOptions || {};
    setLocalOptions({ ...profileOptions, ...currentOptions });
    setHasChanges(false);
    
    toast({
      title: 'Options reset',
      description: 'Grid options have been reset to their original values.',
      duration: 2000,
    });
  }, [activeProfile, currentOptions, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] h-[600px] p-0 gap-0 flex flex-col grid-options-dialog">
        <DialogHeader className="px-4 py-3 pb-0">
          <DialogTitle className="text-base">Grid Options</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Search Bar */}
          <div className="flex items-center gap-1 px-2 py-2 bg-muted/30">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode(viewMode === 'categorized' ? 'alphabetical' : 'categorized')}
              title={viewMode === 'categorized' ? 'Sort alphabetically' : 'Sort by category'}
            >
              {viewMode === 'categorized' ? <SortAsc className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 pr-8 text-xs"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-8 w-8"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Property Grid */}
          <ScrollArea className="flex-1 grid-options-scroll-area">
            <div className="grid-options-property-grid">
              <GridOptionsPropertyGrid
                sections={gridOptionsSections}
                options={localOptions}
                onChange={handleOptionChange}
                profileOptions={activeProfile?.gridOptions || {}}
                searchTerm={searchTerm}
                viewMode={viewMode}
              />
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Footer */}
        <DialogFooter className="px-4 py-3">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              {activeProfile && (
                <Badge variant="secondary" className="text-xs">
                  {activeProfile.name}
                </Badge>
              )}
              {hasChanges && (
                <Badge variant="default" className="text-xs">
                  Modified
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveToProfile}
                disabled={!hasChanges || !activeProfile}
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                Save
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleApply}
                disabled={!hasChanges}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Apply
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};