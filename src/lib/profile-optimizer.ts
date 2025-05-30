import { ColDef, ColumnState, FilterModel, SortModelItem, GridApi } from 'ag-grid-community';
import { GridProfile } from '@/stores/profile.store';
import { deserializeColumnCustomizations } from '@/stores/column-serializer';
import { perfMonitor } from './performance-monitor';
import { createExcelFormatter } from '@/components/datatable/utils/formatters';

interface ProfileCache {
  processedColumnDefs: ColDef[];
  columnStateHash: string;
  filterModelHash: string;
  sortModelHash: string;
  timestamp: number;
}

interface ProfileDiff {
  columnDefsChanged: boolean;
  columnStateChanged: boolean;
  filterModelChanged: boolean;
  sortModelChanged: boolean;
  gridOptionsChanged: boolean;
  changes: {
    addedColumns: string[];
    removedColumns: string[];
    modifiedColumns: string[];
    columnStateChanges: Partial<ColumnState>[];
    filterChanges: Record<string, any>;
    sortChanges: SortModelItem[];
  };
}

class ProfileOptimizer {
  private cache = new Map<string, ProfileCache>();
  private currentProfileId: string | null = null;
  private pendingUpdates: Map<string, any> = new Map();
  private updateFrameId: number | null = null;
  
  // Pre-process profiles in background
  async preprocessProfile(profile: GridProfile) {
    if (this.cache.has(profile.id)) {
      const cached = this.cache.get(profile.id)!;
      // Cache is valid for 5 minutes
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        return;
      }
    }
    
