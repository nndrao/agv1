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
  const inferType = (values: any[]): string => {
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
    let columnDataType: 'text' | 'number' | 'date' | 'boolean' = 'text';
    switch (inferredType) {
      case 'number': columnDataType = 'number'; break;
      case 'date': columnDataType = 'date'; break;
      case 'boolean': columnDataType = 'boolean'; break;
      default: columnDataType = 'text';
    }
    return {
      field: key,
      headerName: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim(),
      columnDataType,
    };
  });
}


function App() {
  // Memoize data and columns for stable references (prevent unnecessary re-renders)
  const data = useMemo(() => generateFixedIncomeData(10000), []);
  const columns = useMemo(() => inferColumnDefinitions(data), [data && data[0] ? Object.keys(data[0]).join(',') : '']);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Menu className="h-6 w-6" />
            <h1 className="text-lg font-semibold">Fixed Income Portfolio</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container py-6">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="h-[calc(100vh-10rem)]">
              {/* DataTable receives stable, memoized props */}
              <DataTable columnDefs={columns} dataRow={data} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container flex h-16 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Your Company. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}


export default App;