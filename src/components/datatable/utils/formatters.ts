import { ValueFormatterParams } from 'ag-grid-community';
import { parseStyleDirectives, parseColorValue, isStyleDirective } from './style-utils';

/**
 * Enhanced Format String Syntax
 * 
 * This system extends Excel format strings with additional styling capabilities:
 * 
 * BASIC EXCEL SYNTAX:
 * - [>0][Green]#,##0.00;[Red]#,##0.00        // Conditional colors
 * - [="A"]"Excellent";@                       // Text conditions
 * - $#,##0.00                                 // Currency
 * - #,##0.00%                                 // Percentage
 * 
 * EXTENDED STYLING SYNTAX:
 * - [BG:Yellow] or [Background:Yellow]        // Background color
 * - [Border:2px-solid-blue] or [B:1px-red]   // Borders
 * - [Size:14] or [FontSize:16]               // Font size
 * - [Align:center] or [TextAlign:right]      // Text alignment
 * - [Padding:4px-8px] or [P:6px]             // Padding
 * - [Weight:bold] or [FontWeight:600]        // Font weight
 * - [Bold], [Italic], [Underline]            // Font styles
 * - [Center], [Left], [Right]                // Alignment shortcuts
 * 
 * STYLING BEHAVIOR:
 * - When format conditions match, specified styles are applied
 * - When NO conditions match and NO base styles exist, cells use default theme styling
 * - Base styles from styling tab are preserved when no format conditions match
 * - This ensures proper inheritance from the grid's theme
 * 
 * EXAMPLES:
 * - [>0][Green][BG:lightgreen][Bold]#,##0.00;[Red][BG:lightred]#,##0.00
 * - [="Excellent"][#16a34a][BG:Yellow][Border:2px-solid-green][Center]@
 * - [>100][Blue][Size:16][Bold][Border:1px-blue]#,##0;[Orange]#,##0
 * - [<>""][][BG:#f0f0f0][P:4px-8px][Italic]@;[Gray]"Empty"
 */

/**
 * Check if a value matches conditions in a format section
 */
