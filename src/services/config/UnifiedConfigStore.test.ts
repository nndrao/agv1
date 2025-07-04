/**
 * Example usage of the UnifiedConfigStore
 * 
 * This demonstrates how to use the UnifiedConfigStore to work with
 * existing localStorage data while presenting it in the new unified schema format.
 */

import { UnifiedConfigStore } from './UnifiedConfigStore';

// Example 1: Basic Usage
async function basicUsageExample() {
  // Create a store instance
  const store = new UnifiedConfigStore('user123', 'my-app');
  
  // Get all configurations in the new format
  const allConfigs = await store.getAllConfigs();
  console.log('All configurations:', allConfigs);
  
  // Get a specific configuration
  const config = await store.getConfig('datatable-default-profile');
  console.log('Specific config:', config);
  
  // Get shared templates
  const templates = await store.getSharedTemplates();
  console.log('Shared templates:', templates);
  
  // Get data sources
  const dataSources = await store.getDataSourceConfigs();
  console.log('Data sources:', dataSources);
  
  // Get UI preferences
  const uiPrefs = await store.getUIPreferencesConfig();
  console.log('UI preferences:', uiPrefs);
}

// Example 2: Creating and Updating Configurations
async function createAndUpdateExample() {
  const store = new UnifiedConfigStore('user123', 'my-app');
  
  // Create a new configuration
  const newConfig = UnifiedConfigStore.createDefaultConfig(
    'datatable-custom-view',
    'DataGrid',
    'user123',
    'my-app'
  );
  
  // Customize the configuration
  newConfig.displayName = 'Sales Dashboard View';
  newConfig.metadata.tags = ['sales', 'dashboard', 'q4-2024'];
  newConfig.settings.versions.v1.config = {
    columnSettings: {
      columnCustomizations: {
        'revenue': {
          cellStyle: { fontWeight: 'bold', color: '#2e7d32' },
          valueFormatter: 'currency'
        },
        'profit_margin': {
          valueFormatter: 'percentage',
          cellClass: 'text-center'
        }
      }
    },
    gridState: {
      columnState: [],
      filterModel: {},
      sortModel: []
    },
    gridOptions: {
      rowHeight: 35,
      headerHeight: 40,
      pagination: true,
      paginationPageSize: 50
    }
  };
  
  // Save the configuration
  await store.setConfig(newConfig);
  console.log('Configuration saved:', newConfig.instanceId);
}

// Example 3: Working with Versions
async function versioningExample() {
  const store = new UnifiedConfigStore('user123', 'my-app');
  
  // Get an existing configuration
  const config = await store.getConfig('datatable-default-profile');
  if (!config) return;
  
  // Create a new version
  const newVersion = UnifiedConfigStore.createNewVersion(
    config,
    'Q1 2025 Updates',
    'Updated column formatting for Q1 reporting',
    'user123'
  );
  
  // Modify the new version's configuration
  newVersion.config.gridOptions = {
    ...newVersion.config.gridOptions,
    rowHeight: 40,
    animateRows: true
  };
  
  // Add the new version to the config
  config.settings.versions[newVersion.versionId] = newVersion;
  config.settings.activeVersionId = newVersion.versionId;
  config.updatedAt = new Date().toISOString();
  
  // Save the updated configuration
  await store.setConfig(config);
  console.log('New version created:', newVersion.versionId);
}

// Example 4: Migration Check and Execution
async function migrationExample() {
  const store = new UnifiedConfigStore('user123', 'my-app');
  
  // Check if migration is needed
  const needsMigration = await store.needsMigration();
  console.log('Migration needed:', needsMigration);
  
  if (needsMigration) {
    // Perform migration
    const results = await store.migrateToUnifiedSchema();
    console.log('Migration results:', results);
    
    if (results.errors.length > 0) {
      console.error('Migration errors:', results.errors);
    } else {
      console.log(`Successfully migrated ${results.migratedConfigs} configurations`);
    }
  }
}

// Example 5: Sharing and Permissions
async function sharingExample() {
  const store = new UnifiedConfigStore('user123', 'my-app');
  
  // Get a configuration
  const config = await store.getConfig('datatable-sales-view');
  if (!config) return;
  
  // Update sharing settings
  config.sharing.isShared = true;
  config.sharing.sharedWith = [
    {
      userId: 'user456',
      sharedAt: new Date().toISOString(),
      permissions: ['view', 'comment'],
      sharedBy: 'user123'
    },
    {
      userId: 'user789',
      sharedAt: new Date().toISOString(),
      permissions: ['view', 'edit'],
      sharedBy: 'user123'
    }
  ];
  
  // Enable public access
  config.sharing.publicAccess = {
    enabled: true,
    accessLevel: 'view',
    requiresAuth: true
  };
  
  // Update permissions
  config.permissions.canView = ['user123', 'user456', 'user789'];
  config.permissions.canEdit = ['user123', 'user789'];
  
  // Save the updated configuration
  await store.setConfig(config);
  console.log('Sharing settings updated for:', config.instanceId);
}

// Example 6: Working with Component-Specific Features
async function componentSpecificExample() {
  const store = new UnifiedConfigStore('user123', 'my-app');
  
  // Example: DataGrid specific configuration
  const gridConfig = await store.getConfig('datatable-default-profile');
  if (gridConfig) {
    const activeVersion = gridConfig.settings.versions[gridConfig.settings.activeVersionId];
    
    // Access DataGrid-specific settings
    const columnSettings = activeVersion.config.columnSettings;
    const gridState = activeVersion.config.gridState;
    const gridOptions = activeVersion.config.gridOptions;
    
    console.log('Column customizations:', columnSettings?.columnCustomizations);
    console.log('Current filters:', gridState?.filterModel);
    console.log('Grid options:', gridOptions);
  }
  
  // Example: Column Template specific configuration
  const templates = await store.getSharedTemplates();
  const currencyTemplate = templates.find(t => t.displayName?.includes('Currency'));
  if (currencyTemplate) {
    const templateConfig = currencyTemplate.settings.versions.v1.config;
    console.log('Template settings:', templateConfig.settings);
    console.log('Included properties:', templateConfig.includedProperties);
  }
}

// Example 7: Audit Trail and History
async function auditTrailExample() {
  const store = new UnifiedConfigStore('user123', 'my-app');
  
  // Get a configuration
  const config = await store.getConfig('datatable-default-profile');
  if (!config) return;
  
  // Add audit entry for current change
  const activeVersion = config.settings.versions[config.settings.activeVersionId];
  activeVersion.audit.changeHistory.push({
    timestamp: new Date().toISOString(),
    userId: 'user123',
    action: 'UPDATE_COLUMN_FORMATTING',
    changes: {
      columns: ['revenue', 'profit'],
      properties: ['valueFormatter', 'cellStyle']
    }
  });
  
  // Update last modified info
  activeVersion.audit.lastModifiedBy = 'user123';
  activeVersion.audit.lastModifiedAt = new Date().toISOString();
  
  // Update metadata
  config.metadata.lastAccessed = new Date().toISOString();
  config.metadata.accessCount += 1;
  
  // Save with audit trail
  await store.setConfig(config);
  console.log('Audit trail updated');
}

// Run examples (uncomment to test)
// basicUsageExample();
// createAndUpdateExample();
// versioningExample();
// migrationExample();
// sharingExample();
// componentSpecificExample();
// auditTrailExample();