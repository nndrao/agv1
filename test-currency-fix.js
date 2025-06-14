// Test the currency formatter fix
import { createExcelFormatter } from './src/components/datatable/utils/formatters.js';

console.log('=== Testing Currency Formatter Fix ===\n');

const testFormats = [
  { format: '"$" #,##0.00', label: 'USD with space' },
  { format: '"€" #,##0.00', label: 'EUR with space' },
  { format: '"£" #,##0.00', label: 'GBP with space' },
  { format: '"C$" #,##0.00', label: 'CAD with space' },
  { format: '"A$" #,##0.00', label: 'AUD with space' },
  { format: '"CHF" #,##0.00', label: 'CHF with space' },
  { format: '#,##0.00 "kr"', label: 'SEK (after number)' },
];

const testValues = [1234.56, -1234.56, 0, 1000000];

testFormats.forEach(({ format, label }) => {
  console.log(`\n${label} - Format: "${format}"`);
  console.log('-'.repeat(40));
  
  const formatter = createExcelFormatter(format);
  
  testValues.forEach(value => {
    const result = formatter({ value });
    console.log(`  ${value.toString().padStart(12)} => ${result}`);
  });
});

console.log('\n=== Testing Format String Parsing ===\n');

// Test the internal format parsing
const testParsingFormats = [
  '"$" #,##0.00',
  '"C$" #,##0.00',
  '"A$" #,##0.00',
];

testParsingFormats.forEach(format => {
  console.log(`\nParsing format: "${format}"`);
  
  // Log what the formatter produces
  const formatter = createExcelFormatter(format);
  const result = formatter({ value: 1234.56 });
  console.log(`Result: ${result}`);
  
  // Check if space is preserved
  const hasSpace = result.includes(' ');
  console.log(`Has space: ${hasSpace}`);
  console.log(`Characters: [${result.split('').map(c => c === ' ' ? 'SPACE' : c).join('][')}]`);
});