// Debug CHF issue
console.log('=== Debugging CHF Issue ===\n');

// Test the format string generation
const currencySymbol = 'CHF';
const decimalPlaces = 2;
const baseFormat = decimalPlaces === 0 ? '#,##0' : `#,##0.${'0'.repeat(decimalPlaces)}`;

let formatString;
if (currencySymbol === 'kr') {
  formatString = `${baseFormat} "${currencySymbol}"`;
} else {
  formatString = `"${currencySymbol}" ${baseFormat}`;
}

console.log('Currency symbol:', currencySymbol);
console.log('Format string:', formatString);
console.log('Format string characters:', formatString.split('').map((c, i) => `[${i}:${c}:${c.charCodeAt(0)}]`).join(''));

// Check if CHF might be getting transformed
console.log('\nChecking character codes:');
console.log('C:', 'C'.charCodeAt(0));
console.log('H:', 'H'.charCodeAt(0));
console.log('F:', 'F'.charCodeAt(0));

// Test if it could be interpreted as a cell reference
console.log('\nChecking if CHF looks like a cell reference:');
console.log('CHF matches cell pattern:', /^[A-Z]+\d+$/.test('CHF'));
console.log('C19F matches cell pattern:', /^[A-Z]+\d+$/.test('C19F'));

// Check hex interpretation
console.log('\nChecking hex interpretation:');
console.log('H in hex:', parseInt('H', 16)); // This will be NaN
console.log('1 in hex:', parseInt('1', 16)); // This will be 1
console.log('9 in hex:', parseInt('9', 16)); // This will be 9

// Test the actual string
const testString = '"CHF" #,##0.00';
console.log('\nTest string:', testString);
console.log('Contains CHF:', testString.includes('CHF'));
console.log('Contains C19F:', testString.includes('C19F'));