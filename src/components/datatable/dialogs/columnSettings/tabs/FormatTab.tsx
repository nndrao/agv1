import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { HelpCircle, Copy, Check, Sparkles, Search, X, Eye, EyeOff, History, Star, StarOff } from 'lucide-react';
import { createExcelFormatter, getExcelStyleClass, getExcelExportFormat, createCellStyleFunction } from '@/components/datatable/utils/formatters';
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';

// Pre-defined formatters organized by category
const PREDEFINED_FORMATTERS = {
  number: {
    label: 'Number',
    icon: '123',
    options: [
      { value: '0', label: 'Integer', preview: '1234' },
      { value: '0.0', label: '1 Decimal', preview: '1234.5' },
      { value: '0.00', label: '2 Decimals', preview: '1234.50' },
      { value: '#,##0', label: 'Thousands', preview: '1,234' },
      { value: '#,##0.00', label: 'Thousands + 2 Decimals', preview: '1,234.50' },
      { value: '#,##0.00;[Red]#,##0.00', label: 'Red Negative (no minus)', preview: '1,234.50' },
      { value: '0.000', label: '3 Decimals', preview: '1234.500' },
      { value: '#,##0.0000', label: '4 Decimals', preview: '1,234.5678' },
    ]
  },
  currency: {
    label: 'Currency',
    icon: '$',
    options: [
      { value: '$#,##0', label: 'USD Integer', preview: '$1,234' },
      { value: '$#,##0.00', label: 'USD 2 Decimals', preview: '$1,234.50' },
      { value: '€#,##0.00', label: 'EUR 2 Decimals', preview: '€1,234.50' },
      { value: '£#,##0.00', label: 'GBP 2 Decimals', preview: '£1,234.50' },
      { value: '¥#,##0', label: 'JPY Integer', preview: '¥1,234' },
      { value: '#,##0.00 "USD"', label: 'USD Suffix', preview: '1,234.50 USD' },
      { value: '"$" #,##0.00;[Red]"-$" #,##0.00', label: 'Accounting', preview: '$1,234.50' },
      { value: '$#,##0.00;[Red]$#,##0.00', label: 'Red Negative (no minus)', preview: '$1,234.50' },
      { value: '[>0][Green]"▲"$#,##0.00;[<0][Red]"▼"$#,##0.00;$0.00', label: 'Trend Arrows', preview: '▲$1,234.50' },
    ]
  },
  percentage: {
    label: 'Percentage',
    icon: '%',
    options: [
      { value: '0%', label: 'Integer', preview: '12%' },
      { value: '0.0%', label: '1 Decimal', preview: '12.3%' },
      { value: '0.00%', label: '2 Decimals', preview: '12.34%' },
      { value: '#,##0.0%', label: 'Thousands + 1 Decimal', preview: '1,234.5%' },
    ]
  },
  date: {
    label: 'Date',
    icon: '📅',
    options: [
      { value: 'MM/DD/YYYY', label: 'US Date', preview: '12/31/2024' },
      { value: 'DD/MM/YYYY', label: 'UK Date', preview: '31/12/2024' },
      { value: 'YYYY-MM-DD', label: 'ISO Date', preview: '2024-12-31' },
      { value: 'MMM DD, YYYY', label: 'Medium Date', preview: 'Dec 31, 2024' },
      { value: 'MMMM DD, YYYY', label: 'Long Date', preview: 'December 31, 2024' },
    ]
  },
  time: {
    label: 'Time',
    icon: '🕐',
    options: [
      { value: 'HH:mm', label: '24-hour', preview: '14:30' },
      { value: 'HH:mm:ss', label: '24-hour + seconds', preview: '14:30:45' },
      { value: 'hh:mm AM/PM', label: '12-hour', preview: '02:30 PM' },
      { value: 'hh:mm:ss AM/PM', label: '12-hour + seconds', preview: '02:30:45 PM' },
    ]
  },
  scientific: {
    label: 'Scientific & Special',
    icon: '🔬',
    options: [
      { value: '0.00E+00', label: 'Scientific', preview: '1.23E+03' },
      { value: '0.0E+0', label: 'Scientific Short', preview: '1.2E+3' },
      { value: '[>999999]#,,"M";[>999]#,"K";#', label: 'Abbreviated', preview: '1.2M' },
      { value: '+0;-0;0', label: 'Show +/- signs', preview: '+123' },
      { value: '(0)', label: 'Negative in parentheses', preview: '(123)' },
    ]
  },
  custom: {
    label: 'Custom Colors',
    icon: '🎨',
    options: [
      { value: '[#00AA99]#,##0.00;[#FF6347]#,##0.00', label: 'Green/Red (no minus)', preview: '1,234.50' },
      { value: '[Black]#,##0.00;[Red]#,##0.00', label: 'Black/Red (no minus)', preview: '1,234.50' },
      { value: '[>100][#0080FF]#,##0;[<0][#FF8000]-#,##0;#,##0', label: 'Blue/Orange conditional', preview: '123' },
      { value: '[#808080]"N/A"', label: 'Gray N/A', preview: 'N/A' },
    ]
  },
  trafficLight: {
    label: 'Traffic Lights',
    icon: '🚦',
    options: [
      { value: '[>=80][Green]#,##0;[>=50][#FFA500]#,##0;[Red]#,##0', label: 'Score (80+ green, 50+ amber)', preview: '85' },
      { value: '[>=90][Green]#,##0"%";[>=70][#FFA500]#,##0"%";[Red]#,##0"%"', label: 'Percentage (90+ green)', preview: '85%' },
      { value: '[<=20][Green]"●";[<=50][#FFA500]"●";[Red]"●"', label: 'Dots (lower is better)', preview: '●' },
      { value: '[>=75][Green]"█";[>=50][#FFA500]"█";[Red]"█"', label: 'Bars', preview: '█' },
      { value: '[>=100][Green]"⬆";[<=0][Red]"⬇";[#FFA500]"→"', label: 'Arrows (trend)', preview: '⬆' },
      { value: '[>=80][Green]"✓ "#,##0;[>=50][#FFA500]"! "#,##0;[Red]"✗ "#,##0', label: 'Check/Warning/Cross', preview: '✓ 85' },
      { value: '[>0][Green]"🟢";[<0][Red]"🔴";[#FFA500]"🟡"', label: 'Circle Lights', preview: '🟢' },
      { value: '[>=4][Green]"★★★★★";[>=3][Green]"★★★★☆";[>=2][#FFA500]"★★★☆☆";[>=1][#FFA500]"★★☆☆☆";[Red]"★☆☆☆☆"', label: '5-Star Rating', preview: '★★★★☆' },
    ]
  }
};

