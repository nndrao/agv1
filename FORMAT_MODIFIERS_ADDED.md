# Format Modifiers Added

## Overview
Added two new modifiers for Number, Currency, and Percentage formatters:
1. **Thousands Separator Toggle** - Enable/disable comma separators (e.g., 1,234 vs 1234)
2. **+/- Color Toggle** - Apply green color for positive values and red for negative values

## Implementation Details

### 1. State Management
Added two new state variables:
```typescript
const [useThousandsSeparator, setUseThousandsSeparator] = useState(true);
const [useColorForSign, setUseColorForSign] = useState(false);
```

### 2. Format String Generation
Updated the `buildFormatString` function to incorporate these modifiers:

#### Number Format
- Without separator: `0.00` instead of `#,##0.00`
- With colors: `[Green]#,##0.00;[Red]-#,##0.00`

#### Currency Format
- Without separator: `"$" 0.00` instead of `"$" #,##0.00`
- With colors: `[Green]"$" #,##0.00;[Red]"$" -#,##0.00`

#### Percentage Format
- Without separator: `0.00%` instead of `#,##0.00%`
- With colors: `[Green]#,##0.00%;[Red]-#,##0.00%`

### 3. UI Controls
Added modifier checkboxes for each format type:
- Positioned below other format-specific controls
- Consistent styling with checkbox inputs
- Clear labels: "Thousands separator" and "+/- colors"

## Examples

### Number Format
- Standard: `1,234.56`
- No separator: `1234.56`
- With colors: Green `1,234.56` / Red `-1,234.56`
- Both modifiers: Green `1234.56` / Red `-1234.56`

### Currency Format (USD)
- Standard: `$ 1,234.56`
- No separator: `$ 1234.56`
- With colors: Green `$ 1,234.56` / Red `$ -1,234.56`
- Both modifiers: Green `$ 1234.56` / Red `$ -1234.56`

### Percentage Format
- Standard: `12.34%`
- No separator: `1234.56%` (for large percentages)
- With colors: Green `12.34%` / Red `-12.34%`
- Both modifiers: Green `1234.56%` / Red `-1234.56%`

## Testing
1. Select a numeric column
2. Choose Number, Currency, or Percentage format
3. Toggle "Thousands separator" checkbox to remove/add commas
4. Toggle "+/- colors" checkbox to apply conditional coloring
5. Preview shows the result immediately
6. Apply to see changes in the grid

## Benefits
1. **Flexibility**: Users can customize number display based on their needs
2. **Visual Clarity**: Color coding helps identify positive/negative values quickly
3. **Space Saving**: Removing separators can save space in narrow columns
4. **Consistency**: Same modifiers work across all numeric format types