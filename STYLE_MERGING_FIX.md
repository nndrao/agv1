# Style Merging Fix for Conditional Formatters

## Problem
Cell styles configured in the styling tab were overriding the styles from conditional valueFormatters instead of merging with them. When users applied both:
1. Base styles from the Styling tab (e.g., backgroundColor, fontSize)
2. Conditional styles from valueFormatters (e.g., `[="A"][#4bdd63]@`)

Only one set of styles would be applied, not both.

## Root Cause
The `createCellStyleFunction` in `/src/components/datatable/utils/formatters.ts` was returning ONLY the conditional styles when a condition matched, without merging them with the base styles passed in.

## Solution
Modified the `createCellStyleFunction` to properly merge base and conditional styles:

### Before (incorrect):
```javascript
if (hasConditionalStyles) {
  // Return only conditional styles (no base styles from formatting)
  return extendedStyles;
}
```

### After (correct):
```javascript
if (hasConditionalStyles) {
  // Merge base styles with conditional styles (conditional takes precedence)
  const mergedStyles = { ...baseStyle, ...extendedStyles };
  return mergedStyles;
}
```

## Changes Made

1. **formatters.ts** (lines 717-723 and 788-792):
   - Fixed style merging in main condition matching
   - Fixed style merging in fallback section
   - Now properly merges base styles with conditional styles

2. **data-table.tsx** (line 140):
   - Simplified to use createCellStyleFunction directly with baseStyle
   - Removed redundant manual merging logic

## How It Works Now

When a cell has both base styles and conditional formatting:

1. **Base styles** (from Styling tab): Applied as foundation
   ```javascript
   { backgroundColor: '#f0f0f0', fontSize: 14 }
   ```

2. **Conditional styles** (from valueFormatter): Applied on top
   ```javascript
   [="A"][#4bdd63]@ // Adds { color: '#4bdd63' } when value is "A"
   ```

3. **Result**: Both styles are merged
   ```javascript
   { backgroundColor: '#f0f0f0', fontSize: 14, color: '#4bdd63' }
   ```

## Testing

Run the test script to verify:
```bash
node test-style-merging-fix.js
```

The test verifies that:
- ✅ Base styles are preserved
- ✅ Conditional styles are applied
- ✅ Conditional styles override base styles where they conflict
- ✅ The final result contains both sets of styles

## Result

Now when users:
1. Apply base styles in the Styling tab
2. Apply conditional formatting with colors

Both sets of styles will be visible in the grid cells, with conditional styles taking precedence for any conflicting properties.