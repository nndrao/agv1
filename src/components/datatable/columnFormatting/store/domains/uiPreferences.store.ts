import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storageAdapter } from '@/lib/storage/storageAdapter';

export interface UIPreferencesState {
  // Tab navigation
  activeTab: string;
  
  // View preferences
  showOnlyCommon: boolean;
  compareMode: boolean;
  searchTerm: string;
  cellDataTypeFilter: string;
  visibilityFilter: 'all' | 'visible' | 'hidden';
  uiMode: 'simple' | 'advanced';
  showPreviewPane: boolean;
  
  // Collapsed sections tracking
  collapsedSections: Set<string>;
  
  // Quick format preferences
  quickFormatPinned: string[];
  
  // Panel states
  bulkActionsPanelCollapsed: boolean;
  showColumnDrawer: boolean;
}

export interface UIPreferencesActions {
  // Tab navigation
  setActiveTab: (tab: string) => void;
  
  // View preferences
  setShowOnlyCommon: (show: boolean) => void;
  setCompareMode: (compare: boolean) => void;
  setSearchTerm: (term: string) => void;
  setCellDataTypeFilter: (filter: string) => void;
  setVisibilityFilter: (filter: 'all' | 'visible' | 'hidden') => void;
  setUiMode: (mode: 'simple' | 'advanced') => void;
  setShowPreviewPane: (show: boolean) => void;
  
  // Collapsed sections
  toggleSectionCollapse: (section: string) => void;
  
  // Quick format preferences
  setQuickFormatPinned: (formats: string[]) => void;
  toggleQuickFormat: (format: string) => void;
  
  // Panel states
  setBulkActionsPanelCollapsed: (collapsed: boolean) => void;
  setShowColumnDrawer: (show: boolean) => void;
  
  // Reset UI state
  resetUIState: () => void;
}

export type UIPreferencesStore = UIPreferencesState & UIPreferencesActions;

const initialState: UIPreferencesState = {
  activeTab: 'general',
  showOnlyCommon: false,
  compareMode: false,
  searchTerm: '',
  cellDataTypeFilter: 'all',
  visibilityFilter: 'all',
  uiMode: 'simple',
  showPreviewPane: false,
  collapsedSections: new Set<string>(),
  quickFormatPinned: [],
  bulkActionsPanelCollapsed: false,
  showColumnDrawer: false,
};

export const useUIPreferencesStore = create<UIPreferencesStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Tab navigation
      setActiveTab: (tab) => set({ activeTab: tab }),

      // View preferences
      setShowOnlyCommon: (show) => set({ showOnlyCommon: show }),
      setCompareMode: (compare) => set({ compareMode: compare }),
      setSearchTerm: (term) => set({ searchTerm: term }),
      setCellDataTypeFilter: (filter) => set({ cellDataTypeFilter: filter }),
      setVisibilityFilter: (filter) => set({ visibilityFilter: filter }),
      setUiMode: (mode) => set({ uiMode: mode }),
      setShowPreviewPane: (show) => set({ showPreviewPane: show }),

      // Collapsed sections
      toggleSectionCollapse: (section) => set((state) => {
        const newCollapsed = new Set(state.collapsedSections);
        if (newCollapsed.has(section)) {
          newCollapsed.delete(section);
        } else {
          newCollapsed.add(section);
        }
        return { collapsedSections: newCollapsed };
      }),

      // Quick format preferences
      setQuickFormatPinned: (formats) => set({ quickFormatPinned: formats }),
      toggleQuickFormat: (format) => set((state) => {
        const pinned = [...state.quickFormatPinned];
        const index = pinned.indexOf(format);
        if (index > -1) {
          pinned.splice(index, 1);
        } else {
          pinned.push(format);
        }
        return { quickFormatPinned: pinned };
      }),

      // Panel states
      setBulkActionsPanelCollapsed: (collapsed) => set({ bulkActionsPanelCollapsed: collapsed }),
      setShowColumnDrawer: (show) => set({ showColumnDrawer: show }),

      // Reset UI state
      resetUIState: () => set(initialState),
    }),
    {
      name: 'column-formatting-ui-preferences',
      storage: {
        getItem: async (name: string) => {
          const value = await storageAdapter.get(name);
          return value;
        },
        setItem: async (name: string, value: any) => {
          await storageAdapter.set(name, value);
        },
        removeItem: async (name: string) => {
          await storageAdapter.remove(name);
        },
      } as any,
      partialize: (state) => ({
        activeTab: state.activeTab,
        uiMode: state.uiMode,
        showPreviewPane: state.showPreviewPane,
        quickFormatPinned: state.quickFormatPinned,
        bulkActionsPanelCollapsed: state.bulkActionsPanelCollapsed,
        visibilityFilter: state.visibilityFilter,
      }),
    }
  )
);