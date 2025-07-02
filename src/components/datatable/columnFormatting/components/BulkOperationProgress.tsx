import React from 'react';
import { useOperationProgressStore } from '../store/domains/operationProgress.store';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const BulkOperationProgress: React.FC<{ className?: string }> = ({ className }) => {
  const { operations, clearCompleted } = useOperationProgressStore();
  
  const activeOperations = Array.from(operations.values()).filter(
    op => op.status === 'in-progress' || op.status === 'failed'
  );

  if (activeOperations.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {activeOperations.map((operation) => (
        <OperationProgressItem key={operation.id} operation={operation} />
      ))}
      {Array.from(operations.values()).some(op => op.status === 'completed') && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCompleted}
          className="text-xs"
        >
          Clear completed
        </Button>
      )}
    </div>
  );
};

const OperationProgressItem: React.FC<{ operation: any }> = ({ operation }) => {
  const progress = (operation.current / operation.total) * 100;
  const isError = operation.status === 'failed';

  return (
    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">
            {operation.message}
          </p>
          {isError && (
            <AlertCircle className="h-3 w-3 text-destructive" />
          )}
        </div>
        {!isError && (
          <>
            <Progress value={progress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">
              {operation.current} / {operation.total}
            </p>
          </>
        )}
        {isError && (
          <p className="text-[10px] text-destructive">
            {operation.error}
          </p>
        )}
      </div>
    </div>
  );
};

// Inline progress for smaller operations
export const InlineOperationProgress: React.FC<{ 
  operationId: string;
  className?: string;
}> = ({ operationId, className }) => {
  const operation = useOperationProgressStore(state => 
    state.operations.get(operationId)
  );

  if (!operation || operation.status !== 'in-progress') return null;

  const progress = (operation.current / operation.total) * 100;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Progress value={progress} className="w-24 h-1.5" />
      <span className="text-[10px] text-muted-foreground">
        {Math.round(progress)}%
      </span>
    </div>
  );
};