import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
}

export function DataTableToolbar({ onFontChange }: DataTableToolbarProps) {
  return (
    <div className="h-[60px] flex items-center px-4 border-b bg-muted/40 backdrop-blur-sm">
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
    </div>
  );
}