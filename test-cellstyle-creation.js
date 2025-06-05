// Test script to verify cellStyle creation for conditional formatting

// Import the necessary modules (in a real test environment)
// This is a simulation to demonstrate the logic

// Simulate format string check
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

// Test cases
const testCases = [
  {
    name: "Green/Red conditional",
    formatString: '[>0][Green]#,##0.00;[Red]#,##0.00',
    expectedHasConditionalStyling: true
  },
  {
    name: "Text equality with colors",
    formatString: '[="A"][#4bdd63]@;[="B"][#3bceb1]@;[Gray]@',
    expectedHasConditionalStyling: true
  },
  {
    name: "Simple number format",
    formatString: '#,##0.00',
    expectedHasConditionalStyling: false
  },
  {
    name: "Currency with colors",
    formatString: '[>0][Green]$#,##0.00;[Red]$#,##0.00',
    expectedHasConditionalStyling: true
  },
  {
    name: "Bold style directive",
    formatString: '[Bold]#,##0.00',
    expectedHasConditionalStyling: true
  },
  {
    name: "Background color directive",
    formatString: '[BG:Yellow]#,##0.00',
    expectedHasConditionalStyling: true
  }
];

console.log('Testing conditional styling detection:\n');

testCases.forEach(testCase => {
  const result = hasConditionalStyling(testCase.formatString);
  const passed = result === testCase.expectedHasConditionalStyling;
  
  console.log(`Test: ${testCase.name}`);
  console.log(`Format String: ${testCase.formatString}`);
  console.log(`Expected: ${testCase.expectedHasConditionalStyling}, Got: ${result}`);
  console.log(`Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('');
});

// Simulate column processing
console.log('\nSimulating column processing:\n');

const mockColumns = [
  {
    field: 'amount',
    headerName: 'Amount',
    valueFormatter: {
      __formatString: '[>0][Green]#,##0.00;[Red]#,##0.00',
      __formatterType: 'excel'
    },
    cellStyle: null
  },
  {
    field: 'status',
    headerName: 'Status',
    valueFormatter: {
      __formatString: '[="A"][#4bdd63]@;[="B"][#3bceb1]@;[Gray]@',
      __formatterType: 'excel'
    },
    cellStyle: null
  },
  {
    field: 'price',
    headerName: 'Price',
    valueFormatter: {
      __formatString: '$#,##0.00',
      __formatterType: 'excel'
    },
    cellStyle: null
  }
];

mockColumns.forEach(column => {
  const formatString = column.valueFormatter?.__formatString;
  const needsCellStyle = formatString && hasConditionalStyling(formatString);
  
  console.log(`Column: ${column.field}`);
  console.log(`Format String: ${formatString}`);
  console.log(`Needs cellStyle: ${needsCellStyle}`);
  
  if (needsCellStyle && !column.cellStyle) {
    console.log(`➡️ Would create cellStyle function for conditional formatting`);
  } else if (!needsCellStyle) {
    console.log(`➡️ No cellStyle needed (no conditional formatting)`);
  } else {
    console.log(`➡️ cellStyle already exists`);
  }
  console.log('');
});

console.log('\nTest completed!');