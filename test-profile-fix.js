// Test script to verify profile structure in localStorage
// Run this in browser console after saving a profile with grid options and column settings

const testProfileFix = () => {
  const storage = localStorage.getItem('grid-profiles');
  if (!storage) {
    console.log('❌ No profiles found in localStorage');
    return;
  }
  
  const data = JSON.parse(storage);
  console.log('📦 Profile Storage:', data);
  
  const profiles = data.state?.profiles || [];
  console.log(`\n📋 Found ${profiles.length} profiles\n`);
  
  profiles.forEach(profile => {
    console.log(`\n🔍 Profile: ${profile.name} (${profile.id})`);
    console.log('━'.repeat(50));
    
    // Check the three separate properties
    console.log('\n1️⃣ Column Settings:');
    if (profile.columnSettings) {
      console.log('  ✅ columnSettings exists');
      console.log(`  - baseColumnDefs: ${profile.columnSettings.baseColumnDefs?.length || 0} columns`);
      console.log(`  - columnCustomizations: ${Object.keys(profile.columnSettings.columnCustomizations || {}).length} customized columns`);
      
      // Show sample customizations
      const customizations = profile.columnSettings.columnCustomizations || {};
      const firstKey = Object.keys(customizations)[0];
      if (firstKey) {
        console.log(`  - Sample customization for "${firstKey}":`, customizations[firstKey]);
      }
    } else {
      console.log('  ❌ No columnSettings');
    }
    
    console.log('\n2️⃣ Grid State:');
    if (profile.gridState) {
      console.log('  ✅ gridState exists');
      console.log(`  - columnState: ${profile.gridState.columnState?.length || 0} columns`);
      console.log(`  - filterModel: ${Object.keys(profile.gridState.filterModel || {}).length} filters`);
      console.log(`  - sortModel: ${profile.gridState.sortModel?.length || 0} sorts`);
    } else {
      console.log('  ❌ No gridState');
    }
    
    console.log('\n3️⃣ Grid Options:');
    if (profile.gridOptions) {
      console.log('  ✅ gridOptions exists');
      Object.entries(profile.gridOptions).forEach(([key, value]) => {
        console.log(`  - ${key}: ${value}`);
      });
    } else {
      console.log('  ❌ No gridOptions');
    }
    
    // Check for legacy nested structure
    if (profile.gridState?.gridOptions) {
      console.log('\n⚠️  WARNING: Found gridOptions nested in gridState (legacy structure)');
    }
    
    console.log('\n' + '━'.repeat(50));
  });
  
  console.log('\n✅ Test complete. Check the output above for issues.');
};

// Instructions
console.log(`
📝 Profile Structure Test Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To test the fix:
1. Open the app in browser: http://localhost:5175
2. Apply some grid options (row height, etc.)
3. Apply some column customizations (styles, formatters)
4. Save the profile
5. Run this in the browser console:

testProfileFix();

Then reload the page and run it again to verify data persists correctly.
`);

// Make function available globally
window.testProfileFix = testProfileFix;