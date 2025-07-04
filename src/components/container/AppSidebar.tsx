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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ThemeToggle } from '@/components/datatable/ThemeToggle';
import { SettingsExportService } from '@/services/settings/SettingsExportService';
import { ImportExportDialog } from '@/components/settings/ImportExportDialog';
import { useToast } from '@/hooks/use-toast';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  items?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    href: '/',
  },
  {
    id: 'data',
    label: 'Data',
    icon: Database,
    items: [
      {
        id: 'tables',
        label: 'Tables',
        icon: Table,
        href: '/tables',
      },
      {
        id: 'sources',
        label: 'Data Sources',
        icon: Database,
        href: '/sources',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart,
    items: [
      {
        id: 'dashboards',
        label: 'Dashboards',
        icon: Layout,
        href: '/dashboards',
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: FileText,
        href: '/reports',
      },
    ],
  },
  {
    id: 'workspaces',
    label: 'Workspaces',
    icon: Folder,
    href: '/workspaces',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
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
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Quick Actions */}
          {!collapsed && (
            <div className="mb-4 space-y-2">
              <Button variant="default" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                New Table
              </Button>
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
    </div>
  );
};