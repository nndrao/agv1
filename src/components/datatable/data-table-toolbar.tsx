import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

const monospaceFonts = [
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  { value: 'Fira Code', label: 'Fira Code' },
  { value: 'Source Code Pro', label: 'Source Code Pro' },
  { value: 'IBM Plex Mono', label: 'IBM Plex Mono' },
  { value: 'Roboto Mono', label: 'Roboto Mono' },
  { value: 'Monaco', label: 'Monaco' },
  { value: 'Consolas', label: 'Consolas' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'monospace', label: 'System Monospace' },
];

interface DataTableToolbarProps {
  onFontChange: (font: string) => void;
  onSpacingChange: (spacing: string) => void;
  onOpenColumnSettings?: () => void;
}

export function DataTableToolbar({ onFontChange, onOpenColumnSettings }: DataTableToolbarProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-muted/40">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="font-select" className="text-sm font-medium">
            Font:
          </label>
          <Select onValueChange={onFontChange} defaultValue="monospace">
            <SelectTrigger id="font-select" className="w-[180px] h-8">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {monospaceFonts.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {onOpenColumnSettings && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenColumnSettings}
            className="h-8"
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Customize Columns
          </Button>
        )}
      </div>
    </div>
  );
}