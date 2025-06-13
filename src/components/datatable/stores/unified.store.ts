import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { 
  GridProfile, 
  ColumnCustomization, 
  Template, 
  DataSourceConfig,
  GridState
} from '../types'

// Unified state interface that combines all stores
interface UnifiedDataTableState {
  // Profile Management (from profile.store.ts)
  profiles: {
    saved: Record<string, GridProfile>
    active: string | null
    lastModified: number
    autoSave: boolean
  }
  
  // Column Formatting (from columnFormatting.store.ts)
  formatting: {
    isOpen: boolean
    position: { x: number; y: number } | null
    selectedColumns: string[]
    pendingChanges: Record<string, ColumnCustomization>
    activeTab: string
    soundEnabled: boolean
    templates: Template[]
    recentlyUsedTemplates: string[]
  }
  
  // Column Templates (from columnTemplate.store.ts)
  templates: {
    saved: Record<string, Template>
    categories: string[]
    lastUsed: string[]
    maxRecent: number
  }
  
  // Data Sources (from dataSource.store.ts)
  dataSources: {
    configs: Record<string, DataSourceConfig>
    active: string | null
    connectionStatus: Record<string, 'connected' | 'disconnected' | 'error'>
    lastFetch: Record<string, number>
  }
  
  // Grid State (runtime state)
  gridState: {
    api: any | null
    columnApi: any | null
    currentColumnDefs: any[]
    isDirty: boolean
    lastAction: string | null
  }
  
  // Performance optimizations
  cache: {
    processedColumns: Map<string, any>
    styleCache: Map<string, any>
    formatterCache: Map<string, any>
  }
}

// Action interface for type safety
interface UnifiedDataTableActions {
  // Profile actions
  saveProfile: (name: string, profile?: Partial<GridProfile>) => void
  loadProfile: (id: string) => void
  deleteProfile: (id: string) => void
  updateProfile: (id: string, updates: Partial<GridProfile>) => void
  setActiveProfile: (id: string | null) => void
  
  // Formatting actions
  openFormattingDialog: (position?: { x: number; y: number }) => void
  closeFormattingDialog: () => void
  setSelectedColumns: (columns: string[]) => void
  updatePendingChanges: (columnId: string, changes: Partial<ColumnCustomization>) => void
  applyFormattingChanges: () => void
  clearPendingChanges: () => void
  setActiveTab: (tab: string) => void
  toggleSound: () => void
  
  // Template actions
  saveTemplate: (template: Template) => void
  deleteTemplate: (id: string) => void
  applyTemplate: (templateId: string, columnIds: string[]) => void
  updateRecentTemplates: (templateId: string) => void
  
  // Data source actions
  addDataSource: (config: DataSourceConfig) => void
  updateDataSource: (id: string, config: Partial<DataSourceConfig>) => void
  removeDataSource: (id: string) => void
  setActiveDataSource: (id: string | null) => void
  updateConnectionStatus: (id: string, status: 'connected' | 'disconnected' | 'error') => void
  
  // Grid state actions
  setGridApi: (api: any, columnApi: any) => void
  updateColumnDefs: (columnDefs: any[]) => void
  setDirty: (isDirty: boolean) => void
  
  // Cache actions
  cacheProcessedColumn: (key: string, value: any) => void
  cacheStyle: (key: string, value: any) => void
  cacheFormatter: (key: string, value: any) => void
  clearCache: (type?: 'columns' | 'styles' | 'formatters') => void
  
  // Utility actions
  reset: () => void
  importState: (state: Partial<UnifiedDataTableState>) => void
  exportState: () => UnifiedDataTableState
}

// Helper functions
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const captureGridState = (api: any, _columnApi: any): GridState => {
  if (!api) return {} as GridState
  
  return {
    columnState: api.getColumnState ? api.getColumnState() : [],
    filterModel: api.getFilterModel(),
    sortModel: api.getColumnState ? api.getColumnState().filter((col: any) => col.sort != null).map((col: any) => ({ colId: col.colId, sort: col.sort, sortIndex: col.sortIndex })) : [],
    columnDefs: api.getColumnDefs(),
    // Add other grid state properties as needed
  }
}

