import { create } from 'zustand';

export interface OperationProgress {
  id: string;
  type: 'bulk-update' | 'apply-changes' | 'clear-customizations' | 'template-application';
  message: string;
  current: number;
  total: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  error?: string;
  startTime: number;
  endTime?: number;
}

interface OperationProgressState {
  operations: Map<string, OperationProgress>;
  activeOperationId: string | null;
}

interface OperationProgressActions {
  // Start a new operation
  startOperation: (id: string, type: OperationProgress['type'], message: string, total: number) => void;
  
  // Update progress
  updateProgress: (id: string, current: number, message?: string) => void;
  
  // Complete operation
  completeOperation: (id: string, message?: string) => void;
  
  // Fail operation
  failOperation: (id: string, error: string) => void;
  
  // Clear completed operations
  clearCompleted: () => void;
  
  // Get active operation
  getActiveOperation: () => OperationProgress | null;
  
  // Check if any operation is in progress
  hasActiveOperations: () => boolean;
}

export type OperationProgressStore = OperationProgressState & OperationProgressActions;

export const useOperationProgressStore = create<OperationProgressStore>((set, get) => ({
  operations: new Map(),
  activeOperationId: null,

  startOperation: (id, type, message, total) => {
    set((state) => {
      const newOperations = new Map(state.operations);
      newOperations.set(id, {
        id,
        type,
        message,
        current: 0,
        total,
        status: 'in-progress',
        startTime: Date.now(),
      });
      return {
        operations: newOperations,
        activeOperationId: id,
      };
    });
  },

  updateProgress: (id, current, message) => {
    set((state) => {
      const operation = state.operations.get(id);
      if (!operation) return state;

      const newOperations = new Map(state.operations);
      newOperations.set(id, {
        ...operation,
        current,
        message: message || operation.message,
      });
      return { operations: newOperations };
    });
  },

  completeOperation: (id, message) => {
    set((state) => {
      const operation = state.operations.get(id);
      if (!operation) return state;

      const newOperations = new Map(state.operations);
      newOperations.set(id, {
        ...operation,
        status: 'completed',
        current: operation.total,
        message: message || `${operation.message} - Completed`,
        endTime: Date.now(),
      });
      
      return {
        operations: newOperations,
        activeOperationId: state.activeOperationId === id ? null : state.activeOperationId,
      };
    });

    // Auto-clear after 3 seconds
    setTimeout(() => {
      const state = get();
      const operation = state.operations.get(id);
      if (operation?.status === 'completed') {
        set((state) => {
          const newOperations = new Map(state.operations);
          newOperations.delete(id);
          return { operations: newOperations };
        });
      }
    }, 3000);
  },

  failOperation: (id, error) => {
    set((state) => {
      const operation = state.operations.get(id);
      if (!operation) return state;

      const newOperations = new Map(state.operations);
      newOperations.set(id, {
        ...operation,
        status: 'failed',
        error,
        endTime: Date.now(),
      });
      
      return {
        operations: newOperations,
        activeOperationId: state.activeOperationId === id ? null : state.activeOperationId,
      };
    });
  },

  clearCompleted: () => {
    set((state) => {
      const newOperations = new Map();
      state.operations.forEach((op, id) => {
        if (op.status === 'pending' || op.status === 'in-progress') {
          newOperations.set(id, op);
        }
      });
      return { operations: newOperations };
    });
  },

  getActiveOperation: () => {
    const state = get();
    if (!state.activeOperationId) return null;
    return state.operations.get(state.activeOperationId) || null;
  },

  hasActiveOperations: () => {
    const state = get();
    for (const operation of state.operations.values()) {
      if (operation.status === 'in-progress') {
        return true;
      }
    }
    return false;
  },
}));

// Helper hook for tracking a specific operation
export function useOperationTracker(operationId: string) {
  const store = useOperationProgressStore();
  const operation = store.operations.get(operationId);
  
  return {
    operation,
    isActive: operation?.status === 'in-progress',
    progress: operation ? (operation.current / operation.total) * 100 : 0,
    elapsed: operation ? Date.now() - operation.startTime : 0,
  };
}