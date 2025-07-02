import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import {
  Type,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  WrapText,
  Maximize2,
  RotateCcw,
  Pipette,
  AlignVerticalSpaceAround,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd
} from 'lucide-react';
import { useColumnFormattingStore } from '../../store/columnFormatting.store';
import { createCellStyleFunction } from '../../../utils/formatters';
import { cn } from '@/lib/utils';
import '../../custom-styles.css';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
  showTransparent?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label }) => {
  // Ensure we always have a valid value for controlled inputs
  const safeValue = value || '';
  const [inputValue, setInputValue] = useState(safeValue);
  
  // Update inputValue when value prop changes
  useEffect(() => {
    setInputValue(safeValue);
  }, [safeValue]);
  
  const presetColors = [
    'transparent',
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#808080', '#A52A2A', '#000080', '#008000'
  ];

  const handleColorChange = (color: string) => {
    onChange(color);
    setInputValue(color);
  };

  // Ensure color input always has a valid hex color
  const getColorInputValue = () => {
    if (safeValue === 'transparent' || !safeValue) {
      return '#FFFFFF';
    }
    // Ensure it's a valid hex color, fallback to white if not
    return safeValue.match(/^#[0-9A-Fa-f]{6}$/) ? safeValue : '#FFFFFF';
  };

  return (
    <div className="space-y-1">
      {label && <Label className="ribbon-section-header">{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-6 justify-between px-2 text-xs"
          >
            <div className="flex items-center gap-2">
              <div 
                className={cn(
                  "w-4 h-4 rounded border",
                  safeValue === 'transparent' || !safeValue ? "bg-checkered" : ""
                )}
                style={{ 
                  backgroundColor: safeValue === 'transparent' || !safeValue ? undefined : safeValue,
                  borderColor: safeValue === '#FFFFFF' || !safeValue ? '#E2E8F0' : 'transparent'
                }}
              />
              <span className="text-xs">{!safeValue ? 'Default' : safeValue === 'transparent' ? 'Transparent' : safeValue}</span>
            </div>
            <Pipette className="h-3 w-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3">
          <div className="space-y-3">
            {/* Color Input */}
            <div className="flex gap-2">
              <Input
                type="color"
                value={getColorInputValue()}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-9 w-16 p-1 cursor-pointer"
              />
              <Input
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (e.target.value.match(/^#[0-9A-Fa-f]{6}$/) || e.target.value === 'transparent') {
                    handleColorChange(e.target.value);
                  }
                }}
                placeholder="#000000"
                className="h-9 flex-1 font-mono text-xs"
              />
            </div>
            
            {/* Preset Colors */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Preset Colors</Label>
              <div className="grid grid-cols-8 gap-1">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={cn(
                      "w-8 h-8 rounded border-2 transition-all",
                      "hover:scale-110 hover:shadow-md",
                      safeValue === color ? "border-primary" : "border-transparent",
                      color === 'transparent' ? "bg-checkered" : ""
                    )}
                    style={{ 
                      backgroundColor: color === 'transparent' ? undefined : color,
                      borderColor: safeValue === color ? undefined : (color === '#FFFFFF' ? '#E2E8F0' : 'transparent')
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            
            {/* Recent Colors */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Recent</Label>
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-xs">No recent colors</Badge>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Define default styles structure
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
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: [],
  textAlign: '',  // Empty by default - should be set from column
  verticalAlign: '',  // Empty by default - should be set from column
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

interface StylingCustomContentProps {
  selectedColumns: Set<string>;
}

export const StylingCustomContent: React.FC<StylingCustomContentProps> = ({ selectedColumns }) => {
  const { 
    updateBulkProperty,
    columnDefinitions,
    pendingChanges
  } = useColumnFormattingStore();

  const [activeSubTab, setActiveSubTab] = useState<'cell' | 'header'>('cell');
  
  // Separate state objects for cell and header styles
  const [cellStyles, setCellStyles] = useState<StylesState>(defaultStyles);
  const [headerStyles, setHeaderStyles] = useState<StylesState>(defaultStyles);
  
  // Flag to prevent infinite loops between hydration and auto-apply
  const [isHydrating, setIsHydrating] = useState(false);

  // Get current styles based on active mode
  const currentStyles = activeSubTab === 'cell' ? cellStyles : headerStyles;
  const setCurrentStyles = activeSubTab === 'cell' ? setCellStyles : setHeaderStyles;

  // Helper function to update a specific style property
  const updateStyleProperty = <K extends keyof StylesState>(property: K, value: StylesState[K]) => {
    setCurrentStyles(prev => ({
      ...prev,
      [property]: value
    }));
  };

  // Font size options
  const fontSizeOptions = [
    { value: '10', label: '10px' },
    { value: '11', label: '11px' },
    { value: '12', label: '12px' },
    { value: '13', label: '13px' },
    { value: '14', label: '14px' },
    { value: '16', label: '16px' },
    { value: '18', label: '18px' },
    { value: '20', label: '20px' },
    { value: '24', label: '24px' },
  ];
  
  // Track if we're applying styles to prevent hydration loops
  const [isApplyingStyles, setIsApplyingStyles] = useState(false);
  
  // Track if color toggles were explicitly set by user
  const [userSetColorToggle, setUserSetColorToggle] = useState(false);
  const [userSetBgColorToggle, setUserSetBgColorToggle] = useState(false);
  
  // Track column switching to force UI updates
  const [columnSwitchKey, setColumnSwitchKey] = useState(0);
  
  // Helper function to extract alignment from CSS classes
  const extractAlignmentFromClass = (classString: string, isHeader: boolean = false) => {
    if (!classString) return { textAlign: '', verticalAlign: '' };
    
    let textAlign = '';
    let verticalAlign = '';
    
    if (isHeader) {
      // Header alignment classes: header-h-left, header-v-middle
      if (classString.includes('header-h-left')) textAlign = 'left';
      else if (classString.includes('header-h-center')) textAlign = 'center';
      else if (classString.includes('header-h-right')) textAlign = 'right';
      else if (classString.includes('header-h-justify')) textAlign = 'justify';
      
      if (classString.includes('header-v-top')) verticalAlign = 'top';
      else if (classString.includes('header-v-middle')) verticalAlign = 'middle';
      else if (classString.includes('header-v-bottom')) verticalAlign = 'bottom';
    } else {
      // Cell alignment classes: cell-align-middle-center, cell-horizontal-align-right, etc.
      // Combined alignment
      const combinedMatch = classString.match(/cell-align-(\w+)-(\w+)/);
      if (combinedMatch) {
        verticalAlign = combinedMatch[1];
        textAlign = combinedMatch[2];
      } else {
        // Individual alignment classes
        const verticalMatch = classString.match(/cell-vertical-align-(\w+)/);
        const horizontalMatch = classString.match(/cell-horizontal-align-(\w+)/);
        
        if (verticalMatch) verticalAlign = verticalMatch[1];
        if (horizontalMatch) textAlign = horizontalMatch[1];
      }
    }
    
    return { textAlign, verticalAlign };
  };
  
  // Load existing styles when columns or mode changes
  useEffect(() => {
    if (selectedColumns.size === 0 || columnDefinitions.size === 0) return;
    
    // Skip hydration if we're in the middle of applying styles
    if (isApplyingStyles) return;
    
    // Hydration triggered for active tab
    
    // Set hydrating flag to prevent auto-apply from running
    setIsHydrating(true);
    
    // Reset user toggle flags when columns change
    setUserSetColorToggle(false);
    setUserSetBgColorToggle(false);
    
    // Reset to defaults first
    const resetStyles = { ...defaultStyles };
    
    // Helper function to extract border properties from style object
    const extractBorderProperties = (styleObj: any) => {
      let borderWidth = '1';
      let borderStyle = 'solid';
      let borderColor = '#CCCCCC';
      let borderSides = 'all';
      let applyBorder = false;
      
      if (styleObj.border) {
        if (styleObj.border === 'none') {
          borderSides = 'none';
          applyBorder = true;
        } else {
          // Parse border shorthand: "1px solid #000"
          const borderParts = styleObj.border.split(' ');
          if (borderParts.length >= 3) {
            borderWidth = borderParts[0].replace('px', '');
            borderStyle = borderParts[1];
            borderColor = borderParts[2];
            borderSides = 'all';
            applyBorder = true;
          }
        }
      } else {
        // Check individual border sides
        const sides = ['Top', 'Right', 'Bottom', 'Left'];
        const foundSides = [];
        
        for (const side of sides) {
          const borderProp = `border${side}`;
          if (styleObj[borderProp] && styleObj[borderProp] !== 'none') {
            foundSides.push(side.toLowerCase());
            // Parse the first found side for width, style, color
            if (foundSides.length === 1) {
              const borderParts = styleObj[borderProp].split(' ');
              if (borderParts.length >= 3) {
                borderWidth = borderParts[0].replace('px', '');
                borderStyle = borderParts[1];
                borderColor = borderParts[2];
                applyBorder = true;
              }
            }
          }
        }
        
        if (foundSides.length === 1) {
          borderSides = foundSides[0];
        } else if (foundSides.length > 1 && foundSides.length < 4) {
          borderSides = 'all'; // Default to all if multiple but not all sides
        }
      }
      
      return { borderWidth, borderStyle, borderColor, borderSides, applyBorder };
    };
    
    // Track if we've found any values (for proper mixed-value handling)
    let foundAnyValues = false;
    
    // Collect values from all selected columns
    const collectedValues: Record<string, Set<any>> = {};
    
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const changes = pendingChanges.get(colId) || {};
      
      // Get the appropriate style and class based on active tab
      const styleToCheck = activeSubTab === 'cell' 
        ? (changes.cellStyle !== undefined ? changes.cellStyle : colDef?.cellStyle)
        : (changes.headerStyle !== undefined ? changes.headerStyle : colDef?.headerStyle);
      
      const classToCheck = activeSubTab === 'cell'
        ? (changes.cellClass !== undefined ? changes.cellClass : colDef?.cellClass)
        : (changes.headerClass !== undefined ? changes.headerClass : colDef?.headerClass);
      
      // Extract style properties
      if (styleToCheck) {
        foundAnyValues = true;
        let styleObj: any = {};
        
        // Handle function-based styles
        if (typeof styleToCheck === 'function') {
          // Check if it has __baseStyle metadata
          styleObj = (styleToCheck as any).__baseStyle || {};
          
          // If no base style, we can't extract by calling the function without proper params
          if (Object.keys(styleObj).length === 0) {
            // Skip trying to execute the function - we can't provide valid params
            styleObj = {};
          }
        } else if (typeof styleToCheck === 'object') {
          styleObj = styleToCheck;
        }
        
        // Collect style properties
        Object.entries(styleObj).forEach(([key, value]) => {
          // Skip undefined values - these indicate explicitly removed styles
          if (value !== undefined) {
            if (!collectedValues[key]) collectedValues[key] = new Set();
            collectedValues[key].add(value);
          }
        });
      }
      
      // Extract alignment from CSS classes
      if (classToCheck) {
        foundAnyValues = true;
        const classString = typeof classToCheck === 'string' ? classToCheck : '';
        const alignment = extractAlignmentFromClass(classString, activeSubTab === 'header');
        
        if (alignment.textAlign) {
          if (!collectedValues.textAlign) collectedValues.textAlign = new Set();
          collectedValues.textAlign.add(alignment.textAlign);
        }
        if (alignment.verticalAlign) {
          if (!collectedValues.verticalAlign) collectedValues.verticalAlign = new Set();
          collectedValues.verticalAlign.add(alignment.verticalAlign);
        }
      }
      
      // Collect autoHeight property directly from column definition
      if (activeSubTab === 'cell') {
        const autoHeightValue = changes.autoHeight !== undefined ? changes.autoHeight : colDef?.autoHeight;
        if (autoHeightValue !== undefined) {
          foundAnyValues = true;
          if (!collectedValues.autoHeight) collectedValues.autoHeight = new Set();
          collectedValues.autoHeight.add(autoHeightValue);
        }
      } else {
        // For header tab, check autoHeaderHeight
        const autoHeaderHeightValue = changes.autoHeaderHeight !== undefined ? changes.autoHeaderHeight : colDef?.autoHeaderHeight;
        if (autoHeaderHeightValue !== undefined) {
          foundAnyValues = true;
          if (!collectedValues.autoHeaderHeight) collectedValues.autoHeaderHeight = new Set();
          collectedValues.autoHeaderHeight.add(autoHeaderHeightValue);
        }
        
        // Also check wrapHeaderText for header tab
        const wrapHeaderTextValue = changes.wrapHeaderText !== undefined ? changes.wrapHeaderText : colDef?.wrapHeaderText;
        if (wrapHeaderTextValue !== undefined) {
          foundAnyValues = true;
          if (!collectedValues.wrapHeaderText) collectedValues.wrapHeaderText = new Set();
          collectedValues.wrapHeaderText.add(wrapHeaderTextValue);
        }
      }
    });
    
    // Apply collected values to resetStyles (use first value if multiple)
    if (foundAnyValues) {
      // Hydrating styles from existing column definitions
      
      // Typography properties
      if (collectedValues.fontFamily?.size) {
        resetStyles.fontFamily = Array.from(collectedValues.fontFamily)[0] as string;
      }
      if (collectedValues.fontSize?.size) {
        const fontSize = Array.from(collectedValues.fontSize)[0] as string;
        resetStyles.fontSize = fontSize.replace('px', '');
      }
      if (collectedValues.fontWeight?.size) {
        resetStyles.fontWeight = Array.from(collectedValues.fontWeight)[0] as string;
      }
      if (collectedValues.fontStyle?.size) {
        resetStyles.fontStyle = Array.from(collectedValues.fontStyle)[0] as string;
      }
      if (collectedValues.textDecoration?.size) {
        const textDecoration = Array.from(collectedValues.textDecoration)[0] as string;
        resetStyles.textDecoration = textDecoration.split(' ').filter(Boolean);
      }
      
      // Alignment properties
      if (collectedValues.textAlign?.size) {
        resetStyles.textAlign = Array.from(collectedValues.textAlign)[0] as string;
      }
      if (collectedValues.verticalAlign?.size) {
        resetStyles.verticalAlign = Array.from(collectedValues.verticalAlign)[0] as string;
      }
      
      // Color properties
      if (collectedValues.color?.size) {
        const colorValue = Array.from(collectedValues.color)[0] as string;
        resetStyles.textColor = colorValue;
        // Only set toggle if user hasn't explicitly set it
        if (!userSetColorToggle) {
          resetStyles.applyTextColor = true;
        }
      }
      if (collectedValues.backgroundColor?.size) {
        const bgColorValue = Array.from(collectedValues.backgroundColor)[0] as string;
        resetStyles.backgroundColor = bgColorValue;
        // Only set toggle if user hasn't explicitly set it
        if (!userSetBgColorToggle) {
          resetStyles.applyBackgroundColor = true;
        }
      }
      
      // Text wrapping
      if (collectedValues.whiteSpace?.size) {
        const whiteSpace = Array.from(collectedValues.whiteSpace)[0] as string;
        resetStyles.wrapText = whiteSpace === 'normal';
      }
      
      // Auto height
      if (collectedValues.autoHeight?.size) {
        resetStyles.autoHeight = Array.from(collectedValues.autoHeight)[0] as boolean;
      }
      if (collectedValues.autoHeaderHeight?.size) {
        resetStyles.autoHeight = Array.from(collectedValues.autoHeaderHeight)[0] as boolean;
      }
      if (collectedValues.wrapHeaderText?.size) {
        resetStyles.wrapText = Array.from(collectedValues.wrapHeaderText)[0] as boolean;
      }
      
      // Applied styles from existing column definitions
    }
    
    // Extract border properties from the first column that has border styles
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const changes = pendingChanges.get(colId) || {};
      
      const styleToCheck = activeSubTab === 'cell' 
        ? (changes.cellStyle !== undefined ? changes.cellStyle : colDef?.cellStyle)
        : (changes.headerStyle !== undefined ? changes.headerStyle : colDef?.headerStyle);
      
      if (styleToCheck && !resetStyles.applyBorder) {
        let styleObj: any = {};
        
        if (typeof styleToCheck === 'function') {
          styleObj = (styleToCheck as any).__baseStyle || {};
          // Skip trying to execute the function - we can't provide valid params
        } else if (typeof styleToCheck === 'object') {
          styleObj = styleToCheck;
        }
        
        // Check if this column has border properties
        if (styleObj.border || styleObj.borderTop || styleObj.borderRight || 
            styleObj.borderBottom || styleObj.borderLeft) {
          const borderProps = extractBorderProperties(styleObj);
          Object.assign(resetStyles, borderProps);
        }
      }
    });
    
    // Always update state (even if no styles were found, to reset properly)
    setCurrentStyles(resetStyles);
    
    // Clear hydrating flag after state update
    setTimeout(() => {
      setIsHydrating(false);
    }, 0);
  }, [selectedColumns, activeSubTab, columnDefinitions, pendingChanges]);

  // Separate effect to hydrate BOTH cell and header styles when column selection changes
  useEffect(() => {
    if (selectedColumns.size === 0 || columnDefinitions.size === 0) return;
    if (isApplyingStyles) return;

    // Set hydrating flag to prevent auto-apply
    setIsHydrating(true);

    // Helper to hydrate styles for a specific mode
    const hydrateStylesForMode = (mode: 'cell' | 'header') => {
      const resetStyles = { ...defaultStyles };
      const collectedValues: Record<string, Set<any>> = {};
      
      // Collect values from ALL selected columns (not just the first)
      selectedColumns.forEach(colId => {
        const colDef = columnDefinitions.get(colId);
        const changes = pendingChanges.get(colId) || {};
        
        const styleToCheck = mode === 'cell' 
          ? (changes.cellStyle !== undefined ? changes.cellStyle : colDef?.cellStyle)
          : (changes.headerStyle !== undefined ? changes.headerStyle : colDef?.headerStyle);
        
        const classToCheck = mode === 'cell'
          ? (changes.cellClass !== undefined ? changes.cellClass : colDef?.cellClass)
          : (changes.headerClass !== undefined ? changes.headerClass : colDef?.headerClass);
        
        if (styleToCheck) {
          let styleObj: any = {};
          
          if (typeof styleToCheck === 'function') {
            styleObj = (styleToCheck as any).__baseStyle || {};
          } else if (typeof styleToCheck === 'object') {
            styleObj = styleToCheck;
          }
          
          // Collect style properties
          if (styleObj.fontFamily) {
            if (!collectedValues.fontFamily) collectedValues.fontFamily = new Set();
            collectedValues.fontFamily.add(styleObj.fontFamily);
          }
          if (styleObj.fontSize) {
            if (!collectedValues.fontSize) collectedValues.fontSize = new Set();
            collectedValues.fontSize.add(styleObj.fontSize);
          }
          if (styleObj.fontWeight) {
            if (!collectedValues.fontWeight) collectedValues.fontWeight = new Set();
            collectedValues.fontWeight.add(styleObj.fontWeight);
          }
          if (styleObj.fontStyle) {
            if (!collectedValues.fontStyle) collectedValues.fontStyle = new Set();
            collectedValues.fontStyle.add(styleObj.fontStyle);
          }
          if (styleObj.textDecoration) {
            if (!collectedValues.textDecoration) collectedValues.textDecoration = new Set();
            collectedValues.textDecoration.add(styleObj.textDecoration);
          }
          if (styleObj.color) {
            if (!collectedValues.color) collectedValues.color = new Set();
            collectedValues.color.add(styleObj.color);
          }
          if (styleObj.backgroundColor) {
            if (!collectedValues.backgroundColor) collectedValues.backgroundColor = new Set();
            collectedValues.backgroundColor.add(styleObj.backgroundColor);
          }
          if (styleObj.whiteSpace) {
            if (!collectedValues.whiteSpace) collectedValues.whiteSpace = new Set();
            collectedValues.whiteSpace.add(styleObj.whiteSpace);
          }
        }
        
        // Extract alignment from CSS classes
        if (classToCheck) {
          const classString = typeof classToCheck === 'string' ? classToCheck : '';
          const alignment = extractAlignmentFromClass(classString, mode === 'header');
          
          if (alignment.textAlign) {
            if (!collectedValues.textAlign) collectedValues.textAlign = new Set();
            collectedValues.textAlign.add(alignment.textAlign);
          }
          if (alignment.verticalAlign) {
            if (!collectedValues.verticalAlign) collectedValues.verticalAlign = new Set();
            collectedValues.verticalAlign.add(alignment.verticalAlign);
          }
        }
        
        // Collect autoHeight property directly from column definition
        if (mode === 'cell') {
          const autoHeightValue = changes.autoHeight !== undefined ? changes.autoHeight : colDef?.autoHeight;
          if (autoHeightValue !== undefined) {
            if (!collectedValues.autoHeight) collectedValues.autoHeight = new Set();
            collectedValues.autoHeight.add(autoHeightValue);
          }
        } else {
          // For header mode, check autoHeaderHeight
          const autoHeaderHeightValue = changes.autoHeaderHeight !== undefined ? changes.autoHeaderHeight : colDef?.autoHeaderHeight;
          if (autoHeaderHeightValue !== undefined) {
            if (!collectedValues.autoHeaderHeight) collectedValues.autoHeaderHeight = new Set();
            collectedValues.autoHeaderHeight.add(autoHeaderHeightValue);
          }
          
          // Also check wrapHeaderText for header mode
          const wrapHeaderTextValue = changes.wrapHeaderText !== undefined ? changes.wrapHeaderText : colDef?.wrapHeaderText;
          if (wrapHeaderTextValue !== undefined) {
            if (!collectedValues.wrapHeaderText) collectedValues.wrapHeaderText = new Set();
            collectedValues.wrapHeaderText.add(wrapHeaderTextValue);
          }
        }
      });
      
      // Apply collected values (use first value if multiple)
      if (collectedValues.fontFamily?.size) {
        resetStyles.fontFamily = Array.from(collectedValues.fontFamily)[0] as string;
      }
      if (collectedValues.fontSize?.size) {
        const fontSize = Array.from(collectedValues.fontSize)[0] as string;
        resetStyles.fontSize = fontSize.replace('px', '');
      }
      if (collectedValues.fontWeight?.size) {
        resetStyles.fontWeight = Array.from(collectedValues.fontWeight)[0] as string;
      }
      if (collectedValues.fontStyle?.size) {
        resetStyles.fontStyle = Array.from(collectedValues.fontStyle)[0] as string;
      }
      if (collectedValues.textDecoration?.size) {
        const textDecoration = Array.from(collectedValues.textDecoration)[0] as string;
        resetStyles.textDecoration = textDecoration.split(' ').filter(Boolean);
      }
      if (collectedValues.textAlign?.size) {
        resetStyles.textAlign = Array.from(collectedValues.textAlign)[0] as string;
      }
      if (collectedValues.verticalAlign?.size) {
        resetStyles.verticalAlign = Array.from(collectedValues.verticalAlign)[0] as string;
      }
      if (collectedValues.color?.size) {
        resetStyles.textColor = Array.from(collectedValues.color)[0] as string;
        resetStyles.applyTextColor = true;
      }
      if (collectedValues.backgroundColor?.size) {
        resetStyles.backgroundColor = Array.from(collectedValues.backgroundColor)[0] as string;
        resetStyles.applyBackgroundColor = true;
      }
      if (collectedValues.whiteSpace?.size) {
        const whiteSpace = Array.from(collectedValues.whiteSpace)[0] as string;
        resetStyles.wrapText = whiteSpace === 'normal';
      }
      if (collectedValues.autoHeight?.size) {
        resetStyles.autoHeight = Array.from(collectedValues.autoHeight)[0] as boolean;
      }
      if (collectedValues.autoHeaderHeight?.size) {
        resetStyles.autoHeight = Array.from(collectedValues.autoHeaderHeight)[0] as boolean;
      }
      if (collectedValues.wrapHeaderText?.size) {
        resetStyles.wrapText = Array.from(collectedValues.wrapHeaderText)[0] as boolean;
      }
      
      return resetStyles;
    };

    // Hydrate both cell and header styles when columns change
    const cellResetStyles = hydrateStylesForMode('cell');
    const headerResetStyles = hydrateStylesForMode('header');
    
    setCellStyles(cellResetStyles);
    setHeaderStyles(headerResetStyles);
    
    // Clear hydrating flag after state update
    setTimeout(() => {
      setIsHydrating(false);
      // Force UI update by incrementing key
      setColumnSwitchKey(prev => prev + 1);
    }, 50);
  }, [selectedColumns, columnDefinitions, pendingChanges]);

  // Border side options
  const borderSideOptions = [
    { value: 'all', label: 'All Sides' },
    { value: 'top', label: 'Top' },
    { value: 'right', label: 'Right' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'left', label: 'Left' },
    { value: 'none', label: 'None' },
  ];


  // Apply styles
  const applyStyles = () => {
    // Set flag to prevent hydration during style application
    setIsApplyingStyles(true);
    
    const styleObject: any = {
      fontFamily: currentStyles.fontFamily,
      fontSize: `${currentStyles.fontSize}px`,
      fontWeight: currentStyles.fontWeight,
      fontStyle: currentStyles.fontStyle,
      whiteSpace: currentStyles.wrapText ? 'normal' : 'nowrap',
    };
    
    // Handle text decoration
    if (currentStyles.textDecoration.length > 0) {
      styleObject.textDecoration = currentStyles.textDecoration.join(' ');
    }
    
    // Handle color properties based on checkbox state
    if (currentStyles.applyTextColor) {
      if (currentStyles.textColor) {
        styleObject.color = currentStyles.textColor;
      }
    } else {
      // Explicitly set to undefined to remove existing color
      styleObject.color = undefined;
    }
    
    if (currentStyles.applyBackgroundColor) {
      if (currentStyles.backgroundColor) {
        styleObject.backgroundColor = currentStyles.backgroundColor;
      }
    } else {
      // Explicitly set to undefined to remove existing background
      styleObject.backgroundColor = undefined;
    }

    // Handle borders based on checkbox state
    if (currentStyles.applyBorder) {
      if (currentStyles.borderSides === 'none') {
        styleObject.border = 'none';
      } else if (currentStyles.borderSides === 'all') {
        styleObject.border = `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}`;
      } else {
        styleObject.borderTop = currentStyles.borderSides === 'top' ? `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}` : 'none';
        styleObject.borderRight = currentStyles.borderSides === 'right' ? `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}` : 'none';
        styleObject.borderBottom = currentStyles.borderSides === 'bottom' ? `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}` : 'none';
        styleObject.borderLeft = currentStyles.borderSides === 'left' ? `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}` : 'none';
      }
    } else {
      // Explicitly set all border properties to undefined to remove existing borders
      styleObject.border = undefined;
      styleObject.borderTop = undefined;
      styleObject.borderRight = undefined;
      styleObject.borderBottom = undefined;
      styleObject.borderLeft = undefined;
    }

    // Apply to cell or header based on active tab
    if (activeSubTab === 'cell') {
      // Apply combined alignment using CSS class
      let cellClass = '';
      
      // Create combined alignment class based on both vertical and horizontal alignment
      if (currentStyles.verticalAlign && currentStyles.textAlign) {
        cellClass = `cell-align-${currentStyles.verticalAlign}-${currentStyles.textAlign}`;
      } else if (currentStyles.verticalAlign) {
        cellClass = `cell-vertical-align-${currentStyles.verticalAlign}`;
      } else if (currentStyles.textAlign) {
        cellClass = `cell-horizontal-align-${currentStyles.textAlign}`;
      }
      
      // Always update cellClass property (even if empty to clear previous alignment)
      updateBulkProperty('cellClass', cellClass || undefined);
      
      // Apply autoHeight property for cells
      updateBulkProperty('autoHeight', currentStyles.autoHeight);
      
      // Check if any selected column has conditional formatting
      let hasConditionalFormatting = false;
      let existingFormatString: string | undefined;
      
      selectedColumns.forEach(colId => {
        const colDef = columnDefinitions.get(colId);
        const changes = pendingChanges.get(colId) || {};
        const currentCellStyle = changes.cellStyle !== undefined ? changes.cellStyle : colDef?.cellStyle;
        
        if (currentCellStyle && typeof currentCellStyle === 'function') {
          const formatString = (currentCellStyle as any).__formatString;
          if (formatString) {
            hasConditionalFormatting = true;
            existingFormatString = formatString;
          }
        }
      });
      
      if (hasConditionalFormatting && existingFormatString) {
        // Create a merged style function that preserves conditional formatting
        const cellStyleFn = (params: { value: unknown }) => {
          // Create conditional style function with empty base (conditional styles only)
          const conditionalStyleFn = createCellStyleFunction(existingFormatString || '', {});
          const conditionalStyles = conditionalStyleFn(params) || {};
          
          // Merge base styles with conditional styles (conditional takes precedence)
          const mergedStyles = { ...styleObject, ...conditionalStyles };
          return Object.keys(mergedStyles).length > 0 ? mergedStyles : undefined;
        };
        
        // Attach metadata for serialization
        Object.defineProperty(cellStyleFn, '__formatString', {
          value: existingFormatString,
          writable: false,
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(cellStyleFn, '__baseStyle', {
          value: styleObject,
          writable: false,
          enumerable: false,
          configurable: true
        });
        
        updateBulkProperty('cellStyle', cellStyleFn);
      } else {
        // No conditional formatting, apply static styles
        updateBulkProperty('cellStyle', styleObject);
      }
    } else {
      // Use callback function to apply styles only to header, not floating filter
      const headerStyleFunction = (params: any) => {
        // params.floatingFilter is true when styling the floating filter
        if (params.floatingFilter) {
          return null; // Don't apply any styles to floating filter
        }
        // Apply styles only to the actual header
        return styleObject;
      };
      // Store the base style in the function for potential future reference
      (headerStyleFunction as any).__baseStyle = styleObject;
      updateBulkProperty('headerStyle', headerStyleFunction);
      
      // Apply separate horizontal and vertical alignment classes for header
      const headerClasses = [];
      
      // Add horizontal alignment class
      if (currentStyles.textAlign === 'left') {
        headerClasses.push('header-h-left');
      } else if (currentStyles.textAlign === 'center') {
        headerClasses.push('header-h-center');
      } else if (currentStyles.textAlign === 'right') {
        headerClasses.push('header-h-right');
      } else if (currentStyles.textAlign === 'justify') {
        headerClasses.push('header-h-justify');
      }
      
      // Add vertical alignment class
      if (currentStyles.verticalAlign === 'top') {
        headerClasses.push('header-v-top');
      } else if (currentStyles.verticalAlign === 'middle') {
        headerClasses.push('header-v-middle');
      } else if (currentStyles.verticalAlign === 'bottom') {
        headerClasses.push('header-v-bottom');
      }
      
      // Join classes with space
      const headerClass = headerClasses.join(' ');
      
      // Always update headerClass property (even if empty to clear previous alignment)
      updateBulkProperty('headerClass', headerClass || undefined);
      
      // Apply autoHeaderHeight property for headers
      updateBulkProperty('autoHeaderHeight', currentStyles.autoHeight);
      
      // Apply wrapHeaderText property for headers
      updateBulkProperty('wrapHeaderText', currentStyles.wrapText);
    }
    
    // Reset flag after a brief delay to allow state updates to propagate
    setTimeout(() => {
      setIsApplyingStyles(false);
    }, 100);
  };

  // Track if we should apply to all selected columns or just the last one
  const [] = useState(true);
  
  // Get the last selected column for individual editing
  // const lastSelectedColumn = selectedColumns.size > 0 
  //   ? Array.from(selectedColumns)[selectedColumns.size - 1] 
  //   : null;
  
  // Auto-apply on changes (but not during hydration)
  useEffect(() => {
    if (selectedColumns.size > 0 && !isHydrating) {
      applyStyles();
    }
  }, [
    currentStyles.fontFamily, currentStyles.fontSize, currentStyles.fontWeight, currentStyles.fontStyle, 
    currentStyles.textDecoration, currentStyles.textAlign, currentStyles.verticalAlign,
    currentStyles.textColor, currentStyles.backgroundColor, currentStyles.applyTextColor, currentStyles.applyBackgroundColor, 
    currentStyles.wrapText, currentStyles.autoHeight,
    currentStyles.borderWidth, currentStyles.borderStyle, currentStyles.borderColor, currentStyles.borderSides, currentStyles.applyBorder,
    activeSubTab,
    isHydrating // Add this to dependencies so it re-runs when hydration completes
  ]);

  const resetStyles = () => {
    // Reset only the current mode's styles
    setCurrentStyles({ ...defaultStyles });
  };

  return (
    <div className="flex h-full gap-3">
      {/* Main controls section */}
      <div className="flex-1">
        {/* Show prominent alert when multiple columns are selected */}
        {selectedColumns.size > 1 && (
          <Alert className="mb-3 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Bulk Edit Mode:</strong> You have {selectedColumns.size} columns selected. All styling changes will be applied to ALL selected columns simultaneously.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Cell/Header Toggle */}
        <div className="flex items-center justify-between mb-3">
          <ToggleGroup type="single" value={activeSubTab} onValueChange={(v) => v && setActiveSubTab(v as 'cell' | 'header')}>
            <ToggleGroupItem value="cell" className="ribbon-toggle-group-item">
              <Square className="ribbon-icon-xs mr-1" />
              Cell
            </ToggleGroupItem>
            <ToggleGroupItem value="header" className="ribbon-toggle-group-item">
              <Type className="ribbon-icon-xs mr-1" />
              Header
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetStyles}
            className="h-6 px-2 text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>

        {/* Main content - Compact layout with proper column alignment */}
        <div className="space-y-2">
          {/* Define a consistent grid with fixed column widths */}
          <div className="grid grid-cols-4 gap-4">
            {/* Row 1: Font, Size, Weight, Alignment */}
            {/* Font Family */}
            <div>
              <Label className="ribbon-section-header">FONT</Label>
              <Select value={currentStyles.fontFamily} onValueChange={(value) => updateStyleProperty('fontFamily', value)}>
                <SelectTrigger className="h-6 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div>
              <Label className="ribbon-section-header">SIZE</Label>
              <Select value={currentStyles.fontSize} onValueChange={(value) => updateStyleProperty('fontSize', value)}>
                <SelectTrigger className="h-6 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontSizeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Weight */}
            <div>
              <Label className="ribbon-section-header">WEIGHT</Label>
              <Select value={currentStyles.fontWeight} onValueChange={(value) => updateStyleProperty('fontWeight', value)}>
                <SelectTrigger className="h-6 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light</SelectItem>
                  <SelectItem value="normal">Regular</SelectItem>
                  <SelectItem value="500">Medium</SelectItem>
                  <SelectItem value="600">Semibold</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Text Alignment */}
            <div>
              <Label className="ribbon-section-header">ALIGN</Label>
              <ToggleGroup 
                key={`text-align-${columnSwitchKey}-${activeSubTab}`}
                type="single" 
                value={currentStyles.textAlign === '' ? undefined : currentStyles.textAlign} 
                onValueChange={(value) => updateStyleProperty('textAlign', value || '')} 
                className="h-6 w-full"
              >
                <ToggleGroupItem value="left" className="alignment-toggle-item" title="Align Left">
                  <AlignLeft className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" className="alignment-toggle-item" title="Align Center">
                  <AlignCenter className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" className="alignment-toggle-item" title="Align Right">
                  <AlignRight className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="justify" className="alignment-toggle-item" title="Justify">
                  <AlignJustify className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Row 2: Font Style, Colors */}
            {/* Font Style Controls */}
            <div>
              <Label className="ribbon-section-header">STYLE</Label>
              <ToggleGroup type="multiple" value={[
                ...(currentStyles.fontWeight === 'bold' || currentStyles.fontWeight === '600' || currentStyles.fontWeight === '700' ? ['bold'] : []),
                ...(currentStyles.fontStyle === 'italic' ? ['italic'] : []),
                ...currentStyles.textDecoration
              ]} onValueChange={(values) => {
                // Handle bold
                if (values.includes('bold') && !currentStyles.fontWeight.includes('bold') && currentStyles.fontWeight !== '600' && currentStyles.fontWeight !== '700') {
                  updateStyleProperty('fontWeight', 'bold');
                } else if (!values.includes('bold') && (currentStyles.fontWeight === 'bold' || currentStyles.fontWeight === '600' || currentStyles.fontWeight === '700')) {
                  updateStyleProperty('fontWeight', 'normal');
                }
                
                // Handle italic
                updateStyleProperty('fontStyle', values.includes('italic') ? 'italic' : 'normal');
                
                // Handle decorations
                updateStyleProperty('textDecoration', values.filter(v => ['underline', 'line-through'].includes(v)));
              }} className="h-6 w-full">
                <ToggleGroupItem value="bold" className="alignment-toggle-item" title="Bold">
                  <Bold className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" className="alignment-toggle-item" title="Italic">
                  <Italic className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" className="alignment-toggle-item" title="Underline">
                  <Underline className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="line-through" className="alignment-toggle-item" title="Strikethrough">
                  <Strikethrough className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Text Color */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1 h-5">
                <Label className="ribbon-section-header flex-1 mb-0">TEXT COLOR</Label>
                <Switch 
                  id="apply-text-color"
                  checked={currentStyles.applyTextColor}
                  onCheckedChange={(checked) => {
                    setUserSetColorToggle(true);
                    updateStyleProperty('applyTextColor', checked);
                  }}
                  className="h-4 w-7 data-[state=checked]:bg-primary"
                />
              </div>
              <ColorPicker 
                value={currentStyles.textColor}
                onChange={(color) => updateStyleProperty('textColor', color)}
                label=""
              />
            </div>

            {/* Background Color */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1 h-5">
                <Label className="ribbon-section-header flex-1 mb-0">BACKGROUND</Label>
                <Switch 
                  id="apply-background-color"
                  checked={currentStyles.applyBackgroundColor}
                  onCheckedChange={(checked) => {
                    setUserSetBgColorToggle(true);
                    updateStyleProperty('applyBackgroundColor', checked);
                  }}
                  className="h-4 w-7 data-[state=checked]:bg-primary"
                />
              </div>
              <ColorPicker 
                value={currentStyles.backgroundColor}
                onChange={(color) => updateStyleProperty('backgroundColor', color)}
                label=""
              />
            </div>

            {/* Vertical Alignment */}
            <div>
              <Label className="ribbon-section-header">V-ALIGN</Label>
              <ToggleGroup 
                key={`vertical-align-${columnSwitchKey}-${activeSubTab}`}
                type="single" 
                value={currentStyles.verticalAlign === '' ? undefined : currentStyles.verticalAlign} 
                onValueChange={(value) => updateStyleProperty('verticalAlign', value || '')} 
                className="h-6 w-full"
              >
                <ToggleGroupItem value="top" className="alignment-toggle-item" title="Align Top">
                  <AlignVerticalJustifyStart className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="middle" className="alignment-toggle-item" title="Align Middle">
                  <AlignVerticalJustifyCenter className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="bottom" className="alignment-toggle-item" title="Align Bottom">
                  <AlignVerticalJustifyEnd className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="stretch" className="alignment-toggle-item" title="Stretch">
                  <AlignVerticalSpaceAround className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Row 3: Border controls */}
            {/* Border Sides */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1 h-5">
                <Label className="ribbon-section-header flex-1 mb-0">BORDER</Label>
                <Switch 
                  id="apply-border"
                  checked={currentStyles.applyBorder}
                  onCheckedChange={(checked) => updateStyleProperty('applyBorder', checked)}
                  className="h-4 w-7 data-[state=checked]:bg-primary"
                />
              </div>
              <Select value={currentStyles.borderSides} onValueChange={(value) => updateStyleProperty('borderSides', value)}>
                <SelectTrigger className="h-6 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {borderSideOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Border Style */}
            <div>
              <Label className="ribbon-section-header">STYLE</Label>
              <Select value={currentStyles.borderStyle} onValueChange={(value) => updateStyleProperty('borderStyle', value)}>
                <SelectTrigger className="h-6 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Border Width */}
            <div>
              <Label className="ribbon-section-header">WIDTH</Label>
              <Select value={currentStyles.borderWidth} onValueChange={(value) => updateStyleProperty('borderWidth', value)}>
                <SelectTrigger className="h-6 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1px</SelectItem>
                  <SelectItem value="2">2px</SelectItem>
                  <SelectItem value="3">3px</SelectItem>
                  <SelectItem value="4">4px</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Border Color */}
            <div>
              <Label className="ribbon-section-header">COLOR</Label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={currentStyles.borderColor || '#CCCCCC'}
                  onChange={(e) => updateStyleProperty('borderColor', e.target.value)}
                  className="h-6 w-6 border rounded cursor-pointer flex-shrink-0"
                  title="Border Color"
                />
                <Input
                  value={currentStyles.borderColor || '#CCCCCC'}
                  onChange={(e) => {
                    if (e.target.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                      updateStyleProperty('borderColor', e.target.value);
                    }
                  }}
                  className="h-6 flex-1 text-xs font-mono px-2"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Wrap and Auto Height */}
          <div className="flex items-center gap-6 pt-1">
            <div className="flex items-center gap-2">
              <Switch
                id="wrap-text"
                checked={currentStyles.wrapText}
                onCheckedChange={(checked) => updateStyleProperty('wrapText', checked)}
                className="h-4 w-7"
              />
              <Label htmlFor="wrap-text" className="text-xs cursor-pointer flex items-center gap-1">
                <WrapText className="h-3 w-3" />
                Wrap Text
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="auto-height"
                checked={currentStyles.autoHeight}
                onCheckedChange={(checked) => updateStyleProperty('autoHeight', checked)}
                className="h-4 w-7"
              />
              <Label htmlFor="auto-height" className="text-xs cursor-pointer flex items-center gap-1">
                <Maximize2 className="h-3 w-3" />
                Auto Height
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Preview section */}
      <div className="w-48 border-l pl-4 flex flex-col">
        <Label className="ribbon-section-header block">PREVIEW</Label>
        <div className="flex-1 flex flex-col justify-center">
          <div className="space-y-4">
          {/* Cell Preview */}
          <div>
            <div className="text-[10px] text-muted-foreground mb-1">Cell Style</div>
            <div 
              className="p-2 border rounded h-[48px] flex"
              style={{
                alignItems: activeSubTab === 'cell' ? (
                  currentStyles.verticalAlign === 'top' ? 'flex-start' :
                  currentStyles.verticalAlign === 'bottom' ? 'flex-end' :
                  currentStyles.verticalAlign === 'stretch' ? 'stretch' : 'center'
                ) : 'center',
                justifyContent: activeSubTab === 'cell' ? (
                  currentStyles.textAlign === 'left' ? 'flex-start' :
                  currentStyles.textAlign === 'right' ? 'flex-end' :
                  currentStyles.textAlign === 'center' ? 'center' :
                  currentStyles.textAlign === 'justify' ? 'space-between' : 'flex-start'
                ) : 'flex-start',
                fontFamily: currentStyles.fontFamily,
                fontSize: `${currentStyles.fontSize}px`,
                fontWeight: activeSubTab === 'cell' ? currentStyles.fontWeight : 'normal',
                fontStyle: activeSubTab === 'cell' ? currentStyles.fontStyle : 'normal',
                textDecoration: activeSubTab === 'cell' && currentStyles.textDecoration.length > 0 ? currentStyles.textDecoration.join(' ') : 'none',
                color: activeSubTab === 'cell' && currentStyles.textColor && currentStyles.applyTextColor ? currentStyles.textColor : 'inherit',
                backgroundColor: activeSubTab === 'cell' && currentStyles.backgroundColor && currentStyles.applyBackgroundColor ? currentStyles.backgroundColor : 'transparent',
                whiteSpace: activeSubTab === 'cell' && currentStyles.wrapText ? 'normal' : 'nowrap',
                ...(activeSubTab === 'cell' && currentStyles.applyBorder ? 
                  (currentStyles.borderSides === 'none' ? { border: 'none' } : 
                    currentStyles.borderSides === 'all' ? { border: `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}` } : {
                      borderTop: currentStyles.borderSides === 'top' ? `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}` : 'none',
                      borderRight: currentStyles.borderSides === 'right' ? `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}` : 'none',
                      borderBottom: currentStyles.borderSides === 'bottom' ? `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}` : 'none',
                      borderLeft: currentStyles.borderSides === 'left' ? `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}` : 'none',
                    })
                  : {})
              }}
            >
              Sample Text
            </div>
          </div>
          
          {/* Header Preview */}
          <div>
            <div className="text-[10px] text-muted-foreground mb-1">Header Style</div>
            <div 
              className="p-2 border rounded font-semibold h-[48px] flex"
              style={{
                alignItems: activeSubTab === 'header' ? (
                  currentStyles.verticalAlign === 'top' ? 'flex-start' :
                  currentStyles.verticalAlign === 'bottom' ? 'flex-end' :
                  currentStyles.verticalAlign === 'stretch' ? 'stretch' : 'center'
                ) : 'center',
                justifyContent: activeSubTab === 'header' ? (
                  currentStyles.textAlign === 'left' ? 'flex-start' :
                  currentStyles.textAlign === 'right' ? 'flex-end' :
                  currentStyles.textAlign === 'center' ? 'center' :
                  currentStyles.textAlign === 'justify' ? 'space-between' : 'flex-start'
                ) : 'flex-start',
                fontFamily: currentStyles.fontFamily,
                fontSize: `${currentStyles.fontSize}px`,
                fontWeight: activeSubTab === 'header' ? currentStyles.fontWeight : '600',
                fontStyle: activeSubTab === 'header' ? currentStyles.fontStyle : 'normal',
                textDecoration: activeSubTab === 'header' && currentStyles.textDecoration.length > 0 ? currentStyles.textDecoration.join(' ') : 'none',
                color: activeSubTab === 'header' && currentStyles.textColor && currentStyles.applyTextColor ? currentStyles.textColor : 'inherit',
                backgroundColor: activeSubTab === 'header' && currentStyles.backgroundColor && currentStyles.applyBackgroundColor ? currentStyles.backgroundColor : 'transparent',
                ...(activeSubTab === 'header' && currentStyles.applyBorder ? 
                  (currentStyles.borderSides === 'none' ? { border: 'none' } : 
                    currentStyles.borderSides === 'all' ? { border: `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}` } : {
                      borderTop: currentStyles.borderSides === 'top' ? `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}` : 'none',
                      borderRight: currentStyles.borderSides === 'right' ? `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}` : 'none',
                      borderBottom: currentStyles.borderSides === 'bottom' ? `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}` : 'none',
                      borderLeft: currentStyles.borderSides === 'left' ? `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}` : 'none',
                    })
                  : {})
              }}
            >
              Column Title
            </div>
          </div>

          </div>
        </div>
        {/* Active indicator */}
        <div className="text-[10px] text-muted-foreground pt-2 mt-auto border-t">
          Editing: <span className="font-medium text-foreground">{activeSubTab === 'cell' ? 'Cell' : 'Header'}</span> styles
        </div>
      </div>
    </div>
  );
};