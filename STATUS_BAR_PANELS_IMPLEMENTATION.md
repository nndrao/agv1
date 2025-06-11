# Status Bar Panels Implementation

## Overview
Added individual toggle controls for AG-Grid status bar panels. Each panel can be enabled/disabled independently, and the status bar configuration is built dynamically based on the enabled panels.

## Implementation Details

### 1. Grid Options Configuration
Added individual boolean options for each status panel:
- `statusBarPanelTotalAndFiltered` - Combined total and filtered count (default: true)
- `statusBarPanelTotalRows` - Separate total row count (default: false) 
- `statusBarPanelFilteredRows` - Separate filtered row count (default: false)
- `statusBarPanelSelectedRows` - Selected row count (default: true)
- `statusBarPanelAggregation` - Aggregation panel for sum/avg/min/max (default: true)

### 2. Dynamic Status Bar Construction
The `useGridOptions` hook now:
1. Checks if status bar is enabled (`statusBar: true`)
2. Builds an array of status panels based on enabled options
3. Creates the proper AG-Grid statusBar configuration object
4. Applies it using `api.setGridOption('statusBar', { statusPanels })`

### 3. Panel Configuration
Each enabled panel is added as an object with:
```javascript
{
  statusPanel: 'agComponentName',
  align: 'left' | 'center' | 'right'
}
```

### 4. Default Behavior
- When status bar is first enabled, default panels are shown:
  - Total & Filtered Count (left)
  - Selected Row Count (center)
  - Aggregation Panel (right)
- Other panels are opt-in

## Usage

1. Open Grid Options Editor
2. Navigate to "Status Bar" section
3. Toggle "Show Status Bar" ON
4. Enable/disable individual panels:
   - Total & Filtered Count
   - Total Row Count
   - Filtered Row Count
   - Selected Row Count
   - Aggregation Panel
5. Click Apply to see changes immediately
6. Save Profile to persist configuration

## Technical Notes

### Why Not Direct Boolean Properties?
AG-Grid doesn't accept boolean properties for status panels. Instead, it requires:
- A `statusBar` object with a `statusPanels` array
- Each panel must be an object with `statusPanel` and optional `align` properties
- Panels are added/removed from the array based on toggle states

### Default Alignment
- Total & Filtered: Left
- Individual counts: Center
- Aggregation: Right

This provides a balanced layout across the status bar.

## Example Configuration
When all panels are enabled:
```javascript
{
  statusBar: {
    statusPanels: [
      { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
      { statusPanel: 'agTotalRowCountComponent', align: 'center' },
      { statusPanel: 'agFilteredRowCountComponent', align: 'center' },
      { statusPanel: 'agSelectedRowCountComponent', align: 'center' },
      { statusPanel: 'agAggregationComponent', align: 'right' }
    ]
  }
}
```