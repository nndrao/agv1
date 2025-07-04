import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
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
  const [inputValue, setInputValue] = useState(value || '');
  
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
                  value === 'transparent' || !value ? "bg-checkered" : ""
                )}
                style={{ 
                  backgroundColor: value === 'transparent' || !value ? undefined : value,
                  borderColor: value === '#FFFFFF' || !value ? '#E2E8F0' : 'transparent'
                }}
              />
              <span className="text-xs">{!value ? 'Default' : value === 'transparent' ? 'Transparent' : value}</span>
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
                value={value === 'transparent' ? '#FFFFFF' : value}
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
                      value === color ? "border-primary" : "border-transparent",
                      color === 'transparent' ? "bg-checkered" : ""
                    )}
                    style={{ 
                      backgroundColor: color === 'transparent' ? undefined : color,
                      borderColor: value === color ? undefined : (color === '#FFFFFF' ? '#E2E8F0' : 'transparent')
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
  
  // Typography state
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState('14');
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontStyle, setFontStyle] = useState('normal');
  const [textDecoration, setTextDecoration] = useState<string[]>([]);
  const [textAlign, setTextAlign] = useState('left');
  const [verticalAlign, setVerticalAlign] = useState('middle');
  
  // Colors state
  const [textColor, setTextColor] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [applyTextColor, setApplyTextColor] = useState(false);
  const [applyBackgroundColor, setApplyBackgroundColor] = useState(false);
  
  // Layout state
  const [wrapText, setWrapText] = useState(false);
  const [autoHeight, setAutoHeight] = useState(false);
  
  // Border state
  const [borderWidth, setBorderWidth] = useState('1');
  const [borderStyle, setBorderStyle] = useState('solid');
  const [borderColor, setBorderColor] = useState('#CCCCCC');
  const [borderSides, setBorderSides] = useState('all');
  const [applyBorder, setApplyBorder] = useState(false);

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
  
  // Check if selected columns have existing styles on mount or when selection changes
  useEffect(() => {
    if (selectedColumns.size === 0) return;
    
    // Only check on initial load of columns, not on every state change
    let hasTextColor = false;
    let hasBackgroundColor = false;
    let hasBorder = false;
    let foundTextColor = '';
    let foundBackgroundColor = '';
    
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const changes = pendingChanges.get(colId) || {};
      
      // Check cellStyle or headerStyle based on active tab
      const styleToCheck = activeSubTab === 'cell' 
        ? (changes.cellStyle !== undefined ? changes.cellStyle : colDef?.cellStyle)
        : (changes.headerStyle !== undefined ? changes.headerStyle : colDef?.headerStyle);
      
      if (styleToCheck) {
        let styleObj: any = {};
        
        // Handle function-based styles
        if (typeof styleToCheck === 'function') {
          // Check if it has __baseStyle metadata
          styleObj = (styleToCheck as any).__baseStyle || {};
        } else if (typeof styleToCheck === 'object') {
          styleObj = styleToCheck;
        }
        
        // Check for color properties
        if (styleObj.color) {
          hasTextColor = true;
          foundTextColor = styleObj.color;
        }
        if (styleObj.backgroundColor) {
          hasBackgroundColor = true;
          foundBackgroundColor = styleObj.backgroundColor;
        }
        if (styleObj.border || styleObj.borderTop || styleObj.borderRight || 
            styleObj.borderBottom || styleObj.borderLeft) {
          hasBorder = true;
          // Try to parse border properties if it's a shorthand
          if (styleObj.border) {
            const borderParts = styleObj.border.split(' ');
            if (borderParts.length >= 3) {
              setBorderWidth(borderParts[0].replace('px', ''));
              setBorderStyle(borderParts[1]);
              setBorderColor(borderParts[2]);
            }
          }
        }
      }
    });
    
    // Only update if we found values
    if (hasTextColor) {
      setTextColor(foundTextColor);
      setApplyTextColor(true);
    }
    if (hasBackgroundColor) {
      setBackgroundColor(foundBackgroundColor);
      setApplyBackgroundColor(true);
    }
    if (hasBorder) {
      setApplyBorder(true);
    }
  }, [selectedColumns, activeSubTab]); // Remove columnDefinitions and pendingChanges from deps to avoid loops

  // Border side options
  const borderSideOptions = [
    { value: 'all', label: 'All Sides' },
    { value: 'top', label: 'Top' },
    { value: 'right', label: 'Right' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'left', label: 'Left' },
    { value: 'none', label: 'None' },
  ];

  // Helper function to toggle text decoration
  const toggleTextDecoration = (decoration: string) => {
    setTextDecoration(prev => 
      prev.includes(decoration) 
        ? prev.filter(d => d !== decoration)
        : [...prev, decoration]
    );
  };

  // Apply styles
  const applyStyles = () => {
    const styleObject: any = {
      fontFamily,
      fontSize: `${fontSize}px`,
      fontWeight,
      fontStyle,
      whiteSpace: wrapText ? 'normal' : 'nowrap',
    };
    
    // Handle text decoration
    if (textDecoration.length > 0) {
      styleObject.textDecoration = textDecoration.join(' ');
    }
    
    // Handle color properties based on checkbox state
    if (applyTextColor) {
      if (textColor) {
        styleObject.color = textColor;
      }
    } else {
      // Explicitly set to undefined to remove existing color
      styleObject.color = undefined;
    }
    
    if (applyBackgroundColor) {
      if (backgroundColor) {
        styleObject.backgroundColor = backgroundColor;
      }
    } else {
      // Explicitly set to undefined to remove existing background
      styleObject.backgroundColor = undefined;
    }

    // Handle borders based on checkbox state
    if (applyBorder) {
      if (borderSides === 'none') {
        styleObject.border = 'none';
      } else if (borderSides === 'all') {
        styleObject.border = `${borderWidth}px ${borderStyle} ${borderColor}`;
      } else {
        styleObject.borderTop = borderSides === 'top' ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none';
        styleObject.borderRight = borderSides === 'right' ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none';
        styleObject.borderBottom = borderSides === 'bottom' ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none';
        styleObject.borderLeft = borderSides === 'left' ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none';
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
      if (verticalAlign && textAlign) {
        cellClass = `cell-align-${verticalAlign}-${textAlign}`;
      } else if (verticalAlign) {
        cellClass = `cell-vertical-align-${verticalAlign}`;
      } else if (textAlign) {
        cellClass = `cell-horizontal-align-${textAlign}`;
      }
      
      // Always update cellClass property (even if empty to clear previous alignment)
      updateBulkProperty('cellClass', cellClass || undefined);
      
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
          const conditionalStyleFn = createCellStyleFunction(existingFormatString, {});
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
      if (textAlign === 'left') {
        headerClasses.push('header-h-left');
      } else if (textAlign === 'center') {
        headerClasses.push('header-h-center');
      } else if (textAlign === 'right') {
        headerClasses.push('header-h-right');
      } else if (textAlign === 'justify') {
        headerClasses.push('header-h-justify');
      }
      
      // Add vertical alignment class
      if (verticalAlign === 'top') {
        headerClasses.push('header-v-top');
      } else if (verticalAlign === 'middle') {
        headerClasses.push('header-v-middle');
      } else if (verticalAlign === 'bottom') {
        headerClasses.push('header-v-bottom');
      }
      
      // Join classes with space
      const headerClass = headerClasses.join(' ');
      
      // Always update headerClass property (even if empty to clear previous alignment)
      updateBulkProperty('headerClass', headerClass || undefined);
    }
  };

  // Auto-apply on changes
  useEffect(() => {
    if (selectedColumns.size > 0) {
      applyStyles();
    }
  }, [
    fontFamily, fontSize, fontWeight, fontStyle, textDecoration, textAlign, verticalAlign,
    textColor, backgroundColor, applyTextColor, applyBackgroundColor, wrapText, autoHeight,
    borderWidth, borderStyle, borderColor, borderSides, applyBorder,
    activeSubTab
  ]);

  const resetStyles = () => {
    setFontFamily('Inter');
    setFontSize('14');
    setFontWeight('normal');
    setFontStyle('normal');
    setTextDecoration([]);
    setTextAlign('left');
    setVerticalAlign('middle');
    setTextColor('');
    setBackgroundColor('');
    setApplyTextColor(false);
    setApplyBackgroundColor(false);
    setWrapText(false);
    setAutoHeight(false);
    setBorderWidth('1');
    setBorderStyle('solid');
    setBorderColor('#CCCCCC');
    setBorderSides('all');
    setApplyBorder(false);
  };

  return (
    <div className="flex h-full gap-3">
      {/* Main controls section */}
      <div className="flex-1">
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
              <Select value={fontFamily} onValueChange={setFontFamily}>
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
              <Select value={fontSize} onValueChange={setFontSize}>
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
              <Select value={fontWeight} onValueChange={setFontWeight}>
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
              <ToggleGroup type="single" value={textAlign} onValueChange={setTextAlign} className="h-6 w-full">
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
                ...(fontWeight === 'bold' || fontWeight === '600' || fontWeight === '700' ? ['bold'] : []),
                ...(fontStyle === 'italic' ? ['italic'] : []),
                ...textDecoration
              ]} onValueChange={(values) => {
                // Handle bold
                if (values.includes('bold') && !fontWeight.includes('bold') && fontWeight !== '600' && fontWeight !== '700') {
                  setFontWeight('bold');
                } else if (!values.includes('bold') && (fontWeight === 'bold' || fontWeight === '600' || fontWeight === '700')) {
                  setFontWeight('normal');
                }
                
                // Handle italic
                setFontStyle(values.includes('italic') ? 'italic' : 'normal');
                
                // Handle decorations
                setTextDecoration(values.filter(v => ['underline', 'line-through'].includes(v)));
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
                  checked={applyTextColor}
                  onCheckedChange={setApplyTextColor}
                  className="h-4 w-7 data-[state=checked]:bg-primary"
                />
              </div>
              <ColorPicker 
                value={textColor}
                onChange={setTextColor}
                label=""
              />
            </div>

            {/* Background Color */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1 h-5">
                <Label className="ribbon-section-header flex-1 mb-0">BACKGROUND</Label>
                <Switch 
                  id="apply-background-color"
                  checked={applyBackgroundColor}
                  onCheckedChange={setApplyBackgroundColor}
                  className="h-4 w-7 data-[state=checked]:bg-primary"
                />
              </div>
              <ColorPicker 
                value={backgroundColor}
                onChange={setBackgroundColor}
                label=""
              />
            </div>

            {/* Vertical Alignment */}
            <div>
              <Label className="ribbon-section-header">V-ALIGN</Label>
              <ToggleGroup type="single" value={verticalAlign} onValueChange={setVerticalAlign} className="h-6 w-full">
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
                  checked={applyBorder}
                  onCheckedChange={setApplyBorder}
                  className="h-4 w-7 data-[state=checked]:bg-primary"
                />
              </div>
              <Select value={borderSides} onValueChange={setBorderSides}>
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
              <Select value={borderStyle} onValueChange={setBorderStyle}>
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
              <Select value={borderWidth} onValueChange={setBorderWidth}>
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
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                  className="h-6 w-6 border rounded cursor-pointer flex-shrink-0"
                  title="Border Color"
                />
                <Input
                  value={borderColor}
                  onChange={(e) => {
                    if (e.target.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                      setBorderColor(e.target.value);
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
                checked={wrapText}
                onCheckedChange={setWrapText}
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
                checked={autoHeight}
                onCheckedChange={setAutoHeight}
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
                  verticalAlign === 'top' ? 'flex-start' :
                  verticalAlign === 'bottom' ? 'flex-end' :
                  verticalAlign === 'stretch' ? 'stretch' : 'center'
                ) : 'center',
                justifyContent: activeSubTab === 'cell' ? (
                  textAlign === 'left' ? 'flex-start' :
                  textAlign === 'right' ? 'flex-end' :
                  textAlign === 'center' ? 'center' :
                  textAlign === 'justify' ? 'space-between' : 'flex-start'
                ) : 'flex-start',
                fontFamily,
                fontSize: `${fontSize}px`,
                fontWeight: activeSubTab === 'cell' ? fontWeight : 'normal',
                fontStyle: activeSubTab === 'cell' ? fontStyle : 'normal',
                textDecoration: activeSubTab === 'cell' && textDecoration.length > 0 ? textDecoration.join(' ') : 'none',
                color: activeSubTab === 'cell' && textColor && applyTextColor ? textColor : 'inherit',
                backgroundColor: activeSubTab === 'cell' && backgroundColor && applyBackgroundColor ? backgroundColor : 'transparent',
                whiteSpace: activeSubTab === 'cell' && wrapText ? 'normal' : 'nowrap',
                ...(activeSubTab === 'cell' && applyBorder ? 
                  (borderSides === 'none' ? { border: 'none' } : 
                    borderSides === 'all' ? { border: `${borderWidth}px ${borderStyle} ${borderColor}` } : {
                      borderTop: borderSides === 'top' ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
                      borderRight: borderSides === 'right' ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
                      borderBottom: borderSides === 'bottom' ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
                      borderLeft: borderSides === 'left' ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
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
                  verticalAlign === 'top' ? 'flex-start' :
                  verticalAlign === 'bottom' ? 'flex-end' :
                  verticalAlign === 'stretch' ? 'stretch' : 'center'
                ) : 'center',
                justifyContent: activeSubTab === 'header' ? (
                  textAlign === 'left' ? 'flex-start' :
                  textAlign === 'right' ? 'flex-end' :
                  textAlign === 'center' ? 'center' :
                  textAlign === 'justify' ? 'space-between' : 'flex-start'
                ) : 'flex-start',
                fontFamily,
                fontSize: `${fontSize}px`,
                fontWeight: activeSubTab === 'header' ? fontWeight : '600',
                fontStyle: activeSubTab === 'header' ? fontStyle : 'normal',
                textDecoration: activeSubTab === 'header' && textDecoration.length > 0 ? textDecoration.join(' ') : 'none',
                color: activeSubTab === 'header' && textColor && applyTextColor ? textColor : 'inherit',
                backgroundColor: activeSubTab === 'header' && backgroundColor && applyBackgroundColor ? backgroundColor : 'transparent',
                ...(activeSubTab === 'header' && applyBorder ? 
                  (borderSides === 'none' ? { border: 'none' } : 
                    borderSides === 'all' ? { border: `${borderWidth}px ${borderStyle} ${borderColor}` } : {
                      borderTop: borderSides === 'top' ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
                      borderRight: borderSides === 'right' ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
                      borderBottom: borderSides === 'bottom' ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
                      borderLeft: borderSides === 'left' ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
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