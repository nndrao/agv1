import React, { useRef, Suspense, lazy } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef } from 'ag-grid-community'
import { AllEnterpriseModule } from 'ag-grid-enterprise'

// Core hooks and utilities
import { useOptimizedDataTable } from './hooks/useOptimizedDataTable'
import { DataTableProvider } from './DataTableContext'

// Import existing UI components (unchanged)
import { DataTableToolbar } from './DataTableToolbar'
import { ThemeProvider } from './ThemeProvider'
import { DataTableErrorBoundary } from './DataTableErrorBoundary'

// Lazy load heavy components
const ColumnFormattingDialog = lazy(() => import('./columnFormatting/ColumnFormattingDialog').then(m => ({ default: m.ColumnFormattingDialog })))
const GridOptionsEditor = lazy(() => import('./gridOptions/GridOptionsEditor').then(m => ({ default: m.GridOptionsEditor })))
const DataSourceDialog = lazy(() => import('./datasource/DataSourceDialogSimple').then(m => ({ default: m.DataSourceDialogSimple })))

// Import existing styles
import './datatable.css'
import './format-styles.css'
import './profile-transitions.css'

// AG-Grid styles
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

export interface DataTableOptimizedProps {
  defaultColumns?: ColDef[]
  defaultData?: any[]
  height?: string | number
  autoSaveProfile?: boolean
  defaultProfileId?: string
  onReady?: (api: any) => void
}

