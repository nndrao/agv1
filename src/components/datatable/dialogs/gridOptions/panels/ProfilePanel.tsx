import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Save, 
  X,
  Copy,
  Check,
  Edit2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { GridOptionsProfile } from '../types';
import { useToast } from '@/hooks/use-toast';

interface ProfilePanelProps {
  profiles: GridOptionsProfile[];
  activeProfileId: string | null;
  onApply: (id: string) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => string | null;
  onImport: (data: string) => boolean;
  onClose: () => void;
  onCreate?: (name: string, description?: string) => void;
  onRename?: (id: string, name: string) => void;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({
  profiles,
  activeProfileId,
  onApply,
  onSave,
  onDelete,
  onExport,
  onImport,
  onClose,
  onCreate,
  onRename
}) => {
  const { toast } = useToast();
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDescription, setNewProfileDescription] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    
    if (onCreate) {
      onCreate(newProfileName.trim(), newProfileDescription.trim());
      toast({
        title: "Profile created",
        description: `"${newProfileName}" has been created successfully.`,
      });
    }
    
    setShowNewProfile(false);
    setNewProfileName('');
    setNewProfileDescription('');
  };

  const handleExport = (profile: GridOptionsProfile) => {
    const data = onExport(profile.id);
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profile.name.replace(/\s+/g, '-')}-grid-options.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Profile exported",
        description: `"${profile.name}" has been exported successfully.`,
      });
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (onImport(content)) {
            toast({
              title: "Profile imported",
              description: "Profile has been imported successfully.",
            });
          } else {
            toast({
              title: "Import failed",
              description: "Failed to import profile. Please check the file format.",
              variant: "destructive"
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="profile-panel-overlay" onClick={onClose}>
      <div className="profile-panel" onClick={(e) => e.stopPropagation()}>
        <div className="profile-panel-header">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-lg font-semibold">Configuration Profiles</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="profile-panel-content">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewProfile(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </div>

          {showNewProfile && (
            <div className="mb-4 p-4 bg-muted/50 rounded-lg space-y-3">
              <Input
                placeholder="Profile name..."
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
              />
              <Textarea
                placeholder="Description (optional)..."
                value={newProfileDescription}
                onChange={(e) => setNewProfileDescription(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateProfile}
                  disabled={!newProfileName.trim()}
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowNewProfile(false);
                    setNewProfileName('');
                    setNewProfileDescription('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {profiles.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No profiles yet. Create one to save your configuration.
                </p>
              ) : (
                profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`profile-item ${activeProfileId === profile.id ? 'active' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {editingId === profile.id ? (
                          <div className="flex items-center gap-2 mb-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => {
                                if (onRename && editName.trim()) {
                                  onRename(profile.id, editName.trim());
                                  toast({
                                    title: "Profile renamed",
                                    description: `Profile has been renamed to "${editName}".`,
                                  });
                                }
                                setEditingId(null);
                              }}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{profile.name}</h4>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => {
                                setEditingId(profile.id);
                                setEditName(profile.name);
                              }}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        {profile.description && (
                          <p className="text-sm text-muted-foreground">{profile.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {Object.keys(profile.options).length} customized options
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => onApply(profile.id)}
                          title="Apply profile"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => onSave(profile.id)}
                          title="Update profile with current options"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleExport(profile)}
                          title="Export profile"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setDeleteConfirmId(profile.id)}
                          title="Delete profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Profile</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this profile? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteConfirmId) {
                    onDelete(deleteConfirmId);
                    setDeleteConfirmId(null);
                    toast({
                      title: "Profile deleted",
                      description: "Profile has been deleted successfully.",
                    });
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};