import { useState } from 'react';
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
} from '@/stores/profile.store';
import { GridApi, ColDef, ColumnState } from 'ag-grid-community';

// Interface for style configurations
interface HeaderStyleConfig {
  _isHeaderStyleConfig: boolean;
  regular?: React.CSSProperties;
  floating?: React.CSSProperties;
}

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
    saveCurrentState,
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

  // Function to apply profile states in sequence
  const applyProfileStates = (gridApi: GridApi, gridState: GridProfile['gridState'], profileName: string) => {
    console.log('[ProfileManager] Applying profile states in sequence');
    
    // 1. Apply column state first
    if (gridState.columnState) {
      console.log('[ProfileManager] Applying columnState:', {
        totalColumns: gridState.columnState.length,
        visibleColumns: gridState.columnState.filter((col: ColumnState) => !col.hide).length,
        hiddenColumns: gridState.columnState.filter((col: ColumnState) => col.hide).length,
        columnOrder: gridState.columnState.slice(0, 5).map((col: ColumnState) => col.colId)
      });
      
      gridApi.applyColumnState({
        state: gridState.columnState,
        applyOrder: true
      });
      
      // Verify column state was applied
      const newState = gridApi.getColumnState();
      console.log('[ProfileManager] Column state after apply:', {
        totalColumns: newState.length,
        visibleColumns: newState.filter(col => !col.hide).length,
        hiddenColumns: newState.filter(col => col.hide).length,
        columnOrder: newState.slice(0, 5).map(col => col.colId)
      });
    }
    
    // 2. Apply filters after column state
    setTimeout(() => {
      if (gridState.filterModel) {
        console.log('[ProfileManager] Applying filterModel');
        gridApi.setFilterModel(gridState.filterModel);
      }
      
      // 3. Apply sorting after filters
      setTimeout(() => {
        if (gridState.sortModel) {
          console.log('[ProfileManager] Applying sortModel');
          gridApi.applyColumnState({
            state: gridState.sortModel.map(sort => ({
              colId: sort.colId,
              sort: sort.sort,
              sortIndex: sort.sortIndex
            }))
          });
        }
        
        // 4. Apply grid options if available
        setTimeout(() => {
          if (gridState.gridOptions) {
            console.log('[ProfileManager] Applying grid options:', gridState.gridOptions);
            
            if (gridState.gridOptions.rowHeight) {
              gridApi.resetRowHeights();
              gridApi.setGridOption('rowHeight', gridState.gridOptions.rowHeight);
            }
            
            if (gridState.gridOptions.headerHeight) {
              gridApi.setGridOption('headerHeight', gridState.gridOptions.headerHeight);
            }
            
            if (gridState.gridOptions.floatingFiltersHeight) {
              gridApi.setGridOption('floatingFiltersHeight', gridState.gridOptions.floatingFiltersHeight);
            }
          }
          
          // 5. Final refresh
          setTimeout(() => {
            console.log('[ProfileManager] Final refresh');
            gridApi.refreshCells({ force: true });
            gridApi.refreshHeader();
            gridApi.redrawRows();
            
            // Show success toast
            toast({
              title: 'Profile applied',
              description: `Successfully loaded "${profileName}" profile settings`,
            });
          }, 50);
        }, 50);
      }, 50);
    }, 50);
  };

  const handleProfileChange = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) {
      console.warn('[ProfileManager] Profile not found:', profileId);
      return;
    }

    console.log('[ProfileManager] handleProfileChange:', {
      profileId,
      profileName: profile.name,
      hasGridState: !!profile.gridState,
      columnDefsCount: profile.gridState?.columnDefs?.length,
      columnStateCount: profile.gridState?.columnState?.length,
      hasGridApi: !!gridApi
    });

    // IMPORTANT: Clear all existing grid state before applying new profile
    if (gridApi) {
      console.log('[ProfileManager] Clearing existing grid state before profile switch');
      
      // 1. Clear all filters
      gridApi.setFilterModel(null);
      
      // 2. Clear all sorts
      gridApi.applyColumnState({
        defaultState: { sort: null }
      });
      
      // 3. Reset column state to defaults
      gridApi.resetColumnState();
      
      // 4. Clear any cell selections
      gridApi.deselectAll();
      
      // 5. Reset row heights to default
      gridApi.resetRowHeights();
      
      // 6. Clear any custom cell styles by forcing a full refresh
      gridApi.refreshCells({ force: true });
    }

    setActiveProfile(profileId);
    
    // Apply profile to grid
    if (gridApi) {
      // Always apply profile state, even if it appears empty
      // (The default profile state might have been populated after initialization)
      if (profile.gridState && profile.gridState.columnDefs && profile.gridState.columnDefs.length > 0) {
        // Apply column definitions first (includes all customizations)
        console.log('[ProfileManager] Applying columnDefs:', {
          count: profile.gridState.columnDefs.length,
          firstColumn: profile.gridState.columnDefs[0]?.field,
          hasCustomizations: profile.gridState.columnDefs.some(col => 
            col.cellStyle || col.valueFormatter || col.cellClass
          )
        });
        
        // Process column definitions to ensure they're clean
        const processedColumnDefs = profile.gridState.columnDefs.map(col => {
          const cleanCol = { ...col };
          
          // Convert headerStyle if needed
          if (cleanCol.headerStyle && typeof cleanCol.headerStyle === 'object') {
            const styleConfig = cleanCol.headerStyle as HeaderStyleConfig;
            if (styleConfig._isHeaderStyleConfig) {
              cleanCol.headerStyle = ((params: { floatingFilter?: boolean }) => {
                if (params?.floatingFilter) {
                  return styleConfig.floating || null;
                }
                return styleConfig.regular || null;
              }) as AgColDef['headerStyle'];
            }
          }
          
          return cleanCol;
        });
        
        gridApi.setGridOption('columnDefs', processedColumnDefs);
        
        // Delay to ensure column definitions are fully applied before applying states
        setTimeout(() => {
          // Apply states in sequence with delays
          applyProfileStates(gridApi, profile.gridState, profile.name);
        }, 200); // Longer initial delay for profile switching
      } else {
        // Profile has no saved state - just show default grid
        console.log('[ProfileManager] Profile has no saved state, keeping default grid configuration');
        
        // Refresh grid to ensure it's in a clean state
        gridApi.refreshCells({ force: true });
        gridApi.refreshHeader();
        
        toast({
          title: 'Profile loaded',
          description: `"${profile.name}" profile has no saved settings yet. Save current state to this profile when ready.`,
        });
      }
    }

    onProfileChange?.(profile);
  };

  const handleSaveCurrentState = async () => {
    if (!gridApi || !activeProfile) {
      console.warn('[ProfileManager] Cannot save state:', {
        hasGridApi: !!gridApi,
        hasActiveProfile: !!activeProfile
      });
      return;
    }

    // Try to get column defs with styles from our stored reference first
    const columnDefs = getColumnDefsWithStyles ? getColumnDefsWithStyles() : gridApi.getColumnDefs() || [];
    
    // Debug: Check if headerStyle exists in column definitions
    const columnsWithHeaderStyle = columnDefs.filter(col => col.headerStyle);
    const columnsWithCellStyle = columnDefs.filter(col => col.cellStyle);
    console.log('[ProfileManager] Styles from grid:', {
      usingStoredRef: !!getColumnDefsWithStyles,
      headerStyleCount: columnsWithHeaderStyle.length,
      cellStyleCount: columnsWithCellStyle.length,
      headerStyleSamples: columnsWithHeaderStyle.slice(0, 3).map(col => ({
        field: col.field,
        headerStyleType: typeof col.headerStyle,
        headerStyle: typeof col.headerStyle === 'function' ? 'function' : col.headerStyle
      })),
      cellStyleSamples: columnsWithCellStyle.slice(0, 3).map(col => ({
        field: col.field,
        cellStyleType: typeof col.cellStyle,
        cellStyle: typeof col.cellStyle === 'function' ? 'function' : col.cellStyle
      }))
    });
    
    const columnState = gridApi.getColumnState();
    
    // Log column state details
    console.log('[ProfileManager] Column state details:', {
      totalColumns: columnState.length,
      visibleColumns: columnState.filter(col => !col.hide).length,
      hiddenColumns: columnState.filter(col => col.hide).length,
      pinnedColumns: columnState.filter(col => col.pinned).length,
      sampleState: columnState.slice(0, 3).map(col => ({
        colId: col.colId,
        hide: col.hide,
        width: col.width,
        pinned: col.pinned,
        sort: col.sort,
        sortIndex: col.sortIndex
      }))
    });
    
    const filterModel = gridApi.getFilterModel();
    const sortModel = gridApi.getColumnState()
      .filter(col => col.sort)
      .map((col, index) => ({
        colId: col.colId,
        sort: col.sort!,
        sortIndex: index
      }));

    // Clean up column definitions for serialization
    const cleanedColumnDefs = columnDefs.map(col => {
      const cleaned = { ...col };
      
      // Log what we're saving for each column
      console.log('[ProfileManager] Saving column properties:', {
        field: col.field,
        headerName: col.headerName,
        hasHeaderStyle: !!col.headerStyle,
        hasCellStyle: !!col.cellStyle,
        sortable: col.sortable,
        resizable: col.resizable,
        editable: col.editable,
        filter: col.filter,
        minWidth: col.minWidth,
        maxWidth: col.maxWidth
      });
      
      // Remove invalid properties that AG-Grid doesn't recognize
      delete cleaned.valueFormat;
      delete cleaned._hasFormatter;
      delete cleaned.excelFormat;
      
      // Store headerStyle as a serializable format that includes the logic
      if (cleaned.headerStyle && typeof cleaned.headerStyle === 'function') {
        try {
          // Extract styles for both regular header and floating filter
          const regularStyle = cleaned.headerStyle({ floatingFilter: false });
          const floatingStyle = cleaned.headerStyle({ floatingFilter: true });
          
          // Store as an object that preserves the conditional logic
          cleaned.headerStyle = {
            _isHeaderStyleConfig: true,
            regular: regularStyle,
            floating: floatingStyle
          };
          
          console.log('[ProfileManager] Converted headerStyle for:', col.field, {
            regular: regularStyle,
            floating: floatingStyle
          });
        } catch (e) {
          console.error('[ProfileManager] Error converting headerStyle:', e);
          cleaned.headerStyle = undefined;
        }
      }
      
      // Store valueFormatter metadata if it exists
      if (cleaned.valueFormatter && typeof cleaned.valueFormatter === 'function') {
        // Check if it has format metadata
        const formatterFunc = cleaned.valueFormatter as { __formatString?: string };
        if (formatterFunc.__formatString) {
          cleaned.valueFormatter = {
            _isFormatterConfig: true,
            type: 'excel',
            formatString: formatterFunc.__formatString
          };
          console.log('[ProfileManager] Saved valueFormatter config:', cleaned.valueFormatter);
        } else {
          // Can't serialize custom functions without metadata
          console.warn('[ProfileManager] valueFormatter has no format string metadata, removing');
          delete cleaned.valueFormatter;
        }
      }
      
      return cleaned;
    });

    // Get additional grid options
    const gridOptions = {
      rowHeight: gridApi.getGridOption('rowHeight'),
      headerHeight: gridApi.getGridOption('headerHeight'),
      floatingFiltersHeight: gridApi.getGridOption('floatingFiltersHeight'),
      pagination: gridApi.getGridOption('pagination'),
      paginationPageSize: gridApi.getGridOption('paginationPageSize')
    };
    
    const gridState = {
      columnDefs: cleanedColumnDefs,
      columnState,
      filterModel,
      sortModel,
      gridOptions
    };

    console.log('[ProfileManager] handleSaveCurrentState:', {
      activeProfileId: activeProfile.id,
      activeProfileName: activeProfile.name,
      columnDefsCount: columnDefs.length,
      columnStateCount: columnState.length,
      filterCount: Object.keys(filterModel).length,
      sortCount: sortModel.length,
      hasCustomizations: columnDefs.some(col => 
        col.cellStyle || col.valueFormatter || col.cellClass
      )
    });

    // Set saving state
    setIsSaving(true);
    
    try {
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      saveCurrentState(gridState);
      
      toast({
        title: 'Profile saved',
        description: `Current state saved to profile: ${activeProfile.name}`,
      });
    } catch {
      toast({
        title: 'Save failed',
        description: 'Failed to save profile state',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateProfile = () => {
    if (!profileName.trim()) return;

    console.log('[ProfileManager] Creating new profile:', profileName);

    try {
      const newProfile = createProfile(profileName, profileDescription);
      
      // Reset form and close dialog first
      setProfileName('');
      setProfileDescription('');
      setShowCreateDialog(false);
      
      // Switch to the new profile which will apply the cloned default state
      // Use setTimeout to ensure state updates have propagated
      setTimeout(() => {
        handleProfileChange(newProfile.id);
      }, 100);
      
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
      setActiveProfile(newProfile.id);
      setShowDuplicateDialog(false);
      setProfileName('');
      setSelectedProfileId(null);
      
      toast({
        title: 'Profile duplicated',
        description: `Profile "${newProfile.name}" has been created.`,
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

    deleteProfile(profileId);
    
    toast({
      title: 'Profile deleted',
      description: `Profile "${profile.name}" has been deleted.`,
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
          <Select value={activeProfile?.id || ''} onValueChange={handleProfileChange}>
            <SelectTrigger className="w-[200px] h-8">
              <SelectValue placeholder="Select profile" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.name}
                  {profile.id === 'default' && (
                    <span className="ml-2 text-xs text-muted-foreground">(Default)</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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