// Check if H (72) could transform to 19

console.log('Character H:');
console.log('Decimal:', 'H'.charCodeAt(0)); // 72
console.log('Hex:', 'H'.charCodeAt(0).toString(16)); // 48
console.log('Binary:', 'H'.charCodeAt(0).toString(2)); // 1001000

console.log('\nNumber 19:');
console.log('As character:', String.fromCharCode(19)); // Control character
console.log('19 in hex:', (19).toString(16)); // 13
console.log('19 in binary:', (19).toString(2)); // 10011

console.log('\nChecking if 72 could become 19:');
console.log('72 - 53 =', 72 - 53); // Offset?
console.log('72 % 53 =', 72 % 53); // Modulo?
console.log('72 >> 2 =', 72 >> 2); // Bit shift?

// Check if it's a font rendering issue
console.log('\nPossible font/rendering issue:');
console.log('H in different contexts:');
console.log('Normal: H');
console.log('In quotes: "H"');
console.log('With C and F: CHF');
console.log('In format: "CHF" #,##0.00');

// Maybe it's interpreting hex somehow
console.log('\nHex interpretation:');
console.log('C in hex:', parseInt('C', 16)); // 12
console.log('H in hex:', parseInt('H', 16)); // NaN, but might default to something
console.log('F in hex:', parseInt('F', 16)); // 15

// Check if it could be a substitution
console.log('\nChecking substitution patterns:');
const str = 'CHF';
console.log('Original:', str);
console.log('Replace H with 19:', str.replace('H', '19'));
console.log('Replace H with 1:', str.replace('H', '1'));

// Excel column reference check
console.log('\nExcel column patterns:');
console.log('CH as column:', 'CH'.split('').reduce((acc, char, idx) => {
    return acc + (char.charCodeAt(0) - 64) * Math.pow(26, 'CH'.length - 1 - idx);
}, 0)); // CH = column 86