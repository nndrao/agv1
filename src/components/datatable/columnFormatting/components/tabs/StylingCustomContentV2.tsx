import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { cn } from '@/lib/utils';
import '../../custom-styles.css';

interface StylingCustomContentProps {
  selectedColumns: Set<string>;
}

interface StyleState {
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
  applyTextColor: boolean;
  applyBackgroundColor: boolean;
  
  // Layout
  wrapText: boolean;
  autoHeight: boolean;
  
  // Borders
  borderWidth: string;
  borderStyle: string;
  borderColor: string;
  borderSides: string;
  applyBorder: boolean;
}

const defaultStyleState: StyleState = {
  fontFamily: 'Inter',
  fontSize: '14',
  fontWeight: 'normal',
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

// Color picker component
const ColorPicker: React.FC<{
  value: string;
  onChange: (color: string) => void;
  label: string;
}> = ({ value, onChange, label }) => {
  const presetColors = [
    'transparent',
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#808080', '#A52A2A', '#000080', '#008000'
  ];

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
            <div className="flex items-center gap-2">
              <Label className="text-xs">Color:</Label>
              <Input
                type="color"
                value={value === 'transparent' || !value ? '#FFFFFF' : value}
                onChange={(e) => onChange(e.target.value)}
                className="h-8 w-16 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#FFFFFF"
                className="h-8 flex-1 text-xs"
              />
            </div>
            <div className="grid grid-cols-8 gap-1">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => onChange(color)}
                  className={cn(
                    "w-8 h-8 rounded border transition-all hover:scale-110",
                    color === 'transparent' ? "bg-checkered" : "",
                    value === color && "ring-2 ring-primary ring-offset-1"
                  )}
                  style={{
                    backgroundColor: color === 'transparent' ? undefined : color,
                    borderColor: color === '#FFFFFF' ? '#E2E8F0' : 'transparent'
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const StylingCustomContentV2: React.FC<StylingCustomContentProps> = ({ selectedColumns }) => {
  const { 
    updateBulkProperty,
    columnDefinitions,
    pendingChanges
  } = useColumnFormattingStore();

  const [activeMode, setActiveMode] = useState<'cell' | 'header'>('cell');
  const [styleState, setStyleState] = useState<StyleState>(defaultStyleState);
  
  // Create a stable column selection key for tracking changes
  const selectionKey = useMemo(() => 
    Array.from(selectedColumns).sort().join(','), 
    [selectedColumns]
  );

  // Extract alignment from CSS class
  const extractAlignmentFromClass = useCallback((classString: string, isHeader: boolean = false) => {
    if (!classString) return { textAlign: '', verticalAlign: '' };
    
    let textAlign = '';
    let verticalAlign = '';
    
    if (isHeader) {
      if (classString.includes('header-h-left')) textAlign = 'left';
      else if (classString.includes('header-h-center')) textAlign = 'center';
      else if (classString.includes('header-h-right')) textAlign = 'right';
      else if (classString.includes('header-h-justify')) textAlign = 'justify';
      
      if (classString.includes('header-v-top')) verticalAlign = 'top';
      else if (classString.includes('header-v-middle')) verticalAlign = 'middle';
      else if (classString.includes('header-v-bottom')) verticalAlign = 'bottom';
    } else {
      const combinedMatch = classString.match(/cell-align-(\w+)-(\w+)/);
      if (combinedMatch) {
        verticalAlign = combinedMatch[1];
        textAlign = combinedMatch[2];
      } else {
        const verticalMatch = classString.match(/cell-vertical-align-(\w+)/);
        const horizontalMatch = classString.match(/cell-horizontal-align-(\w+)/);
        
        if (verticalMatch) verticalAlign = verticalMatch[1];
        if (horizontalMatch) textAlign = horizontalMatch[1];
      }
    }
    
    return { textAlign, verticalAlign };
  }, []);

  // Load styles from selected columns
  const loadStylesFromColumns = useCallback((mode: 'cell' | 'header') => {
    if (selectedColumns.size === 0) return defaultStyleState;
    
    // Get first selected column's styles
    const firstColId = Array.from(selectedColumns)[0];
    const colDef = columnDefinitions.get(firstColId);
    if (!colDef) return defaultStyleState;
    
    const changes = pendingChanges.get(firstColId) || {};
    const newState = { ...defaultStyleState };
    
    // Get style and class based on mode
    const styleToCheck = mode === 'cell' 
      ? (changes.cellStyle !== undefined ? changes.cellStyle : colDef.cellStyle)
      : (changes.headerStyle !== undefined ? changes.headerStyle : colDef.headerStyle);
    
    const classToCheck = mode === 'cell'
      ? (changes.cellClass !== undefined ? changes.cellClass : colDef.cellClass)
      : (changes.headerClass !== undefined ? changes.headerClass : colDef.headerClass);
    
    // Extract styles
    if (styleToCheck) {
      let styleObj: any = {};
      
      if (typeof styleToCheck === 'function') {
        styleObj = (styleToCheck as any).__baseStyle || {};
      } else if (typeof styleToCheck === 'object') {
        styleObj = styleToCheck;
      }
      
      // Typography
      if (styleObj.fontFamily) newState.fontFamily = styleObj.fontFamily;
      if (styleObj.fontSize) newState.fontSize = styleObj.fontSize.replace('px', '');
      if (styleObj.fontWeight) newState.fontWeight = styleObj.fontWeight;
      if (styleObj.fontStyle) newState.fontStyle = styleObj.fontStyle;
      if (styleObj.textDecoration) {
        newState.textDecoration = styleObj.textDecoration.split(' ').filter(Boolean);
      }
      
      // Colors
      if (styleObj.color) {
        newState.textColor = styleObj.color;
        newState.applyTextColor = true;
      }
      if (styleObj.backgroundColor) {
        newState.backgroundColor = styleObj.backgroundColor;
        newState.applyBackgroundColor = true;
      }
      
      // Layout
      if (styleObj.whiteSpace) {
        newState.wrapText = styleObj.whiteSpace === 'normal';
      }
      
      // Borders
      if (styleObj.border && styleObj.border !== 'none') {
        const borderParts = styleObj.border.split(' ');
        if (borderParts.length >= 3) {
          newState.borderWidth = borderParts[0].replace('px', '');
          newState.borderStyle = borderParts[1];
          newState.borderColor = borderParts[2];
          newState.borderSides = 'all';
          newState.applyBorder = true;
        }
      }
    }
    
    // Extract alignment from classes
    if (classToCheck) {
      const classString = typeof classToCheck === 'string' ? classToCheck : '';
      const alignment = extractAlignmentFromClass(classString, mode === 'header');
      
      if (alignment.textAlign) newState.textAlign = alignment.textAlign;
      if (alignment.verticalAlign) newState.verticalAlign = alignment.verticalAlign;
    }
    
    // Check auto height for cells
    if (mode === 'cell' && colDef.autoHeight) {
      newState.autoHeight = true;
    }
    
    return newState;
  }, [selectedColumns, columnDefinitions, pendingChanges, extractAlignmentFromClass]);

  // Load styles when selection or mode changes
  useEffect(() => {
    const newStyles = loadStylesFromColumns(activeMode);
    setStyleState(newStyles);
  }, [selectionKey, activeMode, loadStylesFromColumns]);

  // Update single style property
  const updateStyle = useCallback((key: keyof StyleState, value: any) => {
    setStyleState(prev => ({ ...prev, [key]: value }));
  }, []);

  // Apply current styles
  const applyStyles = useCallback(() => {
    const styleObject: any = {
      fontFamily: styleState.fontFamily,
      fontSize: `${styleState.fontSize}px`,
      fontWeight: styleState.fontWeight,
      fontStyle: styleState.fontStyle,
      whiteSpace: styleState.wrapText ? 'normal' : 'nowrap',
    };
    
    // Text decoration
    if (styleState.textDecoration.length > 0) {
      styleObject.textDecoration = styleState.textDecoration.join(' ');
    }
    
    // Colors
    if (styleState.applyTextColor && styleState.textColor) {
      styleObject.color = styleState.textColor;
    }
    if (styleState.applyBackgroundColor && styleState.backgroundColor) {
      styleObject.backgroundColor = styleState.backgroundColor;
    }
    
    // Borders
    if (styleState.applyBorder) {
      if (styleState.borderSides === 'all') {
        styleObject.border = `${styleState.borderWidth}px ${styleState.borderStyle} ${styleState.borderColor}`;
      } else if (styleState.borderSides !== 'none') {
        styleObject[`border${styleState.borderSides.charAt(0).toUpperCase() + styleState.borderSides.slice(1)}`] = 
          `${styleState.borderWidth}px ${styleState.borderStyle} ${styleState.borderColor}`;
      }
    }
    
    // Apply styles and alignment
    if (activeMode === 'cell') {
      // Create alignment class
      let cellClass = '';
      if (styleState.verticalAlign && styleState.textAlign) {
        cellClass = `cell-align-${styleState.verticalAlign}-${styleState.textAlign}`;
      } else if (styleState.verticalAlign) {
        cellClass = `cell-vertical-align-${styleState.verticalAlign}`;
      } else if (styleState.textAlign) {
        cellClass = `cell-horizontal-align-${styleState.textAlign}`;
      }
      
      updateBulkProperty('cellClass', cellClass || undefined);
      updateBulkProperty('cellStyle', styleObject);
      
      if (styleState.autoHeight) {
        updateBulkProperty('autoHeight', true);
      }
    } else {
      // Header styles
      const headerClasses = [];
      if (styleState.textAlign) {
        headerClasses.push(`header-h-${styleState.textAlign}`);
      }
      if (styleState.verticalAlign) {
        headerClasses.push(`header-v-${styleState.verticalAlign}`);
      }
      
      updateBulkProperty('headerClass', headerClasses.join(' ') || undefined);
      updateBulkProperty('headerStyle', styleObject);
    }
  }, [styleState, activeMode, updateBulkProperty]);

  // Auto-apply on changes with debounce to prevent infinite loops
  useEffect(() => {
    if (selectedColumns.size === 0) return;
    
    const timeoutId = setTimeout(() => {
      applyStyles();
    }, 100);
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleState, selectedColumns.size]); // Intentionally exclude applyStyles to prevent loops

  // Reset styles
  const resetStyles = useCallback(() => {
    setStyleState(defaultStyleState);
  }, []);

  // Font size options
  const fontSizeOptions = [
    { value: '10', label: '10px' },
    { value: '12', label: '12px' },
    { value: '14', label: '14px' },
    { value: '16', label: '16px' },
    { value: '18', label: '18px' },
    { value: '20', label: '20px' },
    { value: '24', label: '24px' },
  ];

  return (
    <div className="flex h-full gap-3">
      <div className="flex-1">
        {/* Multi-column selection alert */}
        {selectedColumns.size > 1 && (
          <Alert className="mb-3 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Bulk Edit Mode:</strong> You have {selectedColumns.size} columns selected. All styling changes will be applied to ALL selected columns simultaneously.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Mode selector */}
        <div className="flex items-center justify-between mb-3">
          <ToggleGroup type="single" value={activeMode} onValueChange={(v) => v && setActiveMode(v as 'cell' | 'header')}>
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

        {/* Style controls */}
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-4">
            {/* Typography controls */}
            <div>
              <Label className="ribbon-section-header">FONT</Label>
              <Select value={styleState.fontFamily} onValueChange={(value) => updateStyle('fontFamily', value)}>
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

            <div>
              <Label className="ribbon-section-header">SIZE</Label>
              <Select value={styleState.fontSize} onValueChange={(value) => updateStyle('fontSize', value)}>
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

            <div>
              <Label className="ribbon-section-header">WEIGHT</Label>
              <Select value={styleState.fontWeight} onValueChange={(value) => updateStyle('fontWeight', value)}>
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

            {/* Text alignment */}
            <div>
              <Label className="ribbon-section-header">ALIGN</Label>
              <ToggleGroup 
                type="single" 
                value={styleState.textAlign || ''}
                onValueChange={(value) => updateStyle('textAlign', value || '')} 
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

            {/* Font style */}
            <div>
              <Label className="ribbon-section-header">STYLE</Label>
              <ToggleGroup 
                type="multiple" 
                value={[
                  ...(styleState.fontWeight === 'bold' || styleState.fontWeight === '600' || styleState.fontWeight === '700' ? ['bold'] : []),
                  ...(styleState.fontStyle === 'italic' ? ['italic'] : []),
                  ...styleState.textDecoration
                ]} 
                onValueChange={(values) => {
                  // Handle bold
                  if (values.includes('bold') && styleState.fontWeight !== 'bold') {
                    updateStyle('fontWeight', 'bold');
                  } else if (!values.includes('bold') && (styleState.fontWeight === 'bold' || styleState.fontWeight === '600' || styleState.fontWeight === '700')) {
                    updateStyle('fontWeight', 'normal');
                  }
                  
                  // Handle italic
                  updateStyle('fontStyle', values.includes('italic') ? 'italic' : 'normal');
                  
                  // Handle decorations
                  updateStyle('textDecoration', values.filter(v => ['underline', 'line-through'].includes(v)));
                }} 
                className="h-6 w-full"
              >
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

            {/* Text color */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1 h-5">
                <Label className="ribbon-section-header flex-1 mb-0">TEXT COLOR</Label>
                <Switch 
                  checked={styleState.applyTextColor}
                  onCheckedChange={(checked) => updateStyle('applyTextColor', checked)}
                  className="h-4 w-7 data-[state=checked]:bg-primary"
                />
              </div>
              <ColorPicker
                value={styleState.textColor}
                onChange={(color) => updateStyle('textColor', color)}
                label=""
              />
            </div>

            {/* Background color */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1 h-5">
                <Label className="ribbon-section-header flex-1 mb-0">BACKGROUND</Label>
                <Switch 
                  checked={styleState.applyBackgroundColor}
                  onCheckedChange={(checked) => updateStyle('applyBackgroundColor', checked)}
                  className="h-4 w-7 data-[state=checked]:bg-primary"
                />
              </div>
              <ColorPicker
                value={styleState.backgroundColor}
                onChange={(color) => updateStyle('backgroundColor', color)}
                label=""
              />
            </div>

            {/* Vertical alignment */}
            <div>
              <Label className="ribbon-section-header">V-ALIGN</Label>
              <ToggleGroup 
                type="single" 
                value={styleState.verticalAlign || ''}
                onValueChange={(value) => updateStyle('verticalAlign', value || '')} 
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

            {/* Border controls */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1 h-5">
                <Label className="ribbon-section-header flex-1 mb-0">BORDER</Label>
                <Switch 
                  checked={styleState.applyBorder}
                  onCheckedChange={(checked) => updateStyle('applyBorder', checked)}
                  className="h-4 w-7 data-[state=checked]:bg-primary"
                />
              </div>
              <Select 
                value={styleState.borderSides} 
                onValueChange={(value) => updateStyle('borderSides', value)}
                disabled={!styleState.applyBorder}
              >
                <SelectTrigger className="h-6 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sides</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Border width */}
            <div className={cn(!styleState.applyBorder && "opacity-50")}>
              <Label className="ribbon-section-header">WIDTH</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={styleState.borderWidth}
                onChange={(e) => updateStyle('borderWidth', e.target.value)}
                className="h-6 text-xs"
                disabled={!styleState.applyBorder}
              />
            </div>

            {/* Border style */}
            <div className={cn(!styleState.applyBorder && "opacity-50")}>
              <Label className="ribbon-section-header">STYLE</Label>
              <Select 
                value={styleState.borderStyle} 
                onValueChange={(value) => updateStyle('borderStyle', value)}
                disabled={!styleState.applyBorder}
              >
                <SelectTrigger className="h-6 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Border color */}
            <div className={cn(!styleState.applyBorder && "opacity-50")}>
              <Label className="ribbon-section-header">COLOR</Label>
              <ColorPicker
                value={styleState.borderColor}
                onChange={(color) => updateStyle('borderColor', color)}
                label=""
              />
            </div>

            {/* Cell-specific options */}
            {activeMode === 'cell' && (
              <>
                <div>
                  <Label className="ribbon-section-header">TEXT WRAP</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Switch 
                      checked={styleState.wrapText}
                      onCheckedChange={(checked) => updateStyle('wrapText', checked)}
                      className="h-4 w-7 data-[state=checked]:bg-primary"
                    />
                    <WrapText className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <Label className="ribbon-section-header">AUTO HEIGHT</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Switch 
                      checked={styleState.autoHeight}
                      onCheckedChange={(checked) => updateStyle('autoHeight', checked)}
                      className="h-4 w-7 data-[state=checked]:bg-primary"
                    />
                    <Maximize2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preview panel */}
      <div className="w-64 border-l pl-3">
        <Label className="text-xs font-semibold mb-2 block">Preview</Label>
        <div className="border rounded-md p-4 bg-background">
          <div 
            className="min-h-[100px] flex items-center justify-center p-2 border rounded"
            style={{
              fontFamily: styleState.fontFamily,
              fontSize: `${styleState.fontSize}px`,
              fontWeight: styleState.fontWeight,
              fontStyle: styleState.fontStyle,
              textDecoration: styleState.textDecoration.join(' '),
              color: styleState.applyTextColor ? styleState.textColor : undefined,
              backgroundColor: styleState.applyBackgroundColor ? styleState.backgroundColor : undefined,
              textAlign: styleState.textAlign as any || 'left',
              alignItems: styleState.verticalAlign === 'top' ? 'flex-start' :
                         styleState.verticalAlign === 'bottom' ? 'flex-end' :
                         styleState.verticalAlign === 'stretch' ? 'stretch' : 'center',
              whiteSpace: styleState.wrapText ? 'normal' : 'nowrap',
              border: styleState.applyBorder ? 
                (styleState.borderSides === 'all' ? 
                  `${styleState.borderWidth}px ${styleState.borderStyle} ${styleState.borderColor}` : 
                  'none'
                ) : undefined,
              borderTop: styleState.applyBorder && styleState.borderSides === 'top' ? 
                `${styleState.borderWidth}px ${styleState.borderStyle} ${styleState.borderColor}` : undefined,
              borderRight: styleState.applyBorder && styleState.borderSides === 'right' ? 
                `${styleState.borderWidth}px ${styleState.borderStyle} ${styleState.borderColor}` : undefined,
              borderBottom: styleState.applyBorder && styleState.borderSides === 'bottom' ? 
                `${styleState.borderWidth}px ${styleState.borderStyle} ${styleState.borderColor}` : undefined,
              borderLeft: styleState.applyBorder && styleState.borderSides === 'left' ? 
                `${styleState.borderWidth}px ${styleState.borderStyle} ${styleState.borderColor}` : undefined,
            }}
          >
            <span>Sample Text</span>
          </div>
        </div>
      </div>
    </div>
  );
};