import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useColumnCustomizationStore } from '../store/columnCustomization.store';
import { ValueFormatterEditor } from '../editors/ValueFormatterEditor';
import { createExcelFormatter, getExcelStyleClass, createCellStyleFunction } from '@/components/datatable/utils/formatters';
import { hasConditionalStyling } from '@/components/datatable/utils/styleUtils';
import { 
  Hash, 
  DollarSign, 
  Percent, 
  Calendar, 
  Type, 
  Info, 
  HelpCircle,
  Sparkles,
  X,
  AlertCircle
} from 'lucide-react';

interface FormatTabProps {
  uiMode?: 'simple' | 'advanced';
}

// Simplified format templates organized by category
const FORMAT_TEMPLATES = {
  number: {
    title: 'Numbers',
    icon: Hash,
    formats: [
      { label: 'Number', format: '#,##0.00', preview: '1,234.56' },
      { label: 'Integer', format: '#,##0', preview: '1,235' },
      { label: 'No Separators', format: '0.00', preview: '1234.56' },
      { label: '4 Decimals', format: '#,##0.0000', preview: '1,234.5600' },
      { label: 'Positive/Negative Colors', format: '[>0][Green]#,##0.00;[<0][Red]#,##0.00;#,##0.00', preview: '1,234.56 / 1,234.56' },
    ]
  },
  currency: {
    title: 'Currency',
    icon: DollarSign,
    formats: [
      { label: 'USD', format: '$#,##0.00', preview: '$1,234.56' },
      { label: 'USD (Accounting)', format: '$#,##0.00;($#,##0.00)', preview: '($1,234.56)' },
      { label: 'USD (Color)', format: '[>0][Green]$#,##0.00;[<0][Red]$#,##0.00;$#,##0.00', preview: '$1,234.56 / $1,234.56' },
      { label: 'EUR', format: '€#,##0.00', preview: '€1,234.56' },
      { label: 'GBP', format: '£#,##0.00', preview: '£1,234.56' },
    ]
  },
  percentage: {
    title: 'Percentage',
    icon: Percent,
    formats: [
      { label: 'Percent', format: '0.00%', preview: '12.34%' },
      { label: 'Percent (No Decimals)', format: '0%', preview: '12%' },
      { label: 'Percent (Color)', format: '[>0][Green]0.00%;[<0][Red]0.00%;0.00%', preview: '12.34% / 12.34%' },
      { label: 'Basis Points', format: '0 "bps"', preview: '1234 bps' },
    ]
  },
  date: {
    title: 'Date & Time',
    icon: Calendar,
    formats: [
      { label: 'Short Date', format: 'MM/DD/YYYY', preview: '12/31/2023' },
      { label: 'Long Date', format: 'MMMM D, YYYY', preview: 'December 31, 2023' },
      { label: 'ISO Date', format: 'YYYY-MM-DD', preview: '2023-12-31' },
      { label: 'Time', format: 'h:mm AM/PM', preview: '3:45 PM' },
    ]
  },
  text: {
    title: 'Text',
    icon: Type,
    formats: [
      { label: 'Uppercase', format: '[Upper]', preview: 'EXAMPLE' },
      { label: 'Lowercase', format: '[Lower]', preview: 'example' },
      { label: 'Title Case', format: '[Title]', preview: 'Example Text' },
    ]
  }
};