// Popular formats for quick access
const POPULAR_FORMATS = [
  { value: '#,##0.00', label: 'Number with decimals', category: 'number' },
  { value: '$#,##0.00', label: 'USD Currency', category: 'currency' },
  { value: '0%', label: 'Percentage', category: 'percentage' },
  { value: 'MM/DD/YYYY', label: 'Date', category: 'date' },
];

// Recent formats storage key
const RECENT_FORMATS_KEY = 'column-format-recent';
const MAX_RECENT_FORMATS = 5;

// Format favorites storage key
const FAVORITE_FORMATS_KEY = 'column-format-favorites';

export const FormatTab: React.FC = React.memo(() => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperty
  } = useColumnCustomizationStore();

  const [selectedFormat, setSelectedFormat] = useState<string>('default');
  const [customFormat, setCustomFormat] = useState<string>('');
  const [showGuide, setShowGuide] = useState(false);
  const [copiedExample, setCopiedExample] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showPreview, setShowPreview] = useState(true);
  const [previewValue, setPreviewValue] = useState<number>(1234.56);
  const [recentFormats, setRecentFormats] = useState<string[]>([]);
  const [favoriteFormats, setFavoriteFormats] = useState<Set<string>>(new Set());
  
  // Refs for performance
  const searchInputRef = useRef<HTMLInputElement>(null);
  const formatCache = useRef<Map<string, any>>(new Map());
  const applyFormatRef = useRef<(format: string) => void>();

  // Load recent and favorite formats
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_FORMATS_KEY);
    if (stored) {
      setRecentFormats(JSON.parse(stored));
    }
    
    const favorites = localStorage.getItem(FAVORITE_FORMATS_KEY);
    if (favorites) {
      setFavoriteFormats(new Set(JSON.parse(favorites)));
    }
  }, []);

  // Get current format from selected columns
  const currentFormat = useMemo(() => {
    if (selectedColumns.size === 0) return null;
    
    const formats = new Set<string>();
    selectedColumns.forEach(colId => {
      const colDef = columnDefinitions.get(colId);
      const changes = pendingChanges.get(colId);
      // Detect format from valueFormatter if it exists
      const format = 'default';
      formats.add(format);
    });

    return formats.size === 1 ? Array.from(formats)[0] : null;
  }, [selectedColumns, columnDefinitions, pendingChanges]);

  // Find matching predefined format
  const matchedFormat = useMemo(() => {
    if (!currentFormat || currentFormat === 'default') return null;
    
    for (const [, category] of Object.entries(PREDEFINED_FORMATTERS)) {
      const match = category.options.find(opt => opt.value === currentFormat);
      if (match) return match;
    }
    return null;
  }, [currentFormat]);

  // Filter formats based on search
  const filteredFormats = useMemo(() => {
    if (!searchTerm) return PREDEFINED_FORMATTERS;
    
    const lowerSearch = searchTerm.toLowerCase();
    const filtered: typeof PREDEFINED_FORMATTERS = {};
    
    Object.entries(PREDEFINED_FORMATTERS).forEach(([key, category]) => {
      const matchingOptions = category.options.filter(opt => 
        opt.label.toLowerCase().includes(lowerSearch) ||
        opt.preview.toLowerCase().includes(lowerSearch) ||
        opt.value.toLowerCase().includes(lowerSearch)
      );
      
      if (matchingOptions.length > 0) {
        filtered[key as keyof typeof PREDEFINED_FORMATTERS] = {
          ...category,
          options: matchingOptions
        };
      }
    });
    
    return filtered;
  }, [searchTerm]);

  // Sync selected format with current format
  useEffect(() => {
    if (currentFormat) {
      if (matchedFormat) {
        setSelectedFormat(currentFormat);
      } else if (currentFormat !== 'default') {
        setSelectedFormat('custom');
        setCustomFormat(currentFormat);
      } else {
        setSelectedFormat('default');
      }
    }
  }, [matchedFormat, currentFormat]);

  // Memoized preview formatter with better caching
  const previewFormatter = useMemo(() => {
    const format = selectedFormat === 'custom' ? customFormat : selectedFormat;
    if (!format || format === 'default') return null;
    
    // Check cache first
    if (formatCache.current.has(format)) {
      return formatCache.current.get(format);
    }
    
    const formatter = createExcelFormatter(format);
    formatCache.current.set(format, formatter);
    
    // Increased cache size for better performance
    if (formatCache.current.size > 200) {
      // Remove oldest entries
      const entriesToRemove = Array.from(formatCache.current.keys()).slice(0, 50);
      entriesToRemove.forEach(key => formatCache.current.delete(key));
    }
    
    return formatter;
  }, [selectedFormat, customFormat]);

  // Add to recent formats
  const addToRecentFormats = useCallback((format: string) => {
    if (format === 'default' || format === 'custom') return;
    
    setRecentFormats(prev => {
      const updated = [format, ...prev.filter(f => f !== format)].slice(0, MAX_RECENT_FORMATS);
      localStorage.setItem(RECENT_FORMATS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((format: string) => {
    setFavoriteFormats(prev => {
      const updated = new Set(prev);
      if (updated.has(format)) {
        updated.delete(format);
      } else {
        updated.add(format);
      }
      localStorage.setItem(FAVORITE_FORMATS_KEY, JSON.stringify(Array.from(updated)));
      return updated;
    });
  }, []);

  // Optimized format change handler
  const handleFormatChange = useCallback((value: string) => {
    setSelectedFormat(value);
    
    if (value === 'default') {
      updateBulkProperty('valueFormatter', undefined);
      updateBulkProperty('exportValueFormatter', undefined);
    } else if (value === 'custom') {
      // Don't update yet, wait for custom input
    } else {
      addToRecentFormats(value);
      applyFormat(value);
    }
  }, [updateBulkProperty, addToRecentFormats]);

  // Apply format with all necessary properties - optimized
  const applyFormat = useCallback((format: string) => {
    // Batch all updates together
    const updates: Record<string, any> = {};
    
    // Check cache for formatter
    let formatter = formatCache.current.get(format);
    if (!formatter) {
      formatter = createExcelFormatter(format);
      formatCache.current.set(format, formatter);
    }
    
    // Ensure formatter has metadata
    if (!(formatter as any).__formatString) {
      (formatter as any).__formatString = format;
      (formatter as any).__formatterType = 'excel';
    }
    
    updates.valueFormatter = formatter;
    updates.exportValueFormatter = formatter;
    
    // Set appropriate cell class
    const cellClass = getExcelStyleClass(format);
    if (cellClass) {
      // Get first column's current class only once
      const firstColId = selectedColumns.size > 0 ? Array.from(selectedColumns)[0] : null;
      const currentCellClassRaw = firstColId ? 
        columnDefinitions.get(firstColId)?.cellClass || '' : '';
      const currentCellClass = typeof currentCellClassRaw === 'string' ? currentCellClassRaw : '';
      const existingClasses = currentCellClass ? 
        currentCellClass.split(' ').filter(c => !c.startsWith('ag-')) : [];
      const newClasses = [...new Set([...existingClasses, ...cellClass.split(' ')])];
      updates.cellClass = newClasses.join(' ').trim();
    }
    
    // Handle cell style for dynamic color formatting
    if (format.includes('[') && format.includes(']')) {
      // Get base style from first column only
      let baseStyle = {};
      const firstColId = Array.from(selectedColumns)[0];
      if (firstColId) {
        const colDef = columnDefinitions.get(firstColId);
        const currentStyle = colDef?.cellStyle;
        if (currentStyle && typeof currentStyle === 'object') {
          baseStyle = currentStyle;
        }
      }
      
      updates.cellStyle = createCellStyleFunction(format, baseStyle);
    }
    
    // Excel export format is handled by the formatter itself
    
    // Apply all updates at once using updateBulkProperties
    const store = useColumnCustomizationStore.getState();
    store.updateBulkProperties(updates);
  }, [selectedColumns, columnDefinitions]);

  // Debounced custom format handler - reduced delay for better responsiveness
  const debouncedApplyFormat = useMemo(
    () => debounce((value: string) => {
      if (value) {
        applyFormat(value);
      }
    }, 150), // Reduced from 300ms
    [applyFormat]
  );

  // Cleanup effect to cancel pending debounced operations
  useEffect(() => {
    return () => {
      debouncedApplyFormat.cancel();
    };
  }, [debouncedApplyFormat]);

  const handleCustomFormatChange = useCallback((value: string) => {
    setCustomFormat(value);
    debouncedApplyFormat(value);
  }, [debouncedApplyFormat]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedExample(text);
    setTimeout(() => setCopiedExample(null), 2000);
  };

  const isDisabled = selectedColumns.size === 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Value Formatting</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-7 text-xs gap-1"
                >
                  {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGuide(true)}
                  className="h-7 text-xs gap-1"
                >
                  <HelpCircle className="h-3 w-3" />
                  Guide
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Apply number, currency, date, or custom formats to cell values
            </p>
          </div>

          {/* Quick Actions */}
          {POPULAR_FORMATS.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Popular Formats</Label>
              <div className="flex flex-wrap gap-1">
                {POPULAR_FORMATS.map(format => (
                  <Button
                    key={format.value}
                    variant={selectedFormat === format.value ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleFormatChange(format.value)}
                    disabled={isDisabled}
                  >
                    <span className="font-mono mr-1">{PREDEFINED_FORMATTERS[format.category as keyof typeof PREDEFINED_FORMATTERS].icon}</span>
                    {format.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Formats */}
          {recentFormats.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <History className="h-3 w-3" />
                Recent
              </Label>
              <div className="flex flex-wrap gap-1">
                {recentFormats.map(format => (
                  <Button
                    key={format}
                    variant={selectedFormat === format ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs font-mono group"
                    onClick={() => handleFormatChange(format)}
                    disabled={isDisabled}
                  >
                    {format}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(format);
                      }}
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {favoriteFormats.has(format) ? 
                        <StarOff className="h-3 w-3" /> : 
                        <Star className="h-3 w-3" />
                      }
                    </button>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Format Selection with Search */}
          <div className="space-y-2">
            <Label className="text-sm">Select Format</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search formats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-7 pr-7 text-xs"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-1 top-1 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <Select
              value={selectedFormat}
              onValueChange={handleFormatChange}
              disabled={isDisabled}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent className="max-h-96">
                <SelectItem value="default">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">—</span>
                    <span>Default (No formatting)</span>
                  </div>
                </SelectItem>
                
                {/* Favorites */}
                {favoriteFormats.size > 0 && (
                  <>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel className="font-semibold text-xs px-2 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Favorites
                      </SelectLabel>
                      {Array.from(favoriteFormats).map(format => {
                        const category = Object.entries(PREDEFINED_FORMATTERS).find(([, cat]) => 
                          cat.options.some(opt => opt.value === format)
                        );
                        const option = category?.[1].options.find(opt => opt.value === format);
                        
                        return (
                          <SelectItem key={format} value={format} className="text-sm">
                            <div className="flex items-center justify-between w-full">
                              <span className="font-mono text-xs">{format}</span>
                              {option && (
                                <span className="ml-4 text-muted-foreground text-xs">
                                  {option.preview}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </>
                )}
                
                <SelectSeparator />
                
                {Object.entries(filteredFormats).map(([category, { label, icon, options }]) => (
                  <SelectGroup key={category}>
                    <SelectLabel className="font-semibold text-xs px-2 flex items-center gap-1">
                      <span>{icon}</span>
                      {label}
                    </SelectLabel>
                    {options.map(option => (
                      <SelectItem key={option.value} value={option.value} className="text-sm">
                        <div className="flex items-center justify-between w-full">
                          <span>{option.label}</span>
                          <span className="ml-4 text-muted-foreground text-xs font-mono">
                            {option.preview}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
                
                <SelectSeparator />
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    <span>Custom Format...</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom format input */}
          {selectedFormat === 'custom' && (
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg border">
              <Label htmlFor="custom-format" className="text-sm flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Custom Format String
              </Label>
              <Input
                id="custom-format"
                value={customFormat}
                onChange={(e) => handleCustomFormatChange(e.target.value)}
                placeholder="Enter format string (e.g., #,##0.00)"
                disabled={isDisabled}
                className="h-9 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use Excel-style format strings. Click the guide for examples and syntax.
              </p>
            </div>
          )}

          {/* Live Preview */}
          {showPreview && (selectedFormat !== 'default' || customFormat) && (
            <div className="p-4 bg-muted/20 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase text-muted-foreground">Live Preview</Label>
                <Input
                  type="number"
                  value={previewValue}
                  onChange={(e) => setPreviewValue(parseFloat(e.target.value) || 0)}
                  className="w-24 h-7 text-xs"
                  step="0.01"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Positive</p>
                  <p className="font-mono">
                    {previewFormatter ? 
                      previewFormatter({ value: Math.abs(previewValue) }) : 
                      Math.abs(previewValue)
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Negative</p>
                  <p className="font-mono">
                    {previewFormatter ? 
                      previewFormatter({ value: -Math.abs(previewValue) }) : 
                      -Math.abs(previewValue)
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Zero</p>
                  <p className="font-mono">
                    {previewFormatter ? 
                      previewFormatter({ value: 0 }) : 
                      '0'
                    }
                  </p>
                </div>
              </div>
              
              {currentFormat && currentFormat !== 'default' && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Format String</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {currentFormat}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Quick Tips */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
            <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Quick Tips
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Use <code className="bg-muted px-1 rounded">#</code> for optional digits, <code className="bg-muted px-1 rounded">0</code> for required digits</li>
              <li>• Add commas for thousands: <code className="bg-muted px-1 rounded">#,##0</code></li>
              <li>• Percentages multiply by 100: <code className="bg-muted px-1 rounded">0%</code></li>
              <li>• Wrap text in quotes: <code className="bg-muted px-1 rounded">"$"0.00</code></li>
              <li>• Use semicolons for positive;negative;zero formats</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Format Guide Dialog */}
      <FormatGuideDialog open={showGuide} onOpenChange={setShowGuide} />
    </ScrollArea>
  );
});

FormatTab.displayName = 'FormatTab';

// Format Guide Dialog Component
const FormatGuideDialog: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void }> = React.memo(({ open, onOpenChange }) => {
  const [copiedExample, setCopiedExample] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedExample(text);
    setTimeout(() => setCopiedExample(null), 2000);
  };

  const FORMAT_EXAMPLES = {
    basic: [
      { pattern: '0', desc: 'Display as integer', example: '1234' },
      { pattern: '0.00', desc: 'Two decimal places', example: '1234.50' },
      { pattern: '#,##0', desc: 'Thousands separator', example: '1,234' },
      { pattern: '#,##0.00', desc: 'Thousands with decimals', example: '1,234.50' },
      { pattern: '0%', desc: 'Percentage', example: '75%' },
      { pattern: '0.0%', desc: 'Percentage with decimal', example: '75.5%' },
    ],
    conditional: [
      { pattern: '[Red]0', desc: 'Color formatting', example: '1234 (in red)' },
      { pattern: '[>100]"High";[<50]"Low";"Medium"', desc: 'Conditional text', example: 'High' },
      { pattern: '[Green]0;[Red]-0', desc: 'Color positive/negative', example: '123 / -123' },
      { pattern: '[#00FF00]0;[#FF0000]-0', desc: 'Hex colors', example: '123 / -123' },
      { pattern: '[>0][#16A34A]↑0%;[<0][#DC2626]↓0%', desc: 'Arrows with colors', example: '↑5%' },
    ],
    prefixSuffix: [
      { pattern: '"$"0', desc: 'Currency prefix', example: '$100' },
      { pattern: '0" USD"', desc: 'Currency suffix', example: '100 USD' },
      { pattern: '"("0")"', desc: 'Wrap in parentheses', example: '(100)' },
      { pattern: '0" units"', desc: 'Unit suffix', example: '50 units' },
    ],
    advanced: [
      { pattern: '0.00E+00', desc: 'Scientific notation', example: '1.23E+03' },
      { pattern: '# ?/?', desc: 'Fractions', example: '1 1/2' },
      { pattern: '00000', desc: 'Leading zeros', example: '00123' },
      { pattern: '@', desc: 'Text placeholder', example: 'Hello' },
    ]
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Excel Format String Guide</DialogTitle>
          <DialogDescription>
            Learn how to create custom format strings for your data
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="mt-4">
          <TabsList>
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="conditional">Conditional</TabsTrigger>
            <TabsTrigger value="prefixSuffix">Prefix/Suffix</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            {Object.entries(FORMAT_EXAMPLES).map(([key, examples]) => (
              <TabsContent key={key} value={key} className="space-y-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {key === 'basic' && 'Basic Number Formats'}
                      {key === 'conditional' && 'Conditional Formatting'}
                      {key === 'prefixSuffix' && 'Prefix & Suffix'}
                      {key === 'advanced' && 'Advanced Formats'}
                    </CardTitle>
                    <CardDescription>
                      {key === 'basic' && 'Common patterns for formatting numbers'}
                      {key === 'conditional' && 'Format based on value conditions'}
                      {key === 'prefixSuffix' && 'Add text before or after numbers'}
                      {key === 'advanced' && 'Scientific notation, fractions, and more'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {examples.map((example, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                          <div className="flex-1">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{example.pattern}</code>
                            <p className="text-xs text-muted-foreground mt-1">{example.desc}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{example.example}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(example.pattern)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedExample === example.pattern ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {key === 'advanced' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Format String Syntax</CardTitle>
                      <CardDescription>Complete reference</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs space-y-2">
                      <p><strong>0</strong> - Display digit or 0</p>
                      <p><strong>#</strong> - Display digit or nothing</p>
                      <p><strong>,</strong> - Thousands separator</p>
                      <p><strong>.</strong> - Decimal point</p>
                      <p><strong>%</strong> - Percentage (multiply by 100)</p>
                      <p><strong>E+, E-</strong> - Scientific notation</p>
                      <p><strong>"text"</strong> - Display literal text</p>
                      <p><strong>@</strong> - Text placeholder</p>
                      <p><strong>[condition]</strong> - Conditional formatting</p>
                      <p><strong>;</strong> - Section separator (positive;negative;zero;text)</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});

FormatGuideDialog.displayName = 'FormatGuideDialog';