import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createExcelFormatter } from '../utils/formatters';

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
        
        // Only log if wrap properties are being saved
        const wrapProps = ['wrapText', 'autoHeight', 'wrapHeaderText', 'autoHeaderHeight'];
        const savedWrapProps = includedProperties.filter(prop => wrapProps.includes(prop));
        
        if (savedWrapProps.length > 0) {
          console.log('[ColumnTemplateStore] Saving template with wrap properties:', {
            name,
            savedWrapProps,
            wrapText: settings.wrapText,
            autoHeight: settings.autoHeight,
            wrapHeaderText: settings.wrapHeaderText,
            autoHeaderHeight: settings.autoHeaderHeight
          });
        }
        
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

        // Only log if template contains wrap properties
        const wrapProps = ['wrapText', 'autoHeight', 'wrapHeaderText', 'autoHeaderHeight'];
        const templateWrapProps = template.includedProperties.filter(prop => wrapProps.includes(prop));
        
        if (templateWrapProps.length > 0) {
          console.log('[ColumnTemplateStore] Applying template with wrap properties:', {
            templateName: template.name,
            templateWrapProps,
            wrapText: template.settings.wrapText,
            autoHeight: template.settings.autoHeight,
            wrapHeaderText: template.settings.wrapHeaderText,
            autoHeaderHeight: template.settings.autoHeaderHeight
          });
        }

        // Record usage
        get().recordTemplateUse(templateId);

        // Return only the properties that were included in the template
        const appliedSettings: Record<string, any> = {};
        template.includedProperties.forEach(prop => {
          if (prop in template.settings) {
            const value = template.settings[prop];
            
            // Convert string formatter shortcuts to actual formatter functions
            if (prop === 'valueFormatter') {
              if (typeof value === 'string') {
                let formatter;
                switch (value) {
                  case 'currency':
                    formatter = createExcelFormatter('$#,##0.00');
                    break;
                  case 'percentage':
                    formatter = createExcelFormatter('0.00%');
                    break;
                  case 'date':
                    formatter = createExcelFormatter('MM/DD/YYYY');
                    break;
                  default:
                    // If it's a format string (contains brackets or format codes), create formatter
                    if (value.includes('[') || value.includes('#') || value.includes('0') || value.includes('"')) {
                      console.log('[ColumnTemplateStore] Creating formatter from format string:', value);
                      formatter = createExcelFormatter(value);
                    } else {
                      // Otherwise, just use it as is
                      formatter = value;
                    }
                }
                appliedSettings[prop] = formatter;
              } else if (value && typeof value === 'object' && value._isFormatterConfig) {
                // Restore formatter from saved configuration
                if (value.type === 'excel' && value.formatString) {
                  console.log('[ColumnTemplateStore] Creating formatter from config:', {
                    templateName: template.name,
                    prop,
                    formatString: value.formatString,
                    configObject: value
                  });
                  const formatter = createExcelFormatter(value.formatString);
                  console.log('[ColumnTemplateStore] Created formatter:', {
                    isFunction: typeof formatter === 'function',
                    hasFormatString: !!(formatter as any).__formatString,
                    actualFormatString: (formatter as any).__formatString
                  });
                  // CRITICAL: Make sure we're setting a function
                  if (typeof formatter !== 'function') {
                    console.error('[ColumnTemplateStore] ERROR: createExcelFormatter did not return a function!');
                  }
                  appliedSettings[prop] = formatter;
                } else {
                  console.warn('[ColumnTemplateStore] Formatter config missing type or formatString:', value);
                }
              } else {
                appliedSettings[prop] = value;
              }
            } else if (prop === 'headerStyle' && value && typeof value === 'object' && value._isHeaderStyleConfig) {
              // Restore headerStyle function from saved configuration
              const headerStyleConfig = value;
              appliedSettings[prop] = (params: any) => {
                return params.floatingFilter ? headerStyleConfig.floating : headerStyleConfig.regular;
              };
              // Mark the function with the config for future saves
              (appliedSettings[prop] as any)._isHeaderStyleConfig = true;
              (appliedSettings[prop] as any).regular = headerStyleConfig.regular;
              (appliedSettings[prop] as any).floating = headerStyleConfig.floating;
            } else if (prop === 'cellStyle' && value && typeof value === 'object') {
              // For cellStyle, if it's an object (not a function), use it directly
              appliedSettings[prop] = value;
            } else {
              // For all other properties, apply as-is
              appliedSettings[prop] = value;
            }
          }
        });

        // Only log if returning wrap properties
        const returnedWrapProps = ['wrapText', 'autoHeight', 'wrapHeaderText', 'autoHeaderHeight']
          .filter(prop => prop in appliedSettings);
        
        if (returnedWrapProps.length > 0) {
          console.log('[ColumnTemplateStore] Returning wrap properties:', {
            templateName: template.name,
            returnedWrapProps,
            wrapText: appliedSettings.wrapText,
            autoHeight: appliedSettings.autoHeight,
            wrapHeaderText: appliedSettings.wrapHeaderText,
            autoHeaderHeight: appliedSettings.autoHeaderHeight
          });
        }
        
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

