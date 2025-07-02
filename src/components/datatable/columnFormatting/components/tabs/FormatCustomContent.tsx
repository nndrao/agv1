import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles,
  X,
  HelpCircle,
  Smile,
  Palette,
  RotateCcw
} from 'lucide-react';
import { useColumnFormattingStore } from '../../store/columnFormatting.store';
import { createExcelFormatter, createCellStyleFunction } from '@/components/datatable/utils/formatters';
import { cn } from '@/lib/utils';
import { 
  standardFormats, 
  customFormats, 
  dateFormats, 
  currencySymbols, 
  commonEmoji 
} from '../../constants/formatTemplates';
import type { FormatTabProps } from '../../types';
import type { SelectOption } from '../common';
import '../../custom-styles.css';

type FormatMode = 'standard' | 'custom';

export const FormatCustomContent: React.FC<FormatTabProps> = ({ 
  selectedColumns,
  setCurrentFormat
}) => {
  const { 
    updateBulkProperty,
    columnDefinitions,
    pendingChanges
  } = useColumnFormattingStore();
  const [formatMode, setFormatMode] = useState<FormatMode>('standard');
  const [selectedStandardFormat, setSelectedStandardFormat] = useState<string>('number');
  const [selectedCustomFormat, setSelectedCustomFormat] = useState<string>('');
  
  // Standard format controls
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [multiplyBy100, setMultiplyBy100] = useState(true);
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [useThousandsSeparator, setUseThousandsSeparator] = useState(true);
  const [useColorForSign, setUseColorForSign] = useState(false);
  
  // Custom format controls
  const [manualFormat, setManualFormat] = useState('');
  const [previewValue, setPreviewValue] = useState('1234.56');
  const [emojiPopoverOpen, setEmojiPopoverOpen] = useState(false);

  // Track if component is mounted
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Track if we're hydrating to prevent auto-apply
  const [isHydrating, setIsHydrating] = useState(false);

  const selectedFormat = standardFormats.find(f => f.key === selectedStandardFormat);

  // Build format string based on current selections
  const buildFormatString = useCallback(() => {
    if (formatMode === 'custom' && manualFormat) {
      return manualFormat;
    }
    
    if (formatMode === 'custom' && selectedCustomFormat) {
      const customFormat = customFormats.find(f => f.label === selectedCustomFormat);
      return customFormat?.format || '';
    }
    
    // Build standard format
    let format = '';
    
    switch (selectedStandardFormat) {
      case 'number':
        const decimalPart = decimalPlaces > 0 ? '.' + '0'.repeat(decimalPlaces) : '';
        const numberFormat = useThousandsSeparator ? '#,##0' : '0';
        
        if (useColorForSign) {
          format = `[Green][>0]${prefix}${numberFormat}${decimalPart}${suffix};[Red][<0]${prefix}${numberFormat}${decimalPart}${suffix};${prefix}${numberFormat}${decimalPart}${suffix}`;
        } else {
          format = `${prefix}${numberFormat}${decimalPart}${suffix}`;
        }
        break;
        
      case 'currency':
        const currencyDecimals = decimalPlaces > 0 ? '.' + '0'.repeat(decimalPlaces) : '';
        const currencyFormat = useThousandsSeparator ? '#,##0' : '0';
        
        if (useColorForSign) {
          format = `[Green][>0]"${currencySymbol} "${currencyFormat}${currencyDecimals};[Red][<0]"${currencySymbol} "${currencyFormat}${currencyDecimals};"${currencySymbol} "${currencyFormat}${currencyDecimals}`;
        } else {
          format = `"${currencySymbol} "${currencyFormat}${currencyDecimals}`;
        }
        break;
        
      case 'percentage':
        const percentDecimals = decimalPlaces > 0 ? '.' + '0'.repeat(decimalPlaces) : '';
        format = `0${percentDecimals}%`;
        break;
        
      case 'date':
        format = dateFormat;
        break;
        
      case 'text':
        format = '@';
        break;
    }
    
    return format;
  }, [formatMode, selectedStandardFormat, decimalPlaces, prefix, suffix, currencySymbol, 
      dateFormat, useThousandsSeparator, useColorForSign, manualFormat, selectedCustomFormat]);

  // Initialize on mount
  useEffect(() => {
    setIsInitialized(true);
    return () => setIsInitialized(false);
  }, []);

  // Apply format when settings change (but not on initial mount or during hydration)
  useEffect(() => {
    if (!isInitialized || isHydrating) return;
    
    const formatString = buildFormatString();
    
    if (formatString && selectedColumns.size > 0) {
      // Create formatter function
      const formatter = createExcelFormatter(formatString);
      updateBulkProperty('valueFormatter', formatter);
      
      // If format has color directives, also create cellStyle
      if (formatString.includes('[Red]') || formatString.includes('[Green]') || 
          formatString.includes('[Blue]') || formatString.includes('[Yellow]') ||
          formatString.includes('[BG:') || formatString.includes('[Background:')) {
        // We need to get the base style but avoid circular dependency
        // Use a timeout to break the synchronous update cycle
        setTimeout(() => {
          const { columnDefinitions, pendingChanges } = useColumnFormattingStore.getState();
          let baseStyle: React.CSSProperties = {};
          
          // Get existing cellStyle from the first selected column
          const firstColId = Array.from(selectedColumns)[0];
          if (firstColId) {
            const colDef = columnDefinitions.get(firstColId);
            const pendingChange = pendingChanges.get(firstColId);
            const existingCellStyle = pendingChange?.cellStyle || colDef?.cellStyle;
            
            if (existingCellStyle && typeof existingCellStyle === 'function') {
              baseStyle = (existingCellStyle as any).__baseStyle || {};
            } else if (existingCellStyle && typeof existingCellStyle === 'object') {
              baseStyle = existingCellStyle;
            }
          }
          
          const cellStyleFn = createCellStyleFunction(formatString, baseStyle);
          updateBulkProperty('cellStyle', cellStyleFn);
        }, 0);
      }
      
      setCurrentFormat?.(formatString);
    }
  }, [
    selectedStandardFormat,
    decimalPlaces,
    prefix,
    suffix,
    currencySymbol,
    dateFormat,
    useThousandsSeparator,
    useColorForSign,
    multiplyBy100,
    manualFormat,
    selectedCustomFormat,
    formatMode,
    selectedColumns.size,
    isInitialized,
    buildFormatString,
    updateBulkProperty,
    setCurrentFormat
  ]);

  // Parse format string and apply settings
  const parseAndApplyFormatString = useCallback((formatString: string) => {
    // Check if it's a custom format
    const customFormat = customFormats.find(f => f.format === formatString);
    if (customFormat) {
      setFormatMode('custom');
      setSelectedCustomFormat(customFormat.label);
      setManualFormat('');
      return;
    }
    
    // Try to parse standard formats
    // Number format with color: [Green][>0]#,##0.00;[Red][<0]#,##0.00;#,##0.00
    if (formatString.includes('[Green]') || formatString.includes('[Red]')) {
      setUseColorForSign(true);
    }
    
    // Currency format: "$ "#,##0.00
    if (formatString.includes('"$') || formatString.includes('"€') || formatString.includes('"£')) {
      setSelectedStandardFormat('currency');
      const currencyMatch = formatString.match(/"([^"]+)"/);
      if (currencyMatch) {
        setCurrencySymbol(currencyMatch[1].trim());
      }
    }
    // Percentage format
    else if (formatString.endsWith('%')) {
      setSelectedStandardFormat('percentage');
    }
    // Date format
    else if (formatString.includes('MM') || formatString.includes('DD') || formatString.includes('YYYY')) {
      setSelectedStandardFormat('date');
      setDateFormat(formatString);
    }
    // Default to number
    else {
      setSelectedStandardFormat('number');
    }
    
    // Extract decimal places
    const decimalMatch = formatString.match(/\.(\d+)/);
    if (decimalMatch) {
      setDecimalPlaces(decimalMatch[1].length);
    }
    
    // Check for thousands separator
    setUseThousandsSeparator(formatString.includes('#,##'));
    
    // Extract prefix/suffix
    const prefixMatch = formatString.match(/^"([^"]+)"/);
    const suffixMatch = formatString.match(/"([^"]+)"$/);
    if (prefixMatch && !formatString.includes('"$')) {
      setPrefix(prefixMatch[1]);
    }
    if (suffixMatch && !formatString.includes('%')) {
      setSuffix(suffixMatch[1]);
    }
    
    // If we can't parse it, treat it as a custom manual format
    if (!customFormat && selectedStandardFormat === 'number' && !formatString.includes('#')) {
      setFormatMode('custom');
      setManualFormat(formatString);
    }
    
    // For percentage, check if it multiplies by 100
    if (formatString.includes('%')) {
      // If format has *100, then multiplyBy100 should be false
      setMultiplyBy100(!formatString.includes('*100'));
    }
  }, []);

  // Hydrate format settings from selected columns
  useEffect(() => {
    if (selectedColumns.size === 0 || columnDefinitions.size === 0) return;
    
    setIsHydrating(true);
    
    // Get format string from the first selected column
    const firstColId = Array.from(selectedColumns)[0];
    const colDef = columnDefinitions.get(firstColId);
    const changes = pendingChanges.get(firstColId) || {};
    
    const existingFormatter = changes.valueFormatter !== undefined 
      ? changes.valueFormatter 
      : colDef?.valueFormatter;
    
    if (existingFormatter && typeof existingFormatter === 'function') {
      const formatString = (existingFormatter as any).__formatString;
      
      if (formatString) {
        // Parse the format string to determine settings
        parseAndApplyFormatString(formatString);
      }
    }
    
    setTimeout(() => {
      setIsHydrating(false);
    }, 0);
  }, [selectedColumns, columnDefinitions, pendingChanges, parseAndApplyFormatString]);

  // Clear format
  const clearFormat = () => {
    updateBulkProperty('valueFormatter', undefined);
    setCurrentFormat?.('');
  };

  // Reset all format settings
  const resetFormatSettings = () => {
    setSelectedStandardFormat('number');
    setDecimalPlaces(2);
    setPrefix('');
    setSuffix('');
    setCurrencySymbol('$');
    setDateFormat('MM/DD/YYYY');
    setUseThousandsSeparator(true);
    setUseColorForSign(false);
    setMultiplyBy100(true);
    setManualFormat('');
    setSelectedCustomFormat('');
    clearFormat();
  };

  // Convert options for CustomSelect
  const formatOptions: SelectOption[] = standardFormats.map(f => ({
    value: f.key,
    label: f.label,
    icon: f.icon
  }));

  const currencyOptions: SelectOption[] = currencySymbols.map(s => ({
    value: s.value,
    label: s.label
  }));

  const dateFormatOptions: SelectOption[] = dateFormats.map(d => ({
    value: d.value,
    label: d.label
  }));

  return (
    <div className="flex h-full gap-4">
      {/* Main controls section */}
      <div className="flex-1">
        {/* Format Mode Toggle and Action Buttons */}
        <div className="flex items-center justify-between mb-3">
          <ToggleGroup 
            type="single" 
            value={formatMode}
            onValueChange={(value) => value && setFormatMode(value as FormatMode)}
            className="flex"
          >
            <ToggleGroupItem value="standard" className="ribbon-toggle-group-item">
              <Palette className="ribbon-icon-xs mr-1" />
              Standard
            </ToggleGroupItem>
            <ToggleGroupItem value="custom" className="ribbon-toggle-group-item">
              <Sparkles className="ribbon-icon-xs mr-1" />
              Custom
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={clearFormat}
              title="Clear format"
            >
              <X className="ribbon-icon-xs mr-1" />
              Clear
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={resetFormatSettings}
              title="Reset all"
            >
              <RotateCcw className="ribbon-icon-xs mr-1" />
              Reset All
            </Button>
          </div>
        </div>

        {/* Standard Format Controls - Grid Layout */}
        {formatMode === 'standard' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              {/* Format Type */}
              <div className="space-y-1">
                <Label className="ribbon-section-header">FORMAT TYPE</Label>
                <Select value={selectedStandardFormat} onValueChange={setSelectedStandardFormat}>
                  <SelectTrigger className="h-7 w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            {Icon && <Icon className="h-3 w-3" />}
                            {opt.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Context-specific controls */}
              {selectedFormat?.controls === 'number' && (
                <>
                  {/* Decimals */}
                  <div className="space-y-1">
                    <Label className="ribbon-section-header">DECIMALS</Label>
                    <Select value={decimalPlaces.toString()} onValueChange={(v) => setDecimalPlaces(Number(v))}>
                      <SelectTrigger className="h-7 w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0,1,2,3,4,5,6,7,8,9,10].map(d => (
                          <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Prefix */}
                  <div className="space-y-1">
                    <Label className="ribbon-section-header">PREFIX</Label>
                    <Input
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      placeholder="e.g., $"
                      className="h-7 text-xs"
                    />
                  </div>

                  {/* Suffix */}
                  <div className="space-y-1">
                    <Label className="ribbon-section-header">SUFFIX</Label>
                    <Input
                      value={suffix}
                      onChange={(e) => setSuffix(e.target.value)}
                      placeholder="e.g., USD"
                      className="h-7 text-xs"
                    />
                  </div>

                  {/* Switches */}
                  <div className="col-span-2 flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="thousands-separator"
                        checked={useThousandsSeparator}
                        onCheckedChange={setUseThousandsSeparator}
                        className="h-4 w-7"
                      />
                      <Label htmlFor="thousands-separator" className="text-xs cursor-pointer">
                        Thousands separator
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="color-sign"
                        checked={useColorForSign}
                        onCheckedChange={setUseColorForSign}
                        className="h-4 w-7"
                      />
                      <Label htmlFor="color-sign" className="text-xs cursor-pointer">
                        +/- colors
                      </Label>
                    </div>
                  </div>
                </>
              )}

              {selectedFormat?.controls === 'currency' && (
                <>
                  {/* Currency Symbol */}
                  <div className="space-y-1">
                    <Label className="ribbon-section-header">SYMBOL</Label>
                    <Select value={currencySymbol} onValueChange={setCurrencySymbol}>
                      <SelectTrigger className="h-7 w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Decimals */}
                  <div className="space-y-1">
                    <Label className="ribbon-section-header">DECIMALS</Label>
                    <Select value={decimalPlaces.toString()} onValueChange={(v) => setDecimalPlaces(Number(v))}>
                      <SelectTrigger className="h-7 w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0,1,2,3,4,5,6,7,8,9,10].map(d => (
                          <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Switches */}
                  <div className="col-span-3 flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="currency-thousands"
                        checked={useThousandsSeparator}
                        onCheckedChange={setUseThousandsSeparator}
                        className="h-4 w-7"
                      />
                      <Label htmlFor="currency-thousands" className="text-xs cursor-pointer">
                        Thousands separator
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="currency-colors"
                        checked={useColorForSign}
                        onCheckedChange={setUseColorForSign}
                        className="h-4 w-7"
                      />
                      <Label htmlFor="currency-colors" className="text-xs cursor-pointer">
                        +/- colors
                      </Label>
                    </div>
                  </div>
                </>
              )}

              {selectedFormat?.controls === 'percentage' && (
                <>
                  {/* Decimals */}
                  <div className="space-y-1">
                    <Label className="ribbon-section-header">DECIMALS</Label>
                    <Select value={decimalPlaces.toString()} onValueChange={(v) => setDecimalPlaces(Number(v))}>
                      <SelectTrigger className="h-7 w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0,1,2,3,4,5,6,7,8,9,10].map(d => (
                          <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Multiply by 100 switch */}
                  <div className="col-span-2 flex items-center gap-2">
                    <Switch
                      id="multiply-100"
                      checked={multiplyBy100}
                      onCheckedChange={setMultiplyBy100}
                      className="h-4 w-7"
                    />
                    <Label htmlFor="multiply-100" className="text-xs cursor-pointer">
                      Multiply by 100
                    </Label>
                  </div>
                </>
              )}

              {selectedFormat?.controls === 'date' && (
                <>
                  {/* Date Format */}
                  <div className="col-span-2 space-y-1">
                    <Label className="ribbon-section-header">DATE FORMAT</Label>
                    <Select value={dateFormat} onValueChange={setDateFormat}>
                      <SelectTrigger className="h-7 w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dateFormatOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

            </div>

            {/* Quick test values for standard format */}
            <div className="flex items-center gap-2 pt-2">
              <Label className="text-xs text-muted-foreground">Quick test:</Label>
              {['1234567.89', '-5000', '0', '0.5'].map(val => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setPreviewValue(val)}
                >
                  {val}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Format Controls */}
        {formatMode === 'custom' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {/* Template Selector */}
              <div className="space-y-1">
                <Label className="ribbon-section-header">TEMPLATE</Label>
                <Select 
                  value={selectedCustomFormat || 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setSelectedCustomFormat('');
                      return;
                    }
                    setSelectedCustomFormat(value);
                    const format = customFormats.find(f => f.label === value);
                    if (format) {
                      setManualFormat(format.format);
                    }
                  }}
                >
                  <SelectTrigger className="h-7 w-full text-xs">
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a template...</SelectItem>
                    {customFormats.map(f => (
                      <SelectItem key={f.label} value={f.label}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Format String Editor */}
              <div className="space-y-1">
                <Label className="ribbon-section-header">FORMAT STRING</Label>
                <div className="flex gap-1">
                  <Input
                    value={manualFormat}
                    onChange={(e) => setManualFormat(e.target.value)}
                    placeholder="Enter custom format..."
                    className="h-7 text-xs font-mono flex-1"
                  />
                  <Popover open={emojiPopoverOpen} onOpenChange={setEmojiPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Insert emoji"
                      >
                        <Smile className="w-3 h-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" side="bottom" align="end">
                      <div className="grid grid-cols-5 gap-1">
                        {commonEmoji.map(({ emoji, name }) => (
                          <Button
                            key={emoji}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-sm"
                            onClick={() => {
                              setManualFormat(prev => prev + emoji);
                              setEmojiPopoverOpen(false);
                            }}
                            title={name}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Format guide"
                      >
                        <HelpCircle className="w-3 h-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" side="bottom" align="end">
                      <div className="p-3 border-b">
                        <h3 className="font-semibold text-sm">Excel Format Guide</h3>
                      </div>
                      <ScrollArea className="h-[300px]">
                        <div className="p-3 space-y-3 text-xs">
                          <div>
                            <h4 className="font-medium mb-1">Basic Syntax</h4>
                            <div className="bg-muted p-2 rounded font-mono text-[10px]">
                              [condition]format;[condition]format;default
                            </div>
                            <p className="text-muted-foreground mt-1 text-[10px]">
                              Up to 4 sections: positive; negative; zero; text
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium mb-1">Conditions</h4>
                            <div className="space-y-0.5 text-[10px]">
                              <div><code className="bg-muted px-1">[&gt;100]</code> Greater than 100</div>
                              <div><code className="bg-muted px-1">[&lt;0]</code> Less than 0</div>
                              <div><code className="bg-muted px-1">[=50]</code> Equal to 50</div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-1">Colors</h4>
                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                              <div><code className="bg-muted px-1">[Red]</code> Red text</div>
                              <div><code className="bg-muted px-1">[Green]</code> Green text</div>
                              <div><code className="bg-muted px-1">[Blue]</code> Blue text</div>
                              <div><code className="bg-muted px-1">[Yellow]</code> Yellow text</div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-1">Number Formats</h4>
                            <div className="space-y-0.5 text-[10px]">
                              <div><code className="bg-muted px-1">0</code> Display digit or 0</div>
                              <div><code className="bg-muted px-1">#</code> Display digit if present</div>
                              <div><code className="bg-muted px-1">,</code> Thousand separator</div>
                              <div><code className="bg-muted px-1">.</code> Decimal point</div>
                              <div><code className="bg-muted px-1">%</code> Multiply by 100 and add %</div>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Format Examples */}
            <div className="mt-3">
              <Label className="ribbon-section-header mb-2 block">FORMAT EXAMPLES</Label>
              <div className="grid grid-cols-3 gap-2">
                {customFormats.slice(0, 6).map((format) => (
                  <Button
                    key={format.label}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "relative h-[72px] px-3 py-2 text-xs hover:bg-muted/50 hover:border-primary/50 transition-all duration-200 group",
                      selectedCustomFormat === format.label && "border-primary bg-primary/10"
                    )}
                    onClick={() => {
                      setSelectedCustomFormat(format.label);
                      setManualFormat(format.format);
                    }}
                  >
                    <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
                      <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                        {format.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {format.example}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick test values for custom format */}
            <div className="flex items-center gap-2 pt-2">
              <Label className="text-xs text-muted-foreground">Quick test:</Label>
              {['45', '75', '95', '0', '-10'].map(val => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setPreviewValue(val)}
                >
                  {val}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview section */}
      <div className="w-48 border-l pl-3">
        <Label className="ribbon-section-header mb-2 block">PREVIEW</Label>
        <div className="space-y-3">
          {/* Input for testing */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">Test Value</Label>
            <Input
              value={previewValue}
              onChange={(e) => setPreviewValue(e.target.value)}
              className="h-7 text-xs font-mono"
              placeholder="Enter test value"
            />
          </div>

          {/* Preview output */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">Formatted Output</Label>
            <div className="p-2 border rounded bg-muted/20 min-h-[32px] flex items-center">
              <div className="text-sm font-mono">
                {(() => {
                  try {
                    let formatString = '';
                    if (formatMode === 'custom') {
                      // Use manual format if available, otherwise use selected template format
                      if (manualFormat) {
                        formatString = manualFormat;
                      } else if (selectedCustomFormat) {
                        const format = customFormats.find(f => f.label === selectedCustomFormat);
                        formatString = format?.format || '';
                      }
                    } else {
                      formatString = buildFormatString();
                    }
                    
                    if (formatString) {
                      // Parse the preview value as a number for numeric formats
                      let valueToFormat = previewValue;
                      const numericValue = parseFloat(previewValue);
                      
                      // If the format has numeric conditions, use the numeric value
                      if (formatString.includes('<') || formatString.includes('>') || formatString.includes('=')) {
                        if (!isNaN(numericValue)) {
                          valueToFormat = numericValue.toString();
                        }
                      }
                      
                      const formatter = createExcelFormatter(formatString);
                      const result = formatter({ value: valueToFormat } as any);
                      
                      // Check if the result contains color directives that weren't processed
                      if (result.includes('[Red]') || result.includes('[Green]') || result.includes('[Blue]') || result.includes('[Yellow]')) {
                        // Extract color and value - case insensitive match
                        const colorMatch = result.match(/\[(Red|Green|Blue|Yellow)\](.*)/i);
                        if (colorMatch) {
                          const color = colorMatch[1].toLowerCase();
                          const text = colorMatch[2];
                          
                          // Check if we're in dark mode
                          const isDarkMode = document.documentElement.classList.contains('dark');
                          
                          // Use same color values as formatters.ts for consistency
                          const darkModeColors: Record<string, string> = {
                            red: '#FF6B6B',    // Brighter red for dark mode
                            green: '#14B8A6',  // Bright teal for dark mode
                            blue: '#339AF0',   // Brighter blue for dark mode
                            yellow: '#FFD43B'  // Adjusted yellow for dark mode
                          };
                          
                          const lightModeColors: Record<string, string> = {
                            red: '#DC2626',    // Darker red for light mode
                            green: '#0F766E',  // Dark teal for light mode
                            blue: '#2563EB',   // Darker blue for light mode
                            yellow: '#D97706'  // Darker yellow for light mode
                          };
                          
                          const colorMap = isDarkMode ? darkModeColors : lightModeColors;
                          return <span style={{ color: colorMap[color] }}>{text}</span>;
                        }
                      }
                      
                      return result;
                    }
                    return previewValue;
                  } catch (error) {
                    console.error('Format preview error:', error);
                    return previewValue;
                  }
                })()}
              </div>
            </div>
          </div>

          {/* Format string display */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">Format String</Label>
            <div className="p-2 border rounded bg-muted/10">
              <code className="text-[10px] font-mono text-muted-foreground break-all">
                {(() => {
                  if (formatMode === 'custom') {
                    if (manualFormat) {
                      return manualFormat;
                    } else if (selectedCustomFormat) {
                      const format = customFormats.find(f => f.label === selectedCustomFormat);
                      return format?.format || '';
                    }
                    return '';
                  }
                  return buildFormatString();
                })()}
              </code>
            </div>
          </div>

          {/* Active format type */}
          <div className="text-[10px] text-muted-foreground pt-1 border-t">
            Mode: <span className="font-medium text-foreground">{formatMode === 'standard' ? 'Standard' : 'Custom'}</span>
            {formatMode === 'standard' && (
              <>
                <br />Type: <span className="font-medium text-foreground">{selectedFormat?.label}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};