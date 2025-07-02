import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pipette } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value = '',
  onChange,
  placeholder = '#000000',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const presetColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#C0C0C0',
    '#800000', '#008000', '#000080', '#808000', '#800080',
    '#008080', '#FFA500', '#A52A2A', '#DDA0DD', '#F0E68C',
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Input
          type="text"
          value={value}
          onChange={handleColorChange}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
        />
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded border border-gray-300"
          style={{ backgroundColor: value || '#FFFFFF' }}
        />
      </div>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
          >
            <Pipette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="space-y-3">
            <Input
              type="color"
              value={value || '#000000'}
              onChange={handleColorChange}
              className="w-full h-10"
            />
            
            <div className="grid grid-cols-5 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-10 h-10 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onChange(color);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};