// Default templates - use string shortcuts that will be converted to formatters
export const DEFAULT_TEMPLATES: Omit<ColumnTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '💰 Currency Format',
    description: 'Format numbers as currency with right alignment and styling',
    settings: {
      // Styling
      cellClass: 'ag-currency-cell text-right',
      cellStyle: { fontWeight: 'bold', color: '#2e7d32' },
      headerClass: 'text-right',
      // Formatting - using emoji-rich format
      valueFormatter: {
        _isFormatterConfig: true,
        type: 'excel',
        formatString: '[Green][>0]💰 $#,##0.00;[Red][<0]💸 ($#,##0.00);$0.00'
      },
      // Filter
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      // Size
      width: 120,
      minWidth: 100,
      // Editor
      editable: true,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: { precision: 2 }
    } as Record<string, any>,
    includedProperties: ['cellClass', 'cellStyle', 'headerClass', 'valueFormatter', 'filter', 'floatingFilter', 'width', 'minWidth', 'editable', 'cellEditor', 'cellEditorParams']
  },
  {
    name: '📊 Percentage Format',
    description: 'Format numbers as percentages with visual indicators',
    settings: {
      // Styling
      cellClass: 'ag-percentage-cell text-center',
      headerClass: 'text-center',
      // Formatting with visual indicators
      valueFormatter: {
        _isFormatterConfig: true,
        type: 'excel',
        formatString: '[Green][>0.1]📈 0.00%;[Red][<-0.1]📉 0.00%;0.00%'
      },
      // Filter
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      // Size
      width: 100,
      // Editor
      editable: true,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: { precision: 2 }
    } as Record<string, any>,
    includedProperties: ['cellClass', 'headerClass', 'valueFormatter', 'filter', 'floatingFilter', 'width', 'editable', 'cellEditor', 'cellEditorParams']
  },
  {
    name: '📅 Date Format',
    description: 'Standard date formatting with calendar picker',
    settings: {
      // Styling
      cellClass: 'ag-date-cell',
      // Formatting
      valueFormatter: 'date', // Will be converted to createExcelFormatter('MM/DD/YYYY')
      // Filter
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      filterParams: {
        comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
          const cellDate = new Date(cellValue);
          if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
            return 0;
          }
          if (cellDate < filterLocalDateAtMidnight) {
            return -1;
          }
          if (cellDate > filterLocalDateAtMidnight) {
            return 1;
          }
          return 0;
        }
      },
      // Size
      width: 120,
      // Editor
      editable: true,
      cellEditor: 'agDateCellEditor'
    } as Record<string, any>,
    includedProperties: ['cellClass', 'valueFormatter', 'filter', 'floatingFilter', 'filterParams', 'width', 'editable', 'cellEditor']
  },
  {
    name: '✏️ Editable Text',
    description: 'Enable editing with text editor and search filter',
    settings: {
      // Editor
      editable: true,
      cellEditor: 'agTextCellEditor',
      singleClickEdit: true,
      // Filter
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      filterParams: {
        filterOptions: ['contains', 'notContains', 'equals', 'notEqual', 'startsWith', 'endsWith'],
        defaultOption: 'contains'
      },
      // Size
      resizable: true,
      // Styling
      wrapText: true,
      autoHeight: true
    } as Record<string, any>,
    includedProperties: ['editable', 'cellEditor', 'singleClickEdit', 'filter', 'floatingFilter', 'filterParams', 'resizable', 'wrapText', 'autoHeight']
  },
  {
    name: '🔒 Read-only Locked',
    description: 'Non-editable, position locked column with gray background',
    settings: {
      // Editor
      editable: false,
      // Position
      lockPosition: true,
      lockVisible: true,
      pinned: 'left',
      // Size
      resizable: false,
      // Styling
      cellClass: 'ag-readonly-cell',
      cellStyle: { backgroundColor: '#f5f5f5', color: '#666' },
      headerStyle: {
        _isHeaderStyleConfig: true,
        regular: { backgroundColor: '#e0e0e0' },
        floating: { backgroundColor: '#e0e0e0' }
      }
    } as Record<string, any>,
    includedProperties: ['editable', 'lockPosition', 'lockVisible', 'pinned', 'resizable', 'cellClass', 'cellStyle', 'headerStyle']
  },
  {
    name: '📝 Wrapped Text',
    description: 'Enable text wrapping with auto height for long content',
    settings: {
      // Text wrapping
      wrapText: true,
      autoHeight: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      // Size
      minWidth: 150,
      maxWidth: 300,
      // Editor
      editable: true,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorPopup: true,
      cellEditorParams: {
        maxLength: 500,
        rows: 10,
        cols: 50
      }
    } as Record<string, any>,
    includedProperties: ['wrapText', 'autoHeight', 'wrapHeaderText', 'autoHeaderHeight', 'minWidth', 'maxWidth', 'editable', 'cellEditor', 'cellEditorPopup', 'cellEditorParams']
  },
  {
    name: '🔢 Numeric Column',
    description: 'Right-aligned numeric column with number filter',
    settings: {
      // Type
      type: 'numericColumn',
      // Styling
      cellClass: 'ag-numeric-cell text-right',
      headerClass: 'text-right',
      // Filter
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      filterParams: {
        filterOptions: ['equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'inRange'],
        defaultOption: 'greaterThan'
      },
      // Editor
      editable: true,
      cellEditor: 'agNumberCellEditor',
      // Size
      width: 100
    } as Record<string, any>,
    includedProperties: ['type', 'cellClass', 'headerClass', 'filter', 'floatingFilter', 'filterParams', 'editable', 'cellEditor', 'width']
  },
  {
    name: '🚦 Traffic Light Status',
    description: 'Visual status indicator with traffic light colors',
    settings: {
      // Styling
      cellClass: 'text-center',
      headerClass: 'text-center',
      // Formatting
      valueFormatter: {
        _isFormatterConfig: true,
        type: 'excel',
        formatString: '[Red][<50]🔴 0;[Yellow][<80]🟡 0;[Green]🟢 0'
      },
      // Filter
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      // Size
      width: 100
    } as Record<string, any>,
    includedProperties: ['cellClass', 'headerClass', 'valueFormatter', 'filter', 'floatingFilter', 'width']
  },
  {
    name: '😊 Emoji Status',
    description: 'Show emoji based on positive/negative/zero values',
    settings: {
      // Styling
      cellClass: 'text-center',
      headerClass: 'text-center',
      // Formatting
      valueFormatter: {
        _isFormatterConfig: true,
        type: 'excel',
        formatString: '[<0]😟 0;[=0]😐 0;😊 0'
      },
      // Filter
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      // Size
      width: 80
    } as Record<string, any>,
    includedProperties: ['cellClass', 'headerClass', 'valueFormatter', 'filter', 'floatingFilter', 'width']
  },
  {
    name: '⭐ Star Rating',
    description: 'Display values as star ratings (0-5)',
    settings: {
      // Styling
      cellClass: 'text-center',
      headerClass: 'text-center',
      // Formatting
      valueFormatter: {
        _isFormatterConfig: true,
        type: 'excel',
        formatString: '[<1]☆☆☆☆☆;[<2]★☆☆☆☆;[<3]★★☆☆☆;[<4]★★★☆☆;[<5]★★★★☆;★★★★★'
      },
      // Filter
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      // Size
      width: 120
    } as Record<string, any>,
    includedProperties: ['cellClass', 'headerClass', 'valueFormatter', 'filter', 'floatingFilter', 'width']
  }
];