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
        // Get column state BEFORE applying changes
        const columnStateBefore = gridApiRef.current.getColumnState();
        const visibleColumnsBefore = columnStateBefore.filter(col => !col.hide);
        console.log('[useColumnOperations] BEFORE applying column definitions:', {
          totalColumns: columnStateBefore.length,
          visibleColumns: visibleColumnsBefore.length,
          hiddenColumns: columnStateBefore.length - visibleColumnsBefore.length,
          visibleColumnIds: visibleColumnsBefore.map(col => col.colId)
        });
        
        // Clean column definitions to remove ALL stateful properties
        // According to AG-Grid docs, these should NEVER be in column definitions
        const statefulProperties = [
          'width', 'initialWidth', 
          'sort', 'initialSort', 
          'sortIndex', 'initialSortIndex',
          'hide', 'initialHide',
          'pinned', 'initialPinned',
          'rowGroup', 'initialRowGroup',
          'rowGroupIndex', 'initialRowGroupIndex',
          'pivot', 'initialPivot',
          'pivotIndex', 'initialPivotIndex',
          'aggFunc', 'initialAggFunc',
          'flex', 'initialFlex',
          'filter' // Filter state is managed through filter API
        ];
        
        // Create clean column definitions without stateful properties
        const cleanColumns = columns.map(col => {
          const cleanCol = { ...col };
          
          // Remove all stateful properties
          statefulProperties.forEach(prop => {
            if (prop in cleanCol) {
              console.log(`[useColumnOperations] Removing stateful property '${prop}' from column:`, col.field || col.colId);
              delete (cleanCol as any)[prop];
            }
          });
          
          return cleanCol;
        });
        
        console.log('[useColumnOperations] Applying CLEAN column definitions to grid:', {
          columnsCount: cleanColumns.length,
          hasCustomizations: cleanColumns.some(col => col.cellStyle || col.valueFormatter || col.cellClass),
          sampleColumn: cleanColumns[0]
        });
        
        // Update the column definitions with cleaned versions
        gridApiRef.current.setGridOption('columnDefs', cleanColumns);
        
        // IMPORTANT: Restore the column state that existed before applying changes
        // This preserves visibility, width, order, etc.
        console.log('[useColumnOperations] Restoring column state to preserve visibility');
        gridApiRef.current.applyColumnState({
          state: columnStateBefore,
          applyOrder: true
        });
        
        // Verify the columns were set and check state AFTER
        setTimeout(() => {
          const currentCols = gridApiRef.current?.getColumnDefs();
          const columnStateAfter = gridApiRef.current?.getColumnState() || [];
          const visibleColumnsAfter = columnStateAfter.filter(col => !col.hide);
          
          console.log('[useColumnOperations] AFTER setGridOption and state restore:', {
            currentColsCount: currentCols?.length,
            hasCustomizations: currentCols?.some((col: any) => col.cellStyle || col.valueFormatter || col.cellClass),
            totalColumns: columnStateAfter.length,
            visibleColumns: visibleColumnsAfter.length,
            hiddenColumns: columnStateAfter.length - visibleColumnsAfter.length,
            visibleColumnIds: visibleColumnsAfter.map(col => col.colId),
            visibilityChanged: visibleColumnsBefore.length !== visibleColumnsAfter.length
          });
          
          if (visibleColumnsBefore.length !== visibleColumnsAfter.length) {
            console.warn('[useColumnOperations] VISIBILITY CHANGED!', {
              before: visibleColumnsBefore.length,
              after: visibleColumnsAfter.length,
              difference: visibleColumnsAfter.length - visibleColumnsBefore.length
            });
          }
        }, 10);
        
        // Apply the column state from the active profile
        // TEMPORARILY DISABLED to test column behavior without state application
        /*
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
        */
        console.log('[useColumnOperations] Column state application DISABLED for testing');
        
        // Apply sort model from profile
        if (activeProfile && activeProfile.gridState?.sortModel && activeProfile.gridState.sortModel.length > 0) {
          const sortState = activeProfile.gridState.sortModel.map(sort => ({
            colId: sort.colId,
            sort: sort.sort,
            sortIndex: (sort as any).sortIndex
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
    
    // Normalize column definitions (ensure field and headerName are set)
    const normalizedColumns = updatedColumns.map((col) => {
      if (col.field && col.headerName) {
        return col as ColumnDef;
      }
      
      return {
        ...col,
        field: col.field || '',
        headerName: col.headerName || col.field || ''
      };
    });
    
    // Update React state ONCE
    setCurrentColumnDefs(normalizedColumns);
    
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