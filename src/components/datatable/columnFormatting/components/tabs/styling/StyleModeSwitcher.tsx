import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { TableIcon, Type, RotateCcw } from 'lucide-react';

interface StyleModeSwitcherProps {
  activeSubTab: 'cell' | 'header';
  onSubTabChange: (value: 'cell' | 'header') => void;
  onReset: () => void;
}

export const StyleModeSwitcher: React.FC<StyleModeSwitcherProps> = ({
  activeSubTab,
  onSubTabChange,
  onReset,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <ToggleGroup 
        type="single" 
        value={activeSubTab} 
        onValueChange={(value) => value && onSubTabChange(value as 'cell' | 'header')}
        className="h-7"
      >
        <ToggleGroupItem value="cell" className="ribbon-toggle gap-1.5 text-xs">
          <TableIcon className="h-3 w-3" />
          Cell Style
        </ToggleGroupItem>
        <ToggleGroupItem value="header" className="ribbon-toggle gap-1.5 text-xs">
          <Type className="h-3 w-3" />
          Header Style
        </ToggleGroupItem>
      </ToggleGroup>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="h-7 px-2 text-xs gap-1.5"
      >
        <RotateCcw className="h-3 w-3" />
        Reset
      </Button>
    </div>
  );
};