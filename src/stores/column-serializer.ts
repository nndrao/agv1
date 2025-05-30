import { ColDef } from 'ag-grid-community';
import { ColumnDef } from '@/components/datatable/data-table';
import { createExcelFormatter, createCellStyleFunction } from '@/components/datatable/utils/formatters';

// Type for serialized column customizations
export interface ColumnCustomization {
  // Identity
  field: string;
  
  // Basic properties (only if changed from defaults)
  headerName?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  
  // Boolean flags (only if changed from defaults)
  sortable?: boolean;
  resizable?: boolean;
  editable?: boolean;
  filter?: boolean;
  floatingFilter?: boolean;
  hide?: boolean;
  lockPosition?: boolean;
  lockVisible?: boolean;
  lockPinned?: boolean;
  suppressMenu?: boolean;
  
  // Positioning
  pinned?: 'left' | 'right' | null;
  
  // Styles (serialized format)
  cellStyle?: {
    type: 'static' | 'function';
    value?: React.CSSProperties;
    formatString?: string; // For conditional formatting
    baseStyle?: React.CSSProperties;
  };
  headerStyle?: {
    type: 'static' | 'function';
    regular?: React.CSSProperties;
    floating?: React.CSSProperties | null;
  };
  
  // CSS Classes
  cellClass?: string | string[];
  headerClass?: string | string[];
  
  // Formatters (metadata only)
  valueFormatter?: {
    type: 'excel' | 'custom';
    formatString?: string;
  };
  
  // Cell data type
  cellDataType?: 'text' | 'number' | 'date' | 'boolean';
  
  // Other commonly customized properties
  headerTooltip?: string;
  tooltipField?: string;
  headerCheckboxSelection?: boolean;
  checkboxSelection?: boolean;
  rowGroup?: boolean;
  pivot?: boolean;
  aggFunc?: string | null;
  
  // Alignment classes
  cellClassRules?: Record<string, any>;
}

// Default values for comparison
const COLUMN_DEFAULTS: Partial<ColDef> = {
  sortable: true,
  resizable: true,
  filter: true,
  floatingFilter: true,
  editable: false,
  hide: false,
  lockPosition: false,
  lockVisible: false,
  lockPinned: false,
  suppressMenu: false,
  flex: 1,
  minWidth: 100,
};

/**
 * Extract only the customized properties from a column definition
 */
