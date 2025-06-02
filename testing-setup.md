# Testing Setup Guide for Column Settings Dialog

## 1. Unit Testing Setup (Jest + React Testing Library)

### Installation
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Test Configuration (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/components/datatable/dialogs/**/*.{ts,tsx}',
    '!src/components/datatable/dialogs/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Sample Unit Tests
```typescript
// __tests__/ColumnCustomizationDialog.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnCustomizationDialog } from '../ColumnCustomizationDialog';

describe('ColumnCustomizationDialog', () => {
  const mockProps = {
    open: true,
    onOpenChange: jest.fn(),
    columns: [
      { field: 'name', headerName: 'Name' },
      { field: 'email', headerName: 'Email' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog with all tabs', () => {
    render(<ColumnCustomizationDialog {...mockProps} />);
    
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Styling')).toBeInTheDocument();
    expect(screen.getByText('Format')).toBeInTheDocument();
  });

  it('should handle column selection', async () => {
    const user = userEvent.setup();
    render(<ColumnCustomizationDialog {...mockProps} />);
    
    const nameCheckbox = screen.getByLabelText(/name/i);
    await user.click(nameCheckbox);
    
    expect(nameCheckbox).toBeChecked();
  });

  it('should apply format changes', async () => {
    const user = userEvent.setup();
    render(<ColumnCustomizationDialog {...mockProps} />);
    
    // Select Format tab
    const formatTab = screen.getByText('Format');
    await user.click(formatTab);
    
    // Select a format
    const formatSelect = screen.getByRole('combobox');
    await user.click(formatSelect);
    await user.click(screen.getByText('Currency'));
    
    // Apply changes
    const applyButton = screen.getByText('Apply & Close');
    await user.click(applyButton);
    
    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
  });
});
```

## 2. Integration Testing Setup

### AG-Grid Mock
```typescript
// __mocks__/ag-grid-react.ts
export const AgGridReact = jest.fn(({ onGridReady, columnDefs, rowData }) => {
  // Mock AG-Grid component
  React.useEffect(() => {
    if (onGridReady) {
      onGridReady({
        api: {
          setColumnDefs: jest.fn(),
          refreshCells: jest.fn(),
          sizeColumnsToFit: jest.fn(),
        },
        columnApi: {
          getAllColumns: jest.fn(() => columnDefs?.map(col => ({ colId: col.field }))),
        },
      });
    }
  }, [onGridReady]);

  return <div data-testid="ag-grid-mock" />;
});
```

### Integration Test Example
```typescript
// __tests__/integration/GridColumnFormatting.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../../DataTable';

describe('Grid Column Formatting Integration', () => {
  it('should apply currency format to salary column', async () => {
    const user = userEvent.setup();
    const testData = [
      { id: 1, name: 'John', salary: 75000 },
      { id: 2, name: 'Jane', salary: 85000 },
    ];

    render(<DataTable data={testData} />);

    // Open column settings
    const settingsButton = screen.getByLabelText('Column Settings');
    await user.click(settingsButton);

    // Select salary column
    const salaryCheckbox = screen.getByLabelText(/salary/i);
    await user.click(salaryCheckbox);

    // Apply currency format
    const formatTab = screen.getByText('Format');
    await user.click(formatTab);

    const currencyButton = screen.getByText('Currency');
    await user.click(currencyButton);

    const applyButton = screen.getByText('Apply & Close');
    await user.click(applyButton);

    // Verify format applied to grid
    await waitFor(() => {
      expect(screen.getByText('$75,000.00')).toBeInTheDocument();
      expect(screen.getByText('$85,000.00')).toBeInTheDocument();
    });
  });
});
```

## 3. E2E Testing Setup (Playwright)

### Installation
```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Playwright Configuration (`playwright.config.ts`)
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    actionTimeout: 0,
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
  },
});
```

### E2E Test Example
```typescript
// e2e/column-settings.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Column Settings Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full column customization workflow', async ({ page }) => {
    // Open column settings dialog
    await page.click('[data-testid="column-settings-button"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Select columns
    await page.click('input[type="checkbox"][value="salary"]');
    await page.click('input[type="checkbox"][value="performance"]');

    // Switch to Format tab
    await page.click('[role="tab"][data-value="formatters"]');

    // Apply currency format
    await page.click('[data-testid="format-dropdown"]');
    await page.click('text=USD Currency');

    // Create a template
    await page.click('[data-testid="create-template-button"]');
    await page.fill('[data-testid="template-name-input"]', 'Financial Columns');
    await page.click('[data-testid="save-template-button"]');

    // Apply changes
    await page.click('text=Apply & Close');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Verify formatting applied
    await expect(page.locator('text=$75,000.00').first()).toBeVisible();
  });

  test('should handle format guide dialog', async ({ page }) => {
    await page.click('[data-testid="column-settings-button"]');
    await page.click('[role="tab"][data-value="formatters"]');
    await page.click('[data-testid="format-guide-button"]');

    // Verify format guide content
    await expect(page.locator('text=Excel Format String Guide')).toBeVisible();
    await expect(page.locator('text=Basic Number Formats')).toBeVisible();
    await expect(page.locator('text=Conditional Formatting')).toBeVisible();

    // Test copying format examples
    await page.click('[data-testid="copy-format-example"]:first-child');
    // Verify copy feedback
    await expect(page.locator('[data-testid="copy-success-icon"]')).toBeVisible();

    await page.click('[data-testid="close-guide-button"]');
    await expect(page.locator('text=Excel Format String Guide')).not.toBeVisible();
  });
});
```

## 4. Performance Testing

### Performance Test Script
```typescript
// performance/column-settings-performance.test.ts
import { chromium } from 'playwright';

describe('Column Settings Performance', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should render dialog quickly with many columns', async () => {
    await page.goto('/test-page-with-100-columns');

    const start = performance.now();
    await page.click('[data-testid="column-settings-button"]');
    await page.waitForSelector('[role="dialog"]');
    const end = performance.now();

    expect(end - start).toBeLessThan(500); // Should render in < 500ms
  });

  test('should handle format application efficiently', async () => {
    await page.goto('/test-page-with-large-dataset');
    await page.click('[data-testid="column-settings-button"]');

    // Select all columns
    await page.click('[data-testid="select-all-columns"]');

    // Apply complex format
    const start = performance.now();
    await page.click('[data-testid="apply-complex-format"]');
    await page.waitForSelector('[data-testid="format-applied"]');
    const end = performance.now();

    expect(end - start).toBeLessThan(1000); // Should apply in < 1s
  });
});
```

## 5. Visual Regression Testing

### Percy Setup
```bash
npm install --save-dev @percy/cli @percy/playwright
```

### Visual Test Example
```typescript
// visual/column-settings-visual.spec.ts
import { test } from '@playwright/test';
import { percySnapshot } from '@percy/playwright';

test.describe('Column Settings Visual Tests', () => {
  test('should match visual snapshots', async ({ page }) => {
    await page.goto('/');

    // Light mode
    await page.click('[data-testid="column-settings-button"]');
    await percySnapshot(page, 'Column Settings Dialog - Light Mode');

    // Format tab
    await page.click('[role="tab"][data-value="formatters"]');
    await percySnapshot(page, 'Format Tab - Light Mode');

    // Format dropdown open
    await page.click('[data-testid="format-dropdown"]');
    await percySnapshot(page, 'Format Dropdown - Open');

    // Dark mode
    await page.click('[data-testid="theme-toggle"]');
    await percySnapshot(page, 'Column Settings Dialog - Dark Mode');

    // Quick Actions panel
    await page.click('[data-testid="quick-actions-toggle"]');
    await percySnapshot(page, 'Quick Actions Panel - Expanded');
  });
});
```

## 6. Accessibility Testing

### Axe-Core Setup
```bash
npm install --save-dev @axe-core/playwright
```

### Accessibility Test
```typescript
// a11y/column-settings-a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Column Settings Accessibility', () => {
  test('should be accessible', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="column-settings-button"]');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab to column settings button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Tab through dialog elements
    await page.keyboard.press('Tab'); // First checkbox
    await page.keyboard.press('Space'); // Select column
    
    await page.keyboard.press('Tab'); // Next checkbox
    await page.keyboard.press('Tab'); // Format tab
    await page.keyboard.press('Enter'); // Switch to format tab

    // Verify focus management
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
```

## 7. Continuous Integration Setup

### GitHub Actions Workflow
```yaml
# .github/workflows/column-settings-tests.yml
name: Column Settings Tests

on:
  push:
    paths:
      - 'src/components/datatable/dialogs/columnSettings/**'
  pull_request:
    paths:
      - 'src/components/datatable/dialogs/columnSettings/**'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx percy exec -- npm run test:visual
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}

  accessibility-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:a11y
```

## 8. Test Data Management

### Test Data Factory
```typescript
// test-utils/test-data-factory.ts
export const createTestColumns = (count: number = 5) => {
  const types = ['string', 'number', 'date', 'boolean'];
  return Array.from({ length: count }, (_, i) => ({
    field: `column${i}`,
    headerName: `Column ${i}`,
    type: types[i % types.length],
    width: 100 + (i * 20),
  }));
};

export const createTestRowData = (columnCount: number, rowCount: number = 100) => {
  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const row: any = { id: rowIndex };
    for (let i = 0; i < columnCount; i++) {
      row[`column${i}`] = `Value ${rowIndex}-${i}`;
    }
    return row;
  });
};

export const createComplexFormatScenarios = () => [
  {
    name: 'Currency with conditions',
    pattern: '[>100000][Green]$#,##0;[<0][Red]"-$"#,##0;$#,##0',
    testValues: [150000, -5000, 50000],
    expectedResults: ['$150,000 (green)', '-$5,000 (red)', '$50,000']
  },
  {
    name: 'Performance indicators',
    pattern: '[>=90]"🟢 "#0"%";[>=70]"🟡 "#0"%";[Red]"🔴 "#0"%"',
    testValues: [95, 75, 45],
    expectedResults: ['🟢 95%', '🟡 75%', '�� 45%']
  }
];
``` 