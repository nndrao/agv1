# Format Ribbon Content Redesign

## Overview
The FormatRibbonContent component has been completely redesigned with a simpler, more intuitive interface that separates standard and custom formatters.

## Key Changes

### 1. Format Mode Toggle
- Added a toggle button group at the top to switch between "Standard" and "Custom" formatters
- Standard mode: Common, everyday formatting needs
- Custom mode: Advanced conditional formatters with rich visual elements

### 2. Standard Formatters
Simplified to 5 core format types with context-specific controls:

- **Number**: 
  - Decimal places input
  - Prefix input (e.g., for symbols before numbers)
  - Suffix input (e.g., for units after numbers)

- **Currency**:
  - Currency symbol dropdown (10 major currencies)
  - Decimal places input
  
- **Percentage**:
  - Decimal places input
  - Multiply by 100 checkbox
  
- **Date**:
  - Date format dropdown with 10 common formats
  
- **Text**:
  - Simple text formatting (no additional controls needed)

### 3. Custom Formatters
Organized into 4 categories for better discoverability:

- **Conditional**: Traffic Lights, Pass/Fail, Temperature
- **Visual**: Progress Bars, Data Bars, Trend Arrows
- **Rating**: Star Rating, Score Grade
- **Indicators**: Emoji Status, Check/Cross, Currency +/-

Features:
- Template dropdown with categorized options
- Format editor with syntax highlighting (monospace font)
- Emoji picker popup with 20 common symbols
- Excel format guide popup with syntax help and examples

### 4. Live Preview Section
- Test value input box
- Real-time preview of formatted result
- Quick test value buttons that change based on selected format type
- Clear visual flow: input → result

### 5. UI Improvements
- Cleaner layout with better spacing
- Consistent labeling (all labels are 80px wide)
- Smaller, more compact controls (h-8 for inputs, text-xs throughout)
- Clear visual hierarchy with separators
- Removed complex nested options in favor of simple dropdowns

### 6. Removed Features
- Removed the complex category selector (numbers/currency/percent/datetime/text/custom)
- Removed separate modifiers (no separator, colorized) 
- Removed inline format string display
- Removed complex decimal increment/decrement buttons
- Removed the conditional formatting dialog button

## Benefits
1. **Simpler Mental Model**: Clear separation between standard and custom formatting
2. **Faster Access**: Common formats are immediately accessible without navigation
3. **Better Discoverability**: Custom formats are organized by use case
4. **Cleaner Interface**: Less visual clutter, more focused controls
5. **Better Preview**: Live preview with contextual test values

## Technical Implementation
- Uses the same underlying formatting engine (createExcelFormatter)
- Maintains compatibility with existing column formatting store
- Properly handles multi-column selection
- Preserves conditional styling integration