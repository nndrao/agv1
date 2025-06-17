# Column Customization Implementation Details

## Code Flow and Implementation

This document provides implementation-level details of how column customization works, including actual code snippets and data flow diagrams.

## 1. State Management Flow

### Column Formatting Store

```typescript
// columnFormatting.store.ts
interface ColumnFormattingState {
  selectedColumns: Set<string>;
  columnDefinitions: Map<string, ColDef>;
  pendingChanges: Map<string, Partial<ColDef>>;
  bulkEditMode: boolean;
  generalConfig: GeneralConfig;
}

// Bulk property update
const updateBulkProperty = (property: keyof ColDef, value: any) => {
  set((state) => {
    const newPendingChanges = new Map(state.pendingChanges);
    
    state.selectedColumns.forEach(colId => {
      const existingChanges = newPendingChanges.get(colId) || {};
      newPendingChanges.set(colId, {
        ...existingChanges,
        [property]: value
      });
    });
    
    return { pendingChanges: newPendingChanges };
  });
};
```

## 2. Tab Implementation Details

### Styling Tab - Complete Implementation

```typescript
// StylingCustomContent.tsx - Style Application
const applyStyles = () => {
  const styleObject: any = {
    fontFamily,
    fontSize: `${fontSize}px`,
    fontWeight,
    fontStyle,
    whiteSpace: wrapText ? 'normal' : 'nowrap',
  };
  
  // Handle color properties based on toggle state
  if (applyTextColor && textColor) {
    styleObject.color = textColor;
  }
  
  if (applyBackgroundColor && backgroundColor) {
    styleObject.backgroundColor = backgroundColor;
  }

  // Handle borders
  if (applyBorder) {
    if (borderSides === 'all') {
      styleObject.border = `${borderWidth}px ${borderStyle} ${borderColor}`;
    } else {
      // Individual border sides
      ['top', 'right', 'bottom', 'left'].forEach(side => {
        styleObject[`border${side.charAt(0).toUpperCase() + side.slice(1)}`] = 
          borderSides === side ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none';
      });
    }
  }

  // Apply to cell or header
  if (activeSubTab === 'cell') {
    // Handle alignment with CSS classes
    const alignmentClass = `cell-align-${verticalAlign}-${textAlign}`;
    updateBulkProperty('cellClass', alignmentClass);
    
    // Handle conditional formatting preservation
    handleConditionalFormatting(styleObject);
  } else {
    // Header styling with floating filter exclusion
    const headerStyleFunction = (params: any) => {
      if (params.floatingFilter) return null;
      return styleObject;
    };
    headerStyleFunction.__baseStyle = styleObject;
    updateBulkProperty('headerStyle', headerStyleFunction);
    
    // Header alignment classes
    const headerClasses = [
      textAlign && `header-h-${textAlign}`,
      verticalAlign && `header-v-${verticalAlign}`
    ].filter(Boolean).join(' ');
    updateBulkProperty('headerClass', headerClasses);
  }
};

// Conditional formatting preservation
const handleConditionalFormatting = (baseStyle: CSSProperties) => {
  const firstColId = Array.from(selectedColumns)[0];
  const colDef = columnDefinitions.get(firstColId);
  const existingCellStyle = colDef?.cellStyle;
  
  if (existingCellStyle && typeof existingCellStyle === 'function') {
    const formatString = (existingCellStyle as any).__formatString;
    
    if (formatString) {
      // Create merged style function
      const cellStyleFn = (params: { value: unknown }) => {
        const conditionalStyleFn = createCellStyleFunction(formatString, {});
        const conditionalStyles = conditionalStyleFn(params) || {};
        return { ...baseStyle, ...conditionalStyles };
      };
      
      // Preserve metadata
      Object.defineProperty(cellStyleFn, '__formatString', {
        value: formatString,
        writable: false,
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(cellStyleFn, '__baseStyle', {
        value: baseStyle,
        writable: false,
        enumerable: false,
        configurable: true
      });
      
      updateBulkProperty('cellStyle', cellStyleFn);
    } else {
      updateBulkProperty('cellStyle', baseStyle);
    }
  } else {
    updateBulkProperty('cellStyle', baseStyle);
  }
};
```

