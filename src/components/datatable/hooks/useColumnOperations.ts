import { useCallback, useRef, useMemo } from 'react';
import { ColDef, GridApi } from 'ag-grid-community';
import { useActiveProfile } from '@/stores/profile.store';
import { profileOptimizer } from '@/lib/profile-optimizer';
import { debounce } from '@/lib/utils';
import { ColumnDef } from '../types';
import { STATE_RESTORATION_DELAY_MS, COLUMN_UPDATE_DEBOUNCE_MS } from '../utils/constants';

/**
 * Custom hook for handling column operations and updates
 */
export function useColumnOperations(
  gridApiRef: React.MutableRefObject<GridApi | null>,
  setCurrentColumnDefs: (columns: ColumnDef[]) => void
) {
  const activeProfile = useActiveProfile();
  const columnDefsWithStylesRef = useRef<ColumnDef[]>([]);
  
  // Debounced column update to prevent rapid re-renders
  const applyColumnChangesDebounced = useMemo(
    () => debounce((columns: ColDef[]) => {
      if (gridApiRef.current) {
        gridApiRef.current.setGridOption('columnDefs', columns);
        
        // Force header refresh to ensure styles are applied
        gridApiRef.current.refreshHeader();
        
        // Also refresh cells to ensure cell styles are applied/cleared
        gridApiRef.current.refreshCells({ 
          force: true,
          suppressFlash: false 
        });
        
        // Redraw rows to ensure all styling is updated
        gridApiRef.current.redrawRows();
      }
    }, COLUMN_UPDATE_DEBOUNCE_MS),
    []
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
    
    // IMPORTANT: We need to preserve the current column state (width, position, visibility)
    // and only update the customization properties
    if (gridApiRef.current) {
      // Get current column state to preserve
      const currentColumnState = gridApiRef.current.getColumnState();
      const currentFilterModel = gridApiRef.current.getFilterModel();
      const currentSortModel = gridApiRef.current.getColumnState().filter(col => col.sort);
      const currentColumnDefs = gridApiRef.current.getColumnDefs() || [];
      
      console.log('[useColumnOperations] Preserving AG-Grid state:', {
        columnStateCount: currentColumnState.length,
        visibleColumns: currentColumnState.filter(cs => !cs.hide).length,
        hiddenColumns: currentColumnState.filter(cs => cs.hide).length,
        pinnedColumns: currentColumnState.filter(cs => cs.pinned).length,
        sortedColumns: currentSortModel.length,
        hasFilters: Object.keys(currentFilterModel).length > 0
      });
      
      // Create a map of current columns for quick lookup
      const currentColMap = new Map();
      currentColumnDefs.forEach(col => {
        if ('field' in col && col.field) {
          currentColMap.set(col.field, col);
        } else if ('colId' in col && col.colId) {
          currentColMap.set(col.colId, col);
        }
      });
      
      // Merge the customizations with existing column definitions
      const mergedColumns = updatedColumns.map(updatedCol => {
        const field = updatedCol.field || updatedCol.colId;
        const currentCol = currentColMap.get(field);
        
        if (currentCol) {
          // Enhanced logging for debugging style application
          const hasCellStyle = updatedCol.cellStyle !== undefined;
          const hasValueFormatter = updatedCol.valueFormatter !== undefined;
          
          if (hasCellStyle || hasValueFormatter) {
            console.log(`[useColumnOperations] Column ${field} style/formatter update:`, {
              field,
              hasCellStyle,
              cellStyleType: typeof updatedCol.cellStyle,
              hasValueFormatter,
              valueFormatterType: typeof updatedCol.valueFormatter,
            });
          }
          
          // For columns being updated, use the updated version entirely
          // The store has already handled property removal/addition
          return updatedCol;
        }
        
        // If column not found in current state, return as is
        return updatedCol;
      });
      
      // Store the merged columns with styles for later retrieval
      columnDefsWithStylesRef.current = mergedColumns as ColumnDef[];
      
      // Update the currentColumnDefs state to ensure consistency
      setCurrentColumnDefs(mergedColumns as ColumnDef[]);
      
      // Apply the merged column definitions with debouncing
      applyColumnChangesDebounced(mergedColumns);
      
      // Restore the column state, filters, and sorts to preserve user's current view
      // Small delay to ensure column definitions are fully applied
      setTimeout(() => {
        if (gridApiRef.current) {
          // Restore column state (width, position, visibility, pinning)
          if (currentColumnState) {
            console.log('[useColumnOperations] Restoring column state after customization');
            gridApiRef.current.applyColumnState({
              state: currentColumnState,
              applyOrder: true
            });
          }
          
          // Restore filters
          if (currentFilterModel && Object.keys(currentFilterModel).length > 0) {
            console.log('[useColumnOperations] Restoring filters:', currentFilterModel);
            gridApiRef.current.setFilterModel(currentFilterModel);
          }
          
          // Restore sorts
          if (currentSortModel && currentSortModel.length > 0) {
            console.log('[useColumnOperations] Restoring sorts:', currentSortModel);
            const sortState = currentSortModel.map(col => ({
              colId: col.colId,
              sort: col.sort,
              sortIndex: col.sortIndex
            }));
            gridApiRef.current.applyColumnState({
              state: sortState
            });
          }
          
          // Force a final refresh to ensure everything is applied correctly
          gridApiRef.current.refreshCells({ force: true });
        }
        
        // Don't show toast here as this is called frequently during editing
        // Toast will be shown when the user saves the profile
      }, STATE_RESTORATION_DELAY_MS); // Small delay to ensure column definitions are fully applied
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