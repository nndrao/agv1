import { FloatingDialog } from '../floatingDialog/FloatingDialog';
import { DataSourceDialog } from './DataSourceDialog';
import './datasource-floating-dialog.css';

interface DataSourceFloatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (dataSources: any[]) => void;
}

export function DataSourceFloatingDialog({
  open,
  onOpenChange,
  onApply
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
      <DataSourceDialog
        open={true} // Always true when FloatingDialog is open
        onOpenChange={onOpenChange}
        onApply={onApply}
        isFloating={true} // Add this prop to remove dialog wrapper
      />
    </FloatingDialog>
  );
}