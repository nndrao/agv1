import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { 
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  PaintBucket,
  Square,
  Copy,
  Columns,
  FileText,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  X
} from 'lucide-react';
import { useColumnCustomizationStore } from '../../../dialogs/columnSettings/store/columnCustomization.store';
import { createCellStyleFunction } from '../../../utils/formatters';
import type { TabContentProps } from '../../types';
import '../../ribbon-styles.css';

export const StylingRibbonContent: React.FC<TabContentProps> = ({ selectedColumns }) => {
  const { updateBulkProperty, columnDefinitions, pendingChanges } = useColumnCustomizationStore();
  
  // Style target state (cell or header)
  const [styleTarget, setStyleTarget] = useState<'cell' | 'header'>('cell');
  
  // Color state management - empty string means use default
  const [textColor, setTextColor] = useState('');
  const [fillColor, setFillColor] = useState('');
  const [borderColor, setBorderColor] = useState('#cccccc');
  
  // Font state management
  const [fontFamily, setFontFamily] = useState('inter');
  const [fontWeight, setFontWeight] = useState('400');
  const [fontSize, setFontSize] = useState('14');
  
  // Border state management
  const [borderSide, setBorderSide] = useState<'none' | 'all' | 'top' | 'right' | 'bottom' | 'left'>('none');
  const [borderWidth, setBorderWidth] = useState('1px');
  const [borderStyle, setBorderStyle] = useState('solid');

  // Extract style object from cellStyle if it's a function - matching StylingTab
  const getCellStyleObject = () => {
    const currentCellStyle = getMixedValueLocal('cellStyle');
    if (currentCellStyle.value && typeof currentCellStyle.value === 'function') {
      // Check if this function has base style metadata
      const baseStyle = (currentCellStyle.value as any).__baseStyle;
      if (baseStyle) {
        return baseStyle;
      }
      // Don't pass function-based styles to the editor without base style
      return {};
    }
    return currentCellStyle.value || {};
  };

  // Extract style object from headerStyle if it's a function - matching StylingTab
  const getHeaderStyleObject = () => {
    const currentHeaderStyle = getMixedValueLocal('headerStyle');
    if (currentHeaderStyle.value && typeof currentHeaderStyle.value === 'function') {
      // Call the function with non-floating filter context to get the style object
      return currentHeaderStyle.value({ floatingFilter: false }) || {};
    }
    return currentHeaderStyle.value || {};
  };

  // Initialize colors from selected columns
  useEffect(() => {
    if (selectedColumns.size > 0) {
      // Get the appropriate style object based on current target
      const styleObj = styleTarget === 'cell' 
        ? getCellStyleObject()
        : getHeaderStyleObject();
      
      // Reset color states first
      setTextColor(styleObj.color && typeof styleObj.color === 'string' ? styleObj.color : '');
      setFillColor(styleObj.backgroundColor && typeof styleObj.backgroundColor === 'string' ? styleObj.backgroundColor : '');
      
      // Initialize font states
      if (styleObj.fontFamily) {
        // Map common font families to our select options
        const fontMap: Record<string, string> = {
          'Inter': 'inter',
          'Roboto': 'roboto',
          'Arial': 'arial',
          'Helvetica': 'helvetica',
          'Georgia': 'georgia',
          'JetBrains Mono': 'mono',
          'monospace': 'mono'
        };
        const fontValue = styleObj.fontFamily as string;
        setFontFamily(fontMap[fontValue] || 'inter');
      } else {
        setFontFamily('inter');
      }
      
      if (styleObj.fontWeight) {
        setFontWeight(String(styleObj.fontWeight));
      } else {
        setFontWeight('400');
      }
      
      if (styleObj.fontSize) {
        // Extract numeric value from fontSize (e.g., "14px" -> "14")
        const size = String(styleObj.fontSize).replace(/[^0-9]/g, '');
        setFontSize(size || '14');
      } else {
        setFontSize('14');
      }
      
      // Initialize border states
      let detectedSide: 'none' | 'all' | 'top' | 'right' | 'bottom' | 'left' = 'none';
      
      // Check for all borders first
      if (styleObj.border && styleObj.border !== 'none') {
        detectedSide = 'all';
        // Extract border properties from border shorthand
        if (typeof styleObj.border === 'string') {
          const borderParts = styleObj.border.split(' ');
          if (borderParts.length >= 2) {
            setBorderWidth(borderParts[0]);
            setBorderStyle(borderParts[1]);
            if (borderParts[2]) setBorderColor(borderParts[2]);
          }
        }
      } 
      // Check for individual borders
      else if (styleObj.borderTop && styleObj.borderTop !== 'none') {
        detectedSide = 'top';
        if (typeof styleObj.borderTop === 'string') {
          const borderParts = styleObj.borderTop.split(' ');
          if (borderParts.length >= 2) {
            setBorderWidth(borderParts[0]);
            setBorderStyle(borderParts[1]);
            if (borderParts[2]) setBorderColor(borderParts[2]);
          }
        }
      } else if (styleObj.borderRight && styleObj.borderRight !== 'none') {
        detectedSide = 'right';
        if (typeof styleObj.borderRight === 'string') {
          const borderParts = styleObj.borderRight.split(' ');
          if (borderParts.length >= 2) {
            setBorderWidth(borderParts[0]);
            setBorderStyle(borderParts[1]);
            if (borderParts[2]) setBorderColor(borderParts[2]);
          }
        }
      } else if (styleObj.borderBottom && styleObj.borderBottom !== 'none') {
        detectedSide = 'bottom';
        if (typeof styleObj.borderBottom === 'string') {
          const borderParts = styleObj.borderBottom.split(' ');
          if (borderParts.length >= 2) {
            setBorderWidth(borderParts[0]);
            setBorderStyle(borderParts[1]);
            if (borderParts[2]) setBorderColor(borderParts[2]);
          }
        }
      } else if (styleObj.borderLeft && styleObj.borderLeft !== 'none') {
        detectedSide = 'left';
        if (typeof styleObj.borderLeft === 'string') {
          const borderParts = styleObj.borderLeft.split(' ');
          if (borderParts.length >= 2) {
            setBorderWidth(borderParts[0]);
            setBorderStyle(borderParts[1]);
            if (borderParts[2]) setBorderColor(borderParts[2]);
          }
        }
      }
      
      // Check if all individual sides have borders
      if (detectedSide === 'none' && 
          styleObj.borderTop && styleObj.borderTop !== 'none' &&
          styleObj.borderRight && styleObj.borderRight !== 'none' &&
          styleObj.borderBottom && styleObj.borderBottom !== 'none' &&
          styleObj.borderLeft && styleObj.borderLeft !== 'none') {
        detectedSide = 'all';
      }
      
      setBorderSide(detectedSide);
    }
  }, [selectedColumns, styleTarget, columnDefinitions, pendingChanges]); // Depend on actual data changes
  
  // Helper function to get mixed values for multi-column editing
  const getMixedValueLocal = (property: string) => {
    const values = new Set();
    const allValues: unknown[] = [];

    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const pendingChange = pendingChanges.get(colId);

      // Check pending changes first, then fall back to column definition
      let value;
      if (pendingChange && property in pendingChange) {
        value = pendingChange[property as keyof typeof pendingChange];
      } else if (colDef) {
        value = colDef[property as keyof typeof colDef];
      }

      values.add(value);
      allValues.push(value);
    });

    if (values.size === 0) return { value: undefined, isMixed: false };
    if (values.size === 1) return { value: Array.from(values)[0], isMixed: false };
    return { value: undefined, isMixed: true, values: allValues };
  };

  const getCurrentStyles = () => {
    const styles: string[] = [];
    
    const baseStyles = styleTarget === 'cell' 
      ? getCellStyleObject()
      : getHeaderStyleObject();
      
    if (baseStyles.fontWeight === 'bold' || baseStyles.fontWeight === '700') styles.push('bold');
    if (baseStyles.fontStyle === 'italic') styles.push('italic');
    if (baseStyles.textDecoration === 'underline') styles.push('underline');
    
    return styles;
  };

  const getCurrentAlignment = () => {
    // Get alignment from the appropriate class property based on style target
    const property = styleTarget === 'header' ? 'headerClass' : 'cellClass';
    const classValue = getMixedValueLocal(property);
    const classes = (typeof classValue.value === 'string' ? classValue.value : '').trim();
    
    if (classes.includes('text-center') || classes.includes('justify-center')) return 'center';
    if (classes.includes('text-right') || classes.includes('justify-end')) return 'right';
    return 'left';
  };

  const handleAlignmentChange = (value: string) => {
    if (!value) return;
    
    // Apply alignment to the appropriate class property based on style target
    const property = styleTarget === 'header' ? 'headerClass' : 'cellClass';
    const currentClassValue = getMixedValueLocal(property).value as string || '';
    const classArray = currentClassValue ? currentClassValue.split(' ').filter(c => c) : [];
    
    // Remove existing alignment classes
    const filteredClasses = classArray.filter(c => 
      !c.includes('text-left') && !c.includes('text-center') && !c.includes('text-right') &&
      !c.includes('justify-start') && !c.includes('justify-center') && !c.includes('justify-end')
    );
    
    // Add new alignment classes
    if (value === 'left') {
      filteredClasses.push('text-left', 'justify-start');
    } else if (value === 'center') {
      filteredClasses.push('text-center', 'justify-center');
    } else if (value === 'right') {
      filteredClasses.push('text-right', 'justify-end');
    }
    
    const newClass = filteredClasses.join(' ').trim();
    updateBulkProperty(property, newClass || undefined);
  };

  const getCurrentVerticalAlignment = () => {
    // Get alignment from the appropriate class property based on style target
    const property = styleTarget === 'header' ? 'headerClass' : 'cellClass';
    const classValue = getMixedValueLocal(property);
    const classes = (typeof classValue.value === 'string' ? classValue.value : '').trim();
    
    if (classes.includes('items-start')) return 'top';
    if (classes.includes('items-center')) return 'middle';
    if (classes.includes('items-end')) return 'bottom';
    return 'middle'; // default
  };

  const handleVerticalAlignmentChange = (value: string) => {
    if (!value) return;
    
    // Apply alignment to the appropriate class property based on style target
    const property = styleTarget === 'header' ? 'headerClass' : 'cellClass';
    const currentClassValue = getMixedValueLocal(property).value as string || '';
    const classArray = currentClassValue ? currentClassValue.split(' ').filter(c => c) : [];
    
    // Remove existing vertical alignment classes
    const filteredClasses = classArray.filter(c => 
      !c.includes('items-start') && !c.includes('items-center') && !c.includes('items-end')
    );
    
    // Add new vertical alignment class
    if (value === 'top') {
      filteredClasses.push('items-start');
    } else if (value === 'middle') {
      filteredClasses.push('items-center');
    } else if (value === 'bottom') {
      filteredClasses.push('items-end');
    }
    
    const newClass = filteredClasses.join(' ').trim();
    updateBulkProperty(property, newClass || undefined);
  };

  // Handle cell style updates - matching the exact pattern from StylingTab
  const handleCellStyleSave = (style: React.CSSProperties) => {
    // Check if we have conditional formatting that needs to be preserved
    let hasConditionalFormatting = false;
    let formatString = '';
    
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const pendingChange = pendingChanges.get(colId);
      
      // Check pending changes first, then column definition
      const valueFormatter = pendingChange?.valueFormatter || colDef?.valueFormatter;
      const cellStyle = pendingChange?.cellStyle || colDef?.cellStyle;
      
      // First check if valueFormatter has format string metadata
      if (valueFormatter && typeof valueFormatter === 'function') {
        const metadata = (valueFormatter as any).__formatString;
        if (metadata && metadata.includes('[') && metadata.includes(']')) {
          // Check if format string contains style directives OR color specifications
          const hasStyleDirectives = metadata.match(/\[(BG:|Background:|Border:|B:|Size:|FontSize:|Align:|TextAlign:|Padding:|P:|Weight:|FontWeight:|Bold|Italic|Underline|Center|Left|Right|#[0-9A-Fa-f]{3,6}|Red|Green|Blue|Yellow|Orange|Purple|Gray|Grey|Black|White|Magenta|Cyan)/i);
          if (hasStyleDirectives) {
            hasConditionalFormatting = true;
            formatString = metadata;
          }
        }
      }
      
      // Also check if existing cellStyle has format string metadata
      if (!hasConditionalFormatting && cellStyle && typeof cellStyle === 'function') {
        const metadata = (cellStyle as any).__formatString;
        if (metadata && metadata.includes('[') && metadata.includes(']')) {
          hasConditionalFormatting = true;
          formatString = metadata;
        }
      }
    });
    
    if (hasConditionalFormatting) {
      // We have conditional formatting from valueFormatter
      // Create a cellStyle function that merges base styles with conditional styles
      const cellStyleFn = (params: { value: unknown }) => {
        // Always start with base styles
        const baseStyles = style && Object.keys(style).length > 0 ? { ...style } : {};
        
        // Get conditional styles using createCellStyleFunction with empty base
        const conditionalStyleFn = createCellStyleFunction(formatString, {});
        const conditionalStyles = conditionalStyleFn(params) || {};
        
        // Always merge base and conditional styles, with conditional taking precedence
        const mergedStyles = { ...baseStyles, ...conditionalStyles };
        
        // Return merged styles if we have any, otherwise undefined
        return Object.keys(mergedStyles).length > 0 ? mergedStyles : undefined;
      };
      
      // Attach metadata for future serialization
      Object.defineProperty(cellStyleFn, '__formatString', { 
        value: formatString, 
        writable: false,
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(cellStyleFn, '__baseStyle', { 
        value: style, 
        writable: false,
        enumerable: false,
        configurable: true
      });
      updateBulkProperty('cellStyle', cellStyleFn);
    } else {
      // No conditional formatting, just save the style directly
      updateBulkProperty('cellStyle', style);
    }
  };

  // Handle header style updates - matching the exact pattern from StylingTab
  const handleHeaderStyleSave = (style: React.CSSProperties) => {
    // Create a function that applies styles only to regular headers, not floating filters
    const headerStyleFn = (params: { floatingFilter?: boolean }) => {
      // Don't apply styles to floating filter row
      if (params?.floatingFilter) {
        return null;
      }
      return style;
    };
    
    updateBulkProperty('headerStyle', headerStyleFn);
  };

  // Unified style update function that delegates to the appropriate handler
  const updateStyle = (newStyles: React.CSSProperties) => {
    // Get current base styles and merge with new styles
    const currentBaseStyles = styleTarget === 'cell' 
      ? getCellStyleObject() 
      : getHeaderStyleObject();
    const mergedStyles = { ...currentBaseStyles, ...newStyles };
    
    if (styleTarget === 'cell') {
      handleCellStyleSave(mergedStyles);
    } else {
      handleHeaderStyleSave(mergedStyles);
    }
  };

  const handleStyleToggle = (style: 'bold' | 'italic' | 'underline', pressed: boolean) => {
    const styleUpdates: React.CSSProperties = {};
    
    if (style === 'bold') {
      if (pressed) {
        styleUpdates.fontWeight = 'bold';
      } else {
        styleUpdates.fontWeight = 'normal';
      }
    } else if (style === 'italic') {
      if (pressed) {
        styleUpdates.fontStyle = 'italic';
      } else {
        styleUpdates.fontStyle = 'normal';
      }
    } else if (style === 'underline') {
      if (pressed) {
        styleUpdates.textDecoration = 'underline';
      } else {
        styleUpdates.textDecoration = 'none';
      }
    }
    
    updateStyle(styleUpdates);
  };
  
  const handleFontChange = (property: 'family' | 'weight' | 'size', value: string) => {
    const styleUpdates: React.CSSProperties = {};
    
    if (property === 'family') {
      setFontFamily(value);
      // Map select values to actual font families
      const fontMap: Record<string, string> = {
        'inter': 'Inter',
        'roboto': 'Roboto',
        'arial': 'Arial',
        'helvetica': 'Helvetica',
        'georgia': 'Georgia',
        'mono': 'JetBrains Mono, monospace'
      };
      styleUpdates.fontFamily = fontMap[value] || 'Inter';
    } else if (property === 'weight') {
      setFontWeight(value);
      styleUpdates.fontWeight = value;
    } else if (property === 'size') {
      setFontSize(value);
      styleUpdates.fontSize = `${value}px`;
    }
    
    updateStyle(styleUpdates);
  };

  const handleColorChange = (colorType: 'text' | 'fill' | 'border', color: string) => {
    const styleUpdates: React.CSSProperties = {};
    
    if (colorType === 'text') {
      setTextColor(color);
      // Only apply color if it's not empty
      if (color) {
        styleUpdates.color = color;
      }
    } else if (colorType === 'fill') {
      setFillColor(color);
      // Only apply backgroundColor if it's not empty
      if (color) {
        styleUpdates.backgroundColor = color;
      }
    } else if (colorType === 'border') {
      setBorderColor(color);
      
      // If a border side is selected (not 'none'), update them
      if (borderSide !== 'none') {
        // Get current styles
        const currentBaseStyles = styleTarget === 'cell' 
          ? getCellStyleObject() 
          : getHeaderStyleObject();
        
        const fullStyleUpdates: React.CSSProperties = {
          ...currentBaseStyles
        };
        
        // Clear existing borders
        delete fullStyleUpdates.border;
        delete fullStyleUpdates.borderTop;
        delete fullStyleUpdates.borderRight;
        delete fullStyleUpdates.borderBottom;
        delete fullStyleUpdates.borderLeft;
        
        // Apply updated border with new color
        if (borderSide === 'all') {
          fullStyleUpdates.border = `${borderWidth} ${borderStyle} ${color}`;
        } else {
          // Set all borders to none first
          fullStyleUpdates.borderTop = 'none';
          fullStyleUpdates.borderRight = 'none';
          fullStyleUpdates.borderBottom = 'none';
          fullStyleUpdates.borderLeft = 'none';
          // Then set the selected side
          fullStyleUpdates[`border${borderSide.charAt(0).toUpperCase() + borderSide.slice(1)}` as keyof React.CSSProperties] = 
            `${borderWidth} ${borderStyle} ${color}` as any;
        }
        
        // Save the complete style object
        if (styleTarget === 'cell') {
          handleCellStyleSave(fullStyleUpdates);
        } else {
          handleHeaderStyleSave(fullStyleUpdates);
        }
      }
      return; // Exit early for border color changes
    }
    
    updateStyle(styleUpdates);
  };

  const handleBorderSideChange = (newSide: 'none' | 'all' | 'top' | 'right' | 'bottom' | 'left') => {
    setBorderSide(newSide);
    
    // Get current styles
    const currentBaseStyles = styleTarget === 'cell' 
      ? getCellStyleObject() 
      : getHeaderStyleObject();
    
    // Start with current styles
    const styleUpdates: React.CSSProperties = {
      ...currentBaseStyles
    };
    
    // Clear all border-related properties
    delete styleUpdates.border;
    delete styleUpdates.borderWidth;
    delete styleUpdates.borderStyle;
    delete styleUpdates.borderColor;
    delete styleUpdates.borderTop;
    delete styleUpdates.borderRight;
    delete styleUpdates.borderBottom;
    delete styleUpdates.borderLeft;
    
    if (newSide === 'none') {
      // Remove all borders
      styleUpdates.border = 'none';
    } else if (newSide === 'all') {
      // Apply border to all sides
      styleUpdates.border = `${borderWidth} ${borderStyle} ${borderColor}`;
    } else {
      // Apply border to specific side only
      styleUpdates.borderTop = 'none';
      styleUpdates.borderRight = 'none';
      styleUpdates.borderBottom = 'none';
      styleUpdates.borderLeft = 'none';
      styleUpdates[`border${newSide.charAt(0).toUpperCase() + newSide.slice(1)}` as keyof React.CSSProperties] = 
        `${borderWidth} ${borderStyle} ${borderColor}` as any;
    }
    
    // Save the complete style object
    if (styleTarget === 'cell') {
      handleCellStyleSave(styleUpdates);
    } else {
      handleHeaderStyleSave(styleUpdates);
    }
  };

  const handleBorderPropertyChange = (property: 'width' | 'style', value: string) => {
    if (property === 'width') {
      setBorderWidth(value);
    } else {
      setBorderStyle(value);
    }
    
    // If a border side is selected (not 'none'), update them
    if (borderSide !== 'none') {
      // Get current styles
      const currentBaseStyles = styleTarget === 'cell' 
        ? getCellStyleObject() 
        : getHeaderStyleObject();
      
      // Build complete style object
      const styleUpdates: React.CSSProperties = {
        ...currentBaseStyles
      };
      
      // Clear existing borders
      delete styleUpdates.border;
      delete styleUpdates.borderTop;
      delete styleUpdates.borderRight;
      delete styleUpdates.borderBottom;
      delete styleUpdates.borderLeft;
      
      // Apply updated border
      if (borderSide === 'all') {
        styleUpdates.border = `${borderWidth} ${borderStyle} ${borderColor}`;
      } else {
        // Set all borders to none first
        styleUpdates.borderTop = 'none';
        styleUpdates.borderRight = 'none';
        styleUpdates.borderBottom = 'none';
        styleUpdates.borderLeft = 'none';
        // Then set the selected side
        styleUpdates[`border${borderSide.charAt(0).toUpperCase() + borderSide.slice(1)}` as keyof React.CSSProperties] = 
          `${borderWidth} ${borderStyle} ${borderColor}` as any;
      }
      
      // Save the complete style object
      if (styleTarget === 'cell') {
        handleCellStyleSave(styleUpdates);
      } else {
        handleHeaderStyleSave(styleUpdates);
      }
    }
  };

  // Generate preview styles based on the current style target (cell or header)
  const getPreviewStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    
    // Use custom colors if set, otherwise inherit from parent (ribbon default)
    if (textColor) {
      styles.color = textColor;
    }
    if (fillColor) {
      styles.backgroundColor = fillColor;
    }
    
    // Apply font family, weight, and size from state
    const fontMap: Record<string, string> = {
      'inter': 'Inter',
      'roboto': 'Roboto',
      'arial': 'Arial',
      'helvetica': 'Helvetica',
      'georgia': 'Georgia',
      'mono': 'JetBrains Mono, monospace'
    };
    styles.fontFamily = fontMap[fontFamily] || 'Inter';
    styles.fontSize = `${fontSize}px`;
    
    // Apply font weight - if bold is toggled, use 'bold', otherwise use the selected weight
    const currentStyles = getCurrentStyles();
    if (currentStyles.includes('bold')) {
      styles.fontWeight = 'bold';
    } else {
      styles.fontWeight = fontWeight;
    }
    
    // Apply italic and underline
    if (currentStyles.includes('italic')) styles.fontStyle = 'italic';
    if (currentStyles.includes('underline')) styles.textDecoration = 'underline';
    
    // Apply alignment for preview
    const alignment = getCurrentAlignment();
    styles.display = 'flex';
    styles.alignItems = 'center';
    
    if (alignment === 'center') {
      styles.textAlign = 'center';
      styles.justifyContent = 'center';
    } else if (alignment === 'right') {
      styles.textAlign = 'right';
      styles.justifyContent = 'flex-end';
    } else {
      styles.textAlign = 'left';
      styles.justifyContent = 'flex-start';
    }
    
    // Apply borders based on current selections
    if (borderSide !== 'none') {
      if (borderSide === 'all') {
        styles.border = `${borderWidth} ${borderStyle} ${borderColor}`;
      } else {
        styles[`border${borderSide.charAt(0).toUpperCase() + borderSide.slice(1)}` as keyof React.CSSProperties] = 
          `${borderWidth} ${borderStyle} ${borderColor}` as any;
      }
    }
    
    // Get any additional styles from the column definition
    if (selectedColumns.size > 0) {
      // Get the appropriate style object based on current target
      const baseStyles = styleTarget === 'cell' 
        ? getCellStyleObject()
        : getHeaderStyleObject();
      
      // Apply any font-related styles that aren't already set
      if (baseStyles.fontFamily) styles.fontFamily = baseStyles.fontFamily;
      if (baseStyles.fontSize) styles.fontSize = baseStyles.fontSize;
      if (baseStyles.lineHeight) styles.lineHeight = baseStyles.lineHeight;
      if (baseStyles.letterSpacing) styles.letterSpacing = baseStyles.letterSpacing;
      if (baseStyles.textTransform) styles.textTransform = baseStyles.textTransform;
      if (baseStyles.fontVariant) styles.fontVariant = baseStyles.fontVariant;
      
      // Apply padding if set
      if (baseStyles.padding) styles.padding = baseStyles.padding;
      if (baseStyles.paddingLeft) styles.paddingLeft = baseStyles.paddingLeft;
      if (baseStyles.paddingRight) styles.paddingRight = baseStyles.paddingRight;
      if (baseStyles.paddingTop) styles.paddingTop = baseStyles.paddingTop;
      if (baseStyles.paddingBottom) styles.paddingBottom = baseStyles.paddingBottom;
    }
    
    // For headers, add default header styling if not already bold
    if (styleTarget === 'header' && !styles.fontWeight) {
      styles.fontWeight = '500';
    }
    
    return styles;
  };

  return (
    <div className="space-y-2">
      {/* Cell/Header Toggle with Preview */}
      <div className="flex items-center justify-between mb-2">
        <ToggleGroup 
          type="single" 
          value={styleTarget} 
          onValueChange={(value) => value && setStyleTarget(value as 'cell' | 'header')}
          size="sm"
        >
          <ToggleGroupItem value="cell" className="cell-header-toggle text-xs h-7">
            <Columns className="h-3 w-3 mr-1" />
            Cell
          </ToggleGroupItem>
          <ToggleGroupItem value="header" className="cell-header-toggle text-xs h-7">
            <FileText className="h-3 w-3 mr-1" />
            Header
          </ToggleGroupItem>
        </ToggleGroup>
        
        {/* Live Preview - Centered */}
        <div className="flex-1 flex justify-center">
          <div className="bg-muted/20 rounded-md p-1.5 flex items-center gap-2" style={{ width: '300px' }}>
            <span className="text-xs text-muted-foreground font-semibold">Preview:</span>
            <div className="flex-1 bg-background border rounded overflow-hidden">
              <div 
                className="px-2 py-1 min-h-[28px] text-xs"
                style={getPreviewStyles()}
              >
                {styleTarget === 'header' ? (
                  selectedColumns.size === 1 ? (
                    // Show the actual column header name
                    columnDefinitions.get(Array.from(selectedColumns)[0])?.headerName || 
                    columnDefinitions.get(Array.from(selectedColumns)[0])?.field || 
                    'Column Header'
                  ) : (
                    'Column Header'
                  )
                ) : (
                  'Sample Text 123'
                )}
              </div>
            </div>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs h-7"
          onClick={() => {
            // Copy current styles to the other target
            const sourceStyles = styleTarget === 'cell' 
              ? getCellStyleObject()
              : getHeaderStyleObject();
            
            if (Object.keys(sourceStyles).length > 0) {
              // Switch to the other target and apply the styles
              setStyleTarget(styleTarget === 'cell' ? 'header' : 'cell');
              setTimeout(() => updateStyle(sourceStyles), 0);
            }
          }}
        >
          <Copy className="h-3 w-3 mr-1" />
          Copy to {styleTarget === 'cell' ? 'Header' : 'Cell'}
        </Button>
      </div>
      
      {/* 4-Column Layout */}
      <div className="grid grid-cols-4 gap-3">
        {/* Column 1 - Font */}
        <div className="space-y-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Font</Label>
            <Select value={fontFamily} onValueChange={(value) => handleFontChange('family', value)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inter">Inter</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
                <SelectItem value="arial">Arial</SelectItem>
                <SelectItem value="helvetica">Helvetica</SelectItem>
                <SelectItem value="georgia">Georgia</SelectItem>
                <SelectItem value="mono">JetBrains Mono</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-1">
            <Select value={fontWeight} onValueChange={(value) => handleFontChange('weight', value)}>
              <SelectTrigger className="h-7 flex-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="300">Light</SelectItem>
                <SelectItem value="400">Regular</SelectItem>
                <SelectItem value="500">Medium</SelectItem>
                <SelectItem value="600">Semibold</SelectItem>
                <SelectItem value="700">Bold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fontSize} onValueChange={(value) => handleFontChange('size', value)}>
              <SelectTrigger className="h-7 flex-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8</SelectItem>
                <SelectItem value="9">9</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="11">11</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="14">14</SelectItem>
                <SelectItem value="16">16</SelectItem>
                <SelectItem value="18">18</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="28">28</SelectItem>
                <SelectItem value="32">32</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-1">
            <Toggle 
              size="sm" 
              className="ribbon-toggle h-7 w-7" 
              pressed={getCurrentStyles().includes('bold')}
              onPressedChange={(pressed) => handleStyleToggle('bold', pressed)}
            >
              <Bold className="h-3 w-3" />
            </Toggle>
            <Toggle 
              size="sm" 
              className="ribbon-toggle h-7 w-7"
              pressed={getCurrentStyles().includes('italic')}
              onPressedChange={(pressed) => handleStyleToggle('italic', pressed)}
            >
              <Italic className="h-3 w-3" />
            </Toggle>
            <Toggle 
              size="sm" 
              className="ribbon-toggle h-7 w-7"
              pressed={getCurrentStyles().includes('underline')}
              onPressedChange={(pressed) => handleStyleToggle('underline', pressed)}
            >
              <Underline className="h-3 w-3" />
            </Toggle>
          </div>
        </div>
        
        {/* Column 2 - Alignment */}
        <div className="space-y-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Alignment</Label>
            <ToggleGroup 
              type="single" 
              size="sm" 
              value={getCurrentAlignment()}
              onValueChange={handleAlignmentChange}
              className="w-full"
            >
              <ToggleGroupItem value="left" className="alignment-toggle-item h-7 flex-1">
                <AlignLeft className="h-3 w-3" />
              </ToggleGroupItem>
              <ToggleGroupItem value="center" className="alignment-toggle-item h-7 flex-1">
                <AlignCenter className="h-3 w-3" />
              </ToggleGroupItem>
              <ToggleGroupItem value="right" className="alignment-toggle-item h-7 flex-1">
                <AlignRight className="h-3 w-3" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Vertical</Label>
            <ToggleGroup 
              type="single" 
              size="sm" 
              value={getCurrentVerticalAlignment()}
              onValueChange={(value) => handleVerticalAlignmentChange(value)}
              className="w-full"
            >
              <ToggleGroupItem value="top" className="alignment-toggle-item h-7 flex-1" aria-label="Align top">
                <AlignVerticalJustifyStart className="h-3 w-3" />
              </ToggleGroupItem>
              <ToggleGroupItem value="middle" className="alignment-toggle-item h-7 flex-1" aria-label="Align middle">
                <AlignVerticalJustifyCenter className="h-3 w-3" />
              </ToggleGroupItem>
              <ToggleGroupItem value="bottom" className="alignment-toggle-item h-7 flex-1" aria-label="Align bottom">
                <AlignVerticalJustifyEnd className="h-3 w-3" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <Switch id="wrap-text" className="h-4 w-7" />
              <Label htmlFor="wrap-text" className="text-xs cursor-pointer">
                Wrap
              </Label>
            </div>
            <div className="flex items-center gap-1">
              <Switch id="auto-height" className="h-4 w-7" />
              <Label htmlFor="auto-height" className="text-xs cursor-pointer">
                Auto
              </Label>
            </div>
          </div>
        </div>
        
        {/* Column 3 - Colors */}
        <div className="space-y-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Colors</Label>
            <div className="flex items-center gap-1">
              <Type className="h-3 w-3 text-muted-foreground" />
              <input
                type="color"
                value={textColor || '#000000'}
                onChange={(e) => handleColorChange('text', e.target.value)}
                className="h-7 w-7 rounded border border-input cursor-pointer"
                title="Text color"
              />
              <Input
                value={textColor}
                onChange={(e) => handleColorChange('text', e.target.value)}
                className="h-7 flex-1 text-xs font-mono uppercase"
                placeholder="Default"
                maxLength={7}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <PaintBucket className="h-3 w-3 text-muted-foreground" />
            <input
              type="color"
              value={fillColor || '#ffffff'}
              onChange={(e) => handleColorChange('fill', e.target.value)}
              className="h-7 w-7 rounded border border-input cursor-pointer"
              title="Fill color"
            />
            <Input
              value={fillColor}
              onChange={(e) => handleColorChange('fill', e.target.value)}
              className="h-7 flex-1 text-xs font-mono uppercase"
              placeholder="Default"
              maxLength={7}
            />
          </div>
        </div>
        
        {/* Column 4 - Borders */}
        <div className="space-y-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Borders</Label>
            
            {/* Border side selector */}
            <Select 
              value={borderSide} 
              onValueChange={handleBorderSideChange}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-1">
                    <X className="h-3 w-3" />
                    <span>None</span>
                  </div>
                </SelectItem>
                <SelectItem value="all">
                  <div className="flex items-center gap-1">
                    <Square className="h-3 w-3" />
                    <span>All Sides</span>
                  </div>
                </SelectItem>
                <SelectItem value="top">
                  <div className="flex items-center gap-1">
                    <ArrowUp className="h-3 w-3" />
                    <span>Top</span>
                  </div>
                </SelectItem>
                <SelectItem value="right">
                  <div className="flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    <span>Right</span>
                  </div>
                </SelectItem>
                <SelectItem value="bottom">
                  <div className="flex items-center gap-1">
                    <ArrowDown className="h-3 w-3" />
                    <span>Bottom</span>
                  </div>
                </SelectItem>
                <SelectItem value="left">
                  <div className="flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" />
                    <span>Left</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Border properties */}
            <div className="flex gap-1">
              <Select 
                value={borderWidth} 
                onValueChange={(value) => handleBorderPropertyChange('width', value)}
                disabled={borderSide === 'none'}
              >
                <SelectTrigger className="h-7 w-14 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1px">1px</SelectItem>
                  <SelectItem value="2px">2px</SelectItem>
                  <SelectItem value="3px">3px</SelectItem>
                  <SelectItem value="4px">4px</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={borderStyle} 
                onValueChange={(value) => handleBorderPropertyChange('style', value)}
                disabled={borderSide === 'none'}
              >
                <SelectTrigger className="h-7 flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="color"
                value={borderColor}
                onChange={(e) => handleColorChange('border', e.target.value)}
                className="h-7 w-7 rounded border border-input cursor-pointer"
                title="Border color"
                disabled={borderSide === 'none'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 