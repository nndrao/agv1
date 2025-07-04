import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ColumnTemplate {
  id: string;
  name: string;
  description?: string;
  template: any; // Template configuration
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
}

interface ColumnTemplateStore {
  templates: ColumnTemplate[];
  recentlyUsed: string[]; // Template IDs
  
  // Actions
  saveTemplate: (template: ColumnTemplate) => void;
  updateTemplate: (id: string, updates: Partial<ColumnTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => ColumnTemplate | undefined;
  markAsUsed: (id: string) => void;
}

export const useColumnTemplateStore = create<ColumnTemplateStore>()(
  persist(
    (set, get) => ({
      templates: [],
      recentlyUsed: [],
      
      saveTemplate: (template) => {
        set((state) => ({
          templates: [...state.templates.filter(t => t.id !== template.id), template],
        }));
      },
      
      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },
      
      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          recentlyUsed: state.recentlyUsed.filter((tid) => tid !== id),
        }));
      },
      
      getTemplate: (id) => {
        return get().templates.find((t) => t.id === id);
      },
      
      markAsUsed: (id) => {
        set((state) => {
          const template = state.templates.find(t => t.id === id);
          if (template) {
            template.lastUsed = new Date().toISOString();
          }
          const recentlyUsed = [id, ...state.recentlyUsed.filter(tid => tid !== id)].slice(0, 10);
          return {
            templates: [...state.templates],
            recentlyUsed,
          };
        });
      },
    }),
    {
      name: 'column-template-store',
    }
  )
);