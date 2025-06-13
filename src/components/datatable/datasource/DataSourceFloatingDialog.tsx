import { FloatingDialog } from '../floatingDialog/FloatingDialog';
import './datasource-floating-dialog.css';

interface DataSourceFloatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (dataSources: any[]) => void;
}

export function DataSourceFloatingDialog({
  open,
  onOpenChange,
  onApply: _onApply
}: DataSourceFloatingDialogProps) {
  return (
    <FloatingDialog
      title="Data Source Configuration"
      isOpen={open}
      onClose={() => onOpenChange(false)}
      initialSize={{ width: 900, height: 700 }}
      minWidth={600}
      minHeight={400}
      maxWidth={1200}
      maxHeight={900}
      resizable={true}
      maximizable={true}
      className="datasource-floating-dialog"
      contentClassName="p-0"
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Data Source Configuration</h2>
        <p className="mb-4">Data source configuration is coming soon!</p>
        <div className="flex justify-end">
          <button 
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    </FloatingDialog>
  );
}