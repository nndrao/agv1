# CellStyle Creation Fix for Conditional Formatting

## Issue
When columns have valueFormatter with conditional formatting (e.g., `[="A"][#4bdd63]@;[="B"][#3bceb1]@`), the cellStyle function was not being created in these scenarios:
1. When columns are loaded from a profile
2. When Apply & Close is clicked without changes  
3. On initial app load

This caused conditional styling (colors, styles) to not be applied even though the formatting was correct.

## Solution
Added logic to automatically create cellStyle functions when valueFormatter contains conditional styling. The fix ensures cellStyle is created in all scenarios where columns are processed.

### Changes Made

1. **column-serializer.ts**
   - Added `hasConditionalStyling()` function to detect format strings with conditional styling
   - Added `ensureCellStyleForConditionalFormatting()` to create cellStyle when needed
   - Modified `deserializeColumnCustomizations()` to ensure cellStyle is created when loading from profiles

2. **column-customization.store.ts**
   - Added the same helper functions for detecting conditional styling
   - Modified `applyChanges()` to ensure cellStyle is created for both changed and unchanged columns
   - This handles the "Apply & Close without changes" scenario

3. **data-table.tsx**
   - Added helper functions to process columns on initialization
   - Modified column initialization to ensure cellStyle functions are created
   - This handles the initial app load scenario

### How It Works

The solution detects format strings that contain:
- Color conditions: `[Green]`, `[Red]`, `[Blue]`, etc.
- Numeric conditions: `[>0]`, `[<100]`, `[>=50]`, etc.
- Text conditions: `[="A"]`, `[<>""]`, etc.
- Style directives: `[Bold]`, `[BG:Yellow]`, `[Border:2px-solid-blue]`, etc.

When detected, it automatically creates a cellStyle function that:
- Applies the conditional styles based on cell values
- Preserves any existing base styles from the Styling tab
- Properly serializes for profile storage

### Testing

Run the test script to verify the fix:
```bash
node test-cellstyle-creation.js
```

The test verifies:
1. Conditional styling detection works correctly
2. CellStyle functions are created only when needed
3. Simple formats without conditions don't get unnecessary cellStyle functions

### Result
Now conditional formatting colors and styles are properly applied in all scenarios:
- ✅ When loading columns from a saved profile
- ✅ When clicking Apply & Close without making changes
- ✅ On initial app load with formatted columns
- ✅ When applying new formats in the dialog