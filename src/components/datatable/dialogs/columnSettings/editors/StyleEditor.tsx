import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HexColorPicker } from 'react-colorful';
import { Editor } from '@monaco-editor/react';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  Type, 
  Palette, 
  Bold,
  Italic,
  Underline,
  Square,
  Code,
  Eye,
  RotateCcw
} from 'lucide-react';

interface StyleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStyle?: React.CSSProperties;
  onSave: (style: React.CSSProperties) => void;
  title: string;
  isHeaderStyle?: boolean;
}

export const StyleEditor: React.FC<StyleEditorProps> = ({
  open,
  onOpenChange,
  initialStyle = {},
  onSave,
  title,
  isHeaderStyle = false
}) => {
  const [style, setStyle] = useState<React.CSSProperties>(initialStyle);
  const [cssText, setCssText] = useState(convertStyleToCss(initialStyle));
  const [activeTab, setActiveTab] = useState('visual');

  // Sync with initialStyle changes
  useEffect(() => {
    setStyle(initialStyle);
    setCssText(convertStyleToCss(initialStyle));
  }, [initialStyle]);

  const updateStyle = (property: keyof React.CSSProperties, value: string | number | undefined) => {
    const newStyle = { ...style };
    if (value === undefined || value === '') {
      delete newStyle[property];
    } else {
      newStyle[property] = value as never;
    }
    setStyle(newStyle);
    setCssText(convertStyleToCss(newStyle));
  };

  const handleCssChange = (css: string | undefined) => {
    if (!css) return;
    setCssText(css);
    try {
      const styleObj = parseCssToStyle(css);
      setStyle(styleObj);
    } catch (e) {
      console.warn('Invalid CSS:', e);
    }
  };

  const handleSave = () => {
    onSave(style);
    onOpenChange(false);
  };

  const resetStyles = () => {
    setStyle({});
    setCssText('');
  };

  const hasStyles = Object.keys(style).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] max-h-[900px] p-0 flex flex-col">
        {/* Compact Header */}
        <DialogHeader className="px-4 py-3 border-b shrink-0 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <DialogTitle className="text-base">{title}</DialogTitle>
                <DialogDescription className="sr-only">
                  Style editor for customizing {isHeaderStyle ? 'header' : 'cell'} appearance including colors, typography, spacing, and borders
                </DialogDescription>
              </div>
              {hasStyles && (
                <Badge variant="secondary" className="text-xs">
                  {Object.keys(style).length} properties
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetStyles}
              disabled={!hasStyles}
              className="h-7 px-3 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset All
            </Button>
          </div>
        </DialogHeader>

        <div className="flex gap-0 flex-1 min-h-0 overflow-hidden">
          {/* Main Editor Panel */}
          <div className="flex-1 flex flex-col min-h-0 border-r">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              {/* Compact Tab List */}
              <div className="border-b bg-muted/20 px-3 py-2 shrink-0">
                <TabsList className="h-8 p-1">
                  <TabsTrigger value="visual" className="h-6 px-3 text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Visual
                  </TabsTrigger>
                  <TabsTrigger value="css" className="h-6 px-3 text-xs">
                    <Code className="h-3 w-3 mr-1" />
                    CSS
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="visual" className="flex-1 overflow-y-auto p-4 min-h-0 m-0">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Typography Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Type className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium text-sm">Typography</h3>
                      </div>
                      
                      {/* Font Family */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Font Family</Label>
                        <Select
                          value={style.fontFamily as string || 'default'}
                          onValueChange={(value) => updateStyle('fontFamily', value === 'default' ? undefined : value)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Default" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="system-ui, -apple-system, sans-serif">System UI</SelectItem>
                            <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                            <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                            <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                            <SelectItem value="Georgia, serif">Georgia</SelectItem>
                            <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                            <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Font Size & Weight Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Size</Label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={parseInt(style.fontSize as string) || ''}
                              onChange={(e) => updateStyle('fontSize', e.target.value ? `${e.target.value}px` : undefined)}
                              className="h-8 text-sm"
                              placeholder="14"
                              min={8}
                              max={72}
                            />
                            <span className="text-xs text-muted-foreground w-6">px</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Weight</Label>
                          <Select
                            value={style.fontWeight as string || 'default'}
                            onValueChange={(value) => updateStyle('fontWeight', value === 'default' ? undefined : value)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Normal" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Normal</SelectItem>
                              <SelectItem value="300">Light</SelectItem>
                              <SelectItem value="400">Normal</SelectItem>
                              <SelectItem value="500">Medium</SelectItem>
                              <SelectItem value="600">Semi Bold</SelectItem>
                              <SelectItem value="700">Bold</SelectItem>
                              <SelectItem value="900">Black</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Font Style Toggles */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Style</Label>
                        <div className="flex gap-1">
                          <Button
                            variant={style.fontWeight === 'bold' || style.fontWeight === '700' ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              const isBold = style.fontWeight === 'bold' || style.fontWeight === '700';
                              updateStyle('fontWeight', isBold ? undefined : 'bold');
                            }}
                          >
                            <Bold className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={style.fontStyle === 'italic' ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateStyle('fontStyle', style.fontStyle === 'italic' ? undefined : 'italic')}
                          >
                            <Italic className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={style.textDecoration === 'underline' ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateStyle('textDecoration', style.textDecoration === 'underline' ? undefined : 'underline')}
                          >
                            <Underline className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>


                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Colors Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium text-sm">Colors</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <ColorControl
                          label="Text Color"
                          value={style.color as string}
                          onChange={(color) => updateStyle('color', color)}
                          defaultColor="#000000"
                        />
                        
                        <ColorControl
                          label="Background"
                          value={style.backgroundColor as string}
                          onChange={(color) => updateStyle('backgroundColor', color)}
                          defaultColor="#ffffff"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Spacing & Layout */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm">Spacing & Layout</h3>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Padding</Label>
                          <Input
                            value={style.padding as string || ''}
                            onChange={(e) => updateStyle('padding', e.target.value || undefined)}
                            className="h-8 text-sm"
                            placeholder="8px"
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Margin</Label>
                          <Input
                            value={style.margin as string || ''}
                            onChange={(e) => updateStyle('margin', e.target.value || undefined)}
                            className="h-8 text-sm"
                            placeholder="0px"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Border Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Square className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium text-sm">Border</h3>
                      </div>
                      
                      <BorderControl
                        allSides={style.border as string}
                        topSide={style.borderTop as string}
                        rightSide={style.borderRight as string}
                        bottomSide={style.borderBottom as string}
                        leftSide={style.borderLeft as string}
                        onAllSidesChange={(border) => updateStyle('border', border)}
                        onTopChange={(border) => updateStyle('borderTop', border)}
                        onRightChange={(border) => updateStyle('borderRight', border)}
                        onBottomChange={(border) => updateStyle('borderBottom', border)}
                        onLeftChange={(border) => updateStyle('borderLeft', border)}
                      />
                      
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Border Radius</Label>
                        <Input
                          value={style.borderRadius as string || ''}
                          onChange={(e) => updateStyle('borderRadius', e.target.value || undefined)}
                          className="h-8 text-sm"
                          placeholder="4px"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="css" className="flex-1 m-0 min-h-0">
                <Editor
                  height="100%"
                  language="css"
                  theme="vs-dark"
                  value={cssText}
                  onChange={handleCssChange}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                    padding: { top: 16, bottom: 16 }
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Compact Preview Panel */}
          <div className="w-80 bg-muted/20 flex flex-col shrink-0">
            {/* Preview Header */}
            <div className="px-4 py-3 border-b bg-muted/30">
              <h3 className="font-medium text-sm">Live Preview</h3>
            </div>

            {/* Preview Content */}
            <div className="p-4 space-y-4 flex-1">
              <div className="border rounded-lg p-3 bg-background shadow-sm">
                <div 
                  style={style} 
                  className="p-3 text-center border rounded min-h-[60px] flex items-center justify-center"
                >
                  {isHeaderStyle ? 'Column Header' : 'Sample Cell Content'}
                </div>
              </div>

              {/* CSS Output */}
              <div className="flex-1 min-h-0">
                <h4 className="font-medium text-xs mb-2 text-muted-foreground uppercase tracking-wide">CSS Output</h4>
                <div className="text-xs bg-muted/50 p-3 rounded border overflow-auto max-h-[200px] font-mono">
                  <pre className="whitespace-pre-wrap">{cssText || '/* No styles applied */'}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Footer */}
        <DialogFooter className="px-4 py-3 border-t shrink-0 bg-muted/20">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              {hasStyles ? `${Object.keys(style).length} properties applied` : 'No styles applied'}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Apply Style
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Color Control Component
interface ColorControlProps {
  label: string;
  value?: string;
  onChange: (color: string | undefined) => void;
  defaultColor: string;
}

const ColorControl: React.FC<ColorControlProps> = ({ label, value, onChange, defaultColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentColor = value || defaultColor;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-8 w-16 p-1 border-2"
              style={{ backgroundColor: currentColor }}
            >
              <div className="w-full h-full rounded-sm border border-white/20" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <HexColorPicker
              color={currentColor}
              onChange={onChange}
            />
            <Input
              value={currentColor}
              onChange={(e) => onChange(e.target.value)}
              className="mt-3 h-8 text-sm font-mono"
              placeholder="#000000"
            />
          </PopoverContent>
        </Popover>
        
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="h-8 text-sm font-mono flex-1"
          placeholder={defaultColor}
        />
        
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onChange(undefined)}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Border Control Component
interface BorderControlProps {
  allSides?: string;
  topSide?: string;
  rightSide?: string;
  bottomSide?: string;
  leftSide?: string;
  onAllSidesChange: (border: string | undefined) => void;
  onTopChange: (border: string | undefined) => void;
  onRightChange: (border: string | undefined) => void;
  onBottomChange: (border: string | undefined) => void;
  onLeftChange: (border: string | undefined) => void;
}

const BorderControl: React.FC<BorderControlProps> = ({ 
  allSides, 
  topSide, 
  rightSide, 
  bottomSide, 
  leftSide,
  onAllSidesChange,
  onTopChange,
  onRightChange,
  onBottomChange,
  onLeftChange
}) => {
  const [mode, setMode] = useState<'all' | 'individual'>('all');

  const borderStyles = ['solid', 'dashed', 'dotted', 'double'];
  const borderWidths = ['0', '1', '2', '3', '4', '5'];

  // Check if we have individual borders set
  useEffect(() => {
    if (topSide || rightSide || bottomSide || leftSide) {
      setMode('individual');
    } else if (allSides) {
      setMode('all');
    }
  }, [allSides, topSide, rightSide, bottomSide, leftSide]);

  // Removed unused helper functions

  const clearAllBorders = () => {
    onAllSidesChange(undefined);
    onTopChange(undefined);
    onRightChange(undefined);
    onBottomChange(undefined);
    onLeftChange(undefined);
  };

  const hasAnyBorder = allSides || topSide || rightSide || bottomSide || leftSide;

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Border Mode</Label>
        <Select
          value={mode}
          onValueChange={(value: 'all' | 'individual') => {
            setMode(value);
            if (value === 'all') {
              // Clear individual borders when switching to all
              onTopChange(undefined);
              onRightChange(undefined);
              onBottomChange(undefined);
              onLeftChange(undefined);
            } else {
              // Clear all border when switching to individual
              onAllSidesChange(undefined);
            }
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sides</SelectItem>
            <SelectItem value="individual">Individual Sides</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === 'all' ? (
        <BorderSideControl
          label="All Borders"
          value={allSides}
          onChange={onAllSidesChange}
          borderStyles={borderStyles}
          borderWidths={borderWidths}
        />
      ) : (
        <div className="space-y-2">
          <BorderSideControl
            label="Top"
            value={topSide}
            onChange={onTopChange}
            borderStyles={borderStyles}
            borderWidths={borderWidths}
            compact
          />
          <BorderSideControl
            label="Right"
            value={rightSide}
            onChange={onRightChange}
            borderStyles={borderStyles}
            borderWidths={borderWidths}
            compact
          />
          <BorderSideControl
            label="Bottom"
            value={bottomSide}
            onChange={onBottomChange}
            borderStyles={borderStyles}
            borderWidths={borderWidths}
            compact
          />
          <BorderSideControl
            label="Left"
            value={leftSide}
            onChange={onLeftChange}
            borderStyles={borderStyles}
            borderWidths={borderWidths}
            compact
          />
        </div>
      )}
      
      {hasAnyBorder && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs w-full"
          onClick={clearAllBorders}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Clear All Borders
        </Button>
      )}
    </div>
  );
};

// Individual Border Side Control Component
interface BorderSideControlProps {
  label: string;
  value?: string;
  onChange: (border: string | undefined) => void;
  borderStyles: string[];
  borderWidths: string[];
  compact?: boolean;
}

const BorderSideControl: React.FC<BorderSideControlProps> = ({
  label,
  value,
  onChange,
  borderStyles,
  borderWidths,
  compact = false
}) => {
  const [width, setWidth] = useState('1');
  const [style, setStyle] = useState('solid');
  const [color, setColor] = useState('#cccccc');

  // Parse initial value
  useEffect(() => {
    if (value) {
      const parts = value.split(' ');
      if (parts.length >= 3) {
        setWidth(parseInt(parts[0]) + '');
        setStyle(parts[1]);
        setColor(parts[2]);
      }
    } else {
      setWidth('1');
      setStyle('solid');
      setColor('#cccccc');
    }
  }, [value]);

  const updateBorder = (newWidth: string, newStyle: string, newColor: string) => {
    if (newWidth === '0') {
      onChange(undefined);
    } else {
      onChange(`${newWidth}px ${newStyle} ${newColor}`);
    }
  };

  if (compact) {
    return (
      <div className="grid grid-cols-[60px_1fr_80px_80px_60px] items-center gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        
        <Select
          value={width}
          onValueChange={(value) => {
            setWidth(value);
            updateBorder(value, style, color);
          }}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {borderWidths.map(w => (
              <SelectItem key={w} value={w}>{w}px</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={style}
          onValueChange={(value) => {
            setStyle(value);
            updateBorder(width, value, color);
          }}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {borderStyles.map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-7 w-full p-1"
              style={{ backgroundColor: color }}
            >
              <div className="w-full h-full rounded-sm border border-white/20" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <HexColorPicker
              color={color}
              onChange={(newColor) => {
                setColor(newColor);
                updateBorder(width, style, newColor);
              }}
            />
            <Input
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                updateBorder(width, style, e.target.value);
              }}
              className="mt-3 h-8 text-sm font-mono"
              placeholder="#cccccc"
            />
          </PopoverContent>
        </Popover>

        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onChange(undefined)}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground font-medium">{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Width</Label>
          <Select
            value={width}
            onValueChange={(value) => {
              setWidth(value);
              updateBorder(value, style, color);
            }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {borderWidths.map(w => (
                <SelectItem key={w} value={w}>{w}px</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Style</Label>
          <Select
            value={style}
            onValueChange={(value) => {
              setStyle(value);
              updateBorder(width, value, color);
            }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {borderStyles.map(s => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Color</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-full p-1"
                style={{ backgroundColor: color }}
              >
                <div className="w-full h-full rounded-sm border border-white/20" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <HexColorPicker
                color={color}
                onChange={(newColor) => {
                  setColor(newColor);
                  updateBorder(width, style, newColor);
                }}
              />
              <Input
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  updateBorder(width, style, e.target.value);
                }}
                className="mt-3 h-8 text-sm font-mono"
                placeholder="#cccccc"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs w-full"
          onClick={() => onChange(undefined)}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Clear Border
        </Button>
      )}
    </div>
  );
};

// Helper functions
function convertStyleToCss(style: React.CSSProperties): string {
  return Object.entries(style)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value};`;
    })
    .join('\n');
}

function parseCssToStyle(css: string): React.CSSProperties {
  const style: Record<string, string> = {};
  css.split(';').forEach(rule => {
    const [key, value] = rule.split(':').map(s => s.trim());
    if (key && value) {
      const jsKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      style[jsKey] = value;
    }
  });
  return style;
}