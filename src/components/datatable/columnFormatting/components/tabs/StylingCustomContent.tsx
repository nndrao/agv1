import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
  Columns,
  FileText,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { useColumnFormattingStore } from '../../store/columnFormatting.store';
import { useMixedValue } from '../../hooks/useMixedValue';
import { CustomSection, CustomSwitch, CustomSelect, CustomColorPicker } from '../common';
import { createCellStyleFunction } from '@/components/datatable/utils/formatters';
import type { TabContentProps } from '../../types';
import type { SelectOption } from '../common';
import '../../custom-styles.css';

// Font options
const FONT_FAMILY_OPTIONS: SelectOption[] = [
  { value: 'inter', label: 'Inter' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'arial', label: 'Arial' },
  { value: 'helvetica', label: 'Helvetica' },
  { value: 'georgia', label: 'Georgia' },
  { value: 'mono', label: 'JetBrains Mono' }
];

const FONT_WEIGHT_OPTIONS: SelectOption[] = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' }
];

const FONT_SIZE_OPTIONS: SelectOption[] = [
  { value: '8', label: '8' },
  { value: '9', label: '9' },
  { value: '10', label: '10' },
  { value: '11', label: '11' },
  { value: '12', label: '12' },
  { value: '14', label: '14' },
  { value: '16', label: '16' },
  { value: '18', label: '18' },
  { value: '20', label: '20' },
  { value: '24', label: '24' },
  { value: '28', label: '28' },
  { value: '32', label: '32' }
];

const BORDER_WIDTH_OPTIONS: SelectOption[] = [
  { value: '0px', label: 'None' },
  { value: '1px', label: '1px' },
  { value: '2px', label: '2px' },
  { value: '3px', label: '3px' },
  { value: '4px', label: '4px' }
];

const BORDER_STYLE_OPTIONS: SelectOption[] = [
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'double', label: 'Double' }
];

