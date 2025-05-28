import { ValueFormatterParams } from 'ag-grid-community';

/**
 * Process a single format section (handles colors, conditions, and number formatting)
 */
function processFormatSection(format: string, value: number, params: ValueFormatterParams): string {
  // Extract and handle color formatting - support both named and hex colors
  const colorMatch = format.match(/\[([^\]]+)\]/);
  let cleanFormat = format;
  
  if (colorMatch) {
    // Remove color from format for processing
    cleanFormat = format.replace(/\[[^\]]+\]/g, '');
  }
  
  // Extract and handle conditions within the section
  const conditionMatch = cleanFormat.match(/\[([<>=]+)([\d.-]+)\]/);
  if (conditionMatch) {
    const condition = conditionMatch[1];
    const threshold = parseFloat(conditionMatch[2]);
    
    let conditionMet = false;
    switch (condition) {
      case '>': conditionMet = value > threshold; break;
      case '<': conditionMet = value < threshold; break;
      case '>=': conditionMet = value >= threshold; break;
      case '<=': conditionMet = value <= threshold; break;
      case '=': conditionMet = value === threshold; break;
      case '==': conditionMet = value === threshold; break;
      case '<>': conditionMet = value !== threshold; break;
      case '!=': conditionMet = value !== threshold; break;
    }
    
    if (!conditionMet) {
      return ''; // Return empty if condition not met
    }
    
    // Remove condition from format
    cleanFormat = cleanFormat.replace(/\[[<>=!]+[\d.-]+\]/g, '');
  }
  
  // Handle text in quotes (like arrows)
  const textMatches = cleanFormat.match(/"([^"]+)"/g) || [];
  let prefix = '';
  let suffix = '';
  let numberFormat = cleanFormat;
  
  textMatches.forEach(match => {
    const text = match.replace(/"/g, '');
    const index = cleanFormat.indexOf(match);
    
    // Find where the number format starts (first occurrence of #, 0, or $)
    const numberStartMatch = cleanFormat.match(/[$#0]/);
    const numberStart = numberStartMatch ? cleanFormat.indexOf(numberStartMatch[0]) : cleanFormat.length;
    
    if (index < numberStart) {
      prefix += text;
    } else {
      suffix += text;
    }
    
    // Remove the quoted text from the format
    numberFormat = numberFormat.replace(match, '');
  });
  
  // Format the number
  // Check if we should suppress the minus sign (when red color formatting is present and value is negative)
  let hasRedColorFormatting = false;
  if (colorMatch) {
    const colorValue = colorMatch[1].toLowerCase();
    // Check for red color (named or hex variations)
    hasRedColorFormatting = colorValue === 'red' || 
                           colorValue === '#ff0000' || 
                           colorValue === '#f00' ||
                           colorValue === '#dc2626' || // Our red color
                           colorValue.match(/^#?[cdef][0-9a-f][0-2][0-9a-f][0-2][0-9a-f]$/i); // Reddish hex colors
  }
  const suppressMinusSign = hasRedColorFormatting && value < 0;
  const displayValue = Math.abs(value);
  
  let formattedNumber = '';
  
  // Handle currency symbol
  const currencyMatch = numberFormat.match(/\$([#0,.-]+)/);
  if (currencyMatch) {
    const numFormat = currencyMatch[1];
    const hasThousands = numFormat.includes(',');
    const decimalMatch = numFormat.match(/\.([0#]+)/);
    const decimals = decimalMatch ? decimalMatch[1].length : 0;
    
    if (hasThousands) {
      formattedNumber = '$' + displayValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    } else {
      formattedNumber = '$' + displayValue.toFixed(decimals);
    }
  } else if (numberFormat.match(/[#0]/)) {
    // Regular number format
    const hasThousands = numberFormat.includes(',');
    const decimalMatch = numberFormat.match(/\.([0#]+)/);
    const decimals = decimalMatch ? decimalMatch[1].length : 0;
    
    if (hasThousands) {
      formattedNumber = displayValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    } else {
      formattedNumber = displayValue.toFixed(decimals);
    }
  } else {
    formattedNumber = displayValue.toString();
  }
  
  // Add minus sign back if needed (not suppressed and value is negative)
  if (value < 0 && !suppressMinusSign) {
    formattedNumber = '-' + formattedNumber;
  }
  
  return prefix + formattedNumber + suffix;
}

/**
 * Excel-compatible number formatter
 * Supports Excel format strings for numbers, currency, percentages, dates, etc.
 */
export function createExcelFormatter(formatString: string) {
  const formatter = (params: ValueFormatterParams): string => {
    if (params.value == null || params.value === '') return '';
    
    const value = params.value;
    
    try {
      // Handle percentage formats
      if (formatString.includes('%')) {
        const num = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(num)) return value.toString();
        
        const decimals = (formatString.match(/0/g) || []).length - 1;
        return (num * 100).toFixed(Math.max(0, decimals)) + '%';
      }
      
      // Handle currency formats (for simple single-section formats)
      const currencySymbols = ['$', '€', '£', '¥', '₹', '₽', '₩'];
      const currencyMatch = formatString.match(new RegExp(`^([${currencySymbols.join('')}])(.*)|(.*?)([${currencySymbols.join('')}])$`));
      
      if (currencyMatch && !formatString.includes(';')) {
        const num = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(num)) return value.toString();
        
        const symbol = currencyMatch[1] || currencyMatch[4];
        const isPrefix = !!currencyMatch[1];
        const formatPart = formatString.replace(symbol, '').trim();
        
        // Extract decimal places from format
        const decimalMatch = formatPart.match(/\.([0#]+)/);
        const decimals = decimalMatch ? decimalMatch[1].length : 0;
        
        // Check for thousands separator
        const hasThousands = formatPart.includes(',');
        
        // Handle negative numbers in parentheses (accounting style)
        const isAccounting = formatString.includes('(') && formatString.includes(')');
        const isNegative = num < 0;
        const absNum = Math.abs(num);
        
        let formattedValue;
        if (hasThousands) {
          formattedValue = absNum.toLocaleString('en-US', { 
            minimumFractionDigits: decimals, 
            maximumFractionDigits: decimals 
          });
        } else {
          formattedValue = absNum.toFixed(decimals);
        }
        
        if (isAccounting && isNegative) {
          return isPrefix ? `(${symbol}${formattedValue})` : `(${formattedValue} ${symbol})`;
        } else if (isNegative) {
          return isPrefix ? `-${symbol}${formattedValue}` : `-${formattedValue} ${symbol}`;
        } else {
          return isPrefix ? `${symbol}${formattedValue}` : `${formattedValue} ${symbol}`;
        }
      }
      
      // Handle scientific notation
      if (formatString.includes('E+') || formatString.includes('E-')) {
        const num = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(num)) return value.toString();
        
        const decimalMatch = formatString.match(/\.([0#]+)E/);
        const decimals = decimalMatch ? decimalMatch[1].length : 2;
        return num.toExponential(decimals);
      }
      
      // Handle date formats
      if (formatString.match(/[YMDHms]/)) {
        const date = value instanceof Date ? value : new Date(value);
        if (isNaN(date.getTime())) return value.toString();
        
        const pad = (n: number) => n.toString().padStart(2, '0');
        
        return formatString
          .replace(/YYYY/g, date.getFullYear().toString())
          .replace(/YY/g, date.getFullYear().toString().slice(-2))
          .replace(/MMMM/g, date.toLocaleString('en-US', { month: 'long' }))
          .replace(/MMM/g, date.toLocaleString('en-US', { month: 'short' }))
          .replace(/MM/g, pad(date.getMonth() + 1))
          .replace(/M/g, (date.getMonth() + 1).toString())
          .replace(/DD/g, pad(date.getDate()))
          .replace(/D/g, date.getDate().toString())
          .replace(/HH/g, pad(date.getHours()))
          .replace(/H/g, date.getHours().toString())
          .replace(/hh/g, pad(date.getHours() % 12 || 12))
          .replace(/h/g, (date.getHours() % 12 || 12).toString())
          .replace(/mm/g, pad(date.getMinutes()))
          .replace(/m/g, date.getMinutes().toString())
          .replace(/ss/g, pad(date.getSeconds()))
          .replace(/s/g, date.getSeconds().toString())
          .replace(/AM\/PM/g, date.getHours() < 12 ? 'AM' : 'PM')
          .replace(/am\/pm/g, date.getHours() < 12 ? 'am' : 'pm');
      }
      
      // Handle number formats
      if (formatString.match(/[#0]/) || formatString.includes('"')) {
        const num = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(num)) return value.toString();
        
        // Handle Excel's semicolon-separated format sections
        const sections = formatString.split(';');
        if (sections.length > 1) {
          // Check for conditional formatting (traffic lights)
          const hasConditions = sections.some(s => s.match(/\[[<>=]+[\d.-]+\]/));
          
          if (hasConditions) {
            // Process each section to find matching condition
            for (const section of sections) {
              const conditionMatch = section.match(/\[([<>=!]+)([\d.-]+)\]/);
              if (conditionMatch) {
                const condition = conditionMatch[1];
                const threshold = parseFloat(conditionMatch[2]);
                
                let conditionMet = false;
                switch (condition) {
                  case '>': conditionMet = num > threshold; break;
                  case '<': conditionMet = num < threshold; break;
                  case '>=': conditionMet = num >= threshold; break;
                  case '<=': conditionMet = num <= threshold; break;
                  case '=': conditionMet = num === threshold; break;
                  case '==': conditionMet = num === threshold; break;
                  case '<>': conditionMet = num !== threshold; break;
                  case '!=': conditionMet = num !== threshold; break;
                }
                
                if (conditionMet) {
                  return processFormatSection(section, num, params);
                }
              } else {
                // No condition in this section, use as default/fallback
                return processFormatSection(section, num, params);
              }
            }
          } else {
            // Standard positive;negative;zero format
            let selectedFormat: string;
            
            if (num > 0 && sections[0]) {
              selectedFormat = sections[0];
            } else if (num < 0 && sections[1]) {
              selectedFormat = sections[1];
            } else if (num === 0 && sections[2]) {
              selectedFormat = sections[2];
            } else {
              // Default to first section if no match
              selectedFormat = sections[0];
            }
            
            // Process the selected format section
            return processFormatSection(selectedFormat, num, params);
          }
        }
        
        // Single format section - process directly
        return processFormatSection(formatString, num, params);
      }
      
      // Default: return as string
      return value.toString();
      
    } catch (error) {
      console.error('Formatting error:', error);
      return value.toString();
    }
  };
  
  // Attach format string as metadata for serialization
  (formatter as any).__formatString = formatString;
  (formatter as any).__formatterType = 'excel';
  
  return formatter;
}

/**
 * Get Excel style class based on format string
 */
export function getExcelStyleClass(formatString: string): string {
  const classes: string[] = [];
  
  if (formatString.includes('%')) {
    classes.push('ag-numeric-cell', 'ag-percentage-cell');
  } else if (formatString.match(/[$€£¥₹₽₩]/)) {
    classes.push('ag-numeric-cell', 'ag-currency-cell');
  } else if (formatString.match(/[#0]/) && !formatString.match(/[YMDHms]/)) {
    classes.push('ag-numeric-cell');
  } else if (formatString.match(/[YMDHms]/)) {
    classes.push('ag-date-cell');
  }
  
  // Note: Color formatting is dynamic based on value, so we don't add color classes here
  // The actual color should be applied via cellStyle or cellClassRules
  
  return classes.join(' ');
}

/**
 * Create cell style function for dynamic color formatting
 */
export function createCellStyleFunction(formatString: string, baseStyle?: any) {
  // Parse format sections
  const sections = formatString.split(';');
  
  return (params: any) => {
    // Start with base styles from styling tab
    const baseStyles = typeof baseStyle === 'object' && baseStyle !== null ? { ...baseStyle } : {};
    
    const value = params.value;
    if (value == null) return baseStyles;
    
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return baseStyles;
    
    let selectedSection: string;
    
    // Select appropriate section based on value
    if (num > 0 && sections[0]) {
      selectedSection = sections[0];
    } else if (num < 0 && sections[1]) {
      selectedSection = sections[1];
    } else if (num === 0 && sections[2]) {
      selectedSection = sections[2];
    } else {
      selectedSection = sections[0] || formatString;
    }
    
    // Extract color from the selected section - support both named colors and hex colors
    const colorMatch = selectedSection.match(/\[([^\]]+)\]/i);
    if (colorMatch) {
      const colorValue = colorMatch[1];
      let finalColor: string;
      
      // Check if it's a hex color (with or without #)
      if (colorValue.match(/^#?[0-9A-Fa-f]{6}$/)) {
        finalColor = colorValue.startsWith('#') ? colorValue : `#${colorValue}`;
      } else {
        // Named color mapping
        const colorName = colorValue.toLowerCase();
        const colorMap: Record<string, string> = {
          'red': '#dc2626',
          'green': '#16a34a',
          'blue': '#2563eb',
          'yellow': '#ca8a04',
          'orange': '#ea580c',
          'purple': '#9333ea',
          'gray': '#6b7280',
          'grey': '#6b7280',
          'black': '#000000',
          'white': '#ffffff'
        };
        finalColor = colorMap[colorName] || colorValue;
      }
      
      // Merge with base styles - conditional color overrides base color
      return {
        ...baseStyles,
        color: finalColor
      };
    }
    
    // Return base styles if no conditional formatting applies
    return baseStyles;
  };
}

/**
 * Get Excel export format based on format string
 */
export function getExcelExportFormat(formatString: string): string | undefined {
  // Direct Excel number format mappings
  const formatMap: Record<string, string> = {
    '0': '0',
    '0.0': '0.0',
    '0.00': '0.00',
    '#,##0': '#,##0',
    '#,##0.00': '#,##0.00',
    '0%': '0%',
    '0.0%': '0.0%',
    '0.00%': '0.00%',
    '$#,##0': '$#,##0',
    '$#,##0.00': '$#,##0.00',
    '€#,##0.00': '€#,##0.00',
    '£#,##0.00': '£#,##0.00',
    '0.00E+00': '0.00E+00',
    'MM/DD/YYYY': 'mm/dd/yyyy',
    'DD/MM/YYYY': 'dd/mm/yyyy',
    'YYYY-MM-DD': 'yyyy-mm-dd',
  };
  
  return formatMap[formatString] || formatString;
}