function extractCustomizations(col: ColDef, baseCol?: ColDef): ColumnCustomization {
  const customization: ColumnCustomization = {
    field: col.field!,
  };
  
  // Compare against base column or defaults
  const compareBase = baseCol || COLUMN_DEFAULTS;
  
  // Basic properties
  if (col.headerName !== baseCol?.headerName && col.headerName !== col.field) {
    customization.headerName = col.headerName;
  }
  
  // Width properties
  if (col.width !== undefined && col.width !== compareBase.width) {
    customization.width = col.width;
  }
  if (col.minWidth !== undefined && col.minWidth !== compareBase.minWidth) {
    customization.minWidth = col.minWidth;
  }
  if (col.maxWidth !== undefined && col.maxWidth !== compareBase.maxWidth) {
    customization.maxWidth = col.maxWidth;
  }
  if (col.flex !== undefined && col.flex !== compareBase.flex) {
    customization.flex = col.flex;
  }
  
  // Boolean flags - only save if different from defaults
  if (col.sortable !== undefined && col.sortable !== compareBase.sortable) {
    customization.sortable = col.sortable;
  }
  if (col.resizable !== undefined && col.resizable !== compareBase.resizable) {
    customization.resizable = col.resizable;
  }
  if (col.editable !== undefined && col.editable !== compareBase.editable) {
    customization.editable = col.editable;
  }
  if (col.filter !== undefined && col.filter !== compareBase.filter) {
    customization.filter = col.filter;
  }
  if (col.floatingFilter !== undefined && col.floatingFilter !== compareBase.floatingFilter) {
    customization.floatingFilter = col.floatingFilter;
  }
  if (col.hide !== undefined && col.hide !== compareBase.hide) {
    customization.hide = col.hide;
  }
  if (col.lockPosition !== undefined && col.lockPosition !== compareBase.lockPosition) {
    customization.lockPosition = col.lockPosition;
  }
  if (col.lockVisible !== undefined && col.lockVisible !== compareBase.lockVisible) {
    customization.lockVisible = col.lockVisible;
  }
  if (col.lockPinned !== undefined && col.lockPinned !== compareBase.lockPinned) {
    customization.lockPinned = col.lockPinned;
  }
  if (col.suppressMenu !== undefined && col.suppressMenu !== compareBase.suppressMenu) {
    customization.suppressMenu = col.suppressMenu;
  }
  
  // Positioning
  if (col.pinned !== undefined && col.pinned !== null) {
    customization.pinned = col.pinned;
  }
  
  // Cell style
  if (col.cellStyle) {
    if (typeof col.cellStyle === 'function') {
      // Check if it has our metadata
      const metadata = (col.cellStyle as any).__formatString;
      const baseStyle = (col.cellStyle as any).__baseStyle;
      customization.cellStyle = {
        type: 'function',
        formatString: metadata,
        baseStyle: baseStyle
      };
    } else {
      customization.cellStyle = {
        type: 'static',
        value: col.cellStyle as React.CSSProperties
      };
    }
  }
  
  // Header style
  if (col.headerStyle) {
    if (typeof col.headerStyle === 'function') {
      // Try to extract the style config if it's our custom format
      const testRegular = (col.headerStyle as any)({ floatingFilter: false });
      const testFloating = (col.headerStyle as any)({ floatingFilter: true });
      
      customization.headerStyle = {
        type: 'function',
        regular: testRegular || undefined,
        floating: testFloating || undefined
      };
    } else if (typeof col.headerStyle === 'object') {
      const styleObj = col.headerStyle as any;
      if (styleObj._isHeaderStyleConfig) {
        customization.headerStyle = {
          type: 'function',
          regular: styleObj.regular,
          floating: styleObj.floating
        };
      } else {
        customization.headerStyle = {
          type: 'static',
          regular: col.headerStyle as React.CSSProperties
        };
      }
    }
  }
  
  // CSS Classes
  if (col.cellClass) {
    customization.cellClass = col.cellClass;
  }
  if (col.headerClass) {
    customization.headerClass = col.headerClass;
  }
  
  // Value formatter
  if (col.valueFormatter) {
    if (typeof col.valueFormatter === 'function') {
      const formatString = (col.valueFormatter as any).__formatString;
      const formatterType = (col.valueFormatter as any).__formatterType;
      
      if (formatString) {
        customization.valueFormatter = {
          type: formatterType || 'excel',
          formatString
        };
      }
    } else if (typeof col.valueFormatter === 'object') {
      // Handle saved formatter config
      const config = col.valueFormatter as any;
      if (config._isFormatterConfig) {
        customization.valueFormatter = {
          type: config.type,
          formatString: config.formatString
        };
      }
    }
  }
  
  // Cell data type
  if (col.cellDataType && col.cellDataType !== baseCol?.cellDataType) {
    customization.cellDataType = col.cellDataType;
  }
  
  // Other properties
  if (col.headerTooltip) customization.headerTooltip = col.headerTooltip;
  if (col.tooltipField) customization.tooltipField = col.tooltipField;
  if (col.headerCheckboxSelection !== undefined) customization.headerCheckboxSelection = col.headerCheckboxSelection;
  if (col.checkboxSelection !== undefined) customization.checkboxSelection = col.checkboxSelection;
  if (col.rowGroup !== undefined) customization.rowGroup = col.rowGroup;
  if (col.pivot !== undefined) customization.pivot = col.pivot;
  if (col.aggFunc !== undefined) customization.aggFunc = col.aggFunc;
  if (col.cellClassRules) customization.cellClassRules = col.cellClassRules;
  
  return customization;
}

/**
 * Serialize column customizations - only saves properties that differ from defaults
 */
export function serializeColumnCustomizations(
  columns: ColDef[], 
  baseColumns?: ColDef[]
): Record<string, ColumnCustomization> {
  const customizations: Record<string, ColumnCustomization> = {};
  
  columns.forEach((col, index) => {
    if (!col.field) return;
    
    const baseCol = baseColumns?.find(base => base.field === col.field);
    const extracted = extractCustomizations(col, baseCol);
    
    // Only include if there are actual customizations beyond the field
    if (Object.keys(extracted).length > 1) {
      customizations[col.field] = extracted;
    }
  });
  
  return customizations;
}

/**
 * Apply customizations to base columns
 */