// Create the unified store
export const useUnifiedDataTableStore = create<UnifiedDataTableState & UnifiedDataTableActions>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial state
        profiles: {
          saved: {},
          active: null,
          lastModified: Date.now(),
          autoSave: false
        },
        
        formatting: {
          isOpen: false,
          position: null,
          selectedColumns: [],
          pendingChanges: {},
          activeTab: 'general',
          soundEnabled: true,
          templates: [],
          recentlyUsedTemplates: []
        },
        
        templates: {
          saved: {},
          categories: ['Text', 'Number', 'Date', 'Currency', 'Custom'],
          lastUsed: [],
          maxRecent: 10
        },
        
        dataSources: {
          configs: {},
          active: null,
          connectionStatus: {},
          lastFetch: {}
        },
        
        gridState: {
          api: null,
          columnApi: null,
          currentColumnDefs: [],
          isDirty: false,
          lastAction: null
        },
        
        cache: {
          processedColumns: new Map(),
          styleCache: new Map(),
          formatterCache: new Map()
        },
        
        // Profile actions
        saveProfile: (name, profile) => set(state => {
          const id = generateId()
          const { api, columnApi } = state.gridState
          
          const newProfile: GridProfile = {
            id,
            name,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            gridState: profile?.gridState || captureGridState(api, columnApi),
            columnSettings: profile?.columnSettings || {
              columnCustomizations: state.formatting.pendingChanges,
              baseColumnDefs: state.gridState.currentColumnDefs
            },
            gridOptions: profile?.gridOptions || {}
          }
          
          state.profiles.saved[id] = newProfile
          state.profiles.lastModified = Date.now()
          state.gridState.isDirty = false
        }),
        
        loadProfile: (id) => set(state => {
          const profile = state.profiles.saved[id]
          if (!profile) return
          
          state.profiles.active = id
          state.gridState.lastAction = 'loadProfile'
          
          // Apply profile will be handled by the component using the grid API
        }),
        
        deleteProfile: (id) => set(state => {
          delete state.profiles.saved[id]
          if (state.profiles.active === id) {
            state.profiles.active = null
          }
          state.profiles.lastModified = Date.now()
        }),
        
        updateProfile: (id, updates) => set(state => {
          if (state.profiles.saved[id]) {
            state.profiles.saved[id] = {
              ...state.profiles.saved[id],
              ...updates,
              updatedAt: Date.now()
            }
            state.profiles.lastModified = Date.now()
          }
        }),
        
        setActiveProfile: (id) => set(state => {
          state.profiles.active = id
        }),
        
        // Formatting actions
        openFormattingDialog: (position) => set(state => {
          state.formatting.isOpen = true
          state.formatting.position = position || { x: window.innerWidth / 2 - 400, y: 100 }
        }),
        
        closeFormattingDialog: () => set(state => {
          state.formatting.isOpen = false
          state.formatting.selectedColumns = []
          state.formatting.pendingChanges = {}
        }),
        
        setSelectedColumns: (columns) => set(state => {
          state.formatting.selectedColumns = columns
        }),
        
        updatePendingChanges: (columnId, changes) => set(state => {
          if (!state.formatting.pendingChanges[columnId]) {
            state.formatting.pendingChanges[columnId] = {}
          }
          
          state.formatting.pendingChanges[columnId] = {
            ...state.formatting.pendingChanges[columnId],
            ...changes
          }
          
          state.gridState.isDirty = true
        }),
        
        applyFormattingChanges: () => set(state => {
          // This will be handled by the component using the grid API
          state.gridState.lastAction = 'applyFormatting'
          state.formatting.isOpen = false
        }),
        
        clearPendingChanges: () => set(state => {
          state.formatting.pendingChanges = {}
        }),
        
        setActiveTab: (tab) => set(state => {
          state.formatting.activeTab = tab
        }),
        
        toggleSound: () => set(state => {
          state.formatting.soundEnabled = !state.formatting.soundEnabled
        }),
        
        // Template actions
        saveTemplate: (template) => set(state => {
          const id = template.id || generateId()
          state.templates.saved[id] = { ...template, id }
          state.templates.lastUsed.unshift(id)
          if (state.templates.lastUsed.length > state.templates.maxRecent) {
            state.templates.lastUsed.pop()
          }
        }),
        
        deleteTemplate: (id) => set(state => {
          delete state.templates.saved[id]
          state.templates.lastUsed = state.templates.lastUsed.filter((tid: any) => tid !== id)
        }),
        
        applyTemplate: (templateId, columnIds) => set(state => {
          const template = state.templates.saved[templateId]
          if (!template) return
          
          columnIds.forEach(columnId => {
            state.formatting.pendingChanges[columnId] = {
              ...state.formatting.pendingChanges[columnId],
              ...template.settings
            }
          })
          
          state.templates.lastUsed = [templateId, ...state.templates.lastUsed.filter((id: any) => id !== templateId)]
          if (state.templates.lastUsed.length > state.templates.maxRecent) {
            state.templates.lastUsed.pop()
          }
          
          state.gridState.isDirty = true
        }),
        
        updateRecentTemplates: (templateId) => set(state => {
          state.formatting.recentlyUsedTemplates = [
            templateId,
            ...state.formatting.recentlyUsedTemplates.filter((id: any) => id !== templateId)
          ].slice(0, 5)
        }),
        
        // Data source actions
        addDataSource: (config) => set(state => {
          const id = config.id || generateId()
          state.dataSources.configs[id] = { ...config, id }
        }),
        
        updateDataSource: (id, config) => set(state => {
          if (state.dataSources.configs[id]) {
            state.dataSources.configs[id] = {
              ...state.dataSources.configs[id],
              ...config
            }
          }
        }),
        
        removeDataSource: (id) => set(state => {
          delete state.dataSources.configs[id]
          delete state.dataSources.connectionStatus[id]
          delete state.dataSources.lastFetch[id]
          if (state.dataSources.active === id) {
            state.dataSources.active = null
          }
        }),
        
        setActiveDataSource: (id) => set(state => {
          state.dataSources.active = id
        }),
        
        updateConnectionStatus: (id, status) => set(state => {
          state.dataSources.connectionStatus[id] = status
        }),
        
        // Grid state actions
        setGridApi: (api, columnApi) => set(state => {
          state.gridState.api = api
          state.gridState.columnApi = columnApi
        }),
        
        updateColumnDefs: (columnDefs) => set(state => {
          state.gridState.currentColumnDefs = columnDefs
          state.gridState.isDirty = true
        }),
        
        setDirty: (isDirty) => set(state => {
          state.gridState.isDirty = isDirty
        }),
        
        // Cache actions
        cacheProcessedColumn: (key, value) => set(state => {
          state.cache.processedColumns.set(key, value)
        }),
        
        cacheStyle: (key, value) => set(state => {
          state.cache.styleCache.set(key, value)
        }),
        
        cacheFormatter: (key, value) => set(state => {
          state.cache.formatterCache.set(key, value)
        }),
        
        clearCache: (type) => set(state => {
          if (!type || type === 'columns') state.cache.processedColumns.clear()
          if (!type || type === 'styles') state.cache.styleCache.clear()
          if (!type || type === 'formatters') state.cache.formatterCache.clear()
        }),
        
        // Utility actions
        reset: () => set(state => {
          // Reset to initial state while preserving saved data
          state.formatting = {
            isOpen: false,
            position: null,
            selectedColumns: [],
            pendingChanges: {},
            activeTab: 'general',
            soundEnabled: state.formatting.soundEnabled,
            templates: state.formatting.templates,
            recentlyUsedTemplates: []
          }
          
          state.gridState = {
            api: state.gridState.api,
            columnApi: state.gridState.columnApi,
            currentColumnDefs: [],
            isDirty: false,
            lastAction: 'reset'
          }
          
          state.cache.processedColumns.clear()
          state.cache.styleCache.clear()
          state.cache.formatterCache.clear()
        }),
        
        importState: (importedState) => set(state => {
          Object.assign(state, importedState)
        }),
        
        exportState: () => get()
      })),
      {
        name: 'unified-datatable-store',
        partialize: (state) => ({
          profiles: state.profiles,
          templates: state.templates,
          dataSources: state.dataSources,
          formatting: {
            soundEnabled: state.formatting.soundEnabled,
            templates: state.formatting.templates
          }
        }),
        version: 1
      }
    )
  )
)

