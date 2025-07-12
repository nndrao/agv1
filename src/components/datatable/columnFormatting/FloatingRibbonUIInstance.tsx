/**
 * Instance-specific version of FloatingRibbonUI
 * Uses instance-specific profile hooks
 */
import React, { memo } from 'react';
import { ColDef, ColumnState } from 'ag-grid-community';
import { CustomTabs } from './components/custom/CustomTabs';
import { CustomContent } from './components/custom/CustomContent';
import { useInstanceRibbonState } from './hooks/useInstanceRibbonState';
import { ErrorBoundary, IsolatedErrorBoundary } from './components/ErrorBoundary';
interface FloatingRibbonUIInstanceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetColumn?: string;
  columnDefs?: ColDef[];
  columnState?: ColumnState[];
  onApply?: (updatedColumnDefs: ColDef[]) => void;
}

export const FloatingRibbonUIInstance: React.FC<FloatingRibbonUIInstanceProps> = memo(({ 
  open, 
  onOpenChange,
  targetColumn,
  columnDefs,
  columnState,
  onApply
}) => {
  // Use the instance-specific hook for all ribbon state and logic
  const ribbonState = useInstanceRibbonState({
    targetColumn,
    columnDefs,
    columnState,
    onApply
  });

  const {
    activeTab,
    selectedColumns,
    handleApply,
    handleReset
  } = ribbonState;

  const handleClose = () => {
    console.log('[FloatingRibbonUIInstance] Closing dialog');
    handleReset();
    onOpenChange(false);
  };

  const handleApplyAndClose = () => {
    console.log('[FloatingRibbonUIInstance] Applying changes and closing');
    handleApply();
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-background shadow-lg rounded-lg overflow-hidden">
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Column Formatting
                  {selectedColumns.size > 0 && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({selectedColumns.size} column{selectedColumns.size > 1 ? 's' : ''} selected)
                    </span>
                  )}
                </h2>
                <button
                  onClick={handleClose}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                >
                  <span className="sr-only">Close</span>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <IsolatedErrorBoundary>
                <CustomTabs
                  activeTab={activeTab}
                  setActiveTab={(tab: string) => ribbonState.setActiveTab(tab as RibbonTab)}
                  selectedColumns={selectedColumns}
                />
              </IsolatedErrorBoundary>

              {/* Content */}
              <IsolatedErrorBoundary>
                <CustomContent {...ribbonState} />
              </IsolatedErrorBoundary>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyAndClose}
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
                  disabled={selectedColumns.size === 0}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
});

FloatingRibbonUIInstance.displayName = 'FloatingRibbonUIInstance';