// Optimized DataTable that uses the same UI components but with better architecture
export const DataTableOptimized: React.FC<DataTableOptimizedProps> = ({
  defaultColumns = [],
  defaultData = [],
  height = '100vh',
  autoSaveProfile = false,
  defaultProfileId,
  onReady
}) => {
  const gridRef = useRef<AgGridReact>(null)
  
  // Use the optimized hook
  const {
    profiles,
    formatting,
    dataSources,
    profileActions,
    formattingActions,
    dataSourceActions,
    onGridReady,
    applyFormattingChanges,
    saveCurrentProfile,
    loadProfile,
    refreshGrid,
    resetGrid,
    getGridApi,
    getColumnApi
  } = useOptimizedDataTable({
    gridRef,
    defaultColumns,
    defaultData,
    autoSaveProfile,
    defaultProfileId
  })
  
  // Create context value for existing components
  const contextValue = {
    // Grid references
    gridRef,
    gridApi: getGridApi(),
    columnApi: getColumnApi(),
    
    // State (mapped to existing structure)
    profiles: profiles.saved,
    activeProfile: profiles.active,
    selectedColumns: formatting.selectedColumns,
    pendingChanges: formatting.pendingChanges,
    processedColumns: [],
    selectedFont: 'monospace',
    selectedFontSize: '13',
    
    // Actions (mapped to existing interface)
    saveProfile: saveCurrentProfile,
    loadProfile,
    deleteProfile: profileActions.deleteProfile,
    setSelectedColumns: formattingActions.setSelectedColumns,
    updatePendingChanges: formattingActions.updatePendingChanges,
    applyChanges: applyFormattingChanges,
    handleFontChange: (font: string) => console.log('Font changed:', font),
    handleFontSizeChange: (size: string) => console.log('Font size changed:', size),
    handleSpacingChange: (spacing: string) => console.log('Spacing changed:', spacing),
    setAutoSaveProfile: (enabled: boolean) => console.log('Auto save:', enabled),
    updateColumnSettings: (columnId: string, settings: any) => formattingActions.updatePendingChanges(columnId, settings),
    showColumnDialog: false,
    setShowColumnDialog: (show: boolean) => console.log('Show column dialog:', show),
    gridApiRef: { current: getGridApi() },
    getColumnDefsWithStyles: () => defaultColumns as any[],
    
    // Additional methods
    refreshGrid,
    resetGrid
  }
  
  // Handle grid ready
  const handleGridReady = (event: any) => {
    onGridReady(event)
    if (onReady) {
      onReady(event.api)
    }
  }
  
  return (
    <DataTableErrorBoundary>
      <ThemeProvider>
        <DataTableProvider value={contextValue}>
          <div className="datatable-container" style={{ height }}>
            {/* Use existing toolbar component */}
            <DataTableToolbar
              selectedFont="monospace"
              selectedFontSize="13"
              onFontChange={(font) => console.log('Font changed:', font)}
              onSpacingChange={(spacing) => console.log('Spacing changed:', spacing)}
              onOpenColumnSettings={() => formattingActions.openFormattingDialog()}
              onOpenGridOptions={() => console.log('Open grid options')}
              onOpenDataSource={() => dataSourceActions.setActiveDataSource('_new')}
              gridApi={getGridApi()}
            />
            
            {/* AG-Grid with optimized configuration */}
            <div className="ag-theme-alpine" style={{ height: 'calc(100% - 48px)', width: '100%' }}>
              <AgGridReact
                ref={gridRef}
                modules={[AllEnterpriseModule]}
                columnDefs={defaultColumns}
                rowData={defaultData}
                onGridReady={handleGridReady}
                
                // Default options (same as original)
                defaultColDef={{
                  resizable: true,
                  sortable: true,
                  filter: true,
                  floatingFilter: false,
                  minWidth: 100
                }}
                
                // Grid options from state can be added here if needed
                
                // Performance optimizations
                animateRows={true}
                rowBuffer={10}
                debounceVerticalScrollbar={true}
                suppressColumnVirtualisation={false}
                suppressRowVirtualisation={false}
                
                // Enterprise features
                enableRangeSelection={true}
                enableRangeHandle={true}
                enableFillHandle={true}
                rowGroupPanelShow={'always'}
                pivotPanelShow={'always'}
                sideBar={{
                  toolPanels: [
                    {
                      id: 'columns',
                      labelDefault: 'Columns',
                      labelKey: 'columns',
                      iconKey: 'columns',
                      toolPanel: 'agColumnsToolPanel',
                      minWidth: 225,
                      maxWidth: 225,
                      width: 225
                    },
                    {
                      id: 'filters',
                      labelDefault: 'Filters',
                      labelKey: 'filters',
                      iconKey: 'filter',
                      toolPanel: 'agFiltersToolPanel',
                      minWidth: 180,
                      maxWidth: 400,
                      width: 250
                    }
                  ],
                  position: 'right',
                  defaultToolPanel: ''
                }}
              />
            </div>
            
            {/* Lazy loaded dialogs - using existing components */}
            <Suspense fallback={null}>
              {formatting.isOpen && (
                <ColumnFormattingDialog
                  open={formatting.isOpen}
                  onOpenChange={(open) => {
                    if (!open) formattingActions.closeFormattingDialog()
                  }}
                  columnDefs={defaultColumns}
                  columnState={getGridApi()?.getColumnState()}
                  onApply={(updatedColumns) => {
                    getGridApi()?.setGridOption('columnDefs', updatedColumns)
                    formattingActions.closeFormattingDialog()
                  }}
                />
              )}
              
              {false && (
                <GridOptionsEditor
                  isOpen={true}
                  onClose={() => console.log('Close grid options')}
                  onApply={(options) => {
                    console.log('Apply grid options:', options)
                    refreshGrid()
                  }}
                />
              )}
              
              {dataSources.active === '_new' && (
                <DataSourceDialog
                  open={true}
                  onOpenChange={(open) => {
                    if (!open) dataSourceActions.setActiveDataSource(null)
                  }}
                />
              )}
            </Suspense>
          </div>
        </DataTableProvider>
      </ThemeProvider>
    </DataTableErrorBoundary>
  )
}

// Migration helper - allows gradual adoption
export const DataTable = DataTableOptimized

// Export optimized utilities for external use
export { useOptimizedDataTable } from './hooks/useOptimizedDataTable'
export { FormattingEngine } from './core/FormattingEngine'
export { ColumnProcessor } from './core/ColumnProcessor'
export { ProfileManager } from './core/ProfileManager'
export { useUnifiedDataTableStore } from './stores/unified.store'