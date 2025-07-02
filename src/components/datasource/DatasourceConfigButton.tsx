import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { DatasourceDialog } from './DatasourceDialog';

export function DatasourceConfigButton() {
  const [showDialog, setShowDialog] = useState(false);
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
      >
        <Settings className="h-4 w-4 mr-2" />
        Configure Datasources
      </Button>
      
      <DatasourceDialog 
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
}