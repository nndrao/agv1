import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react';

interface TypographyControlsProps {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string[];
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: string) => void;
  onFontWeightChange: (value: string) => void;
  onFontStyleChange: (value: string) => void;
  onTextDecorationChange: (value: string[]) => void;
}

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

export const TypographyControls: React.FC<TypographyControlsProps> = ({
  fontFamily,
  fontSize,
  fontWeight,
  fontStyle,
  textDecoration,
  onFontFamilyChange,
  onFontSizeChange,
  onFontWeightChange,
  onFontStyleChange,
  onTextDecorationChange,
}) => {
  const toggleTextDecoration = (decoration: string) => {
    if (textDecoration.includes(decoration)) {
      onTextDecorationChange(textDecoration.filter(d => d !== decoration));
    } else {
      onTextDecorationChange([...textDecoration, decoration]);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="ribbon-section-header">TYPOGRAPHY</Label>
      
      <div className="grid grid-cols-3 gap-x-4 gap-y-2">
        {/* Font Family */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Font</Label>
          <Select value={fontFamily} onValueChange={onFontFamilyChange}>
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
              <SelectItem value="Verdana">Verdana</SelectItem>
              <SelectItem value="system-ui">System UI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Size</Label>
          <Select value={fontSize} onValueChange={onFontSizeChange}>
            <SelectTrigger className="h-6 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontSizeOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Weight */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Weight</Label>
          <Select value={fontWeight} onValueChange={onFontWeightChange}>
            <SelectTrigger className="h-6 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="300">Light</SelectItem>
              <SelectItem value="400">Regular</SelectItem>
              <SelectItem value="500">Medium</SelectItem>
              <SelectItem value="600">Semibold</SelectItem>
              <SelectItem value="700">Bold</SelectItem>
              <SelectItem value="900">Black</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Text Decoration */}
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Style</Label>
        <div className="flex gap-1">
          <button
            className={`ribbon-toggle ${fontWeight === '700' ? 'ribbon-toggle-active' : ''}`}
            onClick={() => onFontWeightChange(fontWeight === '700' ? '400' : '700')}
            title="Bold"
          >
            <Bold className="h-3 w-3" />
          </button>
          <button
            className={`ribbon-toggle ${fontStyle === 'italic' ? 'ribbon-toggle-active' : ''}`}
            onClick={() => onFontStyleChange(fontStyle === 'italic' ? 'normal' : 'italic')}
            title="Italic"
          >
            <Italic className="h-3 w-3" />
          </button>
          <button
            className={`ribbon-toggle ${textDecoration.includes('underline') ? 'ribbon-toggle-active' : ''}`}
            onClick={() => toggleTextDecoration('underline')}
            title="Underline"
          >
            <Underline className="h-3 w-3" />
          </button>
          <button
            className={`ribbon-toggle ${textDecoration.includes('line-through') ? 'ribbon-toggle-active' : ''}`}
            onClick={() => toggleTextDecoration('line-through')}
            title="Strikethrough"
          >
            <Strikethrough className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};