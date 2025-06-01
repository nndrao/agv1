import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useColumnCustomizationStore } from '../store/column-customization.store';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HelpCircle, Copy, Check, Sparkles, Search, X, Eye, EyeOff, History, Star, StarOff, Wand2, Hash, DollarSign, Percent, Calendar, Type } from 'lucide-react';
import { createExcelFormatter, getExcelStyleClass, createCellStyleFunction } from '@/components/datatable/utils/formatters';
import { debounce } from 'lodash';
import { FormatWizard } from '../components/FormatWizard';

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
      { value: '[>0]"🟢";[<0]"🔴";"🟡"', label: 'Emoji Circles', preview: '🟢' },
      { value: '[>=4][Green]"★★★★★";[>=3][Green]"★★★★☆";[>=2][#FFA500]"★★★☆☆";[>=1][#FFA500]"★★☆☆☆";[Red]"★☆☆☆☆"', label: '5-Star Rating', preview: '★★★★☆' },
    ]
  },
  emoji: {
    label: 'Emoji Formats',
    icon: '😊',
    options: [
      { value: '[>100]"🟢";[>90]"🟡";"🔴"', label: 'Emoji only (🟢 🟡 🔴)', preview: '🟢' },
      { value: '[>100]#,##0" 🟢";[>90]#,##0" 🟡";#,##0" 🔴"', label: 'Value + emoji', preview: '95 🟡' },
      { value: '[>100]"🟢 "#,##0;[>90]"🟡 "#,##0;"🔴 "#,##0', label: 'Emoji + value', preview: '🟡 95' },
      { value: '[>100]#,##0" (🟢)";[>90]#,##0" (🟡)";#,##0" (🔴)"', label: 'With parentheses', preview: '95 (🟡)' },
      { value: '[>100]0"% 🟢";[>90]0"% 🟡";0"% 🔴"', label: 'Percentage + emoji', preview: '95% 🟡' },
      { value: '[>0]"📈";[<0]"📉";"➖"', label: 'Chart trends', preview: '📈' },
      { value: '[>=100]"🔥";[>=75]"✨";[>=50]"👍";"👎"', label: 'Performance indicators', preview: '✨' },
      { value: '[>0]"➕ "#,##0;[<0]"➖ "#,##0;"0️⃣"', label: 'Plus/minus emoji', preview: '➕ 100' },
    ]
  },
  symbols: {
    label: 'Unicode Symbols',
    icon: '◆',
    options: [
      { value: '[>0][Green]"●";[<0][Red]"●";"●"', label: 'Colored circles', preview: '●' },
      { value: '[>0][Green]"◉";[<0][Red]"◉";"◉"', label: 'Circled dot', preview: '◉' },
      { value: '[>0]"○";[<0]"●";"○"', label: 'Empty/Filled circles', preview: '○' },
      { value: '[>0][Green]"▲";[<0][Red]"▼";"▬"', label: 'Triangle arrows', preview: '▲' },
      { value: '[>0][#00AA00]"↑";[<0][#FF0000]"↓";[#666666]"→"', label: 'Simple arrows', preview: '↑' },
      { value: '[>0][Green]"⬆";[<0][Red]"⬇";"➡"', label: 'Bold arrows', preview: '⬆' },
      { value: '[>=4]"★★★★★";[>=3]"★★★★☆";[>=2]"★★★☆☆";[>=1]"★★☆☆☆";"★☆☆☆☆"', label: '5-Star rating', preview: '★★★★☆' },
      { value: '[>0][Green]"✓";[<0][Red]"✗";"○"', label: 'Check/Cross marks', preview: '✓' },
      { value: '[>0][#0080FF]"✔";[<0][#FF4040]"✖";"○"', label: 'Bold check/cross', preview: '✔' },
      { value: '[>0]"■";[<0]"□";"▪"', label: 'Filled/Empty squares', preview: '■' },
      { value: '[>0][Green]"▪";[<0][Red]"▫";"▫"', label: 'Small squares', preview: '▪' },
      { value: '[>0][#4169E1]"◆";[<0][#DC143C]"◇";"◈"', label: 'Diamonds', preview: '◆' },
      { value: '[>=80]"█████";[>=60]"████░";[>=40]"███░░";[>=20]"██░░░";"█░░░░"', label: 'Progress bars', preview: '████░' },
      { value: '[>0]"▌";[<0]"▎";"▏"', label: 'Vertical bars', preview: '▌' },
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

interface FormatTabProps {
  uiMode?: 'simple' | 'advanced';
}

export const FormatTab: React.FC<FormatTabProps> = React.memo(({ uiMode = 'simple' }) => {
  const {
    selectedColumns,
    columnDefinitions,
    pendingChanges,
    updateBulkProperty
  } = useColumnCustomizationStore();

  const [selectedFormat, setSelectedFormat] = useState<string>('default');
  const [customFormat, setCustomFormat] = useState<string>('');
  const [showGuide, setShowGuide] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showPreview, setShowPreview] = useState(true);
  const [previewValue, setPreviewValue] = useState<number>(1234.56);
  const [recentFormats, setRecentFormats] = useState<string[]>([]);
  const [favoriteFormats, setFavoriteFormats] = useState<Set<string>>(new Set());
  const [showWizard, setShowWizard] = useState(false);
  
  // Refs for performance
  const searchInputRef = useRef<HTMLInputElement>(null);
  const formatCache = useRef<Map<string, ((params: unknown) => string) | undefined>>(new Map());

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
      
      // Check for format in pending changes first, then column definition
      const formatter = changes?.valueFormatter || colDef?.valueFormatter;
      
      if (formatter && typeof formatter === 'function') {
        // Try to extract the format string from the formatter metadata
        const formatString = (formatter as any).__formatString || (formatter as any)._formatString;
        if (formatString) {
          formats.add(formatString);
        } else {
          // If no metadata, it's a custom formatter
          formats.add('custom');
        }
      } else {
        formats.add('default');
      }
    });

    // Return the format if all selected columns have the same format
    return formats.size === 1 ? Array.from(formats)[0] : 'mixed';
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
    if (currentFormat && currentFormat !== 'mixed') {
      if (currentFormat === 'default') {
        setSelectedFormat('default');
        setCustomFormat('');
      } else if (currentFormat === 'custom') {
        // It's a custom formatter without metadata
        setSelectedFormat('custom');
        // Keep the existing customFormat value
      } else if (matchedFormat) {
        // Found in predefined formats
        setSelectedFormat(currentFormat);
        setCustomFormat('');
      } else {
        // Has a format string but not in predefined list
        setSelectedFormat('custom');
        setCustomFormat(currentFormat);
      }
    } else if (currentFormat === 'mixed') {
      // Multiple different formats selected
      setSelectedFormat('default');
      setCustomFormat('');
    }
  }, [currentFormat, matchedFormat]);

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
    
    // Clear the formatter cache when changing formats
    formatCache.current.clear();
    
    if (value === 'default') {
      // Clear all formatting-related properties
      const updates = {
        valueFormatter: undefined,
        // Value formatter will be used for export automatically
        cellStyle: undefined,
        cellClass: undefined
      };
      const store = useColumnCustomizationStore.getState();
      store.updateBulkProperties(updates);
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
    const updates: Record<string, unknown> = {};
    
    // Clear cache to ensure we get a fresh formatter
    formatCache.current.delete(format);
    
    // Create new formatter
    const formatter = createExcelFormatter(format);
    formatCache.current.set(format, formatter);
    
    // Ensure formatter has metadata
    if (formatter && !Object.prototype.hasOwnProperty.call(formatter, '__formatString')) {
      Object.defineProperty(formatter, '__formatString', { value: format, writable: false });
      Object.defineProperty(formatter, '__formatterType', { value: 'excel', writable: false });
    }
    
    updates.valueFormatter = formatter;
    // Value formatter will be used for export automatically
    
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
    
    // Always set cellStyle - either a function for color formatting or undefined to clear it
    if (format.includes('[') && format.includes(']')) {
      // Check if this is a color format (has color codes)
      const hasColorCodes = format.match(/\[(Red|Green|Blue|Yellow|Orange|Purple|Gray|Grey|Black|White|#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})\]/i);
      if (hasColorCodes) {
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
        // Use enhanced cell style function that extracts colors from format sections
        updates.cellStyle = createCellStyleFunction(format, baseStyle);
      } else {
        // Clear cellStyle if no color codes
        updates.cellStyle = undefined;
      }
    } else {
      // Clear cellStyle if no brackets in format
      updates.cellStyle = undefined;
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

  // Cleanup effect to cancel pending debounced operations and clear cache
  useEffect(() => {
    return () => {
      debouncedApplyFormat.cancel();
      // Clear formatter cache on unmount
      formatCache.current.clear();
    };
  }, [debouncedApplyFormat]);

  const handleCustomFormatChange = useCallback((value: string) => {
    setCustomFormat(value);
    debouncedApplyFormat(value);
  }, [debouncedApplyFormat]);


  const isDisabled = selectedColumns.size === 0;

  // Quick format buttons data
  const quickFormats = [
    { id: 'number', label: 'Number', icon: Hash, format: '#,##0.00', description: '1,234.50' },
    { id: 'currency', label: 'Currency', icon: DollarSign, format: '$#,##0.00', description: '$1,234.50' },
    { id: 'percentage', label: 'Percent', icon: Percent, format: '0%', description: '12%' },
    { id: 'date', label: 'Date', icon: Calendar, format: 'MM/DD/YYYY', description: '12/31/2024' },
    { id: 'text', label: 'Text', icon: Type, format: '@', description: 'Text' },
  ];

  const { quickFormatPinned, toggleQuickFormat } = useColumnCustomizationStore();

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="space-y-6">
          {/* Quick Format Buttons - Always visible in simple mode */}
          {uiMode === 'simple' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Quick Formats</Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWizard(true)}
                    className="h-7 px-2"
                    disabled={isDisabled}
                    title="Format Wizard"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowGuide(true)}
                    className="h-7 px-2"
                    title="Format Guide"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {quickFormats.filter(qf => quickFormatPinned.includes(qf.id)).map((quickFormat) => {
                  const Icon = quickFormat.icon;
                  const isActive = selectedFormat === quickFormat.format;
                  return (
                    <button
                      key={quickFormat.id}
                      onClick={() => handleFormatChange(quickFormat.format)}
                      disabled={isDisabled}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                        "hover:bg-muted/50 hover:border-primary/50",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background"
                      )}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <span className="text-xs font-medium">{quickFormat.label}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {quickFormat.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Header Section */}
          <CollapsibleSection
            id="format-selection"
            title="Format Selection"
            description="Choose from predefined formats or create custom ones"
            defaultExpanded={uiMode === 'advanced'}
            badge={
              currentFormat && currentFormat !== 'default' && currentFormat !== 'mixed' ? (
                <Badge variant="secondary" className="text-xs">
                  {currentFormat.length > 20 ? currentFormat.substring(0, 20) + '...' : currentFormat}
                </Badge>
              ) : null
            }
            actionButton={
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-7 px-2"
                >
                  {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
            }
          >
            <div className="space-y-4">

              {/* Popular Formats - Moved inside CollapsibleSection */}
              {POPULAR_FORMATS.length > 0 && uiMode === 'advanced' && (
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
                
                {currentFormat === 'mixed' && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Multiple formats selected
                  </div>
                )}
                
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
                {currentFormat && currentFormat !== 'default' && currentFormat !== 'custom' && currentFormat !== 'mixed' && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (Current: {currentFormat.substring(0, 30)}{currentFormat.length > 30 ? '...' : ''})
                  </span>
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="custom-format"
                  value={customFormat}
                  onChange={(e) => handleCustomFormatChange(e.target.value)}
                  placeholder="Enter format string (e.g., #,##0.00)"
                  disabled={isDisabled}
                  className="h-9 font-mono text-sm flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWizard(true)}
                  disabled={isDisabled}
                  className="h-9 px-3"
                  title="Open Format Wizard"
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use Excel-style format strings. Click the guide for examples and syntax.
              </p>
            </div>
          )}
            </div>
          </CollapsibleSection>

          {/* Live Preview */}
          {showPreview && (selectedFormat !== 'default' || customFormat) && (
            <CollapsibleSection
              id="format-preview"
              title="Live Preview"
              description="See how your format will appear"
              defaultExpanded={true}
              badge={
                <Badge variant="outline" className="text-xs">
                  {selectedFormat === 'custom' ? customFormat : selectedFormat}
                </Badge>
              }
            >
              <div className="space-y-3">
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
              
              {((selectedFormat !== 'default' && selectedFormat !== 'custom') || 
                (selectedFormat === 'custom' && customFormat)) && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Format String</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono block break-all">
                    {selectedFormat === 'custom' ? customFormat : selectedFormat}
                  </code>
                </div>
              )}
              </div>
            </CollapsibleSection>
          )}

          {/* Quick Tips */}
          {uiMode === 'advanced' && (
            <CollapsibleSection
              id="format-tips"
              title="Format Syntax Guide"
              description="Learn how to create custom format strings"
              defaultExpanded={false}
              helpText="Excel-style format strings support numbers, dates, colors, and custom text"
            >
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Use <code className="bg-muted px-1 rounded">#</code> for optional digits, <code className="bg-muted px-1 rounded">0</code> for required digits</li>
                <li>• Add commas for thousands: <code className="bg-muted px-1 rounded">#,##0</code></li>
                <li>• Percentages multiply by 100: <code className="bg-muted px-1 rounded">0%</code></li>
                <li>• Wrap text in quotes: <code className="bg-muted px-1 rounded">"$"0.00</code></li>
                <li>• Use semicolons for positive;negative;zero formats</li>
                <li>• <strong>Unicode symbols:</strong> Change color with <code className="bg-muted px-1 rounded">[Red]</code>, <code className="bg-muted px-1 rounded">[Green]</code>, or <code className="bg-muted px-1 rounded">[#FF0000]</code></li>
                <li>• <strong>Symbol size:</strong> Controlled by the column's font size in the Styling tab</li>
                <li>• <strong>Combine with values:</strong> <code className="bg-muted px-1 rounded">[Green]"✓ "#,##0</code> shows check + number</li>
              </ul>
            </CollapsibleSection>
          )}
        </div>
      </div>

      {/* Format Guide Dialog */}
      <FormatGuideDialog open={showGuide} onOpenChange={setShowGuide} />
      
      {/* Format Wizard Dialog */}
      <FormatWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        initialFormat={selectedFormat === 'custom' ? customFormat : (selectedFormat === 'default' ? '' : selectedFormat)}
        onApply={(format) => {
          setCustomFormat(format);
          handleCustomFormatChange(format);
        }}
      />
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
    emoji: [
      { pattern: '[>100]"🟢";[>90]"🟡";"🔴"', desc: 'Status emojis only', example: '🟢' },
      { pattern: '[>100]#,##0" 🟢";[>90]#,##0" 🟡";#,##0" 🔴"', desc: 'Value with emoji', example: '95 🟡' },
      { pattern: '[>100]"🟢 "#,##0;[>90]"🟡 "#,##0;"🔴 "#,##0', desc: 'Emoji before value', example: '🟡 95' },
      { pattern: '[>0]"📈";[<0]"📉";"➖"', desc: 'Trend emojis', example: '📈' },
      { pattern: '[>=100]"🔥";[>=75]"✨";[>=50]"👍";"👎"', desc: 'Performance emojis', example: '✨' },
      { pattern: '[>100]0"% 🟢";[>90]0"% 🟡";0"% 🔴"', desc: 'Percentage with emoji', example: '95% 🟡' },
    ],
    symbols: [
      { pattern: '[Green]"●"', desc: 'Colored circle', example: '● (green)' },
      { pattern: '[#FF0000]"◆"', desc: 'Hex color diamond', example: '◆ (red)' },
      { pattern: '[Blue]"▲"', desc: 'Colored triangle', example: '▲ (blue)' },
      { pattern: '"★★★"', desc: 'Three stars', example: '★★★' },
      { pattern: '[>0][Green]"↑";[<0][Red]"↓"', desc: 'Conditional arrows', example: '↑' },
      { pattern: '"█████"', desc: 'Progress bar', example: '█████' },
      { pattern: '[>0][Green]"✓ "#,##0;[<0][Red]"✗ "#,##0', desc: 'Symbol + value', example: '✓ 100' },
      { pattern: '#,##0" "[Green]"●"', desc: 'Value + symbol', example: '100 ●' },
      { pattern: '[>=80]"████░";[>=60]"███░░";[>=40]"██░░░";"█░░░░"', desc: 'Progress levels', example: '███░░' },
      { pattern: '[>0][#00AA00]"⬆";[<0][#FF0000]"⬇";"➡"', desc: 'Hex color arrows', example: '⬆' },
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
            <TabsTrigger value="emoji">Emoji</TabsTrigger>
            <TabsTrigger value="symbols">Symbols</TabsTrigger>
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
                      {key === 'emoji' && 'Emoji Formats'}
                      {key === 'symbols' && 'Unicode Symbols'}
                      {key === 'advanced' && 'Advanced Formats'}
                    </CardTitle>
                    <CardDescription>
                      {key === 'basic' && 'Common patterns for formatting numbers'}
                      {key === 'conditional' && 'Format based on value conditions'}
                      {key === 'prefixSuffix' && 'Add text before or after numbers'}
                      {key === 'emoji' && 'Use emojis for visual indicators and status'}
                      {key === 'symbols' && 'Unicode symbols with color and size customization'}
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
                      <Separator className="my-2" />
                      <p className="font-medium">Color & Size Guide:</p>
                      <p><strong>Colors:</strong> Use <code className="bg-muted px-1">[Red]</code>, <code className="bg-muted px-1">[Green]</code>, <code className="bg-muted px-1">[Blue]</code>, etc.</p>
                      <p><strong>Hex colors:</strong> Use <code className="bg-muted px-1">[#FF0000]</code> for custom colors</p>
                      <p><strong>Symbol size:</strong> Set font size in the Styling tab (symbols inherit cell font size)</p>
                      <p className="mt-2"><strong>Unicode Symbols:</strong></p>
                      <p>• Circles: ● ◉ ○ ◎ ⊙ ⊚ ⊛</p>
                      <p>• Squares: ■ □ ▪ ▫ ◼ ◻ ▰ ▱</p>
                      <p>• Arrows: ▲ ▼ ↑ ↓ ⬆ ⬇ → ← ↔ ⇧ ⇩</p>
                      <p>• Stars: ★ ☆ ✦ ✧ ⭐</p>
                      <p>• Marks: ✓ ✗ ✔ ✖ ☑ ☒ ⊕ ⊖</p>
                      <p>• Diamonds: ◆ ◈ ◇ ⬧ ⬦ ♦</p>
                      <p>• Bars: █ ▌ ▎ ▏ ░ ▒ ▓</p>
                      <p>• Progress: ▰▱▱▱▱ ▰▰▰▱▱ ▰▰▰▰▰</p>
                      <p>• Other: • · ◦ ‣ ⁃ ⁍ ⁎ ⁕</p>
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