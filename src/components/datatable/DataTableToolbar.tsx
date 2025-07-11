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
import { Settings2, Sliders, MoreVertical, User, Save, Plus, Copy, Database, RefreshCw, Power, PlayCircle, Pause, BarChart3, Columns, Sun, Moon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
import { useDatasourceStore } from '@/stores/datasource.store';
import { useTheme } from '@/components/datatable/ThemeProvider';
// import { useDatasourceContext } from '@/contexts/DatasourceContext';
// import { DatasourceStatistics } from '@/components/datasource/DatasourceStatistics';
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

export function DataTableToolbar({ 
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
  const activeProfile = useActiveProfile();
  const profiles = useProfiles();
  const { 
    setActiveProfile, 
    createProfile,
    duplicateProfile, 
    saveColumnCustomizations,
    saveGridState
    // updateProfile
  } = useProfileStore();
  
  // Datasource hooks
  const { datasources, getDatasource } = useDatasourceStore();
  
  // Theme hook
  const { theme, setTheme } = useTheme();
  
  // For simplified version, these will be undefined
  let activateDatasource: any;
  let deactivateDatasource: any;
  let refreshDatasource: any;
  let connectionStatus: any;
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
            if (profile.gridState?.filterModel) {
              console.log('[DataTableToolbar] Applying filters');
              gridApi.setFilterModel(profile.gridState.filterModel);
            }
            
            // Apply sorting after filters
            setTimeout(() => {
              if (profile.gridState?.sortModel) {
                console.log('[DataTableToolbar] Applying sorts');
                gridApi.applyColumnState({
                  state: profile.gridState.sortModel.map(sort => ({
                    colId: sort.colId,
                    sort: sort.sort,
                    sortIndex: (sort as any).sortIndex
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

  const handleFetchColumnDefs = async () => {
    if (!selectedDatasourceId || !gridApi || !activeProfile) {
      toast({
        title: "Cannot fetch column definitions",
        description: "No datasource selected or grid is not ready",
        variant: "destructive"
      });
      return;
    }

    const datasource = getDatasource(selectedDatasourceId);
    if (!datasource || !datasource.columnDefinitions) {
      toast({
        title: "No column definitions found",
        description: "The selected datasource has no column definitions",
        variant: "destructive"
      });
      return;
    }

    try {
      // Apply column definitions to grid
      gridApi.setGridOption('columnDefs', datasource.columnDefinitions);
      
      // Save to profile
      const baseColumns = datasource.columnDefinitions.map(col => ({
        field: col.field,
        headerName: col.headerName,
        cellDataType: col.cellDataType
      }));
      
      saveColumnCustomizations(datasource.columnDefinitions, baseColumns);
      
      toast({
        title: "Column definitions fetched",
        description: `Applied ${datasource.columnDefinitions.length} columns from ${datasource.name}`,
      });
    } catch (error) {
      console.error('[DataTableToolbar] Error fetching column definitions:', error);
      toast({
        title: "Error fetching columns",
        description: "Failed to apply column definitions from datasource",
        variant: "destructive"
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
        .map((col) => ({
          colId: col.colId,
          sort: col.sort
        } as any)) || [];
      
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
          if (typeof (cleaned as any)[prop] === 'function') {
            delete (cleaned as any)[prop];
          }
        });
        
        // Handle headerStyle
        if (cleaned.headerStyle && typeof cleaned.headerStyle === 'function') {
          try {
            const regularStyle = (cleaned.headerStyle as any)({ floatingFilter: false } as any);
            const floatingStyle = (cleaned.headerStyle as any)({ floatingFilter: true } as any);
            (cleaned as any).headerStyle = {
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
            (cleaned as any).valueFormatter = {
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
      
      // Save datasource if selected
      if (selectedDatasourceId !== activeProfile.datasourceId) {
        const { updateProfile } = useProfileStore.getState();
        updateProfile(activeProfile.id, {
          datasourceId: selectedDatasourceId
        });
      }
      
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
      <div className="flex items-center justify-between p-2 border-b bg-background/95 border-border" style={{backgroundColor: 'hsl(var(--background))'}}>
      <div className="flex items-center gap-2">
        {/* Debug theme indicator */}
        <div className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted/50">
          Theme: {theme}
        </div>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 gap-2 data-[state=open]:bg-accent"
              >
                <User className="h-4 w-4" />
                <span className="font-medium">{activeProfile?.name || 'Settings'}</span>
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
                  className="flex-1 h-8 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
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
                  className="flex-1 h-8 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => setShowCreateDialog(true)}
                  title="Create new profile"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
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
        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => {
            console.log('Current theme:', theme);
            const newTheme = theme === 'light' ? 'dark' : 'light';
            console.log('Switching to:', newTheme);
            setTheme(newTheme);
          }}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme - Current: {theme}</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* Datasource Selector */}
            <DropdownMenuItem 
              onClick={(e) => e.preventDefault()}
              className="p-0"
            >
              <div className="w-full">
                <div className="flex items-center px-2 py-1.5">
                  <Database className="mr-2 h-4 w-4" />
                  <span>Datasource</span>
                </div>
                <div className="px-2 pb-2">
                  <Select 
                    value={selectedDatasourceId || 'none'} 
                    onValueChange={(value) => onDatasourceChange?.(value === 'none' ? undefined : value)}
                  >
                    <SelectTrigger className="w-full h-8">
                      <SelectValue placeholder="Select datasource" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">None</span>
                      </SelectItem>
                      {datasources.map((ds) => (
                        <SelectItem key={ds.id} value={ds.id}>
                          <div className="flex items-center gap-2">
                            <span>{ds.name}</span>
                            {activeDatasources.has(ds.id) && (
                              <Badge 
                                variant={connectionStatus.get(ds.id) === 'connected' ? "default" : "secondary"} 
                                className={`text-xs ${connectionStatus.get(ds.id) === 'connected' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                }`}
                              >
                                {connectionStatus.get(ds.id) === 'connected' ? 'Active' : 'Connecting'}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedDatasourceId && (
                  <div className="px-2 pb-1">
                    <Badge 
                      variant={isConnected !== undefined ? (isConnected ? "default" : "secondary") : (activeDatasources.has(selectedDatasourceId) ? "default" : "secondary")}
                      className={`text-xs ${(isConnected !== undefined ? isConnected : activeDatasources.has(selectedDatasourceId))
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}
                    >
                      {isConnected !== undefined ? (isConnected ? 'Connected' : 'Disconnected') : (activeDatasources.has(selectedDatasourceId) ? 'Active' : 'Inactive')}
                    </Badge>
                  </div>
                )}
                {selectedDatasourceId && (isConnected !== undefined ? isConnected : activeDatasources.has(selectedDatasourceId)) && (
                  <>
                    <div className="flex gap-1 px-2 pb-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={async (e) => {
                          e.stopPropagation();
                          // Use new onRestart if available, otherwise use legacy refreshDatasource
                          if (onRestart) {
                            onRestart();
                          } else if (refreshDatasource) {
                            await refreshDatasource(selectedDatasourceId);
                          }
                          toast({
                            title: 'Datasource refreshed',
                            description: 'The datasource has been restarted',
                          });
                        }}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Restart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          deactivateDatasource(selectedDatasourceId);
                          toast({
                            title: 'Datasource deactivated',
                            description: 'The datasource has been stopped',
                          });
                        }}
                      >
                        <Power className="h-3 w-3 mr-1" />
                        Stop
                      </Button>
                    </div>
                    <div className="px-2 pb-2">
                      <Button
                        size="sm"
                        variant={updatesEnabled ? "secondary" : "outline"}
                        className={`w-full h-7 text-xs transition-colors ${
                          updatesEnabled 
                            ? 'hover:bg-secondary/80 hover:text-secondary-foreground' 
                            : 'hover:bg-accent hover:text-accent-foreground'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleUpdates?.();
                          toast({
                            title: updatesEnabled ? 'Updates disabled' : 'Updates enabled',
                            description: updatesEnabled 
                              ? 'Real-time updates have been paused'
                              : 'Real-time updates are now active',
                          });
                        }}
                      >
                        {updatesEnabled ? (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Disable Updates
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-3 w-3 mr-1" />
                            Enable Updates
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="px-2 pb-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowStatisticsDialog(true);
                        }}
                      >
                        <BarChart3 className="h-3 w-3 mr-1" />
                        View Statistics
                      </Button>
                    </div>
                    <div className="px-2 pb-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFetchColumnDefs();
                        }}
                      >
                        <Columns className="h-3 w-3 mr-1" />
                        Fetch Column Defs
                      </Button>
                    </div>
                  </>
                )}
                {selectedDatasourceId && !activeDatasources.has(selectedDatasourceId) && (
                  <div className="px-2 pb-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-xs hover:bg-green-50 hover:text-green-700 hover:border-green-300 dark:hover:bg-green-900/20 dark:hover:text-green-300 dark:hover:border-green-700 transition-colors"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await activateDatasource(selectedDatasourceId);
                        toast({
                          title: 'Datasource activated',
                          description: 'The datasource is now active',
                        });
                      }}
                    >
                      <PlayCircle className="h-3 w-3 mr-1" />
                      Activate
                    </Button>
                  </div>
                )}
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
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
            className="hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => {
              setShowCreateDialog(false);
              setProfileName('');
              setProfileDescription('');
            }}
          >
            Cancel
          </Button>
          <Button 
            className="hover:bg-primary/90 transition-colors"
            onClick={handleCreateProfile} 
            disabled={!profileName.trim()}
          >
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
            className="hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => {
              setShowDuplicateDialog(false);
              setProfileName('');
              setSelectedProfileId(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            className="hover:bg-primary/90 transition-colors"
            onClick={handleDuplicateProfile} 
            disabled={!profileName.trim() || !selectedProfileId}
          >
            Duplicate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Statistics Dialog - Draggable with transparent overlay */}
    {selectedDatasourceId && showStatisticsDialog && (
      <DraggableStatisticsDialog
        datasourceId={selectedDatasourceId}
        datasourceName={datasources.find(ds => ds.id === selectedDatasourceId)?.name || ''}
        onClose={() => setShowStatisticsDialog(false)}
      />
    )}
    </>
  );
}