import React from 'react';
import { createExcelFormatter } from '../utils/formatters';

export const DebugFormatters: React.FC = () => {
  // Test cases for different formatter types
  const testCases = [
    {
      title: 'Custom Emoji Formatters',
      formatters: [
        { 
          name: 'Traffic Light', 
          format: '[Red][<50]🔴 0;[Yellow][<80]🟡 0;[Green]🟢 0',
          values: [45, 75, 95]
        },
        { 
          name: 'Emoji Status', 
          format: '[<0]😟 0;[=0]😐 0;😊 0',
          values: [-5, 0, 10]
        },
        { 
          name: 'Progress Bar', 
          format: '[<25]▰▱▱▱;[<50]▰▰▱▱;[<75]▰▰▰▱;▰▰▰▰',
          values: [20, 40, 60, 80]
        },
        { 
          name: 'Temperature', 
          format: '[Blue][<32]0°F ❄️;[Red][>80]0°F 🔥;0°F',
          values: [30, 70, 85]
        }
      ]
    },
    {
      title: 'Currency Formatters',
      formatters: [
        { 
          name: 'USD', 
          format: '$#,##0.00',
          values: [1234.56, -1234.56]
        },
        { 
          name: 'EUR', 
          format: '€#,##0.00',
          values: [1234.56, -1234.56]
        },
        { 
          name: 'Currency with Color', 
          format: '[Red]($#,##0.00);[Green]$#,##0.00;"Break Even"',
          values: [-100, 100, 0]
        }
      ]
    },
    {
      title: 'Conditional Color Formatters',
      formatters: [
        { 
          name: 'Positive/Negative', 
          format: '[>0][Green]#,##0.00;[<0][Red]#,##0.00;[Blue]#,##0.00',
          values: [100, -50, 0]
        }
      ]
    }
  ];

  return (
    <div className="p-4 bg-background rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Formatter Debug Panel</h2>
      
      {testCases.map((testCase, idx) => (
        <div key={idx} className="mb-6">
          <h3 className="text-lg font-semibold mb-2">{testCase.title}</h3>
          
          {testCase.formatters.map((test, testIdx) => {
            const formatter = createExcelFormatter(test.format);
            
            return (
              <div key={testIdx} className="mb-4 p-3 bg-muted rounded">
                <div className="font-medium mb-1">{test.name}</div>
                <div className="text-sm text-muted-foreground mb-2 font-mono">
                  Format: {test.format}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {test.values.map((value, valueIdx) => {
                    const result = formatter({ value } as any);
                    return (
                      <div key={valueIdx} className="flex justify-between bg-background p-2 rounded">
                        <span className="text-sm">Input: {value}</span>
                        <span className="text-sm font-medium">→ {result}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};