export function FormatTab({ uiMode = 'simple' }: FormatTabProps) {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperties,
    updateSingleProperty,
    updateBulkProperty,
  } = useColumnCustomizationStore();

  const [showFormatterEditor, setShowFormatterEditor] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customFormat, setCustomFormat] = useState('');
  const [activeTab, setActiveTab] = useState('templates');

  const isDisabled = selectedColumns.size === 0;
  const isMultipleSelection = selectedColumns.size > 1;

  // Get current format for single selection
  const currentFormat = useMemo(() => {
    if (selectedColumns.size !== 1) return null;
    
    const colId = Array.from(selectedColumns)[0];
    const colDef = columnDefinitions.get(colId);
    const pendingChange = pendingChanges.get(colId);
    const formatter = pendingChange?.valueFormatter || colDef?.valueFormatter;
    
    if (formatter && typeof formatter === 'function') {
      return (formatter as any).__formatString || null;
    }
    return null;
  }, [selectedColumns, columnDefinitions, pendingChanges]);

  // Apply format template
  const applyFormat = useCallback(async (formatString: string) => {
    if (!formatString || selectedColumns.size === 0) return;

    try {
      const formatter = createExcelFormatter(formatString);
      const newFormatClasses = getExcelStyleClass(formatString);
      
      // Check if format string has conditional styling and create cellStyle if needed
      console.log('[applyFormat] Checking if cellStyle needed for format:', formatString);
      let cellStyle = undefined;
      if (hasConditionalStyling(formatString)) {
        console.log('[applyFormat] Creating cellStyle for conditional formatting');
        
        // Get existing base styles from ALL selected columns to preserve styling tab settings
        // We need to check each column individually since they might have different styles
        const cellStyleUpdates: Record<string, any> = {};
        
        selectedColumns.forEach(colId => {
          const colDef = columnDefinitions.get(colId);
          const pendingChange = pendingChanges.get(colId);
          const existingCellStyle = pendingChange?.cellStyle || colDef?.cellStyle;
          
          let baseStyle: React.CSSProperties | undefined;
          if (existingCellStyle) {
            if (typeof existingCellStyle === 'object') {
              // Direct style object from styling tab
              baseStyle = existingCellStyle;
            } else if (typeof existingCellStyle === 'function') {
              // Function style - check for base style metadata
              const metadata = (existingCellStyle as any).__baseStyle;
              if (metadata) {
                baseStyle = metadata;
              } else {
                // Try calling the function to see if it returns static styles
                // This handles the case where styling tab created a function that returns static styles
                const testStyle = existingCellStyle({ value: null });
                if (testStyle && typeof testStyle === 'object') {
                  baseStyle = testStyle;
                }
              }
            }
          }
          
          console.log(`[applyFormat] Column ${colId} base style:`, baseStyle);
          cellStyleUpdates[colId] = createCellStyleFunction(formatString, baseStyle);
        });
        
        // Check if all columns have the same base style
        const uniqueStyles = new Set(Object.values(cellStyleUpdates).map(fn => {
          const baseStyle = (fn as any).__baseStyle;
          return baseStyle ? JSON.stringify(baseStyle) : 'undefined';
        }));
        
        if (uniqueStyles.size === 1) {
          // All columns have the same base style, use a single cellStyle function
          cellStyle = Object.values(cellStyleUpdates)[0];
        } else {
          // Different base styles, we'll need to apply them individually
          // Store for later individual application
          properties.cellStyleUpdates = cellStyleUpdates;
        }
      }
      
      // Preserve existing alignment classes
      const properties: any = {
        valueFormatter: formatter,
        useValueFormatterForExport: true
      };
      
      if (cellStyle) {
        properties.cellStyle = cellStyle;
      }
      
      // Handle cellClass updates to preserve alignment
      const cellClassUpdates: Record<string, string> = {};
      selectedColumns.forEach(colId => {
        const colDef = columnDefinitions.get(colId);
        const pendingChange = pendingChanges.get(colId);
        const existingCellClass = pendingChange?.cellClass || colDef?.cellClass || '';
        
        // Extract alignment classes from existing cellClass (both custom and Tailwind)
        const existingClasses = existingCellClass.split(' ').filter(Boolean);
        const alignmentClasses = existingClasses.filter((cls: string) => 
          // Custom alignment classes
          cls.startsWith('cell-align-') || cls.startsWith('cell-valign-') ||
          // Tailwind alignment classes
          cls === 'text-left' || cls === 'text-center' || cls === 'text-right' ||
          cls === 'justify-start' || cls === 'justify-center' || cls === 'justify-end' ||
          cls === 'items-start' || cls === 'items-center' || cls === 'items-end'
        );
        
        // Combine new format classes with preserved alignment classes
        const allClasses = [...new Set([...newFormatClasses.split(' '), ...alignmentClasses])];
        cellClassUpdates[colId] = allClasses.filter(Boolean).join(' ');
      });
      
      // Apply cellClass
      const uniqueCellClasses = new Set(Object.values(cellClassUpdates));
      if (uniqueCellClasses.size === 1) {
        properties.cellClass = Array.from(uniqueCellClasses)[0];
      }
      
      // Apply properties
      updateBulkProperties(properties);
      
      // Apply individual cellClass updates if needed
      if (uniqueCellClasses.size > 1) {
        selectedColumns.forEach(colId => {
          updateSingleProperty(colId, 'cellClass', cellClassUpdates[colId]);
        });
      }
      
      // Apply individual cellStyle updates if needed
      if (properties.cellStyleUpdates) {
        selectedColumns.forEach(colId => {
          updateSingleProperty(colId, 'cellStyle', properties.cellStyleUpdates[colId]);
        });
        delete properties.cellStyleUpdates; // Clean up
      }
      
      setSelectedTemplate(formatString);
    } catch (error) {
      console.error('Error applying format:', error);
    }
  }, [selectedColumns, updateBulkProperties, updateSingleProperty, columnDefinitions, pendingChanges]);

  // Clear format
  const clearFormat = useCallback(() => {
    if (selectedColumns.size === 0) return;
    
    // Preserve alignment classes when clearing format
    const cellClassUpdates: Record<string, string | undefined> = {};
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const pendingChange = pendingChanges.get(colId);
      const existingCellClass = pendingChange?.cellClass || colDef?.cellClass || '';
      
      // Extract only alignment classes to preserve (both custom and Tailwind)
      const alignmentClasses = existingCellClass.split(' ').filter((cls: string) => 
        // Custom alignment classes
        cls.startsWith('cell-align-') || cls.startsWith('cell-valign-') ||
        // Tailwind alignment classes
        cls === 'text-left' || cls === 'text-center' || cls === 'text-right' ||
        cls === 'justify-start' || cls === 'justify-center' || cls === 'justify-end' ||
        cls === 'items-start' || cls === 'items-center' || cls === 'items-end'
      );
      
      cellClassUpdates[colId] = alignmentClasses.length > 0 ? alignmentClasses.join(' ') : undefined;
    });
    
    const properties: any = {
      valueFormatter: undefined,
      cellStyle: undefined
    };
    
    // Handle cellClass updates
    const uniqueCellClasses = new Set(Object.values(cellClassUpdates));
    if (uniqueCellClasses.size === 1) {
      properties.cellClass = Array.from(uniqueCellClasses)[0];
    }
    
    updateBulkProperties(properties);
    
    // Apply individual cellClass updates if needed
    if (uniqueCellClasses.size > 1) {
      selectedColumns.forEach(colId => {
        updateSingleProperty(colId, 'cellClass', cellClassUpdates[colId]);
      });
    }
    
    setSelectedTemplate(null);
    setCustomFormat('');
  }, [selectedColumns, updateBulkProperties, updateSingleProperty, columnDefinitions, pendingChanges]);

  // Handle custom format input
  const handleCustomFormatApply = useCallback(() => {
    if (customFormat.trim()) {
      applyFormat(customFormat.trim());
    }
  }, [customFormat, applyFormat]);

  // Check if current format matches a template
  const isTemplateSelected = useCallback((format: string) => {
    return currentFormat === format || selectedTemplate === format;
  }, [currentFormat, selectedTemplate]);

  if (isDisabled) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Info className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Select one or more columns to apply formatting</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header with guidance */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Format Cells</h3>
          {currentFormat && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFormat}
              className="h-8 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear Format
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Choose how to display values in the selected {isMultipleSelection ? 'columns' : 'column'}
        </p>
      </div>

      <Separator />

      {/* Current format display */}
      {currentFormat && !isMultipleSelection && (
        <Alert className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Current format: <code className="ml-1 px-2 py-0.5 bg-muted rounded text-xs">{currentFormat}</code>
          </AlertDescription>
        </Alert>
      )}

      {/* Format options */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom Format</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Object.entries(FORMAT_TEMPLATES).map(([key, category]) => {
                const Icon = category.icon;
                return (
                  <div key={key} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm">{category.title}</h4>
                    </div>
                    <div className="grid gap-2">
                      {category.formats.map((format) => (
                        <Card
                          key={format.format}
                          className={`cursor-pointer transition-colors ${
                            isTemplateSelected(format.format) 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-muted-foreground/50'
                          }`}
                          onClick={() => applyFormat(format.format)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{format.label}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {format.format}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-mono text-muted-foreground">
                                  {format.preview}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Custom Format Tab */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom Format String</CardTitle>
              <CardDescription>
                Enter an Excel-style format string
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-format">Format String</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-format"
                    value={customFormat}
                    onChange={(e) => setCustomFormat(e.target.value)}
                    placeholder='e.g., #,##0.00 or "USD" #,##0.00'
                    className="font-mono text-sm"
                  />
                  <Button 
                    onClick={handleCustomFormatApply}
                    disabled={!customFormat.trim()}
                    size="sm"
                  >
                    Apply
                  </Button>
                </div>
              </div>

              {/* Format string examples */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Examples:</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between font-mono">
                    <span>#,##0.00</span>
                    <span>→ 1,234.56</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>0.00%</span>
                    <span>→ 12.34%</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>"USD" #,##0.00</span>
                    <span>→ USD 1,234.56</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>MM/DD/YYYY</span>
                    <span>→ 12/31/2023</span>
                  </div>
                </div>
              </div>

              {/* Help tooltip */}
              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Format symbols:</strong>
                  <br />
                  # = Optional digit, 0 = Required digit, , = Thousand separator
                  <br />
                  . = Decimal point, % = Percentage, $ = Currency
                  <br />
                  "text" = Literal text, _ = Space, * = Fill character
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Advanced Formatting</CardTitle>
              <CardDescription>
                Create conditional formatting with rules and styles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowFormatterEditor(true)}
                variant="outline"
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Open Advanced Editor
              </Button>
            </CardContent>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              The advanced editor allows you to create complex conditional formatting rules with:
              <ul className="mt-2 ml-4 list-disc text-xs space-y-1">
                <li>Multiple conditions (if value {'>'} X, if value {'<'} Y, etc.)</li>
                <li>Custom colors and styles for each condition</li>
                <li>Text transformations and custom display formats</li>
                <li>Default fallback formatting</li>
              </ul>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* Advanced formatter dialog */}
      {showFormatterEditor && (
        <ValueFormatterEditor
          open={showFormatterEditor}
          onOpenChange={setShowFormatterEditor}
          initialFormatter={(() => {
            if (selectedColumns.size !== 1) return undefined;
            const colId = Array.from(selectedColumns)[0];
            const colDef = columnDefinitions.get(colId);
            const pendingChange = pendingChanges.get(colId);
            return pendingChange?.valueFormatter || colDef?.valueFormatter;
          })()}
          onSave={async (formatter, cellStyle) => {
            console.log('[FormatTab] Received from ValueFormatterEditor:', {
              hasFormatter: !!formatter,
              formatterType: typeof formatter,
              formatString: (formatter as any)?.__formatString,
              hasCellStyle: !!cellStyle,
              cellStyleType: typeof cellStyle
            });
            
            const properties: any = {
              valueFormatter: formatter,
              useValueFormatterForExport: true
            };
            
            if (cellStyle) {
              // We need to check each selected column for existing base styles
              const cellStyleUpdates: Record<string, any> = {};
              const formatString = (formatter as any).__formatString;
              
              selectedColumns.forEach(colId => {
                const colDef = columnDefinitions.get(colId);
                const pendingChange = pendingChanges.get(colId);
                const existingCellStyle = pendingChange?.cellStyle || colDef?.cellStyle;
                
                let baseStyle: React.CSSProperties | undefined;
                if (existingCellStyle) {
                  if (typeof existingCellStyle === 'object') {
                    // Direct style object from styling tab
                    baseStyle = existingCellStyle;
                  } else if (typeof existingCellStyle === 'function') {
                    // Function style - check for base style metadata
                    const metadata = (existingCellStyle as any).__baseStyle;
                    if (metadata) {
                      baseStyle = metadata;
                    } else {
                      // Try calling the function to see if it returns static styles
                      const testStyle = existingCellStyle({ value: null });
                      if (testStyle && typeof testStyle === 'object') {
                        baseStyle = testStyle;
                      }
                    }
                  }
                }
                
                console.log(`[FormatTab] Column ${colId} existing base style:`, baseStyle);
                
                // Create a merged cellStyle function that preserves base styles
                if (baseStyle && Object.keys(baseStyle).length > 0) {
                  const mergedCellStyle = (params: { value: unknown }) => {
                    const conditionalStyles = cellStyle(params) || {};
                    // Always merge base and conditional styles, with conditional taking precedence
                    const merged = { ...baseStyle, ...conditionalStyles };
                    return Object.keys(merged).length > 0 ? merged : undefined;
                  };
                  
                  // Attach metadata
                  if (formatString) {
                    Object.defineProperty(mergedCellStyle, '__formatString', { 
                      value: formatString,
                      writable: false,
                      enumerable: false,
                      configurable: true
                    });
                  }
                  Object.defineProperty(mergedCellStyle, '__baseStyle', { 
                    value: baseStyle,
                    writable: false,
                    enumerable: false,
                    configurable: true
                  });
                  
                  cellStyleUpdates[colId] = mergedCellStyle;
                } else {
                  // No base styles, use the cellStyle as-is
                  cellStyleUpdates[colId] = cellStyle;
                }
              });
              
              // Check if all columns have the same cellStyle function
              const uniqueStyles = new Set(Object.values(cellStyleUpdates).map(fn => {
                const baseStyle = (fn as any).__baseStyle;
                const formatString = (fn as any).__formatString;
                return JSON.stringify({ baseStyle, formatString });
              }));
              
              if (uniqueStyles.size === 1) {
                // All columns have the same style function, use bulk update
                properties.cellStyle = Object.values(cellStyleUpdates)[0];
              } else {
                // Different styles, need individual updates
                properties.cellStyleUpdates = cellStyleUpdates;
              }
            }
            
            console.log('[FormatTab] Updating bulk properties:', properties);
            updateBulkProperties(properties);
            
            // Apply individual cellStyle updates if needed
            if (properties.cellStyleUpdates) {
              selectedColumns.forEach(colId => {
                updateSingleProperty(colId, 'cellStyle', properties.cellStyleUpdates[colId]);
              });
              delete properties.cellStyleUpdates; // Clean up
            }
            
            setShowFormatterEditor(false);
          }}
          dataType={(() => {
            if (selectedColumns.size === 0) return 'text';
            const colId = Array.from(selectedColumns)[0];
            const colDef = columnDefinitions.get(colId);
            return colDef?.cellDataType as string || 'text';
          })()}
        />
      )}
    </div>
  );
}