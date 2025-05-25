import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HexColorPicker } from 'react-colorful';
import { Editor } from '@monaco-editor/react';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface StyleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStyle?: React.CSSProperties;
  onSave: (style: React.CSSProperties) => void;
  title: string;
}

export const StyleEditor: React.FC<StyleEditorProps> = ({
  open,
  onOpenChange,
  initialStyle = {},
  onSave,
  title
}) => {
  const [style, setStyle] = useState<React.CSSProperties>(initialStyle);
  const [cssText, setCssText] = useState(convertStyleToCss(initialStyle));
  const [activeTab, setActiveTab] = useState('visual');

  // Typography state
  const [enableFont, setEnableFont] = useState(!!style.fontFamily);
  const [enableFontSize, setEnableFontSize] = useState(!!style.fontSize);
  const [enableFontWeight, setEnableFontWeight] = useState(!!style.fontWeight);

  // Color state
  const [enableColor, setEnableColor] = useState(!!style.color);
  const [enableBackground, setEnableBackground] = useState(!!style.backgroundColor);

  // Border state
  const [enableBorder, setEnableBorder] = useState(!!style.border);
  const [borderSides, setBorderSides] = useState({
    all: true,
    top: false,
    right: false,
    bottom: false,
    left: false
  });

  // Sync with initialStyle changes
  useEffect(() => {
    setStyle(initialStyle);
    setCssText(convertStyleToCss(initialStyle));
    setEnableFont(!!initialStyle.fontFamily);
    setEnableFontSize(!!initialStyle.fontSize);
    setEnableFontWeight(!!initialStyle.fontWeight);
    setEnableColor(!!initialStyle.color);
    setEnableBackground(!!initialStyle.backgroundColor);
    setEnableBorder(!!initialStyle.border);
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
      // Invalid CSS, don't update style
      console.warn('Invalid CSS:', e);
    }
  };

  const handleSave = () => {
    onSave(style);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] max-h-[800px] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Editor Panel */}
          <div className="flex-1 flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-4 mt-4 shrink-0">
                <TabsTrigger value="visual">Visual Editor</TabsTrigger>
                <TabsTrigger value="css">CSS Editor</TabsTrigger>
              </TabsList>

              <TabsContent value="visual" className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
                <div className="space-y-4 pb-4">
                  {/* Typography Section */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">TYPOGRAPHY</h3>
                    
                    <div className="grid grid-cols-[24px_100px_1fr] items-center gap-3">
                      <Switch
                        checked={enableFont}
                        onCheckedChange={(checked) => {
                          setEnableFont(checked);
                          if (!checked) updateStyle('fontFamily', undefined);
                        }}
                        className="h-4 w-8"
                      />
                      <Label className="text-sm">Font</Label>
                      <Select
                        value={style.fontFamily as string || ''}
                        onValueChange={(value) => updateStyle('fontFamily', value)}
                        disabled={!enableFont}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Courier New">Courier New</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="system-ui">System UI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-[24px_100px_1fr] items-center gap-3">
                      <Switch
                        checked={enableFontSize}
                        onCheckedChange={(checked) => {
                          setEnableFontSize(checked);
                          if (!checked) updateStyle('fontSize', undefined);
                        }}
                        className="h-4 w-8"
                      />
                      <Label className="text-sm">Size</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={parseInt(style.fontSize as string) || 14}
                          onChange={(e) => updateStyle('fontSize', `${e.target.value}px`)}
                          disabled={!enableFontSize}
                          className="h-8 w-20 text-sm"
                          min={8}
                          max={72}
                        />
                        <span className="text-xs text-muted-foreground">px</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-[24px_100px_1fr] items-center gap-3">
                      <Switch
                        checked={enableFontWeight}
                        onCheckedChange={(checked) => {
                          setEnableFontWeight(checked);
                          if (!checked) updateStyle('fontWeight', undefined);
                        }}
                        className="h-4 w-8"
                      />
                      <Label className="text-sm">Weight</Label>
                      <Select
                        value={style.fontWeight as string || 'normal'}
                        onValueChange={(value) => updateStyle('fontWeight', value)}
                        disabled={!enableFontWeight}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                          <SelectItem value="lighter">Lighter</SelectItem>
                          <SelectItem value="100">100 - Thin</SelectItem>
                          <SelectItem value="300">300 - Light</SelectItem>
                          <SelectItem value="400">400 - Normal</SelectItem>
                          <SelectItem value="500">500 - Medium</SelectItem>
                          <SelectItem value="600">600 - Semi Bold</SelectItem>
                          <SelectItem value="700">700 - Bold</SelectItem>
                          <SelectItem value="900">900 - Black</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Alignment Section */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">ALIGNMENT</h3>
                    
                    <div className="grid grid-cols-[124px_1fr] items-center gap-3">
                      <Label className="text-sm">Text Align</Label>
                      <Select
                        value={style.textAlign as string || 'left'}
                        onValueChange={(value) => updateStyle('textAlign', value)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                          <SelectItem value="justify">Justify</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-[124px_1fr] items-center gap-3">
                      <Label className="text-sm">Vertical Align</Label>
                      <Select
                        value={style.verticalAlign as string || 'middle'}
                        onValueChange={(value) => updateStyle('verticalAlign', value)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="middle">Middle</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Colors Section */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">COLORS</h3>
                    
                    <div className="grid grid-cols-[24px_100px_1fr] items-center gap-3">
                      <Switch
                        checked={enableColor}
                        onCheckedChange={(checked) => {
                          setEnableColor(checked);
                          if (!checked) updateStyle('color', undefined);
                        }}
                        className="h-4 w-8"
                      />
                      <Label className="text-sm">Text Color</Label>
                      {enableColor && (
                        <div className="flex items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="h-8 w-24 px-3 text-sm"
                                style={{ backgroundColor: style.color as string || '#000000' }}
                              >
                                <span className="text-white mix-blend-difference">
                                  {style.color as string || '#000000'}
                                </span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3">
                              <HexColorPicker
                                color={style.color as string || '#000000'}
                                onChange={(color) => updateStyle('color', color)}
                              />
                              <Input
                                value={style.color as string || '#000000'}
                                onChange={(e) => updateStyle('color', e.target.value)}
                                className="mt-2 h-8 text-sm"
                                placeholder="#000000"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-[24px_100px_1fr] items-center gap-3">
                      <Switch
                        checked={enableBackground}
                        onCheckedChange={(checked) => {
                          setEnableBackground(checked);
                          if (!checked) updateStyle('backgroundColor', undefined);
                        }}
                        className="h-4 w-8"
                      />
                      <Label className="text-sm">Background</Label>
                      {enableBackground && (
                        <div className="flex items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="h-8 w-24 px-3 text-sm"
                                style={{ backgroundColor: style.backgroundColor as string || '#ffffff' }}
                              >
                                <span className="text-black mix-blend-difference">
                                  {style.backgroundColor as string || '#ffffff'}
                                </span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3">
                              <HexColorPicker
                                color={style.backgroundColor as string || '#ffffff'}
                                onChange={(color) => updateStyle('backgroundColor', color)}
                              />
                              <Input
                                value={style.backgroundColor as string || '#ffffff'}
                                onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                                className="mt-2 h-8 text-sm"
                                placeholder="#ffffff"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Border Section */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">BORDERS</h3>
                    
                    <div className="grid grid-cols-[24px_100px_1fr] items-center gap-3">
                      <Switch
                        checked={enableBorder}
                        onCheckedChange={(checked) => {
                          setEnableBorder(checked);
                          if (!checked) {
                            updateStyle('border', undefined);
                            updateStyle('borderTop', undefined);
                            updateStyle('borderRight', undefined);
                            updateStyle('borderBottom', undefined);
                            updateStyle('borderLeft', undefined);
                          }
                        }}
                        className="h-4 w-8"
                      />
                      <Label className="text-sm">Enable</Label>
                      <div className="flex items-center gap-2">
                        <Select
                          value={borderSides.all ? 'all' : 'individual'}
                          onValueChange={(value) => {
                            setBorderSides({
                              all: value === 'all',
                              top: false,
                              right: false,
                              bottom: false,
                              left: false
                            });
                          }}
                          disabled={!enableBorder}
                        >
                          <SelectTrigger className="h-8 text-sm w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sides</SelectItem>
                            <SelectItem value="individual">Individual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {enableBorder && borderSides.all && (
                      <BorderEditor
                        label="All Borders"
                        value={style.border as string}
                        onChange={(value) => updateStyle('border', value)}
                      />
                    )}

                    {enableBorder && !borderSides.all && (
                      <>
                        <BorderEditor
                          label="Top"
                          value={style.borderTop as string}
                          onChange={(value) => updateStyle('borderTop', value)}
                          compact
                        />
                        <BorderEditor
                          label="Right"
                          value={style.borderRight as string}
                          onChange={(value) => updateStyle('borderRight', value)}
                          compact
                        />
                        <BorderEditor
                          label="Bottom"
                          value={style.borderBottom as string}
                          onChange={(value) => updateStyle('borderBottom', value)}
                          compact
                        />
                        <BorderEditor
                          label="Left"
                          value={style.borderLeft as string}
                          onChange={(value) => updateStyle('borderLeft', value)}
                          compact
                        />
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="css" className="flex-1 m-4 min-h-0">
                <Editor
                  height="100%"
                  language="css"
                  theme="vs-dark"
                  value={cssText}
                  onChange={handleCssChange}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="w-[320px] border-l bg-muted/30 p-4 flex flex-col gap-4 shrink-0">
            <h3 className="font-semibold text-lg">Live Preview</h3>
            <div className="border rounded-lg p-4 bg-background">
              <div 
                style={style} 
                className="p-4 text-center border rounded"
              >
                Sample Cell Content
              </div>
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-2">CSS Output</h3>
              <div className="text-xs bg-muted p-3 rounded overflow-auto max-h-[300px] font-mono">
                <pre>{cssText}</pre>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Apply Style
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

// Border Editor Component
interface BorderEditorProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

const BorderEditor: React.FC<BorderEditorProps> = ({ label, value, onChange, compact }) => {
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
    }
  }, [value]);

  const updateBorder = (newWidth: string, newStyle: string, newColor: string) => {
    onChange(`${newWidth}px ${newStyle} ${newColor}`);
  };

  const borderStyles = [
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
    { value: 'double', label: 'Double' },
    { value: 'groove', label: 'Groove' },
    { value: 'ridge', label: 'Ridge' },
    { value: 'inset', label: 'Inset' },
    { value: 'outset', label: 'Outset' },
  ];

  const borderWidths = ['1', '2', '3', '4', '5', '6', '8', '10'];

  return (
    <div className={compact ? "grid grid-cols-[60px_60px_100px_1fr] items-center gap-2" : "space-y-2"}>
      <Label className="text-sm">{label}</Label>
      
      {/* Width */}
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

      {/* Style */}
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
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Color */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-8 w-20 px-2 text-sm"
            style={{ backgroundColor: color }}
          >
            <span className="text-white mix-blend-difference text-xs">
              {color}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
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
            className="mt-2 h-8 text-sm"
            placeholder="#cccccc"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};