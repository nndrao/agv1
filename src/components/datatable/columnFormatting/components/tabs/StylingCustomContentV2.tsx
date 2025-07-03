import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  Plus,
  Square,
  Grid3x3,
  Palette,
  Type,
  Percent,
  DollarSign,
  WrapText,
  TableProperties,
  ChevronDown
} from 'lucide-react';
import { useColumnFormattingStore } from '../../store/columnFormatting.store';
import { createCellStyleFunction } from '@/components/datatable/utils/formatters';

interface StylesState {
  // Typography
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string[];
  
  // Alignment
  textAlign: string;
  verticalAlign: string;
  
  // Colors
  textColor: string;
  backgroundColor: string;
  
  // Text wrapping
  wrapText: boolean;
  autoHeight: boolean;
  
  // Borders
  borderWidth: string;
  borderStyle: string;
  borderColor: string;
  borderTop: boolean;
  borderRight: boolean;
  borderBottom: boolean;
  borderLeft: boolean;
}

const getDefaultStyles = (): StylesState => {
  // Check if dark mode is active
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  return {
    fontFamily: 'monospace', // Default font family from profile store
    fontSize: '13', // Default cell font size
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: [],
    textAlign: '',
    verticalAlign: '',
    // Use theme-aware colors
    textColor: isDarkMode ? '#FFFFFF' : '#2C3E50', // Dark mode: white, Light mode: dark blue-gray
    backgroundColor: isDarkMode ? '#161b22' : '#ECECEC', // Dark mode: very dark, Light mode: light gray
    wrapText: false,
    autoHeight: false,
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: isDarkMode ? '#505866' : '#C5CAD1', // Theme border colors
    borderTop: false,
    borderRight: false,
    borderBottom: false,
    borderLeft: false,
  };
};

interface StylingCustomContentProps {
  selectedColumns: Set<string>;
}

