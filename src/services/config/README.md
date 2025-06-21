# UnifiedConfigStore

The `UnifiedConfigStore` provides a unified interface for working with the existing localStorage-based configuration system while presenting data in the new unified schema format defined in the profile management architecture.

## Overview

This service acts as a bridge between:
- **Old Schema**: Multiple localStorage keys with inconsistent naming and structure
- **New Schema**: Unified `ComponentConfig` format with versioning, permissions, and metadata

## Key Features

1. **Backward Compatibility**: Works with existing localStorage data without breaking changes
2. **Unified Interface**: Presents all configurations in a consistent format
3. **Gradual Migration**: Provides utilities to migrate to the new schema when ready
4. **Type Safety**: Full TypeScript support with proper type definitions
5. **Version Control**: Built-in versioning support for configurations
6. **Access Control**: Permissions and sharing capabilities

## Storage Key Mapping

| Old Key | Description | New Component Type |
|---------|-------------|-------------------|
| `grid-profile-storage` | Grid profiles with state | DataGrid |
| `column-template-store` | Reusable column templates | ColumnTemplate |
| `datatable-datasources` | Data source configurations | DataSource |
| `column-formatting-store` | UI preferences | UIPreferences |
| `column-dialog-sound-enabled` | Sound preference | (merged into UIPreferences) |

## Basic Usage

```typescript
import { UnifiedConfigStore } from './UnifiedConfigStore';

// Create a store instance
const store = new UnifiedConfigStore('userId', 'appId');

// Get all configurations
const configs = await store.getAllConfigs();

// Get a specific configuration
const config = await store.getConfig('datatable-default-profile');

// Create or update a configuration
await store.setConfig(updatedConfig);

// Delete a configuration
await store.deleteConfig('datatable-old-view');
```

## ComponentConfig Schema

The unified schema provides a consistent structure for all component configurations:

```typescript
interface ComponentConfig {
  // Identity
  instanceId: string;              // Unique identifier
  componentType: string;           // "DataGrid", "Chart", etc.
  displayName?: string;            // User-friendly name
  
  // Ownership & Access
  appId: string;
  userId: string;
  ownerId: string;
  permissions: {
    isPublic: boolean;
    canEdit: string[];
    canView: string[];
    allowSharing: boolean;
    editableByOthers: boolean;
  };
  
  // Settings with Versioning
  settings: {
    activeVersionId: string;
    versions: Record<string, Version>;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  metadata: {
    tags: string[];
    category: string;
    lastAccessed: string;
    accessCount: number;
    favorited: boolean;
    notes: string;
  };
  
  // Sharing
  sharing: {
    isShared: boolean;
    sharedWith: SharedUser[];
    publicAccess: PublicAccessConfig;
  };
}
```

## Migration Strategy

The UnifiedConfigStore supports gradual migration:

### Phase 1: Read Compatibility (Current)
- Read from old localStorage keys
- Present data in new unified format
- No changes to existing stores

### Phase 2: Dual Write (Next)
- Write to both old and new formats
- Maintain backward compatibility
- Allow testing of new features

### Phase 3: Migration Tools
- Provide UI for users to migrate
- Batch migration utilities
- Validation and rollback support

### Phase 4: Deprecation
- Switch to new format only
- Remove old key support
- Clean up legacy code

## Working with Specific Component Types

### DataGrid Configurations

```typescript
const gridConfig = await store.getConfig('datatable-sales-view');
const activeVersion = gridConfig.settings.versions[gridConfig.settings.activeVersionId];

// Access grid-specific settings
const { columnSettings, gridState, gridOptions } = activeVersion.config;
```

### Column Templates

```typescript
const templates = await store.getSharedTemplates();
// Templates are marked as public and shareable by default
```

### Data Sources

```typescript
const dataSources = await store.getDataSourceConfigs();
// Each data source has its connection configuration preserved
```

## Advanced Features

### Versioning

```typescript
// Create a new version
const newVersion = UnifiedConfigStore.createNewVersion(
  config,
  'Q1 2025 Updates',
  'Updated for new reporting requirements',
  'userId'
);

// Add to configuration
config.settings.versions[newVersion.versionId] = newVersion;
config.settings.activeVersionId = newVersion.versionId;
```

### Sharing and Permissions

```typescript
// Share with specific users
config.sharing.sharedWith.push({
  userId: 'user456',
  sharedAt: new Date().toISOString(),
  permissions: ['view', 'edit'],
  sharedBy: 'user123'
});

// Enable public access
config.sharing.publicAccess = {
  enabled: true,
  accessLevel: 'view',
  requiresAuth: true
};
```

### Audit Trail

```typescript
// Add audit entry
activeVersion.audit.changeHistory.push({
  timestamp: new Date().toISOString(),
  userId: 'user123',
  action: 'UPDATE_CONFIGURATION',
  changes: { /* change details */ }
});
```

## Implementation Notes

1. **Performance**: The store uses lazy loading and caching to minimize localStorage access
2. **Type Safety**: All methods are fully typed with TypeScript
3. **Error Handling**: Graceful fallbacks for corrupted or missing data
4. **Extensibility**: Easy to add new component types or storage backends

## Future Enhancements

1. **Remote Storage**: Add MongoDB adapter for enterprise deployments
2. **Real-time Sync**: WebSocket support for collaborative editing
3. **Compression**: Reduce storage size for large configurations
4. **Encryption**: Add encryption for sensitive configuration data
5. **Import/Export**: Support for various file formats

## See Also

- [Profile Management Architecture](../../../documentation/PROFILE_MANAGEMENT_ARCHITECTURE.md)
- [Storage Adapter Interface](../storage/StorageAdapter.ts)
- [Component Stores](../../components/datatable/stores/)