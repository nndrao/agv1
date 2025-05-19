import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Filter, RefreshCw, Settings } from 'lucide-react';

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

const gridSpacings = [
  { value: '4', label: 'Compact' },
  { value: '6', label: 'Normal' },
  { value: '8', label: 'Large' },
];

interface DataTableToolbarProps {
  onFontChange: (font: string) => void;
  onSpacingChange: (spacing: string) => void;
}

export function DataTableToolbar({ onFontChange, onSpacingChange }: DataTableToolbarProps) {
  return (
    <div className="h-[60px] flex items-center justify-between gap-4 border-b bg-muted/40 backdrop-blur-sm px-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search records..."
          className="h-9 w-[250px] bg-background"
        />
        <Button variant="outline" size="sm" className="h-9">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
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
        <Select onValueChange={onSpacingChange} defaultValue="6">
          <SelectTrigger className="w-[120px] h-9">
            <SelectValue placeholder="Grid spacing" />
          </SelectTrigger>
          <SelectContent>
            {gridSpacings.map((spacing) => (
              <SelectItem key={spacing.value} value={spacing.value}>
                {spacing.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-9">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button variant="outline" size="sm" className="h-9">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" size="sm" className="h-9">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
}