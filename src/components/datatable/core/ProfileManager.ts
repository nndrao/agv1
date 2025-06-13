import { GridApi } from 'ag-grid-community'
import { GridProfile, ColumnCustomization } from '../types'
import { ColumnProcessor } from './ColumnProcessor'
import { useUnifiedDataTableStore } from '../stores/unified.store'

export interface ProfileManagerOptions {
  autoSave?: boolean
  saveDebounce?: number
  compression?: boolean
  maxProfiles?: number
}

// Optimized profile management with all features
export class ProfileManager {
  private static instance: ProfileManager
  private columnProcessor: ColumnProcessor
  private options: ProfileManagerOptions
  
  // Auto-save timer
  private autoSaveTimer: number | null = null
  private lastSavedState: string = ''
  
  // Profile cache for faster switching
  private profileCache = new Map<string, {
    profile: GridProfile
    prepared: any
    timestamp: number
  }>()
  
  private constructor(options: ProfileManagerOptions = {}) {
    this.options = {
      autoSave: false,
      saveDebounce: 3000,
      compression: true,
      maxProfiles: 50,
      ...options
    }
    
    this.columnProcessor = ColumnProcessor.getInstance()
  }
  
  static getInstance(options?: ProfileManagerOptions): ProfileManager {
    if (!ProfileManager.instance) {
      ProfileManager.instance = new ProfileManager(options)
    }
    return ProfileManager.instance
  }
  
  // Initialize profile manager with grid
  initialize(gridApi: GridApi, columnApi: any): void {
    const store = useUnifiedDataTableStore.getState()
    
    // Set grid APIs in store
    store.setGridApi(gridApi, columnApi)
    
    // Load default profile if exists
    const defaultProfile = this.findDefaultProfile()
    if (defaultProfile) {
      this.loadProfile(defaultProfile.id, gridApi, columnApi)
    }
    
    // Setup auto-save if enabled
    if (this.options.autoSave) {
      this.setupAutoSave(gridApi, columnApi)
    }
  }
  
  // Save current grid state as profile
  saveProfile(
    name: string,
    gridApi: GridApi,
    columnApi: any,
    options?: {
      description?: string
      tags?: string[]
      isDefault?: boolean
      overwrite?: boolean
    }
  ): string {
    const store = useUnifiedDataTableStore.getState()
    
    // Check if profile with same name exists
    const existingProfile = Object.values(store.profiles.saved).find(p => p.name === name)
    if (existingProfile && !options?.overwrite) {
      throw new Error(`Profile "${name}" already exists`)
    }
    
    // Extract current configuration
    const config = this.columnProcessor.extractCurrentConfig(gridApi, columnApi)
    
    // Create profile
    const profile: GridProfile = {
      id: existingProfile?.id || this.generateId(),
      name,
      description: options?.description,
      // tags: options?.tags, // Removed as not part of GridProfile type
      isDefault: options?.isDefault,
      createdAt: existingProfile?.createdAt || Date.now(),
      updatedAt: Date.now(),
      // version: 2, // Removed as not part of GridProfile type
      
      // Grid state
      gridState: {
        columnState: config.columnState,
        filterModel: config.filterModel,
        sortModel: config.sortModel
      },
      
      // Column settings
      columnSettings: {
        columnCustomizations: this.compressCustomizations(config.customizations),
        baseColumnDefs: this.cleanColumnDefs(config.columnDefs)
      },
      
      // Grid options
      gridOptions: this.extractGridOptions(gridApi)
    }
    
    // Validate profile size
    if (this.options.compression) {
      const size = JSON.stringify(profile).length
      if (size > 1024 * 1024) { // 1MB limit
        console.warn(`Profile "${name}" is large (${(size / 1024).toFixed(2)}KB)`)
      }
    }
    
    // Save profile
    store.saveProfile(name, profile)
    
    // Clear old profiles if exceeding limit
    this.enforceProfileLimit()
    
    // Cache the profile
    this.cacheProfile(profile)
    
    return profile.id
  }
  
  // Load profile
  loadProfile(
    profileId: string,
    gridApi: GridApi,
    columnApi: any,
    options?: {
      animated?: boolean
      preserveFilters?: boolean
      preserveSorts?: boolean
    }
  ): void {
    const store = useUnifiedDataTableStore.getState()
    const profile = store.profiles.saved[profileId]
    
    if (!profile) {
      throw new Error(`Profile "${profileId}" not found`)
    }
    
    // Check cache first
    const cached = this.profileCache.get(profileId)
    if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
      this.applyProfileFromCache(cached, gridApi, columnApi, options)
      return
    }
    
    // Prepare profile for application
    const prepared = this.prepareProfile(profile)
    
    // Cache prepared profile
    this.cacheProfile(profile, prepared)
    
    // Apply profile
    this.columnProcessor.applyProfile(prepared, gridApi, columnApi, {
      animated: options?.animated,
      skipState: false,
      skipFormatting: false
    })
    
