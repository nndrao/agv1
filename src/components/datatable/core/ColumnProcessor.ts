import { ColDef, GridApi } from 'ag-grid-community'
import { ColumnCustomization, GridProfile } from '../types'
import { FormattingEngine } from './FormattingEngine'

// Type alias for columnApi parameter (deprecated in AG-Grid v33)
type ColumnApi = any

export interface ProcessedColumn extends ColDef {
  // Added metadata for optimization
  _hash?: string
  _lastProcessed?: number
  _customizationApplied?: boolean
}

// Optimized column processing with caching and batching
export class ColumnProcessor {
  private static instance: ColumnProcessor
  private formattingEngine: FormattingEngine
  
  // Caches
  private processedColumns = new Map<string, ProcessedColumn>()
  private columnHashes = new Map<string, string>()
  private pendingUpdates = new Map<string, ProcessedColumn>()
  
  // Batch processing
  private updateTimer: number | null = null
  private updateCallbacks: Set<() => void> = new Set()
  
  private constructor() {
    this.formattingEngine = FormattingEngine.getInstance()
  }
  
  static getInstance(): ColumnProcessor {
    if (!ColumnProcessor.instance) {
      ColumnProcessor.instance = new ColumnProcessor()
    }
    return ColumnProcessor.instance
  }
  
  // Process columns with customizations
  processColumns(
    baseColumns: ColDef[],
    customizations: Record<string, ColumnCustomization>,
    options?: {
      skipCache?: boolean
      immediate?: boolean
    }
  ): ProcessedColumn[] {
    const { skipCache = false } = options || {}
    
    // Generate hash for cache lookup
    const hash = this.generateHash(baseColumns, customizations)
    
    if (!skipCache && this.columnHashes.has(hash)) {
      const cachedColumns = []
      for (const col of baseColumns) {
        const key = col.field || col.colId || ''
        const cached = this.processedColumns.get(`${hash}-${key}`)
        if (cached) {
          cachedColumns.push(cached)
        }
      }
      
      if (cachedColumns.length === baseColumns.length) {
        return cachedColumns
      }
    }
    
    // Process columns
    const processedColumns = this.formattingEngine.applyFormattingToColumns(
      baseColumns,
      customizations
    ) as ProcessedColumn[]
    
    // Add metadata
    processedColumns.forEach((col, index) => {
      col._hash = hash
      col._lastProcessed = Date.now()
      col._customizationApplied = true
      
      const key = (col as any).field || (col as any).colId || index.toString()
      this.processedColumns.set(`${hash}-${key}`, col)
    })
    
    this.columnHashes.set(hash, hash)
    
    return processedColumns
  }
  
  // Batch update columns
  batchUpdateColumns(
    updates: Array<{
      columnId: string
      customization: Partial<ColumnCustomization>
    }>,
    gridApi: GridApi,
    columnApi: ColumnApi
  ): void {
    // Queue updates
    updates.forEach(({ columnId, customization }) => {
      const colDef = columnApi.getColumn(columnId)?.getColDef()
      if (colDef) {
        const existing = this.pendingUpdates.get(columnId) || { ...colDef }
        this.pendingUpdates.set(columnId, {
          ...existing,
          ...this.applyCustomizationToColDef(existing, customization)
        })
      }
    })
    
    // Schedule batch update
    this.scheduleBatchUpdate(gridApi, columnApi)
  }
  
