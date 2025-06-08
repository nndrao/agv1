import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ColumnTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  settings: Record<string, any>;
  // Track which properties are included in this template
  includedProperties: string[];
}

interface ColumnTemplateState {
  templates: ColumnTemplate[];
  recentTemplates: string[]; // IDs of recently used templates
}

interface ColumnTemplateActions {
  // Template management
  saveTemplate: (name: string, description: string, settings: Record<string, any>, includedProperties: string[]) => string;
  updateTemplate: (id: string, updates: Partial<ColumnTemplate>) => void;
  deleteTemplate: (id: string) => void;
  renameTemplate: (id: string, newName: string) => void;
  
  // Template usage
  getTemplate: (id: string) => ColumnTemplate | undefined;
  applyTemplate: (templateId: string) => Record<string, any> | null;
  recordTemplateUse: (templateId: string) => void;
  
  // Utilities
  getTemplatesByRecent: () => ColumnTemplate[];
  exportTemplates: () => string;
  importTemplates: (jsonString: string) => boolean;
}

export type ColumnTemplateStore = ColumnTemplateState & ColumnTemplateActions;

export const useColumnTemplateStore = create<ColumnTemplateStore>()(
  persist(
    (set, get) => ({
      // Initial state
      templates: [],
      recentTemplates: [],

      // Save a new template
      saveTemplate: (name, description, settings, includedProperties) => {
        const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newTemplate: ColumnTemplate = {
          id,
          name,
          description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          settings: { ...settings },
          includedProperties
        };

        set(state => ({
          templates: [...state.templates, newTemplate]
        }));

        return id;
      },

      // Update an existing template
      updateTemplate: (id, updates) => {
        set(state => ({
          templates: state.templates.map(template =>
            template.id === id
              ? { ...template, ...updates, updatedAt: Date.now() }
              : template
          )
        }));
      },

      // Delete a template
      deleteTemplate: (id) => {
        set(state => ({
          templates: state.templates.filter(t => t.id !== id),
          recentTemplates: state.recentTemplates.filter(tid => tid !== id)
        }));
      },

      // Rename a template
      renameTemplate: (id, newName) => {
        set(state => ({
          templates: state.templates.map(template =>
            template.id === id
              ? { ...template, name: newName, updatedAt: Date.now() }
              : template
          )
        }));
      },

      // Get a specific template
      getTemplate: (id) => {
        return get().templates.find(t => t.id === id);
      },

      // Apply a template and return the settings
      applyTemplate: (templateId) => {
        const template = get().getTemplate(templateId);
        if (!template) return null;

        // Record usage
        get().recordTemplateUse(templateId);

        // Return only the properties that were included in the template
        const appliedSettings: Record<string, any> = {};
        template.includedProperties.forEach(prop => {
          if (prop in template.settings) {
            appliedSettings[prop] = template.settings[prop];
          }
        });

        return appliedSettings;
      },

      // Record template usage for recent templates
      recordTemplateUse: (templateId) => {
        set(state => {
          const newRecent = [templateId, ...state.recentTemplates.filter(id => id !== templateId)];
          return {
            recentTemplates: newRecent.slice(0, 5) // Keep only 5 most recent
          };
        });
      },

      // Get templates sorted by recent usage
      getTemplatesByRecent: () => {
        const { templates, recentTemplates } = get();
        const recentSet = new Set(recentTemplates);
        
        // Sort templates: recent first, then by creation date
        return [...templates].sort((a, b) => {
          const aIsRecent = recentSet.has(a.id);
          const bIsRecent = recentSet.has(b.id);
          
          if (aIsRecent && !bIsRecent) return -1;
          if (!aIsRecent && bIsRecent) return 1;
          
          if (aIsRecent && bIsRecent) {
            // Both are recent, sort by recent order
            const aIndex = recentTemplates.indexOf(a.id);
            const bIndex = recentTemplates.indexOf(b.id);
            return aIndex - bIndex;
          }
          
          // Neither is recent, sort by creation date (newest first)
          return b.createdAt - a.createdAt;
        });
      },

      // Export templates as JSON
      exportTemplates: () => {
        const { templates } = get();
        return JSON.stringify(templates, null, 2);
      },

      // Import templates from JSON
      importTemplates: (jsonString) => {
        try {
          const imported = JSON.parse(jsonString);
          if (!Array.isArray(imported)) return false;

          // Validate and merge templates
          const validTemplates = imported.filter(t => 
            t.id && t.name && t.settings && Array.isArray(t.includedProperties)
          );

          set(state => ({
            templates: [...state.templates, ...validTemplates]
          }));

          return true;
        } catch (error) {
          console.error('Failed to import templates:', error);
          return false;
        }
      }
    }),
    {
      name: 'column-template-store',
      partialize: (state) => ({
        templates: state.templates,
        recentTemplates: state.recentTemplates
      })
    }
  )
);

// Default templates
export const DEFAULT_TEMPLATES: Omit<ColumnTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Currency Format',
    description: 'Format numbers as currency with right alignment',
    settings: {
      cellClass: 'ag-currency-cell text-right',
      valueFormatter: 'currency',
      filter: 'agNumberColumnFilter',
      width: 120
    } as Record<string, any>,
    includedProperties: ['cellClass', 'valueFormatter', 'filter', 'width']
  },
  {
    name: 'Percentage Format',
    description: 'Format numbers as percentages',
    settings: {
      cellClass: 'ag-percentage-cell text-right',
      valueFormatter: 'percentage',
      filter: 'agNumberColumnFilter',
      width: 100
    } as Record<string, any>,
    includedProperties: ['cellClass', 'valueFormatter', 'filter', 'width']
  },
  {
    name: 'Date Format',
    description: 'Standard date formatting',
    settings: {
      cellClass: 'ag-date-cell',
      valueFormatter: 'date',
      filter: 'agDateColumnFilter',
      width: 120
    } as Record<string, any>,
    includedProperties: ['cellClass', 'valueFormatter', 'filter', 'width']
  },
  {
    name: 'Editable Text',
    description: 'Enable editing with text editor',
    settings: {
      editable: true,
      cellEditor: 'agTextCellEditor',
      filter: 'agTextColumnFilter',
      floatingFilter: true
    } as Record<string, any>,
    includedProperties: ['editable', 'cellEditor', 'filter', 'floatingFilter']
  },
  {
    name: 'Read-only Locked',
    description: 'Non-editable, position locked column',
    settings: {
      editable: false,
      lockPosition: true,
      lockVisible: true,
      resizable: false
    } as Record<string, any>,
    includedProperties: ['editable', 'lockPosition', 'lockVisible', 'resizable']
  },
  {
    name: 'Wrapped Text',
    description: 'Enable text wrapping with auto height',
    settings: {
      wrapText: true,
      autoHeight: true,
      wrapHeaderText: true
    } as Record<string, any>,
    includedProperties: ['wrapText', 'autoHeight', 'wrapHeaderText']
  }
];