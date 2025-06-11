import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FloatingDialog } from '../floatingDialog/FloatingDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Layout, 
  Zap, 
  MousePointer, 
  Database, 
  Copy,
  Settings,
  Save,
  RotateCcw,
  Check,
  GripVertical,
  Rows
} from 'lucide-react';
import { GridOptionsConfig } from './types';
import { useProfileStore } from '../stores/profile.store';
import { GridOptionsPropertyTab } from './tabs/GridOptionsPropertyTab';
import { gridOptionsSections } from './gridOptionsConfig';
import './grid-options-shadcn.css';

interface GridOptionsEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (options: GridOptionsConfig) => void;
  currentOptions?: GridOptionsConfig;
}

export const GridOptionsEditor: React.FC<GridOptionsEditorProps> = ({
  isOpen,
  onClose,
  onApply,
  currentOptions = {}
}) => {
  const { toast } = useToast();
  const activeProfile = useProfileStore(state => state.getActiveProfile());
  const saveGridOptions = useProfileStore(state => state.saveGridOptions);
  
  // Local state for editing
  const [localOptions, setLocalOptions] = useState<GridOptionsConfig>(currentOptions);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('appearance');

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

    console.log('[GridOptionsEditor] Saving grid options:', {
      profileId: activeProfile.id,
      gridOptionsCount: Object.keys(localOptions).length
    });

    // Use the new saveGridOptions method
    saveGridOptions(localOptions);

    toast({
      title: 'Saved to profile',
      description: `Grid options saved to "${activeProfile.name}" profile.`,
      duration: 2000,
    });

    setHasChanges(false);
  }, [activeProfile, localOptions, saveGridOptions, toast]);

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

  // Count changed options per section
  const changedOptionsCount = useMemo(() => {
    const counts: Record<string, number> = {};
    const profileOptions = activeProfile?.gridOptions || {};
    const mergedOriginal = { ...profileOptions, ...currentOptions };
    
    gridOptionsSections.forEach(section => {
      const count = section.options.filter(option => 
        localOptions[option.key] !== mergedOriginal[option.key] &&
        localOptions[option.key] !== undefined
      ).length;
      if (count > 0) {
        counts[section.id] = count;
      }
    });
    
    return counts;
  }, [localOptions, currentOptions, activeProfile]);

  // Tab icons mapping
  const tabIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    appearance: Layout,
    performance: Zap,
    behavior: Settings,
    selection: MousePointer,
    data: Database,
    clipboard: Copy,
    interaction: GripVertical,
    grouping: Rows,
    other: Settings
  };

  return (
    <FloatingDialog
      title="Grid Options Editor"
      isOpen={isOpen}
      onClose={onClose}
      initialSize={{ width: 450, height: 600 }}
      minWidth={400}
      minHeight={400}
      maxWidth={600}
      maxHeight={800}
      className="grid-options-dialog"
      contentClassName="grid-options-content"
    >
      <div className="grid-options-editor">
        {/* Header with actions */}
        <div className="grid-options-header">
          <div className="grid-options-header-info">
            {activeProfile && (
              <Badge variant="secondary" className="grid-options-profile-badge">
                Profile: {activeProfile.name}
              </Badge>
            )}
            {hasChanges && (
              <Badge variant="default" className="grid-options-changes-badge">
                Unsaved changes
              </Badge>
            )}
          </div>
          <div className="grid-options-header-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveToProfile}
              disabled={!hasChanges || !activeProfile}
            >
              <Save className="h-4 w-4 mr-1" />
              Save to Profile
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleApply}
              disabled={!hasChanges}
            >
              <Check className="h-4 w-4 mr-1" />
              Apply
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="grid-options-tabs">
          <TabsList className="grid-options-tabs-list">
            {gridOptionsSections.map(section => {
              const Icon = tabIcons[section.id] || Settings;
              const changeCount = changedOptionsCount[section.id];
              
              return (
                <TabsTrigger 
                  key={section.id} 
                  value={section.id}
                  className="grid-options-tab-trigger"
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {section.title}
                  {changeCount && (
                    <Badge 
                      variant="secondary" 
                      className="ml-1 grid-options-tab-badge"
                    >
                      {changeCount}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {gridOptionsSections.map(section => (
            <TabsContent 
              key={section.id} 
              value={section.id}
              className="grid-options-tab-content"
            >
              <GridOptionsPropertyTab
                section={section}
                options={localOptions}
                onChange={handleOptionChange}
                profileOptions={activeProfile?.gridOptions || {}}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </FloatingDialog>
  );
};