  // Apply single customization to column definition
  private applyCustomizationToColDef(
    _colDef: ColDef,
    customization: Partial<ColumnCustomization>
  ): Partial<ColDef> {
    const updates: Partial<ColDef> = {}
    
    // Handle valueFormatter
    if (customization.valueFormatter) {
      updates.valueFormatter = customization.valueFormatter
    }
    
    // Handle cellStyle and cellClass
    if (customization.cellStyle) {
      updates.cellStyle = customization.cellStyle as any
    }
    if (customization.cellClass) {
      updates.cellClass = customization.cellClass
    }
    
    // Handle editor properties
    if (customization.editable !== undefined) {
      updates.editable = customization.editable
    }
    if (customization.cellEditor) {
      updates.cellEditor = customization.cellEditor
    }
    if (customization.cellEditorParams) {
      updates.cellEditorParams = customization.cellEditorParams
    }
    
    // Handle filter properties
    if (customization.filter !== undefined) {
      updates.filter = customization.filter
    }
    if (customization.floatingFilter !== undefined) {
      updates.floatingFilter = customization.floatingFilter
    }
    
    // Handle other properties
    const otherProps = ['width', 'minWidth', 'maxWidth', 'hide', 'pinned', 'sort', 
                       'sortIndex', 'flex', 'resizable', 'sortable', 'headerClass',
                       'headerTooltip', 'tooltip', 'wrapText', 'autoHeight', 
                       'wrapHeaderText', 'autoHeaderHeight'];
    otherProps.forEach(prop => {
      if ((customization as any)[prop] !== undefined) {
        (updates as any)[prop] = (customization as any)[prop];
      }
    });
    
    return updates
  }
  
