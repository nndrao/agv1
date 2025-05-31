import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Settings, 
  Search, 
  RotateCcw, 
  Save, 
  Download, 
  Upload,
  Copy,
  Plus,
  Trash2,
  Check,
  X,
  AlertCircle,
  Sparkles,
  // Tab Icons
  Sliders,
  MousePointer,
  Filter,
  FileText,
  Layers,
  Edit3,
  Palette,
  Zap,
  Package,
  BarChart3,
  Database,
  Clipboard,
  Wrench,
  Grid3x3,
  Calendar,
  Languages,
  Gauge,
  SearchCheck,
  HelpCircle
} from 'lucide-react';

// Import tabs
import { BasicTab } from './tabs/BasicTab';
import { SelectionTab } from './tabs/SelectionTab';
import { SortingFilteringTab } from './tabs/SortingFilteringTab';
import { PaginationTab } from './tabs/PaginationTab';
import { GroupingPivotingTab } from './tabs/GroupingPivotingTab';
import { EditingTab } from './tabs/EditingTab';
import { StylingTab } from './tabs/StylingTab';
import { PerformanceTab } from './tabs/PerformanceTab';
import { ComponentsTab } from './tabs/ComponentsTab';
import { StatusBarTab } from './tabs/StatusBarTab';
import { DataRenderingTab } from './tabs/DataRenderingTab';
import { ClipboardExportTab } from './tabs/ClipboardExportTab';
import { AdvancedTab } from './tabs/AdvancedTab';
import { ColumnFeaturesTab } from './tabs/ColumnFeaturesTab';
import { EventsCallbacksTab } from './tabs/EventsCallbacksTab';
import { LocalizationTab } from './tabs/LocalizationTab';
import { SizingDimensionsTab } from './tabs/SizingDimensionsTab';
import { FindTab } from './tabs/FindTab';

import { useGridOptionsStore } from './store/gridOptionsStore';
import { ProfilePanel } from './panels/ProfilePanel';
import { SummaryPanel } from './panels/SummaryPanel';
import { DEFAULT_GRID_OPTIONS } from './constants/defaultOptions';
import { GridOptionsProfile } from './types';

import './grid-options-dialog-modern.css';

interface GridOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentOptions?: Record<string, any>;
  onApply: (options: Record<string, any>) => void;
}

const TABS = [
  { id: 'basic', label: 'Basic', icon: Sliders, description: 'Core grid configuration' },
  { id: 'selection', label: 'Selection', icon: MousePointer, description: 'Row and cell selection' },
  { id: 'sorting', label: 'Sorting & Filtering', icon: Filter, description: 'Data manipulation' },
  { id: 'pagination', label: 'Pagination', icon: FileText, description: 'Page navigation' },
  { id: 'grouping', label: 'Grouping & Pivoting', icon: Layers, description: 'Data organization' },
  { id: 'editing', label: 'Editing', icon: Edit3, description: 'Cell editing options' },
  { id: 'styling', label: 'Styling', icon: Palette, description: 'Visual appearance' },
  { id: 'performance', label: 'Performance', icon: Zap, description: 'Optimization settings' },
  { id: 'columns', label: 'Column Features', icon: Grid3x3, description: 'Column behavior' },
  { id: 'components', label: 'Components', icon: Package, description: 'Custom components' },
  { id: 'statusbar', label: 'Status Bar', icon: BarChart3, description: 'Status information' },
  { id: 'data', label: 'Data & Rendering', icon: Database, description: 'Data handling' },
  { id: 'clipboard', label: 'Clipboard & Export', icon: Clipboard, description: 'Copy and export' },
  { id: 'events', label: 'Events & Callbacks', icon: Calendar, description: 'Event handlers' },
  { id: 'localization', label: 'Localization', icon: Languages, description: 'Language settings' },
  { id: 'sizing', label: 'Sizing & Dimensions', icon: Gauge, description: 'Size configuration' },
  { id: 'find', label: 'Find', icon: SearchCheck, description: 'Search functionality' },
  { id: 'advanced', label: 'Advanced', icon: Wrench, description: 'Advanced features' }
] as const;

type TabId = typeof TABS[number]['id'];

