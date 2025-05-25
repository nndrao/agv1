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
  onColumnSettingsClick?: () => void;
}

export function DataTableToolbar({ onFontChange, onColumnSettingsClick }: DataTableToolbarProps) {
  return (
    <div className="h-[60px] flex items-center justify-between px-4 border-b bg-muted/40 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Select onValueChange={onFontChange} defaultValue="monospace">
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            {monospaceFonts.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onColumnSettingsClick}
          className="h-9"
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Column Settings
        </Button>
      </div>
    </div>
  );
}