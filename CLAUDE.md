# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AGV1 (Advanced Grid Visualization) is a React + TypeScript application that provides a highly customizable data grid experience with enterprise features, real-time updates, and comprehensive state management.

**Tech Stack:**
- React 18.3 + TypeScript
- Vite (build tool)
- AG-Grid Enterprise (data grid)
- Zustand (state management)
- shadcn/ui + Tailwind CSS (UI components)
- STOMP.js (WebSocket connections)

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## Architecture Patterns

### Component Organization
- **Container/Presentation pattern**: Container components in `/components/container` handle logic, presentational components handle UI
- **Feature-based structure**: Components organized by feature (datatable, datasource, etc.)
- **Lazy loading**: Heavy components like AG-Grid are lazy loaded for performance

### State Management
- **Zustand stores**: Global state in `/stores`, feature-specific stores in component folders
- **Context providers**: Used for dependency injection and cross-component communication
- **Local storage**: Profile configurations persisted with migration support

### Data Flow
- **DataSource abstraction**: Supports REST and WebSocket connections
- **Real-time updates**: STOMP protocol for WebSocket subscriptions
- **Profile system**: Save/load grid configurations as profiles

## Key Implementation Details

### Cell Styling and Formatters Integration
When working with cell styling and formatters, be aware of the critical integration between:
- **Styling Tab**: Sets base cell styles (colors, padding, borders)
- **Format Tab**: Applies conditional formatting with Excel-style format strings

**Important**: Style functions must preserve metadata (`__baseStyle`, `__formatString`) to maintain both base styles and conditional formatting. See `/documentation/CELL_STYLING_AND_FORMATTERS_INTEGRATION.md` for details.

### Column Customization
The column customization system uses:
- Visual editors for formatting
- Template-based formatters
- Serialization for persistence
- Bulk property updates for multi-column selection

### Performance Considerations
- Use Web Workers for heavy data processing
- Implement virtual scrolling for large datasets
- Debounce rapid updates
- Memoize expensive computations
- Code splitting with manual chunks defined in `vite.config.ts`

## Code Style Guidelines

- Use TypeScript strict mode
- Follow existing patterns in neighboring files
- Use path alias `@/` for imports from `src/`
- ESLint with unused imports detection enabled
- No console.log in production (removed by build process)

## Testing

Currently, the project has limited test coverage with example test files in:
- `/src/services/config/UnifiedConfigStore.test.ts`
- `/src/services/profile/ProfileManagementService.test.ts`

No test runner is currently configured. When adding tests, follow the existing patterns in these files.

## Common Tasks

### Adding a New Component
1. Check existing components for patterns and conventions
2. Use shadcn/ui components from `/components/ui` when possible
3. Follow the Container/Presentation pattern
4. Add proper TypeScript types
5. Consider lazy loading for heavy components

### Working with AG-Grid
- Column definitions are managed through the column customization system
- Use the profile system for saving grid configurations
- Cell renderers and editors should be memoized
- Consider performance impact of custom cell renderers

### Managing State
- Use Zustand stores for global state
- Keep component-specific state local
- Use Context API for cross-component communication
- Persist important state to localStorage with proper migration

### Styling Components
- Use Tailwind CSS classes
- Follow the design system in shadcn/ui components
- Support both light and dark themes
- Use CSS-in-JS sparingly, prefer Tailwind

## Important Files and Locations

- **Main entry**: `/src/main.tsx`
- **App component**: `/src/App.tsx`
- **DataTable core**: `/src/components/datatable/DataTable.tsx`
- **Column formatters**: `/src/components/datatable/utils/formatters.ts`
- **Profile management**: `/src/services/profile/`
- **Global stores**: `/src/stores/`
- **UI components**: `/src/components/ui/`
- **Documentation**: `/documentation/`