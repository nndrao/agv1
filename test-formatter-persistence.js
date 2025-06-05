// Test script for formatter persistence
console.log('🧪 Testing Formatter Persistence in Serialization');

// Simulate a column with a formatter created via FormatTab
function createTestColumn() {
  // Simulate createExcelFormatter function
  function createExcelFormatter(formatString) {
    const formatter = (params) => {
      if (formatString === '$#,##0.00') {
        return `$${(params.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return String(params.value || '');
    };
    
    // Attach metadata (this is what createExcelFormatter does)
    Object.defineProperty(formatter, '__formatString', { 
      value: formatString, 
      writable: false,
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(formatter, '__formatterType', { 
      value: 'excel', 
      writable: false,
      enumerable: false,
      configurable: true
    });
    
    return formatter;
  }
  
  const formatter = createExcelFormatter('$#,##0.00');
  
  return {
    field: 'price',
    headerName: 'Price',
    valueFormatter: formatter,
    width: 120
  };
}

// Simulate the serialization extraction process
function extractFormatterCustomization(col) {
  const customization = { field: col.field };
  
  if (col.valueFormatter) {
    console.log('[Test] Processing valueFormatter for field:', col.field, {
      type: typeof col.valueFormatter,
      isFunction: typeof col.valueFormatter === 'function'
    });
    
    if (typeof col.valueFormatter === 'function') {
      const formatString = col.valueFormatter.__formatString;
      const formatterType = col.valueFormatter.__formatterType;
      
      console.log('[Test] Function formatter metadata:', {
        field: col.field,
        hasFormatString: !!formatString,
        formatString: formatString,
        formatterType: formatterType
      });
      
      if (formatString) {
        customization.valueFormatter = {
          type: formatterType || 'excel',
          formatString
        };
        console.log('[Test] ✅ Successfully extracted formatter for field:', col.field);
      } else {
        console.warn('[Test] ⚠️ Formatter function has no __formatString metadata for field:', col.field);
      }
    }
  }
  
  return customization;
}

// Test the process
const testColumn = createTestColumn();
console.log('\n📋 Test Column Created:');
console.log('Field:', testColumn.field);
console.log('Has valueFormatter:', !!testColumn.valueFormatter);
console.log('Formatter type:', typeof testColumn.valueFormatter);

// Test formatter functionality
const testResult = testColumn.valueFormatter({ value: 1234.56 });
console.log('Formatter test result:', testResult);

// Test metadata access
console.log('\n🔍 Checking Metadata:');
console.log('__formatString:', testColumn.valueFormatter.__formatString);
console.log('__formatterType:', testColumn.valueFormatter.__formatterType);

// Test serialization
console.log('\n💾 Testing Serialization:');
const extracted = extractFormatterCustomization(testColumn);
console.log('Extracted customization:', JSON.stringify(extracted, null, 2));

// Test what happens if metadata is missing
console.log('\n🚫 Testing Formatter Without Metadata:');
const formatterWithoutMetadata = (params) => `Custom: ${params.value}`;
const columnWithoutMetadata = {
  field: 'custom',
  valueFormatter: formatterWithoutMetadata
};

const extractedWithoutMetadata = extractFormatterCustomization(columnWithoutMetadata);
console.log('Extracted without metadata:', JSON.stringify(extractedWithoutMetadata, null, 2));

console.log('\n✅ Test completed!');

// Summary
console.log('\n📊 Summary:');
console.log('✓ Formatters created via createExcelFormatter should persist correctly');
console.log('✓ Formatters without metadata will not be serialized');
console.log('✓ Check console logs when saving profile to see which formatters are being processed'); 