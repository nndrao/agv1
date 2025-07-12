import React, { useEffect, useRef, useState } from 'react';
import {
  DockviewReact,
  DockviewReadyEvent,
  IDockviewPanelProps,
  DockviewApi,
  themeDark,
  themeLight,
} from 'dockview';
import { DataTable } from '@/components/datatable/DataTable';
import { generateFixedIncomeData } from '@/components/datatable/lib/dataGenerator';
import { inferColumnDefinitions } from '@/utils/columnUtils';
import { useWorkspaceStore } from './stores/workspace.store';
import { useTheme } from '@/components/datatable/ThemeProvider';
import { TableDialog } from './TableDialog';
import 'dockview/dist/styles/dockview.css';



// Panel component for DataTable
const DataTablePanel: React.FC<IDockviewPanelProps> = ({ params }) => {
  const { tableId } = params as { tableId: string; title: string; datasourceId?: string };
  // Note: datasourceId can be passed in params for future use when we want to pre-select a datasource
  // For now, each table starts with sample data and users can select datasources via the UI
  
  // Use sample data as default
  // Each DataTable instance will maintain its own configuration including datasource selection
  const [defaultData] = React.useState(() => generateFixedIncomeData(10000));
  const [defaultColumns] = React.useState(() => inferColumnDefinitions(defaultData));

  return (
    <div className="h-full w-full">
      <DataTable 
        columnDefs={defaultColumns} 
        dataRow={defaultData} 
        instanceId={tableId}
      />
    </div>
  );
};

// Panel component for empty state
const EmptyPanel: React.FC<IDockviewPanelProps> = () => {
  return (
    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <p className="text-lg font-medium">No content</p>
        <p className="text-sm">Open a table from the sidebar to get started</p>
      </div>
    </div>
  );
};

// Register panel components
const panels = {
  dataTable: DataTablePanel,
  empty: EmptyPanel,
};

interface DockviewContainerProps {
  className?: string;
}

