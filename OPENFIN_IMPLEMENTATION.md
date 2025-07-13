# OpenFin Implementation for AGV1

## Overview

AGV1 has been reimplemented as an OpenFin workspace platform with the following architecture:
- **Workspace Platform**: Central provider window managing the application lifecycle
- **Dock Component**: Replaces React sidebar with OpenFin's native dock
- **Simple Windows**: Configuration dialogs (datasources, profiles, settings)
- **Browser Windows**: DataTable instances integrated with workspace
- **Headless Windows**: Background data providers publishing via channels
- **Channel API**: Inter-window communication for real-time data flow

## Architecture

### Component Types

1. **Provider Window** (`/provider`)
   - Initializes OpenFin workspace platform
   - Registers Home, Storefront, and Dock components
   - Manages custom actions for dock buttons
   - Handles MongoDB storage integration

2. **DataTable Windows** (`/datatable/:tableId`)
   - Standalone React components without context dependencies
   - Subscribe to OpenFin channels for data
   - Support multiple instances with unique IDs
   - Integrated with workspace for window management

3. **Headless Provider Windows** (`/provider/headless`)
   - Run STOMP data providers in background
   - Publish data to OpenFin channels
   - Managed by ProviderWindowManager service
   - Zero UI for minimal resource usage

4. **Configuration Windows**
   - **Datasource Config** (`/datasources`): Manage data connections
   - **Profile Manager** (`/profiles`): Save/load grid configurations
   - **Settings Import/Export** (`/settings/import-export`): Backup/restore

### Data Flow

```
[STOMP Server] 
    ↓
[Headless Provider Window]
    ↓ (publishes data)
[OpenFin Channel]
    ↓ (broadcasts)
[DataTable Windows] (subscribe & display)
```

## Key Components

### OpenFin Provider (`/src/openfin/provider/`)
- `provider.ts`: Platform initialization and storage overrides
- `customActions.ts`: Dock button action handlers
- `storage/mongodbEndpoint.ts`: MongoDB persistence layer

### Dock Integration (`/src/openfin/dock/`)
- `dockProvider.ts`: Dock configuration and registration
- Uses Lucide React icons converted to data URLs
- Buttons: New DataTable, Data Sources, Profiles, Settings

### Channel Management (`/src/openfin/channels/`)
- `ChannelManager.ts`: Singleton for channel operations
- Supports data, control, and config channel types
- Handles subscriptions and broadcasting

### Provider Management (`/src/openfin/services/`)
- `ProviderWindowManager.ts`: Lifecycle management for headless windows
- Health monitoring and auto-restart capabilities
- Status tracking and event notifications

### Standalone Components (`/src/components/`)
- `datatable/DataTableStandalone.tsx`: Context-free DataTable
- `config/DatasourceConfigDialog.tsx`: Datasource management UI
- `provider/HeadlessDataProvider.tsx`: Background data provider

## Running the Application

### Development Mode

1. Start the Vite dev server:
   ```bash
   npm run dev
   ```

2. Launch OpenFin (in a separate terminal):
   ```bash
   node launch-openfin.js
   ```

### Testing Multi-Window Data Flow

1. Open DevTools for the provider window (http://localhost:9090)
2. In the console, run:
   ```javascript
   testDataFlow()
   ```
3. This will:
   - Create a test provider window
   - Set up a test channel
   - Send sample data
   - Open a DataTable window to display it

## Configuration

### MongoDB Integration (Optional)

Set the MongoDB URL in environment variables:
```bash
MONGODB_URL=mongodb://localhost:27017/agv1
```

Or in the manifest's customSettings:
```json
{
  "customSettings": {
    "mongoDbUrl": "mongodb://localhost:27017/agv1"
  }
}
```

### Unified Schema

All configuration data uses this schema:
```typescript
{
  appId: string;
  userId: string;
  componentType: 'datasource' | 'profile' | 'workspace' | 'page';
  componentSubType?: string;
  caption: string;
  config: object;
  settings?: object;
  activeSettings?: object;
  createdBy: string;
  updatedBy: string;
  createdTime: Date;
  lastUpdated: Date;
}
```

## Dock Actions

- **New DataTable**: Creates a new DataTable browser window
- **Data Sources**: Opens datasource configuration dialog
- **Profiles**: Opens profile management dialog
- **Settings**: Opens import/export dialog

## Next Steps

1. **MongoDB REST API**: Implement the storage endpoint for persistence
2. **Enhanced Testing**: Add automated tests for channel communication
3. **Error Handling**: Improve resilience for network disconnections
4. **Performance**: Optimize for large datasets and multiple windows
5. **Security**: Add authentication for channel access

## Troubleshooting

### Common Issues

1. **Dock not showing**: Ensure Home and Storefront are registered first
2. **Data not updating**: Check channel names match between provider and consumer
3. **Windows not opening**: Verify URLs are correct in router configuration
4. **MongoDB errors**: Falls back to OpenFin storage gracefully

### Debug Commands

In the provider window console:
- `channelManager.getActiveChannels()`: List active channels
- `providerWindowManager.getProviders()`: List running providers
- `providerWindowManager.getStatistics()`: Provider health stats