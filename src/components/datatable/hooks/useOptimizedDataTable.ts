import { useEffect, useRef, useCallback } from 'react'
import { GridApi, GridReadyEvent } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { 
  useUnifiedDataTableStore,
  useProfiles,
  useFormatting,
  useTemplates,
  useDataSources,
  useGridState,
  useProfileActions,
  useFormattingActions,
  useTemplateActions,
  useDataSourceActions,
  useGridActions,
  useCacheActions
} from '../stores/unified.store'
import { ColumnProcessor } from '../core/ColumnProcessor'
import { ProfileManager } from '../core/ProfileManager'
import { FormattingEngine } from '../core/FormattingEngine'

export interface UseOptimizedDataTableOptions {
  gridRef: React.RefObject<AgGridReact>
  defaultColumns?: any[]
  defaultData?: any[]
  autoSaveProfile?: boolean
  soundEnabled?: boolean
  defaultProfileId?: string
}

export interface UseOptimizedDataTableResult {
  // State
  profiles: ReturnType<typeof useProfiles>
  formatting: ReturnType<typeof useFormatting>
  templates: ReturnType<typeof useTemplates>
  dataSources: ReturnType<typeof useDataSources>
  gridState: ReturnType<typeof useGridState>
  
  // Actions
  profileActions: ReturnType<typeof useProfileActions>
  formattingActions: ReturnType<typeof useFormattingActions>
  templateActions: ReturnType<typeof useTemplateActions>
  dataSourceActions: ReturnType<typeof useDataSourceActions>
  gridActions: ReturnType<typeof useGridActions>
  cacheActions: ReturnType<typeof useCacheActions>
  
  // Grid methods
  onGridReady: (event: GridReadyEvent) => void
  applyFormattingChanges: () => void
  saveCurrentProfile: (name: string) => void
  loadProfile: (profileId: string) => void
  exportProfiles: (profileIds?: string[]) => string
  importProfiles: (data: string) => void
  
  // Utility methods
  refreshGrid: () => void
  resetGrid: () => void
  getGridApi: () => GridApi | null
  getColumnApi: () => any | null
}