### Format Tab - Formatter Creation

```typescript
// FormatCustomContent.tsx - Format Application
useEffect(() => {
  if (!isInitialized) return;
  
  const formatString = buildFormatString();
  
  if (formatString && selectedColumns.size > 0) {
    // Create formatter function
    const formatter = createExcelFormatter(formatString);
    updateBulkProperty('valueFormatter', formatter);
    
    // If format has color directives, also create cellStyle
    if (hasColorDirectives(formatString)) {
      setTimeout(() => {
        const baseStyle = getExistingBaseStyle();
        const cellStyleFn = createCellStyleFunction(formatString, baseStyle);
        updateBulkProperty('cellStyle', cellStyleFn);
      }, 0);
    }
    
    setCurrentFormat?.(formatString);
  }
}, [/* dependencies */]);

// Excel formatter creation
export function createExcelFormatter(formatString: string) {
  const parsedFormat = FormatCache.get(formatString);
  
  const formatter = (params: ValueFormatterParams): string => {
    if (!params || typeof params !== 'object') return '';
    
    try {
      const result = formatWithParsedFormat(params.value, parsedFormat);
      return result.value;
    } catch (error) {
      console.error('[ExcelFormatter] Error:', error);
      return String(params.value || '');
    }
  };
  
  // Attach metadata
  Object.defineProperty(formatter, '__formatString', { 
    value: formatString, 
    writable: false,
    enumerable: false,
    configurable: true
  });
  
  return formatter;
}
```

## 3. Serialization Implementation

### Profile Store - Save Column Customizations

```typescript
// profile.store.ts
const saveColumnCustomizations = (
  currentColumns: ColDef[],
  baseColumns: ColDef[]
) => {
  const activeProfile = get().activeProfileId;
  if (!activeProfile) return;
  
  // Create customizations map
  const customizations: Record<string, ColumnCustomization> = {};
  
  currentColumns.forEach((col, index) => {
    const baseCol = baseColumns.find(b => b.field === col.field);
    if (!baseCol) return;
    
    const changes: ColumnCustomization = {};
    
    // Compare and extract changes
    Object.keys(col).forEach(key => {
      const currentValue = col[key];
      const baseValue = baseCol[key];
      
      if (!isEqual(currentValue, baseValue)) {
        if (typeof currentValue === 'function') {
          // Serialize function with metadata
          changes[key] = serializeFunction(currentValue);
        } else {
          changes[key] = currentValue;
        }
      }
    });
    
    if (Object.keys(changes).length > 0) {
      customizations[col.field!] = changes;
    }
  });
  
  // Update profile
  const updatedProfiles = profiles.map(profile => {
    if (profile.id === activeProfile) {
      return {
        ...profile,
        lastModified: new Date().toISOString(),
        columnSettings: {
          version: "2.0.0",
          columnCustomizations: customizations,
          baseColumns: baseColumns
        }
      };
    }
    return profile;
  });
  
  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfiles));
};

// Function serialization
const serializeFunction = (fn: Function): SerializedFunction => {
  const serialized: SerializedFunction = {
    type: 'function',
    metadata: {},
    functionBody: fn.toString()
  };
  
  // Extract metadata
  const metadataKeys = ['__formatString', '__baseStyle', '__formatterType'];
  metadataKeys.forEach(key => {
    if (fn[key] !== undefined) {
      serialized.metadata[key.substring(2)] = fn[key];
    }
  });
  
  return serialized;
};
```

## 4. Deserialization Implementation

### Profile Sync Hook

