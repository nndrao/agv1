import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings2, Sliders, Type, Database, MoreVertical, User, Save, Plus, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
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
import { GridApi, ColDef as AgColDef } from "ag-grid-community";
import { 
  useProfileStore, 
  useActiveProfile, 
  useProfiles,
  GridProfile 
} from "@/components/datatable/stores/profile.store";
import { useToast } from "@/hooks/use-toast";
import { profileOptimizer } from '@/components/datatable/lib/profileOptimizer';

const monospaceFonts = [
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  { value: 'Fira Code', label: 'Fira Code' },
  { value: 'Source Code Pro', label: 'Source Code Pro' },
  { value: 'IBM Plex Mono', label: 'IBM Plex Mono' },
  { value: 'Roboto Mono', label: 'Roboto Mono' },
  { value: 'Monaco', label: 'Monaco' },
  { value: 'Consolas', label: 'Consolas' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'monospace', label: 'System Monospace' },
];

const fontSizes = [
  { value: '10', label: '10px' },
  { value: '11', label: '11px' },
  { value: '12', label: '12px' },
  { value: '13', label: '13px' },
  { value: '14', label: '14px' },
  { value: '15', label: '15px' },
  { value: '16', label: '16px' },
  { value: '18', label: '18px' },
  { value: '20', label: '20px' },
];

interface DataTableToolbarProps {
  selectedFont?: string;
  selectedFontSize?: string;
  onFontChange: (font: string) => void;
  onFontSizeChange?: (size: string) => void;
  onSpacingChange: (spacing: string) => void;
  onOpenColumnSettings?: () => void;
  onOpenGridOptions?: () => void;
  onOpenDataSource?: () => void;
  gridApi?: GridApi | null;
  onProfileChange?: (profile: GridProfile) => void;
  getColumnDefsWithStyles?: () => AgColDef[];
}

