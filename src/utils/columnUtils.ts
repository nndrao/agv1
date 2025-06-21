import { ColumnDef } from '@/components/datatable/types';

export function inferColumnDefinitions(data: any[]): ColumnDef[] {
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