```typescript
// useProfileSync.ts
export function useProfileSync(
  setCurrentColumnDefs: (cols: ColDef[]) => void,
  setSelectedFont: (font: string) => void,
  setSelectedFontSize: (size: string) => void
) {
  const { activeProfileId, profiles, getActiveProfile } = useProfileStore();
  
  const handleProfileChange = useCallback(() => {
    const activeProfile = getActiveProfile();
    if (!activeProfile) return;
    
    // Load column customizations
    if (activeProfile.columnSettings?.version === "2.0.0") {
      const { columnCustomizations, baseColumns } = activeProfile.columnSettings;
      
      if (baseColumns && columnCustomizations) {
        const reconstructedColumns = reconstructColumns(
          baseColumns,
          columnCustomizations
        );
        setCurrentColumnDefs(reconstructedColumns);
      }
    }
    
    // Load grid options
    if (activeProfile.gridOptions) {
      if (activeProfile.gridOptions.font) {
        setSelectedFont(activeProfile.gridOptions.font);
      }
      if (activeProfile.gridOptions.fontSize) {
        setSelectedFontSize(activeProfile.gridOptions.fontSize);
      }
    }
  }, [getActiveProfile, setCurrentColumnDefs, setSelectedFont, setSelectedFontSize]);
  
  return { handleProfileChange };
}

// Column reconstruction
const reconstructColumns = (
  baseColumns: ColDef[],
  customizations: Record<string, ColumnCustomization>
): ColDef[] => {
  return baseColumns.map(baseCol => {
    const customization = customizations[baseCol.field || ''];
    if (!customization) return baseCol;
    
    const reconstructed = { ...baseCol };
    
    Object.entries(customization).forEach(([key, value]) => {
      if (isSerializedFunction(value)) {
        reconstructed[key] = deserializeFunction(value);
      } else {
        reconstructed[key] = value;
      }
    });
    
    return reconstructed;
  });
};

// Function deserialization
const deserializeFunction = (serialized: SerializedFunction): Function => {
  let fn: Function;
  
  // Reconstruct based on type
  if (serialized.metadata.formatterType === 'excel') {
    fn = createExcelFormatter(serialized.metadata.formatString);
  } else if (serialized.metadata.formatString && serialized.metadata.baseStyle) {
    fn = createCellStyleFunction(
      serialized.metadata.formatString,
      serialized.metadata.baseStyle
    );
  } else if (serialized.metadata.baseStyle) {
    // Header style function
    fn = (params: any) => {
      if (params.floatingFilter) return null;
      return serialized.metadata.baseStyle;
    };
  } else {
    // Generic function reconstruction
    try {
      fn = new Function('return ' + serialized.functionBody)();
    } catch (e) {
      console.error('Failed to deserialize function:', e);
      fn = () => {};
    }
  }
  
  // Reattach metadata
  Object.entries(serialized.metadata).forEach(([key, value]) => {
    Object.defineProperty(fn, `__${key}`, {
      value,
      writable: false,
      enumerable: false,
      configurable: true
    });
  });
  
  return fn;
};
```

## 5. Column Application to AG-Grid

### Column Operations Hook

```typescript
// useColumnOperations.ts
export function useColumnOperations(
  gridApiRef: React.MutableRefObject<GridApi | null>,
  setCurrentColumnDefs: (cols: ColDef[]) => void,
  processedColumns: ColDef[]
) {
  const handleApplyColumnChanges = useCallback(() => {
    const { pendingChanges, selectedColumns, columnDefinitions } = 
      useColumnFormattingStore.getState();
    
    if (pendingChanges.size === 0) return;
    
    // Create updated column definitions
    const updatedColumns = processedColumns.map(col => {
      const changes = pendingChanges.get(col.field || '');
      if (!changes) return col;
      
      // Merge changes
      const updated = { ...col, ...changes };
      
      // Special handling for cellStyle
      if (changes.cellStyle !== undefined) {
        updated.cellStyle = changes.cellStyle;
      }
      
      // Special handling for valueFormatter
      if (changes.valueFormatter !== undefined) {
        updated.valueFormatter = changes.valueFormatter;
      }
      
      return updated;
    });
    
    // Apply to grid
    if (gridApiRef.current) {
      gridApiRef.current.setColumnDefs(updatedColumns);
      
      // Refresh cells to apply new styles
      gridApiRef.current.refreshCells({
        force: true,
        columns: Array.from(selectedColumns)
      });
    }
    
    // Update state
    setCurrentColumnDefs(updatedColumns);
    
    // Clear pending changes
    useColumnFormattingStore.getState().clearPendingChanges();
  }, [gridApiRef, setCurrentColumnDefs, processedColumns]);
  
  return { handleApplyColumnChanges };
}
```

