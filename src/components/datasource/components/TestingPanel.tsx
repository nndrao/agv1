import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestingPanelProps {
  testing: boolean;
  testError: string;
  previewData: any[];
  websocketUrl: string;
  listenerTopic: string;
  onInferFields: () => void;
}

export const TestingPanel: React.FC<TestingPanelProps> = ({
  testing,
  testError,
  previewData,
  websocketUrl,
  listenerTopic,
  onInferFields,
}) => {
  return (
    <div className="space-y-4">
      {/* Infer Fields Button */}
      <div>
        <Button
          onClick={onInferFields}
          disabled={testing || !websocketUrl || !listenerTopic}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Inferring fields...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Infer Fields from Data
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Connects to the datasource and analyzes incoming messages to determine field structure
        </p>
      </div>

      {/* Error Display */}
      {testError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{testError}</AlertDescription>
        </Alert>
      )}

      {/* Preview Data */}
      {previewData.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Preview Data ({previewData.length} messages)</h4>
          <ScrollArea className="h-[300px] border rounded-md">
            <div className="p-4 space-y-2">
              {previewData.map((data, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-2 rounded-sm border bg-card",
                    "hover:bg-accent transition-colors"
                  )}
                >
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Status Messages */}
      {testing && previewData.length === 0 && !testError && (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Waiting for messages...
        </div>
      )}
    </div>
  );
};