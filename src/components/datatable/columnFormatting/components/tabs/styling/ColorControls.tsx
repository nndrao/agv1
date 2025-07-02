import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '../../common/ColorPicker';

interface ColorControlsProps {
  textColor: string;
  backgroundColor: string;
  applyTextColor: boolean;
  applyBackgroundColor: boolean;
  onTextColorChange: (value: string) => void;
  onBackgroundColorChange: (value: string) => void;
  onApplyTextColorChange: (value: boolean) => void;
  onApplyBackgroundColorChange: (value: boolean) => void;
  onUserSetColorToggle?: () => void;
  onUserSetBgColorToggle?: () => void;
}

export const ColorControls: React.FC<ColorControlsProps> = ({
  textColor,
  backgroundColor,
  applyTextColor,
  applyBackgroundColor,
  onTextColorChange,
  onBackgroundColorChange,
  onApplyTextColorChange,
  onApplyBackgroundColorChange,
  onUserSetColorToggle,
  onUserSetBgColorToggle,
}) => {
  return (
    <div className="space-y-3">
      <Label className="ribbon-section-header">COLORS</Label>
      
      {/* Text Color */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="ribbon-section-header flex-1 mb-0">TEXT COLOR</Label>
          <Switch 
            id="apply-text-color"
            checked={applyTextColor}
            onCheckedChange={(checked) => {
              onUserSetColorToggle?.();
              onApplyTextColorChange(checked);
            }}
            className="h-4 w-7 data-[state=checked]:bg-primary"
          />
        </div>
        <ColorPicker 
          value={textColor}
          onChange={onTextColorChange}
          disabled={!applyTextColor}
        />
      </div>

      {/* Background Color */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="ribbon-section-header flex-1 mb-0">BACKGROUND</Label>
          <Switch 
            id="apply-background-color"
            checked={applyBackgroundColor}
            onCheckedChange={(checked) => {
              onUserSetBgColorToggle?.();
              onApplyBackgroundColorChange(checked);
            }}
            className="h-4 w-7 data-[state=checked]:bg-primary"
          />
        </div>
        <ColorPicker 
          value={backgroundColor}
          onChange={onBackgroundColorChange}
          disabled={!applyBackgroundColor}
        />
      </div>
    </div>
  );
};