export const DockviewContainer: React.FC<DockviewContainerProps> = ({ className }) => {
  const apiRef = useRef<DockviewApi>();
  const { getActiveWorkspace, saveLayout, activeWorkspaceId, setHasUnsavedChanges } = useWorkspaceStore();
  const activeWorkspace = getActiveWorkspace();
  const { theme } = useTheme();
  const previousWorkspaceRef = useRef<string | null>(null);
  
  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingPanel, setRenamingPanel] = useState<{ id: string; title: string } | null>(null);

  // Handle dockview ready
  const onReady = (event: DockviewReadyEvent) => {
    apiRef.current = event.api;

    // Restore layout if exists
    if (activeWorkspace?.layout?.panels) {
      try {
        event.api.fromJSON(activeWorkspace.layout as any);
      } catch (e) {
        console.error('Failed to restore layout:', e);
        // Add default panel if restore fails
        addDefaultPanel(event.api);
      }
    } else {
      // Add default panel
      addDefaultPanel(event.api);
    }

    // Track layout changes but don't auto-save
    // Layout will only be saved when user explicitly clicks save in WorkspaceSelector
    event.api.onDidLayoutChange(() => {
      // Mark workspace as having unsaved changes
      setHasUnsavedChanges(true);
    });

    // Add right-click handler for tabs
    setupTabContextMenu(event.api);
  };

  const addDefaultPanel = (api: DockviewApi) => {
    api.addPanel({
      id: 'default',
      component: 'dataTable',
      params: {
        tableId: 'default-table',
        title: 'Fixed Income Portfolio',
      },
      title: 'Fixed Income Portfolio',
    });
  };

  // Add new table panel
  const addTablePanel = (tableId: string, title: string) => {
    if (!apiRef.current) return;

    apiRef.current.addPanel({
      id: tableId,
      component: 'dataTable',
      params: { tableId, title },
      title,
    });
  };

  // Setup context menu for tabs
  const setupTabContextMenu = (api: DockviewApi) => {
    // Defer setup to ensure DOM is ready
    setTimeout(() => {
      // Add global handler for right-clicks
      const handleContextMenu = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        
        // Debug: log what was clicked with distinctive prefix
        console.log('🔴 TAB-RENAME: Right-clicked element:', target);
        console.log('🔴 TAB-RENAME: Classes:', target.className);
        console.log('🔴 TAB-RENAME: Parent classes:', target.parentElement?.className);
        
        // Check for dockview tab elements
        const tabElement = target.closest('.dv-default-tab') || 
                          (target.classList.contains('dv-default-tab-content') ? target.parentElement : null);
        
        if (tabElement) {
          console.log('🔴 TAB-RENAME: Found tab element:', tabElement);
          e.preventDefault();
          e.stopPropagation();
          
          // Get tab text content - might need to look at child elements
          const tabText = tabElement.textContent?.trim() || 
                         tabElement.querySelector('.dv-tab-content')?.textContent?.trim() || '';
          
          console.log('🔴 TAB-RENAME: Tab text:', tabText);
          
          // Find the panel by matching title
          const panels = api.panels || [];
          let foundPanel = null;
          
          for (const panel of panels) {
            if (panel.title === tabText) {
              foundPanel = panel;
              break;
            }
          }
          
          if (foundPanel) {
            console.log('🔴 TAB-RENAME: Found panel:', foundPanel);
            setRenamingPanel({
              id: foundPanel.id,
              title: foundPanel.title || ''
            });
            setRenameDialogOpen(true);
            return false; // Prevent default
          } else {
            console.log('🔴 TAB-RENAME: No matching panel found for tab text:', tabText);
            console.log('🔴 TAB-RENAME: Available panels:', panels.map(p => ({ id: p.id, title: p.title })));
          }
        }
      };
      
      // Add listener to document to catch all right-clicks
      document.addEventListener('contextmenu', handleContextMenu, true);
      
      // Store cleanup function
      (api as any).__contextMenuCleanup = () => {
        document.removeEventListener('contextmenu', handleContextMenu, true);
      };
    }, 1000); // Increase delay further
  };


  // Handle rename submit
  const handleRename = (_id: string, newTitle: string) => {
    if (!apiRef.current || !renamingPanel) return;
    
    const panel = apiRef.current.getPanel(renamingPanel.id);
    if (panel) {
      panel.setTitle(newTitle);
    }
    
    setRenamingPanel(null);
  };

  // Expose API for external use
  useEffect(() => {
    (window as any).dockviewApi = {
      addTablePanel,
      api: apiRef.current,
    };
    (window as any).__dockviewApi = apiRef.current;
  }, []);

  // Handle workspace switching
  useEffect(() => {
    if (!apiRef.current || !activeWorkspaceId) return;
    
    // Check if workspace actually changed
    if (previousWorkspaceRef.current === activeWorkspaceId) return;
    
    previousWorkspaceRef.current = activeWorkspaceId;
    
    // Clear current layout
    const panels = apiRef.current.panels;
    panels.forEach(panel => {
      apiRef.current.removePanel(panel);
    });
    
    // Load new workspace layout
    if (activeWorkspace?.layout?.panels) {
      try {
        apiRef.current.fromJSON(activeWorkspace.layout as any);
        // Clear unsaved changes flag after loading a workspace
        setHasUnsavedChanges(false);
      } catch (e) {
        console.error('Failed to restore workspace layout:', e);
        // Add default panel if restore fails
        addDefaultPanel(apiRef.current);
        setHasUnsavedChanges(false);
      }
    } else {
      // Add default panel for new workspace
      addDefaultPanel(apiRef.current);
      setHasUnsavedChanges(false);
    }
  }, [activeWorkspaceId, activeWorkspace]);

  return (
    <div className={className}>
      <DockviewReact
        components={panels}
        onReady={onReady}
        theme={theme === 'dark' ? themeDark : themeLight}
      />
      
      {/* Rename Dialog */}
      {renamingPanel && (
        <TableDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          mode="rename"
          initialId={renamingPanel.id}
          initialTitle={renamingPanel.title}
          onSubmit={handleRename}
        />
      )}
    </div>
  );
};