// Selector hooks for better performance
export const useProfiles = () => useUnifiedDataTableStore(state => state.profiles)
export const useFormatting = () => useUnifiedDataTableStore(state => state.formatting)
export const useTemplates = () => useUnifiedDataTableStore(state => state.templates)
export const useDataSources = () => useUnifiedDataTableStore(state => state.dataSources)
export const useGridState = () => useUnifiedDataTableStore(state => state.gridState)

// Action hooks
export const useProfileActions = () => useUnifiedDataTableStore(state => ({
  saveProfile: state.saveProfile,
  loadProfile: state.loadProfile,
  deleteProfile: state.deleteProfile,
  updateProfile: state.updateProfile,
  setActiveProfile: state.setActiveProfile
}))

export const useFormattingActions = () => useUnifiedDataTableStore(state => ({
  openFormattingDialog: state.openFormattingDialog,
  closeFormattingDialog: state.closeFormattingDialog,
  setSelectedColumns: state.setSelectedColumns,
  updatePendingChanges: state.updatePendingChanges,
  applyFormattingChanges: state.applyFormattingChanges,
  clearPendingChanges: state.clearPendingChanges,
  setActiveTab: state.setActiveTab,
  toggleSound: state.toggleSound
}))

export const useTemplateActions = () => useUnifiedDataTableStore(state => ({
  saveTemplate: state.saveTemplate,
  deleteTemplate: state.deleteTemplate,
  applyTemplate: state.applyTemplate,
  updateRecentTemplates: state.updateRecentTemplates
}))

export const useDataSourceActions = () => useUnifiedDataTableStore(state => ({
  addDataSource: state.addDataSource,
  updateDataSource: state.updateDataSource,
  removeDataSource: state.removeDataSource,
  setActiveDataSource: state.setActiveDataSource,
  updateConnectionStatus: state.updateConnectionStatus
}))

export const useGridActions = () => useUnifiedDataTableStore(state => ({
  setGridApi: state.setGridApi,
  updateColumnDefs: state.updateColumnDefs,
  setDirty: state.setDirty
}))

export const useCacheActions = () => useUnifiedDataTableStore(state => ({
  cacheProcessedColumn: state.cacheProcessedColumn,
  cacheStyle: state.cacheStyle,
  cacheFormatter: state.cacheFormatter,
  clearCache: state.clearCache
}))