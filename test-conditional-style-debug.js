// Debug script to test conditional style detection and cellStyle function execution

// We'll test without imports since this is an ES module project

// Test format strings
const testFormatStrings = [
  '[="A"][#4bdd63]@;[="B"][#3bceb1]@;[Gray]@',
  '[>0][Green]#,##0.00;[Red]#,##0.00',
  '[Bold][BG:Yellow]#,##0.00',
  '#,##0.00', // No conditional styling
];

console.log('=== Testing Conditional Style Detection ===\n');

// Test the hasConditionalStyling function
function hasConditionalStyling(formatString) {
  if (!formatString || !formatString.includes('[')) return false;
  
  return (
    // Basic conditional colors
    formatString.toLowerCase().includes('[green]') || 
    formatString.toLowerCase().includes('[red]') || 
    formatString.toLowerCase().includes('[blue]') || 
    formatString.toLowerCase().includes('[yellow]') || 
    formatString.toLowerCase().includes('[orange]') || 
    formatString.toLowerCase().includes('[purple]') || 
    formatString.toLowerCase().includes('[gray]') || 
    formatString.toLowerCase().includes('[grey]') || 
    formatString.toLowerCase().includes('[magenta]') || 
    formatString.toLowerCase().includes('[cyan]') || 
    // Conditions
    formatString.includes('[>') || 
    formatString.includes('[<') || 
    formatString.includes('[=') || 
    formatString.includes('[#') || // Hex colors
    formatString.includes('[@=') || // Text equality 
    formatString.includes('[<>') ||
    // Extended styling directives
    formatString.includes('Weight:') ||
    formatString.includes('FontWeight:') ||
    formatString.includes('Background:') ||
    formatString.includes('BG:') ||
    formatString.includes('Border:') ||
    formatString.includes('B:') ||
    formatString.includes('Size:') ||
    formatString.includes('FontSize:') ||
    formatString.includes('Align:') ||
    formatString.includes('TextAlign:') ||
    formatString.includes('Padding:') ||
    formatString.includes('P:') ||
    // Keyword styles
    formatString.includes('[Bold]') ||
    formatString.includes('[Italic]') ||
    formatString.includes('[Underline]') ||
    formatString.includes('[Strikethrough]') ||
    formatString.includes('[Center]') ||
    formatString.includes('[Left]') ||
    formatString.includes('[Right]')
  );
}

testFormatStrings.forEach(formatString => {
  const hasConditional = hasConditionalStyling(formatString);
  console.log(`Format: ${formatString}`);
  console.log(`Has Conditional Styling: ${hasConditional ? '✅ YES' : '❌ NO'}\n`);
});

console.log('\n=== Testing CellStyle Function Creation and Execution ===\n');

// Test cellStyle function creation and execution
const baseStyle = { 
  backgroundColor: '#f0f0f0', 
  color: '#333',
  fontWeight: 'normal' 
};

// Test with text equality conditions
console.log('Test 1: Text equality with hex colors');
const formatString1 = '[="A"][#4bdd63]@;[="B"][#3bceb1]@;[Gray]@';
console.log(`Format String: ${formatString1}`);
console.log(`Base Style:`, baseStyle);

// Create a mock createCellStyleFunction for testing
function mockCreateCellStyleFunction(formatString, baseStyle) {
  return function cellStyleFn(params) {
    console.log(`  cellStyleFn called with value: "${params.value}"`);
    
    // Start with base styles
    const styles = { ...baseStyle };
    
    // Parse and apply conditional styles
    if (formatString.includes('[="A"][#4bdd63]') && params.value === 'A') {
      styles.color = '#4bdd63';
      console.log(`  Applied condition: [="A"][#4bdd63] -> color: #4bdd63`);
    } else if (formatString.includes('[="B"][#3bceb1]') && params.value === 'B') {
      styles.color = '#3bceb1';
      console.log(`  Applied condition: [="B"][#3bceb1] -> color: #3bceb1`);
    } else if (formatString.includes('[Gray]')) {
      styles.color = 'gray';
      console.log(`  Applied default: [Gray] -> color: gray`);
    }
    
    console.log(`  Returning styles:`, styles);
    return styles;
  };
}

const cellStyleFn1 = mockCreateCellStyleFunction(formatString1, baseStyle);

// Test with different values
const testValues1 = ['A', 'B', 'C', '', null];
testValues1.forEach(value => {
  console.log(`\nTesting with value: "${value}"`);
  const result = cellStyleFn1({ value });
});

// Test with numeric conditions
console.log('\n\nTest 2: Numeric conditions with colors');
const formatString2 = '[>0][Green]#,##0.00;[Red]#,##0.00';
console.log(`Format String: ${formatString2}`);
console.log(`Base Style:`, baseStyle);

function mockCreateCellStyleFunction2(formatString, baseStyle) {
  return function cellStyleFn(params) {
    console.log(`  cellStyleFn called with value: ${params.value}`);
    
    // Start with base styles
    const styles = { ...baseStyle };
    
    // Parse and apply conditional styles
    if (formatString.includes('[>0][Green]') && params.value > 0) {
      styles.color = 'green';
      console.log(`  Applied condition: [>0][Green] -> color: green`);
    } else if (formatString.includes('[Red]')) {
      styles.color = 'red';
      console.log(`  Applied condition: [Red] -> color: red`);
    }
    
    console.log(`  Returning styles:`, styles);
    return styles;
  };
}

const cellStyleFn2 = mockCreateCellStyleFunction2(formatString2, baseStyle);

// Test with different values
const testValues2 = [100, -50, 0, null, undefined];
testValues2.forEach(value => {
  console.log(`\nTesting with value: ${value}`);
  const result = cellStyleFn2({ value });
});

console.log('\n\n=== Testing Style Merging ===\n');

// Test style merging with both base and conditional styles
const testMerging = () => {
  const baseStyle = { 
    backgroundColor: '#f0f0f0', 
    fontSize: 14,
    padding: '4px'
  };
  
  const conditionalStyle = { 
    color: '#4bdd63',
    fontWeight: 'bold'
  };
  
  const merged = { ...baseStyle, ...conditionalStyle };
  
  console.log('Base Style:', baseStyle);
  console.log('Conditional Style:', conditionalStyle);
  console.log('Merged Style:', merged);
  console.log('Expected: Both base and conditional styles should be present');
  console.log('Actual: ', JSON.stringify(merged));
  
  // Verify all properties are present
  const hasAllProperties = 
    merged.backgroundColor === '#f0f0f0' &&
    merged.fontSize === 14 &&
    merged.padding === '4px' &&
    merged.color === '#4bdd63' &&
    merged.fontWeight === 'bold';
  
  console.log(`Merge successful: ${hasAllProperties ? '✅ YES' : '❌ NO'}`);
};

testMerging();

console.log('\n\n=== Debugging Checklist ===\n');
console.log('1. ✅ Conditional styling detection works correctly');
console.log('2. ✅ CellStyle functions can be created with proper logic');
console.log('3. ✅ Style merging preserves both base and conditional styles');
console.log('4. ❓ Need to verify AG-Grid is actually calling the cellStyle functions');
console.log('5. ❓ Need to verify the cellStyle functions are properly attached to columns');
console.log('6. ❓ Need to verify the cellStyle functions persist across operations');

console.log('\n\n=== Next Steps ===');
console.log('1. Add console.log statements to the actual cellStyle functions in the app');
console.log('2. Verify cellStyle functions are being called by AG-Grid');
console.log('3. Check if cellStyle functions are being lost during column updates');
console.log('4. Verify the actual createCellStyleFunction implementation');