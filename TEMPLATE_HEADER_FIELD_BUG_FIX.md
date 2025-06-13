# Column Template Header Name and Field Bug Fix

## Issue
When applying column templates, the `headerName` and `field` properties were being copied to other columns, causing them to lose their unique identities.

## Root Cause
1. The `headerName` property was included in the list of available template properties in `TemplateSelector.tsx`
2. The `updateBulkProperties` function in the column formatting store only filtered out `headerName` when multiple columns were selected, but the `BulkTemplateApplication` component applies templates to individual columns one at a time
3. No safeguards existed to prevent `field` from being included in templates

## Solution Implemented

### 1. Column Formatting Store (`columnFormatting.store.ts`)
- Modified `updateBulkProperties` to always filter out both `field` and `headerName` properties
- These properties should never be copied between columns as they represent column identity

```typescript
// Always remove field and headerName from bulk updates
// These properties should never be copied between columns
delete filteredProperties.field;
delete filteredProperties.headerName;
```

### 2. Template Selector (`TemplateSelector.tsx`)
- Removed `headerName` from the list of available properties that can be saved in templates
- Added a safeguard in `getCurrentSettings` to skip `field` and `headerName` when processing template properties
- Added comments explaining why these properties are excluded

### 3. Simple Template Controls (`SimpleTemplateControls.tsx`)
- Added filters to exclude `field` and `headerName` when saving template properties
- Applied this filter to both modified properties and all properties scenarios

## Testing
To verify the fix:
1. Create a template from a column with custom styling/formatting
2. Apply the template to other columns
3. Verify that the target columns retain their original `headerName` and `field` values
4. Verify that other properties (styling, formatting, etc.) are correctly applied

## Prevention
- The fix ensures that column identity properties (`field` and `headerName`) are never included in templates
- This prevents accidental overwriting of column identities when applying templates
- The safeguards are applied at multiple levels for redundancy