# Running the Dockview Version

The DataTable with Dockview integration is now set up and ready to run.

## Quick Start

### Development Mode

```bash
# Run the Dockview version
npm run dev:dockview
```

Then open your browser to:
- http://localhost:5173/index-dockview.html (or the port shown in terminal)

### Production Build

```bash
# Build the Dockview version
npm run build:dockview
```

## What You'll See

1. **Toolbar** - Create new DataTable instances with different data sources
2. **Dockview Panels** - Each DataTable runs in its own panel
3. **Drag & Drop** - Rearrange panels by dragging tabs
4. **Split Views** - Right-click tabs to split horizontally/vertically

## Features Working

- ✅ Multiple DataTable instances
- ✅ Independent state per panel
- ✅ Drag and drop panels
- ✅ Close panels
- ✅ Theme support (light/dark)
- ✅ Mock data generation
- ✅ Full DataTable functionality in each panel

## Troubleshooting

If you see any errors:

1. **Port in use**: The dev server will automatically try another port (e.g., 5174)
2. **Build warnings**: CSS warnings about `text-\\[10px\\]` are harmless
3. **Large chunk warnings**: Normal for AG-Grid, doesn't affect functionality

## Next Steps

To customize the data sources for each panel, modify the `DataTablePanel` component in:
`src/components/dockview/DockviewContainer.tsx`

You can:
- Load different CSV files per panel
- Connect to different APIs
- Use different mock data generators
- Apply different profiles per panel