function checkConditionMatch(section: string, value: unknown): boolean {
  // Only log for debug format strings
  const isDebugSection = section.includes('[="A"]') && (section.includes('#4bdd63') || section.includes('#3bceb1'));
  const isDebugValue = value === 'A' || value === 'B' || value === 'Excel';
  
  if (isDebugSection && isDebugValue) {
    console.log(`    🔍 Checking conditions in section "${section}" for value "${value}"`);
  }
  
  // Extract all conditions from the section
  const conditions = section.match(/\[[^\]]+\]/g) || [];
  if (isDebugSection && isDebugValue) {
    console.log(`    📝 Found ${conditions.length} brackets:`, conditions);
  }
  
  for (const condition of conditions) {
    const conditionContent = condition.slice(1, -1); // Remove [ and ]
    if (isDebugSection && isDebugValue) {
      console.log(`    🔍 Processing condition: "${conditionContent}"`);
    }
    
    // Skip color specifications (hex colors or color names)
    if (conditionContent.match(/^#[0-9A-Fa-f]{6}$/) || 
        conditionContent.match(/^#[0-9A-Fa-f]{3}$/) ||
        ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'gray', 'grey', 'black', 'white', 'magenta', 'cyan'].includes(conditionContent.toLowerCase())) {
      if (isDebugSection && isDebugValue) {
        console.log(`    ⏭️ Skipping color specification: "${conditionContent}"`);
      }
      continue;
    }
    
    // Skip extended styling directives
    if (isStyleDirective(conditionContent)) {
      if (isDebugSection && isDebugValue) {
        console.log(`    ⏭️ Skipping style directive: "${conditionContent}"`);
      }
      continue;
    }
    
    // Handle text equality conditions
    if (conditionContent.match(/^@?="(.+)"$/)) {
      const match = conditionContent.match(/^@?="(.+)"$/);
      if (match) {
        const targetValue = match[1];
        const valueStr = String(value || '');
        const matches = valueStr === targetValue;
        if (isDebugSection && isDebugValue) {
          console.log(`    📝 Text equality: "${valueStr}" === "${targetValue}" = ${matches}`);
        }
        return matches;
      }
    }
    
    // Handle empty/non-empty text conditions
    if (conditionContent === '@=""' || conditionContent === '=""') {
      return String(value || '') === '';
    }
    if (conditionContent === '@<>""' || conditionContent === '<>""') {
      return String(value || '') !== '';
    }
    
    // Handle numeric conditions
    const numericCondition = conditionContent.match(/^([<>=!]+)([\d.-]+)$/);
    if (numericCondition) {
      const operator = numericCondition[1];
      const threshold = parseFloat(numericCondition[2]);
      const numValue = typeof value === 'number' ? value : parseFloat(String(value));
      
      if (isNaN(numValue)) continue; // Skip if value is not numeric
      
      switch (operator) {
        case '>': return numValue > threshold;
        case '<': return numValue < threshold;
        case '>=': return numValue >= threshold;
        case '<=': return numValue <= threshold;
        case '=': case '==': return numValue === threshold;
        case '<>': case '!=': return numValue !== threshold;
      }
    }
  }
  
  // If no conditions found, this section matches (it's probably a default section)
  return conditions.length === 0 || conditions.every(c => {
    const content = c.slice(1, -1);
    return content.match(/^#[0-9A-Fa-f]{6}$/) || 
           content.match(/^#[0-9A-Fa-f]{3}$/) ||
           ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'gray', 'grey', 'black', 'white', 'magenta', 'cyan'].includes(content.toLowerCase()) ||
           isStyleDirective(content);
  });
}

/**
 * Process a single format section (handles colors, conditions, and number formatting)
 */
function processFormatSection(format: string, value: unknown, _params?: ValueFormatterParams): string {
  // Remove all condition and color brackets to get the display format
  const cleanFormat = format.replace(/\[[^\]]+\]/g, '');
  
  // Handle text in quotes
  const textMatches = cleanFormat.match(/"([^"]+)"/g) || [];
  let prefix = '';
  let suffix = '';
  let numberFormat = cleanFormat;
  
  textMatches.forEach(match => {
    const text = match.replace(/"/g, '');
    const index = cleanFormat.indexOf(match);
    
    // Find where the number format starts (first occurrence of #, 0, @, or $)
    const numberStartMatch = cleanFormat.match(/[$#0@]/);
    const numberStart = numberStartMatch ? cleanFormat.indexOf(numberStartMatch[0]) : cleanFormat.length;
    
    if (index < numberStart) {
      prefix += text;
    } else {
      suffix += text;
    }
    
    // Remove the quoted text from the format
    numberFormat = numberFormat.replace(match, '');
  });
  
  // Check if this is a text-only format (only quoted text, no @ or number patterns)
  const isTextOnlyFormat = numberFormat.trim() === '' || !numberFormat.match(/[@#0$]/);
  
  if (isTextOnlyFormat) {
    // For text-only formats, just return the prefix/suffix
    return prefix + suffix;
  }
  
  // Handle @ symbol (original text value)
  if (numberFormat.includes('@')) {
    return prefix + String(value || '') + suffix;
  }
  
  // Handle number formatting
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(numValue)) {
    // If not a number, return as text
    return prefix + String(value || '') + suffix;
  }
  
  const displayValue = Math.abs(numValue);
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
  
  // Check if this format section has a condition that already handles negative display
  // If the format has conditions like [<0] or [Red], don't add minus sign
  const hasNegativeCondition = format.match(/\[<0\]|\[Red\]/i);
  
  // Add minus sign back if needed and value is negative
  // But skip if this section has explicit negative handling
  if (numValue < 0 && !hasNegativeCondition) {
    formattedNumber = '-' + formattedNumber;
  }
  
  return prefix + formattedNumber + suffix;
}

/**
 * Excel-compatible number formatter
 * Supports Excel format strings for numbers, currency, percentages, dates, etc.
 */
export function createExcelFormatter(formatString: string) {
  // Log all formatters to see what's being created
  console.log('📋 Creating Excel formatter with format string:', formatString);
  console.log('   - Contains color directives:', /\[(Green|Red|Blue|Yellow|Orange|#[0-9A-Fa-f]{3,6})\]/i.test(formatString));
  console.log('   - Contains style directives:', /\[(BG:|Background:|Border:|B:|Size:|FontSize:|Align:|TextAlign:|Padding:|P:|Weight:|FontWeight:|Bold|Italic|Underline|Center|Left|Right)/i.test(formatString));
  
  const formatter = (params: ValueFormatterParams): string => {
    if (params.value == null || params.value === '') return '';
    
    const value = params.value;
    
    // Only log for specific format string and specific values
    const isDebugFormat = formatString.includes('[="A"][#') || formatString.includes('[="A"][#3bceb1]');
    const isDebugValue = value === 'A' || value === 'B' || value === 'Excel';
    
    if (isDebugFormat && isDebugValue) {
      console.log(`🔍 Formatting value "${value}" with format string: ${formatString}`);
    }
    
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
      
      // Handle number formats and text conditions
      if (formatString.match(/[#0@]/) || formatString.includes('"') || formatString.includes('[')) {
        if (isDebugFormat && isDebugValue) {
          console.log(`  📊 Processing complex format with conditions/brackets`);
        }
        
        // Handle Excel's semicolon-separated format sections
        const sections = formatString.split(';');
        if (isDebugFormat && isDebugValue) {
          console.log(`  🔄 Split into ${sections.length} sections:`, sections);
        }
        
        if (sections.length > 1) {
          // Process each section to find matching condition
          for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            if (isDebugFormat && isDebugValue) {
              console.log(`  📋 Checking section ${i}: "${section}"`);
            }
            
            if (checkConditionMatch(section, value)) {
              if (isDebugFormat && isDebugValue) {
                console.log(`  ✅ Section ${i} condition matched! Processing...`);
              }
              const result = processFormatSection(section, value, params);
              if (isDebugFormat && isDebugValue) {
                console.log(`  📝 Format result: "${result}"`);
              }
              return result;
            } else {
              if (isDebugFormat && isDebugValue) {
                console.log(`  ❌ Section ${i} condition did not match`);
              }
            }
          }
          
          // If no conditions matched, use the last section as fallback
          const fallbackSection = sections[sections.length - 1];
          if (isDebugFormat && isDebugValue) {
            console.log(`  🔄 No conditions matched, using fallback section: "${fallbackSection}"`);
          }
          const result = processFormatSection(fallbackSection, value, params);
          if (isDebugFormat && isDebugValue) {
            console.log(`  📝 Fallback result: "${result}"`);
          }
          return result;
        }
        
        // Single format section - process directly
        if (isDebugFormat && isDebugValue) {
          console.log(`  📋 Single section format, processing directly`);
        }
        const result = processFormatSection(formatString, value, params);
        if (isDebugFormat && isDebugValue) {
          console.log(`  📝 Single section result: "${result}"`);
        }
        return result;
      }
      
      // Default: return as string
      return value.toString();
      
    } catch (error) {
      console.error('Formatting error:', error);
      return value.toString();
    }
  };
  
  // Attach format string as metadata for serialization
  // Store metadata on the formatter function
  Object.defineProperty(formatter, '__formatString', { 
    value: formatString, 
    writable: false,
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(formatter, '__formatterType', { 
    value: 'excel', 
    writable: false,
    enumerable: false,
    configurable: true
  });
  
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
export function createCellStyleFunction(formatString: string, baseStyle?: React.CSSProperties) {
  console.log('🎨 [createCellStyleFunction] Creating function with:', {
    formatString: formatString,
    hasBaseStyle: !!baseStyle,
    baseStyle: baseStyle
  });
  
  // Only log for debug format strings
  const isDebugFormat = formatString.includes('[="A"]') && (formatString.includes('#4bdd63') || formatString.includes('#3bceb1'));
  
  if (isDebugFormat) {
    console.log('🎨 Creating cell style function for format string:', formatString);
    console.log('🎨 Base style provided:', baseStyle);
  }
  
  // Parse format sections
  const sections = formatString.split(';');
  if (isDebugFormat) {
    console.log('🎨 Format sections:', sections);
  }
  
  const styleFunction = (params: { value: unknown }) => {
    const value = params.value;
    const isDebugValue = value === 'A' || value === 'B' || value === 'Excel';
    
    // Dynamically check if dark mode is active
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    if (isDebugFormat && isDebugValue) {
      console.log(`🎨 Applying cell styles for value "${value}" with format: ${formatString}, dark mode: ${isDarkMode}`);
    }
    
    // Check if we have explicit base styles from styling tab (not from formatting)
    // Only consider it explicit if it came from user styling, not from format conditions
    const hasExplicitBaseStyles = baseStyle && typeof baseStyle === 'object' && Object.keys(baseStyle).length > 0;
    
    // Always log when base styles are present
    if (hasExplicitBaseStyles) {
      console.log(`[createCellStyleFunction] Base styles present for value "${value}":`, baseStyle);
    }
    
    // For null/undefined values, no styles should be applied unless explicitly set in styling tab
    if (value == null) {
      return hasExplicitBaseStyles ? { ...baseStyle } : undefined;
    }
    
    // Process each section to find matching condition
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (isDebugFormat && isDebugValue) {
        console.log(`  🎨 Checking section ${i}: "${section}"`);
      }
      
      if (checkConditionMatch(section, value)) {
        if (isDebugFormat && isDebugValue) {
          console.log(`  ✅ Cell style section ${i} condition matched!`);
        }
        
        // Parse extended style directives first
        const extendedStyles = parseStyleDirectives(section, isDarkMode);
        if (isDebugFormat && isDebugValue) {
          console.log('  🎯 Extended styles found:', extendedStyles);
        }
        
        // Then check for traditional Excel color syntax (for text color)
        // Look for color-specific brackets - hex colors or named colors only
        const brackets = section.match(/\[[^\]]+\]/g) || [];
        if (isDebugFormat && isDebugValue) {
          console.log(`  🌈 Checking brackets for colors:`, brackets);
        }
        
        for (const bracket of brackets) {
          const content = bracket.slice(1, -1);
          if (isDebugFormat && isDebugValue) {
            console.log(`    🔍 Processing bracket content: "${content}"`);
          }
          
          // Skip conditions and style directives
          if (isStyleDirective(content)) {
            if (isDebugFormat && isDebugValue) {
              console.log(`    ⏭️ Skipping style directive: "${content}"`);
            }
            continue;
          }
          if (content.includes('=') || content.includes('<') || content.includes('>')) {
            if (isDebugFormat && isDebugValue) {
              console.log(`    ⏭️ Skipping condition: "${content}"`);
            }
            continue;
          }
          
          // Check if it's a hex color
          if (content.match(/^#[0-9A-Fa-f]{6}$/) || content.match(/^#[0-9A-Fa-f]{3}$/)) {
            if (isDebugFormat && isDebugValue) {
              console.log(`    🎯 Found hex color: "${content}"`);
            }
            extendedStyles.color = content;
            break;
          }
          
          // Check if it's a named color (only pure color names, not conditions)
          const namedColors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'gray', 'grey', 'black', 'white', 'magenta', 'cyan'];
          if (namedColors.includes(content.toLowerCase())) {
            if (isDebugFormat && isDebugValue) {
              console.log(`    🎯 Found named color: "${content}"`);
            }
            extendedStyles.color = parseColorValue(content, isDarkMode);
            break;
          }
        }
        
        // Check if we have any conditional styles to apply
        const hasConditionalStyles = Object.keys(extendedStyles).length > 0;
        if (isDebugFormat && isDebugValue) {
          console.log(`  🔍 Has conditional styles: ${hasConditionalStyles}`, extendedStyles);
        }
        
        // When a condition matches, ALWAYS merge base styles with conditional styles
        // This ensures that styling tab settings are preserved when format conditions apply
        if (hasConditionalStyles || hasExplicitBaseStyles) {
          // Start with base styles (if any)
          const mergedStyles = hasExplicitBaseStyles ? { ...baseStyle } : {};
          
          // Apply conditional styles on top (they take precedence)
          if (hasConditionalStyles) {
            Object.assign(mergedStyles, extendedStyles);
          }
          
          if (isDebugFormat && isDebugValue) {
            console.log('  ✅ Returning merged styles:', mergedStyles);
          }
          console.log(`[createCellStyleFunction] Returning merged styles for ${value}:`, mergedStyles);
          return Object.keys(mergedStyles).length > 0 ? mergedStyles : undefined;
        }
        
        // Condition matched but no styles to apply - let cell use default theme
        if (isDebugFormat && isDebugValue) {
          console.log('  ✅ Format condition matched but no styles specified - returning undefined for default theme styling');
        }
        console.log(`[createCellStyleFunction] Returning undefined for ${value} (no styles)`);
        return undefined;
      } else {
        if (isDebugFormat && isDebugValue) {
          console.log(`  ❌ Cell style section ${i} condition did not match`);
        }
      }
    }
    
    if (isDebugFormat && isDebugValue) {
      console.log('  🔄 No sections matched conditions, checking fallback...');
    }
    
    // If no sections matched, check if there's a fallback section (last one without conditions)
    // Only check fallback if we have multiple sections (semicolon-separated format)
    if (sections.length > 1) {
      const fallbackSection = sections[sections.length - 1];
      
      // Check if fallback section has any conditions (it shouldn't for a true fallback)
      const fallbackHasConditions = fallbackSection.match(/\[([<>=!@]|[<>=!]?[0-9.-]+|[@=][^"]*"[^"]*")\]/);
      
      if (!fallbackHasConditions) {
        // Parse extended style directives from fallback section
        const fallbackStyles = parseStyleDirectives(fallbackSection, isDarkMode);
        
        // Check for traditional color syntax in fallback
        const fallbackBrackets = fallbackSection.match(/\[[^\]]+\]/g) || [];
        for (const bracket of fallbackBrackets) {
          const content = bracket.slice(1, -1);
          
          // Skip conditions and style directives
          if (isStyleDirective(content)) continue;
          if (content.includes('=') || content.includes('<') || content.includes('>')) continue;
          
          // Check if it's a hex color
          if (content.match(/^#[0-9A-Fa-f]{6}$/) || content.match(/^#[0-9A-Fa-f]{3}$/)) {
            fallbackStyles.color = content;
            break;
          }
          
          // Check if it's a named color
          const namedColors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'gray', 'grey', 'black', 'white', 'magenta', 'cyan'];
          if (namedColors.includes(content.toLowerCase())) {
            fallbackStyles.color = parseColorValue(content, isDarkMode);
            break;
          }
        }
        
        // Check if we have any fallback styles to apply
        const hasFallbackStyles = Object.keys(fallbackStyles).length > 0;
        
        // Always merge base styles with fallback styles when we have either
        if (hasFallbackStyles || hasExplicitBaseStyles) {
          // Start with base styles (if any)
          const mergedStyles = hasExplicitBaseStyles ? { ...baseStyle } : {};
          
          // Apply fallback styles on top (they take precedence)
          if (hasFallbackStyles) {
            Object.assign(mergedStyles, fallbackStyles);
          }
          
          console.log('🎨 Fallback section merged styles:', mergedStyles);
          return Object.keys(mergedStyles).length > 0 ? mergedStyles : undefined;
        }
      }
    }
    
    // No conditions matched and no fallback styles
    // Only return base styles if they were explicitly set by user in styling tab
    if (hasExplicitBaseStyles) {
      if (isDebugFormat && isDebugValue) {
        console.log('  ✅ No format conditions matched, returning explicit base styles:', baseStyle);
      }
      return { ...baseStyle };
    } else {
      if (isDebugFormat && isDebugValue) {
        console.log('  ✅ No format conditions matched and no explicit base styles - returning undefined for default theme styling');
      }
      return undefined;
    }
  };
  
  // Attach metadata for serialization and future reference
  if (formatString) {
    Object.defineProperty(styleFunction, '__formatString', { 
      value: formatString, 
      writable: false,
      enumerable: false,
      configurable: true
    });
  }
  
  if (baseStyle) {
    Object.defineProperty(styleFunction, '__baseStyle', { 
      value: baseStyle, 
      writable: false,
      enumerable: false,
      configurable: true
    });
  }
  
  return styleFunction;
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