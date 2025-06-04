import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { ValueFormatterEditor } from '../editors/ValueFormatterEditor';
import { createExcelFormatter, getExcelStyleClass } from '@/components/datatable/utils/formatters';
import { 
  Hash, 
  DollarSign, 
  Percent, 
  Calendar, 
  Type, 
  Lightbulb, 
  ArrowUp, 
  ArrowDown, 
  Palette, 
  Info, 
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface FormatTabProps {
  uiMode?: 'simple' | 'advanced';
}

export const FormatTab: React.FC<FormatTabProps> = ({ uiMode = 'simple' }) => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperty,
    updateBulkProperties,
    quickFormatPinned,
  } = useColumnCustomizationStore();

  const [showFormatterEditor, setShowFormatterEditor] = useState(false);

  // Get column data type to recommend formats
  const selectedColumnTypes = useMemo(() => {
    const types = new Set<string>();
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      if (colDef) {
        types.add(colDef.cellDataType || colDef.type || 'text');
      }
    });
    return Array.from(types);
  }, [selectedColumns, columnDefinitions]);

  // Determine if we have a single data type
  const singleDataType = selectedColumnTypes.length === 1 ? selectedColumnTypes[0] : null;

  // Get current formatter for selected columns
  const currentFormatters = useMemo(() => {
    const formatters = new Map<string, any>();
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const pendingChange = pendingChanges.get(colId);
      
      // Check pending changes first, then fall back to column definition
      let formatter;
      if (pendingChange && 'valueFormatter' in pendingChange) {
        formatter = pendingChange.valueFormatter;
      } else if (colDef) {
        formatter = colDef.valueFormatter;
      }
      
      if (formatter) {
        formatters.set(colId, formatter);
      }
    });
    return formatters;
  }, [selectedColumns, columnDefinitions, pendingChanges]);

  // Check if all selected columns have the same formatter
  const hasConsistentFormatter = useMemo(() => {
    if (currentFormatters.size === 0) return true;
    if (currentFormatters.size !== selectedColumns.size) return false;
    
    const formatters = Array.from(currentFormatters.values());
    const firstFormatter = formatters[0];
    
    // Check if all formatters are the same
    return formatters.every(formatter => {
      if (typeof formatter === 'function' && typeof firstFormatter === 'function') {
        // Compare format strings if available
        const formatString = (formatter as any).__formatString;
        const firstFormatString = (firstFormatter as any).__formatString;
        
        if (formatString && firstFormatString) {
          return formatString === firstFormatString;
        }
        
        // Can't reliably compare functions otherwise
        return false;
      }
      
      return formatter === firstFormatter;
    });
  }, [currentFormatters, selectedColumns]);

  // Get current format string if consistent
  const currentFormatString = useMemo(() => {
    if (!hasConsistentFormatter || currentFormatters.size === 0) return '';
    
    const formatter = Array.from(currentFormatters.values())[0];
    if (typeof formatter === 'function') {
      return (formatter as any).__formatString || '';
    }
    
    return '';
  }, [hasConsistentFormatter, currentFormatters]);

  // Apply a format to selected columns
  const applyFormat = useCallback((formatString: string) => {
    if (selectedColumns.size === 0) return;
    
    console.log('[FormatTab] Applying format:', formatString);
    
    try {
      // Create formatter function
      const formatter = createExcelFormatter(formatString);
      
      // Get CSS classes for this format
      const cssClass = getExcelStyleClass(formatString);
      
      // Apply formatter and CSS class in one operation
      updateBulkProperties({
        valueFormatter: formatter,
        cellClass: cssClass,
        // Enable export with formatter
        useValueFormatterForExport: true
      });
    } catch (error) {
      console.error('Error applying format:', error);
    }
  }, [selectedColumns, updateBulkProperties]);

  // Clear format from selected columns
  const clearFormat = useCallback(() => {
    if (selectedColumns.size === 0) return;
    
    updateBulkProperties({
      valueFormatter: undefined,
      // Keep other classes that might be applied
      cellClass: undefined
    });
  }, [selectedColumns, updateBulkProperties]);

  // Format presets
  const formatPresets = useMemo(() => [
    // Number formats
    { 
      id: 'number', 
      name: 'Number', 
      icon: Hash, 
      format: '#,##0.00', 
      description: 'Format with thousands separator and 2 decimal places',
      dataTypes: ['number', 'numericColumn']
    },
    { 
      id: 'integer', 
      name: 'Integer', 
      icon: Hash, 
      format: '#,##0', 
      description: 'Whole numbers with thousands separator',
      dataTypes: ['number', 'numericColumn']
    },
    
    // Currency formats
    { 
      id: 'currency', 
      name: 'Currency', 
      icon: DollarSign, 
      format: '$#,##0.00', 
      description: 'US dollars with 2 decimal places',
      dataTypes: ['number', 'numericColumn', 'currency']
    },
    { 
      id: 'accounting', 
      name: 'Accounting', 
      icon: DollarSign, 
      format: '$#,##0.00;($#,##0.00)', 
      description: 'Negative values in parentheses',
      dataTypes: ['number', 'numericColumn', 'currency']
    },
    
    // Percentage formats
    { 
      id: 'percentage', 
      name: 'Percentage', 
      icon: Percent, 
      format: '0.00%', 
      description: 'Percentage with 2 decimal places',
      dataTypes: ['number', 'numericColumn']
    },
    { 
      id: 'percentage-simple', 
      name: 'Percentage (0 dp)', 
      icon: Percent, 
      format: '0%', 
      description: 'Percentage with no decimal places',
      dataTypes: ['number', 'numericColumn']
    },
    
    // Date formats
    { 
      id: 'date-short', 
      name: 'Short Date', 
      icon: Calendar, 
      format: 'MM/DD/YYYY', 
      description: 'MM/DD/YYYY format',
      dataTypes: ['date', 'dateColumn']
    },
    { 
      id: 'date-long', 
      name: 'Long Date', 
      icon: Calendar, 
      format: 'MMMM D, YYYY', 
      description: 'Month Day, Year format',
      dataTypes: ['date', 'dateColumn']
    },
    
    // Text formats
    { 
      id: 'text-prefix', 
      name: 'Text Prefix', 
      icon: Type, 
      format: '"ID: "#', 
      description: 'Add "ID: " prefix to values',
      dataTypes: ['text', 'textColumn', 'string']
    },
    
    // Conditional formats
    { 
      id: 'conditional-color', 
      name: 'Conditional Color', 
      icon: Palette, 
      format: '[>0][Green]#,##0.00;[<0][Red]#,##0.00;0.00', 
      description: 'Green for positive, red for negative',
      dataTypes: ['number', 'numericColumn']
    },
    { 
      id: 'traffic-light', 
      name: 'Traffic Light', 
      icon: Sparkles, 
      format: '[>=90]"🟢 "#0;[>=70]"🟡 "#0;"🔴 "#0', 
      description: 'Colored indicators based on value',
      dataTypes: ['number', 'numericColumn']
    },
    { 
      id: 'arrows', 
      name: 'Arrows', 
      icon: ArrowUp, 
      format: '[>0]"↑ "#,##0.00;[<0]"↓ "#,##0.00;"-"', 
      description: 'Up/down arrows for positive/negative',
      dataTypes: ['number', 'numericColumn']
    }
  ], []);

  // Filter presets based on selected column types
  const recommendedPresets = useMemo(() => {
    if (selectedColumnTypes.length === 0) return [];
    
    return formatPresets.filter(preset => {
      // If no specific data types, show for all
      if (!preset.dataTypes) return true;
      
      // Check if any selected column type matches any preset data type
      return selectedColumnTypes.some(type => 
        preset.dataTypes.some(presetType => 
          type.includes(presetType) || presetType.includes(type)
        )
      );
    });
  }, [selectedColumnTypes, formatPresets]);

  // Get pinned formats
  const pinnedFormats = useMemo(() => {
    return formatPresets.filter(preset => quickFormatPinned.includes(preset.id));
  }, [formatPresets, quickFormatPinned]);

  // Handle opening the formatter editor
  const openFormatterEditor = useCallback(() => {
    setShowFormatterEditor(true);
  }, []);

  // Handle saving from formatter editor
  const handleSaveFormatter = useCallback((formatter: (params: { value: unknown }) => string) => {
    if (selectedColumns.size === 0) return;
    
    // Apply formatter to selected columns
    updateBulkProperty('valueFormatter', formatter);
    
    // Enable export with formatter
    updateBulkProperty('useValueFormatterForExport', true);
    
    // Check if formatter has format string metadata
    const formatString = (formatter as any).__formatString;
    if (formatString) {
      // Apply CSS class based on format
      const cssClass = getExcelStyleClass(formatString);
      if (cssClass) {
        updateBulkProperty('cellClass', cssClass);
      }
    }
  }, [selectedColumns, updateBulkProperty]);

  const isDisabled = selectedColumns.size === 0;

  return (
    <ScrollArea className="h-full">
      <div className="px-6 py-4 space-y-6">
        {/* Header with description */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold leading-none">Format Values</h3>
          <p className="text-sm text-muted-foreground">
            Apply formatting to display values in a specific way without changing the underlying data.
          </p>
        </div>

        {/* Quick Format Buttons */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Quick Formats
            </CardTitle>
            <CardDescription className="text-sm">
              Apply common formats with one click
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDisabled ? (
              <Alert className="bg-muted/50">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Select one or more columns to apply formatting
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {singleDataType && recommendedPresets.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Recommended for {singleDataType}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {recommendedPresets.slice(0, 6).map(preset => (
                        <Button
                          key={preset.id}
                          variant="outline"
                          size="sm"
                          onClick={() => applyFormat(preset.format)}
                          disabled={isDisabled}
                          className="h-9 justify-start gap-2 text-sm"
                          title={preset.description}
                        >
                          <preset.icon className="h-4 w-4 text-primary" />
                          <span className="truncate">{preset.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {pinnedFormats.map(format => (
                    <Button
                      key={format.id}
                      variant="outline"
                      size="sm"
                      onClick={() => applyFormat(format.format)}
                      disabled={isDisabled}
                      className={`h-9 justify-start gap-2 text-sm ${
                        currentFormatString === format.format ? 'border-primary bg-primary/10' : ''
                      }`}
                      title={format.description}
                    >
                      <format.icon className="h-4 w-4 text-primary" />
                      <span className="truncate">{format.name}</span>
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFormat}
                    disabled={isDisabled || currentFormatters.size === 0}
                    className="h-9 justify-start gap-2 text-sm"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                    <span>Clear Format</span>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Custom Format Editor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              Custom Format
            </CardTitle>
            <CardDescription className="text-sm">
              Create advanced formatting with Excel-like syntax
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isDisabled ? (
              <Alert className="bg-muted/50">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Select one or more columns to apply custom formatting
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {!hasConsistentFormatter && currentFormatters.size > 0 && (
                  <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50">
                    <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                      Selected columns have different formats. Applying a new format will override all of them.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Current Format</Label>
                    <Badge variant="outline" className="text-xs font-mono">
                      {currentFormatString || 'None'}
                    </Badge>
                  </div>
                  
                  <Button
                    variant="default"
                    size="sm"
                    onClick={openFormatterEditor}
                    disabled={isDisabled}
                    className="w-full justify-center gap-2 h-9"
                  >
                    <Palette className="h-4 w-4" />
                    <span>Open Format Editor</span>
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Format Guide</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 gap-1"
                      onClick={() => window.open('https://support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68', '_blank')}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span className="text-xs">Help</span>
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1.5">
                    <p><strong>Basic:</strong> <code className="bg-muted px-1 py-0.5 rounded">#,##0.00</code> - Number with thousands separator and 2 decimals</p>
                    <p><strong>Currency:</strong> <code className="bg-muted px-1 py-0.5 rounded">$#,##0.00</code> - Currency with symbol</p>
                    <p><strong>Percentage:</strong> <code className="bg-muted px-1 py-0.5 rounded">0.00%</code> - Percentage with 2 decimals</p>
                    <p><strong>Conditional:</strong> <code className="bg-muted px-1 py-0.5 rounded">[>0][Green]#,##0;[Red]#,##0</code> - Color based on value</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Format Preview */}
        {!isDisabled && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Format Preview
              </CardTitle>
              <CardDescription className="text-sm">
                See how your format will look with sample data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Original</Label>
                    <div className="p-2 bg-muted/30 rounded-md border text-sm">
                      {singleDataType === 'number' ? '1234.56' : 
                       singleDataType === 'date' ? '2023-01-15' : 
                       'Sample Text'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Formatted</Label>
                    <div className="p-2 bg-primary/5 rounded-md border border-primary/20 text-sm font-medium">
                      {currentFormatString ? (
                        singleDataType === 'number' ? '$1,234.56' : 
                        singleDataType === 'date' ? 'Jan 15, 2023' : 
                        'Sample Text'
                      ) : (
                        <span className="text-muted-foreground italic">No format applied</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Value Formatter Editor Dialog */}
        <ValueFormatterEditor
          open={showFormatterEditor}
          onOpenChange={setShowFormatterEditor}
          initialFormatter={currentFormatters.size > 0 && hasConsistentFormatter ? 
            Array.from(currentFormatters.values())[0] : undefined}
          onSave={handleSaveFormatter}
          title="Custom Value Formatter"
          columnType={singleDataType as 'text' | 'number' | 'date' | 'boolean'}
        />
      </div>
    </ScrollArea>
  );
};

export default FormatTab;