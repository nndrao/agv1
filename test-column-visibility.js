// Test script to verify column visibility is preserved
// Run this in the browser console

console.log('=== Column Visibility Test ===');

// Step 1: Get current grid state
const gridApi = window.gridApi; // Assuming gridApi is exposed
if (!gridApi) {
  console.error('Grid API not found. Make sure gridApi is exposed on window object.');
  throw new Error('No grid API');
}

// Get initial state
const initialState = gridApi.getColumnState();
const initialVisible = initialState.filter(col => !col.hide);
const initialHidden = initialState.filter(col => col.hide);

console.log('Initial State:', {
  totalColumns: initialState.length,
  visibleColumns: initialVisible.length,
  hiddenColumns: initialHidden.length,
  hiddenColumnIds: initialHidden.map(col => col.colId)
});

// Step 2: Simulate opening column formatter
console.log('\n--- Opening Column Formatter ---');

// Get column definitions
const columnDefs = gridApi.getColumnDefs();
console.log('Column Defs from Grid:', {
  count: columnDefs.length,
  hasHideProperty: columnDefs.some(col => 'hide' in col),
  columnsWithHide: columnDefs.filter(col => 'hide' in col).map(col => ({
    field: col.field,
    hide: col.hide
  }))
});

// Step 3: Check after formatter operations
console.log('\n--- After Formatter Apply ---');
// This would be checked after clicking Apply in the UI

// Helper function to check state
window.checkColumnState = function() {
  const currentState = gridApi.getColumnState();
  const currentVisible = currentState.filter(col => !col.hide);
  const currentHidden = currentState.filter(col => col.hide);
  
  console.log('Current State:', {
    totalColumns: currentState.length,
    visibleColumns: currentVisible.length,
    hiddenColumns: currentHidden.length,
    hiddenColumnIds: currentHidden.map(col => col.colId)
  });
  
  // Compare with initial
  const visibilityChanged = initialVisible.length !== currentVisible.length;
  if (visibilityChanged) {
    console.error('VISIBILITY CHANGED!', {
      before: initialVisible.length,
      after: currentVisible.length,
      difference: currentVisible.length - initialVisible.length,
      newlyVisible: currentState.filter(col => 
        !col.hide && initialState.find(init => init.colId === col.colId)?.hide
      ).map(col => col.colId),
      newlyHidden: currentState.filter(col => 
        col.hide && !initialState.find(init => init.colId === col.colId)?.hide
      ).map(col => col.colId)
    });
  } else {
    console.log('✓ Visibility preserved correctly');
  }
};

console.log('\nTest setup complete. Use window.checkColumnState() after applying formatter changes.');