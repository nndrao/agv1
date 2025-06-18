# DataTable Dockview Integration

## Overview

The Dockview integration allows users to create and manage multiple DataTable instances in a flexible, dockable panel layout. This enables powerful workflows such as:

- Comparing data from different sources side-by-side
- Working with multiple datasets simultaneously
- Creating custom dashboard layouts
- Floating panels for multi-monitor setups

## Architecture

### Component Structure

```
DockviewDataTableApp
└── DockviewDemo
    └── DockviewContainer
        ├── Toolbar (Create new tables)
        └── DockviewReact
            └── DataTablePanel(s)
                └── DataTableContainer
```

### Key Components

#### DockviewContainer
The main container that manages the Dockview instance and DataTable panels.

```typescript
interface DockviewContainerProps {
  darkMode?: boolean;
  onPanelCountChange?: (count: number) => void;
}
```

#### DataTablePanel
Individual panel component that renders a DataTable instance.

```typescript
const DataTablePanel: React.FC<IDockviewPanelProps> = ({ api, params }) => {
  // Each panel maintains its own DataTable state
  return <DataTableContainer {...params} />;
};
```

## Usage Examples

### Basic Setup

Replace your App.tsx with the Dockview version:

```typescript
// App.tsx
import React from 'react';
import { DockviewDataTableApp } from '@/components/dockview/DockviewDataTableApp';

function App() {
  return <DockviewDataTableApp />;
}

export default App;
```

### Custom Implementation

```typescript
import { DockviewContainer } from '@/components/dockview/DockviewContainer';

function MyCustomApp() {
  const [darkMode, setDarkMode] = useState(false);
  const [panelCount, setPanelCount] = useState(0);

  return (
    <div>
      <header>
        <h1>My DataTable Application</h1>
        <span>{panelCount} tables open</span>
      </header>
      
      <DockviewContainer
        darkMode={darkMode}
        onPanelCountChange={setPanelCount}
      />
    </div>
  );
}
```

### Programmatic Panel Creation

```typescript
// Get reference to Dockview API
const dockviewRef = useRef<DockviewApi | null>(null);

// Create panel with specific configuration
const createCustomTable = () => {
  if (!dockviewRef.current) return;
  
  const panel = dockviewRef.current.addPanel({
    id: `custom-${Date.now()}`,
    component: 'dataTable',
    title: 'Custom Data',
    params: {
      tableId: 'custom-1',
      title: 'Sales Data 2024',
      profile: 'sales-profile',
      dataSource: {
        type: 'csv',
        url: '/data/sales-2024.csv'
      }
    }
  });
  
  panel.focus();
};
```

## Features

### Panel Management

#### Creating Panels
- Click "New DataTable" to create a blank table
- Use quick create buttons for specific data sources
- Each panel gets a unique ID and maintains its own state

#### Panel Operations
- **Drag & Drop**: Rearrange panels by dragging tabs
- **Split**: Right-click to split horizontally/vertically
- **Float**: Drag panel out to create floating window
- **Close**: Click × on tab or use Ctrl/Cmd+W

### Data Source Integration

Each panel can have its own data source:

```typescript
// Mock Data
createTableWithSource('mock');

// CSV Import
createTableWithSource('csv');

// JSON Data
createTableWithSource('json');

// API Connection
createTableWithSource('api');
```

### State Isolation

Each DataTable panel maintains independent:
- Data source configuration
- Column definitions and formatting
- Filter and sort states
- Profile settings
- Grid options

### Theme Integration

The Dockview theme automatically adapts to light/dark mode:

```css
/* Light mode */
.dockview-theme-light {
  --dv-background-color: hsl(0 0% 100%);
  --dv-tabs-container-background-color: hsl(210 40% 96.1%);
}

/* Dark mode */
.dockview-theme-dark {
  --dv-background-color: hsl(222.2 84% 4.9%);
  --dv-tabs-container-background-color: hsl(217.2 32.6% 17.5%);
}
```

## Workflows

### Multi-Source Comparison

1. Create first DataTable with CSV data
2. Split panel vertically
3. Create second DataTable with API data
4. Compare datasets side-by-side

### Dashboard Creation

1. Create multiple DataTable panels
2. Arrange in grid layout
3. Configure each with different data views
4. Save workspace configuration

### Data Analysis Workflow

1. Load main dataset in primary panel
2. Create filtered views in additional panels
3. Float detail views to secondary monitor
4. Export combined analysis

## Keyboard Shortcuts

- `Ctrl/Cmd + N`: New DataTable
- `Ctrl/Cmd + W`: Close current panel
- `Ctrl/Cmd + Tab`: Cycle through panels
- `Ctrl/Cmd + Shift + Tab`: Cycle backwards
- `F11`: Maximize current panel

## Performance Considerations

### Lazy Loading
- Panels are created on demand
- DataTable components load when panel is activated
- Inactive panels pause rendering

### Memory Management
- Each panel manages its own memory
- Closed panels release resources
- Virtual scrolling for large datasets

### Optimization Tips
- Limit number of active panels
- Close unused panels
- Use profiles to save/restore configurations
- Enable virtual scrolling for large datasets

## Customization

### Custom Panel Types

```typescript
// Register custom panel type
const customPanelRenderer: IContentRenderer = {
  element: MyCustomPanel,
};

// Use in Dockview
<DockviewReact
  components={{
    dataTable: dataTablePanelRenderer,
    customPanel: customPanelRenderer,
  }}
/>
```

### Styling

Override Dockview styles in `dockview-custom.css`:

```css
/* Custom tab styling */
.dockview-theme-light .tab {
  background: var(--custom-tab-bg);
  color: var(--custom-tab-color);
}

/* Custom panel borders */
.dockview-theme-light .view-container {
  border: 2px solid var(--custom-border);
}
```

### Event Handling

```typescript
// Listen to panel events
dockviewApi.onDidAddPanel((panel) => {
  console.log('Panel added:', panel.id);
});

dockviewApi.onDidRemovePanel((panel) => {
  console.log('Panel removed:', panel.id);
});

dockviewApi.onDidActivePanelChange((panel) => {
  console.log('Active panel:', panel?.id);
});
```

## Best Practices

1. **Panel Naming**: Use descriptive titles for panels
2. **State Management**: Save important configurations to profiles
3. **Performance**: Monitor panel count and close unused panels
4. **Layout**: Save useful layouts for reuse
5. **Data Sources**: Cache frequently used data sources

## Troubleshooting

### Common Issues

1. **Panels not rendering**
   - Check console for errors
   - Verify DataTable component is exported correctly
   - Ensure Dockview styles are loaded

2. **Theme not applying**
   - Verify dark mode class on document element
   - Check CSS variable definitions
   - Clear browser cache

3. **Performance issues**
   - Reduce number of open panels
   - Enable virtual scrolling
   - Check data source performance

## Future Enhancements

- [ ] Workspace save/restore
- [ ] Panel templates
- [ ] Cross-panel data operations
- [ ] Synchronized scrolling
- [ ] Panel grouping
- [ ] Custom layouts library