import React, { useState, useEffect } from 'react';
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

interface TableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'rename';
  initialId?: string;
  initialTitle?: string;
  onSubmit: (id: string, title: string) => void;
}

export const TableDialog: React.FC<TableDialogProps> = ({
  open,
  onOpenChange,
  mode,
  initialId = '',
  initialTitle = '',
  onSubmit,
}) => {
  const [tableId, setTableId] = useState(initialId);
  const [tableCaption, setTableCaption] = useState(initialTitle);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (mode === 'create') {
        // Generate default values for create mode
        const defaultTableId = `table-${Date.now()}`;
        const defaultCaption = `Table ${new Date().toLocaleTimeString()}`;
        setTableId(defaultTableId);
        setTableCaption(defaultCaption);
      } else {
        // Use provided values for rename mode
        setTableId(initialId);
        setTableCaption(initialTitle);
      }
    }
  }, [open, mode, initialId, initialTitle]);

  const handleSubmit = () => {
    if (mode === 'create' && (!tableId.trim() || !tableCaption.trim())) {
      return;
    }
    if (mode === 'rename' && !tableCaption.trim()) {
      return;
    }

    onSubmit(tableId.trim(), tableCaption.trim());
    
    // Close dialog and reset
    onOpenChange(false);
    setTableId('');
    setTableCaption('');
  };

  const handleCancel = () => {
    onOpenChange(false);
    setTableId('');
    setTableCaption('');
  };

  const isCreateMode = mode === 'create';
  const dialogTitle = isCreateMode ? 'Create New Table' : 'Rename Tab';
  const dialogDescription = isCreateMode 
    ? 'Configure the table ID and tab header caption for your new table.'
    : 'Enter a new caption for the tab.';
  const submitButtonText = isCreateMode ? 'Create Table' : 'Rename';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isCreateMode && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="table-id" className="text-right">
                Table ID
              </Label>
              <Input
                id="table-id"
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                className="col-span-3"
                placeholder="table-123456"
              />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="table-caption" className="text-right">
              Tab Caption
            </Label>
            <Input
              id="table-caption"
              value={tableCaption}
              onChange={(e) => setTableCaption(e.target.value)}
              className="col-span-3"
              placeholder="My Table"
              autoFocus={!isCreateMode}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isCreateMode
                ? !tableId.trim() || !tableCaption.trim()
                : !tableCaption.trim()
            }
          >
            {submitButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};