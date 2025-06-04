import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Percent, 
  Hash, 
  Calendar, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  Palette, 
  Check, 
  Copy 
} from 'lucide-react';

interface FormatWizardProps {
  onFormatChange: (format: string) => void;
  initialFormat?: string;
  dataType?: 'number' | 'text' | 'date' | 'boolean';
}

export const FormatWizard: React.FC<FormatWizardProps> = ({
  onFormatChange,
  initialFormat = '',
  dataType = 'number'
}) => {
  const [activeTab, setActiveTab] = useState('number');
  const [numberFormat, setNumberFormat] = useState({
    prefix: '',
    suffix: '',
    thousandsSeparator: true,
    decimalPlaces: 2,
    showNegativeInRed: false,
    useParentheses: false
  });
  
  const [currencyFormat, setCurrencyFormat] = useState({
    symbol: '$',
    position: 'before',
    decimalPlaces: 2,
    showNegativeInRed: true,
    useParentheses: true
  });
  
  const [percentFormat, setPercentFormat] = useState({
    decimalPlaces: 2,
    showSymbol: true,
    showNegativeInRed: true
  });
  
  const [conditionalFormat, setConditionalFormat] = useState({
    condition: 'greater',
    threshold: '0',
    aboveColor: 'Green',
    belowColor: 'Red',
    equalColor: 'Blue',
    showSymbols: true
  });
  
  const [dateFormat, setDateFormat] = useState({
    format: 'MM/DD/YYYY'
  });
  
  const [customFormat, setCustomFormat] = useState(initialFormat || '');
  
  // Generate format string based on current settings
  const generateNumberFormat = () => {
    let format = '';
    
    // Add prefix if specified
    if (numberFormat.prefix) {
      format += `"${numberFormat.prefix}"`;
    }
    
    // Add number format
    format += numberFormat.thousandsSeparator ? '#,##0' : '0';
    
    // Add decimal places if > 0
    if (numberFormat.decimalPlaces > 0) {
      format += '.';
      for (let i = 0; i < numberFormat.decimalPlaces; i++) {
        format += '0';
      }
    }
    
    // Add suffix if specified
    if (numberFormat.suffix) {
      format += `"${numberFormat.suffix}"`;
    }
    
    // Handle negative numbers
    if (numberFormat.showNegativeInRed || numberFormat.useParentheses) {
      const positiveFormat = format;
      let negativeFormat = '';
      
      if (numberFormat.showNegativeInRed) {
        negativeFormat += '[Red]';
      }
      
      if (numberFormat.useParentheses) {
        negativeFormat += '(';
        negativeFormat += positiveFormat;
        negativeFormat += ')';
      } else {
        negativeFormat += '-';
        negativeFormat += positiveFormat;
      }
      
      format = `${positiveFormat};${negativeFormat}`;
    }
    
    return format;
  };
  
  const generateCurrencyFormat = () => {
    let format = '';
    
    // Add currency symbol
    if (currencyFormat.position === 'before') {
      format += `"${currencyFormat.symbol}"`;
    }
    
    // Add number format
    format += '#,##0';
    
    // Add decimal places if > 0
    if (currencyFormat.decimalPlaces > 0) {
      format += '.';
      for (let i = 0; i < currencyFormat.decimalPlaces; i++) {
        format += '0';
      }
    }
    
    // Add currency symbol if after
    if (currencyFormat.position === 'after') {
      format += `"${currencyFormat.symbol}"`;
    }
    
    // Handle negative numbers
    if (currencyFormat.showNegativeInRed || currencyFormat.useParentheses) {
      const positiveFormat = format;
      let negativeFormat = '';
      
      if (currencyFormat.showNegativeInRed) {
        negativeFormat += '[Red]';
      }
      
      if (currencyFormat.useParentheses) {
        negativeFormat += '(';
        negativeFormat += positiveFormat;
        negativeFormat += ')';
      } else {
        negativeFormat += '-';
        negativeFormat += positiveFormat;
      }
      
      format = `${positiveFormat};${negativeFormat}`;
    }
    
    return format;
  };
  
  const generatePercentFormat = () => {
    let format = '';
    
    // Add number format
    format += '0';
    
    // Add decimal places if > 0
    if (percentFormat.decimalPlaces > 0) {
      format += '.';
      for (let i = 0; i < percentFormat.decimalPlaces; i++) {
        format += '0';
      }
    }
    
    // Add percent symbol
    if (percentFormat.showSymbol) {
      format += '%';
    }
    
    // Handle negative numbers
    if (percentFormat.showNegativeInRed) {
      format = `${format};[Red]-${format}`;
    }
    
    return format;
  };
  
  const generateConditionalFormat = () => {
    let format = '';
    
    // Build condition
    const condition = conditionalFormat.condition;
    const threshold = conditionalFormat.threshold;
    
    // Above threshold format
    if (condition === 'greater' || condition === 'not-equal') {
      format += `[>${threshold}]`;
      if (conditionalFormat.aboveColor) {
        format += `[${conditionalFormat.aboveColor}]`;
      }
      if (conditionalFormat.showSymbols) {
        format += '"↑ "';
      }
      format += '#,##0.00';
      
      // Below threshold format
      format += ';';
      if (condition === 'greater') {
        format += `[<=${threshold}]`;
      } else {
        format += `[=${threshold}]`;
      }
      if (conditionalFormat.belowColor) {
        format += `[${conditionalFormat.belowColor}]`;
      }
      if (conditionalFormat.showSymbols) {
        format += '"↓ "';
      }
      format += '#,##0.00';
    } 
    // Below threshold format
    else if (condition === 'less') {
      format += `[<${threshold}]`;
      if (conditionalFormat.belowColor) {
        format += `[${conditionalFormat.belowColor}]`;
      }
      if (conditionalFormat.showSymbols) {
        format += '"↓ "';
      }
      format += '#,##0.00';
      
      // Above threshold format
      format += ';';
      format += `[>=${threshold}]`;
      if (conditionalFormat.aboveColor) {
        format += `[${conditionalFormat.aboveColor}]`;
      }
      if (conditionalFormat.showSymbols) {
        format += '"↑ "';
      }
      format += '#,##0.00';
    }
    // Equal threshold format
    else if (condition === 'equal') {
      format += `[=${threshold}]`;
      if (conditionalFormat.equalColor) {
        format += `[${conditionalFormat.equalColor}]`;
      }
      if (conditionalFormat.showSymbols) {
        format += '"= "';
      }
      format += '#,##0.00';
      
      // Not equal format
      format += ';';
      format += `[<>${threshold}]`;
      if (conditionalFormat.belowColor) {
        format += `[${conditionalFormat.belowColor}]`;
      }
      format += '#,##0.00';
    }
    
    return format;
  };
  
  const generateDateFormat = () => {
    return dateFormat.format;
  };
  
  // Update format when settings change
  React.useEffect(() => {
    let format = '';
    
    switch (activeTab) {
      case 'number':
        format = generateNumberFormat();
        break;
      case 'currency':
        format = generateCurrencyFormat();
        break;
      case 'percent':
        format = generatePercentFormat();
        break;
      case 'conditional':
        format = generateConditionalFormat();
        break;
      case 'date':
        format = generateDateFormat();
        break;
      case 'custom':
        format = customFormat;
        break;
    }
    
    onFormatChange(format);
  }, [
    activeTab, 
    numberFormat, 
    currencyFormat, 
    percentFormat, 
    conditionalFormat, 
    dateFormat, 
    customFormat
  ]);
  
  // Set initial tab based on data type
  React.useEffect(() => {
    if (initialFormat) {
      setCustomFormat(initialFormat);
      setActiveTab('custom');
    } else if (dataType === 'number') {
      setActiveTab('number');
    } else if (dataType === 'date') {
      setActiveTab('date');
    } else {
      setActiveTab('number');
    }
  }, [initialFormat, dataType]);
  
  // Sample data for preview
  const sampleData = {
    number: [1234.56, -789.01, 0],
    currency: [1234.56, -789.01, 0],
    percent: [0.1234, -0.0567, 0],
    conditional: [50, 0, -25],
    date: ['2023-01-15', '2023-12-31', '2024-06-30'],
    custom: [1234.56, -789.01, 0]
  };
  
  // Format sample data
  const formatSample = (value: any, format: string) => {
    try {
      // Simple formatter for preview
      if (format.includes('%')) {
        // Percentage format
        const num = parseFloat(value);
        const decimalPlaces = (format.match(/0/g) || []).length - 1;
        return (num * 100).toFixed(Math.max(0, decimalPlaces)) + '%';
      } else if (format.includes('$')) {
        // Currency format
        const num = parseFloat(value);
        const decimalPlaces = (format.match(/0/g) || []).length - 1;
        return '$' + num.toFixed(decimalPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      } else if (format.includes('#') || format.includes('0')) {
        // Number format
        const num = parseFloat(value);
        const decimalPlaces = (format.match(/0/g) || []).length - 1;
        return num.toFixed(decimalPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      } else if (format.includes('YYYY') || format.includes('MM') || format.includes('DD')) {
        // Date format
        const date = new Date(value);
        let formatted = format;
        formatted = formatted.replace('YYYY', date.getFullYear().toString());
        formatted = formatted.replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'));
        formatted = formatted.replace('DD', date.getDate().toString().padStart(2, '0'));
        return formatted;
      }
      
      // Default
      return value.toString();
    } catch (e) {
      return value.toString();
    }
  };
  
  // Get current format string
  const getCurrentFormat = () => {
    switch (activeTab) {
      case 'number': return generateNumberFormat();
      case 'currency': return generateCurrencyFormat();
      case 'percent': return generatePercentFormat();
      case 'conditional': return generateConditionalFormat();
      case 'date': return generateDateFormat();
      case 'custom': return customFormat;
      default: return '';
    }
  };
  
  // Copy format to clipboard
  const copyFormat = () => {
    const format = getCurrentFormat();
    navigator.clipboard.writeText(format);
  };
  
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="number" className="flex items-center gap-1.5 text-xs">
            <Hash className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Number</span>
          </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center gap-1.5 text-xs">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Currency</span>
          </TabsTrigger>
          <TabsTrigger value="percent" className="flex items-center gap-1.5 text-xs">
            <Percent className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Percent</span>
          </TabsTrigger>
          <TabsTrigger value="conditional" className="flex items-center gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Conditional</span>
          </TabsTrigger>
          <TabsTrigger value="date" className="flex items-center gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Date</span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-1.5 text-xs">
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Custom</span>
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-4 space-y-4">
          {/* Number Format */}
          <TabsContent value="number" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Decimal Places</Label>
                <Select 
                  value={numberFormat.decimalPlaces.toString()} 
                  onValueChange={(value) => setNumberFormat({...numberFormat, decimalPlaces: parseInt(value)})}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select decimal places" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 (1234)</SelectItem>
                    <SelectItem value="1">1 (1234.5)</SelectItem>
                    <SelectItem value="2">2 (1234.56)</SelectItem>
                    <SelectItem value="3">3 (1234.567)</SelectItem>
                    <SelectItem value="4">4 (1234.5678)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Thousands Separator</Label>
                <div className="flex items-center justify-between h-8 px-3 rounded-md border">
                  <span className="text-sm">Show commas</span>
                  <Switch 
                    checked={numberFormat.thousandsSeparator} 
                    onCheckedChange={(checked) => setNumberFormat({...numberFormat, thousandsSeparator: checked})}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Prefix</Label>
                <Input 
                  value={numberFormat.prefix} 
                  onChange={(e) => setNumberFormat({...numberFormat, prefix: e.target.value})}
                  placeholder="e.g., $, €, £"
                  className="h-8"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Suffix</Label>
                <Input 
                  value={numberFormat.suffix} 
                  onChange={(e) => setNumberFormat({...numberFormat, suffix: e.target.value})}
                  placeholder="e.g., kg, %, pts"
                  className="h-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Negative Numbers</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-negative-red" 
                    checked={numberFormat.showNegativeInRed}
                    onCheckedChange={(checked) => setNumberFormat({...numberFormat, showNegativeInRed: !!checked})}
                  />
                  <label htmlFor="show-negative-red" className="text-sm cursor-pointer">
                    Show in red
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="use-parentheses" 
                    checked={numberFormat.useParentheses}
                    onCheckedChange={(checked) => setNumberFormat({...numberFormat, useParentheses: !!checked})}
                  />
                  <label htmlFor="use-parentheses" className="text-sm cursor-pointer">
                    Use parentheses
                  </label>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Currency Format */}
          <TabsContent value="currency" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Currency Symbol</Label>
                <Select 
                  value={currencyFormat.symbol} 
                  onValueChange={(value) => setCurrencyFormat({...currencyFormat, symbol: value})}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select symbol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">$ (USD)</SelectItem>
                    <SelectItem value="€">€ (EUR)</SelectItem>
                    <SelectItem value="£">£ (GBP)</SelectItem>
                    <SelectItem value="¥">¥ (JPY/CNY)</SelectItem>
                    <SelectItem value="₹">₹ (INR)</SelectItem>
                    <SelectItem value="₽">₽ (RUB)</SelectItem>
                    <SelectItem value="₩">₩ (KRW)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Symbol Position</Label>
                <Select 
                  value={currencyFormat.position} 
                  onValueChange={(value) => setCurrencyFormat({...currencyFormat, position: value as 'before' | 'after'})}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">Before ($123)</SelectItem>
                    <SelectItem value="after">After (123$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Decimal Places</Label>
                <Select 
                  value={currencyFormat.decimalPlaces.toString()} 
                  onValueChange={(value) => setCurrencyFormat({...currencyFormat, decimalPlaces: parseInt(value)})}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select decimal places" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 ($1,234)</SelectItem>
                    <SelectItem value="2">2 ($1,234.56)</SelectItem>
                    <SelectItem value="3">3 ($1,234.567)</SelectItem>
                    <SelectItem value="4">4 ($1,234.5678)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Accounting Style</Label>
                <div className="flex items-center justify-between h-8 px-3 rounded-md border">
                  <span className="text-sm">Use accounting style</span>
                  <Switch 
                    checked={currencyFormat.useParentheses} 
                    onCheckedChange={(checked) => setCurrencyFormat({
                      ...currencyFormat, 
                      useParentheses: checked,
                      showNegativeInRed: checked ? true : currencyFormat.showNegativeInRed
                    })}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="currency-negative-red" 
                checked={currencyFormat.showNegativeInRed}
                onCheckedChange={(checked) => setCurrencyFormat({...currencyFormat, showNegativeInRed: !!checked})}
              />
              <label htmlFor="currency-negative-red" className="text-sm cursor-pointer">
                Show negative values in red
              </label>
            </div>
          </TabsContent>
          
          {/* Percentage Format */}
          <TabsContent value="percent" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Decimal Places</Label>
                <Select 
                  value={percentFormat.decimalPlaces.toString()} 
                  onValueChange={(value) => setPercentFormat({...percentFormat, decimalPlaces: parseInt(value)})}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select decimal places" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 (12%)</SelectItem>
                    <SelectItem value="1">1 (12.3%)</SelectItem>
                    <SelectItem value="2">2 (12.34%)</SelectItem>
                    <SelectItem value="3">3 (12.345%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Percent Symbol</Label>
                <div className="flex items-center justify-between h-8 px-3 rounded-md border">
                  <span className="text-sm">Show % symbol</span>
                  <Switch 
                    checked={percentFormat.showSymbol} 
                    onCheckedChange={(checked) => setPercentFormat({...percentFormat, showSymbol: checked})}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="percent-negative-red" 
                checked={percentFormat.showNegativeInRed}
                onCheckedChange={(checked) => setPercentFormat({...percentFormat, showNegativeInRed: !!checked})}
              />
              <label htmlFor="percent-negative-red" className="text-sm cursor-pointer">
                Show negative values in red
              </label>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-md text-sm">
              <p className="text-muted-foreground">
                <strong>Note:</strong> Percentage formatting multiplies the value by 100. For example, 0.12 becomes 12%.
              </p>
            </div>
          </TabsContent>
          
          {/* Conditional Format */}
          <TabsContent value="conditional" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Condition</Label>
                <Select 
                  value={conditionalFormat.condition} 
                  onValueChange={(value) => setConditionalFormat({
                    ...conditionalFormat, 
                    condition: value as 'greater' | 'less' | 'equal' | 'not-equal'
                  })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="greater">Greater than threshold</SelectItem>
                    <SelectItem value="less">Less than threshold</SelectItem>
                    <SelectItem value="equal">Equal to threshold</SelectItem>
                    <SelectItem value="not-equal">Not equal to threshold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Threshold Value</Label>
                <Input 
                  value={conditionalFormat.threshold} 
                  onChange={(e) => setConditionalFormat({...conditionalFormat, threshold: e.target.value})}
                  placeholder="e.g., 0, 100, -50"
                  className="h-8"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Above Color</Label>
                <Select 
                  value={conditionalFormat.aboveColor} 
                  onValueChange={(value) => setConditionalFormat({...conditionalFormat, aboveColor: value})}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Green">Green</SelectItem>
                    <SelectItem value="Blue">Blue</SelectItem>
                    <SelectItem value="Purple">Purple</SelectItem>
                    <SelectItem value="Orange">Orange</SelectItem>
                    <SelectItem value="Black">Black</SelectItem>
                    <SelectItem value="">No Color</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Below Color</Label>
                <Select 
                  value={conditionalFormat.belowColor} 
                  onValueChange={(value) => setConditionalFormat({...conditionalFormat, belowColor: value})}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Red">Red</SelectItem>
                    <SelectItem value="Orange">Orange</SelectItem>
                    <SelectItem value="Purple">Purple</SelectItem>
                    <SelectItem value="Blue">Blue</SelectItem>
                    <SelectItem value="Black">Black</SelectItem>
                    <SelectItem value="">No Color</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Equal Color</Label>
                <Select 
                  value={conditionalFormat.equalColor} 
                  onValueChange={(value) => setConditionalFormat({...conditionalFormat, equalColor: value})}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Blue">Blue</SelectItem>
                    <SelectItem value="Green">Green</SelectItem>
                    <SelectItem value="Purple">Purple</SelectItem>
                    <SelectItem value="Orange">Orange</SelectItem>
                    <SelectItem value="Black">Black</SelectItem>
                    <SelectItem value="">No Color</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-symbols" 
                checked={conditionalFormat.showSymbols}
                onCheckedChange={(checked) => setConditionalFormat({...conditionalFormat, showSymbols: !!checked})}
              />
              <label htmlFor="show-symbols" className="text-sm cursor-pointer">
                Show arrows or symbols (↑ for above, ↓ for below)
              </label>
            </div>
          </TabsContent>
          
          {/* Date Format */}
          <TabsContent value="date" className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Date Format</Label>
              <Select 
                value={dateFormat.format} 
                onValueChange={(value) => setDateFormat({...dateFormat, format: value})}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (01/15/2023)</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (15/01/2023)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2023-01-15)</SelectItem>
                  <SelectItem value="MMMM D, YYYY">MMMM D, YYYY (January 15, 2023)</SelectItem>
                  <SelectItem value="D MMMM YYYY">D MMMM YYYY (15 January 2023)</SelectItem>
                  <SelectItem value="MMM D, YYYY">MMM D, YYYY (Jan 15, 2023)</SelectItem>
                  <SelectItem value="D MMM YYYY">D MMM YYYY (15 Jan 2023)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-md text-sm">
              <p className="text-muted-foreground">
                <strong>Note:</strong> Date formatting requires valid date values in your data. Supported formats include ISO dates (YYYY-MM-DD) and standard date strings.
              </p>
            </div>
          </TabsContent>
          
          {/* Custom Format */}
          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Custom Format String</Label>
              <Input 
                value={customFormat} 
                onChange={(e) => setCustomFormat(e.target.value)}
                placeholder="e.g., $#,##0.00;[Red]($#,##0.00)"
                className="font-mono text-sm"
              />
            </div>
            
            <div className="p-3 bg-muted/30 rounded-md text-sm space-y-2">
              <p className="text-muted-foreground">
                <strong>Format String Syntax:</strong>
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li><code className="bg-muted px-1 py-0.5 rounded">#</code> - Digit placeholder (omit if zero)</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">0</code> - Digit placeholder (show zero)</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">,</code> - Thousands separator</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">.</code> - Decimal point</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">%</code> - Percentage (multiplies by 100)</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">"text"</code> - Text literal</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">[Color]</code> - Color name (Red, Green, Blue, etc.)</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">[>100]</code> - Condition (>, <, =, >=, <=, <>)</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">;</code> - Section separator (positive;negative;zero)</li>
              </ul>
            </div>
          </TabsContent>
        </div>
        
        {/* Format Preview */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Format Preview</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                {getCurrentFormat()}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyFormat}
                className="h-6 w-6 p-0"
                title="Copy format string"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {sampleData[activeTab as keyof typeof sampleData].map((value, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-md text-sm">
                <span className="text-muted-foreground">{value}</span>
                <span className="font-medium">{formatSample(value, getCurrentFormat())}</span>
              </div>
            ))}
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default FormatWizard;