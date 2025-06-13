# Template Save Implementation Update

## Current Behavior

When clicking "As Template" button in the Column Customization dialog:

1. **Save Column Template Dialog Opens** - Enter template name and description
2. **Click Save Template** - System attempts to capture current column formatting
3. **Details Popup Shows** - Displays what was saved in JSON format

## What Gets Saved

The template system captures:
- **Pending Changes**: Any formatting you've modified in the current session (before clicking Apply)
- **Applied Formatting**: Previously applied formatting from the active profile
- **Column Properties**: Formatting-related properties like:
  - Style properties (cellStyle, cellClass, headerClass, headerStyle)
  - Text wrapping (wrapText, autoHeight, wrapHeaderText, autoHeaderHeight)
  - Formatting (valueFormatter, type)
  - Filter settings (filter, filterParams, floatingFilter)
  - Editor settings (editable, cellEditor, cellEditorParams)

## Known Limitations

1. **Empty Templates**: If you see an empty `{}` in saved settings, it means:
   - No formatting has been applied to the column yet
   - Or the formatting hasn't been captured properly

2. **Timing Issue**: Sometimes formatting applied through the ribbon isn't immediately available for template saving

## Best Practices

1. **Apply Changes First**: Click the "Apply" button before saving as template to ensure all formatting is captured
2. **Save Profile**: For persistent formatting, save the profile after applying changes
3. **Check Details**: The popup shows exactly what's being saved - verify it includes your formatting

## Technical Details

The template system:
- Excludes column identity properties (field, headerName)
- Excludes column state properties (width, visibility, position)
- Only includes formatting and styling properties
- Stores templates independently from profiles in localStorage

## Troubleshooting

If template appears empty:
1. Ensure you've applied formatting to the column
2. Click "Apply" in the ribbon before saving template
3. Check if the column has any customizations in the current profile
4. Look at the browser console for debug messages showing what's being captured