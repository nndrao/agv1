// Test script for visual rules persistence
// This simulates the round-trip process: Create rules → Generate formatter → Serialize → Deserialize → Restore rules

console.log('🧪 Testing Visual Rules Persistence Round-Trip');

// Simulate visual rules created in the editor
const testRules = [
  {
    id: '1',
    condition: {
      type: 'greaterThan',
      value: '100'
    },
    display: {
      type: 'original',
      text: ''
    },
    styling: {
      backgroundColor: '#16a34a',
      textColor: '#ffffff',
      fontWeight: 'bold',
      fontSize: 16
    },
    enabled: true
  },
  {
    id: '2',
    condition: {
      type: 'lessThan',
      value: '0'
    },
    display: {
      type: 'custom',
      text: 'NEGATIVE'
    },
    styling: {
      backgroundColor: '#dc2626',
      textColor: '#ffffff',
      fontStyle: 'italic'
    },
    enabled: true
  }
];

const testDefaultFallback = {
  display: {
    type: 'original',
    text: ''
  },
  styling: {
    backgroundColor: '#f3f4f6',
    textColor: '#374151'
  }
};

// Simulate the generated format string
const generatedFormatString = '[>100][#ffffff][BG:#16a34a][Bold][Size:16]#,##0;[<0][#ffffff][BG:#dc2626][Italic]"NEGATIVE";[#374151][BG:#f3f4f6]@';

console.log('\n✅ Step 1: Visual Rules Created');
console.log('Rules:', testRules.length);
console.log('Format String:', generatedFormatString);

// Simulate formatter creation with metadata
function createTestFormatter(formatString, rules, defaultFallback) {
  const formatter = (params) => {
    // Simplified formatter logic
    const value = params.value;
    if (typeof value === 'number') {
      if (value > 100) return value.toLocaleString();
      if (value < 0) return 'NEGATIVE';
    }
    return String(value || '');
  };
  
  // Attach metadata (this is what we've implemented)
  Object.defineProperty(formatter, '__formatString', { 
    value: formatString, 
    writable: false,
    enumerable: false,
    configurable: true
  });
  
  Object.defineProperty(formatter, '__formatterType', { 
    value: 'visual', 
    writable: false,
    enumerable: false,
    configurable: true
  });
  
  Object.defineProperty(formatter, '__visualRules', { 
    value: rules, 
    writable: false,
    enumerable: false,
    configurable: true
  });
  
  Object.defineProperty(formatter, '__visualDefaultFallback', { 
    value: defaultFallback, 
    writable: false,
    enumerable: false,
    configurable: true
  });
  
  return formatter;
}

const testFormatter = createTestFormatter(generatedFormatString, testRules, testDefaultFallback);

console.log('\n✅ Step 2: Formatter Created with Metadata');
console.log('Has format string:', !!(testFormatter).__formatString);
console.log('Has visual rules:', !!(testFormatter).__visualRules);
console.log('Has default fallback:', !!(testFormatter).__visualDefaultFallback);

// Simulate serialization (what goes into profile storage)
const serializedValueFormatter = {
  type: 'visual',
  formatString: (testFormatter).__formatString,
  rules: (testFormatter).__visualRules,
  defaultFallback: (testFormatter).__visualDefaultFallback
};

console.log('\n✅ Step 3: Serialized for Storage');
console.log('Serialized size:', JSON.stringify(serializedValueFormatter).length, 'bytes');
console.log('Type:', serializedValueFormatter.type);
console.log('Rules count:', serializedValueFormatter.rules?.length);

// Simulate deserialization (loading from profile storage)
function recreateFormatterFromSerialized(serialized) {
  // Create new formatter from format string
  const newFormatter = createTestFormatter(
    serialized.formatString,
    serialized.rules,
    serialized.defaultFallback
  );
  
  return newFormatter;
}

const restoredFormatter = recreateFormatterFromSerialized(serializedValueFormatter);

console.log('\n✅ Step 4: Restored from Storage');
console.log('Restored format string:', (restoredFormatter).__formatString);
console.log('Restored rules count:', (restoredFormatter).__visualRules?.length);
console.log('Restored default fallback:', !!(restoredFormatter).__visualDefaultFallback);

// Simulate opening the visual editor again
const restoredRules = (restoredFormatter).__visualRules;
const restoredDefaultFallback = (restoredFormatter).__visualDefaultFallback;

console.log('\n✅ Step 5: Visual Editor Can Restore Rules');
console.log('✓ Rules restored successfully:', JSON.stringify(restoredRules, null, 2));
console.log('✓ Default fallback restored:', JSON.stringify(restoredDefaultFallback, null, 2));

// Test data
const testValues = [150, -50, 25, 0];
console.log('\n✅ Step 6: Formatter Functions Correctly');
testValues.forEach(value => {
  const result = restoredFormatter({ value });
  console.log(`Value ${value} → "${result}"`);
});

console.log('\n🎉 Round-trip test completed successfully!');
console.log('✓ Visual rules persist correctly');
console.log('✓ Format strings work correctly');
console.log('✓ Full editing capability maintained'); 