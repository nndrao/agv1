import React, { useRef, useState } from 'react';
import {
  Home,
  Table,
  Settings,
  FileText,
  Database,
  BarChart,
  Layout,
  Folder,
  Plus,
  ChevronDown,
  ChevronRight,
  Download,
  Upload,
  BarChart3,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/datatable/ThemeToggle';
import { SettingsExportService } from '@/services/settings/SettingsExportService';
import { ImportExportDialog } from '@/components/settings/ImportExportDialog';
import { PanelDialog, PanelType } from './PanelDialog';
import { useToast } from '@/hooks/use-toast';
import { WorkspaceSelector } from './WorkspaceSelector';
import { PanelHistorySelector } from './PanelHistorySelector';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  items?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'data',
    label: 'Data',
    icon: Database,
    items: [
      {
        id: 'sources',
        label: 'Data Sources',
        icon: Database,
        href: '/sources',
      },
    ],
  },
];

interface AppSidebarProps {
  collapsed: boolean;
  onItemClick?: () => void;
  onDatasourceClick?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, onItemClick, onDatasourceClick }) => {
  const [openSections, setOpenSections] = React.useState<string[]>(['data']);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | undefined>();
  
  // Panel creation state
  const [panelDialogOpen, setPanelDialogOpen] = useState(false);
  const [selectedPanelType, setSelectedPanelType] = useState<PanelType>('dataTable');

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleExportSettings = async () => {
    try {
      const settings = await SettingsExportService.exportAllSettings();
      SettingsExportService.downloadSettings(settings);
      toast({
        title: "Settings exported",
        description: "All application settings have been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export settings. Please try again.",
        variant: "destructive",
      });
      console.error('Export error:', error);
    }
  };

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportDialogOpen(true);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportComplete = () => {
    toast({
      title: "Settings imported",
      description: "Application settings have been imported successfully. Please refresh the page to apply changes.",
    });
    setImportFile(undefined);
  };

  const handleCreatePanel = (panelType: PanelType) => {
    setSelectedPanelType(panelType);
    setPanelDialogOpen(true);
  };

  const handlePanelSubmit = (id: string, title: string, type: PanelType, additionalParams?: any) => {
    // Create the panel
    if ((window as any).dockviewApi?.addPanel) {
      (window as any).dockviewApi.addPanel(id, title, type, additionalParams);
    }

    // Close mobile sidebar if open
    if (onItemClick) {
      onItemClick();
    }

    const panelTypeName = type === 'dataTable' ? 'Table' : 
                         type === 'report' ? 'Report' :
                         type === 'dashboard' ? 'Dashboard' : 'Chart';
    
    toast({
      title: `${panelTypeName} Created`,
      description: `${panelTypeName} "${title}" has been created successfully.`,
    });
  };

  const handleReopenPanel = (panel: any) => {
    if ((window as any).dockviewApi?.reopenPanel) {
      (window as any).dockviewApi.reopenPanel(panel);
    }
    
    // Close mobile sidebar if open
    if (onItemClick) {
      onItemClick();
    }
    
    toast({
      title: 'Panel Reopened',
      description: `"${panel.title}" has been reopened.`,
    });
  };
  
  const handleFocusPanel = (panelId: string) => {
    if ((window as any).dockviewApi?.focusPanel) {
      (window as any).dockviewApi.focusPanel(panelId);
    }
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.items && item.items.length > 0;
    const isOpen = openSections.includes(item.id);

    if (hasChildren && !collapsed) {
      return (
        <Collapsible key={item.id} open={isOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 px-3",
                level > 0 && "ml-4"
              )}
              onClick={() => toggleSection(item.id)}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-2">
              {item.items?.map((child) => renderSidebarItem(child, level + 1))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Button
        key={item.id}
        variant="ghost"
        className={cn(
          "w-full justify-start gap-2 px-3",
          level > 0 && "ml-4"
        )}
        onClick={() => {
          // Special handling for Data Sources
          if (item.id === 'sources' && onDatasourceClick) {
            onDatasourceClick();
          } else if (onItemClick) {
            onItemClick();
          }
        }}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
      </Button>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Workspace Selector */}
      <WorkspaceSelector />
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Quick Actions */}
          {!collapsed && (
            <div className="mb-4 space-y-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="default" 
                    className="w-full justify-start gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Panel
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => handleCreatePanel('dataTable')}>
                    <Table className="h-4 w-4 mr-2" />
                    Data Table
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreatePanel('report')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreatePanel('dashboard')}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreatePanel('chart')}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Chart
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <PanelHistorySelector 
                onReopenPanel={handleReopenPanel}
                onFocusPanel={handleFocusPanel}
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 justify-start gap-2"
                  onClick={handleExportSettings}
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 justify-start gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportSettings}
                className="hidden"
              />
            </div>
          )}

          {/* Navigation Items */}
          {sidebarItems.map((item) => renderSidebarItem(item))}
        </div>
      </ScrollArea>

      {/* Bottom Section */}
      {!collapsed && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      )}
      
      {/* Import Dialog */}
      <ImportExportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        mode="import"
        importFile={importFile}
        onImportComplete={handleImportComplete}
      />
      
      {/* Panel Creation Dialog */}
      <PanelDialog
        open={panelDialogOpen}
        onOpenChange={setPanelDialogOpen}
        mode="create"
        panelType={selectedPanelType}
        onSubmit={handlePanelSubmit}
      />
    </div>
  );
};