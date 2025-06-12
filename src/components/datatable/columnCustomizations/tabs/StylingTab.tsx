import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThreeStateCheckbox } from '../components/ThreeStateCheckbox';
import { AlignmentIconPicker } from '../components/AlignmentIconPicker';
import { Button } from '@/components/ui/button';
import { Palette, Eraser } from 'lucide-react';
import { StyleEditor } from '../editors/StyleEditor';
import { useColumnCustomizationStore } from '../store/columnCustomization.store';
import { createCellStyleFunction } from '@/components/datatable/utils/formatters';

interface StylingTabProps {
  uiMode?: 'simple' | 'advanced';
}

export const StylingTab: React.FC<StylingTabProps> = ({ uiMode: _uiMode = 'simple' }) => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperty
  } = useColumnCustomizationStore();

  const [showCellStyleEditor, setShowCellStyleEditor] = useState(false);
  const [showHeaderStyleEditor, setShowHeaderStyleEditor] = useState(false);

  const getMixedValue = (property: string) => {
    const values = new Set();
    const allValues: unknown[] = [];

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
      allValues.push(value);
    });

    if (values.size === 0) return { value: undefined, isMixed: false };
    if (values.size === 1) return { value: Array.from(values)[0], isMixed: false };
    return { value: undefined, isMixed: true, values: allValues };
  };

  const isDisabled = selectedColumns.size === 0;
  const isMultipleSelection = selectedColumns.size > 1;

  const handleCellStyleSave = (style: React.CSSProperties) => {
    // Check if we have conditional formatting that needs to be preserved
    let hasConditionalFormatting = false;
    let formatString = '';
    
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const pendingChange = pendingChanges.get(colId);
      
      // Check pending changes first, then column definition
      const valueFormatter = pendingChange?.valueFormatter || colDef?.valueFormatter;
      const cellStyle = pendingChange?.cellStyle || colDef?.cellStyle;
      
      // First check if valueFormatter has format string metadata
      if (valueFormatter && typeof valueFormatter === 'function') {
        const metadata = (valueFormatter as any).__formatString;
        if (metadata && metadata.includes('[') && metadata.includes(']')) {
          // Check if format string contains style directives OR color specifications
          const hasStyleDirectives = metadata.match(/\[(BG:|Background:|Border:|B:|Size:|FontSize:|Align:|TextAlign:|Padding:|P:|Weight:|FontWeight:|Bold|Italic|Underline|Center|Left|Right|#[0-9A-Fa-f]{3,6}|Red|Green|Blue|Yellow|Orange|Purple|Gray|Grey|Black|White|Magenta|Cyan)/i);
          if (hasStyleDirectives) {
            hasConditionalFormatting = true;
            formatString = metadata;
          }
        }
      }
      
      // Also check if existing cellStyle has format string metadata
      if (!hasConditionalFormatting && cellStyle && typeof cellStyle === 'function') {
        const metadata = (cellStyle as any).__formatString;
        if (metadata && metadata.includes('[') && metadata.includes(']')) {
          hasConditionalFormatting = true;
          formatString = metadata;
        }
      }
    });
    
    if (hasConditionalFormatting) {
      // We have conditional formatting from valueFormatter
      // Create a cellStyle function that merges base styles with conditional styles
      // Conditional styles take precedence (similar to the reference implementation)
      // Create a custom cellStyle function that always merges base and conditional styles
      // This is different from createCellStyleFunction which returns EITHER conditional OR base styles
      const cellStyleFn = (params: { value: unknown }) => {
        // Always start with base styles
        const baseStyles = style && Object.keys(style).length > 0 ? { ...style } : {};
        
        // Get conditional styles using createCellStyleFunction with empty base
        // This ensures we only get the conditional styles when conditions match
        const conditionalStyleFn = createCellStyleFunction(formatString, {});
        const conditionalStyles = conditionalStyleFn(params) || {};
        
        // Always merge base and conditional styles, with conditional taking precedence
        // This matches the reference implementation pattern
        const mergedStyles = { ...baseStyles, ...conditionalStyles };
        
        // Return merged styles if we have any, otherwise undefined
        return Object.keys(mergedStyles).length > 0 ? mergedStyles : undefined;
      };
      
      // Attach metadata for future serialization
      Object.defineProperty(cellStyleFn, '__formatString', { 
        value: formatString, 
        writable: false,
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(cellStyleFn, '__baseStyle', { 
        value: style, 
        writable: false,
        enumerable: false,
        configurable: true
      });
      updateBulkProperty('cellStyle', cellStyleFn);
    } else {
      // No conditional formatting, just save the style directly
      updateBulkProperty('cellStyle', style);
    }
  };

  const handleHeaderStyleSave = (style: React.CSSProperties) => {
    console.log('[StylingTab] Saving headerStyle:', {
      style,
      selectedColumnsCount: selectedColumns.size,
      selectedColumns: Array.from(selectedColumns)
    });
    
    // Create a function that applies styles only to regular headers, not floating filters
    const headerStyleFn = (params: { floatingFilter?: boolean }) => {
      // Don't apply styles to floating filter row
      if (params?.floatingFilter) {
        return null;
      }
      return style;
    };
    
    updateBulkProperty('headerStyle', headerStyleFn);
  };


  // Clear only cell styles
  const clearCellStyles = () => {
    // Check if we have conditional formatting from valueFormatter that needs to be preserved
    let hasConditionalFormatting = false;
    let formatString = '';
    
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const pendingChange = pendingChanges.get(colId);
      
      // Check pending changes first, then column definition
      const valueFormatter = pendingChange?.valueFormatter || colDef?.valueFormatter;
      
      // Check if valueFormatter has format string metadata (from conditional formatting)
      if (valueFormatter && typeof valueFormatter === 'function') {
        const metadata = (valueFormatter as any).__formatString;
        if (metadata && metadata.includes('[') && metadata.includes(']')) {
          // Check if format string contains style directives OR color specifications
          const hasStyleDirectives = metadata.match(/\[(BG:|Background:|Border:|B:|Size:|FontSize:|Align:|TextAlign:|Padding:|P:|Weight:|FontWeight:|Bold|Italic|Underline|Center|Left|Right|#[0-9A-Fa-f]{3,6}|Red|Green|Blue|Yellow|Orange|Purple|Gray|Grey|Black|White|Magenta|Cyan)/i);
          if (hasStyleDirectives) {
            hasConditionalFormatting = true;
            formatString = metadata;
          }
        }
      }
    });
    
    if (hasConditionalFormatting) {
      // Keep conditional formatting but clear base styles
      // This is the same as handleCellStyleSave but with empty base styles
      const cellStyleFn = (params: { value: unknown }) => {
        // No base styles (cleared)
        
        // Get conditional styles using createCellStyleFunction with empty base
        const conditionalStyleFn = createCellStyleFunction(formatString, {});
        const conditionalStyles = conditionalStyleFn(params) || {};
        
        // Return only conditional styles since base styles are cleared
        return Object.keys(conditionalStyles).length > 0 ? conditionalStyles : undefined;
      };
      
      // Attach metadata for future serialization
      Object.defineProperty(cellStyleFn, '__formatString', { 
        value: formatString, 
        writable: false,
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(cellStyleFn, '__baseStyle', { 
        value: {}, 
        writable: false,
        enumerable: false,
        configurable: true
      });
      updateBulkProperty('cellStyle', cellStyleFn);
    } else {
      updateBulkProperty('cellStyle', undefined);
    }
    
    // Clear non-format related classes
    const currentCellClass = getMixedValue('cellClass');
    if (currentCellClass.value) {
      const classes = (currentCellClass.value as string).split(' ').filter(c => 
        c.startsWith('ag-numeric-cell') || c.startsWith('ag-currency-cell') || 
        c.startsWith('ag-percentage-cell') || c.startsWith('ag-date-cell')
      );
      updateBulkProperty('cellClass', classes.length > 0 ? classes.join(' ') : undefined);
    }
  };

  // Clear only header styles
  const clearHeaderStyles = () => {
    updateBulkProperty('headerStyle', undefined);
    updateBulkProperty('headerClass', undefined);
  };

  // Get current cell style (if consistent across selected columns)
  const currentCellStyle = getMixedValue('cellStyle');
  const currentHeaderStyle = getMixedValue('headerStyle');
  
  // Extract style object from headerStyle if it's a function
  const getHeaderStyleObject = () => {
    if (currentHeaderStyle.value && typeof currentHeaderStyle.value === 'function') {
      // Call the function with non-floating filter context to get the style object
      return currentHeaderStyle.value({ floatingFilter: false });
    }
    return currentHeaderStyle.value;
  };

  // Extract style object from cellStyle if it's a function
  const getCellStyleObject = () => {
    if (currentCellStyle.value && typeof currentCellStyle.value === 'function') {
      // Check if this function has base style metadata
      const baseStyle = (currentCellStyle.value as any).__baseStyle;
      if (baseStyle) {
        return baseStyle;
      }
      // Don't pass function-based styles to the editor without base style
      return {};
    }
    return currentCellStyle.value;
  };

  // Handle header alignment changes using headerClass (separate from headerStyle)
  const handleHeaderAlignmentChange = (alignment: string, type: 'horizontal' | 'vertical') => {
    const currentHeaderClass = getMixedValue('headerClass');
    // Ensure we always work with strings, not booleans
    const currentClassesRaw = currentHeaderClass.value;
    const currentClasses = (typeof currentClassesRaw === 'string' ? currentClassesRaw : '').trim();
    const classArray = currentClasses ? currentClasses.split(' ').filter(c => c) : [];

    // Remove existing alignment classes (both custom and Tailwind)
    const filteredClasses = classArray.filter(c => {
      if (type === 'horizontal') {
        return !c.startsWith('header-align-') && 
               c !== 'text-left' && c !== 'text-center' && c !== 'text-right' &&
               c !== 'justify-start' && c !== 'justify-center' && c !== 'justify-end';
      } else {
        return !c.startsWith('header-valign-') &&
               c !== 'items-start' && c !== 'items-center' && c !== 'items-end';
      }
    });

    // Add new Tailwind alignment classes if not default
    if (alignment !== 'default') {
      if (type === 'horizontal') {
        // For headers, we need both text alignment and flex justification
        const alignmentMap: Record<string, string[]> = {
          'left': ['text-left', 'justify-start'],
          'center': ['text-center', 'justify-center'],
          'right': ['text-right', 'justify-end']
        };
        if (alignmentMap[alignment]) {
          filteredClasses.push(...alignmentMap[alignment]);
        }
      } else {
        // Vertical alignment
        const alignmentMap: Record<string, string> = {
          'top': 'items-start',
          'middle': 'items-center',
          'bottom': 'items-end'
        };
        if (alignmentMap[alignment]) {
          filteredClasses.push(alignmentMap[alignment]);
        }
      }
    }

    const newHeaderClass = filteredClasses.join(' ').trim();
    updateBulkProperty('headerClass', newHeaderClass || undefined);
  };

  // Handle cell alignment changes using cellClass
  const handleCellAlignmentChange = (alignment: string, type: 'horizontal' | 'vertical') => {
    const currentCellClass = getMixedValue('cellClass');
    // Ensure we always work with strings, not booleans
    const currentClassesRaw = currentCellClass.value;
    const currentClasses = (typeof currentClassesRaw === 'string' ? currentClassesRaw : '').trim();
    const classArray = currentClasses ? currentClasses.split(' ').filter(c => c) : [];

    // Remove existing alignment classes (both custom and Tailwind)
    const filteredClasses = classArray.filter(c => {
      if (type === 'horizontal') {
        return !c.startsWith('cell-align-') && 
               c !== 'text-left' && c !== 'text-center' && c !== 'text-right' &&
               c !== 'justify-start' && c !== 'justify-center' && c !== 'justify-end';
      } else {
        return !c.startsWith('cell-valign-') &&
               c !== 'items-start' && c !== 'items-center' && c !== 'items-end';
      }
    });

    // Add new Tailwind alignment classes if not default
    if (alignment !== 'default') {
      if (type === 'horizontal') {
        // For cells, we need both text alignment and flex justification
        const alignmentMap: Record<string, string[]> = {
          'left': ['text-left', 'justify-start'],
          'center': ['text-center', 'justify-center'],
          'right': ['text-right', 'justify-end']
        };
        if (alignmentMap[alignment]) {
          filteredClasses.push(...alignmentMap[alignment]);
        }
      } else {
        // Vertical alignment
        const alignmentMap: Record<string, string> = {
          'top': 'items-start',
          'middle': 'items-center',
          'bottom': 'items-end'
        };
        if (alignmentMap[alignment]) {
          filteredClasses.push(alignmentMap[alignment]);
        }
      }
    }

    const newCellClass = filteredClasses.join(' ').trim();
    updateBulkProperty('cellClass', newCellClass || undefined);
  };

  // Extract current header alignment from headerClass
  const getCurrentHeaderAlignment = (type: 'horizontal' | 'vertical') => {
    const headerClassValue = getMixedValue('headerClass');
    const headerClassRaw = headerClassValue.value;
    const headerClass = (typeof headerClassRaw === 'string' ? headerClassRaw : '').trim();

    if (!headerClass) return 'default';

    if (type === 'horizontal') {
      // Check for Tailwind classes first
      if (headerClass.includes('text-left') || headerClass.includes('justify-start')) return 'left';
      if (headerClass.includes('text-center') || headerClass.includes('justify-center')) return 'center';
      if (headerClass.includes('text-right') || headerClass.includes('justify-end')) return 'right';
      
      // Fall back to custom classes
      const prefix = 'header-align-';
      const regex = new RegExp(`${prefix}(\\w+)`);
      const match = headerClass.match(regex);
      return match ? match[1] : 'default';
    } else {
      // Check for Tailwind classes
      if (headerClass.includes('items-start')) return 'top';
      if (headerClass.includes('items-center')) return 'middle';
      if (headerClass.includes('items-end')) return 'bottom';
      
      // Fall back to custom classes
      const prefix = 'header-valign-';
      const regex = new RegExp(`${prefix}(\\w+)`);
      const match = headerClass.match(regex);
      return match ? match[1] : 'default';
    }
  };

  // Extract current cell alignment from cellClass
  const getCurrentCellAlignment = (type: 'horizontal' | 'vertical') => {
    const cellClassValue = getMixedValue('cellClass');
    const cellClassRaw = cellClassValue.value;
    const cellClass = (typeof cellClassRaw === 'string' ? cellClassRaw : '').trim();

    if (!cellClass) return 'default';

    if (type === 'horizontal') {
      // Check for Tailwind classes first
      if (cellClass.includes('text-left') || cellClass.includes('justify-start')) return 'left';
      if (cellClass.includes('text-center') || cellClass.includes('justify-center')) return 'center';
      if (cellClass.includes('text-right') || cellClass.includes('justify-end')) return 'right';
      
      // Fall back to custom classes
      const prefix = 'cell-align-';
      const regex = new RegExp(`${prefix}(\\w+)`);
      const match = cellClass.match(regex);
      return match ? match[1] : 'default';
    } else {
      // Check for Tailwind classes
      if (cellClass.includes('items-start')) return 'top';
      if (cellClass.includes('items-center')) return 'middle';
      if (cellClass.includes('items-end')) return 'bottom';
      
      // Fall back to custom classes
      const prefix = 'cell-valign-';
      const regex = new RegExp(`${prefix}(\\w+)`);
      const match = cellClass.match(regex);
      return match ? match[1] : 'default';
    }
  };

  // Check if header alignment is mixed
  const isHeaderAlignmentMixed = (_type: 'horizontal' | 'vertical') => {
    const headerClassValue = getMixedValue('headerClass');
    return headerClassValue.isMixed;
  };

  // Check if cell alignment is mixed
  const isCellAlignmentMixed = (_type: 'horizontal' | 'vertical') => {
    const cellClassValue = getMixedValue('cellClass');
    return cellClassValue.isMixed;
  };

  return (
    <ScrollArea className="h-full">
      <div className="px-6 py-4 space-y-6">
        {/* Two-column layout for better space utilization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Header Alignment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Header Alignment</CardTitle>
                <CardDescription className="text-sm">
                  Set text alignment for column headers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AlignmentIconPicker
                  label="Horizontal"
                  type="horizontal"
                  value={getCurrentHeaderAlignment('horizontal')}
                  onChange={(value) => handleHeaderAlignmentChange(value, 'horizontal')}
                  disabled={isDisabled || (isMultipleSelection && isHeaderAlignmentMixed('horizontal'))}
                  isMixed={isMultipleSelection && isHeaderAlignmentMixed('horizontal')}
                />

                <AlignmentIconPicker
                  label="Vertical"
                  type="vertical"
                  value={getCurrentHeaderAlignment('vertical')}
                  onChange={(value) => handleHeaderAlignmentChange(value, 'vertical')}
                  disabled={isDisabled || (isMultipleSelection && isHeaderAlignmentMixed('vertical'))}
                  isMixed={isMultipleSelection && isHeaderAlignmentMixed('vertical')}
                />
              </CardContent>
            </Card>

            {/* Style Editors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Style Editors</CardTitle>
                <CardDescription className="text-sm">
                  Customize visual appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 h-9"
                  disabled={isDisabled}
                  onClick={() => setShowHeaderStyleEditor(true)}
                >
                  <Palette className="h-4 w-4" />
                  Edit Header Style
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 h-9"
                  disabled={isDisabled}
                  onClick={() => setShowCellStyleEditor(true)}
                >
                  <Palette className="h-4 w-4" />
                  Edit Cell Style
                </Button>
              </CardContent>
            </Card>

            {/* Text Display Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Text Display</CardTitle>
                <CardDescription className="text-sm">
                  Control how text is displayed in cells
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ThreeStateCheckbox
                  label="Wrap Text"
                  property="wrapText"
                  mixedValue={getMixedValue('wrapText')}
                  onChange={(value) => updateBulkProperty('wrapText', value)}
                  disabled={isDisabled || (isMultipleSelection && getMixedValue('wrapText').isMixed)}
                  description="Wrap long text within cells"
                />

                <ThreeStateCheckbox
                  label="Auto Height"
                  property="autoHeight"
                  mixedValue={getMixedValue('autoHeight')}
                  onChange={(value) => updateBulkProperty('autoHeight', value)}
                  disabled={isDisabled || (isMultipleSelection && getMixedValue('autoHeight').isMixed)}
                  description="Automatically adjust row height to fit content"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Cell Alignment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cell Alignment</CardTitle>
                <CardDescription className="text-sm">
                  Set text alignment for cell content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AlignmentIconPicker
                  label="Horizontal"
                  type="horizontal"
                  value={getCurrentCellAlignment('horizontal')}
                  onChange={(value) => handleCellAlignmentChange(value, 'horizontal')}
                  disabled={isDisabled || (isMultipleSelection && isCellAlignmentMixed('horizontal'))}
                  isMixed={isMultipleSelection && isCellAlignmentMixed('horizontal')}
                />

                <AlignmentIconPicker
                  label="Vertical"
                  type="vertical"
                  value={getCurrentCellAlignment('vertical')}
                  onChange={(value) => handleCellAlignmentChange(value, 'vertical')}
                  disabled={isDisabled || (isMultipleSelection && isCellAlignmentMixed('vertical'))}
                  isMixed={isMultipleSelection && isCellAlignmentMixed('vertical')}
                />
              </CardContent>
            </Card>

            {/* Clear Styles */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Reset Styles</CardTitle>
                <CardDescription className="text-sm">
                  Remove custom styling and formatting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 h-9"
                  disabled={isDisabled}
                  onClick={clearCellStyles}
                >
                  <Eraser className="h-4 w-4" />
                  Clear Cell Styles
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 h-9"
                  disabled={isDisabled}
                  onClick={clearHeaderStyles}
                >
                  <Eraser className="h-4 w-4" />
                  Clear Header Styles
                </Button>
              </CardContent>
            </Card>

            {/* Header Text */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Header Text</CardTitle>
                <CardDescription className="text-sm">
                  Header text display options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ThreeStateCheckbox
                  label="Wrap Header Text"
                  property="wrapHeaderText"
                  mixedValue={getMixedValue('wrapHeaderText')}
                  onChange={(value) => updateBulkProperty('wrapHeaderText', value)}
                  disabled={isDisabled || (isMultipleSelection && getMixedValue('wrapHeaderText').isMixed)}
                  description="Wrap long text in column headers"
                />

                <ThreeStateCheckbox
                  label="Auto Header Height"
                  property="autoHeaderHeight"
                  mixedValue={getMixedValue('autoHeaderHeight')}
                  onChange={(value) => updateBulkProperty('autoHeaderHeight', value)}
                  disabled={isDisabled || (isMultipleSelection && getMixedValue('autoHeaderHeight').isMixed)}
                  description="Automatically adjust header height"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Style Editors */}
        <StyleEditor
          open={showCellStyleEditor}
          onOpenChange={setShowCellStyleEditor}
          title="Cell Style Editor"
          initialStyle={currentCellStyle.isMixed ? {} : (getCellStyleObject() as React.CSSProperties || {})}
          onSave={handleCellStyleSave}
          isHeaderStyle={false}
        />

        <StyleEditor
          open={showHeaderStyleEditor}
          onOpenChange={setShowHeaderStyleEditor}
          title="Header Style Editor"
          initialStyle={currentHeaderStyle.isMixed ? {} : (getHeaderStyleObject() as React.CSSProperties || {})}
          onSave={handleHeaderStyleSave}
          isHeaderStyle={true}
        />
      </div>
    </ScrollArea>
  );
};