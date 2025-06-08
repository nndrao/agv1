/**
 * Consolidated style utilities to eliminate duplication
 * Single source of truth for conditional styling detection and manipulation
 */

/**
 * Check if a format string contains conditional styling that requires a cellStyle function
 */
export function hasConditionalStyling(formatString: string): boolean {
  if (!formatString || !formatString.includes('[')) {
    console.log('[hasConditionalStyling] No brackets found in format string:', formatString);
    return false;
  }
  
  const result = (
    // Basic conditional colors
    formatString.toLowerCase().includes('[green]') || 
    formatString.toLowerCase().includes('[red]') || 
    formatString.toLowerCase().includes('[blue]') || 
    formatString.toLowerCase().includes('[yellow]') || 
    formatString.toLowerCase().includes('[orange]') || 
    formatString.toLowerCase().includes('[purple]') || 
    formatString.toLowerCase().includes('[gray]') || 
    formatString.toLowerCase().includes('[grey]') || 
    formatString.toLowerCase().includes('[magenta]') || 
    formatString.toLowerCase().includes('[cyan]') || 
    // Conditions
    formatString.includes('[>') || 
    formatString.includes('[<') || 
    formatString.includes('[=') || 
    formatString.includes('[#') || // Hex colors
    formatString.includes('[@=') || // Text equality 
    formatString.includes('[<>') ||
    // Extended styling directives
    formatString.includes('Weight:') ||
    formatString.includes('FontWeight:') ||
    formatString.includes('Background:') ||
    formatString.includes('BG:') ||
    formatString.includes('Border:') ||
    formatString.includes('B:') ||
    formatString.includes('Size:') ||
    formatString.includes('FontSize:') ||
    formatString.includes('Align:') ||
    formatString.includes('TextAlign:') ||
    formatString.includes('Padding:') ||
    formatString.includes('P:') ||
    // Keyword styles
    formatString.includes('[Bold]') ||
    formatString.includes('[Italic]') ||
    formatString.includes('[Underline]') ||
    formatString.includes('[Strikethrough]') ||
    formatString.includes('[Center]') ||
    formatString.includes('[Left]') ||
    formatString.includes('[Right]')
  );
  
  console.log('[hasConditionalStyling] Result for format string:', {
    formatString: formatString,
    hasConditionalStyling: result,
    hasHexColors: /\[#[0-9A-Fa-f]{3,6}\]/.test(formatString),
    hasColorNames: /\[(Green|Red|Blue|Yellow|Orange|Purple|Gray|Grey|Magenta|Cyan)\]/i.test(formatString),
    hasConditions: /\[[<>=@]/.test(formatString),
    hasStyleDirectives: /\[(BG:|Background:|Border:|B:|Size:|FontSize:|Align:|TextAlign:|Padding:|P:|Weight:|FontWeight:|Bold|Italic|Underline|Center|Left|Right)/i.test(formatString)
  });
  
  return result;
}

/**
 * Parse color value (supports named colors and hex)
 * Now with theme-aware vibrant colors for trading applications
 */
export function parseColorValue(colorValue: string, isDarkMode: boolean = false): string {
  if (colorValue.startsWith('#')) {
    return colorValue;
  }
  
  // Theme-aware color mappings for vibrant trading colors
  const lightModeColors: Record<string, string> = {
    // Vibrant teal shades for positive/green (darker for better contrast)
    'green': '#0f766e',     // Teal-700
    'lightgreen': '#0d9488', // Teal-600
    'darkgreen': '#115e59',  // Teal-800
    
    // Vibrant orange-red shades for negative/red
    'red': '#f97316',       // Orange-500
    'lightred': '#fb923c',  // Orange-400
    'darkred': '#ea580c',   // Orange-600
    
    // Other colors
    'blue': '#2563eb',
    'yellow': '#fbbf24',
    'orange': '#f97316',
    'purple': '#9333ea',
    'pink': '#ec4899',
    'gray': '#6b7280',
    'grey': '#6b7280',
    'black': '#000000',
    'white': '#ffffff',
    'lightgray': '#d1d5db',
    'lightgrey': '#d1d5db',
    'darkgray': '#374151',
    'darkgrey': '#374151',
    'lightblue': '#3b82f6',
    'magenta': '#ff00ff',
    'cyan': '#00ffff'
  };
  
  const darkModeColors: Record<string, string> = {
    // Vibrant teal shades for positive/green (brighter for dark mode)
    'green': '#2dd4bf',     // Teal-400
    'lightgreen': '#5eead4', // Teal-300
    'darkgreen': '#14b8a6',  // Teal-500
    
    // Vibrant orange-red shades for negative/red (brighter for dark mode)
    'red': '#fb923c',       // Orange-400
    'lightred': '#fdba74',  // Orange-300
    'darkred': '#f97316',   // Orange-500
    
    // Other colors adjusted for dark mode
    'blue': '#3b82f6',
    'yellow': '#fde047',
    'orange': '#fb923c',
    'purple': '#a855f7',
    'pink': '#f472b6',
    'gray': '#9ca3af',
    'grey': '#9ca3af',
    'black': '#ffffff',
    'white': '#000000',
    'lightgray': '#374151',
    'lightgrey': '#374151',
    'darkgray': '#d1d5db',
    'darkgrey': '#d1d5db',
    'lightblue': '#60a5fa',
    'magenta': '#ff66ff',
    'cyan': '#66ffff'
  };
  
  const colorMap = isDarkMode ? darkModeColors : lightModeColors;
  return colorMap[colorValue.toLowerCase()] || colorValue;
}

/**
 * Check if a bracket content is a style directive
 */
export function isStyleDirective(content: string): boolean {
  const stylePatterns = [
    /^BG:/i,           // Background: [BG:Yellow] or [BG:#ff0000]
    /^Background:/i,   // Background: [Background:Yellow]
    /^Border:/i,       // Border: [Border:2px-solid-blue]
    /^B:/i,            // Border short: [B:2px-solid-blue]
    /^Size:/i,         // Font size: [Size:14]
    /^FontSize:/i,     // Font size: [FontSize:14]
    /^Align:/i,        // Text align: [Align:center]
    /^TextAlign:/i,    // Text align: [TextAlign:center]
    /^Padding:/i,      // Padding: [Padding:4px-8px]
    /^P:/i,            // Padding short: [P:4px-8px]
    /^Weight:/i,       // Font weight: [Weight:bold]
    /^FontWeight:/i,   // Font weight: [FontWeight:bold]
  ];
  
  const keywordStyles = [
    'bold', 'italic', 'underline', 'strikethrough',
    'center', 'left', 'right'
  ];
  
  return stylePatterns.some(pattern => pattern.test(content)) ||
         keywordStyles.includes(content.toLowerCase());
}

/**
 * Parse extended style directives from format string
 */
export function parseStyleDirectives(section: string, isDarkMode: boolean = false): React.CSSProperties {
  const styles: React.CSSProperties = {};
  const brackets = section.match(/\[[^\]]+\]/g) || [];
  
  for (const bracket of brackets) {
    const content = bracket.slice(1, -1); // Remove [ and ]
    const lowerContent = content.toLowerCase();
    
    // Background color
    if (content.match(/^(BG|Background):/i)) {
      const colorValue = content.split(':')[1];
      styles.backgroundColor = parseColorValue(colorValue, isDarkMode);
    }
    
    // Border
    else if (content.match(/^(Border|B):/i)) {
      const borderValue = content.split(':')[1];
      const borderParts = borderValue.split('-');
      
      if (borderParts.length >= 3) {
        const width = borderParts[0];
        const style = borderParts[1];
        const color = parseColorValue(borderParts.slice(2).join('-'), isDarkMode);
        styles.border = `${width} ${style} ${color}`;
      } else if (borderParts.length === 2) {
        const width = borderParts[0];
        const color = parseColorValue(borderParts[1], isDarkMode);
        styles.border = `${width} solid ${color}`;
      } else {
        const color = parseColorValue(borderValue, isDarkMode);
        styles.border = `1px solid ${color}`;
      }
    }
    
    // Font size
    else if (content.match(/^(Size|FontSize):/i)) {
      const sizeValue = content.split(':')[1];
      styles.fontSize = sizeValue.endsWith('px') ? sizeValue : `${sizeValue}px`;
    }
    
    // Text alignment
    else if (content.match(/^(Align|TextAlign):/i)) {
      const alignValue = content.split(':')[1].toLowerCase();
      styles.textAlign = alignValue as 'left' | 'center' | 'right';
    }
    
    // Padding
    else if (content.match(/^(Padding|P):/i)) {
      const paddingValue = content.split(':')[1];
      const paddingParts = paddingValue.split('-');
      
      if (paddingParts.length === 1) {
        styles.padding = paddingParts[0].endsWith('px') ? paddingParts[0] : `${paddingParts[0]}px`;
      } else if (paddingParts.length === 2) {
        const vertical = paddingParts[0].endsWith('px') ? paddingParts[0] : `${paddingParts[0]}px`;
        const horizontal = paddingParts[1].endsWith('px') ? paddingParts[1] : `${paddingParts[1]}px`;
        styles.padding = `${vertical} ${horizontal}`;
      } else if (paddingParts.length === 4) {
        const formattedParts = paddingParts.map(p => p.endsWith('px') ? p : `${p}px`);
        styles.padding = formattedParts.join(' ');
      }
    }
    
    // Font weight
    else if (content.match(/^(Weight|FontWeight):/i)) {
      const weightValue = content.split(':')[1];
      // Don't lowercase numeric weights like "900", "700", etc.
      styles.fontWeight = weightValue as React.CSSProperties['fontWeight'];
    }
    
    // Keyword styles
    else if (lowerContent === 'bold') {
      styles.fontWeight = 'bold';
    }
    else if (lowerContent === 'italic') {
      styles.fontStyle = 'italic';
    }
    else if (lowerContent === 'underline') {
      styles.textDecoration = 'underline';
    }
    else if (lowerContent === 'strikethrough') {
      styles.textDecoration = 'line-through';
    }
    else if (lowerContent === 'center') {
      styles.textAlign = 'center';
    }
    else if (lowerContent === 'left') {
      styles.textAlign = 'left';
    }
    else if (lowerContent === 'right') {
      styles.textAlign = 'right';
    }
  }
  
  return styles;
}

// Re-export functions from formatters that are used in multiple places
export { createCellStyleFunction } from './formatters';