export const StylingCustomContent: React.FC<TabContentProps> = ({ selectedColumns }) => {
  const { updateBulkProperty, columnDefinitions, pendingChanges } = useColumnFormattingStore();
  
  // Use the new hooks for mixed values
  const cellStyleValue = useMixedValue('cellStyle', selectedColumns);
  const headerStyleValue = useMixedValue('headerStyle', selectedColumns);
  const cellClassValue = useMixedValue('cellClass', selectedColumns);
  const headerClassValue = useMixedValue('headerClass', selectedColumns);
  const wrapTextValue = useMixedValue('wrapText', selectedColumns);
  const autoHeightValue = useMixedValue('autoHeight', selectedColumns);
  const wrapHeaderTextValue = useMixedValue('wrapHeaderText', selectedColumns);
  const autoHeaderHeightValue = useMixedValue('autoHeaderHeight', selectedColumns);
  
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
    const currentCellStyle = cellStyleValue;
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
    const currentHeaderStyle = headerStyleValue;
    if (currentHeaderStyle.value && typeof currentHeaderStyle.value === 'function') {
      // Check if this function has base style metadata
      const baseStyle = (currentHeaderStyle.value as any).__baseStyle;
      if (baseStyle) {
        return baseStyle;
      }
      // Don't pass function-based styles to the editor without base style
      return {};
    }
    return currentHeaderStyle.value || {};
  };

  // Initialize styles from current selection
  useEffect(() => {
    if (styleTarget === 'cell') {
      const styles = getCellStyleObject();
      if (typeof styles === 'object' && styles !== null) {
        setTextColor(styles.color || '');
        setFillColor(styles.backgroundColor || '');
        
        // Font styles
        const fontFamilyMap: Record<string, string> = {
          'Inter': 'inter',
          'Roboto': 'roboto',
          'Arial': 'arial',
          'Helvetica': 'helvetica',
          'Georgia': 'georgia',
          '"JetBrains Mono"': 'mono',
          'JetBrains Mono': 'mono'
        };
        
        if (styles.fontFamily) {
          const mappedFamily = fontFamilyMap[styles.fontFamily] || 'inter';
          setFontFamily(mappedFamily);
        }
        
        if (styles.fontWeight) {
          setFontWeight(String(styles.fontWeight));
        }
        
        if (styles.fontSize) {
          setFontSize(String(styles.fontSize).replace('px', ''));
        }
        
        // Border styles
        if (styles.border) {
          setBorderWidth('1px');
          setBorderStyle('solid');
          setBorderSide('all');
        } else if (styles.borderTop || styles.borderRight || styles.borderBottom || styles.borderLeft) {
          if (styles.borderTop) setBorderSide('top');
          else if (styles.borderRight) setBorderSide('right');
          else if (styles.borderBottom) setBorderSide('bottom');
          else if (styles.borderLeft) setBorderSide('left');
        } else {
          setBorderSide('none');
        }
      }
    } else {
      const styles = getHeaderStyleObject();
      if (typeof styles === 'object' && styles !== null) {
        setTextColor(styles.color || '');
        setFillColor(styles.backgroundColor || '');
        
        // Similar style extraction for header...
      }
    }
  }, [styleTarget, selectedColumns]);

  // Font change handler
  const handleFontChange = (type: 'family' | 'weight' | 'size', value: string) => {
    if (type === 'family') {
      setFontFamily(value);
    } else if (type === 'weight') {
      setFontWeight(value);
    } else if (type === 'size') {
      setFontSize(value);
    }
    updateStyleProperty();
  };

  // Color change handler
  const handleColorChange = (type: 'text' | 'fill' | 'border', value: string) => {
    if (type === 'text') {
      setTextColor(value);
    } else if (type === 'fill') {
      setFillColor(value);
    } else if (type === 'border') {
      setBorderColor(value);
    }
    updateStyleProperty();
  };

  // Border change handler
  const handleBorderChange = (type: 'side' | 'width' | 'style', value: string) => {
    if (type === 'side') {
      setBorderSide(value as any);
    } else if (type === 'width') {
      setBorderWidth(value);
    } else if (type === 'style') {
      setBorderStyle(value);
    }
    updateStyleProperty();
  };

  // Update style property based on current state
  const updateStyleProperty = useCallback(() => {
    const style: React.CSSProperties = {};
    
    // Text color
    if (textColor) {
      style.color = textColor;
    }
    
    // Background color
    if (fillColor) {
      style.backgroundColor = fillColor;
    }
    
    // Font styles
    const fontFamilyMap: Record<string, string> = {
      'inter': 'Inter',
      'roboto': 'Roboto',
      'arial': 'Arial',
      'helvetica': 'Helvetica',
      'georgia': 'Georgia',
      'mono': '"JetBrains Mono"'
    };
    
    style.fontFamily = fontFamilyMap[fontFamily] || 'Inter';
    style.fontWeight = fontWeight as any;
    style.fontSize = `${fontSize}px`;
    
    // Border styles
    if (borderSide !== 'none' && borderWidth !== '0px') {
      const borderValue = `${borderWidth} ${borderStyle} ${borderColor}`;
      
      if (borderSide === 'all') {
        style.border = borderValue;
      } else {
        const borderKey = `border${borderSide.charAt(0).toUpperCase() + borderSide.slice(1)}` as keyof React.CSSProperties;
        style[borderKey] = borderValue as any;
      }
    }
    
    if (styleTarget === 'cell') {
      handleCellStyleSave(style);
    } else {
      handleHeaderStyleSave(style);
    }
  }, [textColor, fillColor, fontFamily, fontWeight, fontSize, borderSide, borderWidth, borderStyle, borderColor, styleTarget]);

  // Handle alignment changes - converted to work with style target
  const handleAlignmentChange = (type: 'horizontal' | 'vertical', value: string) => {
    const property = styleTarget === 'cell' ? 'cellClass' : 'headerClass';
    const currentClass = styleTarget === 'cell' ? cellClassValue.value : headerClassValue.value;
    
    let classes = (currentClass as string || '').split(' ').filter(c => c);
    
    if (type === 'horizontal') {
      // Remove existing horizontal alignment classes
      classes = classes.filter(c => !['text-left', 'text-center', 'text-right'].includes(c));
      
      // Add new horizontal alignment
      if (value === 'left') {
        classes.push('text-left');
      } else if (value === 'center') {
        classes.push('text-center');
      } else if (value === 'right') {
        classes.push('text-right');
      }
    } else {
      // Remove existing vertical alignment classes
      classes = classes.filter(c => !['items-start', 'items-center', 'items-end'].includes(c));
      
      // Add new vertical alignment
      if (value === 'top') {
        classes.push('items-start');
      } else if (value === 'middle') {
        classes.push('items-center');
      } else if (value === 'bottom') {
        classes.push('items-end');
      }
    }
    
    const newClass = classes.join(' ').trim();
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
    
    // Add metadata for serialization
    Object.defineProperty(headerStyleFn, '__baseStyle', { 
      value: style, 
      writable: false,
      enumerable: false,
      configurable: true
    });
    
    updateBulkProperty('headerStyle', headerStyleFn);
  };

  // Get current alignment from class
  const getCurrentAlignment = (type: 'horizontal' | 'vertical'): string => {
    const currentClass = styleTarget === 'cell' ? cellClassValue.value : headerClassValue.value;
    const classes = (currentClass as string || '').split(' ');
    
    if (type === 'horizontal') {
      if (classes.includes('text-center')) return 'center';
      if (classes.includes('text-right')) return 'right';
      return 'left';
    } else {
      if (classes.includes('items-center')) return 'middle';
      if (classes.includes('items-end')) return 'bottom';
      return 'top';
    }
  };

  // Reset all styling settings
  const resetStylingSettings = useCallback(() => {
    // Reset all style properties
    updateBulkProperty('cellStyle', undefined);
    updateBulkProperty('headerStyle', undefined);
    updateBulkProperty('cellClass', undefined);
    updateBulkProperty('headerClass', undefined);
    updateBulkProperty('wrapText', undefined);
    updateBulkProperty('autoHeight', undefined);
    updateBulkProperty('wrapHeaderText', undefined);
    updateBulkProperty('autoHeaderHeight', undefined);
  }, [updateBulkProperty]);

  return (
    <div className="space-y-2">
      {/* Reset Button */}
      <div className="flex justify-end mb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2 text-xs text-destructive"
          onClick={resetStylingSettings}
          title="Reset all styling settings to defaults"
        >
          <RotateCcw className="ribbon-icon-xs mr-1" />
          Reset All
        </Button>
      </div>
      
      {/* 5-Column Layout with Cell/Header Toggle in First Column */}
      <div className="grid grid-cols-5 gap-2">
        {/* Column 1 - Cell/Header Toggle */}
        <div className="flex items-start justify-start">
          <ToggleGroup 
            type="single" 
            value={styleTarget} 
            onValueChange={(value) => value && setStyleTarget(value as 'cell' | 'header')}
            orientation="vertical"
            className="grid grid-rows-2 gap-0.5"
          >
            <ToggleGroupItem value="cell" className="cell-header-toggle h-6 w-14 text-[10px] px-1">
              <Columns className="ribbon-icon-xs mr-0.5" />
              Cell
            </ToggleGroupItem>
            <ToggleGroupItem value="header" className="cell-header-toggle h-6 w-14 text-[10px] px-1">
              <FileText className="ribbon-icon-xs mr-0.5" />
              Header
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Column 2 - Font */}
        <div className="space-y-2">
          <CustomSection label="FONT">
            <div className="space-y-1.5">
              <CustomSelect
                value={fontFamily}
                onChange={(value) => handleFontChange('family', value)}
                options={FONT_FAMILY_OPTIONS}
                showIcons={false}
                triggerClassName="text-[10px] h-6"
              />
              
              <div className="flex gap-0.5">
                <CustomSelect
                  value={fontWeight}
                  onChange={(value) => handleFontChange('weight', value)}
                  options={FONT_WEIGHT_OPTIONS}
                  showIcons={false}
                  className="flex-1"
                  triggerClassName="text-[10px] h-6"
                />
                <CustomSelect
                  value={fontSize}
                  onChange={(value) => handleFontChange('size', value)}
                  options={FONT_SIZE_OPTIONS}
                  showIcons={false}
                  className="w-12"
                  triggerClassName="text-[10px] h-6"
                />
              </div>
              
              <div className="flex gap-0.5">
                <Toggle 
                  size="sm"
                  pressed={fontWeight === '700'}
                  onPressedChange={(pressed) => handleFontChange('weight', pressed ? '700' : '400')}
                  className="ribbon-toggle h-6 w-6"
                  title="Bold"
                >
                  <Bold className="h-3 w-3" />
                </Toggle>
                <Toggle 
                  size="sm"
                  className="ribbon-toggle h-6 w-6"
                  title="Italic"
                  disabled
                >
                  <Italic className="h-3 w-3" />
                </Toggle>
                <Toggle 
                  size="sm"
                  className="ribbon-toggle h-6 w-6"
                  title="Underline"
                  disabled
                >
                  <Underline className="h-3 w-3" />
                </Toggle>
              </div>
            </div>
          </CustomSection>
        </div>

        {/* Column 3 - Alignment */}
        <div className="space-y-2">
          <CustomSection label="ALIGNMENT">
            <div className="space-y-1.5">
              <ToggleGroup 
                type="single" 
                value={getCurrentAlignment('horizontal')}
                onValueChange={(value) => value && handleAlignmentChange('horizontal', value)}
                className="grid grid-cols-3 gap-0.5"
              >
                <ToggleGroupItem value="left" className="ribbon-toggle-group-item h-6 p-0">
                  <AlignLeft className="h-3 w-3" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" className="ribbon-toggle-group-item h-6 p-0">
                  <AlignCenter className="h-3 w-3" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" className="ribbon-toggle-group-item h-6 p-0">
                  <AlignRight className="h-3 w-3" />
                </ToggleGroupItem>
              </ToggleGroup>

              <ToggleGroup 
                type="single" 
                value={getCurrentAlignment('vertical')}
                onValueChange={(value) => value && handleAlignmentChange('vertical', value)}
                className="grid grid-cols-3 gap-0.5"
              >
                <ToggleGroupItem value="top" className="ribbon-toggle-group-item h-6 p-0">
                  <AlignVerticalJustifyStart className="h-3 w-3" />
                </ToggleGroupItem>
                <ToggleGroupItem value="middle" className="ribbon-toggle-group-item h-6 p-0">
                  <AlignVerticalJustifyCenter className="h-3 w-3" />
                </ToggleGroupItem>
                <ToggleGroupItem value="bottom" className="ribbon-toggle-group-item h-6 p-0">
                  <AlignVerticalJustifyEnd className="h-3 w-3" />
                </ToggleGroupItem>
              </ToggleGroup>

              {styleTarget === 'cell' && (
                <div className="space-y-1">
                  <CustomSwitch
                    id="wrap-text"
                    label="Wrap"
                    value={wrapTextValue}
                    onChange={(checked) => updateBulkProperty('wrapText', checked)}
                    className="text-[10px]"
                  />
                  <CustomSwitch
                    id="auto-height"
                    label="Auto Height"
                    value={autoHeightValue}
                    onChange={(checked) => updateBulkProperty('autoHeight', checked)}
                    className="text-[10px]"
                  />
                </div>
              )}

              {styleTarget === 'header' && (
                <div className="space-y-1">
                  <CustomSwitch
                    id="wrap-header"
                    label="Wrap"
                    value={wrapHeaderTextValue}
                    onChange={(checked) => updateBulkProperty('wrapHeaderText', checked)}
                    className="text-[10px]"
                  />
                  <CustomSwitch
                    id="auto-header-height"
                    label="Auto Height"
                    value={autoHeaderHeightValue}
                    onChange={(checked) => updateBulkProperty('autoHeaderHeight', checked)}
                    className="text-[10px]"
                  />
                </div>
              )}
            </div>
          </CustomSection>
        </div>
        
        {/* Column 4 - Colors */}
        <div className="space-y-2">
          <CustomSection label="COLORS">
            <div className="space-y-1">
              <CustomColorPicker
                icon={Type}
                value={textColor}
                onChange={(value) => handleColorChange('text', value)}
                placeholder="Default"
              />
              
              <CustomColorPicker
                icon={PaintBucket}
                value={fillColor}
                onChange={(value) => handleColorChange('fill', value)}
                placeholder="Default"
              />
            </div>
          </CustomSection>
        </div>

        {/* Column 5 - Borders */}
        <div className="space-y-2">
          <CustomSection label="BORDERS">
            <div className="space-y-1.5">
              <div className="grid grid-cols-5 gap-0.5">
                <Toggle 
                  size="sm"
                  pressed={borderSide === 'all'}
                  onPressedChange={(pressed) => handleBorderChange('side', pressed ? 'all' : 'none')}
                  className="ribbon-toggle h-6 col-span-2"
                  title="All borders"
                >
                  <Square className="h-3 w-3" strokeWidth={2.5} />
                </Toggle>
                <Toggle 
                  size="sm"
                  pressed={borderSide === 'top'}
                  onPressedChange={(pressed) => handleBorderChange('side', pressed ? 'top' : 'none')}
                  className="ribbon-toggle h-6 p-0"
                  title="Top border"
                >
                  <ArrowUp className="h-3 w-3" />
                </Toggle>
                <Toggle 
                  size="sm"
                  pressed={borderSide === 'right'}
                  onPressedChange={(pressed) => handleBorderChange('side', pressed ? 'right' : 'none')}
                  className="ribbon-toggle h-6 p-0"
                  title="Right border"
                >
                  <ArrowRight className="h-3 w-3" />
                </Toggle>
                <Toggle 
                  size="sm"
                  pressed={borderSide === 'bottom'}
                  onPressedChange={(pressed) => handleBorderChange('side', pressed ? 'bottom' : 'none')}
                  className="ribbon-toggle h-6 p-0"
                  title="Bottom border"
                >
                  <ArrowDown className="h-3 w-3" />
                </Toggle>
              </div>

              <div className="flex gap-0.5">
                <CustomSelect
                  value={borderWidth}
                  onChange={(value) => handleBorderChange('width', value)}
                  options={BORDER_WIDTH_OPTIONS}
                  showIcons={false}
                  className="flex-1"
                  triggerClassName="text-[10px] h-6"
                />
                <CustomSelect
                  value={borderStyle}
                  onChange={(value) => handleBorderChange('style', value)}
                  options={BORDER_STYLE_OPTIONS}
                  showIcons={false}
                  className="flex-1"
                  triggerClassName="text-[10px] h-6"
                />
              </div>

              <CustomColorPicker
                icon={Square}
                value={borderColor}
                onChange={(value) => handleColorChange('border', value)}
                placeholder="#cccccc"
              />
            </div>
          </CustomSection>
        </div>
      </div>
    </div>
  );
};