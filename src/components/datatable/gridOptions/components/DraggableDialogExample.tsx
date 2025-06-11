import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './DraggableDialog';

export function DraggableDialogExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Draggable Dialog</Button>
      </DialogTrigger>
      <DialogContent enableDrag={true}>
        <DialogHeader>
          <DialogTitle>Draggable Dialog</DialogTitle>
          <DialogDescription>
            Click and drag the header to move this dialog around the screen.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p>This is a draggable dialog component that wraps the shadcn/ui Dialog.</p>
          <p>Features:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Drag by clicking and holding the header</li>
            <li>Maintains all Dialog component functionality</li>
            <li>Boundary checking to keep dialog on screen</li>
            <li>Smooth transitions when not dragging</li>
            <li>Resets position when reopened</li>
          </ul>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Example with drag disabled
export function NonDraggableDialogExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Non-Draggable Dialog</Button>
      </DialogTrigger>
      <DialogContent enableDrag={false}>
        <DialogHeader>
          <DialogTitle>Standard Dialog</DialogTitle>
          <DialogDescription>
            This dialog has drag functionality disabled.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p>Set enableDrag=false to disable drag functionality.</p>
        </div>
        <DialogFooter>
          <Button type="submit">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}