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
import { HelpCircle, Copy, Check, Sparkles, Eye, EyeOff, History, Star, StarOff, Wand2, Hash, DollarSign, Percent, Calendar, Type } from 'lucide-react';
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

// Flatten all predefined formatters into a single list for the dropdown
const ALL_FORMATTERS: Array<{ value: string; label: string; category: string; preview: string }> = (() => {
  const flattened: Array<{ value: string; label: string; category: string; preview: string }> = [];
  
  // Add default option
  flattened.push({ value: 'default', label: 'Default (no formatting)', category: 'basic', preview: '1234.56' });
  
  // Add all predefined formatters
  Object.entries(PREDEFINED_FORMATTERS).forEach(([categoryKey, category]) => {
    category.options.forEach(option => {
      flattened.push({
        value: option.value,
        label: option.label,
        category: category.label,
        preview: option.preview
      });
    });
  });
  
  return flattened;
})();

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
  const [showPreview, setShowPreview] = useState(true);
  const [previewValue, setPreviewValue] = useState<number>(1234.56);
  const [recentFormats, setRecentFormats] = useState<string[]>([]);
  const [favoriteFormats, setFavoriteFormats] = useState<Set<string>>(new Set());
  const [showWizard, setShowWizard] = useState(false);
  
  // Refs for performance
  const formatCache = useRef<Map<string, ((params: any) => string) | undefined>>(new Map());

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
        const styleFunc = createCellStyleFunction(format, baseStyle);
        // Attach metadata for serialization - use configurable: true to ensure it persists
        Object.defineProperty(styleFunc, '__formatString', { 
          value: format, 
          writable: false,
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(styleFunc, '__baseStyle', { 
          value: baseStyle, 
          writable: false,
          enumerable: false,
          configurable: true
        });
        updates.cellStyle = styleFunc;
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

  const { quickFormatPinned } = useColumnCustomizationStore();

  return (
    <ScrollArea className="h-full">
      <div className="px-6 py-4 space-y-6">
        {/* Default Formatters Dropdown - First Item */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Format Selection</Label>
            <p className="text-xs text-muted-foreground mt-1">Choose from predefined formats</p>
          </div>
          <Select 
            value={selectedFormat === 'custom' ? 'custom' : selectedFormat} 
            onValueChange={handleFormatChange}
            disabled={isDisabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a format..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {/* Group by category */}
              {Object.entries(PREDEFINED_FORMATTERS).map(([categoryKey, category]) => (
                <SelectGroup key={categoryKey}>
                  <SelectLabel className="flex items-center gap-2">
                    <span className="text-sm">{category.icon}</span>
                    {category.label}
                  </SelectLabel>
                  {category.options.map((option, index) => (
                    <SelectItem key={`${categoryKey}-${index}`} value={option.value}>
                      <div className="flex items-center justify-between w-full">
                        <span className="flex-1">{option.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{option.preview}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {categoryKey !== 'symbols' && <SelectSeparator />}
                </SelectGroup>
              ))}
              <SelectSeparator />
              <SelectItem value="custom">Custom Format...</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Format Buttons - Always visible in simple mode */}
        {uiMode === 'simple' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Quick Formats</Label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {quickFormats.map((format) => {
                const Icon = format.icon;
                const isActive = selectedFormat === format.format;
                return (
                  <Button
                    key={format.id}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFormatChange(format.format)}
                    disabled={isDisabled}
                    className="h-auto p-3 flex flex-col items-center gap-1"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{format.label}</span>
                    <span className="text-xs text-muted-foreground">{format.description}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Advanced Format Options */}
        {uiMode === 'advanced' && (
          <div className="space-y-6">
            {/* Format Selection */}
            <CollapsibleSection
              id="format-selection"
              title="Format Selection"
              description="Choose from predefined formats or create custom ones"
              defaultExpanded={true}
            >
              <div className="space-y-4">
                {/* Quick Format Buttons */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Quick Formats</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {quickFormats.map((format) => {
                      const Icon = format.icon;
                      const isActive = selectedFormat === format.format;
                      return (
                        <Button
                          key={format.id}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFormatChange(format.format)}
                          disabled={isDisabled}
                          className="h-auto p-3 flex flex-col items-center gap-1"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-xs font-medium">{format.label}</span>
                          <span className="text-xs text-muted-foreground">{format.description}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Format Categories */}
            <CollapsibleSection
              id="format-categories"
              title="Format Categories"
              description="Browse formats by category"
              defaultExpanded={true}
            >
              <Tabs defaultValue="popular" className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-9">
                  <TabsTrigger value="popular" className="text-xs">Popular</TabsTrigger>
                  <TabsTrigger value="recent" className="text-xs">Recent</TabsTrigger>
                  <TabsTrigger value="favorites" className="text-xs">Favorites</TabsTrigger>
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                </TabsList>

                <TabsContent value="popular" className="mt-4">
                  <div className="grid gap-2">
                    {POPULAR_FORMATS.map((format, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors",
                          selectedFormat === format.value && "border-primary bg-primary/5"
                        )}
                        onClick={() => handleFormatChange(format.value)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{format.label}</div>
                          <div className="text-xs text-muted-foreground font-mono">{format.value}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {previewFormatter ? previewFormatter({ value: previewValue } as any) : format.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="recent" className="mt-4">
                  {recentFormats.length > 0 ? (
                    <div className="grid gap-2">
                      {recentFormats.map((format, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors",
                            selectedFormat === format && "border-primary bg-primary/5"
                          )}
                          onClick={() => handleFormatChange(format)}
                        >
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground font-mono">{format}</div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {previewFormatter ? previewFormatter({ value: previewValue } as any) : format}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent formats</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="favorites" className="mt-4">
                  {favoriteFormats.size > 0 ? (
                    <div className="grid gap-2">
                      {Array.from(favoriteFormats).map((format, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors",
                            selectedFormat === format && "border-primary bg-primary/5"
                          )}
                          onClick={() => handleFormatChange(format)}
                        >
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground font-mono">{format}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                              {previewFormatter ? previewFormatter({ value: previewValue } as any) : format}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(format);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Star className="h-3 w-3 fill-current" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No favorite formats</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="all" className="mt-4">
                  <div className="space-y-4">
                    {Object.entries(PREDEFINED_FORMATTERS).map(([categoryKey, category]) => (
                      <Card key={categoryKey}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <span className="text-lg">{category.icon}</span>
                            {category.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {category.options.map((option, index) => (
                            <div
                              key={index}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors",
                                selectedFormat === option.value && "border-primary bg-primary/5"
                              )}
                              onClick={() => handleFormatChange(option.value)}
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">{option.label}</div>
                                <div className="text-xs text-muted-foreground font-mono">{option.value}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm text-muted-foreground">
                                  {option.preview}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(option.value);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  {favoriteFormats.has(option.value) ? (
                                    <Star className="h-3 w-3 fill-current" />
                                  ) : (
                                    <StarOff className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CollapsibleSection>

            {/* Custom Format */}
            <CollapsibleSection
              id="custom-format"
              title="Custom Format"
              description="Create your own format using Excel-style codes"
              defaultExpanded={selectedFormat === 'custom'}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-format" className="text-sm font-medium">Format Code</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="custom-format"
                      value={customFormat}
                      onChange={(e) => handleCustomFormatChange(e.target.value)}
                      placeholder="Enter custom format (e.g., #,##0.00)"
                      disabled={isDisabled}
                      className="font-mono flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowWizard(true)}
                      disabled={isDisabled}
                      className="h-9 px-3"
                      title="Format Wizard"
                    >
                      <Wand2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowGuide(true)}
                      disabled={isDisabled}
                      className="h-9 px-3"
                      title="Format Guide"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {showPreview && customFormat && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">Preview:</div>
                    <div className="font-mono text-sm">
                      {previewFormatter ? previewFormatter({ value: previewValue } as any) : customFormat}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>
        )}

        {/* Preview Section */}
        {showPreview && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Preview</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-6 w-6 p-0"
                >
                  {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="preview-value" className="text-sm">Test Value:</Label>
                <Input
                  id="preview-value"
                  type="number"
                  value={previewValue}
                  onChange={(e) => setPreviewValue(parseFloat(e.target.value) || 0)}
                  className="w-32 h-8"
                  step="0.01"
                />
              </div>
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Formatted Result:</div>
                <div className="font-mono text-sm">
                  {previewFormatter ? previewFormatter({ value: previewValue } as any) : previewValue.toString()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Format Guide Dialog */}
        <FormatGuideDialog open={showGuide} onOpenChange={setShowGuide} />

        {/* Format Wizard */}
        <FormatWizard
          open={showWizard}
          onOpenChange={setShowWizard}
          onApply={(format) => {
            handleFormatChange(format);
            setShowWizard(false);
          }}
        />
      </div>
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
      { pattern: '0.00%', desc: 'Percentage with 2 decimals', example: '75.25%' },
      { pattern: '$#,##0', desc: 'Currency integer', example: '$1,234' },
      { pattern: '$#,##0.00', desc: 'Currency with decimals', example: '$1,234.50' },
      { pattern: '0.00E+00', desc: 'Scientific notation', example: '1.23E+03' },
      { pattern: '# ?/?', desc: 'Fractions', example: '1 1/4' },
      { pattern: '00000', desc: 'Leading zeros (5 digits)', example: '01234' },
      { pattern: '@', desc: 'Text format', example: 'Hello World' },
    ],
    conditional: [
      { pattern: '[Red]0', desc: 'All numbers in red', example: '1234 (red)' },
      { pattern: '[Green]0;[Red]-0', desc: 'Green positive, red negative', example: '123 (green) / -123 (red)' },
      { pattern: '[>100][Green]0;[Red]0', desc: 'Green if >100, otherwise red', example: '150 (green) / 50 (red)' },
      { pattern: '[>=80][Green]0;[>=50][#FFA500]0;[Red]0', desc: 'Traffic light: 80+ green, 50+ orange, <50 red', example: '85 (green) / 65 (orange) / 30 (red)' },
      { pattern: '[>1000000]#,,"M";[>1000]#,"K";0', desc: 'Scale: millions as M, thousands as K', example: '1.5M / 250K / 500' },
      { pattern: '[>100]"High";[>50]"Medium";"Low"', desc: 'Text based on value ranges', example: 'High / Medium / Low' },
      { pattern: '[=0]"Zero";[>0]"Positive";"Negative"', desc: 'Text for zero, positive, negative', example: 'Zero / Positive / Negative' },
      { pattern: '[>=90][Green]"A";[>=80][#0080FF]"B";[>=70][#FFA500]"C";[Red]"F"', desc: 'Letter grades with colors', example: 'A (green) / B (blue) / C (orange) / F (red)' },
      { pattern: '[>0][#16A34A]↑#,##0;[<0][#DC2626]↓#,##0;[#6B7280]→0', desc: 'Trend arrows with colors and values', example: '↑1,250 / ↓500 / →0' },
      { pattern: '[<=20][Green]"Low Risk";[<=50][#FFA500]"Medium Risk";[Red]"High Risk"', desc: 'Risk assessment (lower is better)', example: 'Low Risk / Medium Risk / High Risk' },
      { pattern: '[#00AA00]#,##0.00;[#FF6347]-#,##0.00;[#808080]"--"', desc: 'Custom hex colors for pos/neg/zero', example: '1,234.50 (green) / -567.89 (red) / -- (gray)' },
      { pattern: '[Blue][>1000]#,##0" (Large)";[#FFA500][>100]#,##0" (Medium)";#,##0" (Small)"', desc: 'Size categories with colors', example: '5,000 (Large, blue) / 500 (Medium, orange) / 50 (Small)' },
    ],
    prefixSuffix: [
      { pattern: '"$"0', desc: 'Currency prefix', example: '$100' },
      { pattern: '0" USD"', desc: 'Currency suffix', example: '100 USD' },
      { pattern: '"$" #,##0.00', desc: 'Currency with space', example: '$ 1,234.50' },
      { pattern: '0" units"', desc: 'Unit suffix', example: '50 units' },
      { pattern: '0" kg"', desc: 'Weight units', example: '75 kg' },
      { pattern: '0" °C"', desc: 'Temperature', example: '25 °C' },
      { pattern: '0" °F"', desc: 'Fahrenheit', example: '77 °F' },
      { pattern: '"Score: "0"/"100', desc: 'Score format', example: 'Score: 85/100' },
      { pattern: '"("0")"', desc: 'Parentheses wrapper', example: '(100)' },
      { pattern: '"Level "0', desc: 'Level prefix', example: 'Level 5' },
      { pattern: '0"x"', desc: 'Multiplication suffix', example: '3x' },
      { pattern: '"+"0;"-"0;"0"', desc: 'Explicit +/- signs', example: '+100 / -50 / 0' },
      { pattern: '#,##0" people"', desc: 'Population count', example: '1,250 people' },
      { pattern: '0.0" hours"', desc: 'Time duration', example: '8.5 hours' },
    ],
    emoji: [
      { pattern: '[>100]"🟢";[>90]"🟡";"🔴"', desc: 'Status indicators only', example: '🟢 / 🟡 / 🔴' },
      { pattern: '[>100]#,##0" 🟢";[>90]#,##0" 🟡";#,##0" 🔴"', desc: 'Value + status emoji', example: '105 🟢 / 95 🟡 / 80 🔴' },
      { pattern: '[>100]"🟢 "#,##0;[>90]"🟡 "#,##0;"🔴 "#,##0', desc: 'Status emoji + value', example: '🟢 105 / 🟡 95 / 🔴 80' },
      { pattern: '[>100]0"% 🟢";[>90]0"% 🟡";0"% 🔴"', desc: 'Percentage with status', example: '105% 🟢 / 95% 🟡 / 80% 🔴' },
      { pattern: '[>0]"📈";[<0]"📉";"➖"', desc: 'Chart trend indicators', example: '📈 / 📉 / ➖' },
      { pattern: '[>0]"📈 +"#,##0;[<0]"📉 "#,##0;"➖ 0"', desc: 'Trend with values', example: '📈 +1,250 / 📉 -500 / ➖ 0' },
      { pattern: '[>=100]"🔥";[>=75]"✨";[>=50]"👍";[>=25]"😐";"👎"', desc: 'Performance ratings', example: '🔥 / ✨ / 👍 / 😐 / 👎' },
      { pattern: '[>=90]"😍";[>=80]"😊";[>=70]"🙂";[>=60]"😐";[>=50]"😕";"😞"', desc: 'Satisfaction scale', example: '😍 / 😊 / 🙂 / 😐 / 😕 / 😞' },
      { pattern: '[>0]"➕ "#,##0;[<0]"➖ "#,##0;"0️⃣"', desc: 'Plus/minus with values', example: '➕ 100 / ➖ 50 / 0️⃣' },
      { pattern: '[>=4]"🌟🌟🌟🌟🌟";[>=3]"🌟🌟🌟🌟⭐";[>=2]"🌟🌟🌟⭐⭐";[>=1]"🌟🌟⭐⭐⭐";"🌟⭐⭐⭐⭐"', desc: '5-star rating with filled/empty stars', example: '🌟🌟🌟🌟🌟 / 🌟🌟🌟🌟⭐' },
      { pattern: '[>1000]"💰💰💰";[>500]"💰💰";[>100]"💰";"💸"', desc: 'Money levels', example: '💰💰💰 / 💰💰 / 💰 / 💸' },
      { pattern: '[>=80]"🎯";[>=60]"🎪";[>=40]"🎨";[>=20]"🎭";"🎲"', desc: 'Achievement levels', example: '🎯 / 🎪 / 🎨 / 🎭 / 🎲' },
      { pattern: '[>0]"🚀 "#,##0" mph";[<0]"🛑 "#,##0" mph";"⏸️ 0 mph"', desc: 'Speed indicators', example: '🚀 65 mph / 🛑 -10 mph / ⏸️ 0 mph' },
      { pattern: '[>=100]"🏆 Champion";[>=90]"🥇 Gold";[>=80]"🥈 Silver";[>=70]"🥉 Bronze";"📝 Participant"', desc: 'Competition results', example: '🏆 Champion / 🥇 Gold / 🥈 Silver / 🥉 Bronze / 📝 Participant' },
      { pattern: '[>90]"🌡️ Hot";[>70]"☀️ Warm";[>50]"🌤️ Mild";[>30]"🌥️ Cool";"❄️ Cold"', desc: 'Temperature ranges', example: '🌡️ Hot / ☀️ Warm / 🌤️ Mild / 🌥️ Cool / ❄️ Cold' },
    ],
    symbols: [
      { pattern: '[>0][Green]"●";[<0][Red]"●";"●"', desc: 'Colored circles (basic)', example: '● (green) / ● (red) / ●' },
      { pattern: '[>0][#00AA00]"◉";[<0][#FF0000]"◉";"◉"', desc: 'Circled dots with hex colors', example: '◉ (green) / ◉ (red) / ◉' },
      { pattern: '[>0]"○";[<0]"●";"◐"', desc: 'Empty/filled circles + half', example: '○ / ● / ◐' },
      { pattern: '[>0][Green]"▲";[<0][Red]"▼";"▬"', desc: 'Triangle arrows', example: '▲ (green) / ▼ (red) / ▬' },
      { pattern: '[>0][#4169E1]"⬆";[<0][#DC143C]"⬇";"➡"', desc: 'Bold arrows with colors', example: '⬆ (blue) / ⬇ (red) / ➡' },
      { pattern: '[>0][Green]"↗";[<0][Red]"↘";"→"', desc: 'Diagonal trend arrows', example: '↗ (green) / ↘ (red) / →' },
      { pattern: '[>=4]"★★★★★";[>=3]"★★★★☆";[>=2]"★★★☆☆";[>=1]"★★☆☆☆";"★☆☆☆☆"', desc: '5-star rating system', example: '★★★★★ / ★★★★☆ / ★★★☆☆' },
      { pattern: '[>=4]"♦♦♦♦♦";[>=3]"♦♦♦♦◇";[>=2]"♦♦♦◇◇";[>=1]"♦♦◇◇◇";"♦◇◇◇◇"', desc: 'Diamond rating system', example: '♦♦♦♦♦ / ♦♦♦♦◇ / ♦♦♦◇◇' },
      { pattern: '[>0][Green]"✓";[<0][Red]"✗";"○"', desc: 'Check/cross marks', example: '✓ (green) / ✗ (red) / ○' },
      { pattern: '[>0][#0080FF]"✔";[<0][#FF4040]"✖";"◯"', desc: 'Bold check/cross with colors', example: '✔ (blue) / ✖ (red) / ◯' },
      { pattern: '[>0][Green]"☑";[<0][Red]"☒";"☐"', desc: 'Checkbox symbols', example: '☑ (green) / ☒ (red) / ☐' },
      { pattern: '[>0]"■";[<0]"□";"▪"', desc: 'Filled/empty squares', example: '■ / □ / ▪' },
      { pattern: '[>0][Green]"▪";[<0][Red]"▫";"▫"', desc: 'Small squares with colors', example: '▪ (green) / ▫ (red) / ▫' },
      { pattern: '[>0][#4169E1]"◆";[<0][#DC143C]"◇";"◈"', desc: 'Diamond shapes', example: '◆ (blue) / ◇ (red) / ◈' },
      { pattern: '[>=80]"█████";[>=60]"████░";[>=40]"███░░";[>=20]"██░░░";"█░░░░"', desc: 'Progress bars (5 levels)', example: '█████ / ████░ / ███░░ / ##░░░ / █░░░░' },
      { pattern: '[>=90]"▓▓▓▓▓▓▓▓▓▓";[>=80]"▓▓▓▓▓▓▓▓░░";[>=70]"▓▓▓▓▓▓▓░░░";[>=60]"▓▓▓▓▓▓░░░░";[>=50]"▓▓▓▓▓░░░░░";"▓▓▓▓░░░░░░"', desc: '10-segment progress bar', example: '▓▓▓▓▓▓▓▓▓▓ / ▓▓▓▓▓▓▓▓░░ / ▓▓▓▓▓▓▓░░░' },
      { pattern: '[>0]"▌";[<0]"▎";"▏"', desc: 'Vertical bars (thickness)', example: '▌ / ▎ / ▏' },
      { pattern: '[>=75]"♠";[>=50]"♣";[>=25]"♥";"♦"', desc: 'Card suit symbols', example: '♠ / ♣ / ♥ / ♦' },
      { pattern: '[>0][Green]"⊕";[<0][Red]"⊖";"⊗"', desc: 'Circled operators', example: '⊕ (green) / ⊖ (red) / ⊗' },
      { pattern: '[>=80]"♨";[>=60]"☀";[>=40]"☁";[>=20]"☂";"❄"', desc: 'Weather symbols by value', example: '♨ / ☀ / ☁ / ☂ / ❄' },
      { pattern: '[>100]"⚡";[>50]"⭐";[>0]"✦";"○"', desc: 'Energy/power levels', example: '⚡ / ⭐ / ✦ / ○' },
    ],
    advanced: [
      { pattern: '0.00E+00', desc: 'Scientific notation', example: '1.23E+03' },
      { pattern: '0.0E+0', desc: 'Scientific notation (short)', example: '1.2E+3' },
      { pattern: '# ?/?', desc: 'Fractions', example: '1 1/2' },
      { pattern: '# ??/??', desc: 'Fractions (auto-denominator)', example: '1 23/64' },
      { pattern: '00000', desc: 'Leading zeros (5 digits)', example: '00123' },
      { pattern: '000-00-0000', desc: 'SSN format with leading zeros', example: '123-45-6789' },
      { pattern: '(000) 000-0000', desc: 'Phone number format', example: '(123) 456-7890' },
      { pattern: '@', desc: 'Text placeholder', example: 'Hello World' },
      { pattern: '"Code: "@', desc: 'Text with prefix', example: 'Code: ABC123' },
      { pattern: '@" (verified)"', desc: 'Text with suffix', example: 'John Smith (verified)' },
      { pattern: '[>999999]#,,"M";[>999]#,"K";#', desc: 'Auto-scale (M/K abbreviation)', example: '1.2M / 250K / 500' },
      { pattern: '[>=1000000000]#,,,"B";[>=1000000]#,,"M";[>=1000]#,"K";#', desc: 'Full scale: B/M/K', example: '1.5B / 250M / 15K / 500' },
      { pattern: '+0;-0;0', desc: 'Show positive/negative signs', example: '+123 / -456 / 0' },
      { pattern: '(0)', desc: 'Negative in parentheses', example: '123 / (456)' },
      { pattern: '0_ ', desc: 'Right-aligned with space padding', example: '123  / 1234 / 12345' },
      { pattern: '_-* #,##0.00_-;_-* -#,##0.00_-;_-* "-"??_-;_-@_-', desc: 'Accounting format (complex)', example: '  $1,234.50  / $(1,234.50) / - / text' },
      { pattern: '[h]:mm:ss', desc: 'Hours > 24 with minutes:seconds', example: '25:30:45' },
      { pattern: 'mm:ss.0', desc: 'Minutes:seconds with decimal', example: '03:45.7' },
      { pattern: 'yyyy-mm-dd', desc: 'ISO date format', example: '2024-12-31' },
      { pattern: 'dddd, mmmm dd, yyyy', desc: 'Full date format', example: 'Monday, December 31, 2024' },
      { pattern: '"Q"q yyyy', desc: 'Quarter format', example: 'Q4 2024' },
      { pattern: 'ww', desc: 'Week number', example: '52' },
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
                      <CardDescription>Complete reference guide</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs space-y-3">
                      <div>
                        <p className="font-medium mb-2">Basic Number Formatting:</p>
                        <p><strong>0</strong> - Display digit or 0 (required digit)</p>
                        <p><strong>#</strong> - Display digit or nothing (optional digit)</p>
                        <p><strong>,</strong> - Thousands separator</p>
                        <p><strong>.</strong> - Decimal point</p>
                        <p><strong>%</strong> - Percentage (multiply by 100)</p>
                        <p><strong>E+, E-</strong> - Scientific notation</p>
                        <p><strong>"text"</strong> - Display literal text</p>
                        <p><strong>@</strong> - Text placeholder</p>
                      </div>
                      <Separator className="my-3" />
                      <div>
                        <p className="font-medium mb-2">Conditional Formatting Syntax:</p>
                        <p><strong>[condition]</strong> - Apply format if condition is true</p>
                        <p><strong>Operators:</strong> <code className="bg-muted px-1">&gt;</code>, <code className="bg-muted px-1">&lt;</code>, <code className="bg-muted px-1">&gt;=</code>, <code className="bg-muted px-1">&lt;=</code>, <code className="bg-muted px-1">=</code></p>
                        <p><strong>Examples:</strong></p>
                        <p className="ml-4">• <code className="bg-muted px-1">[&gt;100]</code> - Values greater than 100</p>
                        <p className="ml-4">• <code className="bg-muted px-1">[&lt;=50]</code> - Values 50 or less</p>
                        <p className="ml-4">• <code className="bg-muted px-1">[=0]</code> - Values equal to zero</p>
                        <p><strong>Multiple conditions:</strong> Use semicolon to separate sections</p>
                        <p className="ml-4">• <code className="bg-muted px-1">[&gt;100]"High";[&gt;50]"Medium";"Low"</code></p>
                      </div>
                      <Separator className="my-3" />
                      <div>
                        <p className="font-medium mb-2">Color Formatting:</p>
                        <p><strong>Named colors:</strong> [Red], [Green], [Blue], [Yellow], [Orange], [Purple], [Black], [White]</p>
                        <p><strong>Hex colors:</strong> [#FF0000] for red, [#00FF00] for green, [#0080FF] for blue</p>
                        <p><strong>RGB examples:</strong></p>
                        <p className="ml-4">• <code className="bg-muted px-1">[#FF6347]</code> - Tomato red</p>
                        <p className="ml-4">• <code className="bg-muted px-1">[#32CD32]</code> - Lime green</p>
                        <p className="ml-4">• <code className="bg-muted px-1">[#FFD700]</code> - Gold</p>
                        <p className="ml-4">• <code className="bg-muted px-1">[#FF1493]</code> - Deep pink</p>
                      </div>
                      <Separator className="my-3" />
                      <div>
                        <p className="font-medium mb-2">Section Structure:</p>
                        <p><strong>;</strong> - Section separator (positive;negative;zero;text)</p>
                        <p><strong>Format order:</strong></p>
                        <p className="ml-4">1. Positive numbers</p>
                        <p className="ml-4">2. Negative numbers</p>
                        <p className="ml-4">3. Zero values</p>
                        <p className="ml-4">4. Text values</p>
                        <p><strong>Example:</strong> <code className="bg-muted px-1">[Green]#,##0;[Red]-#,##0;[Blue]"Zero";[Purple]@</code></p>
                      </div>
                      <Separator className="my-3" />
                      <div>
                        <p className="font-medium mb-2">Scaling & Abbreviations:</p>
                        <p><strong>,</strong> - Each comma after number divides by 1,000</p>
                        <p className="ml-4">• <code className="bg-muted px-1">#,##0,</code> - Thousands (1234 → 1.234)</p>
                        <p className="ml-4">• <code className="bg-muted px-1">#,##0,,</code> - Millions (1234567 → 1.234567)</p>
                        <p className="ml-4">• <code className="bg-muted px-1">#,##0,,,</code> - Billions</p>
                        <p><strong>With text:</strong> <code className="bg-muted px-1">#,##0,"K"</code> displays 1234 as "1.234K"</p>
                      </div>
                      <Separator className="my-3" />
                      <div>
                        <p className="font-medium mb-2">Unicode Symbols Guide:</p>
                        <p><strong>Circles:</strong> ● ○ ◉ ◎ ⊙ ⊚ ⊛ ◐ ◑ ◒ ◓</p>
                        <p><strong>Squares:</strong> ■ □ ▪ ▫ ◼ ◻ ▰ ▱ ⬛ ⬜</p>
                        <p><strong>Arrows:</strong> ↑ ↓ → ← ↔ ⬆ ⬇ ➡ ⬅ ↗ ↘ ↙ ↖</p>
                        <p><strong>Triangles:</strong> ▲ ▼ ▶ ◀ △ ▽ ▷ ◁</p>
                        <p><strong>Stars:</strong> ★ ☆ ✦ ✧ ⭐ 🌟 ⋆ ✪ ✫</p>
                        <p><strong>Marks:</strong> ✓ ✗ ✔ ✖ ☑ ☒ ⊕ ⊖ ⊗ ⊘</p>
                        <p><strong>Diamonds:</strong> ◆ ◇ ◈ ⬧ ⬦ ♦</p>
                        <p><strong>Progress bars:</strong> █ ▉ ▊ ▋ ▌ ▍ ▎ ▏ ░ ▒ ▓</p>
                        <p><strong>Card suits:</strong> ♠ ♣ ♥ ♦</p>
                        <p><strong>Weather:</strong> ☀ ☁ ☂ ☃ ❄ ⛅ ⛈ 🌧 🌩 ♨</p>
                        <p><strong>Music:</strong> ♪ ♫ ♬ ♭ ♮ ♯</p>
                        <p><strong>Math:</strong> ± × ÷ ≈ ≠ ≤ ≥ ∞ ∑ ∆</p>
                      </div>
                      <Separator className="my-3" />
                      <div>
                        <p className="font-medium mb-2">Emoji Categories:</p>
                        <p><strong>Status:</strong> 🟢 🟡 🔴 ✅ ❌ ⚠️ 🚫</p>
                        <p><strong>Trends:</strong> 📈 📉 📊 ➖ ⬆️ ⬇️ ↗️ ↘️</p>
                        <p><strong>Performance:</strong> 🔥 ✨ 👍 👎 💯 🎯 ⭐</p>
                        <p><strong>Money:</strong> 💰 💸 💵 💳 💎 🏦</p>
                        <p><strong>Achievement:</strong> 🏆 🥇 🥈 🥉 🎖️ 🏅</p>
                        <p><strong>Emotions:</strong> 😍 😊 🙂 😐 😕 😞 😢</p>
                        <p><strong>Objects:</strong> 🚀 🛑 ⏸️ ⏯️ 🔋 📱 💻</p>
                        <p><strong>Nature:</strong> 🌡️ ☀️ 🌤️ 🌥️ ❄️ 🌊 🔥</p>
                      </div>
                      <Separator className="my-3" />
                      <div>
                        <p className="font-medium mb-2">Special Formatting Tips:</p>
                        <p><strong>Text alignment:</strong> Use <code className="bg-muted px-1">_</code> for space padding</p>
                        <p><strong>Repeating characters:</strong> Use <code className="bg-muted px-1">*</code> before character</p>
                        <p><strong>Force text:</strong> Prefix with <code className="bg-muted px-1">@</code> for text treatment</p>
                        <p><strong>Hide sections:</strong> Use <code className="bg-muted px-1">;;;</code> to hide certain value types</p>
                        <p><strong>Date/Time codes:</strong> yyyy, mm, dd, hh, mm, ss for date/time formatting</p>
                        <p><strong>Escape quotes:</strong> Use <code className="bg-muted px-1">""</code> to include literal quotes</p>
                      </div>
                      <Separator className="my-3" />
                      <div>
                        <p className="font-medium mb-2">Pro Tips:</p>
                        <p>• Combine conditions with colors for powerful visual indicators</p>
                        <p>• Use emojis sparingly for maximum impact</p>
                        <p>• Test your formats with different value ranges</p>
                        <p>• Consider mobile/accessibility when using symbols</p>
                        <p>• Unicode symbols work great for dashboards and KPIs</p>
                        <p>• Use the preview panel to test before applying</p>
                      </div>
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