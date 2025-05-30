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
    const startTime = performance.now();
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
      const totalSteps = Object.keys(diff).filter(key => diff[key as keyof ProfileDiff]).length;
      
      // Collect all updates to apply in a single transaction
      const gridUpdates: any = {};
      let needsHeaderRefresh = false;
      let needsFilterRefresh = false;
      
      // Step 1: Prepare column definitions if changed
      if (diff.columnDefsChanged && cached.processedColumnDefs.length > 0) {
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
        
        gridUpdates.columnDefs = cached.processedColumnDefs;
        gridUpdates.defaultColDef = defaultColDef;
        
        // Check if we need header refresh
        needsHeaderRefresh = cached.processedColumnDefs.some(col => 
          col.floatingFilter !== false || col.headerStyle
        );
        
        progress++;
        options.onProgress?.(progress / totalSteps);
      }
      
      // Apply all grid updates in one call
      if (Object.keys(gridUpdates).length > 0) {
        gridApi.updateGridOptions(gridUpdates);
      }
      
      // Batch all remaining state updates into a single operation
      this.scheduleUpdate('profileState', () => {
        // Apply column state, sort, and filter in optimal order
        
        // 1. Column state (includes visibility, width, position)
        if (diff.columnStateChanged && profile.gridState.columnState) {
          gridApi.applyColumnState({
            state: profile.gridState.columnState,
            applyOrder: true
          });
          progress++;
          options.onProgress?.(progress / totalSteps);
        }
        
        // 2. Sort model (part of column state)
        if (diff.sortModelChanged && profile.gridState.sortModel?.length > 0) {
          const sortState = profile.gridState.sortModel.map(sort => ({
            colId: sort.colId,
            sort: sort.sort,
            sortIndex: sort.sortIndex
          }));
          gridApi.applyColumnState({ state: sortState });
          progress++;
          options.onProgress?.(progress / totalSteps);
        }
        
        // 3. Filter model (apply after column state)
        if (diff.filterModelChanged) {
          gridApi.setFilterModel(profile.gridState.filterModel || {});
          needsFilterRefresh = true;
          progress++;
          options.onProgress?.(progress / totalSteps);
        }
        
        // 4. Single refresh at the end if needed
        if (needsHeaderRefresh || needsFilterRefresh) {
          requestAnimationFrame(() => {
            if (needsHeaderRefresh) {
              gridApi.refreshHeader();
            }
            if (needsFilterRefresh) {
              gridApi.refreshFilters();
            }
          });
        }
      }, 1); // High priority
      
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
    
    // Log performance metrics
    const endTime = performance.now();
    const switchTime = endTime - startTime;
    
    console.log('[ProfileOptimizer] Profile switch completed:', {
      profileId: profile.id,
      profileName: profile.name,
      switchTime: `${switchTime.toFixed(1)}ms`,
      operations: {
        columnDefsChanged: diff.columnDefsChanged,
        columnStateChanged: diff.columnStateChanged,
        filterModelChanged: diff.filterModelChanged,
        sortModelChanged: diff.sortModelChanged,
        gridOptionsChanged: diff.gridOptionsChanged
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
    // Get the grid wrapper element
    const gridElement = document.querySelector('.ag-root-wrapper') as HTMLElement;
    if (!gridElement) return;
    
    // Use CSS classes for better performance
    gridElement.classList.add('profile-switching');
    
    // Remove class after animation completes
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        gridElement.classList.remove('profile-switching');
      });
    });
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