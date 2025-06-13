import { useState, useEffect, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Copy, 
  Download, 
  Upload,
  User,
  Loader2
} from 'lucide-react';
import { 
  useProfileStore, 
  useActiveProfile, 
  useProfiles,
  GridProfile 
} from '@/components/datatable/stores/profile.store';
import { GridApi, ColDef } from 'ag-grid-community';
import { profileOptimizer } from '@/components/datatable/lib/profileOptimizer';
import { useAgGridStateManager } from '../../../ag-grid-state-functions';

interface ProfileManagerProps {
  gridApi: GridApi | null;
  onProfileChange?: (profile: GridProfile) => void;
  getColumnDefsWithStyles?: () => ColDef[];
}

export function ProfileManager({ gridApi, onProfileChange, getColumnDefsWithStyles }: ProfileManagerProps) {
  const { toast } = useToast();
  const profiles = useProfiles();
  const activeProfile = useActiveProfile();
  const {
    setActiveProfile,
    createProfile,
    deleteProfile,
    duplicateProfile,
    saveColumnCustomizations,
    getColumnDefs,
    autoSave,
    setAutoSave,
    exportProfile,
    importProfile
  } = useProfileStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const previousProfileRef = useRef<GridProfile | null>(null);
  useAgGridStateManager(gridApi); // Not using extractState or applyState directly

  // Preload profiles on mount
  useEffect(() => {
    if (profiles.length > 0) {
      profileOptimizer.preloadAllProfiles(profiles);
    }
  }, [profiles]);

  // Preprocess new profiles
  useEffect(() => {
    profiles.forEach(profile => {
      profileOptimizer.preprocessProfile(profile);
    });
  }, [profiles]);

  // Function to apply profile states in sequence
  const _applyProfileStates = (gridApi: GridApi, profile: GridProfile) => {
    console.log('[ProfileManager] Applying profile states in correct order:', {
      profileName: profile.name,
      hasGridOptions: !!profile.gridOptions,
      hasColumnSettings: !!profile.columnSettings,
      hasGridState: !!profile.gridState
    });
    
    // 1. Apply grid options first (row height, header height, etc)
    if (profile.gridOptions) {
      console.log('[ProfileManager] Step 1: Applying grid options');
      Object.entries(profile.gridOptions).forEach(([key, value]) => {
        if (value !== undefined && key !== 'font') {
          try {
            gridApi.setGridOption(key as any, value);
          } catch (e) {
            console.warn(`[ProfileManager] Failed to set grid option ${key}:`, e);
          }
        }
      });
      
      // Reset row heights if row height was changed
      if (profile.gridOptions.rowHeight) {
        gridApi.resetRowHeights();
      }
    }
    
    // 2. Apply column settings (styles, formatters) - this is done via column definitions
    // Column definitions are already applied before this function is called
    
    // 3. Apply grid state (column state, filters, sorts)
    setTimeout(() => {
      if (profile.gridState) {
        // Apply column state first
        if (profile.gridState.columnState) {
          console.log('[ProfileManager] Step 3a: Applying column state');
          gridApi.applyColumnState({
            state: profile.gridState?.columnState,
            applyOrder: true
          });
        }
        
        // Apply filters after column state
        setTimeout(() => {
          if (profile.gridState?.filterModel) {
            console.log('[ProfileManager] Step 3b: Applying filters');
            gridApi.setFilterModel(profile.gridState.filterModel);
          }
          
          // Apply sorting after filters
          setTimeout(() => {
            if (profile.gridState?.sortModel) {
              console.log('[ProfileManager] Step 3c: Applying sorts');
              gridApi.applyColumnState({
                state: profile.gridState.sortModel.map(sort => ({
                  colId: sort.colId,
                  sort: sort.sort
                })),
                defaultState: { sort: null }
              });
            }
            
            // Final refresh
            setTimeout(() => {
              console.log('[ProfileManager] Step 4: Final refresh');
              gridApi.refreshHeader();
              gridApi.redrawRows();
              
              // Show success toast
              toast({
                title: 'Profile applied',
                description: `Successfully loaded "${profile.name}" profile settings`,
              });
            }, 50);
          }, 50);
        }, 50);
      }
    }, 50);
  };

  const handleProfileChange = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) {
      console.warn('[ProfileManager] Profile not found:', profileId);
      return;
    }

    console.log('[ProfileManager] handleProfileChange:', {
      profileId,
      profileName: profile.name,
      hasGridState: !!profile.gridState,
      hasGridApi: !!gridApi
    });

    // Prevent double-switching
    if (isSwitching) {
      // console.log('[ProfileManager] Already switching profiles, ignoring');
      return;
    }

    setIsSwitching(true);
    const startTime = performance.now();

    try {
      // Update store immediately for optimistic UI
      setActiveProfile(profileId);
      
      if (gridApi) {
        // SIMPLIFIED DETERMINISTIC PROFILE APPLICATION
        console.log('[ProfileManager] Switching to profile:', profile.name);
        
        // RESET GRID TO DEFAULT STATE BEFORE APPLYING NEW PROFILE
        console.log('[ProfileManager] Resetting grid to default state');
        
        // 1. Clear all filters
        gridApi.setFilterModel(null);
        
        // 2. Clear all sorts
        gridApi.applyColumnState({
          defaultState: { sort: null }
        });
        
        // 3. Reset column widths and visibility
        gridApi.resetColumnState();
        
        // 4. Reset row heights to default
        gridApi.resetRowHeights();
        
        // 5. Reset grid options to defaults
        gridApi.setGridOption('rowHeight', undefined);
        gridApi.setGridOption('headerHeight', undefined);
        gridApi.setGridOption('floatingFiltersHeight', undefined);
        
        // Small delay to ensure reset is complete
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Get column definitions for this profile
        const profileColumnDefs = getColumnDefs(profileId);
        
        // Notify parent component about profile change
        if (onProfileChange) {
          onProfileChange(profile);
        }
        
        if (profileColumnDefs && profileColumnDefs.length > 0) {
          // Update column definitions directly in the grid
          console.log('[ProfileManager] Updating column definitions');
          gridApi.setGridOption('columnDefs', profileColumnDefs);
          
          // Small delay to ensure column definitions are processed
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Apply profile states in the correct order
        _applyProfileStates(gridApi, profile);
        
        // Apply font through parent callback
        if (profile.gridOptions?.font) {
          console.log('[ProfileManager] Font will be applied through parent callback:', profile.gridOptions.font);
          // Font will be applied through the parent component's onProfileChange callback
          // The parent component (DataTableContainer) handles font changes via useProfileSync
        }
        
        if (!profileColumnDefs || profileColumnDefs.length === 0) {
          toast({
            title: 'Profile loaded',
            description: `"${profile.name}" profile has no saved settings yet. Save current state to this profile when ready.`,
          });
        } else {
          const switchTime = performance.now() - startTime;
          // console.log(`[ProfileManager] Profile switch completed in ${switchTime.toFixed(0)}ms`);
          
          // Only show toast if switch took longer than 100ms
          if (switchTime > 100) {
            toast({
              title: 'Profile applied',
              description: `Successfully loaded "${profile.name}" profile`,
            });
          }
        }
      }

      // Update previous profile reference
      previousProfileRef.current = profile;
      
    } catch (error) {
      console.error('[ProfileManager] Error switching profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSaveCurrentState = async () => {
    setIsSaving(true);
    
    try {
      if (!gridApi || !activeProfile) {
        toast({
          title: 'Save failed',
          description: 'Grid not initialized or no active profile',
          variant: 'destructive',
        });
        return;
      }
  
      // Get current column definitions
      const columnDefs = getColumnDefsWithStyles ? getColumnDefsWithStyles() : (gridApi.getColumnDefs() || []);
      // Extract current grid state using the already imported hook
      const stateManager = useAgGridStateManager(gridApi);
      const extractedState = stateManager.extractState({});
      if (!extractedState) {
        toast({
          title: 'Save failed',
          description: 'Failed to extract grid state',
          variant: 'destructive',
        });
        return;
      }
      const columnState = extractedState.columnState;
      const filterModel = extractedState.filterModel || {};
      const sortModel = extractedState.sortModel || [];

      // Clean up column definitions for serialization
      const cleanedColumnDefs = columnDefs.map(col => {
        const cleaned = { ...col };
        // Remove state properties that should NEVER be in column definitions
        // These are managed by AG-Grid's column state
        const stateProperties = [
          'width', 'actualWidth', 'hide', 'pinned', 'sort', 'sortIndex',
          'flex', 'rowGroup', 'rowGroupIndex', 'pivot', 'pivotIndex',
          'aggFunc', 'moving', 'menuTabs', 'columnsMenuParams'
        ];
        stateProperties.forEach(prop => {
          if (prop in cleaned) {
            console.log(`[ProfileManager] Removing state property '${prop}' from column:`, (col as any).field || (col as any).colId);
            delete (cleaned as any)[prop];
          }
        });
        
        if ('valueFormat' in cleaned) delete cleaned.valueFormat;
        if ('_hasFormatter' in cleaned) delete cleaned._hasFormatter;
        if ('excelFormat' in cleaned) delete cleaned.excelFormat;
        if ('headerStyle' in cleaned && typeof cleaned.headerStyle === 'function') {
          try {
            const regularStyle = cleaned.headerStyle({ floatingFilter: false } as any);
            const floatingStyle = cleaned.headerStyle({ floatingFilter: true } as any);
            // Store the metadata in a separate property for serialization
            (cleaned as any).headerStyleConfig = {
              regular: regularStyle,
              floating: floatingStyle
            };
            // Remove the function to avoid type errors
            delete cleaned.headerStyle;
          } catch (e) {
            delete cleaned.headerStyle;
          }
        }
        if ('valueFormatter' in cleaned && typeof cleaned.valueFormatter === 'function') {
          const formatterFunc = cleaned.valueFormatter as { __formatString?: string };
          if (formatterFunc.__formatString) {
            (cleaned as any).valueFormatterConfig = {
              type: 'excel',
              formatString: formatterFunc.__formatString
            };
          }
          // Remove the function to avoid type errors
          delete cleaned.valueFormatter;
        }
        return cleaned;
      });

      // Save column customizations using the lightweight format
      const baseColumns = activeProfile?.columnSettings?.baseColumnDefs || columnDefs;
      saveColumnCustomizations(cleanedColumnDefs, baseColumns);

      // Save grid state separately
      const { saveGridState } = useProfileStore.getState();
      saveGridState({ columnState, filterModel, sortModel });

      // Clear optimizer cache for this profile so it gets reprocessed
      profileOptimizer.clearCache(activeProfile.id);
      toast({
        title: 'Profile saved',
        description: `Current state saved to profile: ${activeProfile.name}`,
      });
    } catch (error) {
      console.error('[ProfileManager] Error saving profile state:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile state.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateProfile = async () => {
    try {
      const newProfile = createProfile(profileName, profileDescription);
      
      // Reset form and close dialog first
      setProfileName('');
      setProfileDescription('');
      setShowCreateDialog(false);
      
      // Immediately set the new profile as active in the store
      setActiveProfile(newProfile.id);
      
      // Apply the new profile's settings to the grid
      // Use setTimeout to ensure state updates have propagated
      setTimeout(() => {
        handleProfileChange(newProfile.id);
      }, 100);
      
      toast({
        title: 'Profile created',
        description: `Profile "${newProfile.name}" has been created and selected.`,
      });
    } catch (error) {
      console.error('[ProfileManager] Error creating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to create profile.',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateProfile = () => {
    if (!profileName.trim() || !selectedProfileId) return;

    try {
      const newProfile = duplicateProfile(selectedProfileId, profileName);
      
      // Immediately set the new profile as active
      setActiveProfile(newProfile.id);
      
      // Apply the new profile's settings to the grid
      setTimeout(() => {
        handleProfileChange(newProfile.id);
      }, 100);
      
      setShowDuplicateDialog(false);
      setProfileName('');
      setSelectedProfileId(null);
      
      toast({
        title: 'Profile duplicated',
        description: `Profile "${newProfile.name}" has been created and selected.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to duplicate profile.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile || profile.id === 'default') return;

    // Check if we're deleting the currently active profile
    const isDeletingActiveProfile = profileId === activeProfile?.id;
    
    // Delete the profile (this will automatically switch to default if it was active)
    deleteProfile(profileId);
    
    // If we deleted the active profile, apply the default profile settings to the grid
    if (isDeletingActiveProfile && gridApi) {
      const defaultProfile = profiles.find(p => p.id === 'default-profile');
      if (defaultProfile) {
        console.log('[ProfileManager] Applying default profile settings after deletion');
        setTimeout(() => {
          handleProfileChange('default-profile');
        }, 100);
      }
    }
    
    toast({
      title: 'Profile deleted',
      description: `Profile "${profile.name}" has been deleted.${isDeletingActiveProfile ? ' Default profile is now active.' : ''}`,
    });
  };

  const handleExportProfile = (profileId: string) => {
    const profile = exportProfile(profileId);
    if (!profile) return;

    const dataStr = JSON.stringify(profile, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `ag-grid-profile-${profile.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: 'Profile exported',
      description: `Profile "${profile.name}" has been exported.`,
    });
  };

  const handleImportProfile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const profile = JSON.parse(e.target?.result as string) as GridProfile;
        importProfile(profile);
        
        toast({
          title: 'Profile imported',
          description: `Profile "${profile.name}" has been imported.`,
        });
      } catch {
        toast({
          title: 'Import failed',
          description: 'Invalid profile file format.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="relative">
            <Select 
              value={activeProfile?.id || ''} 
              onValueChange={handleProfileChange}
              disabled={isSwitching}
            >
              <SelectTrigger className="w-[200px] h-8">
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                    {profile.id === 'default-profile' && (
                      <span className="ml-2 text-xs text-muted-foreground">(Default)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isSwitching && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveCurrentState}
          disabled={!activeProfile || activeProfile.id === 'default' || isSaving}
          className={`h-8 relative transition-all flex items-center gap-2 ${isSaving ? 'saving-button' : ''}`}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              <span className="text-xs">Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs">Save</span>
            </>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-2">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                setSelectedProfileId(activeProfile?.id || null);
                setShowDuplicateDialog(true);
              }}
              disabled={!activeProfile}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate Current
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => activeProfile && handleExportProfile(activeProfile.id)}
              disabled={!activeProfile}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Profile
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <label className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Import Profile
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportProfile}
                  className="hidden"
                />
              </label>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => activeProfile && handleDeleteProfile(activeProfile.id)}
              disabled={!activeProfile || activeProfile.id === 'default'}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-save" className="text-sm">Auto-save</Label>
                <Switch
                  id="auto-save"
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                  className="ml-2"
                />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create Profile Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Profile</DialogTitle>
            <DialogDescription>
              Create a new profile based on the Default profile settings. You can customize and save your changes after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="col-span-3"
                placeholder="My Profile"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={profileDescription}
                onChange={(e) => setProfileDescription(e.target.value)}
                className="col-span-3"
                placeholder="Optional description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false);
                setProfileName('');
                setProfileDescription('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProfile} disabled={!profileName.trim()}>
              Create Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Profile Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Profile</DialogTitle>
            <DialogDescription>
              Create a copy of the selected profile.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duplicate-name" className="text-right">
                Name
              </Label>
              <Input
                id="duplicate-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="col-span-3"
                placeholder="Copy of..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDuplicateProfile} disabled={!profileName.trim()}>
              Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}