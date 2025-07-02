import { useState, useEffect, useCallback } from 'react';
import { ColDef } from 'ag-grid-community';
// import { createCellStyleFunction } from '@/components/datatable/utils/formatters';

interface StylesState {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string[];
  textAlign: string;
  verticalAlign: string;
  textColor: string;
  backgroundColor: string;
  applyTextColor: boolean;
  applyBackgroundColor: boolean;
  wrapText: boolean;
  autoHeight: boolean;
  borderWidth: string;
  borderStyle: string;
  borderColor: string;
  borderSides: string;
  applyBorder: boolean;
}

const defaultStyles: StylesState = {
  fontFamily: 'Inter',
  fontSize: '14',
  fontWeight: '400',
  fontStyle: 'normal',
  textDecoration: [],
  textAlign: '',
  verticalAlign: '',
  textColor: '',
  backgroundColor: '',
  applyTextColor: false,
  applyBackgroundColor: false,
  wrapText: false,
  autoHeight: false,
  borderWidth: '1',
  borderStyle: 'solid',
  borderColor: '#CCCCCC',
  borderSides: 'all',
  applyBorder: false,
};

interface UseStylingStateProps {
  selectedColumns: Set<string>;
  columnDefinitions: Map<string, ColDef>;
  pendingChanges: Map<string, Partial<ColDef>>;
  updateBulkProperty: (property: string, value: unknown) => void;
}

export function useStylingState({
  selectedColumns,
  columnDefinitions,
  pendingChanges,
  updateBulkProperty,
}: UseStylingStateProps) {
  const [activeSubTab, setActiveSubTab] = useState<'cell' | 'header'>('cell');
  const [currentStyles, setCurrentStyles] = useState<StylesState>(defaultStyles);
  const [isHydrating, setIsHydrating] = useState(false);
  const [isApplyingStyles, setIsApplyingStyles] = useState(false);
  const [userSetColorToggle, setUserSetColorToggle] = useState(false);
  const [userSetBgColorToggle, setUserSetBgColorToggle] = useState(false);

  // Update style property
  const updateStyleProperty = <K extends keyof StylesState>(property: K, value: StylesState[K]) => {
    setCurrentStyles(prev => ({
      ...prev,
      [property]: value
    }));
  };

  // Hydrate styles from existing columns
  useEffect(() => {
    if (selectedColumns.size === 0 || columnDefinitions.size === 0) return;
    if (isApplyingStyles) return;

    setIsHydrating(true);
    setUserSetColorToggle(false);
    setUserSetBgColorToggle(false);

    const resetStyles = { ...defaultStyles };
    
    // Extract styles from first selected column
    const firstColId = Array.from(selectedColumns)[0];
    const colDef = columnDefinitions.get(firstColId);
    const changes = pendingChanges.get(firstColId) || {};
    
    const styleToCheck = activeSubTab === 'cell' 
      ? (changes.cellStyle !== undefined ? changes.cellStyle : colDef?.cellStyle)
      : (changes.headerStyle !== undefined ? changes.headerStyle : colDef?.headerStyle);
    
    if (styleToCheck) {
      let styleObj: any = {};
      
      if (typeof styleToCheck === 'function') {
        styleObj = (styleToCheck as any).__baseStyle || {};
      } else if (typeof styleToCheck === 'object') {
        styleObj = styleToCheck;
      }
      
      // Extract style properties
      if (styleObj.fontFamily) resetStyles.fontFamily = styleObj.fontFamily;
      if (styleObj.fontSize) resetStyles.fontSize = styleObj.fontSize.replace('px', '');
      if (styleObj.fontWeight) resetStyles.fontWeight = styleObj.fontWeight;
      if (styleObj.fontStyle) resetStyles.fontStyle = styleObj.fontStyle;
      if (styleObj.textDecoration) {
        resetStyles.textDecoration = styleObj.textDecoration.split(' ').filter(Boolean);
      }
      if (styleObj.textAlign) resetStyles.textAlign = styleObj.textAlign;
      if (styleObj.verticalAlign) resetStyles.verticalAlign = styleObj.verticalAlign;
      
      if (styleObj.color) {
        resetStyles.textColor = styleObj.color;
        if (!userSetColorToggle) {
          resetStyles.applyTextColor = true;
        }
      }
      if (styleObj.backgroundColor) {
        resetStyles.backgroundColor = styleObj.backgroundColor;
        if (!userSetBgColorToggle) {
          resetStyles.applyBackgroundColor = true;
        }
      }
      
      if (styleObj.whiteSpace) {
        resetStyles.wrapText = styleObj.whiteSpace === 'normal';
      }
      
      // Extract border properties
      if (styleObj.border || styleObj.borderTop || styleObj.borderRight || 
          styleObj.borderBottom || styleObj.borderLeft) {
        resetStyles.applyBorder = true;
        // Parse border properties...
      }
    }
    
    setCurrentStyles(resetStyles);
    
    setTimeout(() => {
      setIsHydrating(false);
    }, 0);
  }, [selectedColumns, activeSubTab, columnDefinitions, pendingChanges]);

  // Apply styles
  const applyStyles = useCallback(() => {
    setIsApplyingStyles(true);
    
    const styleObject: any = {
      fontFamily: currentStyles.fontFamily,
      fontSize: `${currentStyles.fontSize}px`,
      fontWeight: currentStyles.fontWeight,
      fontStyle: currentStyles.fontStyle,
      whiteSpace: currentStyles.wrapText ? 'normal' : 'nowrap',
    };
    
    if (currentStyles.textDecoration.length > 0) {
      styleObject.textDecoration = currentStyles.textDecoration.join(' ');
    }
    
    if (currentStyles.applyTextColor && currentStyles.textColor) {
      styleObject.color = currentStyles.textColor;
    } else {
      styleObject.color = undefined;
    }
    
    if (currentStyles.applyBackgroundColor && currentStyles.backgroundColor) {
      styleObject.backgroundColor = currentStyles.backgroundColor;
    } else {
      styleObject.backgroundColor = undefined;
    }
    
    // Handle borders
    if (currentStyles.applyBorder) {
      if (currentStyles.borderSides === 'none') {
        styleObject.border = 'none';
      } else if (currentStyles.borderSides === 'all') {
        styleObject.border = `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}`;
      } else {
        // Handle individual sides...
      }
    } else {
      styleObject.border = undefined;
    }
    
    // Apply to cell or header
    if (activeSubTab === 'cell') {
      updateBulkProperty('cellStyle', styleObject);
      if (currentStyles.autoHeight) {
        updateBulkProperty('autoHeight', true);
      }
    } else {
      updateBulkProperty('headerStyle', styleObject);
    }
    
    setTimeout(() => {
      setIsApplyingStyles(false);
    }, 100);
  }, [currentStyles, activeSubTab, updateBulkProperty]);

  // Auto-apply on changes
  useEffect(() => {
    if (selectedColumns.size > 0 && !isHydrating) {
      applyStyles();
    }
  }, [currentStyles, activeSubTab, isHydrating, selectedColumns.size, applyStyles]);

  // Reset styles
  const resetStyles = () => {
    setCurrentStyles(defaultStyles);
  };

  return {
    activeSubTab,
    setActiveSubTab,
    currentStyles,
    isHydrating,
    isApplyingStyles,
    userSetColorToggle,
    userSetBgColorToggle,
    updateStyleProperty,
    applyStyles,
    resetStyles,
    setUserSetColorToggle,
    setUserSetBgColorToggle,
  };
}