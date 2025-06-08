import React from 'react';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronRight,
  ListFilter,
  Columns,
  Edit3
} from 'lucide-react';
import { useColumnCustomizationStore } from '../../dialogs/columnSettings/store/columnCustomization.store';
import type { RibbonPreviewProps } from '../types';

export const RibbonPreview: React.FC<RibbonPreviewProps> = ({
  activeTab,
  selectedColumns,
  currentFormat
}) => {
  const { columnDefinitions, pendingChanges } = useColumnCustomizationStore();

  // Helper function to get mixed values for multi-column editing
  const getMixedValue = (property: string) => {
    const values = new Set();

    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const pendingChange = pendingChanges.get(colId);

      // Check pending changes first, then fall back to column definition
      let value;
      if (pendingChange && property in pendingChange) {
        value = pendingChange[property as keyof typeof pendingChange];
      } else if (colDef) {
        value = colDef[property as keyof typeof colDef];
      }

      values.add(value);
    });

    if (values.size === 0) return { value: undefined, isMixed: false };
    if (values.size === 1) return { value: Array.from(values)[0], isMixed: false };
    return { value: undefined, isMixed: true };
  };

  const getCurrentAlignment = () => {
    const cellClassValue = getMixedValue('cellClass');
    const cellClass = (typeof cellClassValue.value === 'string' ? cellClassValue.value : '').trim();
    
    if (cellClass.includes('text-center') || cellClass.includes('justify-center')) return 'center';
    if (cellClass.includes('text-right') || cellClass.includes('justify-end')) return 'right';
    return 'left';
  };

  const getCurrentStyles = () => {
    const cellStyleValue = getMixedValue('cellStyle');
    const styles: string[] = [];
    
    if (cellStyleValue.value && typeof cellStyleValue.value === 'object') {
      const styleObj = cellStyleValue.value as React.CSSProperties;
      if (styleObj.fontWeight === 'bold' || styleObj.fontWeight === '700') styles.push('bold');
      if (styleObj.fontStyle === 'italic') styles.push('italic');
      if (styleObj.textDecoration === 'underline') styles.push('underline');
    }
    
    return styles;
  };

  const renderPreviewContent = () => {
    switch (activeTab) {
      case 'format':
        return (
          <div className="flex items-center gap-2 h-full">
            <span className="font-mono text-xs text-muted-foreground">1234.5</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <span className="font-mono text-xs font-medium">$1,234.50</span>
          </div>
        );
        
      case 'styling':
        const alignment = getCurrentAlignment();
        const styles = getCurrentStyles();
        
        return (
          <div className="w-full h-full flex items-center">
            <div 
              className={`w-full ${
                alignment === 'center' ? 'text-center' :
                alignment === 'right' ? 'text-right' :
                'text-left'
              }`}
            >
              <span 
                className={`text-xs ${
                  styles.includes('bold') ? 'font-bold' : ''
                } ${
                  styles.includes('italic') ? 'italic' : ''
                } ${
                  styles.includes('underline') ? 'underline' : ''
                }`}
              >
                Sample Text
              </span>
            </div>
          </div>
        );
        
      case 'filter':
        return (
          <div className="flex items-center gap-2 h-full">
            <ListFilter className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs">Active Filter</span>
          </div>
        );
        
      case 'general':
        return (
          <div className="flex items-center gap-2 h-full">
            <Columns className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium">
              {selectedColumns.size > 0 ? Array.from(selectedColumns)[0] : 'No Column'}
            </span>
          </div>
        );
        
      case 'editor':
        return (
          <div className="flex items-center gap-2 h-full">
            <Edit3 className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs">Text Input</span>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 min-w-[320px]">
      <Separator orientation="vertical" className="h-6" />
      <span className="text-xs text-muted-foreground/70">Preview</span>
      <div className="flex-1 h-7 bg-gradient-to-r from-background to-muted/20 rounded-sm px-2">
        {renderPreviewContent()}
      </div>
    </div>
  );
}; 