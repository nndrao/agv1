import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  ChevronDown
} from 'lucide-react';
import { useColumnCustomizationStore } from '../../../dialogs/columnSettings/store/columnCustomization.store';
import type { TabContentProps } from '../../types';
import '../../ribbon-styles.css';

export const StylingRibbonContent: React.FC<TabContentProps> = ({ selectedColumns }) => {
  const { updateBulkProperty, columnDefinitions, pendingChanges } = useColumnCustomizationStore();
  
  // Color state management
  const [textColor, setTextColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [borderColor, setBorderColor] = useState('#cccccc');

  // Initialize colors from selected columns
  useEffect(() => {
    if (selectedColumns.size > 0) {
      const firstColId = Array.from(selectedColumns)[0];
      const colDef = columnDefinitions.get(firstColId);
      const pendingChange = pendingChanges.get(firstColId);
      const cellStyle = (pendingChange?.cellStyle || colDef?.cellStyle) as React.CSSProperties || {};
      
      if (cellStyle.color && typeof cellStyle.color === 'string') {
        setTextColor(cellStyle.color);
      }
      if (cellStyle.backgroundColor && typeof cellStyle.backgroundColor === 'string') {
        setFillColor(cellStyle.backgroundColor);
      }
      if (cellStyle.borderColor && typeof cellStyle.borderColor === 'string') {
        setBorderColor(cellStyle.borderColor);
      }
    }
  }, [selectedColumns.size]); // Only depend on size to avoid re-renders
  
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
    const cellStyleValue = getMixedValueLocal('cellStyle');
    const styles: string[] = [];
    
    if (cellStyleValue.value && typeof cellStyleValue.value === 'object') {
      const styleObj = cellStyleValue.value as React.CSSProperties;
      if (styleObj.fontWeight === 'bold' || styleObj.fontWeight === '700') styles.push('bold');
      if (styleObj.fontStyle === 'italic') styles.push('italic');
      if (styleObj.textDecoration === 'underline') styles.push('underline');
    }
    
    return styles;
  };

  const getCurrentAlignment = () => {
    const cellClassValue = getMixedValueLocal('cellClass');
    const cellClass = (typeof cellClassValue.value === 'string' ? cellClassValue.value : '').trim();
    
    if (cellClass.includes('text-center') || cellClass.includes('justify-center')) return 'center';
    if (cellClass.includes('text-right') || cellClass.includes('justify-end')) return 'right';
    return 'left';
  };

  const handleAlignmentChange = (value: string) => {
    if (!value) return;
    const currentCellClass = getMixedValueLocal('cellClass').value as string || '';
    const classArray = currentCellClass ? currentCellClass.split(' ').filter(c => c) : [];
    
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
    
    const newCellClass = filteredClasses.join(' ').trim();
    updateBulkProperty('cellClass', newCellClass || undefined);
  };

  const handleStyleToggle = (style: 'bold' | 'italic' | 'underline', pressed: boolean) => {
    const currentStyle = getMixedValueLocal('cellStyle').value as React.CSSProperties || {};
    const newStyle = { ...currentStyle };
    
    if (style === 'bold') {
      if (pressed) {
        newStyle.fontWeight = 'bold';
      } else {
        delete newStyle.fontWeight;
      }
    } else if (style === 'italic') {
      if (pressed) {
        newStyle.fontStyle = 'italic';
      } else {
        delete newStyle.fontStyle;
      }
    } else if (style === 'underline') {
      if (pressed) {
        newStyle.textDecoration = 'underline';
      } else {
        delete newStyle.textDecoration;
      }
    }
    
    updateBulkProperty('cellStyle', Object.keys(newStyle).length > 0 ? newStyle : undefined);
  };
  
  const handleColorChange = (colorType: 'text' | 'fill' | 'border', color: string) => {
    const currentStyle = getMixedValueLocal('cellStyle').value as React.CSSProperties || {};
    const newStyle = { ...currentStyle };
    
    if (colorType === 'text') {
      setTextColor(color);
      newStyle.color = color;
    } else if (colorType === 'fill') {
      setFillColor(color);
      newStyle.backgroundColor = color;
    } else if (colorType === 'border') {
      setBorderColor(color);
      newStyle.borderColor = color;
      // Also set a default border style if not already set
      if (!newStyle.borderWidth) newStyle.borderWidth = '1px';
      if (!newStyle.borderStyle) newStyle.borderStyle = 'solid';
    }
    
    updateBulkProperty('cellStyle', newStyle);
  };

  return (
    <div className="space-y-2">
      {/* Cell/Header Toggle */}
      <div className="flex items-center justify-between mb-2">
        <ToggleGroup type="single" defaultValue="cell" size="sm">
          <ToggleGroupItem value="cell" className="cell-header-toggle text-xs h-7">
            <Columns className="h-3 w-3 mr-1" />
            Cell
          </ToggleGroupItem>
          <ToggleGroupItem value="header" className="cell-header-toggle text-xs h-7">
            <FileText className="h-3 w-3 mr-1" />
            Header
          </ToggleGroupItem>
        </ToggleGroup>
        
        <Button variant="ghost" size="sm" className="text-xs h-7">
          <Copy className="h-3 w-3 mr-1" />
          Copy to Header/Cell
        </Button>
      </div>
      
      {/* 4-Column Layout */}
      <div className="grid grid-cols-4 gap-3">
        {/* Column 1 - Font */}
        <div className="space-y-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Font</Label>
            <Select defaultValue="inter">
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
            <Select defaultValue="400">
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
            <Select defaultValue="14">
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
            <Label className="text-xs text-muted-foreground invisible">Vertical</Label>
            <ToggleGroup type="single" size="sm" defaultValue="middle" className="w-full">
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
                value={textColor}
                onChange={(e) => handleColorChange('text', e.target.value)}
                className="h-7 w-7 rounded border border-input cursor-pointer"
                title="Text color"
              />
              <Input
                value={textColor}
                onChange={(e) => handleColorChange('text', e.target.value)}
                className="h-7 flex-1 text-xs font-mono uppercase"
                placeholder="#000000"
                maxLength={7}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <PaintBucket className="h-3 w-3 text-muted-foreground" />
            <input
              type="color"
              value={fillColor}
              onChange={(e) => handleColorChange('fill', e.target.value)}
              className="h-7 w-7 rounded border border-input cursor-pointer"
              title="Fill color"
            />
            <Input
              value={fillColor}
              onChange={(e) => handleColorChange('fill', e.target.value)}
              className="h-7 flex-1 text-xs font-mono uppercase"
              placeholder="#FFFFFF"
              maxLength={7}
            />
          </div>
        </div>
        
        {/* Column 4 - Borders */}
        <div className="space-y-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Borders</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 w-full justify-between">
                  <Square className="h-3 w-3" />
                  <span className="text-xs">Configure</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1">
                    <Toggle size="sm" className="border-toggle h-7 w-full" pressed>
                      <Square className="h-3 w-3" />
                    </Toggle>
                    <Toggle size="sm" className="border-toggle h-7 w-full">
                      <ArrowUp className="h-3 w-3" />
                    </Toggle>
                    <Toggle size="sm" className="border-toggle h-7 w-full">
                      <ArrowRight className="h-3 w-3" />
                    </Toggle>
                    <Toggle size="sm" className="border-toggle h-7 w-full">
                      <ArrowDown className="h-3 w-3" />
                    </Toggle>
                    <Toggle size="sm" className="border-toggle h-7 w-full">
                      <ArrowLeft className="h-3 w-3" />
                    </Toggle>
                  </div>
                  <div className="flex gap-1">
                    <Select defaultValue="1">
                      <SelectTrigger className="h-7 w-14 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1px</SelectItem>
                        <SelectItem value="2">2px</SelectItem>
                        <SelectItem value="3">3px</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="solid">
                      <SelectTrigger className="h-7 flex-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="dashed">Dashed</SelectItem>
                        <SelectItem value="dotted">Dotted</SelectItem>
                      </SelectContent>
                    </Select>
                    <input
                      type="color"
                      value={borderColor}
                      onChange={(e) => handleColorChange('border', e.target.value)}
                      className="h-7 w-7 rounded border border-input cursor-pointer"
                      title="Border color"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Quick presets:
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 flex-1 p-1">
              <Square className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 flex-1 p-1">
              <div className="h-3 w-10 border-t border-b border-gray-400" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 flex-1 p-1">
              <div className="h-3 w-10 border border-gray-400" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 