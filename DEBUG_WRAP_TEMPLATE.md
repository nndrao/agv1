# Debug: Wrap Properties in Templates

## The Issue
- `wrapText` and `autoHeight` work when toggled directly in the Styling tab
- But they don't work when applied via templates

## Direct Application (WORKS)
```javascript
// From StylingRibbonContent.tsx
onCheckedChange={(checked) => updateBulkProperty('wrapText', checked)}
onCheckedChange={(checked) => updateBulkProperty('autoHeight', checked)}
```

## Template Application Flow
1. **Save Template**:
   - User toggles wrap/auto-height in Styling tab
   - Opens "Save Template" dialog
   - Must SELECT the checkboxes for `wrapText`, `autoHeight`, etc.
   - Template saves only SELECTED properties

2. **Apply Template**:
   - `applyTemplate()` returns settings from template
   - `updateBulkProperties(settings)` applies them
   - Should work the same as direct application

## Potential Issues

### Issue 1: Properties Not Selected
- User might not be selecting wrap properties when saving template
- Solution: Check if wrap properties appear in the checkbox list
- Solution: Check if they're pre-selected when modified

### Issue 2: Properties Not Detected as Modified
- If set before dialog opens, might not be in `pendingChanges`
- Solution: Added code to check `columnDefinitions` too

### Issue 3: Template Not Saving Boolean Values
- Boolean `false` might be filtered out somewhere
- Solution: Added explicit handling for wrap properties

### Issue 4: Properties Lost During Processing
- `getCurrentSettings()` might skip them
- Solution: Added explicit inclusion of wrap properties

## To Debug
1. Open browser console
2. Toggle wrap text ON in styling tab
3. Save as template - CHECK if wrap properties are in the list
4. Look for console logs showing wrap property values
5. Apply template and check logs again

## Expected Console Logs
```
[TemplateSelector] Wrap properties in combined: {
  wrapText: true,
  autoHeight: true,
  ...
}

[TemplateSelector] getCurrentSettings processed: {
  wrapText: true,
  autoHeight: true,
  ...
}

[TemplateSelector] Saving template with settings: {
  wrapText: true,
  autoHeight: true,
  ...
}

[ColumnTemplateStore] applyTemplate returning: {
  wrapText: true,
  autoHeight: true,
  ...
}
```