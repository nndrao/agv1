/**
 * Consolidated style utilities to eliminate duplication
 * Single source of truth for conditional styling detection and manipulation
 */

/**
 * Check if a format string contains conditional styling that requires a cellStyle function
 */
export function hasConditionalStyling(formatString: string): boolean {
  if (!formatString || !formatString.includes('[')) return false;
  
  return (
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
}

/**
 * Parse color value (supports named colors and hex)
 */
export function parseColorValue(colorValue: string): string {
  if (colorValue.startsWith('#')) {
    return colorValue;
  }
  
  const colorMap: Record<string, string> = {
    'red': '#dc2626',
    'green': '#16a34a',
    'blue': '#2563eb',
    'yellow': '#fbbf24',
    'orange': '#ea580c',
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
    'lightgreen': '#22c55e',
    'lightred': '#ef4444',
    'magenta': '#ff00ff',
    'cyan': '#00ffff'
  };
  
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
export function parseStyleDirectives(section: string): React.CSSProperties {
  const styles: React.CSSProperties = {};
  const brackets = section.match(/\[[^\]]+\]/g) || [];
  
  for (const bracket of brackets) {
    const content = bracket.slice(1, -1); // Remove [ and ]
    const lowerContent = content.toLowerCase();
    
    // Background color
    if (content.match(/^(BG|Background):/i)) {
      const colorValue = content.split(':')[1];
      styles.backgroundColor = parseColorValue(colorValue);
    }
    
    // Border
    else if (content.match(/^(Border|B):/i)) {
      const borderValue = content.split(':')[1];
      const borderParts = borderValue.split('-');
      
      if (borderParts.length >= 3) {
        const width = borderParts[0];
        const style = borderParts[1];
        const color = parseColorValue(borderParts.slice(2).join('-'));
        styles.border = `${width} ${style} ${color}`;
      } else if (borderParts.length === 2) {
        const width = borderParts[0];
        const color = parseColorValue(borderParts[1]);
        styles.border = `${width} solid ${color}`;
      } else {
        const color = parseColorValue(borderValue);
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