// Debug script to check localStorage for profile data
// Run this in the browser console to see what's stored

console.log('=== Profile Storage Debug ===');

// Check if profile storage exists
const profileStorage = localStorage.getItem('grid-profile-storage');

if (profileStorage) {
  try {
    const data = JSON.parse(profileStorage);
    console.log('Profile Storage Found:', data);
    
    // Check state structure
    if (data.state) {
      console.log('\n=== State Structure ===');
      console.log('Active Profile ID:', data.state.activeProfileId);
      console.log('Auto Save:', data.state.autoSave);
      console.log('Number of Profiles:', data.state.profiles?.length || 0);
      
      // Check each profile
      if (data.state.profiles && data.state.profiles.length > 0) {
        console.log('\n=== Profiles ===');
        data.state.profiles.forEach((profile, index) => {
          console.log(`\nProfile ${index + 1}:`);
          console.log('- ID:', profile.id);
          console.log('- Name:', profile.name);
          console.log('- Created:', new Date(profile.createdAt).toLocaleString());
          console.log('- Updated:', new Date(profile.updatedAt).toLocaleString());
          console.log('- Is Default:', profile.isDefault || false);
          
          if (profile.gridState) {
            console.log('- Grid State:');
            console.log('  - Column Defs:', profile.gridState.columnDefs?.length || 0, 'columns');
            console.log('  - Column State:', profile.gridState.columnState?.length || 0, 'items');
            console.log('  - Filter Model:', Object.keys(profile.gridState.filterModel || {}).length, 'filters');
            console.log('  - Sort Model:', profile.gridState.sortModel?.length || 0, 'sorts');
            console.log('  - Font:', profile.gridState.font || 'not set');
            
            // Check column customizations
            if (profile.gridState.columnDefs && profile.gridState.columnDefs.length > 0) {
              console.log('\n  - Column Customizations:');
              profile.gridState.columnDefs.forEach((col, idx) => {
                const customizations = [];
                if (col.cellStyle) customizations.push('cellStyle');
                if (col.headerClass) customizations.push('headerClass');
                if (col.cellClass) customizations.push('cellClass');
                if (col.valueFormatter) customizations.push('valueFormatter');
                if (col.filter) customizations.push('filter');
                if (col.filterParams) customizations.push('filterParams');
                if (col.width) customizations.push(`width:${col.width}`);
                if (col.minWidth) customizations.push(`minWidth:${col.minWidth}`);
                if (col.maxWidth) customizations.push(`maxWidth:${col.maxWidth}`);
                
                if (customizations.length > 0) {
                  console.log(`    Column ${idx + 1} (${col.field}):`, customizations.join(', '));
                }
              });
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('Error parsing profile storage:', error);
    console.log('Raw storage value:', profileStorage);
  }
} else {
  console.log('No profile storage found in localStorage');
}

console.log('\n=== All localStorage Keys ===');
Object.keys(localStorage).forEach(key => {
  console.log(`- ${key}:`, localStorage.getItem(key)?.substring(0, 100) + '...');
});