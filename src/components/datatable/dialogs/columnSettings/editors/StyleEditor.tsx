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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  Type, 
  Palette, 
  Bold,
  Italic,
  Underline,
  Square,
  Eye,
  X,
  RotateCcw,
  Paintbrush
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
  const [activeTab, setActiveTab] = useState('all');
  const [showIndividualBorders, setShowIndividualBorders] = useState(false);

  useEffect(() => {
    setStyle(initialStyle);
    // Check if we have individual borders set
    if (initialStyle.borderTop || initialStyle.borderRight || initialStyle.borderBottom || initialStyle.borderLeft) {
      setShowIndividualBorders(true);
    }
  }, [initialStyle]);

  const updateStyle = (property: keyof React.CSSProperties, value: string | number | undefined) => {
    const newStyle = { ...style };
    if (value === undefined || value === '') {
      delete newStyle[property];
    } else {
      newStyle[property] = value as never;
    }
    setStyle(newStyle);
  };

  const handleSave = () => {
    onSave(style);
    onOpenChange(false);
  };

  const resetStyles = () => {
    setStyle({});
  };

  const hasStyles = Object.keys(style).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] h-[350px] p-0 flex flex-col">
        {/* Compact Header */}
        <DialogHeader className="px-4 py-2 border-b shrink-0 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paintbrush className="h-4 w-4 text-primary" />
              <DialogTitle className="text-sm font-medium">{title}</DialogTitle>
              <DialogDescription className="sr-only">
                Style editor for {isHeaderStyle ? 'header' : 'cell'} appearance
              </DialogDescription>
              {hasStyles && (
                <Badge variant="secondary" className="text-xs ml-2">
                  {Object.keys(style).length} styles
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetStyles}
              disabled={!hasStyles}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </DialogHeader>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-0 min-h-0 overflow-hidden">
          {/* Left Panel - Style Controls */}
          <div className="flex-1 flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-3 h-8 p-1 grid grid-cols-4 w-fit">
                <TabsTrigger value="all" className="text-xs px-3 h-6">All</TabsTrigger>
                <TabsTrigger value="text" className="text-xs px-3 h-6">Text</TabsTrigger>
                <TabsTrigger value="colors" className="text-xs px-3 h-6">Colors</TabsTrigger>
                <TabsTrigger value="borders" className="text-xs px-3 h-6">Borders</TabsTrigger>
              </TabsList>

              {/* All Tab - Compact Grid Layout */}
              <TabsContent value="all" className="flex-1 px-4 pb-3 pt-3 overflow-y-auto">
                <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                  {/* Column 1 - Typography */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Type className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="text-xs font-medium uppercase text-muted-foreground">Typography</h3>
                    </div>
                    
                    {/* Font Size & Weight in one row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Size</Label>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={parseInt(style.fontSize as string) || ''}
                            onChange={(e) => updateStyle('fontSize', e.target.value ? `${e.target.value}px` : undefined)}
                            className="h-7 text-xs"
                            placeholder="14"
                            min={8}
                            max={72}
                          />
                          <span className="text-xs text-muted-foreground">px</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Weight</Label>
                        <Select
                          value={style.fontWeight as string || 'default'}
                          onValueChange={(value) => updateStyle('fontWeight', value === 'default' ? undefined : value)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Normal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Normal</SelectItem>
                            <SelectItem value="500">Medium</SelectItem>
                            <SelectItem value="600">Semibold</SelectItem>
                            <SelectItem value="700">Bold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Style Buttons */}
                    <div className="flex gap-1">
                      <Button
                        variant={style.fontWeight === 'bold' || style.fontWeight === '700' ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 flex-1"
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
                        className="h-7 flex-1"
                        onClick={() => updateStyle('fontStyle', style.fontStyle === 'italic' ? undefined : 'italic')}
                      >
                        <Italic className="h-3 w-3" />
                      </Button>
                      <Button
                        variant={style.textDecoration === 'underline' ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 flex-1"
                        onClick={() => updateStyle('textDecoration', style.textDecoration === 'underline' ? undefined : 'underline')}
                      >
                        <Underline className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Column 2 - Colors */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="text-xs font-medium uppercase text-muted-foreground">Colors</h3>
                    </div>
                    
                    <CompactColorControl
                      label="Text"
                      value={style.color as string}
                      onChange={(color) => updateStyle('color', color)}
                      defaultColor="#000000"
                    />
                    
                    <CompactColorControl
                      label="Background"
                      value={style.backgroundColor as string}
                      onChange={(color) => updateStyle('backgroundColor', color)}
                      defaultColor="#ffffff"
                    />
                  </div>

                  {/* Column 3 - Spacing & Borders */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Square className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="text-xs font-medium uppercase text-muted-foreground">Layout</h3>
                    </div>
                    
                    {/* Padding */}
                    <div>
                      <Label className="text-xs">Padding</Label>
                      <Input
                        value={style.padding as string || ''}
                        onChange={(e) => updateStyle('padding', e.target.value || undefined)}
                        className="h-7 text-xs"
                        placeholder="8px"
                      />
                    </div>

                    {/* Simple Border */}
                    <div>
                      <Label className="text-xs">Border</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          value={style.border as string || ''}
                          onChange={(e) => updateStyle('border', e.target.value || undefined)}
                          className="h-7 text-xs flex-1"
                          placeholder="1px solid #ccc"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            setActiveTab('borders');
                            setShowIndividualBorders(true);
                          }}
                          title="Advanced border settings"
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Border Radius */}
                    <div>
                      <Label className="text-xs">Radius</Label>
                      <Input
                        value={style.borderRadius as string || ''}
                        onChange={(e) => updateStyle('borderRadius', e.target.value || undefined)}
                        className="h-7 text-xs"
                        placeholder="4px"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Text Tab */}
              <TabsContent value="text" className="flex-1 px-4 pb-3 pt-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Font Family</Label>
                      <Select
                        value={style.fontFamily as string || 'default'}
                        onValueChange={(value) => updateStyle('fontFamily', value === 'default' ? undefined : value)}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Default" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="system-ui, -apple-system, sans-serif">System UI</SelectItem>
                          <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                          <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                          <SelectItem value="'Courier New', monospace">Monospace</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Size</Label>
                        <Input
                          type="number"
                          value={parseInt(style.fontSize as string) || ''}
                          onChange={(e) => updateStyle('fontSize', e.target.value ? `${e.target.value}px` : undefined)}
                          className="h-7 text-xs"
                          placeholder="14"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Line Height</Label>
                        <Input
                          value={style.lineHeight as string || ''}
                          onChange={(e) => updateStyle('lineHeight', e.target.value || undefined)}
                          className="h-7 text-xs"
                          placeholder="1.5"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Text Align</Label>
                      <Select
                        value={style.textAlign as string || 'default'}
                        onValueChange={(value) => updateStyle('textAlign', value === 'default' ? undefined : value)}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Default" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Text Transform</Label>
                      <Select
                        value={style.textTransform as string || 'default'}
                        onValueChange={(value) => updateStyle('textTransform', value === 'default' ? undefined : value)}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">None</SelectItem>
                          <SelectItem value="uppercase">Uppercase</SelectItem>
                          <SelectItem value="lowercase">Lowercase</SelectItem>
                          <SelectItem value="capitalize">Capitalize</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Colors Tab */}
              <TabsContent value="colors" className="flex-1 px-4 pb-3 pt-3">
                <div className="grid grid-cols-2 gap-4">
                  <CompactColorControl
                    label="Text Color"
                    value={style.color as string}
                    onChange={(color) => updateStyle('color', color)}
                    defaultColor="#000000"
                  />
                  <CompactColorControl
                    label="Background Color"
                    value={style.backgroundColor as string}
                    onChange={(color) => updateStyle('backgroundColor', color)}
                    defaultColor="#ffffff"
                  />
                </div>
              </TabsContent>

              {/* Borders Tab */}
              <TabsContent value="borders" className="flex-1 px-4 pb-3 pt-3 overflow-y-auto">
                <div className="space-y-4">
                  {/* Border Mode Toggle */}
                  <div className="flex items-center gap-4">
                    <Label className="text-xs">Border Mode:</Label>
                    <div className="flex gap-1">
                      <Button
                        variant={!showIndividualBorders ? 'default' : 'outline'}
                        size="sm"
                        className="h-6 px-3 text-xs"
                        onClick={() => setShowIndividualBorders(false)}
                      >
                        All Sides
                      </Button>
                      <Button
                        variant={showIndividualBorders ? 'default' : 'outline'}
                        size="sm"
                        className="h-6 px-3 text-xs"
                        onClick={() => setShowIndividualBorders(true)}
                      >
                        Individual
                      </Button>
                    </div>
                  </div>

                  {/* Border Controls */}
                  {!showIndividualBorders ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">All Borders</Label>
                        <Input
                          value={style.border as string || ''}
                          onChange={(e) => updateStyle('border', e.target.value || undefined)}
                          className="h-7 text-xs"
                          placeholder="1px solid #ccc"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Border Radius</Label>
                        <Input
                          value={style.borderRadius as string || ''}
                          onChange={(e) => updateStyle('borderRadius', e.target.value || undefined)}
                          className="h-7 text-xs"
                          placeholder="4px"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <CompactBorderControl
                          label="Top"
                          value={style.borderTop as string}
                          onChange={(value) => updateStyle('borderTop', value)}
                        />
                        <CompactBorderControl
                          label="Right"
                          value={style.borderRight as string}
                          onChange={(value) => updateStyle('borderRight', value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <CompactBorderControl
                          label="Bottom"
                          value={style.borderBottom as string}
                          onChange={(value) => updateStyle('borderBottom', value)}
                        />
                        <CompactBorderControl
                          label="Left"
                          value={style.borderLeft as string}
                          onChange={(value) => updateStyle('borderLeft', value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Border Radius</Label>
                        <Input
                          value={style.borderRadius as string || ''}
                          onChange={(e) => updateStyle('borderRadius', e.target.value || undefined)}
                          className="h-7 text-xs"
                          placeholder="4px"
                        />
                      </div>
                    </div>
                  )}

                  {/* Spacing */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <Label className="text-xs">Padding</Label>
                      <Input
                        value={style.padding as string || ''}
                        onChange={(e) => updateStyle('padding', e.target.value || undefined)}
                        className="h-7 text-xs"
                        placeholder="8px"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Margin</Label>
                      <Input
                        value={style.margin as string || ''}
                        onChange={(e) => updateStyle('margin', e.target.value || undefined)}
                        className="h-7 text-xs"
                        placeholder="0px"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="w-[200px] border-l bg-muted/10 flex flex-col">
            <div className="px-3 py-2 border-b">
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-medium">Live Preview</h3>
              </div>
            </div>
            
            <div className="flex-1 p-3 flex items-center justify-center">
              <div className="w-full">
                <div 
                  style={style} 
                  className="min-h-[60px] flex items-center justify-center border rounded text-sm"
                >
                  {isHeaderStyle ? 'Column Header' : 'Sample Cell'}
                </div>
              </div>
            </div>

            {/* CSS Output - Compact */}
            <div className="p-3 border-t">
              <h4 className="text-xs font-medium mb-1 text-muted-foreground">CSS</h4>
              <div className="text-xs bg-muted/50 p-2 rounded border max-h-[80px] overflow-auto font-mono">
                {Object.entries(style).map(([key, value]) => {
                  const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                  return (
                    <div key={key} className="truncate">
                      {cssKey}: {value};
                    </div>
                  );
                })}
                {Object.keys(style).length === 0 && <span className="text-muted-foreground">/* No styles */</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-4 py-2 border-t shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-7">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="h-7">
            Apply Style
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Compact Color Control Component
interface CompactColorControlProps {
  label: string;
  value?: string;
  onChange: (color: string | undefined) => void;
  defaultColor: string;
}

const CompactColorControl: React.FC<CompactColorControlProps> = ({ label, value, onChange, defaultColor }) => {
  const currentColor = value || defaultColor;

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-7 w-7 p-0.5 shrink-0"
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
              className="mt-2 h-7 text-xs font-mono"
              placeholder="#000000"
            />
          </PopoverContent>
        </Popover>
        
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="h-7 text-xs font-mono"
          placeholder={defaultColor}
        />
        
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 shrink-0"
            onClick={() => onChange(undefined)}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Compact Border Control Component for individual sides
interface CompactBorderControlProps {
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
}

const CompactBorderControl: React.FC<CompactBorderControlProps> = ({ label, value, onChange }) => {
  const [width, setWidth] = useState('1');
  const [style, setStyle] = useState('solid');
  const [color, setColor] = useState('#cccccc');

  // Parse the border value
  React.useEffect(() => {
    if (value) {
      const parts = value.split(' ');
      if (parts.length >= 3) {
        setWidth(parts[0].replace('px', ''));
        setStyle(parts[1]);
        setColor(parts[2]);
      }
    }
  }, [value]);

  const updateBorder = (newWidth: string, newStyle: string, newColor: string) => {
    if (newWidth === '0' || !newWidth) {
      onChange(undefined);
    } else {
      onChange(`${newWidth}px ${newStyle} ${newColor}`);
    }
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label} Border</Label>
      <div className="flex gap-1">
        {/* Width */}
        <Select
          value={width}
          onValueChange={(val) => {
            setWidth(val);
            updateBorder(val, style, color);
          }}
        >
          <SelectTrigger className="h-7 w-14 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0</SelectItem>
            <SelectItem value="1">1px</SelectItem>
            <SelectItem value="2">2px</SelectItem>
            <SelectItem value="3">3px</SelectItem>
            <SelectItem value="4">4px</SelectItem>
          </SelectContent>
        </Select>

        {/* Style */}
        <Select
          value={style}
          onValueChange={(val) => {
            setStyle(val);
            updateBorder(width, val, color);
          }}
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

        {/* Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-7 w-7 p-0.5 shrink-0"
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
              className="mt-2 h-7 text-xs font-mono"
              placeholder="#cccccc"
            />
          </PopoverContent>
        </Popover>

        {/* Clear button */}
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 shrink-0"
            onClick={() => onChange(undefined)}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};