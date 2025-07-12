import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  FolderOpen, 
  Table, 
  FileText, 
  LayoutDashboard, 
  BarChart3,
  Check,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useWorkspaceStore, PanelInfo } from "@/components/container/stores/workspace.store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PanelHistorySelectorProps {
  onReopenPanel: (panel: PanelInfo) => void;
  onFocusPanel?: (panelId: string) => void;
}

const panelIcons = {
  dataTable: Table,
  report: FileText,
  dashboard: LayoutDashboard,
  chart: BarChart3,
};

const panelTypeLabels = {
  dataTable: 'Tables',
  report: 'Reports',
  dashboard: 'Dashboards',
  chart: 'Charts',
};

export const PanelHistorySelector: React.FC<PanelHistorySelectorProps> = ({
  onReopenPanel,
  onFocusPanel,
}) => {
  const { getAllPanels, getClosedPanels } = useWorkspaceStore();
  const allPanels = getAllPanels();
  const closedPanels = getClosedPanels();

  // Group panels by type
  const groupedPanels = allPanels.reduce((acc, panel) => {
    if (!acc[panel.type]) {
      acc[panel.type] = [];
    }
    acc[panel.type].push(panel);
    return acc;
  }, {} as Record<string, PanelInfo[]>);

  const handlePanelClick = (panel: PanelInfo) => {
    if (panel.isOpen && onFocusPanel) {
      onFocusPanel(panel.id);
    } else if (!panel.isOpen) {
      onReopenPanel(panel);
    }
  };

  // Always show the button, even if no panels exist yet

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          Open Panel
          {closedPanels.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {closedPanels.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 max-h-96 overflow-y-auto">
        {allPanels.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No panels created yet
          </div>
        ) : (
          Object.entries(groupedPanels).map(([type, panels]) => {
            const Icon = panelIcons[type as keyof typeof panelIcons];
            const hasClosedPanels = panels.some(p => !p.isOpen);
            
            return (
              <DropdownMenuGroup key={type}>
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Icon className="h-3 w-3" />
                  {panelTypeLabels[type as keyof typeof panelTypeLabels]}
                </DropdownMenuLabel>
                {panels.map((panel) => (
                  <DropdownMenuItem
                    key={panel.id}
                    onClick={() => handlePanelClick(panel)}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      panel.isOpen && "opacity-60"
                    )}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      {panel.isOpen ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      )}
                    </div>
                    <span className="flex-1 truncate">{panel.title}</span>
                    {!panel.isOpen && (
                      <span className="text-xs text-muted-foreground">Click to open</span>
                    )}
                  </DropdownMenuItem>
                ))}
                {type !== Object.keys(groupedPanels)[Object.keys(groupedPanels).length - 1] && (
                  <DropdownMenuSeparator />
                )}
              </DropdownMenuGroup>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};