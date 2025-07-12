# Handling ISO Date Strings in AG-Grid

This guide explains how to properly handle ISO date strings (like `2025-07-12T11:40:58.458Z`) in the AGV1 data grid.

## Overview

ISO 8601 date strings are automatically detected and handled by the system when data is ingested through STOMP datasources. The system recognizes various ISO date formats and applies appropriate formatting and filtering.

## Supported ISO Date Formats

The system automatically detects the following ISO date patterns:
- `2025-07-12` - Date only
- `2025-07-12T11:40:58` - Date and time without timezone
- `2025-07-12T11:40:58Z` - Date and time in UTC
- `2025-07-12T11:40:58.458Z` - Date and time with milliseconds in UTC
- `2025-07-12T11:40:58+02:00` - Date and time with timezone offset

## Automatic Detection

When you infer fields from a STOMP datasource:
1. The system analyzes sample data to detect field types
2. ISO date strings are automatically identified as `date` type
3. Date columns are configured with:
   - `cellDataType: 'date'`
   - `filter: 'agDateColumnFilter'`
   - Default format: `YYYY-MM-DD HH:mm:ss`

## Available Date Formats

You can customize the display format of dates using these patterns:

### Basic Date Formats
- `MM/DD/YYYY` - 12/31/2023
- `DD/MM/YYYY` - 31/12/2023
- `YYYY-MM-DD` - 2023-12-31
- `MMM D, YYYY` - Dec 31, 2023
- `MMMM D, YYYY` - December 31, 2023

### Time Formats
- `HH:mm:ss` - 15:45:30 (24-hour)
- `h:mm AM/PM` - 3:45 PM (12-hour)

### Combined DateTime Formats
- `YYYY-MM-DD HH:mm:ss` - 2023-12-31 15:45:30
- `YYYY-MM-DDTHH:mm:ss` - 2023-12-31T15:45:30
- `YYYY-MM-DDTHH:mm:ss.sssZ` - 2023-12-31T15:45:30.123Z
- `MM/DD/YY h:mm AM/PM` - 12/31/23 3:45 PM
- `MMM D, YYYY h:mm AM/PM` - Dec 31, 2023 3:45 PM

## Manual Configuration

If you need to manually configure a date column:

```typescript
{
  field: 'timestamp',
  headerName: 'Timestamp',
  cellDataType: 'dateString',
  filter: 'agDateColumnFilter',
  valueFormatter: 'YYYY-MM-DD HH:mm:ss'
}
```

## Format String Reference

The date formatter supports these tokens:
- `YYYY` - 4-digit year
- `YY` - 2-digit year
- `MM` - 2-digit month (01-12)
- `M` - Month (1-12)
- `MMM` - Short month name (Jan, Feb, etc.)
- `MMMM` - Full month name (January, February, etc.)
- `DD` - 2-digit day (01-31)
- `D` - Day (1-31)
- `HH` - 2-digit hour (00-23)
- `H` - Hour (0-23)
- `hh` - 2-digit hour (01-12)
- `h` - Hour (1-12)
- `mm` - 2-digit minute (00-59)
- `m` - Minute (0-59)
- `ss` - 2-digit second (00-59)
- `s` - Second (0-59)
- `sss` - Milliseconds (000-999)
- `AM/PM` - Uppercase AM/PM
- `am/pm` - Lowercase am/pm
- `Z` - Timezone (Z for UTC or ±HH:mm)
- `T` - Literal T separator

## Best Practices

1. **Use ISO format for data storage**: Always store dates in ISO 8601 format for consistency
2. **Let the system auto-detect**: The field inference will correctly identify ISO date fields
3. **Choose appropriate display format**: Select a format that matches your users' locale and preferences
4. **Use date filters**: The `agDateColumnFilter` provides powerful date filtering capabilities
5. **Consider timezone**: Dates are displayed in the user's local timezone by default

## Example Usage

When creating a STOMP datasource:
1. Click "Infer Fields" to analyze your data
2. Fields containing ISO dates will be marked as `date` type
3. In the Columns tab, you can customize the date format if needed
4. The grid will automatically apply date filtering and formatting

## Troubleshooting

If dates are not displaying correctly:
1. Verify the source data is in a valid ISO format
2. Check the column's `cellDataType` is set to `date` or `dateString`
3. Ensure the `valueFormatter` uses a valid format string
4. Confirm the filter is set to `agDateColumnFilter`