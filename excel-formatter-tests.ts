// Comprehensive test suite for the improved Excel formatter
import { createExcelFormatter, createCellStyleFunction, FormatCacheManager } from './improved-excel-formatter';

// Test helper
function testFormatter(formatString: string, testCases: Array<{ input: any, expected: string, description?: string }>) {
  console.log(`\n📋 Testing format: "${formatString}"`);
  console.log('=' .repeat(50));
  
  const formatter = createExcelFormatter(formatString);
  
  testCases.forEach(({ input, expected, description }, index) => {
    const params = { 
      value: input, 
      column: { getColId: () => 'testColumn' },
      node: {},
      data: {},
      api: {} as any,
      columnApi: {} as any,
      context: {}
    };
    
    const result = formatter(params);
    const status = result === expected ? '✅' : '❌';
    const desc = description ? ` (${description})` : '';
    
    console.log(`${status} Test ${index + 1}${desc}:`);
    console.log(`  Input: ${JSON.stringify(input)}`);
    console.log(`  Expected: "${expected}"`);
    console.log(`  Got: "${result}"`);
    
    if (result !== expected) {
      console.log(`  ⚠️  MISMATCH!`);
    }
  });
}

function testCellStyle(formatString: string, testCases: Array<{ input: any, expectedStyles: any, description?: string }>) {
  console.log(`\n🎨 Testing cell styles for: "${formatString}"`);
  console.log('=' .repeat(50));
  
  const styleFunction = createCellStyleFunction(formatString);
  
  testCases.forEach(({ input, expectedStyles, description }, index) => {
    const result = styleFunction({ value: input });
    const desc = description ? ` (${description})` : '';
    
    console.log(`🔍 Style Test ${index + 1}${desc}:`);
    console.log(`  Input: ${JSON.stringify(input)}`);
    console.log(`  Expected styles:`, expectedStyles);
    console.log(`  Got styles:`, result);
    
    // Simple comparison - in real tests you'd use deep equality
    const hasExpectedKeys = expectedStyles ? Object.keys(expectedStyles).every(key => 
      result && result[key] === expectedStyles[key]
    ) : !result;
    
    console.log(`  ${hasExpectedKeys ? '✅' : '❌'} Styles match`);
  });
}

// Run comprehensive tests
console.log('🧪 EXCEL FORMATTER TEST SUITE');
console.log('==================================');

// Test 1: Basic number formatting
testFormatter('0.00', [
  { input: 123.456, expected: '123.46', description: 'Round to 2 decimals' },
  { input: 0, expected: '0.00', description: 'Zero with decimals' },
  { input: -45.7, expected: '-45.70', description: 'Negative number' },
  { input: 'invalid', expected: '', description: 'Invalid number' }
]);

// Test 2: Percentage formatting
testFormatter('0.0%', [
  { input: 0.1234, expected: '12.3%', description: 'Convert decimal to percentage' },
  { input: 1, expected: '100.0%', description: 'Full percentage' },
  { input: 0, expected: '0.0%', description: 'Zero percentage' }
]);

// Test 3: Currency formatting
testFormatter('$#,##0.00', [
  { input: 1234.56, expected: '$1,234.56', description: 'Currency with thousands separator' },
  { input: -1000, expected: '-$1,000.00', description: 'Negative currency' },
  { input: 0, expected: '$0.00', description: 'Zero currency' }
]);

// Test 4: Traffic light conditional formatting
testFormatter('[>80]"🟢 Excellent"[Green];[>60]"🟡 Good"[Yellow];"🔴 Poor"[Red]', [
  { input: 95, expected: '🟢 Excellent', description: 'High score' },
  { input: 75, expected: '🟡 Good', description: 'Medium score' },
  { input: 45, expected: '🔴 Poor', description: 'Low score' },
  { input: 80, expected: '🔴 Poor', description: 'Boundary case (not >80)' },
  { input: 81, expected: '🟢 Excellent', description: 'Just above boundary' }
]);

// Test 5: Text conditions
testFormatter('[="A"]"Alpha"[Green];[="B"]"Beta"[Blue];"Other"[Gray]', [
  { input: 'A', expected: 'Alpha', description: 'Exact text match A' },
  { input: 'B', expected: 'Beta', description: 'Exact text match B' },
  { input: 'C', expected: 'Other', description: 'No match fallback' },
  { input: '', expected: 'Other', description: 'Empty string fallback' }
]);

// Test 6: Complex quoted patterns
testFormatter('"Status: "@', [
  { input: 'Active', expected: 'Status: Active', description: 'Text with prefix' },
  { input: 'Inactive', expected: 'Status: Inactive', description: 'Different text with prefix' },
  { input: '', expected: 'Status: ', description: 'Empty value with prefix' }
]);

// Test 7: Mixed number and text formatting
testFormatter('"Score: "0.0" out of 100"', [
  { input: 85.7, expected: 'Score: 85.7 out of 100', description: 'Number with text wrapper' },
  { input: 100, expected: 'Score: 100.0 out of 100', description: 'Perfect score' },
  { input: 0, expected: 'Score: 0.0 out of 100', description: 'Zero score' }
]);

// Test 8: Multiple conditions with numeric operators
testFormatter('[>=90]"A+"[Green];[>=80]"A"[Blue];[>=70]"B"[Yellow];[>=60]"C"[Orange];"F"[Red]', [
  { input: 95, expected: 'A+', description: 'Highest grade' },
  { input: 85, expected: 'A', description: 'High grade' },
  { input: 75, expected: 'B', description: 'Medium grade' },
  { input: 65, expected: 'C', description: 'Low passing grade' },
  { input: 50, expected: 'F', description: 'Failing grade' }
]);

