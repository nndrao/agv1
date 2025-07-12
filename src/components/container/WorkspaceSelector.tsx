import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Layers, Save, Plus, Copy, Trash2, Edit2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useWorkspaceStore } from "@/components/container/stores/workspace.store";
import { useToast } from "@/hooks/use-toast";
import { WorkspaceDialog } from "./WorkspaceDialog";

export function WorkspaceSelector() {
  const { toast } = useToast();
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    saveLayout,
    getActiveWorkspace,
    hasUnsavedChanges,
    setHasUnsavedChanges
  } = useWorkspaceStore();

  const activeWorkspace = getActiveWorkspace();

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [dialogData, setDialogData] = useState({ name: '', description: '' });

  const handleWorkspaceChange = (workspaceId: string) => {
    // Warn about unsaved changes
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Do you want to switch workspaces without saving?')) {
        return;
      }
    }

    try {
      setActiveWorkspace(workspaceId);
      setHasUnsavedChanges(false); // Reset unsaved changes when switching
      
      // The DockviewContainer will automatically respond to the workspace change
      // via its useEffect that watches activeWorkspace
      
      toast({
        title: 'Workspace switched',
        description: `Switched to "${workspaces.find(w => w.id === workspaceId)?.name}"`,
      });
    } catch (error) {
      console.error('[WorkspaceSelector] Error switching workspace:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch workspace',
        variant: 'destructive',
      });
    }
  };

  const handleSaveWorkspace = () => {
    if (!activeWorkspace) return;

    try {
      // Get current layout from dockview API and save it
      const api = (window as any).__dockviewApi;
      if (api) {
        const layout = api.toJSON();
        saveLayout(layout);
      }

      toast({
        title: 'Workspace saved',
        description: `Current layout saved to "${activeWorkspace.name}"`,
      });
    } catch (error) {
      console.error('[WorkspaceSelector] Error saving workspace:', error);
      toast({
        title: 'Error',
        description: 'Failed to save workspace',
        variant: 'destructive',
      });
    }
  };

  const handleCreateWorkspace = (name: string, description?: string) => {
    try {
      const newWorkspace = createWorkspace(name, description);
      setActiveWorkspace(newWorkspace.id);
      
      toast({
        title: 'Workspace created',
        description: `Created and switched to "${name}"`,
      });
    } catch (error) {
      console.error('[WorkspaceSelector] Error creating workspace:', error);
      toast({
        title: 'Error',
        description: 'Failed to create workspace',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateWorkspace = (name: string, description?: string) => {
    if (!activeWorkspace) return;

    try {
      const newWorkspace = createWorkspace(name, description);
      
      // Copy the current workspace's layout to the new one
      updateWorkspace(newWorkspace.id, {
        layout: activeWorkspace.layout,
        openViews: activeWorkspace.openViews
      });
      
      setActiveWorkspace(newWorkspace.id);
      
      toast({
        title: 'Workspace duplicated',
        description: `Created "${name}" from "${activeWorkspace.name}"`,
      });
    } catch (error) {
      console.error('[WorkspaceSelector] Error duplicating workspace:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate workspace',
        variant: 'destructive',
      });
    }
  };

  const handleRenameWorkspace = (name: string, description?: string) => {
    if (!activeWorkspace) return;

    try {
      updateWorkspace(activeWorkspace.id, { name, description });
      
      toast({
        title: 'Workspace renamed',
        description: `Renamed to "${name}"`,
      });
    } catch (error) {
      console.error('[WorkspaceSelector] Error renaming workspace:', error);
      toast({
        title: 'Error',
        description: 'Failed to rename workspace',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) return;

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${workspace.name}"?`)) {
      return;
    }

    try {
      deleteWorkspace(workspaceId);
      
      toast({
        title: 'Workspace deleted',
        description: `Deleted "${workspace.name}"`,
      });
    } catch (error) {
      console.error('[WorkspaceSelector] Error deleting workspace:', error);
      toast({
        title: 'Error',
        description: error instanceof Error && error.message.includes('Cannot delete default') 
          ? 'Cannot delete the default workspace'
          : 'Failed to delete workspace',
        variant: 'destructive',
      });
    }
  };

  const openCreateDialog = () => {
    setDialogData({ name: '', description: '' });
    setShowCreateDialog(true);
  };

  const openDuplicateDialog = () => {
    setDialogData({ 
      name: `Copy of ${activeWorkspace?.name || 'Workspace'}`, 
      description: activeWorkspace?.description || '' 
    });
    setShowDuplicateDialog(true);
  };

  const openRenameDialog = () => {
    setDialogData({ 
      name: activeWorkspace?.name || '', 
      description: activeWorkspace?.description || '' 
    });
    setShowRenameDialog(true);
  };

  return (
    <>
      <div className="px-3 py-2 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full justify-start gap-2 h-9"
            >
              <Layers className="h-4 w-4" />
              <span className="font-medium truncate flex-1 text-left">
                {activeWorkspace?.name || 'Workspace'}
                {hasUnsavedChanges && <span className="text-orange-500 ml-1">*</span>}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Workspace</DropdownMenuLabel>
            <div className="px-2 pb-2">
              <Select value={activeWorkspaceId} onValueChange={handleWorkspaceChange}>
                <SelectTrigger className="w-full h-8">
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{workspace.name}</span>
                        {workspace.id === 'default-workspace' && (
                          <span className="text-xs text-muted-foreground ml-2">(default)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="px-2 pb-2 grid grid-cols-2 gap-1">
              <Button
                size="sm"
                variant={hasUnsavedChanges ? "default" : "outline"}
                className="h-8 text-xs"
                onClick={handleSaveWorkspace}
                title={hasUnsavedChanges ? "Save unsaved changes" : "Save current layout"}
              >
                <Save className="h-3 w-3 mr-1" />
                Save{hasUnsavedChanges && " *"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={openCreateDialog}
                title="Create new workspace"
              >
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={openDuplicateDialog}
                disabled={!activeWorkspace}
                title="Duplicate current workspace"
              >
                <Copy className="h-3 w-3 mr-1" />
                Duplicate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={openRenameDialog}
                disabled={!activeWorkspace || activeWorkspace.id === 'default-workspace'}
                title="Rename workspace"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Rename
              </Button>
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => activeWorkspace && handleDeleteWorkspace(activeWorkspace.id)}
              disabled={!activeWorkspace || activeWorkspace.id === 'default-workspace'}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create Dialog */}
      <WorkspaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title="Create Workspace"
        description="Create a new workspace with a custom layout."
        initialData={dialogData}
        onConfirm={(data) => {
          handleCreateWorkspace(data.name, data.description);
          setShowCreateDialog(false);
        }}
      />

      {/* Duplicate Dialog */}
      <WorkspaceDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        title="Duplicate Workspace"
        description="Create a copy of the current workspace."
        initialData={dialogData}
        onConfirm={(data) => {
          handleDuplicateWorkspace(data.name, data.description);
          setShowDuplicateDialog(false);
        }}
      />

      {/* Rename Dialog */}
      <WorkspaceDialog
        open={showRenameDialog}
        onOpenChange={setShowRenameDialog}
        title="Rename Workspace"
        description="Change the name and description of the workspace."
        initialData={dialogData}
        onConfirm={(data) => {
          handleRenameWorkspace(data.name, data.description);
          setShowRenameDialog(false);
        }}
      />
    </>
  );
}