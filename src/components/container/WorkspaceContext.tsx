import React, { createContext, useContext, ReactNode } from 'react';
import { useWorkspaceStore, Workspace } from './stores/workspace.store';

interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspace: Workspace | undefined;
  createWorkspace: (name: string, description?: string) => Workspace;
  setActiveWorkspace: (id: string) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const store = useWorkspaceStore();

  const value: WorkspaceContextValue = {
    workspaces: store.workspaces,
    activeWorkspace: store.getActiveWorkspace(),
    createWorkspace: store.createWorkspace,
    setActiveWorkspace: store.setActiveWorkspace,
    updateWorkspace: store.updateWorkspace,
    deleteWorkspace: store.deleteWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};