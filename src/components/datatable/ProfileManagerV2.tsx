/**
 * ProfileManager using the new unified config architecture
 * This component provides profile management UI using the new system
 * while maintaining compatibility with the existing profile store
 */

import React, { useCallback, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Save, 
  Upload, 
  Download, 
  Copy, 
  Trash2, 
  MoreVertical,
  History,
  Share2,
  Star,
  StarOff
} from 'lucide-react';
import { useUnifiedConfig } from './hooks/useUnifiedConfig';
import { useProfileStore } from './stores/profile.store';
import { ComponentConfig } from '@/services/config/UnifiedConfigStore';

interface ProfileManagerV2Props {
  instanceId: string;
  className?: string;
  variant?: 'inline' | 'minimal' | 'full';
  onConfigChange?: (config: ComponentConfig) => void;
}

export const ProfileManagerV2: React.FC<ProfileManagerV2Props> = ({
  instanceId,
  className,
  variant = 'inline',
  onConfigChange
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDescription, setNewVersionDescription] = useState('');
  
  // Use unified config
  const {
    config,
    loading,
    createVersion,
    activateVersion,
    updateConfig,
    profileToConfig,
    // configToProfile
  } = useUnifiedConfig({
    instanceId,
    autoLoad: true
  });
  
  // Also use existing profile store for compatibility
  const { 
    profiles, 
    // activeProfileId, 
    // setActiveProfile,
    // saveCurrentState 
  } = useProfileStore();

  // Get versions from config
  const versions = config ? Object.values(config.settings.versions).sort(
    (a, b) => b.versionNumber - a.versionNumber
  ) : [];
  
  // const activeVersion = config ? config.settings.versions[config.settings.activeVersionId] : null;

  // Handle version creation
  const handleCreateVersion = useCallback(async () => {
    if (!newVersionName.trim()) return;
    
    const newVersion = await createVersion(newVersionName, newVersionDescription);
    if (newVersion) {
      setShowCreateDialog(false);
      setNewVersionName('');
      setNewVersionDescription('');
      onConfigChange?.(config!);
    }
  }, [newVersionName, newVersionDescription, createVersion, config, onConfigChange]);

  // Handle version activation
  const handleActivateVersion = useCallback(async (versionId: string) => {
    await activateVersion(versionId);
    onConfigChange?.(config!);
  }, [activateVersion, config, onConfigChange]);

  // Handle import from existing profile
  // const handleImportProfile = useCallback(async (profileId: string) => {
  //   const profile = profiles.find(p => p.id === profileId);
  //   if (!profile || !config) return;
  //   
  //   const configUpdate = profileToConfig(profile);
  //   await updateConfig(configUpdate);
  //   onConfigChange?.(config);
  // }, [profiles, config, profileToConfig, updateConfig, onConfigChange]);

  // Handle export to file
  const handleExportConfig = useCallback(() => {
    if (!config) return;
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${instanceId}-config-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [config, instanceId]);

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(async () => {
    if (!config) return;
    
    await updateConfig({
      metadata: {
        ...config.metadata,
        favorited: !config.metadata.favorited
      }
    });
    onConfigChange?.(config);
  }, [config, updateConfig, onConfigChange]);

  // Handle version deletion
  const handleDeleteVersion = useCallback(async (versionId: string) => {
    if (!config || Object.keys(config.settings.versions).length <= 1) return;
    
    // Cannot delete active version
    if (versionId === config.settings.activeVersionId) {
      alert('Cannot delete the active version. Please activate another version first.');
      return;
    }
    
    const updatedVersions = { ...config.settings.versions };
    delete updatedVersions[versionId];
    
    await updateConfig({
      settings: {
        ...config.settings,
        versions: updatedVersions
      }
    });
    onConfigChange?.(config);
  }, [config, updateConfig, onConfigChange]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading profiles...</div>;
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Select 
          value={config?.settings.activeVersionId} 
          onValueChange={handleActivateVersion}
        >
          <SelectTrigger className="w-[200px] h-8">
            <SelectValue placeholder="Select version" />
          </SelectTrigger>
          <SelectContent>
            {versions.map(version => (
              <SelectItem key={version.versionId} value={version.versionId}>
                <span>{version.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <Select 
          value={config?.settings.activeVersionId} 
          onValueChange={handleActivateVersion}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select version" />
          </SelectTrigger>
          <SelectContent>
            {versions.map(version => (
              <SelectItem key={version.versionId} value={version.versionId}>
                <div className="flex items-center justify-between w-full">
                  <span>{version.name}</span>
                  <Badge variant="secondary" className="ml-2">
                    v{version.versionNumber}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowCreateDialog(true)}
          title="Save as new version"
        >
          <Save className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowManageDialog(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Versions
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleFavorite}>
              {config?.metadata.favorited ? (
                <>
                  <StarOff className="mr-2 h-4 w-4" />
                  Remove from Favorites
                </>
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  Add to Favorites
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportConfig}>
              <Download className="mr-2 h-4 w-4" />
              Export Configuration
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Upload className="mr-2 h-4 w-4" />
              Import Configuration
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Share2 className="mr-2 h-4 w-4" />
              Share Configuration
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {variant === 'full' && (
          <div className="ml-auto text-sm text-muted-foreground">
            Instance: {instanceId}
          </div>
        )}
      </div>

      {/* Create Version Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>
              Save the current configuration as a new version
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="version-name">Version Name</Label>
              <Input
                id="version-name"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                placeholder="e.g., Q4 Analysis View"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="version-description">Description (optional)</Label>
              <Textarea
                id="version-description"
                value={newVersionDescription}
                onChange={(e) => setNewVersionDescription(e.target.value)}
                placeholder="Describe what's special about this version..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateVersion} disabled={!newVersionName.trim()}>
              Create Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Versions Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Versions</DialogTitle>
            <DialogDescription>
              View and manage all configuration versions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {versions.map(version => (
              <div
                key={version.versionId}
                className={`p-3 rounded-lg border ${
                  version.versionId === config?.settings.activeVersionId
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{version.name}</h4>
                      <Badge variant="outline">v{version.versionNumber}</Badge>
                      {version.versionId === config?.settings.activeVersionId && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                    {version.description && (
                      <p className="text-sm text-muted-foreground">
                        {version.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(version.createdAt).toLocaleDateString()} by {version.createdBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleActivateVersion(version.versionId)}
                      disabled={version.versionId === config?.settings.activeVersionId}
                    >
                      Activate
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <History className="mr-2 h-4 w-4" />
                          View History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteVersion(version.versionId)}
                          disabled={
                            version.versionId === config?.settings.activeVersionId ||
                            versions.length <= 1
                          }
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManageDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};