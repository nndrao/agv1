// This script checks what's saved in the profile store
// Run it in the browser console to see profile data

const profileData = localStorage.getItem('profile-store');
if (profileData) {
  const parsed = JSON.parse(profileData);
  console.log('Profile Store State:', parsed.state);
  
  // Check each profile
  if (parsed.state.profiles) {
    parsed.state.profiles.forEach(profile => {
      console.log(`\nProfile: ${profile.name} (ID: ${profile.id})`);
      if (profile.gridState && profile.gridState.columnDefs) {
        console.log(`Column Definitions Count: ${profile.gridState.columnDefs.length}`);
        profile.gridState.columnDefs.slice(0, 3).forEach(col => {
          console.log(`  - Field: ${col.field}, HeaderName: ${col.headerName}`);
          console.log(`    Properties: sortable=${col.sortable}, resizable=${col.resizable}, editable=${col.editable}`);
          console.log(`    Styles: hasHeaderStyle=${!!col.headerStyle}, hasCellStyle=${!!col.cellStyle}`);
        });
      }
    });
  }
} else {
  console.log('No profile data found in localStorage');
}