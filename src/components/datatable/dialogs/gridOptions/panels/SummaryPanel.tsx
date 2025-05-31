import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SummaryPanelProps {
  changedOptions: Record<string, any>;
  onClose: () => void;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  changedOptions,
  onClose
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const summary = JSON.stringify(changedOptions, null, 2);
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Copied to clipboard",
      description: "The modified options have been copied to your clipboard.",
    });
  };

  const formatValue = (value: any): string => {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const optionEntries = Object.entries(changedOptions);

  return (
    <div className="summary-panel-overlay" onClick={onClose}>
      <div className="summary-panel" onClick={(e) => e.stopPropagation()}>
        <div className="summary-panel-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Modified Options Summary</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="summary-panel-content">
          {optionEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No options have been modified from their default values.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {optionEntries.length} option{optionEntries.length === 1 ? ' has' : 's have'} been modified:
              </p>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {optionEntries.map(([key, value]) => (
                    <div key={key} className="summary-item">
                      <span className="summary-key">{key}:</span>
                      <span className="summary-value">{formatValue(value)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  These options will override the default AG-Grid configuration when applied.
                  Options not listed here will use their default values.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};