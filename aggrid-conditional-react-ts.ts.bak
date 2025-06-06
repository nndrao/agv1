import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, CellStyleParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// Types
interface CellStyleConfig {
  cellStyle: React.CSSProperties;
  valueFormatter: string;
}

interface GridData {
  id: number;
  value: number;
  revenue: number;
  status: string;
}

// Simple conditional format parser
const parseConditionalFormat = (formatString: string, value: any): React.CSSProperties => {
  const conditions = formatString.match(/\[([^\]]+)\]([^;]+);/g) || [];
  
  for (const condition of conditions) {
    const match = condition.match(/\[([^\]]+)\]([^;]+);/);
    if (!match) continue;
    
    const [, conditionExpr, styleString] = match;
    
    // Evaluate the condition
    if (evaluateCondition(conditionExpr, value)) {
      // Parse the style string into an object
      const styles: React.CSSProperties = {};
      const stylePairs = styleString.split(';').filter(s => s);
      
      stylePairs.forEach(pair => {
        const [property, value] = pair.split(':').map(s => s.trim());
        if (property && value) {
          // Convert kebab-case to camelCase
          const camelCaseProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          styles[camelCaseProperty as keyof React.CSSProperties] = value as any;
        }
      });
      
      return styles;
    }
  }
  
  return {};
};

// Condition evaluator
const evaluateCondition = (condition: string, value: any): boolean => {
  // Handle numeric comparisons
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  
  if (condition.startsWith('>=')) {
    return numValue >= parseFloat(condition.substring(2));
  } else if (condition.startsWith('<=')) {
    return numValue <= parseFloat(condition.substring(2));
  } else if (condition.startsWith('>')) {
    return numValue > parseFloat(condition.substring(1));
  } else if (condition.startsWith('<')) {
    return numValue < parseFloat(condition.substring(1));
  } else if (condition.startsWith('=')) {
    return value == condition.substring(1);
  } else if (condition.includes('..')) {
    const [min, max] = condition.split('..').map(parseFloat);
    return numValue >= min && numValue <= max;
  }
  
  return false;
};

// Factory function to create cell style function
const createConditionalCellStyle = (
  baseStyles: React.CSSProperties, 
  conditionalFormat: string
) => {
  return (params: CellStyleParams): React.CSSProperties => {
    // Get conditional styles based on cell value
    const conditionalStyles = parseConditionalFormat(conditionalFormat, params.value);
    
    // Merge with conditional styles taking precedence
    return { ...baseStyles, ...conditionalStyles };
  };
};

// Main component
const ConditionalStyleGrid: React.FC = () => {
  // Sample data
  const rowData: GridData[] = useMemo(() => [
    { id: 1, value: 150, revenue: 1500000, status: 'Active' },
    { id: 2, value: 45, revenue: 750000, status: 'Pending' },
    { id: 3, value: 75, revenue: 50000, status: 'Inactive' },
    { id: 4, value: 200, revenue: 2000000, status: 'Active' },
  ], []);

  // Column configurations with base styles and conditional formatting
  const columnConfigs: Record<string, CellStyleConfig> = {
    value: {
      cellStyle: {
        color: 'black',
        backgroundColor: 'white',
        fontSize: '14px',
        textAlign: 'center' as const
      },
      valueFormatter: '[>100]color:green;background-color:lightgreen;[<50]color:red;background-color:pink;'
    },
    revenue: {
      cellStyle: {
        textAlign: 'right' as const,
        padding: '5px',
        fontSize: '13px'
      },
      valueFormatter: '[>1000000]color:green;font-weight:bold;[<100000]color:red;background-color:#ffe6e6;'
    },
    status: {
      cellStyle: {
        textAlign: 'center' as const,
        padding: '4px'
      },
      valueFormatter: '[=Active]color:white;background-color:#4caf50;[=Pending]color:white;background-color:#ff9800;[=Inactive]color:white;background-color:#9e9e9e;'
    }
  };

  // Column definitions
  const columnDefs: ColDef<GridData>[] = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 80
    },
    {
      field: 'value',
      headerName: 'Value',
      width: 120,
      cellStyle: createConditionalCellStyle(
        columnConfigs.value.cellStyle,
        columnConfigs.value.valueFormatter
      )
    },
    {
      field: 'revenue',
      headerName: 'Revenue',
      width: 150,
      cellStyle: createConditionalCellStyle(
        columnConfigs.revenue.cellStyle,
        columnConfigs.revenue.valueFormatter
      ),
      valueFormatter: (params) => {
        return params.value ? `$${params.value.toLocaleString()}` : '';
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      cellStyle: createConditionalCellStyle(
        columnConfigs.status.cellStyle,
        columnConfigs.status.valueFormatter
      )
    }
  ], []);

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <h2>ag-Grid with Conditional Styling</h2>
      <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
        <AgGridReact<GridData>
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={{
            resizable: true,
            sortable: true
          }}
        />
      </div>
    </div>
  );
};

// Example usage in App component
const App: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <ConditionalStyleGrid />
      
      {/* Example of how to use the utility functions directly */}
      <div style={{ marginTop: '20px' }}>
        <h3>Configuration Example:</h3>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
{`// Define your column config with base styles and conditional format
const columnConfig: CellStyleConfig = {
  cellStyle: {
    color: 'black',
    fontSize: '14px',
    textAlign: 'center'
  },
  valueFormatter: '[>100]color:green;[<50]color:red;'
};

// Use in column definition
const columnDef: ColDef = {
  field: 'value',
  cellStyle: createConditionalCellStyle(
    columnConfig.cellStyle,
    columnConfig.valueFormatter
  )
};`}
        </pre>
      </div>
    </div>
  );
};

export default App;

// Export utilities for use in other components
export { 
  parseConditionalFormat, 
  evaluateCondition, 
  createConditionalCellStyle,
  type CellStyleConfig 
};