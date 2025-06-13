# Template Independence Fix

## Issue
Templates were incorrectly storing column-specific properties (like the entire column definition) instead of just the formatting/styling changes. This caused:
1. `headerName` and `field` being copied to other columns when applying templates
2. Templates being tied to specific columns instead of being reusable
3. Unnecessary data being stored in templates

## Root Cause
The template saving logic was using `{ ...colDef, ...changes }` which included the entire column definition, not just the changed properties.

## Solution
Modified the template system to only store changed properties and exclude all column-specific properties.

### Changes Made

1. **TemplateSelector.tsx**
   - Changed `getCurrentSettings()` to only use pending changes: `const settingsToSave = { ...changes }`
   - Added comprehensive list of column-specific properties to exclude
   - Only includes style/format properties that are actually customized

2. **SimpleTemplateControls.tsx**
   - Updated `getCurrentSettings()` to return only pending changes
   - Added same list of excluded column-specific properties
   - Simplified the save logic since we're only dealing with changes

3. **columnFormatting.store.ts**
   - Enhanced `updateBulkProperties` to filter out all column-specific properties
   - Prevents any column identity properties from being applied during bulk updates

### Column-Specific Properties Excluded
```typescript
const columnSpecificProps = [
  'field',                      // Column data field
  'headerName',                 // Column display name
  'colId',                      // Column unique ID
  'columnGroupShow',            // Column group visibility
  'headerComponentFramework',   // Custom header component
  'headerComponentParams',      // Header component parameters
  'floatingFilterComponent',    // Custom filter component
  'floatingFilterComponentFramework',
  'floatingFilterComponentParams',
  'tooltipField',              // Tooltip data field
  'tooltipValueGetter',        // Tooltip value function
  'keyCreator',                // Key creation function
  'checkboxSelection',         // Checkbox selection config
  'showRowGroup',              // Row grouping display
  'dndSource',                 // Drag source config
  'dndSourceOnRowDrag',        // Drag behavior
  'rowDrag',                   // Row drag enabled
  'rowDragText',               // Row drag text
  'aggFunc',                   // Aggregation function
  'initialAggFunc',            // Initial aggregation
  'defaultAggFunc',            // Default aggregation
  'allowedAggFuncs'            // Allowed aggregations
];
```

## Benefits
1. **True Template Independence**: Templates now only contain formatting/styling properties
2. **Smaller Storage**: Templates are much smaller without unnecessary column data
3. **Better Reusability**: Templates can be applied to any column type
4. **No Identity Conflicts**: Column identities are never overwritten

## Testing
1. Create a template from a column with custom formatting
2. Apply it to different columns
3. Verify that only styling/formatting is applied
4. Verify that column names and fields remain unchanged

## Migration
Existing templates that contain column-specific properties will have those properties filtered out when applied, ensuring backward compatibility.