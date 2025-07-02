import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '../../common/ColorPicker';

interface BorderControlsProps {
  borderWidth: string;
  borderStyle: string;
  borderColor: string;
  borderSides: string;
  applyBorder: boolean;
  onBorderWidthChange: (value: string) => void;
  onBorderStyleChange: (value: string) => void;
  onBorderColorChange: (value: string) => void;
  onBorderSidesChange: (value: string) => void;
  onApplyBorderChange: (value: boolean) => void;
}

const borderSideOptions = [
  { value: 'all', label: 'All Sides' },
  { value: 'top', label: 'Top' },
  { value: 'right', label: 'Right' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'none', label: 'None' },
];

export const BorderControls: React.FC<BorderControlsProps> = ({
  borderWidth,
  borderStyle,
  borderColor,
  borderSides,
  applyBorder,
  onBorderWidthChange,
  onBorderStyleChange,
  onBorderColorChange,
  onBorderSidesChange,
  onApplyBorderChange,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="ribbon-section-header flex-1 mb-0">BORDERS</Label>
        <Switch 
          id="apply-border"
          checked={applyBorder}
          onCheckedChange={onApplyBorderChange}
          className="h-4 w-7 data-[state=checked]:bg-primary"
        />
      </div>

      {applyBorder && (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {/* Border Side */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Side</Label>
              <Select value={borderSides} onValueChange={onBorderSidesChange}>
                <SelectTrigger className="h-6 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {borderSideOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Border Width */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Width</Label>
              <Input
                type="number"
                value={borderWidth}
                onChange={(e) => onBorderWidthChange(e.target.value)}
                min="0"
                max="10"
                step="1"
                className="h-6 text-xs"
                disabled={borderSides === 'none'}
              />
            </div>
          </div>

          {/* Border Style */}
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Style</Label>
            <Select 
              value={borderStyle} 
              onValueChange={onBorderStyleChange}
              disabled={borderSides === 'none'}
            >
              <SelectTrigger className="h-6 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
                <SelectItem value="double">Double</SelectItem>
                <SelectItem value="groove">Groove</SelectItem>
                <SelectItem value="ridge">Ridge</SelectItem>
                <SelectItem value="inset">Inset</SelectItem>
                <SelectItem value="outset">Outset</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Border Color */}
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Color</Label>
            <ColorPicker 
              value={borderColor}
              onChange={onBorderColorChange}
              disabled={borderSides === 'none'}
            />
          </div>
        </>
      )}
    </div>
  );
};