// Test script to verify formatters are working
// Run this in the browser console

import { createExcelFormatter } from './src/components/datatable/utils/formatters.js';

console.log('=== Testing Formatters ===');

// Test currency formatter with emoji
const currencyFormatter = createExcelFormatter('[Green][>0]💰 $#,##0.00;[Red][<0]💸 ($#,##0.00);$0.00');
console.log('Currency Formatter Tests:');
console.log('  1000 =>', currencyFormatter({ value: 1000 }));
console.log('  -500 =>', currencyFormatter({ value: -500 }));
console.log('  0 =>', currencyFormatter({ value: 0 }));

// Test percentage formatter with emoji
const percentFormatter = createExcelFormatter('[Green][>0.1]📈 0.00%;[Red][<-0.1]📉 0.00%;0.00%');
console.log('\nPercentage Formatter Tests:');
console.log('  0.15 =>', percentFormatter({ value: 0.15 }));
console.log('  -0.20 =>', percentFormatter({ value: -0.20 }));
console.log('  0.05 =>', percentFormatter({ value: 0.05 }));

// Test custom emoji status formatter
const statusFormatter = createExcelFormatter('[<0]😟 Poor;[<50]😐 OK;[<80]😊 Good;😍 Excellent');
console.log('\nStatus Formatter Tests:');
console.log('  -10 =>', statusFormatter({ value: -10 }));
console.log('  25 =>', statusFormatter({ value: 25 }));
console.log('  75 =>', statusFormatter({ value: 75 }));
console.log('  95 =>', statusFormatter({ value: 95 }));

// Test traffic light formatter
const trafficFormatter = createExcelFormatter('[<33]🔴;[<66]🟡;🟢');
console.log('\nTraffic Light Formatter Tests:');
console.log('  20 =>', trafficFormatter({ value: 20 }));
console.log('  50 =>', trafficFormatter({ value: 50 }));
console.log('  80 =>', trafficFormatter({ value: 80 }));

console.log('\n✅ All formatter tests complete!');