export function useOptimizedDataTable(
  options: UseOptimizedDataTableOptions
): UseOptimizedDataTableResult {
  const {
    // gridRef is optional and not used in this implementation
    defaultColumns = [],
    defaultData = [],
    autoSaveProfile = false,
    soundEnabled = true,
    defaultProfileId
  } = options
  
  // Get all state slices
  const profiles = useProfiles()
  const formatting = useFormatting()
  const templates = useTemplates()
  const dataSources = useDataSources()
  const gridState = useGridState()
  
  // Get all actions
  const profileActions = useProfileActions()
  const formattingActions = useFormattingActions()
  const templateActions = useTemplateActions()
  const dataSourceActions = useDataSourceActions()
  const gridActions = useGridActions()
  const cacheActions = useCacheActions()
  
  // Core instances
  const columnProcessor = useRef(ColumnProcessor.getInstance())
  const profileManager = useRef(ProfileManager.getInstance({ autoSave: autoSaveProfile }))
  const formattingEngine = useRef(FormattingEngine.getInstance())
  
  // Grid APIs
  const gridApi = useRef<GridApi | null>(null)
  // const columnApi = useRef<any | null>(null) // Removed - no longer used in AG-Grid v33
  
  // Initialize sound preference
  useEffect(() => {
    if (soundEnabled !== formatting.soundEnabled) {
      formattingActions.toggleSound()
    }
  }, [soundEnabled])
  
  // Grid ready handler
  const onGridReady = useCallback((event: GridReadyEvent) => {
    gridApi.current = event.api
    
    // Store grid API - AG-Grid v33 unified API
    gridActions.setGridApi(event.api, null)
    
    // Initialize profile manager with unified API
    profileManager.current.initialize(event.api, null)
    
    // Load default profile if specified
    if (defaultProfileId) {
      try {
        profileManager.current.loadProfile(defaultProfileId, event.api, null)
      } catch (error) {
        console.error('Failed to load default profile:', error)
      }
    }
    
    // Set default columns if no profile loaded
    if (!defaultProfileId && defaultColumns.length > 0) {
      event.api.setGridOption('columnDefs', defaultColumns)
    }
    
    // Set initial data
    if (defaultData.length > 0) {
      event.api.setGridOption('rowData', defaultData)
    }
  }, [defaultProfileId, defaultColumns, defaultData])
  
  // Apply formatting changes
  const applyFormattingChanges = useCallback(() => {
    if (!gridApi.current) return
    
    const pendingChanges = formatting.pendingChanges
    const selectedColumns = formatting.selectedColumns
    
    // Batch update columns
    const updates = selectedColumns.map(columnId => ({
      columnId,
      customization: pendingChanges[columnId] || {}
    }))
    
    columnProcessor.current.batchUpdateColumns(
      updates,
      gridApi.current,
      null
    )
    
    // Play sound if enabled
    if (formatting.soundEnabled) {
      playSound('apply')
    }
    
    // Clear pending changes
    formattingActions.clearPendingChanges()
    formattingActions.closeFormattingDialog()
    
    // Mark grid as dirty
    gridActions.setDirty(true)
  }, [formatting.pendingChanges, formatting.selectedColumns, formatting.soundEnabled])
  
  // Save current profile
  const saveCurrentProfile = useCallback((name: string) => {
    if (!gridApi.current) {
      throw new Error('Grid not initialized')
    }
    
    try {
      const profileId = profileManager.current.saveProfile(
        name,
        gridApi.current,
        null
      )
      
      // Play sound if enabled
      if (formatting.soundEnabled) {
        playSound('save')
      }
      
      return profileId
    } catch (error) {
      console.error('Failed to save profile:', error)
      throw error
    }
  }, [formatting.soundEnabled])
  
  // Load profile
  const loadProfile = useCallback((profileId: string) => {
    if (!gridApi.current) {
      throw new Error('Grid not initialized')
    }
    
    try {
      profileManager.current.loadProfile(
        profileId,
        gridApi.current,
        null
      )
      
      // Play sound if enabled
      if (formatting.soundEnabled) {
        playSound('load')
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      throw error
    }
  }, [formatting.soundEnabled])
  
  // Export profiles
  const exportProfiles = useCallback((profileIds?: string[]) => {
    return profileManager.current.exportProfiles(profileIds)
  }, [])
  
  // Import profiles
  const importProfiles = useCallback((data: string) => {
    try {
      const importedIds = profileManager.current.importProfiles(data)
      
      // Play sound if enabled
      if (formatting.soundEnabled) {
        playSound('import')
      }
      
      console.log(`Imported ${importedIds.length} profiles`)
    } catch (error) {
      console.error('Failed to import profiles:', error)
      throw error
    }
  }, [formatting.soundEnabled])
  
  // Refresh grid
  const refreshGrid = useCallback(() => {
    if (!gridApi.current) return
    
    gridApi.current.refreshCells()
    gridApi.current.refreshHeader()
    gridApi.current.redrawRows()
  }, [])
  
  // Reset grid
  const resetGrid = useCallback(() => {
    if (!gridApi.current) return
    
    // Reset to default columns
    gridApi.current.setGridOption('columnDefs', defaultColumns)
    
    // Clear filters and sorts
    gridApi.current.setFilterModel(null)
    gridApi.current.applyColumnState({
      state: [],
      defaultState: { sort: null }
    })
    
    // Reset column state
    gridApi.current.resetColumnState()
    
    // Clear caches
    cacheActions.clearCache()
    
    // Reset store state
    const store = useUnifiedDataTableStore.getState()
    store.reset()
    
    // Play sound if enabled
    if (formatting.soundEnabled) {
      playSound('reset')
    }
  }, [defaultColumns, formatting.soundEnabled])
  
  // Get grid API
  const getGridApi = useCallback(() => gridApi.current, [])
  
  // Get column API (deprecated in AG-Grid v33 - return null)
  const getColumnApi = useCallback(() => null, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear caches
      columnProcessor.current.clearCache()
      formattingEngine.current.clearCache()
    }
  }, [])
  
  // Return all functionality
  return {
    // State
    profiles,
    formatting,
    templates,
    dataSources,
    gridState,
    
    // Actions
    profileActions,
    formattingActions,
    templateActions,
    dataSourceActions,
    gridActions,
    cacheActions,
    
    // Grid methods
    onGridReady,
    applyFormattingChanges,
    saveCurrentProfile,
    loadProfile,
    exportProfiles,
    importProfiles,
    
    // Utility methods
    refreshGrid,
    resetGrid,
    getGridApi,
    getColumnApi
  }
}

// Helper function to play sounds
function playSound(type: 'apply' | 'save' | 'load' | 'import' | 'reset') {
  try {
    // Use Web Audio API for better performance
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Different sounds for different actions
    switch (type) {
      case 'apply':
        oscillator.frequency.value = 800
        gainNode.gain.value = 0.1
        break
      case 'save':
        oscillator.frequency.value = 1000
        gainNode.gain.value = 0.1
        break
      case 'load':
        oscillator.frequency.value = 600
        gainNode.gain.value = 0.1
        break
      case 'import':
        oscillator.frequency.value = 1200
        gainNode.gain.value = 0.1
        break
      case 'reset':
        oscillator.frequency.value = 400
        gainNode.gain.value = 0.1
        break
    }
    
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (error) {
    // Silently fail if audio is not available
  }
}