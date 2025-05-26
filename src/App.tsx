import { Menu } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { DataTable, type ColumnDef } from '@/components/datatable/data-table';
import { generateFixedIncomeData, type FixedIncomePosition } from '@/lib/data-generator';
import { useMemo } from 'react';

function inferColumnDefinitions(data: FixedIncomePosition[]): ColumnDef[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  // Use a fixed sample size for efficiency
  const SAMPLE_SIZE = 10;
  const sampleData = data.slice(0, SAMPLE_SIZE);

  // Get all unique keys from the first row
  const keys = Object.keys(data[0]);

  // Improved type inference: handle null/undefined, mixed types
  const inferType = (values: unknown[]): string => {
    let hasNumber = false, hasDate = false, hasBoolean = false, hasString = false;
    for (const value of values) {
      if (value === null || value === undefined) continue;
      if (typeof value === 'number' && !isNaN(value)) hasNumber = true;
      else if (typeof value === 'boolean') hasBoolean = true;
      else if (typeof value === 'string') {
        if (!isNaN(Date.parse(value))) hasDate = true;
        else hasString = true;
      } else if (value instanceof Date && !isNaN(value.getTime())) hasDate = true;
      else hasString = true;
    }
    if (hasNumber && !hasString && !hasDate && !hasBoolean) return 'number';
    if (hasDate && !hasString && !hasNumber && !hasBoolean) return 'date';
    if (hasBoolean && !hasString && !hasNumber && !hasDate) return 'boolean';
    return 'string';
  };

  return keys.map(key => {
    const sampleValues = sampleData.map(row => row[key]);
    const inferredType = inferType(sampleValues);
    let cellDataType: 'text' | 'number' | 'date' | 'boolean' = 'text';
    switch (inferredType) {
      case 'number': cellDataType = 'number'; break;
      case 'date': cellDataType = 'date'; break;
      case 'boolean': cellDataType = 'boolean'; break;
      default: cellDataType = 'text';
    }
    return {
      field: key,
      headerName: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim(),
      cellDataType,
    };
  });
}


function App() {
  // Memoize data and columns for stable references (prevent unnecessary re-renders)
  const data = useMemo(() => generateFixedIncomeData(10000), []);

  const columns = useMemo(() => inferColumnDefinitions(data), [data]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Menu className="h-6 w-6" />
            <h1 className="text-lg font-semibold">Fixed Income Portfolio</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content - Centered DataTable */}
      <main className="flex-1 flex items-center justify-center p-6 min-h-0">
        <div className="w-full h-full max-w-7xl mx-auto">
          <div className="h-full rounded-lg border bg-card shadow-sm overflow-hidden">
            {/* DataTable receives stable, memoized props */}
            <DataTable columnDefs={columns} dataRow={data} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t">
        <div className="flex h-12 items-center justify-center px-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Your Company. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}


export default App;