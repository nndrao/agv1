// Test script to check localStorage for column customizations
// Run this in the browser console to inspect the state

function checkLocalStorage() {
  const storageKey = 'grid-profile-storage';
  const data = localStorage.getItem(storageKey);
  
  if (!data) {
    console.log('No profile data found in localStorage');
    return;
  }
  
  try {
    const parsed = JSON.parse(data);
    console.log('Profile Storage Version:', parsed.version);
    console.log('State:', parsed.state);
    
    if (parsed.state && parsed.state.profiles) {
      parsed.state.profiles.forEach(profile => {
        console.log('\n--- Profile:', profile.name, '---');
        console.log('ID:', profile.id);
        console.log('Grid State Keys:', Object.keys(profile.gridState || {}));
        
        if (profile.gridState) {
          console.log('Has columnCustomizations:', !!profile.gridState.columnCustomizations);
          console.log('columnCustomizations count:', Object.keys(profile.gridState.columnCustomizations || {}).length);
          console.log('Has gridOptions:', !!profile.gridState.gridOptions);
          console.log('gridOptions count:', Object.keys(profile.gridState.gridOptions || {}).length);
          
          // Show actual customizations
          if (profile.gridState.columnCustomizations) {
            console.log('Column Customizations:', profile.gridState.columnCustomizations);
          }
          
          // Show grid options
          if (profile.gridState.gridOptions) {
            console.log('Grid Options:', profile.gridState.gridOptions);
          }
        }
      });
    }
  } catch (e) {
    console.error('Failed to parse localStorage data:', e);
  }
}

// Function to simulate the issue
function simulateGridOptionsSave() {
  console.log('\n=== Before Grid Options Save ===');
  checkLocalStorage();
  
  console.log('\n=== Simulating Grid Options Save ===');
  console.log('This would normally be done through the UI');
  console.log('The fix ensures that columnCustomizations are preserved');
  
  console.log('\n=== After Grid Options Save ===');
  console.log('Run checkLocalStorage() again after saving grid options in the UI');
}

console.log('Column Customizations Debug Script Loaded');
console.log('Available functions:');
console.log('- checkLocalStorage() : Inspect current localStorage state');
console.log('- simulateGridOptionsSave() : Show before/after state');