    // Update active profile
    store.setActiveProfile(profileId)
    
    // Preserve filters/sorts if requested
    if (options?.preserveFilters || options?.preserveSorts) {
      setTimeout(() => {
        if (options.preserveFilters) {
          gridApi.setFilterModel(this.lastFilterModel || {})
        }
        if (options.preserveSorts) {
          gridApi.applyColumnState({
            state: (this.lastSortModel || []).map((sort: any) => ({
              colId: sort.colId,
              sort: sort.sort,
              sortIndex: sort.sortIndex
            }))
          })
        }
      }, 150)
    }
  }
  
  // Delete profile
  deleteProfile(profileId: string): void {
    const store = useUnifiedDataTableStore.getState()
    
    // Don't delete default profile
    const profile = store.profiles.saved[profileId]
    if (profile?.isDefault) {
      throw new Error('Cannot delete default profile')
    }
    
    // Remove from cache
    this.profileCache.delete(profileId)
    
    // Delete from store
    store.deleteProfile(profileId)
  }
  
  // Update profile
  updateProfile(
    profileId: string,
    updates: Partial<GridProfile>,
    gridApi?: GridApi,
    columnApi?: any
  ): void {
    const store = useUnifiedDataTableStore.getState()
    
    // If updating with current state
    if (gridApi && columnApi) {
      const config = this.columnProcessor.extractCurrentConfig(gridApi, columnApi)
      
      updates = {
        ...updates,
        gridState: {
          columnState: config.columnState,
          filterModel: config.filterModel,
          sortModel: config.sortModel
        },
        columnSettings: {
          columnCustomizations: this.compressCustomizations(config.customizations),
          baseColumnDefs: this.cleanColumnDefs(config.columnDefs)
        },
        gridOptions: this.extractGridOptions(gridApi),
        updatedAt: Date.now()
      }
    }
    
    // Update in store
    store.updateProfile(profileId, updates)
    
    // Invalidate cache
    this.profileCache.delete(profileId)
  }
  
  // Export profiles
  exportProfiles(profileIds?: string[]): string {
    const store = useUnifiedDataTableStore.getState()
    const profiles = profileIds
      ? profileIds.map(id => store.profiles.saved[id]).filter(Boolean)
      : Object.values(store.profiles.saved)
    
    const exportData = {
      version: 2,
      exportedAt: Date.now(),
      profiles: profiles.map(p => this.cleanProfileForExport(p))
    }
    
    return JSON.stringify(exportData, null, 2)
  }
  
  // Import profiles
  importProfiles(jsonData: string, options?: {
    overwrite?: boolean
    prefix?: string
  }): string[] {
    const store = useUnifiedDataTableStore.getState()
    
    try {
      const data = JSON.parse(jsonData)
      
      if (!data.profiles || !Array.isArray(data.profiles)) {
        throw new Error('Invalid profile data')
      }
      
      const importedIds: string[] = []
      
      data.profiles.forEach((profile: GridProfile) => {
        // Add prefix if specified
        if (options?.prefix) {
          profile.name = `${options.prefix}${profile.name}`
        }
        
        // Check for existing profile
        const existing = Object.values(store.profiles.saved).find(p => p.name === profile.name)
        
        if (existing && !options?.overwrite) {
          console.warn(`Skipping profile "${profile.name}" - already exists`)
          return
        }
        
        // Generate new ID if needed
        if (existing) {
          profile.id = existing.id
        } else {
          profile.id = this.generateId()
        }
        
        // Save profile
        store.saveProfile(profile.name, profile)
        importedIds.push(profile.id)
      })
      
      return importedIds
    } catch (error) {
      throw new Error(`Failed to import profiles: ${(error as Error).message}`)
    }
  }
  
  // Get profile list
  getProfiles(options?: {
    sortBy?: 'name' | 'date' | 'usage'
    tags?: string[]
  }): GridProfile[] {
    const store = useUnifiedDataTableStore.getState()
    let profiles = Object.values(store.profiles.saved)
    
    // Filter by tags (if tags are added to the profile type in future)
    if (options?.tags && options.tags.length > 0) {
      // Skip tag filtering for now as tags are not part of GridProfile type
    }
    
    // Sort profiles
    switch (options?.sortBy) {
      case 'name':
        profiles.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'date':
        profiles.sort((a, b) => b.updatedAt - a.updatedAt)
        break
      case 'usage':
        // TODO: Track usage statistics
        profiles.sort((a, b) => b.updatedAt - a.updatedAt)
        break
    }
    
    return profiles
  }
  
  // Setup auto-save
  private setupAutoSave(gridApi: GridApi, columnApi: any): void {
    
    // Listen to grid events
    const events = [
      'columnMoved',
      'columnResized',
      'columnVisible',
      'sortChanged',
      'filterChanged'
    ]
    
    events.forEach(event => {
      gridApi.addEventListener(event as any, () => {
        this.scheduleAutoSave(gridApi, columnApi)
      })
    })
    
    // Listen to store changes
    useUnifiedDataTableStore.subscribe(
      state => state.formatting.pendingChanges,
      () => this.scheduleAutoSave(gridApi, columnApi)
    )
  }
  
  // Schedule auto-save
  private scheduleAutoSave(gridApi: GridApi, columnApi: any): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer)
    }
    
    this.autoSaveTimer = window.setTimeout(() => {
      this.performAutoSave(gridApi, columnApi)
    }, this.options.saveDebounce)
  }
  
  // Perform auto-save
  private performAutoSave(gridApi: GridApi, columnApi: any): void {
    const store = useUnifiedDataTableStore.getState()
    const activeProfile = store.profiles.active
    
    if (!activeProfile) return
    
    // Check if state has changed
    const currentState = JSON.stringify(this.columnProcessor.extractCurrentConfig(gridApi, columnApi))
    if (currentState === this.lastSavedState) return
    
    try {
      this.updateProfile(activeProfile, {}, gridApi, columnApi)
      this.lastSavedState = currentState
      console.log(`Auto-saved profile "${activeProfile}"`)
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }
  
  // Helper methods
  
  private findDefaultProfile(): GridProfile | undefined {
    const store = useUnifiedDataTableStore.getState()
    return Object.values(store.profiles.saved).find(p => p.isDefault)
  }
  
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  private compressCustomizations(
    customizations: Record<string, ColumnCustomization>
  ): Record<string, ColumnCustomization> {
    if (!this.options.compression) return customizations
    
    // Remove empty customizations
    const compressed: Record<string, ColumnCustomization> = {}
    
    Object.entries(customizations).forEach(([key, value]) => {
      if (value && Object.keys(value).length > 0) {
        compressed[key] = value
      }
    })
    
    return compressed
  }
  
  private cleanColumnDefs(columnDefs: any[]): any[] {
    // Remove non-serializable properties
    return columnDefs.map(col => {
      const { 
        valueFormatter,
        cellStyle,
        cellClass,
        cellRenderer,
        cellEditor,
        comparator,
        getQuickFilterText,
        ...cleanCol 
      } = col
      
      return cleanCol
    })
  }
  
  private extractGridOptions(gridApi: GridApi): any {
    // Extract only the options we care about
    const options = [
      'rowHeight',
      'headerHeight',
      'groupHeaderHeight',
      'floatingFiltersHeight',
      'pivotHeaderHeight',
      'pivotGroupHeaderHeight',
      'rowBuffer',
      'animateRows',
      'enableCellTextSelection',
      'ensureDomOrder'
    ]
    
    const extracted: any = {}
    
    options.forEach(option => {
      const value = gridApi.getGridOption(option as any)
      if (value !== undefined) {
        extracted[option] = value
      }
    })
    
    return extracted
  }
  
  private prepareProfile(profile: GridProfile): GridProfile {
    // Decompress customizations if needed
    if (this.options.compression && profile.columnSettings) {
      return {
        ...profile,
        columnSettings: {
          ...profile.columnSettings,
          columnCustomizations: profile.columnSettings.columnCustomizations || {}
        }
      }
    }
    
    return profile
  }
  
  private cacheProfile(profile: GridProfile, prepared?: any): void {
    this.profileCache.set(profile.id, {
      profile,
      prepared: prepared || profile,
      timestamp: Date.now()
    })
    
    // Limit cache size
    if (this.profileCache.size > 10) {
      const oldest = Array.from(this.profileCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
      
      if (oldest) {
        this.profileCache.delete(oldest[0])
      }
    }
  }
  
  private applyProfileFromCache(
    cached: any,
    gridApi: GridApi,
    columnApi: any,
    options?: any
  ): void {
    this.columnProcessor.applyProfile(cached.prepared, gridApi, columnApi, options)
    useUnifiedDataTableStore.getState().setActiveProfile(cached.profile.id)
  }
  
  private cleanProfileForExport(profile: GridProfile): GridProfile {
    // Remove internal properties
    const { id, ...cleanProfile } = profile
    return cleanProfile as GridProfile
  }
  
  private enforceProfileLimit(): void {
    const store = useUnifiedDataTableStore.getState()
    const profiles = Object.values(store.profiles.saved)
    
    if (profiles.length > this.options.maxProfiles!) {
      // Remove oldest non-default profiles
      const toRemove = profiles
        .filter(p => !p.isDefault)
        .sort((a, b) => a.updatedAt - b.updatedAt)
        .slice(0, profiles.length - this.options.maxProfiles!)
      
      toRemove.forEach(p => store.deleteProfile(p.id))
    }
  }
  
  // For auto-save
  private lastFilterModel: any = null
  private lastSortModel: any[] = []
}