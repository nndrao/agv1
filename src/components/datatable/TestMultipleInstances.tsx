import { DataTable } from './DataTable';
import { ColumnDef } from './types';

// Sample data
const sampleData1 = [
  { id: 1, name: 'John Doe', age: 30, department: 'Engineering' },
  { id: 2, name: 'Jane Smith', age: 25, department: 'Marketing' },
  { id: 3, name: 'Bob Johnson', age: 35, department: 'Sales' },
];

const sampleData2 = [
  { product: 'Laptop', price: 999, stock: 50, category: 'Electronics' },
  { product: 'Mouse', price: 29, stock: 100, category: 'Accessories' },
  { product: 'Keyboard', price: 89, stock: 75, category: 'Accessories' },
];

const columns1: ColumnDef[] = [
  { field: 'id', headerName: 'ID', cellDataType: 'number' },
  { field: 'name', headerName: 'Name', cellDataType: 'text' },
  { field: 'age', headerName: 'Age', cellDataType: 'number' },
  { field: 'department', headerName: 'Department', cellDataType: 'text' },
];

const columns2: ColumnDef[] = [
  { field: 'product', headerName: 'Product', cellDataType: 'text' },
  { field: 'price', headerName: 'Price', cellDataType: 'number' },
  { field: 'stock', headerName: 'Stock', cellDataType: 'number' },
  { field: 'category', headerName: 'Category', cellDataType: 'text' },
];

export function TestMultipleInstances() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Multiple DataTable Instances Test</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Table 1 - Employees</h2>
          <div className="h-[400px]">
            <DataTable
              instanceId="employees-table"
              columnDefs={columns1}
              dataRow={sampleData1}
            />
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Table 2 - Products</h2>
          <div className="h-[400px]">
            <DataTable
              instanceId="products-table"
              columnDefs={columns2}
              dataRow={sampleData2}
            />
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <p className="text-sm">
          Each table has its own:
        </p>
        <ul className="list-disc list-inside text-sm mt-2">
          <li>Profile management (check localStorage for unique keys)</li>
          <li>Column customizations</li>
          <li>Grid state (filters, sorts, column widths)</li>
          <li>Datasource configuration</li>
        </ul>
        <p className="text-sm mt-2">
          Try changing profiles, customizing columns, or applying filters in each table - they should work independently.
        </p>
      </div>
    </div>
  );
}