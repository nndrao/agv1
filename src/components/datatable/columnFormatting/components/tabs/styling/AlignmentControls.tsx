import React from 'react';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignVerticalSpaceAround,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd
} from 'lucide-react';

interface AlignmentControlsProps {
  textAlign: string;
  verticalAlign: string;
  activeSubTab: 'cell' | 'header';
  onTextAlignChange: (value: string) => void;
  onVerticalAlignChange: (value: string) => void;
}

export const AlignmentControls: React.FC<AlignmentControlsProps> = ({
  textAlign,
  verticalAlign,
  activeSubTab,
  onTextAlignChange,
  onVerticalAlignChange,
}) => {
  return (
    <div className="space-y-3">
      <Label className="ribbon-section-header">ALIGNMENT</Label>
      
      {/* Horizontal Alignment */}
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Horizontal</Label>
        <ToggleGroup 
          type="single" 
          value={textAlign} 
          onValueChange={(value) => value && onTextAlignChange(value)} 
          className="h-6 w-full"
        >
          <ToggleGroupItem value="left" className="alignment-toggle-item" title="Align Left">
            <AlignLeft className="h-3 w-3" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" className="alignment-toggle-item" title="Align Center">
            <AlignCenter className="h-3 w-3" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" className="alignment-toggle-item" title="Align Right">
            <AlignRight className="h-3 w-3" />
          </ToggleGroupItem>
          <ToggleGroupItem value="justify" className="alignment-toggle-item" title="Justify">
            <AlignJustify className="h-3 w-3" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Vertical Alignment */}
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Vertical</Label>
        <ToggleGroup 
          type="single" 
          value={verticalAlign} 
          onValueChange={(value) => value && onVerticalAlignChange(value)} 
          className="h-6 w-full"
        >
          <ToggleGroupItem value="top" className="alignment-toggle-item" title="Align Top">
            <AlignVerticalJustifyStart className="h-3 w-3" />
          </ToggleGroupItem>
          <ToggleGroupItem value="middle" className="alignment-toggle-item" title="Align Middle">
            <AlignVerticalJustifyCenter className="h-3 w-3" />
          </ToggleGroupItem>
          <ToggleGroupItem value="bottom" className="alignment-toggle-item" title="Align Bottom">
            <AlignVerticalJustifyEnd className="h-3 w-3" />
          </ToggleGroupItem>
          {activeSubTab === 'cell' && (
            <ToggleGroupItem value="stretch" className="alignment-toggle-item" title="Stretch">
              <AlignVerticalSpaceAround className="h-3 w-3" />
            </ToggleGroupItem>
          )}
        </ToggleGroup>
      </div>
    </div>
  );
};