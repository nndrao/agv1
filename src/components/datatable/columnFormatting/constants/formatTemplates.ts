// Standard formatter options
export interface StandardFormat {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultFormat: string;
  controls: 'number' | 'currency' | 'percentage' | 'date' | 'text';
}

export interface CustomFormat {
  label: string;
  format: string;
  example: string;
  category: 'conditional' | 'visual' | 'rating' | 'indicator';
}

import { Hash, DollarSign, Percent, Calendar, Type } from 'lucide-react';

export const standardFormats: StandardFormat[] = [
  { key: 'number', label: 'Number', icon: Hash, defaultFormat: '#,##0.00', controls: 'number' },
  { key: 'currency', label: 'Currency', icon: DollarSign, defaultFormat: '$#,##0.00', controls: 'currency' },
  { key: 'percentage', label: 'Percentage', icon: Percent, defaultFormat: '0.00%', controls: 'percentage' },
  { key: 'date', label: 'Date', icon: Calendar, defaultFormat: 'MM/DD/YYYY', controls: 'date' },
  { key: 'text', label: 'Text', icon: Type, defaultFormat: '@', controls: 'text' },
];

// Custom formatter templates
export const customFormats: CustomFormat[] = [
  // Conditional Formatting
  { 
    label: 'Traffic Lights', 
    format: '[<50]"🔴 "0;[<80]"🟡 "0;"🟢 "0', 
    example: '🔴 45 → 🟡 75 → 🟢 95',
    category: 'conditional'
  },
  { 
    label: 'Pass/Fail', 
    format: '[>=60]"✓ PASS";"✗ FAIL"', 
    example: '✓ PASS (75) or ✗ FAIL (45)',
    category: 'conditional'
  },
  { 
    label: 'Temperature', 
    format: '[Blue][<32]0°F ❄️;[Red][>80]0°F 🔥;0°F', 
    example: '30°F ❄️, 85°F 🔥',
    category: 'conditional'
  },
  
  // Visual Indicators
  { 
    label: 'Progress Bar', 
    format: '[<25]"▰▱▱▱";[<50]"▰▰▱▱";[<75]"▰▰▰▱";"▰▰▰▰"', 
    example: '▰▰▱▱ (50%)',
    category: 'visual'
  },
  { 
    label: 'Data Bars', 
    format: '[<20]"█_____";[<40]"██____";[<60]"███___";[<80]"████__";"█████"', 
    example: '███___ (60%)',
    category: 'visual'
  },
  { 
    label: 'Trend Arrows', 
    format: '[Red][<0]↓ 0.0%;[Green][>0]↑ 0.0%;→ 0.0%', 
    example: '↓ -5.2%, ↑ 3.1%',
    category: 'visual'
  },
  
  // Rating Systems
  { 
    label: 'Star Rating', 
    format: '[<1]"☆☆☆☆☆";[<2]"★☆☆☆☆";[<3]"★★☆☆☆";[<4]"★★★☆☆";[<5]"★★★★☆";"★★★★★"', 
    example: '★★★☆☆ (3.5)',
    category: 'rating'
  },
  { 
    label: 'Score Grade', 
    format: '[Red][<60]0 "F";[Orange][<70]0 "D";[Yellow][<80]0 "C";[Blue][<90]0 "B";[Green]0 "A"', 
    example: '95 A, 75 C, 55 F',
    category: 'rating'
  },
  
  // Status Indicators
  { 
    label: 'Emoji Status', 
    format: '[<0]😟 0;[=0]😐 0;😊 0', 
    example: '😟 -5, 😐 0, 😊 10',
    category: 'indicator'
  },
  { 
    label: 'Check/Cross', 
    format: '[=1]"✓";[=0]"✗";0', 
    example: '✓ Yes, ✗ No',
    category: 'indicator'
  },
  { 
    label: 'Currency +/-', 
    format: '[Red]($0.00);[Green]$0.00;"Break Even"', 
    example: '($100), $100',
    category: 'indicator'
  },
];

// Date format options
export const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '12/31/2023' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '31/12/2023' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2023-12-31' },
  { value: 'MMM D, YYYY', label: 'MMM D, YYYY', example: 'Dec 31, 2023' },
  { value: 'MMMM D, YYYY', label: 'MMMM D, YYYY', example: 'December 31, 2023' },
  { value: 'D MMM YYYY', label: 'D MMM YYYY', example: '31 Dec 2023' },
  { value: 'MM/DD/YY', label: 'MM/DD/YY', example: '12/31/23' },
  { value: 'h:mm AM/PM', label: 'h:mm AM/PM', example: '3:45 PM' },
  { value: 'HH:mm:ss', label: 'HH:mm:ss', example: '15:45:30' },
  { value: 'MM/DD/YY h:mm AM/PM', label: 'DateTime', example: '12/31/23 3:45 PM' },
];

// Currency symbols
export const currencySymbols = [
  { value: '$', label: '$ (USD)' },
  { value: '€', label: '€ (EUR)' },
  { value: '£', label: '£ (GBP)' },
  { value: '¥', label: '¥ (JPY)' },
  { value: '₹', label: '₹ (INR)' },
  { value: 'C$', label: 'C$ (CAD)' },
  { value: 'A$', label: 'A$ (AUD)' },
  { value: 'Fr.', label: 'Fr. (CHF)' },
  { value: 'kr', label: 'kr (SEK)' },
  { value: 'R$', label: 'R$ (BRL)' },
];

// Common emoji for quick insertion
export const commonEmoji = [
  { emoji: '✓', name: 'Check' },
  { emoji: '✗', name: 'Cross' },
  { emoji: '★', name: 'Star' },
  { emoji: '☆', name: 'Empty Star' },
  { emoji: '●', name: 'Circle' },
  { emoji: '○', name: 'Empty Circle' },
  { emoji: '▲', name: 'Up Triangle' },
  { emoji: '▼', name: 'Down Triangle' },
  { emoji: '→', name: 'Right Arrow' },
  { emoji: '↑', name: 'Up Arrow' },
  { emoji: '↓', name: 'Down Arrow' },
  { emoji: '⚠', name: 'Warning' },
  { emoji: '🔴', name: 'Red Circle' },
  { emoji: '🟡', name: 'Yellow Circle' },
  { emoji: '🟢', name: 'Green Circle' },
  { emoji: '📈', name: 'Chart Up' },
  { emoji: '📉', name: 'Chart Down' },
  { emoji: '💰', name: 'Money' },
  { emoji: '🔥', name: 'Fire' },
  { emoji: '❄️', name: 'Snowflake' },
];