# Grid Options Additions

## Added Missing Grid Options

Based on AG-Grid documentation, I've added the following missing grid options:

### 1. Row Grouping Panel Options
- **rowGroupPanelShow**: Controls visibility of the row group panel
  - `'never'` - Never show the panel
  - `'always'` - Always show the panel
  - `'onlyWhenGrouping'` - Show only when columns are grouped
- **suppressRowGroupHidesColumns**: Prevent hiding columns when they're used for grouping
- **suppressMakeColumnVisibleAfterUnGroup**: Keep columns hidden after ungrouping

### 2. Sidebar Options
- **sideBar**: Show/hide the sidebar (converts boolean to proper sidebar config)
  - `true` - Shows default sidebar with Columns and Filters panels
  - `false` - Hides the sidebar
- **suppressMenuHide**: Prevent sidebar from closing automatically

### 3. Status Bar Options
- **statusBar**: Show/hide the status bar (converts boolean to proper status bar config)
  - `true` - Shows default status bar with row count, filter count, etc.
  - `false` - Hides the status bar
- **enableStatusBar**: Legacy option that maps to statusBar

## Implementation Details

### Grid Options Config
Added three new sections to `gridOptionsConfig.ts`:
1. Extended the "Row Grouping" section with panel options
2. Added "Sidebar & Panels" section
3. Added "Status Bar" section

### Type Updates
Updated `GridOptionsConfig` interface in `types.ts` to include:
- Row grouping panel options
- Sidebar configuration (boolean or object)
- Status bar configuration (boolean or object)

### Grid Options Hook
Updated `useGridOptions.ts` to handle:
- New row grouping options
- Boolean to object conversion for sidebar (creates default panels)
- Boolean to object conversion for status bar (creates default status panels)

## Testing
1. Open Grid Options editor
2. Navigate to "Row Grouping" section
   - Test the Row Group Panel dropdown
   - Test suppress options
3. Navigate to "Sidebar & Panels" section
   - Toggle sidebar on/off
   - Test suppress menu hide
4. Navigate to "Status Bar" section
   - Toggle status bar on/off
5. Apply changes and verify they persist after save/reload

## Default Configurations

### Default Sidebar (when enabled)
```javascript
{
  toolPanels: [
    {
      id: 'columns',
      labelDefault: 'Columns',
      labelKey: 'columns',
      iconKey: 'columns',
      toolPanel: 'agColumnsToolPanel',
    },
    {
      id: 'filters',
      labelDefault: 'Filters',
      labelKey: 'filters',
      iconKey: 'filter',
      toolPanel: 'agFiltersToolPanel',
    },
  ]
}
```

### Default Status Bar (when enabled)
```javascript
{
  statusPanels: [
    { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
    { statusPanel: 'agTotalRowCountComponent', align: 'center' },
    { statusPanel: 'agFilteredRowCountComponent', align: 'center' },
    { statusPanel: 'agSelectedRowCountComponent', align: 'center' },
    { statusPanel: 'agAggregationComponent', align: 'right' }
  ]
}
```