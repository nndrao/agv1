import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { WrapText, Maximize2 } from 'lucide-react';
import { useColumnFormattingStore } from '../../store/columnFormatting.store';
import { useStylingState } from './styling/useStylingState';
import {
  TypographyControls,
  AlignmentControls,
  ColorControls,
  BorderControls,
  StylePreview,
  StyleModeSwitcher
} from './styling';

interface StylingCustomContentProps {
  selectedColumns: Set<string>;
}

export const StylingCustomContent: React.FC<StylingCustomContentProps> = ({ selectedColumns }) => {
  const { 
    updateBulkProperty,
    columnDefinitions,
    pendingChanges
  } = useColumnFormattingStore();

  const {
    activeSubTab,
    setActiveSubTab,
    currentStyles,
    // isHydrating,
    // isApplyingStyles,
    // userSetColorToggle,
    // userSetBgColorToggle,
    updateStyleProperty,
    // applyStyles,
    resetStyles,
    setUserSetColorToggle,
    setUserSetBgColorToggle,
  } = useStylingState({
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperty,
  });

  const cellStyles: React.CSSProperties = {
    fontFamily: currentStyles.fontFamily,
    fontSize: `${currentStyles.fontSize}px`,
    fontWeight: currentStyles.fontWeight,
    fontStyle: currentStyles.fontStyle,
    textDecoration: currentStyles.textDecoration.join(' '),
    textAlign: currentStyles.textAlign as any,
    verticalAlign: currentStyles.verticalAlign as any,
    color: activeSubTab === 'cell' && currentStyles.textColor && currentStyles.applyTextColor 
      ? currentStyles.textColor : 'inherit',
    backgroundColor: activeSubTab === 'cell' && currentStyles.backgroundColor && currentStyles.applyBackgroundColor 
      ? currentStyles.backgroundColor : 'transparent',
    border: currentStyles.applyBorder && currentStyles.borderSides !== 'none'
      ? `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}`
      : 'none',
    whiteSpace: currentStyles.wrapText ? 'normal' : 'nowrap',
    padding: '8px 12px',
  };

  const headerStyles: React.CSSProperties = {
    fontFamily: currentStyles.fontFamily,
    fontSize: `${currentStyles.fontSize}px`,
    fontWeight: currentStyles.fontWeight,
    fontStyle: currentStyles.fontStyle,
    textDecoration: currentStyles.textDecoration.join(' '),
    textAlign: currentStyles.textAlign as any,
    verticalAlign: currentStyles.verticalAlign as any,
    color: activeSubTab === 'header' && currentStyles.textColor && currentStyles.applyTextColor 
      ? currentStyles.textColor : 'inherit',
    backgroundColor: activeSubTab === 'header' && currentStyles.backgroundColor && currentStyles.applyBackgroundColor 
      ? currentStyles.backgroundColor : 'transparent',
    border: currentStyles.applyBorder && currentStyles.borderSides !== 'none'
      ? `${currentStyles.borderWidth}px ${currentStyles.borderStyle} ${currentStyles.borderColor}`
      : 'none',
    padding: '8px 12px',
  };

  if (selectedColumns.size === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Select one or more columns to customize styling
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <StyleModeSwitcher
        activeSubTab={activeSubTab}
        onSubTabChange={setActiveSubTab}
        onReset={resetStyles}
      />

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left Column - Typography & Alignment */}
        <div className="col-span-3 space-y-4 overflow-y-auto pr-2">
          <TypographyControls
            fontFamily={currentStyles.fontFamily}
            fontSize={currentStyles.fontSize}
            fontWeight={currentStyles.fontWeight}
            fontStyle={currentStyles.fontStyle}
            textDecoration={currentStyles.textDecoration}
            onFontFamilyChange={(value) => updateStyleProperty('fontFamily', value)}
            onFontSizeChange={(value) => updateStyleProperty('fontSize', value)}
            onFontWeightChange={(value) => updateStyleProperty('fontWeight', value)}
            onFontStyleChange={(value) => updateStyleProperty('fontStyle', value)}
            onTextDecorationChange={(value) => updateStyleProperty('textDecoration', value)}
          />

          <AlignmentControls
            textAlign={currentStyles.textAlign}
            verticalAlign={currentStyles.verticalAlign}
            activeSubTab={activeSubTab}
            onTextAlignChange={(value) => updateStyleProperty('textAlign', value)}
            onVerticalAlignChange={(value) => updateStyleProperty('verticalAlign', value)}
          />
        </div>

        {/* Middle Column - Colors & Borders */}
        <div className="col-span-3 space-y-4 overflow-y-auto px-2">
          <ColorControls
            textColor={currentStyles.textColor}
            backgroundColor={currentStyles.backgroundColor}
            applyTextColor={currentStyles.applyTextColor}
            applyBackgroundColor={currentStyles.applyBackgroundColor}
            onTextColorChange={(value) => updateStyleProperty('textColor', value)}
            onBackgroundColorChange={(value) => updateStyleProperty('backgroundColor', value)}
            onApplyTextColorChange={(value) => updateStyleProperty('applyTextColor', value)}
            onApplyBackgroundColorChange={(value) => updateStyleProperty('applyBackgroundColor', value)}
            onUserSetColorToggle={() => setUserSetColorToggle(true)}
            onUserSetBgColorToggle={() => setUserSetBgColorToggle(true)}
          />

          <BorderControls
            borderWidth={currentStyles.borderWidth}
            borderStyle={currentStyles.borderStyle}
            borderColor={currentStyles.borderColor}
            borderSides={currentStyles.borderSides}
            applyBorder={currentStyles.applyBorder}
            onBorderWidthChange={(value) => updateStyleProperty('borderWidth', value)}
            onBorderStyleChange={(value) => updateStyleProperty('borderStyle', value)}
            onBorderColorChange={(value) => updateStyleProperty('borderColor', value)}
            onBorderSidesChange={(value) => updateStyleProperty('borderSides', value)}
            onApplyBorderChange={(value) => updateStyleProperty('applyBorder', value)}
          />
        </div>

        {/* Right Column - Options & Preview */}
        <div className="col-span-6 space-y-4 overflow-y-auto pl-2">
          {/* Additional Options */}
          <div className="space-y-3">
            <Label className="ribbon-section-header">OPTIONS</Label>
            
            {activeSubTab === 'cell' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WrapText className="h-3.5 w-3.5 text-muted-foreground" />
                    <Label className="text-xs">Wrap Text</Label>
                  </div>
                  <Switch
                    checked={currentStyles.wrapText}
                    onCheckedChange={(checked) => updateStyleProperty('wrapText', checked)}
                    className="h-4 w-7"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <Label className="text-xs">Auto Height</Label>
                  </div>
                  <Switch
                    checked={currentStyles.autoHeight}
                    onCheckedChange={(checked) => updateStyleProperty('autoHeight', checked)}
                    className="h-4 w-7"
                  />
                </div>
              </>
            )}
          </div>

          <StylePreview
            activeSubTab={activeSubTab}
            cellStyles={cellStyles}
            headerStyles={headerStyles}
          />
        </div>
      </div>
    </div>
  );
};