// Test 9: Empty and non-empty text conditions  
testFormatter('[<>""]"Has Value"[Green];[=""]"Empty"[Red]', [
  { input: 'Something', expected: 'Has Value', description: 'Non-empty text' },
  { input: '', expected: 'Empty', description: 'Empty text' },
  { input: null, expected: '', description: 'Null value' },
  { input: undefined, expected: '', description: 'Undefined value' }
]);

// Test 10: Date formatting
testFormatter('MM/DD/YYYY', [
  { input: new Date('2024-03-15'), expected: '03/15/2024', description: 'Standard date' },
  { input: new Date('2024-12-25'), expected: '12/25/2024', description: 'Christmas date' }
]);

// Test Cell Styles
console.log('\n\n🎨 CELL STYLE TESTS');
console.log('====================');

// Test 11: Color styling
testCellStyle('[>0][Green];[<0][Red];[Gray]', [
  { input: 10, expectedStyles: { color: '#008000' }, description: 'Positive number - green' },
  { input: -5, expectedStyles: { color: '#FF0000' }, description: 'Negative number - red' },
  { input: 0, expectedStyles: { color: '#808080' }, description: 'Zero - gray' }
]);

// Test 12: Extended styling
testCellStyle('[>100][Bold][BG:lightgreen][Border:2px-solid-green]"High";[Orange]"Normal"', [
  { 
    input: 150, 
    expectedStyles: { 
      fontWeight: 'bold', 
      backgroundColor: 'lightgreen', 
      border: '2px solid green' 
    }, 
    description: 'High value with multiple styles' 
  },
  { 
    input: 50, 
    expectedStyles: { color: '#FFA500' }, 
    description: 'Normal value with color only' 
  }
]);

// Test 13: Performance test
console.log('\n⚡ PERFORMANCE TESTS');
console.log('===================');

const performanceFormatter = createExcelFormatter('[>80]"🟢 Excellent"[Green];[>60]"🟡 Good"[Yellow];"🔴 Poor"[Red]');

console.time('Format 1000 values');
for (let i = 0; i < 1000; i++) {
  const value = Math.random() * 100;
  performanceFormatter({ 
    value, 
    column: { getColId: () => 'testColumn' },
    node: {},
    data: {},
    api: {} as any,
    columnApi: {} as any,
    context: {}
  });
}
console.timeEnd('Format 1000 values');

// Test 14: Cache functionality
console.log('\n💾 CACHE TESTS');
console.log('==============');

console.log('Cache size before:', FormatCacheManager.size());

// Create multiple formatters with same format string
const formatter1 = createExcelFormatter('[>0]"Positive";[<0]"Negative";"Zero"');
const formatter2 = createExcelFormatter('[>0]"Positive";[<0]"Negative";"Zero"');
const formatter3 = createExcelFormatter('[>10]"High";"Low"');

console.log('Cache size after creating formatters:', FormatCacheManager.size());

// Clear cache
FormatCacheManager.clear();
console.log('Cache size after clear:', FormatCacheManager.size());

// Test 15: Error handling
console.log('\n🚨 ERROR HANDLING TESTS');
console.log('=======================');

// Test invalid format string
const invalidFormatter = createExcelFormatter(null as any);
console.log('Invalid format string result:', invalidFormatter({ value: 5 } as any));

// Test invalid params
const validFormatter = createExcelFormatter('0.00');
console.log('Invalid params result:', validFormatter(null as any));

// Test value as function
console.log('Function value result:', validFormatter({ 
  value: () => 'test',
  column: { getColId: () => 'test' }
} as any));

// Test value equals format string (critical bug)
const criticalFormatter = createExcelFormatter('[>0]"Positive"');
console.log('Critical bug test (value = format string):', criticalFormatter({
  value: '[>0]"Positive"',
  column: { getColId: () => 'test' }
} as any));

console.log('\n✅ ALL TESTS COMPLETED');
console.log('=======================');

// Example usage with ag-Grid
console.log('\n📊 AG-GRID INTEGRATION EXAMPLE');
console.log('==============================');

const columnDefs = [
  {
    field: 'score',
    headerName: 'Performance Score',
    valueFormatter: createExcelFormatter('[>=90]"🔥 Exceptional"[Green];[>=75]"⭐ Excellent"[Blue];[>=60]"👍 Good"[Green];"👎 Needs Work"[Red]'),
    cellStyle: createCellStyleFunction('[>=90][Bold][BG:lightgreen];[>=75][Bold][BG:lightblue];[>=60][BG:lightyellow];[BG:lightcoral]'),
    width: 200
  },
  {
    field: 'revenue',
    headerName: 'Monthly Revenue',
    valueFormatter: createExcelFormatter('[>1000000]"$"#,##0"M"[Green];[>0]"$"#,##0[Blue];"$0"[Gray]'),
    cellStyle: createCellStyleFunction('[>1000000][Bold][Green];[>0][Blue];[Gray]'),
    width: 150
  },
  {
    field: 'growth',
    headerName: 'Growth %',
    valueFormatter: createExcelFormatter('[>0]"+"0.0%[Green];[<0]0.0%[Red];"0.0%"[Gray]'),
    cellStyle: createCellStyleFunction('[>0][Bold][Green];[<0][Bold][Red];[Gray]'),
    width: 120
  }
];

console.log('Sample column definitions created:');
columnDefs.forEach(col => {
  console.log(`- ${col.headerName}: ${col.field}`);
});

export { testFormatter, testCellStyle };