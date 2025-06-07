import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  ChevronDown,
  X,
  Save,
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Palette,
  DollarSign,
  Percent,
  Hash,
  Calendar,
  Filter,
  Edit3,
  Eye,
  Star,
  Columns,
  Settings,
  Search,
  MoreHorizontal,
  Sparkles,
  ChevronRight,
  Plus,
  Check,
  ChevronsUpDown,
  ListFilter,
  FileText,
  PaintBucket,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const FloatingRibbonUI: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('format');
  const [selectedColumns, setSelectedColumns] = React.useState(['Sales Amount', 'Quantity']);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from the header area
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('[role="combobox"]')) {
      return;
    }
    
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 1000);
      const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 200);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, position]);
  
  return (
    <Card 
      ref={dragRef}
      className={cn(
        "fixed shadow-2xl border-2 bg-background/95 backdrop-blur-sm transition-shadow",
        isDragging && "shadow-xl opacity-95"
      )}
      style={{ 
        width: '1000px', 
        maxWidth: '90vw',
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}>
      {/* Row 1: Header */}
      <div 
        className={cn(
          "flex items-center justify-between px-4 py-2 bg-muted/30 border-b",
          "cursor-grab active:cursor-grabbing select-none"
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-4">
          {/* Column Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Columns className="h-4 w-4" />
                <span className="font-medium">
                  {selectedColumns.length === 1 
                    ? selectedColumns[0] 
                    : `${selectedColumns[0]} +${selectedColumns.length - 1} more`}
                </span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Search className="h-3 w-3" />
                Select Columns
              </DropdownMenuLabel>
              <div className="px-2 pb-2">
                <Input placeholder="Search columns..." className="h-8" />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Select All
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>
                Sales Amount
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>
                Quantity
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>
                Unit Price
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>
                Customer Name
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>
                Order Date
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <div className="flex gap-2 px-2 py-2">
                <Button size="sm" className="flex-1">Apply</Button>
                <Button size="sm" variant="outline" className="flex-1">Cancel</Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Template Selector */}
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Template:</Label>
            <Select defaultValue="currency">
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <span>Currency (USD)</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="favorites" disabled>
                  <div className="flex items-center gap-2 font-medium">
                    <Star className="h-3 w-3" />
                    Favorites
                  </div>
                </SelectItem>
                <SelectItem value="currency">
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    Currency (USD)
                  </div>
                </SelectItem>
                <SelectItem value="percentage">
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    Percentage
                  </div>
                </SelectItem>
                <SelectItem value="status">
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3" />
                    Status Colors
                  </div>
                </SelectItem>
                <SelectItem value="financial" disabled>
                  <div className="flex items-center gap-2 font-medium">
                    <DollarSign className="h-3 w-3" />
                    Financial
                  </div>
                </SelectItem>
                <SelectItem value="accounting">Accounting</SelectItem>
                <SelectItem value="currency-eur">Currency (EUR)</SelectItem>
                <SelectItem value="statistical" disabled>
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles className="h-3 w-3" />
                    Statistical
                  </div>
                </SelectItem>
                <SelectItem value="scientific">Scientific Notation</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedColumns.length > 1 && (
              <div className="flex items-center gap-2 ml-2">
                <input type="checkbox" id="apply-all" className="h-4 w-4" />
                <Label htmlFor="apply-all" className="text-sm cursor-pointer">
                  Apply to all selected
                </Label>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-8 w-8" title="Save as Template">
            <Save className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" title="Clear Settings">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Clear All Settings</DropdownMenuItem>
              <DropdownMenuItem>Clear Format Only</DropdownMenuItem>
              <DropdownMenuItem>Clear Style Only</DropdownMenuItem>
              <DropdownMenuItem>Clear Filters</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Reset to Default</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Row 2: Section Tabs - Slimmer Design */}
      <div className="border-b bg-muted/10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-8 bg-transparent border-0 p-0">
            <TabsTrigger 
              value="general" 
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">General</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="styling" 
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <div className="flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Styling</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="format" 
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <div className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Format</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="filter" 
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Filter</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="editor" 
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <div className="flex items-center gap-1.5">
                <Edit3 className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Editor</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Preview</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Row 3: Dynamic Content */}
      <div className="p-3">
        {activeTab === 'format' && (
          <div className="flex items-center gap-6">
            {/* Quick Format Group */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Quick:</Label>
              <ToggleGroup type="single" size="sm">
                <ToggleGroupItem value="currency" aria-label="Currency">
                  <DollarSign className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="percent" aria-label="Percentage">
                  <Percent className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="thousands" aria-label="Thousands">
                  <span className="text-sm font-mono">,</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="date" aria-label="Date">
                  <Calendar className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            {/* Custom Format */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Custom:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[140px] justify-between font-mono text-xs">
                    #,##0.00
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">Number Formats</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <Toggle size="sm" variant="outline">1234.56</Toggle>
                        <Toggle size="sm" variant="outline">1,234.56</Toggle>
                        <Toggle size="sm" variant="outline">1.23K</Toggle>
                        <Toggle size="sm" variant="outline" pressed>$1,234.56</Toggle>
                        <Toggle size="sm" variant="outline">€1,234.56</Toggle>
                        <Toggle size="sm" variant="outline">£1,234.56</Toggle>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Negative Numbers</Label>
                      <div className="space-y-2 mt-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="radio" name="negative" />
                          -1234
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="radio" name="negative" />
                          (1234)
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="radio" name="negative" checked />
                          <span className="text-red-500">1234</span> (red only)
                        </label>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full">
                      Custom Pattern...
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            {/* Preview */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Preview:</Label>
              <Badge variant="secondary" className="font-mono">$1,234.56</Badge>
            </div>
            
            <div className="ml-auto">
              <Button variant="ghost" size="sm" className="text-xs">
                More options
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
        
        {activeTab === 'styling' && (
          <div className="flex items-center gap-6">
            {/* Text Style */}
            <div className="flex items-center gap-2">
              <ToggleGroup type="multiple" size="sm">
                <ToggleGroupItem value="bold" aria-label="Bold">
                  <Bold className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="Italic">
                  <Italic className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="underline" aria-label="Underline">
                  <Underline className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            {/* Alignment */}
            <div className="flex items-center gap-2">
              <ToggleGroup type="single" size="sm">
                <ToggleGroupItem value="left" aria-label="Align left">
                  <AlignLeft className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Align center">
                  <AlignCenter className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Align right">
                  <AlignRight className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="justify" aria-label="Justify">
                  <AlignJustify className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            {/* Colors */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Color:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[100px] gap-2">
                    <Type className="h-4 w-4" />
                    Auto
                    <ChevronDown className="h-3 w-3 ml-auto" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="grid grid-cols-8 gap-1">
                    {['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray'].map(color => (
                      <div
                        key={color}
                        className={cn(
                          "h-6 w-6 rounded cursor-pointer hover:scale-110 transition-transform",
                          `bg-${color}-500`
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Fill:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[100px] gap-2">
                    <PaintBucket className="h-4 w-4" />
                    None
                    <ChevronDown className="h-3 w-3 ml-auto" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="grid grid-cols-8 gap-1">
                    {['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray'].map(color => (
                      <div
                        key={color}
                        className={cn(
                          "h-6 w-6 rounded cursor-pointer hover:scale-110 transition-transform",
                          `bg-${color}-100`
                        )}
                        style={{ backgroundColor: `${color}20` }}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="ml-auto">
              <Button variant="ghost" size="sm" className="text-xs">
                More options
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
        
        {activeTab === 'filter' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <ListFilter className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Quick filter..." 
                className="h-8 max-w-xs"
              />
              <Select defaultValue="contains">
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="starts">Starts with</SelectItem>
                  <SelectItem value="ends">Ends with</SelectItem>
                  <SelectItem value="greater">Greater than</SelectItem>
                  <SelectItem value="less">Less than</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            <Button variant="outline" size="sm">
              Values
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
            
            <Button variant="outline" size="sm">
              Advanced
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
            
            <div className="ml-auto">
              <Button variant="ghost" size="sm" className="text-xs text-destructive">
                Clear Filter
              </Button>
            </div>
          </div>
        )}
        
        {activeTab === 'preview' && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground mb-2">Sample Data Preview</div>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">Original</th>
                    <th className="px-4 py-2 text-left font-medium">Formatted</th>
                    <th className="px-4 py-2 text-left font-medium">Changes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-2 font-mono">1234.567</td>
                    <td className="px-4 py-2 font-mono">$1,234.57</td>
                    <td className="px-4 py-2">
                      <Badge variant="secondary" className="text-xs">+Format</Badge>
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2 font-mono">-500</td>
                    <td className="px-4 py-2 font-mono text-red-500">500</td>
                    <td className="px-4 py-2">
                      <Badge variant="secondary" className="text-xs">Red, no minus</Badge>
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2 font-mono">0.45</td>
                    <td className="px-4 py-2 font-mono">45%</td>
                    <td className="px-4 py-2">
                      <Badge variant="secondary" className="text-xs">Percentage</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};