export function DataTableToolbar({ 
  selectedFont = 'monospace',
  selectedFontSize = '13',
  onFontChange,
  onFontSizeChange,
  onOpenColumnSettings,
  onOpenGridOptions,
  onOpenDataSource,
  gridApi,
  onProfileChange,
  getColumnDefsWithStyles 
}: DataTableToolbarProps) {
  const { toast } = useToast();
  const activeProfile = useActiveProfile();
  const profiles = useProfiles();
  const { 
    setActiveProfile, 
    createProfile,
    duplicateProfile, 
    saveColumnCustomizations,
    saveGridState,
    saveGridOptions,
    getColumnDefs
  } = useProfileStore();
  
  // State for profile dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const handleProfileChange = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile || !gridApi) {
      console.warn('[DataTableToolbar] Profile not found or grid not ready:', profileId);
      return;
    }

    try {
      // Update store immediately for optimistic UI
      setActiveProfile(profileId);
      
      // Reset grid to default state before applying new profile
      console.log('[DataTableToolbar] Resetting grid to default state');
      
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
      
      // Notify parent component about profile change
      // This will trigger column def updates and font changes
      if (onProfileChange) {
        onProfileChange(profile);
      }
      
      // Apply grid options
      if (profile.gridOptions) {
        console.log('[DataTableToolbar] Applying grid options');
        Object.entries(profile.gridOptions).forEach(([key, value]) => {
          if (value !== undefined && key !== 'font' && key !== 'fontSize') {
            try {
              gridApi.setGridOption(key as any, value);
            } catch (e) {
              console.warn(`[DataTableToolbar] Failed to set grid option ${key}:`, e);
            }
          }
        });
        
        // Reset row heights if row height was changed
        if (profile.gridOptions.rowHeight) {
          gridApi.resetRowHeights();
        }
      }
      
      // Apply grid state (column state, filters, sorts) with delays
      setTimeout(() => {
        if (profile.gridState) {
          // Apply column state first
          if (profile.gridState.columnState) {
            console.log('[DataTableToolbar] Applying column state');
            gridApi.applyColumnState({
              state: profile.gridState.columnState,
              applyOrder: true
            });
          }
          
          // Apply filters after column state
          setTimeout(() => {
            if (profile.gridState.filterModel) {
              console.log('[DataTableToolbar] Applying filters');
              gridApi.setFilterModel(profile.gridState.filterModel);
            }
            
            // Apply sorting after filters
            setTimeout(() => {
              if (profile.gridState.sortModel) {
                console.log('[DataTableToolbar] Applying sorts');
                gridApi.applyColumnState({
                  state: profile.gridState.sortModel.map(sort => ({
                    colId: sort.colId,
                    sort: sort.sort,
                    sortIndex: sort.sortIndex
                  }))
                });
              }
              
              // Final refresh
              setTimeout(() => {
                console.log('[DataTableToolbar] Final refresh');
                gridApi.refreshHeader();
                gridApi.redrawRows();
                
                toast({
                  title: 'Profile applied',
                  description: `Successfully loaded "${profile.name}" profile`,
                });
              }, 50);
            }, 50);
          }, 50);
        }
      }, 50);
      
    } catch (error) {
      console.error('[DataTableToolbar] Error switching profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!activeProfile || !gridApi || !getColumnDefsWithStyles) {
      toast({
        title: "Cannot save profile",
        description: "No active profile or grid is not ready",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get current column definitions with all customizations
      const columnDefs = getColumnDefsWithStyles();
      
      // Get current grid state
      const columnState = gridApi.getColumnState() || [];
      const filterModel = gridApi.getFilterModel() || {};
      const sortModel = gridApi.getColumnState()
        ?.filter(col => col.sort)
        .map((col, index) => ({
          colId: col.colId,
          sort: col.sort,
          sortIndex: col.sortIndex || index
        })) || [];
      
      // Clean column definitions (remove functions that can't be serialized)
      const cleanedColumnDefs = columnDefs.map(col => {
        const cleaned = { ...col };
        
        // Remove functions and non-serializable properties
        const propsToRemove = [
          'onCellClicked', 'onCellDoubleClicked', 'onCellContextMenu',
          'cellRendererFramework', 'cellEditorFramework', 'filterFramework',
          'floatingFilterComponentFramework', 'headerComponentFramework',
          'headerGroupComponentFramework', 'tooltipComponent',
          'cellRenderer', 'cellEditor', 'comparator', 'equals',
          'filterValueGetter', 'floatingFilterComponent', 'getQuickFilterText',
          'headerComponent', 'headerGroupComponent', 'headerValueGetter',
          'keyCreator', 'pinnedRowCellRenderer', 'suppressKeyboardEvent',
          'tooltip', 'tooltipValueGetter', 'valueGetter', 'valueSetter',
          'editable', 'sortable', 'resizable'
        ];
        
        propsToRemove.forEach(prop => {
          if (typeof cleaned[prop] === 'function') {
            delete cleaned[prop];
          }
        });
        
        // Handle headerStyle
        if (cleaned.headerStyle && typeof cleaned.headerStyle === 'function') {
          try {
            const regularStyle = cleaned.headerStyle({ floatingFilter: false });
            const floatingStyle = cleaned.headerStyle({ floatingFilter: true });
            cleaned.headerStyle = {
              _isHeaderStyleConfig: true,
              regular: regularStyle,
              floating: floatingStyle
            };
          } catch (e) {
            console.error('Error converting headerStyle:', e);
            cleaned.headerStyle = undefined;
          }
        }
        
        // Handle valueFormatter
        if (cleaned.valueFormatter && typeof cleaned.valueFormatter === 'function') {
          const formatterFunc = cleaned.valueFormatter as { __formatString?: string };
          if (formatterFunc.__formatString) {
            cleaned.valueFormatter = {
              _isFormatterConfig: true,
              type: 'excel',
              formatString: formatterFunc.__formatString
            };
          } else {
            delete cleaned.valueFormatter;
          }
        }
        
        return cleaned;
      });
      
      // Save column customizations
      const baseColumns = activeProfile.columnSettings?.baseColumnDefs || columnDefs;
      saveColumnCustomizations(cleanedColumnDefs, baseColumns);
      
      // Save grid state
      saveGridState({
        columnState,
        filterModel,
        sortModel
      });
      
      // Clear optimizer cache for this profile so it gets reprocessed
      profileOptimizer.clearCache(activeProfile.id);
      
      toast({
        title: "Profile saved",
        description: `Current state saved to profile: ${activeProfile.name}`,
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Save failed",
        description: "Failed to save profile",
        variant: "destructive"
      });
    }
  };

  const handleCreateProfile = () => {
    if (!profileName.trim()) return;

    try {
      const newProfile = createProfile(profileName, profileDescription);
      
      // Reset form and close dialog
      setProfileName('');
      setProfileDescription('');
      setShowCreateDialog(false);
      
      // Set as active profile
      setActiveProfile(newProfile.id);
      onProfileChange?.(newProfile);
      
      toast({
        title: "Profile created",
        description: `Profile "${newProfile.name}" has been created and selected.`,
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: "Failed to create profile.",
        variant: "destructive",
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
        title: "Profile duplicated",
        description: `Profile "${newProfile.name}" has been created and selected.`,
      });
    } catch (error) {
      console.error('Error duplicating profile:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate profile.",
        variant: "destructive",
      });
    }
  };

  const openDuplicateDialog = () => {
    setSelectedProfileId(activeProfile?.id || null);
    setProfileName(`Copy of ${activeProfile?.name || 'Profile'}`);
    setShowDuplicateDialog(true);
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b bg-muted/40">
      <div className="flex items-center gap-4">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 gap-2"
              >
                <User className="h-4 w-4" />
                {activeProfile?.name || 'Settings'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Profile</DropdownMenuLabel>
              <div className="px-2 pb-2">
                <Select value={activeProfile?.id} onValueChange={handleProfileChange}>
                  <SelectTrigger className="w-full h-8">
                    <SelectValue placeholder="Select profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="px-2 pb-2 flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                  onClick={handleSaveProfile}
                  disabled={!activeProfile || activeProfile.isDefault}
                  title="Save current state to profile"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setShowCreateDialog(true)}
                  title="Create new profile"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                  onClick={openDuplicateDialog}
                  disabled={!activeProfile}
                  title="Duplicate current profile"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Font Family</DropdownMenuLabel>
              <div className="px-2 pb-2">
                <Select onValueChange={onFontChange} value={selectedFont}>
                  <SelectTrigger className="w-full h-8">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    {monospaceFonts.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <span style={{ fontFamily: font.value }}>{font.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Font Size</DropdownMenuLabel>
              <div className="px-2 pb-2">
                <Select onValueChange={onFontSizeChange} value={selectedFontSize}>
                  <SelectTrigger className="w-full h-8">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontSizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
      </div>
      
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="h-8"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {onOpenDataSource && (
              <DropdownMenuItem onClick={onOpenDataSource}>
                <Database className="mr-2 h-4 w-4" />
                Data Source
              </DropdownMenuItem>
            )}
            {onOpenGridOptions && (
              <DropdownMenuItem onClick={onOpenGridOptions}>
                <Sliders className="mr-2 h-4 w-4" />
                Grid Options
              </DropdownMenuItem>
            )}
            {onOpenColumnSettings && (
              <DropdownMenuItem onClick={onOpenColumnSettings}>
                <Settings2 className="mr-2 h-4 w-4" />
                Customize Columns
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    
    {/* Profile Creation Dialog */}
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Profile</DialogTitle>
          <DialogDescription>
            Create a new profile to save your grid configuration.
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
            <Label htmlFor="source-profile" className="text-right">
              Source
            </Label>
            <Select value={selectedProfileId || ''} onValueChange={setSelectedProfileId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select profile to duplicate" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          <Button 
            variant="outline" 
            onClick={() => {
              setShowDuplicateDialog(false);
              setProfileName('');
              setSelectedProfileId(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleDuplicateProfile} disabled={!profileName.trim() || !selectedProfileId}>
            Duplicate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}