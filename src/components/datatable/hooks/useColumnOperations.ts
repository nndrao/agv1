import { useCallback, useRef, useMemo, useEffect } from 'react';
import { ColDef, GridApi } from 'ag-grid-community';
import { useActiveProfile } from '@/components/datatable/stores/profile.store';
import { profileOptimizer } from '@/components/datatable/lib/profileOptimizer';
import { debounce } from '@/lib/utils';
import { ColumnDef } from '../types';
import { COLUMN_UPDATE_DEBOUNCE_MS } from '../utils/constants';

/**
 * Custom hook for handling column operations and updates
 */
export function useColumnOperations(
  gridApiRef: React.MutableRefObject<GridApi | null>,
  setCurrentColumnDefs: (columns: ColumnDef[]) => void,
  currentColumnDefs?: ColumnDef[]
) {
  const activeProfile = useActiveProfile();
  const columnDefsWithStylesRef = useRef<ColumnDef[]>(currentColumnDefs || []);
  
  // Update the ref when currentColumnDefs changes (e.g., when profile loads)
  useEffect(() => {
    if (currentColumnDefs && currentColumnDefs.length > 0) {
      console.log('[useColumnOperations] Updating columnDefsWithStylesRef from currentColumnDefs:', {
        columnsCount: currentColumnDefs.length,
        hasCustomizations: currentColumnDefs.some(col => col.cellStyle || col.valueFormatter),
        sampleColumn: currentColumnDefs[0]
      });
      columnDefsWithStylesRef.current = currentColumnDefs;
    }
  }, [currentColumnDefs]);
  
  // Debounced column update to prevent rapid re-renders
  const applyColumnChangesDebounced = useMemo(
    () => debounce((columns: ColDef[]) => {
      console.log('[useColumnOperations] Debounced function called:', {
        hasGridApi: !!gridApiRef.current,
        hasActiveProfile: !!activeProfile,
        columnsCount: columns.length
      });
      
      if (gridApiRef.current) {
        console.log('[useColumnOperations] Applying column definitions to grid:', {
          columnsCount: columns.length,
          hasCustomizations: columns.some(col => col.cellStyle || col.valueFormatter || col.cellClass),
          sampleColumn: columns[0]
        });
        
        // Simply update the column definitions
        console.log('[useColumnOperations] About to setGridOption with columns:', columns);
        gridApiRef.current.setGridOption('columnDefs', columns);
        
        // Verify the columns were set
        setTimeout(() => {
          const currentCols = gridApiRef.current.getColumnDefs();
          console.log('[useColumnOperations] Columns after setGridOption:', {
            currentColsCount: currentCols?.length,
            hasCustomizations: currentCols?.some((col: any) => col.cellStyle || col.valueFormatter || col.cellClass)
          });
        }, 10);
        
        // Apply the column state from the active profile
        if (activeProfile && activeProfile.gridState?.columnState && activeProfile.gridState.columnState.length > 0) {
          console.log('[useColumnOperations] Applying column state from active profile:', {
            profileName: activeProfile.name,
            columnStateCount: activeProfile.gridState.columnState.length
          });
          
          gridApiRef.current.applyColumnState({
            state: activeProfile.gridState.columnState,
            applyOrder: true
          });
        }
        
        // Apply sort model from profile
        if (activeProfile && activeProfile.gridState?.sortModel && activeProfile.gridState.sortModel.length > 0) {
          const sortState = activeProfile.gridState.sortModel.map(sort => ({
            colId: sort.colId,
            sort: sort.sort,
            sortIndex: sort.sortIndex
          }));
          gridApiRef.current.applyColumnState({ state: sortState });
        }
        
        // Apply filter model from profile
        if (activeProfile && activeProfile.gridState?.filterModel) {
          gridApiRef.current.setFilterModel(activeProfile.gridState.filterModel);
        }
        
        // Refresh the grid to show the changes
        gridApiRef.current.refreshHeader();
        // Don't force refresh as it might clear styles
        gridApiRef.current.refreshCells({ 
          suppressFlash: true 
        });
      }
    }, COLUMN_UPDATE_DEBOUNCE_MS),
    [activeProfile]
  );
  
  const handleApplyColumnChanges = useCallback((updatedColumns: ColDef[]) => {
    console.log('[useColumnOperations] handleApplyColumnChanges:', {
      updatedColumnsCount: updatedColumns.length,
      hasGridApi: !!gridApiRef.current,
      hasCustomizations: updatedColumns.some(col => 
        col.cellStyle || col.valueFormatter || col.cellClass
      ),
      firstColumn: updatedColumns[0]?.field
    });
    
    // Store the columns with styles for later retrieval
    columnDefsWithStylesRef.current = updatedColumns as ColumnDef[];
    
    // Update the currentColumnDefs state
    setCurrentColumnDefs(updatedColumns as ColumnDef[]);
    
    // Apply the changes to the grid
    if (gridApiRef.current) {
      // Since maintainColumnOrder is true, this should preserve column state
      applyColumnChangesDebounced(updatedColumns);
    }
    
    // Log what was updated for debugging
    const updatedFields = updatedColumns.filter(col => 
      col.cellStyle || col.valueFormatter || col.cellClass
    ).map(col => col.field);
    
    if (updatedFields.length > 0) {
      console.log('[useColumnOperations] Column customizations applied:', {
        updatedFields,
        totalColumns: updatedColumns.length
      });
    }
    
    // Update React state
    setCurrentColumnDefs(updatedColumns.map((col) => {
      if (col.field && col.headerName) {
        return col as ColumnDef;
      }
      
      return {
        ...col,
        field: col.field || '',
        headerName: col.headerName || col.field || ''
      };
    }));
    
    // Clear optimizer cache for active profile since columns changed
    if (activeProfile) {
      profileOptimizer.clearCache(activeProfile.id);
    }
    
    // Column changes from dialog are only saved when Save Profile button is clicked
  }, [activeProfile, setCurrentColumnDefs, applyColumnChangesDebounced]);
  
  // Get column definitions with styles
  const getColumnDefsWithStyles = useCallback(() => {
    return columnDefsWithStylesRef.current;
  }, []);
  
  return {
    handleApplyColumnChanges,
    getColumnDefsWithStyles,
  };
}