export function deserializeColumnCustomizations(
  customizations: Record<string, ColumnCustomization>,
  baseColumns: ColDef[]
): ColDef[] {
  return baseColumns.map(baseCol => {
    const field = baseCol.field;
    if (!field || !customizations[field]) {
      // Apply defaults even if no customizations
      return {
        ...baseCol,
        ...COLUMN_DEFAULTS
      };
    }
    
    const custom = customizations[field];
    // Start with base column merged with defaults
    const merged: ColDef = { 
      ...COLUMN_DEFAULTS,
      ...baseCol 
    };
    
    // Apply basic properties
    if (custom.headerName !== undefined) merged.headerName = custom.headerName;
    if (custom.width !== undefined) merged.width = custom.width;
    if (custom.minWidth !== undefined) merged.minWidth = custom.minWidth;
    if (custom.maxWidth !== undefined) merged.maxWidth = custom.maxWidth;
    if (custom.flex !== undefined) merged.flex = custom.flex;
    
    // Apply boolean flags
    if (custom.sortable !== undefined) merged.sortable = custom.sortable;
    if (custom.resizable !== undefined) merged.resizable = custom.resizable;
    if (custom.editable !== undefined) merged.editable = custom.editable;
    if (custom.filter !== undefined) merged.filter = custom.filter;
    if (custom.floatingFilter !== undefined) merged.floatingFilter = custom.floatingFilter;
    if (custom.hide !== undefined) merged.hide = custom.hide;
    if (custom.lockPosition !== undefined) merged.lockPosition = custom.lockPosition;
    if (custom.lockVisible !== undefined) merged.lockVisible = custom.lockVisible;
    if (custom.lockPinned !== undefined) merged.lockPinned = custom.lockPinned;
    if (custom.suppressMenu !== undefined) merged.suppressMenu = custom.suppressMenu;
    
    // Apply positioning
    if (custom.pinned !== undefined) merged.pinned = custom.pinned;
    
    // Apply cell style
    if (custom.cellStyle) {
      if (custom.cellStyle.type === 'static' && custom.cellStyle.value) {
        merged.cellStyle = custom.cellStyle.value;
      } else if (custom.cellStyle.type === 'function' && custom.cellStyle.formatString) {
        // Recreate the cell style function
        const styleFunc = createCellStyleFunction(custom.cellStyle.formatString, custom.cellStyle.baseStyle);
        // Attach metadata for future serialization
        (styleFunc as any).__formatString = custom.cellStyle.formatString;
        (styleFunc as any).__baseStyle = custom.cellStyle.baseStyle;
        merged.cellStyle = styleFunc;
      }
    }
    
    // Apply header style
    if (custom.headerStyle) {
      if (custom.headerStyle.type === 'static' && custom.headerStyle.regular) {
        merged.headerStyle = custom.headerStyle.regular;
      } else if (custom.headerStyle.type === 'function') {
        // Create the header style function
        merged.headerStyle = (params: { floatingFilter?: boolean }) => {
          if (params?.floatingFilter) {
            return custom.headerStyle?.floating || null;
          }
          return custom.headerStyle?.regular || null;
        };
        
        // Also store as object format for persistence
        (merged.headerStyle as any)._isHeaderStyleConfig = true;
        (merged.headerStyle as any).regular = custom.headerStyle.regular;
        (merged.headerStyle as any).floating = custom.headerStyle.floating;
      }
    }
    
    // Apply CSS classes
    if (custom.cellClass !== undefined) merged.cellClass = custom.cellClass;
    if (custom.headerClass !== undefined) merged.headerClass = custom.headerClass;
    
    // Apply value formatter
    if (custom.valueFormatter && custom.valueFormatter.formatString) {
      if (custom.valueFormatter.type === 'excel') {
        const formatter = createExcelFormatter(custom.valueFormatter.formatString);
        merged.valueFormatter = formatter;
        merged.exportValueFormatter = formatter;
      }
    }
    
    // Apply cell data type
    if (custom.cellDataType !== undefined) merged.cellDataType = custom.cellDataType;
    
    // Apply other properties
    if (custom.headerTooltip !== undefined) merged.headerTooltip = custom.headerTooltip;
    if (custom.tooltipField !== undefined) merged.tooltipField = custom.tooltipField;
    if (custom.headerCheckboxSelection !== undefined) merged.headerCheckboxSelection = custom.headerCheckboxSelection;
    if (custom.checkboxSelection !== undefined) merged.checkboxSelection = custom.checkboxSelection;
    if (custom.rowGroup !== undefined) merged.rowGroup = custom.rowGroup;
    if (custom.pivot !== undefined) merged.pivot = custom.pivot;
    if (custom.aggFunc !== undefined) merged.aggFunc = custom.aggFunc;
    if (custom.cellClassRules !== undefined) merged.cellClassRules = custom.cellClassRules;
    
    return merged;
  });
}

/**
 * Calculate the size of serialized customizations in bytes
 */
export function calculateCustomizationSize(customizations: Record<string, ColumnCustomization>): number {
  return JSON.stringify(customizations).length;
}

/**
 * Get a summary of what's customized
 */
export function getCustomizationSummary(customizations: Record<string, ColumnCustomization>): {
  totalColumns: number;
  customizedColumns: number;
  properties: Record<string, number>;
} {
  const propertyCount: Record<string, number> = {};
  
  Object.values(customizations).forEach(custom => {
    Object.keys(custom).forEach(key => {
      if (key !== 'field') {
        propertyCount[key] = (propertyCount[key] || 0) + 1;
      }
    });
  });
  
  return {
    totalColumns: Object.keys(customizations).length,
    customizedColumns: Object.keys(customizations).length,
    properties: propertyCount
  };
}