  // Schedule batch update with debouncing
  private scheduleBatchUpdate(gridApi: GridApi, columnApi: any): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
    }
    
    this.updateTimer = window.setTimeout(() => {
      this.executeBatchUpdate(gridApi, columnApi)
    }, 100) // 100ms debounce
  }
  
  // Execute batch update
  private executeBatchUpdate(gridApi: GridApi, _columnApi: any): void {
    if (this.pendingUpdates.size === 0) return
    
    const columnDefs = gridApi.getColumnDefs() || []
    const updatedDefs = columnDefs.map(colDef => {
      const columnId = (colDef as any).field || (colDef as any).colId || ''
      const pendingUpdate = this.pendingUpdates.get(columnId)
      
      if (pendingUpdate) {
        return { ...colDef, ...pendingUpdate }
      }
      
      return colDef
    })
    
    // Apply updates
    gridApi.setGridOption('columnDefs', updatedDefs)
    
    // Clear pending updates
    this.pendingUpdates.clear()
    
    // Notify callbacks
    this.updateCallbacks.forEach(callback => callback())
    
    this.updateTimer = null
  }
  
  // Apply profile to grid
  applyProfile(
    profile: GridProfile,
    gridApi: GridApi,
    _columnApi: ColumnApi,
    options?: {
      animated?: boolean
      skipState?: boolean
      skipFormatting?: boolean
    }
  ): void {
    const { animated = true, skipState = false, skipFormatting = false } = options || {}
    
    // Apply grid options first
    if (profile.gridOptions) {
      gridApi.updateGridOptions({
        ...profile.gridOptions,
        animateRows: animated
      })
    }
    
    // Apply column formatting
    if (!skipFormatting && profile.columnSettings) {
      const { baseColumnDefs, columnCustomizations } = profile.columnSettings
      
      if (baseColumnDefs) {
        const processedColumns = this.processColumns(
          baseColumnDefs,
          columnCustomizations || {},
          { immediate: true }
        )
        
        gridApi.setGridOption('columnDefs', processedColumns)
      }
    }
    
    // Apply grid state (column state, filters, sorts)
    if (!skipState && profile.gridState) {
      // Use setTimeout to ensure column definitions are applied first
      setTimeout(() => {
        // Apply column state
        if (profile.gridState?.columnState) {
          gridApi.applyColumnState({
            state: profile.gridState.columnState as any,
            applyOrder: true
          })
        }
        
        // Apply filter model
        if (profile.gridState?.filterModel) {
          gridApi.setFilterModel(profile.gridState.filterModel)
        }
        
        // Apply sort model
        if (profile.gridState?.sortModel) {
          gridApi.applyColumnState({
            state: profile.gridState.sortModel.map((sort: any) => ({
              colId: sort.colId,
              sort: sort.sort,
              sortIndex: sort.sortIndex
            }))
          })
        }
      }, 100)
    }
    
    // Refresh the grid
    setTimeout(() => {
      gridApi.refreshHeader()
      gridApi.redrawRows()
    }, 200)
  }
  
  // Extract current configuration from grid
  extractCurrentConfig(
    gridApi: GridApi,
    _columnApi: ColumnApi
  ): {
    columnDefs: ColDef[]
    columnState: any[]
    filterModel: any
    sortModel: any[]
    customizations: Record<string, ColumnCustomization>
  } {
    const columnDefs = gridApi.getColumnDefs() || []
    const columnState = gridApi.getColumnState ? gridApi.getColumnState() : []
    const filterModel = gridApi.getFilterModel()
    const sortModel = columnState.filter((col: any) => col.sort != null).map((col: any) => ({ 
      colId: col.colId, 
      sort: col.sort, 
      sortIndex: col.sortIndex 
    }))
    
    // Extract customizations from processed columns
    const customizations: Record<string, ColumnCustomization> = {}
    
    columnDefs.forEach(colDef => {
      const field = (colDef as any).field || (colDef as any).colId || ''
      const processed = colDef as ProcessedColumn
      
      if (processed._customizationApplied) {
        // Extract customization from column definition
        customizations[field] = this.extractCustomizationFromColDef(colDef)
      }
    })
    
    return {
      columnDefs,
      columnState,
      filterModel,
      sortModel,
      customizations
    }
  }
  
  // Extract customization from column definition
  private extractCustomizationFromColDef(colDef: ColDef): ColumnCustomization {
    const customization: ColumnCustomization = {
      field: (colDef as any).field || (colDef as any).colId || ''
    }
    
    // Extract format if custom formatter exists
    if (colDef.valueFormatter && typeof colDef.valueFormatter === 'function') {
      // Store formatter as string for serialization
      customization.format = {
        type: 'custom',
        customFunction: colDef.valueFormatter.toString()
      }
    }
    
    // Extract style
    if (colDef.cellStyle || colDef.cellClass) {
      customization.style = {}
      // Note: We can't fully reverse-engineer style functions,
      // so we store references or regenerate from saved customizations
    }
    
    // Extract editor
    if (colDef.cellEditor || colDef.editable !== undefined) {
      customization.editor = {
        type: colDef.cellEditor as string,
        params: colDef.cellEditorParams,
        enabled: colDef.editable !== false
      }
    }
    
    // Extract filter
    if (colDef.filter || colDef.filterParams) {
      customization.filter = {
        type: colDef.filter as string,
        params: colDef.filterParams,
        showFloatingFilter: colDef.floatingFilter === true
      }
    }
    
    // Extract general settings
    const generalKeys = ['headerName', 'width', 'minWidth', 'maxWidth', 'hide', 'pinned']
    const general: any = {}
    
    generalKeys.forEach(key => {
      if ((colDef as any)[key] !== undefined) {
        general[key] = (colDef as any)[key]
      }
    })
    
    if (Object.keys(general).length > 0) {
      customization.general = general
    }
    
    return customization
  }
  
  // Generate hash for caching
  private generateHash(columns: ColDef[], customizations: Record<string, ColumnCustomization>): string {
    const columnKeys = columns.map(c => (c as any).field || (c as any).colId).join(',')
    const customizationKeys = Object.keys(customizations).sort().join(',')
    const customizationValues = JSON.stringify(customizations)
    
    return `${columnKeys}-${customizationKeys}-${this.hashString(customizationValues)}`
  }
  
  // Simple hash function
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }
  
  // Clear caches
  clearCache(): void {
    this.processedColumns.clear()
    this.columnHashes.clear()
    this.pendingUpdates.clear()
    this.formattingEngine.clearCache()
  }
  
  // Get cache statistics
  getCacheStats(): {
    processedColumns: number
    columnHashes: number
    pendingUpdates: number
    formattingEngine: any
  } {
    return {
      processedColumns: this.processedColumns.size,
      columnHashes: this.columnHashes.size,
      pendingUpdates: this.pendingUpdates.size,
      formattingEngine: this.formattingEngine.getCacheStats()
    }
  }
  
  // Subscribe to update events
  onUpdate(callback: () => void): () => void {
    this.updateCallbacks.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback)
    }
  }
}