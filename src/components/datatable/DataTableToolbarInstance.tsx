import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings2, MoreVertical, User, Save, Plus, Copy, Database, RefreshCw, Power, PlayCircle, Pause, BarChart3, Columns, Sun, Moon, Menu, Type } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { GridProfile } from "@/stores/profile.store";
import { useInstanceProfile } from './ProfileStoreProvider';
import { useToast } from "@/hooks/use-toast";
import { profileOptimizer } from '@/components/datatable/lib/profileOptimizer';
import { useDatasourceStore } from '@/stores/datasource.store';
import { useTheme } from '@/components/datatable/ThemeProvider';
import { DraggableStatisticsDialog } from './DraggableStatisticsDialog';

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
  onOpenDataSourceDialog?: () => void;
  gridApi?: GridApi | null;
  onProfileChange?: (profile: GridProfile) => void;
  getColumnDefsWithStyles?: () => AgColDef[];
  instanceId: string;
  selectedDatasourceId?: string;
  onDatasourceChange?: (datasourceId: string | undefined) => void;
  updatesEnabled?: boolean;
  onToggleUpdates?: () => void;
  // Additional props for simplified version
  isConnected?: boolean;
  onRestart?: () => void;
}

export function DataTableToolbarInstance({ 
  selectedFont = 'monospace',
  selectedFontSize = '13',
  onFontChange,
  onFontSizeChange,
  onOpenColumnSettings,
  onOpenGridOptions,
  // onOpenDataSourceDialog,
  gridApi,
  onProfileChange,
  getColumnDefsWithStyles,
  instanceId: _instanceId,
  selectedDatasourceId,
  onDatasourceChange,
  updatesEnabled = false,
  onToggleUpdates,
  isConnected,
  onRestart
}: DataTableToolbarProps) {
  const { toast } = useToast();
  
  // Use instance-specific profile hooks
  const profiles = useInstanceProfile((state) => state.profiles);
  const activeProfileId = useInstanceProfile((state) => state.activeProfileId);
  const activeProfile = useInstanceProfile((state) => state.getActiveProfile());
  const setActiveProfile = useInstanceProfile((state) => state.setActiveProfile);
  const createProfile = useInstanceProfile((state) => state.createProfile);
  const duplicateProfile = useInstanceProfile((state) => state.duplicateProfile);
  const saveColumnCustomizations = useInstanceProfile((state) => state.saveColumnCustomizations);
  const saveGridState = useInstanceProfile((state) => state.saveGridState);
  
  // Datasource hooks
  const { datasources, getDatasource } = useDatasourceStore();
  
  // Theme hook
  const { theme, setTheme } = useTheme();
  
  // For simplified version, these will be undefined
  let activateDatasource: any;
  let deactivateDatasource: any;
  let refreshDatasource: any;
  let connectionStatus: Map<string, any> = new Map();
  let activeDatasources = new Map();
  
  // Try to use context if available (for backward compatibility)
  try {
    const context = require('@/contexts/DatasourceContext').useDatasourceContext();
    activateDatasource = context.activateDatasource;
    deactivateDatasource = context.deactivateDatasource;
    refreshDatasource = context.refreshDatasource;
    connectionStatus = context.connectionStatus;
    activeDatasources = context.activeDatasources;
  } catch (e) {
    // Context not available, using simplified version
  }
  
  // State for profile dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  // State for statistics dialog
  const [showStatisticsDialog, setShowStatisticsDialog] = useState(false);

  const handleProfileChange = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile || !gridApi) {
      console.warn('[DataTableToolbarInstance] Profile not found or grid not ready:', profileId);
      return;
    }

    try {
      // Update store immediately for optimistic UI
      setActiveProfile(profileId);
      
      // Reset grid to default state before applying new profile
      console.log('[DataTableToolbarInstance] Resetting grid to default state');
      
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
      
      // Small delay to let parent apply column changes
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Apply profile using the correct method signature
      console.log('[DataTableToolbarInstance] Applying profile state with optimizer');
      await profileOptimizer.applyProfile(
        gridApi,
        profile,
        null,
        { showTransition: false }
      );
      
      toast({
        title: "Profile applied",
        description: `Switched to "${profile.name}"`,
      });
      
    } catch (error) {
      console.error('[DataTableToolbarInstance] Error applying profile:', error);
      toast({
        title: "Error applying profile",
        description: "Failed to apply the selected profile",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!gridApi) {
      console.warn('[DataTableToolbarInstance] Grid API not available');
      return;
    }

    try {
      console.log('[DataTableToolbarInstance] Starting profile save process');
      
      // Get column definitions with styles
      const columnDefs = getColumnDefsWithStyles ? getColumnDefsWithStyles() : [];
      
      if (columnDefs.length > 0) {
        console.log('[DataTableToolbarInstance] Saving column customizations:', {
          columnCount: columnDefs.length,
          firstColumn: columnDefs[0]?.field,
          hasFormatters: columnDefs.some(col => col.valueFormatter),
          hasStyles: columnDefs.some(col => col.cellStyle)
        });
        
        // Save column customizations
        saveColumnCustomizations(columnDefs, columnDefs);
      }
      
      // Get grid state directly from AG-Grid API
      const columnState = gridApi.getColumnState() || [];
      const filterModel = gridApi.getFilterModel() || {};
      const sortModel = gridApi.getColumnDefs()?.reduce((acc: any[], col: any) => {
        if (col.sort) {
          acc.push({ colId: col.field, sort: col.sort, sortIndex: col.sortIndex || 0 });
        }
        return acc;
      }, []) || [];
      
      console.log('[DataTableToolbarInstance] Extracted grid state:', {
        hasColumnState: !!columnState,
        columnStateCount: columnState?.length,
        hasFilterModel: !!filterModel,
        filterCount: Object.keys(filterModel || {}).length,
        hasSortModel: !!sortModel,
        sortCount: sortModel?.length
      });
      
      // Save grid state (column state, filters, sorts)
      saveGridState({
        columnState,
        filterModel,
        sortModel
      });
      
      toast({
        title: "Profile saved",
        description: `"${activeProfile?.name || 'Profile'}" has been updated`,
      });
      
    } catch (error) {
      console.error('[DataTableToolbarInstance] Error saving profile:', error);
      toast({
        title: "Error saving profile",
        description: "Failed to save the current configuration",
        variant: "destructive",
      });
    }
  };

  const handleCreateProfile = () => {
    const newProfile = createProfile(profileName, profileDescription);
    setShowCreateDialog(false);
    setProfileName('');
    setProfileDescription('');
    
    // Switch to the new profile
    handleProfileChange(newProfile.id);
    
    toast({
      title: "Profile created",
      description: `"${newProfile.name}" has been created`,
    });
  };

  const handleDuplicateProfile = () => {
    if (!selectedProfileId) return;
    
    const duplicated = duplicateProfile(selectedProfileId, profileName);
    setShowDuplicateDialog(false);
    setProfileName('');
    setSelectedProfileId(null);
    
    // Switch to the duplicated profile
    handleProfileChange(duplicated.id);
    
    toast({
      title: "Profile duplicated",
      description: `"${duplicated.name}" has been created`,
    });
  };
  
  // Get current datasource
  const currentDatasource = selectedDatasourceId ? getDatasource(selectedDatasourceId) : undefined;
  const isDatasourceActive = selectedDatasourceId ? activeDatasources.get(selectedDatasourceId)?.active || false : false;
  const datasourceStatus = selectedDatasourceId ? connectionStatus.get(selectedDatasourceId) : undefined;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between p-2 border-b">
        {/* Left section - Profile and primary controls */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Profile Selector - Always visible */}
          <Select value={activeProfileId} onValueChange={handleProfileChange}>
            <SelectTrigger className="w-[140px] sm:w-[180px]">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 hidden sm:inline" />
                <SelectValue placeholder="Select profile" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{profile.name}</span>
                    {profile.isDefault && (
                      <Badge variant="secondary" className="ml-2 text-xs">Default</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Profile Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleSaveProfile}>
                <Save className="mr-2 h-4 w-4" />
                Save Current State
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedProfileId(activeProfileId);
                  setShowDuplicateDialog(true);
                }}
                disabled={!activeProfile}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Datasource Selector - Always visible after profile */}
          {onDatasourceChange && (
            <>
              <div className="h-6 w-px bg-border" />
              <Select value={selectedDatasourceId || "none"} onValueChange={(value) => onDatasourceChange(value === "none" ? undefined : value)}>
                <SelectTrigger className="w-[140px] sm:w-[180px]">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <SelectValue placeholder="Select datasource" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No datasource</span>
                  </SelectItem>
                  {datasources.map((ds) => (
                    <SelectItem key={ds.id} value={ds.id}>
                      {ds.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Connection status badge - show when datasource is active */}
              {selectedDatasourceId && datasourceStatus && (
                <Badge 
                  variant={datasourceStatus.connected ? "default" : "secondary"}
                  className="text-xs flex items-center gap-1"
                >
                  {datasourceStatus.connected ? (
                    <>
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span>Connected</span>
                    </>
                  ) : (
                    <span>Disconnected</span>
                  )}
                </Badge>
              )}
            </>
          )}
        </div>
        
        {/* Right section - Only overflow menu */}
        <div className="flex items-center">
          {/* Overflow Menu for all controls */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Grid Controls */}
              {(onOpenColumnSettings || onOpenGridOptions) && (
                <>
                  {onOpenColumnSettings && (
                    <DropdownMenuItem onClick={onOpenColumnSettings}>
                      <Columns className="mr-2 h-4 w-4" />
                      Column Settings
                    </DropdownMenuItem>
                  )}
                  {onOpenGridOptions && (
                    <DropdownMenuItem onClick={onOpenGridOptions}>
                      <Settings2 className="mr-2 h-4 w-4" />
                      Grid Options
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              
              {/* Datasource actions - shown when datasource is selected */}
              {selectedDatasourceId && currentDatasource && (
                <>
                  {currentDatasource.type === 'stomp' && activateDatasource && (
                    <>
                      {!isDatasourceActive ? (
                        <DropdownMenuItem onClick={() => activateDatasource(selectedDatasourceId)}>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Connect
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => deactivateDatasource(selectedDatasourceId)}>
                          <Pause className="mr-2 h-4 w-4" />
                          Disconnect
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  
                  {currentDatasource.type === 'rest' && refreshDatasource && (
                    <DropdownMenuItem onClick={() => refreshDatasource(selectedDatasourceId)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Data
                    </DropdownMenuItem>
                  )}
                  
                  {currentDatasource.type === 'stomp' && onToggleUpdates && (
                    <DropdownMenuItem onClick={onToggleUpdates}>
                      <Power className={`mr-2 h-4 w-4 ${updatesEnabled ? 'text-green-500' : ''}`} />
                      {updatesEnabled ? 'Disable Updates' : 'Enable Updates'}
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem onClick={() => setShowStatisticsDialog(true)}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Statistics
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                </>
              )}
              
              {/* Font settings */}
              <DropdownMenuItem className="p-0 focus:bg-transparent">
                <Select value={selectedFont} onValueChange={onFontChange}>
                  <SelectTrigger className="w-full border-0 h-auto py-2">
                    <div className="flex items-center gap-2 justify-start">
                      <Type className="h-4 w-4" />
                      <SelectValue placeholder="Select font" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {monospaceFonts.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <span style={{ fontFamily: font.value }}>{font.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </DropdownMenuItem>
              
              {onFontSizeChange && (
                <DropdownMenuItem className="p-0 focus:bg-transparent">
                  <Select value={selectedFontSize} onValueChange={onFontSizeChange}>
                    <SelectTrigger className="w-full border-0 h-auto py-2">
                      <div className="flex items-center gap-2 justify-start">
                        <span className="ml-6 text-sm">Size:</span>
                        <SelectValue placeholder="Size" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {fontSizes.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {/* Theme Toggle */}
              <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                {theme === 'light' ? (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    Light Mode
                  </>
                )}
              </DropdownMenuItem>
              
              {/* Additional controls for simplified version */}
              {isConnected !== undefined && onRestart && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <span className="text-sm">
                      Status: {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </DropdownMenuItem>
                  {!isConnected && (
                    <DropdownMenuItem onClick={onRestart}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Restart Connection
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Profile Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Profile</DialogTitle>
            <DialogDescription>
              Create a new profile to save your grid configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="My Custom Profile"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-description">Description (optional)</Label>
              <Textarea
                id="profile-description"
                value={profileDescription}
                onChange={(e) => setProfileDescription(e.target.value)}
                placeholder="Describe what this profile is for..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProfile} disabled={!profileName.trim()}>
              Create Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Profile Duplicate Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Profile</DialogTitle>
            <DialogDescription>
              Create a copy of the selected profile with a new name.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="duplicate-name">New Profile Name</Label>
              <Input
                id="duplicate-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Copy of..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDuplicateProfile} disabled={!profileName.trim()}>
              Duplicate Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Statistics Dialog */}
      {selectedDatasourceId && showStatisticsDialog && (
        <DraggableStatisticsDialog
          datasourceId={selectedDatasourceId}
          datasourceName={currentDatasource?.name || ''}
          onClose={() => setShowStatisticsDialog(false)}
        />
      )}
    </div>
  );
}

DataTableToolbarInstance.displayName = 'DataTableToolbarInstance';