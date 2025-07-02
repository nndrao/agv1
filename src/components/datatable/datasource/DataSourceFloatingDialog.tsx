import { DatasourceList } from '@/components/datasource/DatasourceList';
import { DatasourceConfig } from '@/stores/datasource.store';

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
  const handleSelectDatasource = (datasource: DatasourceConfig) => {
    // When a datasource is selected, apply it
    onApply([datasource]);
  };

  return (
    <DatasourceList
      open={open}
      onOpenChange={onOpenChange}
      onSelectDatasource={handleSelectDatasource}
    />
  );
}