export const GridOptionsDialog: React.FC<GridOptionsDialogProps> = ({
  open,
  onOpenChange,
  currentOptions = {},
  onApply
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfiles, setShowProfiles] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const {
    options,
    changedOptions,
    profiles,
    activeProfileId,
    initializeOptions,
    updateOption,
    getModifiedCount,
    getCategoryModifiedCount,
    resetAllOptions,
    resetCategoryOptions,
    applyProfile,
    saveProfile,
    deleteProfile,
    exportProfile,
    importProfile,
    createProfile,
    updateProfile
  } = useGridOptionsStore();

  // Initialize store when dialog opens
  useEffect(() => {
    if (open) {
      initializeOptions(currentOptions);
    }
  }, [open, currentOptions, initializeOptions]);

  // Filter tabs based on search
  const filteredTabs = useMemo(() => {
    if (!searchQuery) return TABS;
    
    const query = searchQuery.toLowerCase();
    return TABS.filter(tab => 
      tab.label.toLowerCase().includes(query) ||
      tab.description.toLowerCase().includes(query) ||
      getOptionsForTab(tab.id).some(opt => 
        opt.toLowerCase().includes(query)
      )
    );
  }, [searchQuery]);

  // Get option keys for a specific tab
  function getOptionsForTab(tabId: TabId): string[] {
    switch (tabId) {
      case 'basic':
        return ['rowData', 'columnDefs', 'defaultColDef', 'rowHeight', 'headerHeight', 'rowModelType'];
      case 'selection':
        return ['rowSelection', 'rowMultiSelectWithClick', 'suppressRowClickSelection', 'suppressCellSelection', 'enableRangeSelection', 'enableRangeHandle', 'suppressRowDeselection'];
      case 'sorting':
        return ['sortingOrder', 'multiSortKey', 'accentedSort', 'enableAdvancedFilter', 'quickFilterText', 'cacheQuickFilter', 'excludeChildrenWhenTreeDataFiltering'];
      case 'pagination':
        return ['pagination', 'paginationPageSize', 'paginationAutoPageSize', 'suppressPaginationPanel', 'paginationPageSizeSelector'];
      case 'grouping':
        return ['groupUseEntireRow', 'groupSelectsChildren', 'groupSelectsFiltered', 'groupRemoveSingleChildren', 'groupSuppressAutoColumn', 
                'pivotMode', 'pivotPanelShow', 'groupDefaultExpanded', 'rowGroupPanelShow', 'groupDisplayType',
                'groupIncludeFooter', 'groupIncludeTotalFooter', 'groupSuppressBlankHeader', 'groupRemoveLowestSingleChildren',
                'groupSuppressRow', 'groupHideOpenParents', 'pivotDefaultExpanded', 'functionsReadOnly',
                'suppressMakeColumnVisibleAfterUnGroup', 'treeDataDisplayType', 'showOpenedGroup', 'suppressGroupZeroSticky',
                'groupRowsSticky', 'groupRowRenderer', 'suppressAggFuncInHeader', 'suppressGroupMaintainValueType'];
      case 'editing':
        return ['editType', 'singleClickEdit', 'suppressClickEdit', 'enterMovesDown', 'enterMovesDownAfterEdit', 'undoRedoCellEditing', 'undoRedoCellEditingLimit'];
      case 'styling':
        return ['theme', 'rowClass', 'rowStyle', 'getRowClass', 'getRowStyle', 'alwaysShowVerticalScroll', 'domLayout', 'animateRows'];
      case 'performance':
        return ['rowBuffer', 'valueCache', 'immutableData', 'asyncTransactionWaitMillis', 'suppressColumnVirtualisation', 'suppressRowVirtualisation'];
      case 'columns':
        return ['suppressDragLeaveHidesColumns', 'suppressMovableColumns', 'suppressFieldDotNotation', 'autoGroupColumnDef', 'suppressAutoSize', 'columnTypes'];
      case 'components':
        return ['components', 'frameworkComponents', 'loadingCellRenderer', 'loadingOverlayComponent', 'noRowsOverlayComponent', 'suppressLoadingOverlay', 'suppressNoRowsOverlay'];
      case 'statusbar':
        return ['statusBar'];
      case 'data':
        return ['rowBuffer', 'dataTypeDefinitions', 'valueCache', 'immutableData', 'enableCellChangeFlash', 'asyncTransactionWaitMillis'];
      case 'clipboard':
        return ['enableCellTextSelection', 'suppressCopyRowsToClipboard', 'suppressCopySingleCellRanges', 'clipboardDelimiter', 
                'processClipboardCopy', 'processClipboardPaste', 'suppressExcelExport', 'suppressCsvExport', 'exporterCsvFilename', 'exporterExcelFilename'];
      case 'events':
        return ['onGridReady', 'onCellClicked', 'onRowClicked', 'onSelectionChanged', 'onFilterChanged', 'onSortChanged',
                'onRowGroupOpened', 'onColumnResized', 'onGridSizeChanged', 'onDragStarted', 'onDragStopped',
                'onPaginationChanged', 'onFirstDataRendered', 'onRowDataUpdated'];
      case 'localization':
        return ['localeText', 'localeTextFunc', 'ensureDomOrder', 'navigateToNextCell', 'tabToNextCell'];
      case 'sizing':
        return ['pivotHeaderHeight', 'pivotGroupHeaderHeight', 'groupHeaderHeight', 'floatingFiltersHeight', 'detailRowHeight', 'groupRowHeight'];
      case 'find':
        return ['find', 'findCellValueMatcher', 'findNextParams', 'findPreviousParams'];
      case 'advanced':
        return ['enableCharts', 'masterDetail', 'detailCellRendererParams', 'treeData', 'getDataPath', 'getRowNodeId', 'serverSideRowModel'];
      default:
        return [];
    }
  }

  const handleApply = useCallback(() => {
    onApply(changedOptions);
    onOpenChange(false);
  }, [changedOptions, onApply, onOpenChange]);

  const handleReset = useCallback(() => {
    resetAllOptions();
  }, [resetAllOptions]);

  const totalModified = getModifiedCount();
  const activeTabData = TABS.find(t => t.id === activeTab);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid-options-dialog max-w-[95vw] w-[1400px] h-[90vh]">
        <DialogHeader className="grid-options-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-primary" />
              <DialogTitle className="grid-options-title">
                Grid Options Configuration
              </DialogTitle>
              {totalModified > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalModified} modified
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfiles(!showProfiles)}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Profiles
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSummary(!showSummary)}
                className="gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Summary
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={totalModified === 0}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset All
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid-options-content">
          <div className="grid-options-sidebar">
            <div className="grid-options-search">
              <div className="grid-options-search-input">
                <Search className="grid-options-search-icon w-4 h-4" />
                <Input
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <ScrollArea className="grid-options-nav">
              {filteredTabs.map((tab) => {
                const modifiedCount = getCategoryModifiedCount(getOptionsForTab(tab.id));
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "grid-options-nav-item",
                      activeTab === tab.id && "active"
                    )}
                  >
                    <div className="grid-options-nav-label">
                      <Icon className="grid-options-nav-icon" />
                      <div className="text-left">
                        <div className="font-medium">{tab.label}</div>
                        <div className="text-xs text-muted-foreground">{tab.description}</div>
                      </div>
                    </div>
                    {modifiedCount > 0 && (
                      <Badge className="grid-options-nav-badge">
                        {modifiedCount}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </ScrollArea>
          </div>

          <div className="grid-options-main">
            <div className="grid-options-tab-header">
              <div className="grid-options-tab-title">
                {activeTabData && (
                  <>
                    <activeTabData.icon className="grid-options-tab-icon" />
                    <span>{activeTabData.label}</span>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetCategoryOptions(getOptionsForTab(activeTab))}
                disabled={getCategoryModifiedCount(getOptionsForTab(activeTab)) === 0}
                className="gap-2"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Tab
              </Button>
            </div>

            <div className="grid-options-tab-content">
              <Tabs value={activeTab} className="h-full">
                <TabsContent value="basic" className="mt-0">
                  <BasicTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="selection" className="mt-0">
                  <SelectionTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="sorting" className="mt-0">
                  <SortingFilteringTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="pagination" className="mt-0">
                  <PaginationTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="grouping" className="mt-0">
                  <GroupingPivotingTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="editing" className="mt-0">
                  <EditingTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="styling" className="mt-0">
                  <StylingTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="performance" className="mt-0">
                  <PerformanceTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="columns" className="mt-0">
                  <ColumnFeaturesTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="components" className="mt-0">
                  <ComponentsTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="statusbar" className="mt-0">
                  <StatusBarTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="data" className="mt-0">
                  <DataRenderingTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="clipboard" className="mt-0">
                  <ClipboardExportTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="events" className="mt-0">
                  <EventsCallbacksTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="localization" className="mt-0">
                  <LocalizationTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="sizing" className="mt-0">
                  <SizingDimensionsTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="find" className="mt-0">
                  <FindTab options={options} onChange={updateOption} />
                </TabsContent>
                
                <TabsContent value="advanced" className="mt-0">
                  <AdvancedTab options={options} onChange={updateOption} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="grid-options-footer">
          <div className="grid-options-footer-info">
            <Sparkles className="w-4 h-4" />
            {totalModified === 0 ? 'No changes made' : `${totalModified} option${totalModified === 1 ? '' : 's'} modified`}
          </div>
          <div className="grid-options-footer-actions">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              disabled={totalModified === 0}
              className="grid-options-button gap-2"
            >
              <Check className="w-4 h-4" />
              Apply Changes
            </Button>
          </div>
        </div>

        {/* Profile Panel */}
        {showProfiles && (
          <div className="grid-options-overlay">
            <ProfilePanel
              profiles={profiles}
              activeProfileId={activeProfileId}
              onApply={applyProfile}
              onSave={saveProfile}
              onDelete={deleteProfile}
              onExport={exportProfile}
              onImport={importProfile}
              onClose={() => setShowProfiles(false)}
              onCreate={createProfile}
              onRename={(id, name) => updateProfile(id, { name })}
            />
          </div>
        )}

        {/* Summary Panel */}
        {showSummary && (
          <div className="grid-options-overlay">
            <SummaryPanel
              changedOptions={changedOptions}
              onClose={() => setShowSummary(false)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};