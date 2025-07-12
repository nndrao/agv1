# Numeric Column Configuration

This guide explains how numeric columns are automatically configured in AG-Grid through the datasource system.

## Overview

When creating a datasource, numeric fields are automatically detected and configured with AG-Grid's `numericColumn` type, which provides optimized handling for number data.

## Automatic Configuration

When fields are inferred from your data:

1. **Field Type Detection**: The system analyzes sample data to identify numeric fields
2. **Column Type Assignment**: Numeric columns automatically receive:
   - `cellDataType: 'number'`
   - `type: 'numericColumn'`
   - `filter: 'agNumberColumnFilter'`

## Benefits of numericColumn Type

The `numericColumn` type in AG-Grid provides:

- **Right-aligned display**: Numbers are right-aligned by default
- **Numeric sorting**: Proper numeric sorting (1, 2, 10 instead of 1, 10, 2)
- **Numeric filtering**: Specialized number filters with comparison operators
- **Keyboard navigation**: Optimized for numeric data entry
- **Aggregation support**: Built-in sum, average, min, max functions

## Column Definition Example

When a numeric field is detected, the system generates:

```javascript
{
  field: 'price',
  headerName: 'Price',
  cellDataType: 'number',
  type: 'numericColumn',
  filter: 'agNumberColumnFilter'
}
```

## Manual Override

You can override the automatic detection in the Columns tab:
1. Select the column in the grid
2. Change the Type dropdown to a different value if needed
3. The changes are saved with the datasource configuration

## Supported Number Formats

The system correctly identifies:
- Integers: `123`, `-456`
- Decimals: `123.45`, `-67.89`
- Scientific notation: `1.23e4`, `-5.67e-8`
- Financial values: `1234.56`

## Best Practices

1. **Let auto-detection work**: The system accurately identifies numeric fields
2. **Use consistent data**: Ensure numeric fields contain only numbers
3. **Consider formatting**: Apply value formatters for display (currency, percentage, etc.)
4. **Enable aggregations**: Numeric columns support built-in aggregation functions