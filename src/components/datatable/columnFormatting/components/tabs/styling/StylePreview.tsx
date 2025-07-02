import React from 'react';
import { Label } from '@/components/ui/label';

interface StylePreviewProps {
  activeSubTab: 'cell' | 'header';
  cellStyles: React.CSSProperties;
  headerStyles: React.CSSProperties;
}

export const StylePreview: React.FC<StylePreviewProps> = ({
  activeSubTab,
  cellStyles,
  headerStyles,
}) => {
  return (
    <div className="space-y-3">
      <Label className="ribbon-section-header">PREVIEW</Label>
      
      <div className="bg-muted/30 rounded-md p-4">
        {/* Cell Preview */}
        <div className="space-y-2">
          <Label className="text-[10px] text-muted-foreground uppercase">
            Cell Style {activeSubTab === 'cell' && '(Active)'}
          </Label>
          <div 
            className="bg-background border rounded px-3 py-2 text-xs"
            style={cellStyles}
          >
            Sample Cell Text
          </div>
        </div>

        {/* Header Preview */}
        <div className="space-y-2 mt-4">
          <Label className="text-[10px] text-muted-foreground uppercase">
            Header Style {activeSubTab === 'header' && '(Active)'}
          </Label>
          <div 
            className="bg-muted border rounded px-3 py-2 text-xs font-medium"
            style={headerStyles}
          >
            Column Header
          </div>
        </div>
      </div>

      {/* Active Indicator */}
      <div className="text-[10px] text-muted-foreground pt-2 mt-auto border-t">
        Editing: <span className="font-medium text-foreground">
          {activeSubTab === 'cell' ? 'Cell' : 'Header'}
        </span> styles
      </div>
    </div>
  );
};