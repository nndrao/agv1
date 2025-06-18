# Dockview DataTable Integration

This implementation integrates the DataTable component with [Dockview](https://github.com/mathuo/dockview), providing a flexible, multi-panel interface for working with multiple DataTables simultaneously.

## Features

### Core Functionality
- **Dynamic Panel Creation**: Create DataTable instances on demand
- **Multiple Data Sources**: Quick create buttons for different data source types
- **Panel Management**: Add, remove, rearrange panels
- **State Isolation**: Each DataTable maintains its own state
- **Theme Support**: Seamless light/dark mode switching

### Dockview Features
- **Drag & Drop**: Rearrange panels by dragging tabs
- **Split Views**: Split panels horizontally or vertically
- **Floating Panels**: Pop out panels as floating windows
- **Tab Management**: Close, rename, and organize tabs
- **Responsive Layout**: Adapts to container size

## Usage

### Basic Integration
```tsx
import { DockviewDataTableApp } from '@/components/dockview/DockviewDataTableApp';

function App() {
  return <DockviewDataTableApp />;
}
```

### Custom Implementation
```tsx
import { DockviewContainer } from '@/components/dockview/DockviewContainer';

function MyApp() {
  const [darkMode, setDarkMode] = useState(false);
  
  return (
    <DockviewContainer
      darkMode={darkMode}
      onPanelCountChange={(count) => console.log(`${count} panels`)}
    />
  );
}
```

## Components

### DockviewContainer
Main container component that manages the Dockview instance and DataTable panels.

**Props:**
- `darkMode?: boolean` - Enable dark mode
- `onPanelCountChange?: (count: number) => void` - Callback for panel count changes

### DataTablePanel
Panel component that renders a DataTable instance within a Dockview panel.

**Features:**
- Full DataTable functionality
- Profile management
- Column formatting
- Data source configuration
- Grid options

### Toolbar
Provides quick actions for creating new DataTables:
- New DataTable (blank)
- Mock Data
- CSV Import
- JSON Import
- API Connection

## Styling

### Theme Variables
The component uses CSS variables that integrate with the DataTable design system:

```css
/* Light Mode */
--dv-background-color: hsl(0 0% 100%);
--dv-tabs-container-background-color: hsl(210 40% 96.1%);
--dv-activegroup-visiblepanel-tab-background-color: hsl(0 0% 100%);

/* Dark Mode */
--dv-background-color: hsl(222.2 84% 4.9%);
--dv-tabs-container-background-color: hsl(217.2 32.6% 17.5%);
--dv-activegroup-visiblepanel-tab-background-color: hsl(222.2 84% 4.9%);
```

### Custom Styling
Custom styles are defined in `dockview-custom.css` to match the DataTable design system.

## Keyboard Shortcuts
- `Ctrl/Cmd + N`: Create new DataTable
- `Ctrl/Cmd + W`: Close current panel
- `Ctrl/Cmd + Tab`: Switch between panels
- `F11`: Toggle fullscreen for current panel

## Panel Operations

### Creating Panels
```typescript
// Create with default settings
createNewDataTable();

// Create with specific title
createNewDataTable('Sales Data');

// Create with data source
createTableWithSource('csv');
```

### Managing Panels
- Click tab to focus panel
- Click × to close panel
- Drag tab to reorder
- Right-click for context menu

## State Management
Each DataTable panel maintains its own:
- Data source
- Column configurations
- Filter/sort state
- Profile settings
- Formatting rules

## Performance Considerations
- Panels are lazily loaded
- Inactive panels pause processing
- Virtual scrolling for large datasets
- Efficient state isolation

## Future Enhancements
- [ ] Save/restore workspace layouts
- [ ] Panel templates
- [ ] Synchronized scrolling
- [ ] Cross-panel data operations
- [ ] Export workspace configuration