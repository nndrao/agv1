/**
 * REFACTORED VERSION - Use domain-specific stores
 * 
 * This file re-exports the unified store hook for backward compatibility.
 * Components should gradually migrate to use the domain-specific stores directly.
 * 
 * Migration guide:
 * - For UI state only: use useUIPreferencesStore()
 * - For selection only: use useColumnSelectionStore()
 * - For column data: use useColumnDataStore()
 * - For full compatibility: use useColumnFormattingStore()
 */

export { useUnifiedColumnFormattingStore as useColumnFormattingStore } from './useUnifiedStore';
export * from './useUnifiedStore';

// Re-export types for compatibility
export type { ColDef } from './domains/columnData.store';
export type { 
  DialogState, 
  DialogActions, 
  ColumnFormattingStore 
} from './columnFormatting.store';