export const StylingCustomContentV2: React.FC<StylingCustomContentProps> = ({ selectedColumns }) => {
  const { 
    updateBulkProperty,
    columnDefinitions,
    pendingChanges
  } = useColumnFormattingStore();

  const [styles, setStyles] = useState<StylesState>(() => getDefaultStyles());
  const [showColorPicker, setShowColorPicker] = useState<'text' | 'background' | 'border' | null>(null);

  // Load existing styles when columns change
  useEffect(() => {
    if (selectedColumns.size === 0) return;

    const newStyles = getDefaultStyles();
    const firstColumnId = Array.from(selectedColumns)[0];
    const colDef = columnDefinitions.get(firstColumnId);
    const changes = pendingChanges.get(firstColumnId) || {};

    if (colDef || Object.keys(changes).length > 0) {
      const cellStyleToCheck = changes.cellStyle !== undefined ? changes.cellStyle : colDef?.cellStyle;
      if (cellStyleToCheck) {
        let styleObj: any = {};
        if (typeof cellStyleToCheck === 'function') {
          styleObj = (cellStyleToCheck as any).__baseStyle || {};
        } else if (typeof cellStyleToCheck === 'object') {
          styleObj = cellStyleToCheck;
        }

        if (styleObj.fontFamily) newStyles.fontFamily = styleObj.fontFamily;
        if (styleObj.fontSize) newStyles.fontSize = styleObj.fontSize.replace('px', '');
        if (styleObj.fontWeight) newStyles.fontWeight = styleObj.fontWeight;
        if (styleObj.fontStyle) newStyles.fontStyle = styleObj.fontStyle;
        if (styleObj.color) newStyles.textColor = styleObj.color;
        if (styleObj.backgroundColor) newStyles.backgroundColor = styleObj.backgroundColor;
        if (styleObj.whiteSpace === 'normal') newStyles.wrapText = true;
        
        // Load border settings
        if (styleObj.border) {
          newStyles.borderTop = true;
          newStyles.borderRight = true;
          newStyles.borderBottom = true;
          newStyles.borderLeft = true;
          // Parse border shorthand (e.g., "1px solid #d1d5db")
          const borderParts = styleObj.border.split(' ');
          if (borderParts.length >= 3) {
            newStyles.borderWidth = borderParts[0].replace('px', '');
            newStyles.borderStyle = borderParts[1];
            newStyles.borderColor = borderParts[2];
          }
        } else {
          // Check individual borders
          if (styleObj.borderTop && styleObj.borderTop !== 'none') {
            newStyles.borderTop = true;
            // Parse individual border style if not already set
            const borderParts = styleObj.borderTop.split(' ');
            if (borderParts.length >= 3 && !newStyles.borderWidth) {
              newStyles.borderWidth = borderParts[0].replace('px', '');
              newStyles.borderStyle = borderParts[1];
              newStyles.borderColor = borderParts[2];
            }
          }
          if (styleObj.borderRight && styleObj.borderRight !== 'none') {
            newStyles.borderRight = true;
            const borderParts = styleObj.borderRight.split(' ');
            if (borderParts.length >= 3 && !newStyles.borderWidth) {
              newStyles.borderWidth = borderParts[0].replace('px', '');
              newStyles.borderStyle = borderParts[1];
              newStyles.borderColor = borderParts[2];
            }
          }
          if (styleObj.borderBottom && styleObj.borderBottom !== 'none') {
            newStyles.borderBottom = true;
            const borderParts = styleObj.borderBottom.split(' ');
            if (borderParts.length >= 3 && !newStyles.borderWidth) {
              newStyles.borderWidth = borderParts[0].replace('px', '');
              newStyles.borderStyle = borderParts[1];
              newStyles.borderColor = borderParts[2];
            }
          }
          if (styleObj.borderLeft && styleObj.borderLeft !== 'none') {
            newStyles.borderLeft = true;
            const borderParts = styleObj.borderLeft.split(' ');
            if (borderParts.length >= 3 && !newStyles.borderWidth) {
              newStyles.borderWidth = borderParts[0].replace('px', '');
              newStyles.borderStyle = borderParts[1];
              newStyles.borderColor = borderParts[2];
            }
          }
        }
      }

      const autoHeightValue = changes.autoHeight !== undefined ? changes.autoHeight : colDef?.autoHeight;
      if (autoHeightValue !== undefined) newStyles.autoHeight = autoHeightValue;
    }

    setStyles(newStyles);
  }, [selectedColumns, columnDefinitions]);

  // Apply styles immediately when changed
  const applyStyle = useCallback((styleUpdates: Partial<StylesState>) => {
    const newStyles = { ...styles, ...styleUpdates };
    setStyles(newStyles);

    // Build style object
    const styleObject: any = {
      fontFamily: newStyles.fontFamily,
      fontSize: `${newStyles.fontSize}px`,
      fontWeight: newStyles.fontWeight,
      fontStyle: newStyles.fontStyle,
      whiteSpace: newStyles.wrapText ? 'normal' : 'nowrap',
    };

    // Handle text decoration
    if (newStyles.textDecoration.length > 0) {
      styleObject.textDecoration = newStyles.textDecoration.join(' ');
    }

    // Apply colors
    if (newStyles.textColor) styleObject.color = newStyles.textColor;
    if (newStyles.backgroundColor) styleObject.backgroundColor = newStyles.backgroundColor;

    // Handle borders
    const borderValue = `${newStyles.borderWidth}px ${newStyles.borderStyle} ${newStyles.borderColor}`;
    const hasBorder = newStyles.borderTop || newStyles.borderRight || newStyles.borderBottom || newStyles.borderLeft;
    
    if (hasBorder) {
      if (newStyles.borderTop && newStyles.borderRight && newStyles.borderBottom && newStyles.borderLeft) {
        // All borders - use shorthand
        styleObject.border = borderValue;
      } else {
        // Individual borders
        styleObject.borderTop = newStyles.borderTop ? borderValue : 'none';
        styleObject.borderRight = newStyles.borderRight ? borderValue : 'none';
        styleObject.borderBottom = newStyles.borderBottom ? borderValue : 'none';
        styleObject.borderLeft = newStyles.borderLeft ? borderValue : 'none';
      }
    } else {
      styleObject.border = 'none';
    }

    // Create style function that preserves existing styles
    const cellStyleFunction = (params: any) => {
      const colId = params.column?.getColId();
      if (!colId) return styleObject;
      
      const colDef = columnDefinitions.get(colId);
      const changes = pendingChanges.get(colId) || {};
      const existingStyleDef = changes.cellStyle !== undefined ? changes.cellStyle : colDef?.cellStyle;
      
      // If there's an existing style function with a format string, preserve it
      if (existingStyleDef && typeof existingStyleDef === 'function') {
        const formatString = (existingStyleDef as any).__formatString;
        if (formatString) {
          // Create a new style function that merges base styles with conditional formatting
          const tempFunction = createCellStyleFunction(formatString, styleObject);
          return tempFunction(params);
        } else {
          // Regular style function - merge with existing styles
          const existingStyle = existingStyleDef(params) || {};
          return { ...existingStyle, ...styleObject };
        }
      }
      
      // No existing style function - just return the style object
      return styleObject;
    };
    
    (cellStyleFunction as any).__baseStyle = styleObject;
    
    updateBulkProperty('cellStyle', cellStyleFunction);
    updateBulkProperty('autoHeight', newStyles.autoHeight);

    // Apply alignment
    let cellClass = '';
    if (newStyles.verticalAlign && newStyles.textAlign) {
      cellClass = `cell-align-${newStyles.verticalAlign}-${newStyles.textAlign}`;
    } else if (newStyles.verticalAlign) {
      cellClass = `cell-vertical-align-${newStyles.verticalAlign}`;
    } else if (newStyles.textAlign) {
      cellClass = `cell-horizontal-align-${newStyles.textAlign}`;
    }
    updateBulkProperty('cellClass', cellClass || undefined);
  }, [styles, updateBulkProperty, columnDefinitions, pendingChanges]);

  // Font family options - include monospace fonts used in the app
  const fontFamilyOptions = [
    { value: 'monospace', label: 'System Monospace' },
    { value: '"Fira Code", monospace', label: 'Fira Code' },
    { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' },
    { value: '"IBM Plex Mono", monospace', label: 'IBM Plex Mono' },
    { value: '"Roboto Mono", monospace', label: 'Roboto Mono' },
    { value: '"Source Code Pro", monospace', label: 'Source Code Pro' },
    { value: 'Inter', label: 'Inter' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* First Row - Typography and Text Formatting */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Font Family */}
        <Select 
          value={styles.fontFamily} 
          onValueChange={(value) => applyStyle({ fontFamily: value })}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs bg-gray-800 border-gray-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {fontFamilyOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                <span style={{ fontFamily: opt.value }}>{opt.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Font Size */}
        <Select 
          value={styles.fontSize} 
          onValueChange={(value) => applyStyle({ fontSize: value })}
        >
          <SelectTrigger className="w-[70px] h-8 text-xs bg-gray-800 border-gray-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {['10', '11', '12', '13', '14', '16', '18', '20', '24'].map(size => (
              <SelectItem key={size} value={size} className="text-xs">{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Font Size Adjust */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-700"
            onClick={() => {
              const currentSize = parseInt(styles.fontSize);
              if (currentSize > 10) applyStyle({ fontSize: String(currentSize - 1) });
            }}
          >
            <span className="text-xs">A-</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-700"
            onClick={() => {
              const currentSize = parseInt(styles.fontSize);
              if (currentSize < 24) applyStyle({ fontSize: String(currentSize + 1) });
            }}
          >
            <span className="text-xs">A+</span>
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Bold, Italic, Underline */}
        <div className="flex items-center">
          <Button
            variant={styles.fontWeight === 'bold' ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-8 w-8 p-0 ${styles.fontWeight === 'bold' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            onClick={() => applyStyle({ fontWeight: styles.fontWeight === 'bold' ? 'normal' : 'bold' })}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={styles.textDecoration.includes('italic') ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-8 w-8 p-0 ${styles.textDecoration.includes('italic') ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            onClick={() => {
              const newDeco = [...styles.textDecoration];
              const idx = newDeco.indexOf('italic');
              if (idx > -1) {
                newDeco.splice(idx, 1);
                applyStyle({ textDecoration: newDeco, fontStyle: 'normal' });
              } else {
                newDeco.push('italic');
                applyStyle({ textDecoration: newDeco, fontStyle: 'italic' });
              }
            }}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={styles.textDecoration.includes('underline') ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-8 w-8 p-0 ${styles.textDecoration.includes('underline') ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            onClick={() => {
              const newDeco = [...styles.textDecoration];
              const idx = newDeco.indexOf('underline');
              if (idx > -1) {
                newDeco.splice(idx, 1);
              } else {
                newDeco.push('underline');
              }
              applyStyle({ textDecoration: newDeco });
            }}
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Text Color */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 hover:bg-gray-700 flex items-center gap-1"
            onClick={() => setShowColorPicker(showColorPicker === 'text' ? null : 'text')}
          >
            <Type className="h-4 w-4" />
            <div 
              className="w-4 h-3 border border-gray-600" 
              style={{ backgroundColor: styles.textColor }}
            />
            <ChevronDown className="h-3 w-3" />
          </Button>
          {showColorPicker === 'text' && (
            <div className="absolute top-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
              <input
                type="color"
                value={styles.textColor}
                onChange={(e) => {
                  applyStyle({ textColor: e.target.value });
                  setShowColorPicker(null);
                }}
                className="w-32 h-32"
              />
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 w-full text-xs"
                onClick={() => {
                  const defaults = getDefaultStyles();
                  applyStyle({ textColor: defaults.textColor });
                  setShowColorPicker(null);
                }}
              >
                Reset to Theme Default
              </Button>
            </div>
          )}
        </div>

        {/* Background Color */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 hover:bg-gray-700 flex items-center gap-1"
            onClick={() => setShowColorPicker(showColorPicker === 'background' ? null : 'background')}
          >
            <Palette className="h-4 w-4" />
            <div 
              className="w-4 h-3 border border-gray-600" 
              style={{ backgroundColor: styles.backgroundColor }}
            />
            <ChevronDown className="h-3 w-3" />
          </Button>
          {showColorPicker === 'background' && (
            <div className="absolute top-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
              <input
                type="color"
                value={styles.backgroundColor}
                onChange={(e) => {
                  applyStyle({ backgroundColor: e.target.value });
                  setShowColorPicker(null);
                }}
                className="w-32 h-32"
              />
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 w-full text-xs"
                onClick={() => {
                  const defaults = getDefaultStyles();
                  applyStyle({ backgroundColor: defaults.backgroundColor });
                  setShowColorPicker(null);
                }}
              >
                Reset to Theme Default
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Second Row - Alignment and Borders */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Text Alignment */}
        <div className="flex items-center">
          <Button
            variant={styles.textAlign === 'left' ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-8 w-8 p-0 ${styles.textAlign === 'left' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            onClick={() => applyStyle({ textAlign: styles.textAlign === 'left' ? '' : 'left' })}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={styles.textAlign === 'center' ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-8 w-8 p-0 ${styles.textAlign === 'center' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            onClick={() => applyStyle({ textAlign: styles.textAlign === 'center' ? '' : 'center' })}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={styles.textAlign === 'right' ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-8 w-8 p-0 ${styles.textAlign === 'right' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            onClick={() => applyStyle({ textAlign: styles.textAlign === 'right' ? '' : 'right' })}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            variant={styles.textAlign === 'justify' ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-8 w-8 p-0 ${styles.textAlign === 'justify' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            onClick={() => applyStyle({ textAlign: styles.textAlign === 'justify' ? '' : 'justify' })}
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Borders */}
        <div className="flex items-center gap-1">
          <Button
            variant={(styles.borderTop && styles.borderRight && styles.borderBottom && styles.borderLeft) ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-8 w-8 p-0 ${(styles.borderTop && styles.borderRight && styles.borderBottom && styles.borderLeft) ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            onClick={() => {
              const allBorders = styles.borderTop && styles.borderRight && styles.borderBottom && styles.borderLeft;
              applyStyle({ 
                borderTop: !allBorders,
                borderRight: !allBorders,
                borderBottom: !allBorders,
                borderLeft: !allBorders
              });
            }}
            title="All borders"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={styles.borderTop ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-8 w-8 p-0 ${styles.borderTop ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            onClick={() => applyStyle({ borderTop: !styles.borderTop })}
            title="Top border"
          >
            <div className="w-4 h-4 border-t-2 border-current" />
          </Button>
          <Button
            variant={styles.borderRight ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-8 w-8 p-0 ${styles.borderRight ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            onClick={() => applyStyle({ borderRight: !styles.borderRight })}
            title="Right border"
          >
            <div className="w-4 h-4 border-r-2 border-current" />
          </Button>
          <Button
            variant={styles.borderBottom ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-8 w-8 p-0 ${styles.borderBottom ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            onClick={() => applyStyle({ borderBottom: !styles.borderBottom })}
            title="Bottom border"
          >
            <div className="w-4 h-4 border-b-2 border-current" />
          </Button>
          <Button
            variant={styles.borderLeft ? 'secondary' : 'ghost'}
            size="sm"
            className={`h-8 w-8 p-0 ${styles.borderLeft ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            onClick={() => applyStyle({ borderLeft: !styles.borderLeft })}
            title="Left border"
          >
            <div className="w-4 h-4 border-l-2 border-current" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-700"
            onClick={() => applyStyle({ 
              borderTop: false,
              borderRight: false,
              borderBottom: false,
              borderLeft: false
            })}
            title="No borders"
          >
            <Square className="h-4 w-4" />
          </Button>
          
          {/* Border Style Dropdown */}
          <Select 
            value={styles.borderStyle} 
            onValueChange={(value) => applyStyle({ borderStyle: value })}
          >
            <SelectTrigger className="w-[80px] h-8 text-xs bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="solid" className="text-xs">Solid</SelectItem>
              <SelectItem value="dashed" className="text-xs">Dashed</SelectItem>
              <SelectItem value="dotted" className="text-xs">Dotted</SelectItem>
              <SelectItem value="double" className="text-xs">Double</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Border Color */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 hover:bg-gray-700 flex items-center gap-1"
              onClick={() => setShowColorPicker(showColorPicker === 'border' ? null : 'border')}
            >
              <div 
                className="w-4 h-3 border-2" 
                style={{ borderColor: styles.borderColor }}
              />
              <ChevronDown className="h-3 w-3" />
            </Button>
            {showColorPicker === 'border' && (
              <div className="absolute top-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
                <input
                  type="color"
                  value={styles.borderColor}
                  onChange={(e) => {
                    applyStyle({ borderColor: e.target.value });
                    setShowColorPicker(null);
                  }}
                  className="w-32 h-32"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 w-full text-xs"
                  onClick={() => {
                    const defaults = getDefaultStyles();
                    applyStyle({ borderColor: defaults.borderColor });
                    setShowColorPicker(null);
                  }}
                >
                  Reset to Theme Default
                </Button>
              </div>
            )}
          </div>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Wrap Text */}
        <Button
          variant={styles.wrapText ? 'secondary' : 'ghost'}
          size="sm"
          className={`h-8 px-2 ${styles.wrapText ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
          onClick={() => applyStyle({ wrapText: !styles.wrapText })}
        >
          <WrapText className="h-4 w-4" />
        </Button>

        {/* Auto Height */}
        <Button
          variant={styles.autoHeight ? 'secondary' : 'ghost'}
          size="sm"
          className={`h-8 px-2 ${styles.autoHeight ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
          onClick={() => applyStyle({ autoHeight: !styles.autoHeight })}
          title="Auto Height"
        >
          <TableProperties className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Number Formatting */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 hover:bg-gray-700"
            title="Currency"
          >
            <DollarSign className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 hover:bg-gray-700"
            title="Percentage"
          >
            <Percent className="h-4 w-4" />
          </Button>
          <Select defaultValue="accounting">
            <SelectTrigger className="w-[120px] h-8 text-xs bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="accounting" className="text-xs">Accounting</SelectItem>
              <SelectItem value="number" className="text-xs">Number</SelectItem>
              <SelectItem value="currency" className="text-xs">Currency</SelectItem>
              <SelectItem value="percentage" className="text-xs">Percentage</SelectItem>
              <SelectItem value="date" className="text-xs">Date</SelectItem>
              <SelectItem value="time" className="text-xs">Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Decimal Places */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-1 hover:bg-gray-700"
            title="Decrease decimal places"
          >
            <span className="text-xs">.0</span>
            <Minus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-1 hover:bg-gray-700"
            title="Increase decimal places"
          >
            <span className="text-xs">.00</span>
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* Conditional Formatting */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 ml-auto border-gray-700 hover:bg-gray-700"
        >
          Conditional Formatting
        </Button>
      </div>
    </div>
  );
};