    // Use requestIdleCallback for background processing
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.processProfile(profile), { timeout: 2000 });
    } else {
      setTimeout(() => this.processProfile(profile), 100);
    }
  }
  
  private processProfile(profile: GridProfile) {
    perfMonitor.mark('profile-process-start');
    
    let processedColumnDefs: ColDef[] = [];
    
    // Process column definitions
    if (profile.gridState.columnCustomizations && profile.gridState.baseColumnDefs) {
      processedColumnDefs = deserializeColumnCustomizations(
        profile.gridState.columnCustomizations,
        profile.gridState.baseColumnDefs
      );
    } else if (profile.gridState.columnDefs) {
      processedColumnDefs = this.processLegacyColumnDefs(profile.gridState.columnDefs);
    }
    
    // Create hashes for quick comparison
    const columnStateHash = this.hashObject(profile.gridState.columnState || []);
    const filterModelHash = this.hashObject(profile.gridState.filterModel || {});
    const sortModelHash = this.hashObject(profile.gridState.sortModel || []);
    
    this.cache.set(profile.id, {
      processedColumnDefs,
      columnStateHash,
      filterModelHash,
      sortModelHash,
      timestamp: Date.now()
    });
    
    perfMonitor.measure('profileProcessTime', 'profile-process-start');
  }
  
  private processLegacyColumnDefs(columnDefs: ColDef[]): ColDef[] {
    return columnDefs.map(col => {
      const processed = { ...col };
      
      // Clean invalid properties
      delete (processed as any).valueFormat;
      delete (processed as any)._hasFormatter;
      delete (processed as any).excelFormat;
      
      // Convert headerStyle objects back to functions
      if (processed.headerStyle && typeof processed.headerStyle === 'object') {
        const styleConfig = processed.headerStyle as any;
        
        if (styleConfig._isHeaderStyleConfig) {
          processed.headerStyle = ((params: { floatingFilter?: boolean }) => {
            if (params?.floatingFilter) {
              return styleConfig.floating || null;
            }
            return styleConfig.regular || null;
          }) as ColDef['headerStyle'];
        }
      }
      
      // Recreate valueFormatter from saved config
      if (processed.valueFormatter && typeof processed.valueFormatter === 'object') {
        const formatterConfig = processed.valueFormatter as any;
        
        if (formatterConfig._isFormatterConfig && formatterConfig.type === 'excel' && formatterConfig.formatString) {
          // Recreate the formatter function
          const formatter = createExcelFormatter(formatterConfig.formatString);
          processed.valueFormatter = formatter;
          processed.exportValueFormatter = formatter;
        } else {
          // Invalid formatter config, remove it
          delete processed.valueFormatter;
          delete processed.exportValueFormatter;
        }
      }
      
      return processed;
    });
  }
  
  // Calculate diff between current and target profile
  calculateDiff(currentProfile: GridProfile | null, targetProfile: GridProfile): ProfileDiff {
    const diff: ProfileDiff = {
      columnDefsChanged: false,
      columnStateChanged: false,
      filterModelChanged: false,
      sortModelChanged: false,
      gridOptionsChanged: false,
      changes: {
        addedColumns: [],
        removedColumns: [],
        modifiedColumns: [],
        columnStateChanges: [],
        filterChanges: {},
        sortChanges: []
      }
    };
    
    if (!currentProfile) {
      // Everything is new
      diff.columnDefsChanged = true;
      diff.columnStateChanged = true;
      diff.filterModelChanged = !!targetProfile.gridState.filterModel;
      diff.sortModelChanged = !!targetProfile.gridState.sortModel?.length;
      diff.gridOptionsChanged = !!targetProfile.gridState.gridOptions;
      return diff;
    }
    
    // Compare column definitions
    const currentCache = this.cache.get(currentProfile.id);
    const targetCache = this.cache.get(targetProfile.id);
    
    if (!currentCache || !targetCache || 
        currentCache.processedColumnDefs.length !== targetCache.processedColumnDefs.length) {
      diff.columnDefsChanged = true;
    } else {
      // Deep comparison of column definitions
      for (let i = 0; i < currentCache.processedColumnDefs.length; i++) {
        const current = currentCache.processedColumnDefs[i];
        const target = targetCache.processedColumnDefs[i];
        
        if (JSON.stringify(current) !== JSON.stringify(target)) {
          diff.columnDefsChanged = true;
          diff.changes.modifiedColumns.push(current.field || '');
        }
      }
    }
    
    // Compare states using hashes
    diff.columnStateChanged = currentCache?.columnStateHash !== targetCache?.columnStateHash;
    diff.filterModelChanged = currentCache?.filterModelHash !== targetCache?.filterModelHash;
    diff.sortModelChanged = currentCache?.sortModelHash !== targetCache?.sortModelHash;
    
    // Compare grid options
    diff.gridOptionsChanged = JSON.stringify(currentProfile.gridState.gridOptions) !== 
                             JSON.stringify(targetProfile.gridState.gridOptions);
    
    return diff;
  }
  
  // Apply profile with optimizations
  async applyProfile(
    gridApi: GridApi,
    profile: GridProfile,
    currentProfile: GridProfile | null,
    options: {
      showTransition?: boolean;
      onProgress?: (progress: number) => void;
    } = {}
  ) {
    perfMonitor.mark('profile-switch-start');
    
    // Ensure profile is preprocessed
    if (!this.cache.has(profile.id)) {
      await this.processProfile(profile);
    }
    
    const cached = this.cache.get(profile.id);
    if (!cached) {
      console.error('[ProfileOptimizer] Failed to cache profile:', profile.id);
      return;
    }
    
    // Calculate diff
    const diff = this.calculateDiff(currentProfile, profile);
    
    // Show transition if needed
    if (options.showTransition) {
      this.showTransitionEffect(gridApi);
    }
    
    // Optimistic update - immediately update visual indicators
    this.currentProfileId = profile.id;
    
    // Batch all updates
    this.batchUpdates(() => {
      let progress = 0;
      const totalSteps = 4;
      
      // Step 1: Apply column definitions if changed
      if (diff.columnDefsChanged && cached.processedColumnDefs.length > 0) {
        // Store current filter model to reapply after column update
        const currentFilterModel = gridApi.getFilterModel();
        
        // Get current defaultColDef to ensure it's preserved
        const defaultColDef = gridApi.getGridOption('defaultColDef') || {
          flex: 1,
          minWidth: 100,
          filter: true,
          floatingFilter: true,
          enableValue: true,
          enableRowGroup: true,
          enablePivot: true,
          resizable: true,
          sortable: true,
          useValueFormatterForExport: true,
        };
        
        // Update both columnDefs and defaultColDef to ensure consistency
        gridApi.updateGridOptions({
          columnDefs: cached.processedColumnDefs,
          defaultColDef: defaultColDef
        });
        
        // After setting column definitions, we need to ensure the grid is fully updated
        setTimeout(() => {
          // Force a complete refresh of the grid structure
          gridApi.refreshHeader();
          gridApi.refreshCells({ force: true });
          
          // Reapply filter model to ensure filters are displayed
          if (currentFilterModel && Object.keys(currentFilterModel).length > 0) {
            gridApi.setFilterModel(currentFilterModel);
          }
          
          // Final refresh to ensure floating filters are visible
          setTimeout(() => {
            gridApi.refreshFilters();
          }, 50);
        }, 100);
        
        progress++;
        options.onProgress?.(progress / totalSteps);
      }
      
      // Step 2: Apply column state (most visible change)
      if (diff.columnStateChanged && profile.gridState.columnState) {
        this.scheduleUpdate('columnState', () => {
          gridApi.applyColumnState({
            state: profile.gridState.columnState,
            applyOrder: true
          });
          progress++;
          options.onProgress?.(progress / totalSteps);
        }, 1); // Highest priority
      }
      
      // Step 3: Apply filters (lower priority)
      if (diff.filterModelChanged) {
        this.scheduleUpdate('filterModel', () => {
          // Clear existing filters first, then apply new ones
          gridApi.setFilterModel(null);
          if (profile.gridState.filterModel && Object.keys(profile.gridState.filterModel).length > 0) {
            setTimeout(() => {
              gridApi.setFilterModel(profile.gridState.filterModel);
            }, 10);
          }
          progress++;
          options.onProgress?.(progress / totalSteps);
        }, 2);
      }
      
      // Step 4: Apply sort (lowest priority)
      if (diff.sortModelChanged) {
        this.scheduleUpdate('sortModel', () => {
          if (profile.gridState.sortModel && profile.gridState.sortModel.length > 0) {
            gridApi.applyColumnState({
              state: profile.gridState.sortModel.map(sort => ({
                colId: sort.colId,
                sort: sort.sort,
                sortIndex: sort.sortIndex
              }))
            });
          }
          progress++;
          options.onProgress?.(progress / totalSteps);
        }, 3);
      }
      
      // Apply grid options if changed
      if (diff.gridOptionsChanged && profile.gridState.gridOptions) {
        this.scheduleUpdate('gridOptions', () => {
          const options = profile.gridState.gridOptions!;
          if (options.rowHeight) {
            gridApi.resetRowHeights();
            gridApi.setGridOption('rowHeight', options.rowHeight);
          }
          if (options.headerHeight) {
            gridApi.setGridOption('headerHeight', options.headerHeight);
          }
        }, 4);
      }
    });
    
    perfMonitor.measure('profileSwitchTime', 'profile-switch-start');
  }
  
  private batchUpdates(callback: () => void) {
    // Cancel any pending frame
    if (this.updateFrameId !== null) {
      cancelAnimationFrame(this.updateFrameId);
    }
    
    callback();
    
    // Process updates in next animation frame
    this.updateFrameId = requestAnimationFrame(() => {
      this.processPendingUpdates();
    });
  }
  
  private scheduleUpdate(key: string, update: () => void, priority: number = 0) {
    this.pendingUpdates.set(key, { update, priority });
  }
  
  private processPendingUpdates() {
    // Sort updates by priority
    const updates = Array.from(this.pendingUpdates.entries())
      .sort((a, b) => a[1].priority - b[1].priority);
    
    // Execute updates
    updates.forEach(([key, { update }]) => {
      try {
        update();
      } catch (error) {
        console.error(`[ProfileOptimizer] Error applying ${key}:`, error);
      }
    });
    
    this.pendingUpdates.clear();
    this.updateFrameId = null;
  }
  
  private showTransitionEffect(gridApi: GridApi) {
    // Get the grid wrapper element - AG-Grid doesn't have getGridBodyElement()
    // We need to get the grid's DOM element through the grid's wrapper
    const gridElement = document.querySelector('.ag-root-wrapper') as HTMLElement;
    if (!gridElement) return;
    
    // Add transition class
    gridElement.style.transition = 'opacity 150ms ease-out';
    gridElement.style.opacity = '0.7';
    
    // Remove transition after animation
    setTimeout(() => {
      gridElement.style.opacity = '1';
      setTimeout(() => {
        gridElement.style.transition = '';
      }, 150);
    }, 50);
  }
  
  private hashObject(obj: any): string {
    return JSON.stringify(obj).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString(36);
  }
  
  // Clear cache for a specific profile
  clearCache(profileId?: string) {
    if (profileId) {
      this.cache.delete(profileId);
    } else {
      this.cache.clear();
    }
  }
  
  // Preload all profiles
  async preloadAllProfiles(profiles: GridProfile[]) {
    // Process profiles in batches during idle time
    const batchSize = 2;
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      
      if ('requestIdleCallback' in window) {
        await new Promise(resolve => {
          requestIdleCallback(() => {
            batch.forEach(profile => this.processProfile(profile));
            resolve(undefined);
          }, { timeout: 1000 });
        });
      } else {
        batch.forEach(profile => this.processProfile(profile));
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }
}

export const profileOptimizer = new ProfileOptimizer();

// Export to window for debugging
if (typeof window !== 'undefined') {
  (window as any).profileOptimizer = profileOptimizer;
}