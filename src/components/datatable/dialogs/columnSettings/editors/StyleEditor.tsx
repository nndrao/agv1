import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StyleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStyle: React.CSSProperties;
  onSave: (style: React.CSSProperties) => void;
  title?: string;
}

export const StyleEditor: React.FC<StyleEditorProps> = ({
  open,
  onOpenChange,
  initialStyle,
  onSave,
  title = 'Edit Style'
}) => {
  const [style, setStyle] = useState<React.CSSProperties>(initialStyle);
  const [enableTextColor, setEnableTextColor] = useState(!!initialStyle.color);
  const [enableBackground, setEnableBackground] = useState(!!initialStyle.backgroundColor);
  const [enableBorders, setEnableBorders] = useState(!!initialStyle.borderWidth || !!initialStyle.borderStyle || !!initialStyle.borderColor);
  const [borderSides, setBorderSides] = useState('all');
  const [previewText, setPreviewText] = useState('Sample Cell Value');

  useEffect(() => {
    setStyle(initialStyle);
    setEnableTextColor(!!initialStyle.color);
    setEnableBackground(!!initialStyle.backgroundColor);
    setEnableBorders(!!initialStyle.borderWidth || !!initialStyle.borderStyle || !!initialStyle.borderColor);
  }, [initialStyle]);

  const updateStyle = (property: string, value: string | number | undefined) => {
    setStyle(prev => {
      if (value === '' || value === undefined) {
        const { [property]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [property]: value };
    });
  };

  const updateBorderStyle = (property: string, value: string | number | undefined, side: string) => {
    setStyle(prev => {
      const newStyle = { ...prev };
      
      // When setting individual side properties, remove the general border properties
      // to avoid conflicts
      if (side !== 'all') {
        delete newStyle.borderWidth;
        delete newStyle.borderStyle;
        delete newStyle.borderColor;
      }
      
      if (value === '' || value === undefined) {
        delete newStyle[property];
      } else {
        newStyle[property] = value;
      }
      
      return newStyle;
    });
  };

  const handleSave = () => {
    // Clean up disabled properties
    const cleanedStyle = { ...style };
    if (!enableTextColor) delete cleanedStyle.color;
    if (!enableBackground) delete cleanedStyle.backgroundColor;
    if (!enableBorders) {
      // Remove all border-related properties
      delete cleanedStyle.borderWidth;
      delete cleanedStyle.borderStyle;
      delete cleanedStyle.borderColor;
      delete cleanedStyle.borderTopWidth;
      delete cleanedStyle.borderTopStyle;
      delete cleanedStyle.borderTopColor;
      delete cleanedStyle.borderRightWidth;
      delete cleanedStyle.borderRightStyle;
      delete cleanedStyle.borderRightColor;
      delete cleanedStyle.borderBottomWidth;
      delete cleanedStyle.borderBottomStyle;
      delete cleanedStyle.borderBottomColor;
      delete cleanedStyle.borderLeftWidth;
      delete cleanedStyle.borderLeftStyle;
      delete cleanedStyle.borderLeftColor;
    }
    onSave(cleanedStyle);
    onOpenChange(false);
  };

  const toggleFontStyle = (styleType: 'bold' | 'italic' | 'underline') => {
    switch (styleType) {
      case 'bold':
        updateStyle('fontWeight', style.fontWeight === 'bold' ? 'normal' : 'bold');
        break;
      case 'italic':
        updateStyle('fontStyle', style.fontStyle === 'italic' ? 'normal' : 'italic');
        break;
      case 'underline':
        updateStyle('textDecoration', style.textDecoration === 'underline' ? 'none' : 'underline');
        break;
    }
  };

  const getBorderStyle = () => {
    if (!enableBorders) return {};
    
    // Return all border-related styles from the style object
    const borderStyles: React.CSSProperties = {};
    
    // Include general border properties if they exist
    if (style.borderWidth) borderStyles.borderWidth = style.borderWidth;
    if (style.borderStyle) borderStyles.borderStyle = style.borderStyle;
    if (style.borderColor) borderStyles.borderColor = style.borderColor;
    
    // Include specific side properties if they exist
    if (style.borderTopWidth) borderStyles.borderTopWidth = style.borderTopWidth;
    if (style.borderTopStyle) borderStyles.borderTopStyle = style.borderTopStyle;
    if (style.borderTopColor) borderStyles.borderTopColor = style.borderTopColor;
    
    if (style.borderRightWidth) borderStyles.borderRightWidth = style.borderRightWidth;
    if (style.borderRightStyle) borderStyles.borderRightStyle = style.borderRightStyle;
    if (style.borderRightColor) borderStyles.borderRightColor = style.borderRightColor;
    
    if (style.borderBottomWidth) borderStyles.borderBottomWidth = style.borderBottomWidth;
    if (style.borderBottomStyle) borderStyles.borderBottomStyle = style.borderBottomStyle;
    if (style.borderBottomColor) borderStyles.borderBottomColor = style.borderBottomColor;
    
    if (style.borderLeftWidth) borderStyles.borderLeftWidth = style.borderLeftWidth;
    if (style.borderLeftStyle) borderStyles.borderLeftStyle = style.borderLeftStyle;
    if (style.borderLeftColor) borderStyles.borderLeftColor = style.borderLeftColor;
    
    return borderStyles;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 -mx-6">
          <div className="space-y-4 py-4">
            {/* Preview Section */}
            <div className="space-y-2">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-900">
              <div 
                style={{
                  ...style,
                  ...getBorderStyle(),
                  color: enableTextColor ? style.color : undefined,
                  backgroundColor: enableBackground ? style.backgroundColor : undefined,
                }}
                className="p-2"
              >
                {previewText}
              </div>
            </div>
          </div>

          {/* Font Family and Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Font Family</Label>
              <Select 
                value={style.fontFamily || 'inherit'} 
                onValueChange={(value) => updateStyle('fontFamily', value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Default</SelectItem>
                  <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                  <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                  <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                  <SelectItem value="Georgia, serif">Georgia</SelectItem>
                  <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                  <SelectItem value="system-ui">System UI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Font Size</Label>
              <Select 
                value={style.fontSize || '12px'} 
                onValueChange={(value) => updateStyle('fontSize', value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10px">10px</SelectItem>
                  <SelectItem value="11px">11px</SelectItem>
                  <SelectItem value="12px">12px</SelectItem>
                  <SelectItem value="13px">13px</SelectItem>
                  <SelectItem value="14px">14px</SelectItem>
                  <SelectItem value="16px">16px</SelectItem>
                  <SelectItem value="18px">18px</SelectItem>
                  <SelectItem value="20px">20px</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Font Weight and Style */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Font Weight</Label>
              <Select 
                value={style.fontWeight?.toString() || '400'} 
                onValueChange={(value) => updateStyle('fontWeight', value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light (300)</SelectItem>
                  <SelectItem value="400">Normal (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semibold (600)</SelectItem>
                  <SelectItem value="700">Bold (700)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Style</Label>
              <div className="flex gap-1">
                <Button
                  variant={style.fontWeight === 'bold' ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => toggleFontStyle('bold')}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant={style.fontStyle === 'italic' ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => toggleFontStyle('italic')}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant={style.textDecoration === 'underline' ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => toggleFontStyle('underline')}
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Text Color and Background */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Text Color</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Apply</span>
                  <Switch
                    checked={enableTextColor}
                    onCheckedChange={setEnableTextColor}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={style.color || '#000000'}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  className={cn(
                    "w-10 h-9 rounded border cursor-pointer",
                    !enableTextColor && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                  disabled={!enableTextColor}
                />
                <Input
                  value={style.color || '#000000'}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  className="h-9"
                  disabled={!enableTextColor}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Background</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Apply</span>
                  <Switch
                    checked={enableBackground}
                    onCheckedChange={setEnableBackground}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={style.backgroundColor || '#FFFFFF'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className={cn(
                    "w-10 h-9 rounded border cursor-pointer",
                    !enableBackground && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                  disabled={!enableBackground}
                />
                <Input
                  value={style.backgroundColor || '#FFFFFF'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="h-9"
                  disabled={!enableBackground}
                />
              </div>
            </div>
          </div>

          {/* Alignment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Horizontal</Label>
              <div className="flex gap-1">
                <Button
                  variant={style.textAlign === 'left' ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 flex-1"
                  onClick={() => updateStyle('textAlign', 'left')}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant={style.textAlign === 'center' ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 flex-1"
                  onClick={() => updateStyle('textAlign', 'center')}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant={style.textAlign === 'right' ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 flex-1"
                  onClick={() => updateStyle('textAlign', 'right')}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Vertical</Label>
              <div className="flex gap-1">
                <Button
                  variant={style.verticalAlign === 'top' ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 flex-1"
                  onClick={() => updateStyle('verticalAlign', 'top')}
                >
                  <AlignVerticalJustifyStart className="h-4 w-4" />
                </Button>
                <Button
                  variant={style.verticalAlign === 'middle' ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 flex-1"
                  onClick={() => updateStyle('verticalAlign', 'middle')}
                >
                  <AlignVerticalJustifyCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant={style.verticalAlign === 'bottom' ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 flex-1"
                  onClick={() => updateStyle('verticalAlign', 'bottom')}
                >
                  <AlignVerticalJustifyEnd className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Borders Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Borders</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Apply Borders</span>
                <Switch
                  checked={enableBorders}
                  onCheckedChange={setEnableBorders}
                />
              </div>
            </div>

            {enableBorders && (
              <div className="space-y-3 pl-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Style</Label>
                    <Select 
                      value={
                        borderSides === 'all' 
                          ? (style.borderStyle || 'solid')
                          : borderSides === 'top' 
                          ? (style.borderTopStyle || 'solid')
                          : borderSides === 'right'
                          ? (style.borderRightStyle || 'solid')
                          : borderSides === 'bottom'
                          ? (style.borderBottomStyle || 'solid')
                          : borderSides === 'left'
                          ? (style.borderLeftStyle || 'solid')
                          : 'solid'
                      } 
                      onValueChange={(value) => {
                        if (borderSides === 'all') {
                          updateBorderStyle('borderStyle', value, 'all');
                        } else if (borderSides === 'top') {
                          updateBorderStyle('borderTopStyle', value, 'top');
                        } else if (borderSides === 'right') {
                          updateBorderStyle('borderRightStyle', value, 'right');
                        } else if (borderSides === 'bottom') {
                          updateBorderStyle('borderBottomStyle', value, 'bottom');
                        } else if (borderSides === 'left') {
                          updateBorderStyle('borderLeftStyle', value, 'left');
                        } else if (borderSides === 'horizontal') {
                          updateBorderStyle('borderTopStyle', value, 'horizontal');
                          updateBorderStyle('borderBottomStyle', value, 'horizontal');
                        } else if (borderSides === 'vertical') {
                          updateBorderStyle('borderLeftStyle', value, 'vertical');
                          updateBorderStyle('borderRightStyle', value, 'vertical');
                        }
                      }}
                    >
                      <SelectTrigger className="h-9">
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

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Width</Label>
                    <Select 
                      value={
                        borderSides === 'all' 
                          ? (style.borderWidth || '1px')
                          : borderSides === 'top' 
                          ? (style.borderTopWidth || '1px')
                          : borderSides === 'right'
                          ? (style.borderRightWidth || '1px')
                          : borderSides === 'bottom'
                          ? (style.borderBottomWidth || '1px')
                          : borderSides === 'left'
                          ? (style.borderLeftWidth || '1px')
                          : '1px'
                      } 
                      onValueChange={(value) => {
                        if (borderSides === 'all') {
                          updateBorderStyle('borderWidth', value, 'all');
                        } else if (borderSides === 'top') {
                          updateBorderStyle('borderTopWidth', value, 'top');
                        } else if (borderSides === 'right') {
                          updateBorderStyle('borderRightWidth', value, 'right');
                        } else if (borderSides === 'bottom') {
                          updateBorderStyle('borderBottomWidth', value, 'bottom');
                        } else if (borderSides === 'left') {
                          updateBorderStyle('borderLeftWidth', value, 'left');
                        } else if (borderSides === 'horizontal') {
                          updateBorderStyle('borderTopWidth', value, 'horizontal');
                          updateBorderStyle('borderBottomWidth', value, 'horizontal');
                        } else if (borderSides === 'vertical') {
                          updateBorderStyle('borderLeftWidth', value, 'vertical');
                          updateBorderStyle('borderRightWidth', value, 'vertical');
                        }
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1px">1px</SelectItem>
                        <SelectItem value="2px">2px</SelectItem>
                        <SelectItem value="3px">3px</SelectItem>
                        <SelectItem value="4px">4px</SelectItem>
                        <SelectItem value="5px">5px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={
                          borderSides === 'all' 
                            ? (style.borderColor || '#E5E7EB')
                            : borderSides === 'top' 
                            ? (style.borderTopColor || '#E5E7EB')
                            : borderSides === 'right'
                            ? (style.borderRightColor || '#E5E7EB')
                            : borderSides === 'bottom'
                            ? (style.borderBottomColor || '#E5E7EB')
                            : borderSides === 'left'
                            ? (style.borderLeftColor || '#E5E7EB')
                            : '#E5E7EB'
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          if (borderSides === 'all') {
                            updateBorderStyle('borderColor', value, 'all');
                          } else if (borderSides === 'top') {
                            updateBorderStyle('borderTopColor', value, 'top');
                          } else if (borderSides === 'right') {
                            updateBorderStyle('borderRightColor', value, 'right');
                          } else if (borderSides === 'bottom') {
                            updateBorderStyle('borderBottomColor', value, 'bottom');
                          } else if (borderSides === 'left') {
                            updateBorderStyle('borderLeftColor', value, 'left');
                          } else if (borderSides === 'horizontal') {
                            updateBorderStyle('borderTopColor', value, 'horizontal');
                            updateBorderStyle('borderBottomColor', value, 'horizontal');
                          } else if (borderSides === 'vertical') {
                            updateBorderStyle('borderLeftColor', value, 'vertical');
                            updateBorderStyle('borderRightColor', value, 'vertical');
                          }
                        }}
                        className="w-10 h-9 rounded border cursor-pointer"
                      />
                      <Input
                        value={
                          borderSides === 'all' 
                            ? (style.borderColor || '#E5E7EB')
                            : borderSides === 'top' 
                            ? (style.borderTopColor || '#E5E7EB')
                            : borderSides === 'right'
                            ? (style.borderRightColor || '#E5E7EB')
                            : borderSides === 'bottom'
                            ? (style.borderBottomColor || '#E5E7EB')
                            : borderSides === 'left'
                            ? (style.borderLeftColor || '#E5E7EB')
                            : '#E5E7EB'
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          if (borderSides === 'all') {
                            updateBorderStyle('borderColor', value, 'all');
                          } else if (borderSides === 'top') {
                            updateBorderStyle('borderTopColor', value, 'top');
                          } else if (borderSides === 'right') {
                            updateBorderStyle('borderRightColor', value, 'right');
                          } else if (borderSides === 'bottom') {
                            updateBorderStyle('borderBottomColor', value, 'bottom');
                          } else if (borderSides === 'left') {
                            updateBorderStyle('borderLeftColor', value, 'left');
                          } else if (borderSides === 'horizontal') {
                            updateBorderStyle('borderTopColor', value, 'horizontal');
                            updateBorderStyle('borderBottomColor', value, 'horizontal');
                          } else if (borderSides === 'vertical') {
                            updateBorderStyle('borderLeftColor', value, 'vertical');
                            updateBorderStyle('borderRightColor', value, 'vertical');
                          }
                        }}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Sides</Label>
                    <Select 
                      value={borderSides} 
                      onValueChange={setBorderSides}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="horizontal">Horizontal</SelectItem>
                        <SelectItem value="vertical">Vertical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        <DialogFooter className="mt-6 px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};