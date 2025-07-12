import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface WorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initialData?: {
    name: string;
    description?: string;
  };
  onConfirm: (data: { name: string; description?: string }) => void;
}

export function WorkspaceDialog({
  open,
  onOpenChange,
  title,
  description,
  initialData,
  onConfirm,
}: WorkspaceDialogProps) {
  const [name, setName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name || '');
      setWorkspaceDescription(initialData.description || '');
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onConfirm({
      name: name.trim(),
      description: workspaceDescription.trim() || undefined,
    });

    // Reset form
    setName('');
    setWorkspaceDescription('');
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset form
    setName('');
    setWorkspaceDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter workspace name"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={workspaceDescription}
                onChange={(e) => setWorkspaceDescription(e.target.value)}
                placeholder="Enter workspace description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {title.includes('Create') ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}