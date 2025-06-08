import { useProfileStore } from './profile.store';
import { logStorageAnalysis } from './storageAnalyzer';

/**
 * Migrate all profiles to use lightweight column serialization
 * This will convert all existing profiles that still use full columnDefs
 * to the new lightweight format
 */
export function migrateAllProfilesToLightweight() {
  const store = useProfileStore.getState();
  const profiles = store.profiles;
  
  console.group('🔄 Migrating profiles to lightweight format');
  
  let migratedCount = 0;
  
  profiles.forEach(profile => {
    // Check if profile has full columnDefs but no lightweight format
    if (profile.gridState.columnDefs && 
        profile.gridState.columnDefs.length > 0 && 
        !profile.gridState.columnCustomizations) {
      
      console.log(`📦 Migrating profile: ${profile.name} (${profile.id})`);
      
      // Get the column definitions using the store method (handles all formats)
      const columnDefs = store.getColumnDefs(profile.id);
      
      if (columnDefs) {
        // Save using the lightweight format
        // We need to temporarily set this as the active profile to use saveColumnCustomizations
        const currentActiveId = store.activeProfileId;
        store.setActiveProfile(profile.id);
        
        // Save the columns in lightweight format
        store.saveColumnCustomizations(columnDefs, columnDefs);
        
        // Restore the previous active profile
        store.setActiveProfile(currentActiveId);
        
        migratedCount++;
        console.log(`✅ Successfully migrated profile: ${profile.name}`);
      }
    } else if (profile.gridState.columnCustomizations) {
      console.log(`⏭️  Profile already using lightweight format: ${profile.name}`);
    } else {
      console.log(`⏭️  Profile has no column definitions: ${profile.name}`);
    }
  });
  
  console.log(`\n📊 Migration complete: ${migratedCount} profiles migrated`);
  console.groupEnd();
  
  // Show storage analysis after migration
  console.log('\n');
  logStorageAnalysis();
}

/**
 * Force refresh all profiles to ensure they're using the latest format
 * This will reload column definitions and re-save them
 */
export function refreshAllProfiles() {
  const store = useProfileStore.getState();
  const profiles = store.profiles;
  const currentActiveId = store.activeProfileId;
  
  console.group('🔄 Refreshing all profiles');
  
  profiles.forEach(profile => {
    const columnDefs = store.getColumnDefs(profile.id);
    if (columnDefs && columnDefs.length > 0) {
      console.log(`🔧 Refreshing profile: ${profile.name}`);
      
      // Temporarily switch to this profile
      store.setActiveProfile(profile.id);
      
      // Re-save with current format
      store.saveColumnCustomizations(columnDefs, profile.gridState.baseColumnDefs || columnDefs);
      
      console.log(`✅ Refreshed: ${profile.name}`);
    }
  });
  
  // Restore original active profile
  store.setActiveProfile(currentActiveId);
  
  console.groupEnd();
}

// Export functions to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).migrateProfiles = migrateAllProfilesToLightweight;
  (window as any).refreshProfiles = refreshAllProfiles;
}