import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';

interface DataSourceDialogSimpleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataSourceDialogSimple({
  open,
  onOpenChange
}: DataSourceDialogSimpleProps) {
  console.log('[DataSourceDialogSimple] Rendering with open:', open);
  
  if (!open) return null;
  
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay 
          className="fixed inset-0 bg-black/50 z-[90]" 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 90 }}
        />
        <DialogPrimitive.Content 
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg z-[100]"
          style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 100,
            minWidth: '400px'
          }}
        >
          <h2 className="text-lg font-semibold mb-4">Data Source Configuration</h2>
          <p className="mb-4">Data source dialog is working!</p>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}