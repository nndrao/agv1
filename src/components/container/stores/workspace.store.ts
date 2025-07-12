import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PanelInfo {
  id: string;
  title: string;
  type: 'dataTable' | 'dashboard' | 'report' | 'chart';
  createdAt: number;
  params?: any; // Store panel-specific parameters
  isOpen: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  // Layout configuration
  layout?: {
    panels?: any[]; // Dockview panel configuration
    activePanel?: string;
  };
  // Open tabs/views
  openViews?: {
    id: string;
    type: 'table' | 'dashboard' | 'report' | 'settings';
    title: string;
    config?: any;
  }[];
  // Panel tracking
  allPanels?: PanelInfo[]; // All panels ever created
}

interface WorkspaceStore {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  hasUnsavedChanges: boolean;
  
  // Actions
  createWorkspace: (name: string, description?: string) => Workspace;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  setActiveWorkspace: (id: string) => void;
  getActiveWorkspace: () => Workspace | undefined;
  
  // Layout management
  saveLayout: (layout: any) => void;
  saveOpenViews: (views: Workspace['openViews']) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  
  // Panel tracking
  trackPanel: (panel: PanelInfo) => void;
  markPanelClosed: (panelId: string) => void;
  markPanelOpen: (panelId: string) => void;
  getClosedPanels: () => PanelInfo[];
  getAllPanels: () => PanelInfo[];
  getPanelInfo: (panelId: string) => PanelInfo | undefined;
}

const DEFAULT_WORKSPACE_ID = 'default-workspace';

const createDefaultWorkspace = (): Workspace => ({
  id: DEFAULT_WORKSPACE_ID,
  name: 'Default Workspace',
  description: 'Default workspace',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  layout: {},
  openViews: [],
  allPanels: [],
});

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [createDefaultWorkspace()],
      activeWorkspaceId: DEFAULT_WORKSPACE_ID,
      hasUnsavedChanges: false,
      
      createWorkspace: (name, description) => {
        const newWorkspace: Workspace = {
          id: `workspace-${Date.now()}`,
          name,
          description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          layout: {},
          openViews: [],
          allPanels: [],
        };
        
        set((state) => ({
          workspaces: [...state.workspaces, newWorkspace],
        }));
        
        return newWorkspace;
      },
      
      updateWorkspace: (id, updates) => {
        set((state) => ({
          workspaces: state.workspaces.map((workspace) =>
            workspace.id === id
              ? { ...workspace, ...updates, updatedAt: Date.now() }
              : workspace
          ),
        }));
      },
      
      deleteWorkspace: (id) => {
        // Cannot delete default workspace
        if (id === DEFAULT_WORKSPACE_ID) {
          console.warn('Cannot delete default workspace');
          return;
        }
        
        const { activeWorkspaceId } = get();
        
        // If deleting active workspace, switch to default
        if (id === activeWorkspaceId) {
          set({ activeWorkspaceId: DEFAULT_WORKSPACE_ID });
        }
        
        set((state) => ({
          workspaces: state.workspaces.filter((w) => w.id !== id),
        }));
      },
      
      setActiveWorkspace: (id) => {
        const { workspaces } = get();
        const workspaceExists = workspaces.some((w) => w.id === id);
        
        if (workspaceExists) {
          set({ activeWorkspaceId: id });
        } else {
          console.warn(`Workspace ${id} not found`);
        }
      },
      
      getActiveWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get();
        return workspaces.find((w) => w.id === activeWorkspaceId);
      },
      
      saveLayout: (layout) => {
        const { activeWorkspaceId } = get();
        get().updateWorkspace(activeWorkspaceId, { layout });
        set({ hasUnsavedChanges: false });
      },
      
      saveOpenViews: (views) => {
        const { activeWorkspaceId } = get();
        get().updateWorkspace(activeWorkspaceId, { openViews: views });
      },
      
      setHasUnsavedChanges: (hasChanges) => {
        set({ hasUnsavedChanges: hasChanges });
      },
      
      // Panel tracking methods
      trackPanel: (panel) => {
        const { activeWorkspaceId } = get();
        get().updateWorkspace(activeWorkspaceId, {
          allPanels: [
            ...(get().getActiveWorkspace()?.allPanels || []).filter(p => p.id !== panel.id),
            panel
          ]
        });
      },
      
      markPanelClosed: (panelId) => {
        const { activeWorkspaceId } = get();
        const workspace = get().getActiveWorkspace();
        if (!workspace) return;
        
        const updatedPanels = workspace.allPanels?.map(p => 
          p.id === panelId ? { ...p, isOpen: false } : p
        ) || [];
        
        get().updateWorkspace(activeWorkspaceId, { allPanels: updatedPanels });
      },
      
      markPanelOpen: (panelId) => {
        const { activeWorkspaceId } = get();
        const workspace = get().getActiveWorkspace();
        if (!workspace) return;
        
        const updatedPanels = workspace.allPanels?.map(p => 
          p.id === panelId ? { ...p, isOpen: true } : p
        ) || [];
        
        get().updateWorkspace(activeWorkspaceId, { allPanels: updatedPanels });
      },
      
      getClosedPanels: () => {
        const workspace = get().getActiveWorkspace();
        return workspace?.allPanels?.filter(p => !p.isOpen) || [];
      },
      
      getAllPanels: () => {
        const workspace = get().getActiveWorkspace();
        return workspace?.allPanels || [];
      },
      
      getPanelInfo: (panelId) => {
        const workspace = get().getActiveWorkspace();
        return workspace?.allPanels?.find(p => p.id === panelId);
      },
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
        // Don't persist hasUnsavedChanges
      }),
    }
  )
);