### Grid Refresh Strategy

```typescript
// DataTableContainer.tsx
const handleApplyChanges = () => {
  // Get updated columns with all customizations
  const updatedColumns = getColumnDefsWithStyles();
  
  // Strategy 1: Full column definition update (rebuilds grid)
  if (hasStructuralChanges) {
    gridApi.setColumnDefs(updatedColumns);
  } 
  // Strategy 2: Partial refresh (updates only affected cells)
  else {
    gridApi.refreshCells({
      force: true,
      columns: affectedColumnIds,
      rowNodes: null // All rows
    });
    
    // Refresh headers if needed
    if (hasHeaderChanges) {
      gridApi.refreshHeader();
    }
  }
  
  // Save to profile
  saveColumnCustomizations(updatedColumns, baseColumns);
};
```

## 6. CSS Class Application

### Custom CSS Classes

```css
/* custom-styles.css */

/* Cell alignment classes */
.cell-align-top-left {
  display: flex !important;
  align-items: flex-start;
  justify-content: flex-start;
}

.cell-align-middle-center {
  display: flex !important;
  align-items: center;
  justify-content: center;
}

/* Header alignment classes */
.header-h-center .ag-header-cell-label {
  justify-content: center !important;
}

.header-v-middle .ag-header-cell-label {
  align-items: center !important;
}

/* Numeric cell classes */
.ag-numeric-cell {
  text-align: right;
}

.ag-currency-cell::before {
  content: attr(data-currency-symbol);
}
```

## 7. Performance Optimizations

### Memoization Strategies

```typescript
// Column processor memoization
const processedColumns = useMemo(() => {
  return columnDefs.map(colDef => {
    // Processing logic
  });
}, [columnDefs]);

// Format string building
const formatString = useMemo(() => {
  return buildFormatString();
}, [formatMode, selectedStandardFormat, /* other deps */]);

// Style object creation
const styleObject = useMemo(() => {
  return createStyleObject();
}, [fontSize, fontFamily, textColor, /* other deps */]);
```

### Debounced Updates

```typescript
// Debounce expensive operations
const debouncedApplyStyles = useMemo(
  () => debounce(applyStyles, 300),
  [applyStyles]
);

// Batch updates
const batchUpdate = () => {
  unstable_batchedUpdates(() => {
    updateProperty1();
    updateProperty2();
    updateProperty3();
  });
};
```

## 8. Error Handling and Recovery

### Function Reconstruction Errors

```typescript
try {
  const fn = deserializeFunction(serialized);
  return fn;
} catch (error) {
  console.error('Function deserialization failed:', error);
  
  // Fallback strategies
  if (serialized.metadata.formatterType === 'excel') {
    // Return basic formatter
    return (params) => String(params.value || '');
  }
  
  if (serialized.metadata.baseStyle) {
    // Return static style
    return serialized.metadata.baseStyle;
  }
  
  // Return no-op function
  return () => {};
}
```

### State Corruption Recovery

```typescript
// Validate stored data
const validateStoredProfile = (profile: any): boolean => {
  if (!profile.id || !profile.name) return false;
  if (profile.columnSettings?.version !== "2.0.0") return false;
  if (!Array.isArray(profile.columnSettings?.baseColumns)) return false;
  return true;
};

// Reset corrupted state
const resetCorruptedState = () => {
  console.warn('Corrupted state detected, resetting to defaults');
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};
```

This implementation ensures robust serialization, deserialization, and application of complex column customizations while maintaining performance and data integrity.