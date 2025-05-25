import { useCallback } from 'react';
import { GridApi, ColDef } from 'ag-grid-community';
import { useColumnCustomizationStore } from '../store/column-customization.store';

export function useColumnCustomization(gridApi: GridApi, onColumnDefsChange?: (columnDefs: any[]) => void) {
  const pendingChanges = useColumnCustomizationStore(state => state.pendingChanges);
  const applyMode = useColumnCustomizationStore(state => state.applyMode);
  const applyChangesStore = useColumnCustomizationStore(state => state.applyChanges);

  // Apply changes to grid
  const applyChangesToGrid = useCallback(() => {
    const changesArray = Array.from(pendingChanges.entries());
    console.log('Applying changes:', { 
      pendingChanges: changesArray,
      applyMode,
      changesDetail: changesArray.map(([colId, changes]) => ({ colId, changes }))
    });
    
    if (pendingChanges.size === 0) {
      console.log('No pending changes to apply');
      return;
    }

    // Get current column definitions
    const currentColumnDefs = gridApi.getColumnDefs() || [];
    const updatedColumnDefs: ColDef[] = [];

    currentColumnDefs.forEach(currentDef => {
      const colId = currentDef.field || currentDef.colId || '';
      const changes = pendingChanges.get(colId);

      if (changes) {
        console.log(`Applying changes for column ${colId}:`, changes);
        // Apply changes based on mode
        let updatedDef: ColDef;
        
        if (applyMode === 'override') {
          updatedDef = { ...currentDef, ...changes };
          console.log(`Updated def for ${colId}:`, updatedDef);
        } else if (applyMode === 'merge') {
          updatedDef = { ...currentDef };
          Object.entries(changes).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              (updatedDef as Record<string, unknown>)[key] = value;
            }
          });
        } else if (applyMode === 'empty') {
          updatedDef = { ...currentDef };
          Object.entries(changes).forEach(([key, value]) => {
            if ((currentDef as Record<string, unknown>)[key] === undefined) {
              (updatedDef as Record<string, unknown>)[key] = value;
            }
          });
        } else {
          updatedDef = { ...currentDef, ...changes };
        }

        updatedColumnDefs.push(updatedDef);
      } else {
        updatedColumnDefs.push(currentDef);
      }
    });

    // Apply the updated definitions to the grid
    console.log('Setting column defs:', updatedColumnDefs);
    
    // Update the column definitions in both the parent component and AG-Grid
    if (onColumnDefsChange) {
      onColumnDefsChange(updatedColumnDefs);
    } else {
      // Fallback to direct AG-Grid update
      gridApi.setColumnDefs(updatedColumnDefs);
    }
    
    // Clear pending changes after applying
    applyChangesStore();
  }, [gridApi, pendingChanges, applyMode, applyChangesStore, onColumnDefsChange]);

  return {
    applyChanges: applyChangesToGrid
  };
}