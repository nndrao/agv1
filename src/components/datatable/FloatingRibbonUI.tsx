import React, { useState, useRef, useEffect, Fragment } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Type,
  Palette,
  DollarSign,
  Percent,
  Hash,
  Calendar,
  Filter,
  Edit3,
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
  Copy,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Square,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ArrowUpDown,
  ArrowLeftRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingRibbonUIProps {
  targetColumn?: string;
  initialPosition?: { x: number; y: number };
  onClose?: () => void;
}

export const FloatingRibbonUI: React.FC<FloatingRibbonUIProps> = ({ 
  targetColumn, 
  initialPosition,
  onClose 
}) => {
  const [activeTab, setActiveTab] = React.useState('styling');
  const [selectedColumns, setSelectedColumns] = React.useState(
    targetColumn ? [targetColumn] : ['Sales Amount', 'Quantity']
  );
  const [position, setPosition] = useState(initialPosition || { x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  
  // Track current styling selections for preview
  const [currentAlignment, setCurrentAlignment] = useState('left');
  const [currentVerticalAlignment, setCurrentVerticalAlignment] = useState('middle');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  
  // Track format tab state
  const [formatCategory, setFormatCategory] = useState('numbers');
  const [currentFormat, setCurrentFormat] = useState('#,##0.00');
  const [showConditionalDialog, setShowConditionalDialog] = useState(false);

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
    <>
      <Card 
        ref={dragRef}
        className={cn(
          "fixed shadow-2xl bg-background/95 backdrop-blur-sm transition-shadow border-muted/50",
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
                <Switch id="apply-all" className="h-4 w-8" />
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
          {onClose && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Row 2: Modern Tab Strip with Preview */}
      <div className="relative bg-gradient-to-r from-background via-muted/5 to-background">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-border/10" />
        <div className="flex items-center justify-between h-10 px-2">
          <div className="flex items-center">
            {[
              { value: 'general', icon: FileText, label: 'General' },
              { value: 'styling', icon: Palette, label: 'Styling' },
              { value: 'format', icon: Hash, label: 'Format' },
              { value: 'filter', icon: Filter, label: 'Filter' },
              { value: 'editor', icon: Edit3, label: 'Editor' },
            ].map((tab, index, array) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              const isLast = index === array.length - 1;
              return (
                <Fragment key={tab.value}>
                  <button
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      "relative flex items-center gap-2 px-4 h-8 rounded-md text-xs font-medium transition-all duration-200",
                      "hover:bg-accent/50",
                      isActive ? [
                        "bg-background text-foreground shadow-sm",
                        "before:absolute before:inset-x-0 before:-bottom-[1px] before:h-[2px]",
                        "before:bg-gradient-to-r before:from-transparent before:via-primary before:to-transparent"
                      ] : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn(
                      "h-3.5 w-3.5 transition-all duration-200",
                      isActive && "text-primary"
                    )} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-md -z-10" />
                    )}
                  </button>
                  {!isLast && (
                    <div className="h-5 w-px bg-border/50 mx-1" />
                  )}
                </Fragment>
              );
            })}
          </div>
          
          {/* Preview Section - Clean and integrated */}
          <div className="flex items-center gap-3 px-4 min-w-[320px]">
            <Separator orientation="vertical" className="h-6" />
            <span className="text-xs text-muted-foreground/70">Preview</span>
            <div className="flex-1 h-7 bg-gradient-to-r from-background to-muted/20 rounded-sm px-2">
              {activeTab === 'format' && (
                <div className="flex items-center gap-2 h-full">
                  <span className="font-mono text-xs text-muted-foreground">1234.5</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                  <span className="font-mono text-xs font-medium">$1,234.50</span>
                </div>
              )}
              {activeTab === 'styling' && (
                <div className="w-full h-full flex items-center">
                  <div 
                    className={cn(
                      "w-full",
                      currentAlignment === 'center' && "text-center",
                      currentAlignment === 'right' && "text-right",
                      currentAlignment === 'left' && "text-left"
                    )}
                  >
                    <span 
                      className={cn(
                        "text-xs",
                        isBold && "font-bold",
                        isItalic && "italic",
                        isUnderline && "underline"
                      )}
                    >
                      Sample Text
                    </span>
                  </div>
                </div>
              )}
              {activeTab === 'filter' && (
                <div className="flex items-center gap-2 h-full">
                  <ListFilter className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">Active Filter</span>
                </div>
              )}
              {activeTab === 'general' && (
                <div className="flex items-center gap-2 h-full">
                  <Columns className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium">{selectedColumns[0]}</span>
                </div>
              )}
              {activeTab === 'editor' && (
                <div className="flex items-center gap-2 h-full">
                  <Edit3 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">Text Input</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Row 3: Dynamic Content */}
      <div className="p-3">
        {activeTab === 'general' && (
          <div className="space-y-2">
            {/* Two-row compact layout */}
            <div className="grid grid-cols-12 gap-3">
              {/* Row 1: Identity and Size */}
              <div className="col-span-3 flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Header Name</Label>
                <Input 
                  placeholder={selectedColumns.length > 1 ? "~Mixed~" : "Column Name"} 
                  className="h-7 text-xs"
                  disabled={selectedColumns.length > 1}
                />
              </div>
              
              <div className="col-span-2 flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Width</Label>
                <div className="flex items-center gap-1">
                  <Input 
                    type="number" 
                    placeholder="Auto" 
                    className="h-7 text-xs"
                    min="50"
                    max="500"
                    step="10"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
              
              <div className="col-span-2 flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select defaultValue="text">
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="numeric">Numeric</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2 flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Pin</Label>
                <Select defaultValue="none">
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="flex items-center gap-1">
                        <Square className="h-3 w-3" />
                        None
                      </span>
                    </SelectItem>
                    <SelectItem value="left">
                      <span className="flex items-center gap-1">
                        <ArrowLeft className="h-3 w-3" />
                        Left
                      </span>
                    </SelectItem>
                    <SelectItem value="right">
                      <span className="flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" />
                        Right
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Column behaviors as compact toggle chips */}
              <div className="col-span-3 flex items-end gap-1">
                <ToggleGroup type="multiple" size="sm" className="flex-wrap">
                  <ToggleGroupItem value="sortable" className="h-7 px-2 text-xs" aria-label="Sortable">
                    <ArrowUpDown className="h-3 w-3 mr-1" />
                    Sort
                  </ToggleGroupItem>
                  <ToggleGroupItem value="resizable" className="h-7 px-2 text-xs" aria-label="Resizable">
                    <ArrowLeftRight className="h-3 w-3 mr-1" />
                    Resize
                  </ToggleGroupItem>
                  <ToggleGroupItem value="editable" className="h-7 px-2 text-xs" aria-label="Editable">
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            
            {/* Row 2: Quick toggles in a compact strip */}
            <div className="flex items-center gap-4 px-2 py-1 bg-muted/30 rounded-md">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Switch id="initially-hidden" className="h-4 w-7" />
                  <Label htmlFor="initially-hidden" className="text-xs cursor-pointer">
                    Initially Hidden
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch id="floating-filter" className="h-4 w-7" />
                  <Label htmlFor="floating-filter" className="text-xs cursor-pointer">
                    Floating Filter
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch id="enable-filter" className="h-4 w-7" />
                  <Label htmlFor="enable-filter" className="text-xs cursor-pointer">
                    Enable Filter
                  </Label>
                </div>
              </div>
              
              <Separator orientation="vertical" className="h-4" />
              
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <Settings className="h-3 w-3 mr-1" />
                Advanced
              </Button>
            </div>
          </div>
        )}
        
        {activeTab === 'format' && (
          <div className="space-y-2">
            {/* Row 1: Template Gallery with Categories */}
            <div className="flex items-start gap-3">
              {/* Category Selector */}
              <div className="flex flex-col gap-1">
                <ToggleGroup 
                  type="single" 
                  value={formatCategory}
                  onValueChange={setFormatCategory}
                  className="flex-col"
                >
                  <ToggleGroupItem value="numbers" className="h-6 w-full justify-start text-xs px-2">
                    <Hash className="h-3 w-3 mr-1" />
                    Numbers
                  </ToggleGroupItem>
                  <ToggleGroupItem value="currency" className="h-6 w-full justify-start text-xs px-2">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Currency
                  </ToggleGroupItem>
                  <ToggleGroupItem value="percent" className="h-6 w-full justify-start text-xs px-2">
                    <Percent className="h-3 w-3 mr-1" />
                    Percent
                  </ToggleGroupItem>
                  <ToggleGroupItem value="datetime" className="h-6 w-full justify-start text-xs px-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    Date/Time
                  </ToggleGroupItem>
                  <ToggleGroupItem value="text" className="h-6 w-full justify-start text-xs px-2">
                    <Type className="h-3 w-3 mr-1" />
                    Text
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              <Separator orientation="vertical" className="h-32" />
              
              {/* Template Grid - Dynamic based on category */}
              <div className="flex-1">
                <div className="grid grid-cols-3 gap-1.5">
                  {formatCategory === 'numbers' && (
                    <>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('#,##0.00')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">Number</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">1,234.56</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('#,##0')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">Integer</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">1,235</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('0.00')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">No Sep</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">1234.56</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('#,##0.0000')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">4 Dec</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">1.5600</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('[>999999]#.#,,"M";[>999]#.#,"K";#,##0')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">Short</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">1.2K</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-green-500/10 border-green-500/30" onClick={() => setCurrentFormat('[>0][Green]#,##0.00;[<0][Red]#,##0.00;#,##0.00')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">+/- Color</span>
                          <span className="text-xs font-mono">
                            <span className="text-green-600">123</span>/<span className="text-red-500">456</span>
                          </span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-blue-500/10 border-blue-500/30" onClick={() => setCurrentFormat('# ?/32')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">32nds</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">99-16</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-blue-500/10 border-blue-500/30" onClick={() => setCurrentFormat('# ?/64')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">64ths</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">99-32</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-blue-500/10 border-blue-500/30" onClick={() => setCurrentFormat('# ?/256')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">256ths</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">99-128</span>
                        </div>
                      </Button>
                    </>
                  )}
                  
                  {formatCategory === 'currency' && (
                    <>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('$#,##0.00')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">USD</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">$1,234.56</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('$#,##0.00;($#,##0.00)')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">Accounting</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">($1,234)</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-green-500/10 border-green-500/30" onClick={() => setCurrentFormat('[>0][Green]$#,##0.00;[<0][Red]$#,##0.00;$#,##0.00')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">+/- Color</span>
                          <span className="text-xs font-mono">
                            <span className="text-green-600">$123</span>/<span className="text-red-500">$456</span>
                          </span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('€#,##0.00')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">EUR</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">€1,234.56</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('£#,##0.00')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">GBP</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">£1,234.56</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('¥#,##0')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">JPY</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">¥1,235</span>
                        </div>
                      </Button>
                    </>
                  )}
                  
                  {formatCategory === 'percent' && (
                    <>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('0.00%')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">Percent</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">12.34%</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('0%')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">No Dec</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">12%</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-green-500/10 border-green-500/30" onClick={() => setCurrentFormat('[>0][Green]0.00%;[<0][Red]0.00%;0.00%')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">+/- Color</span>
                          <span className="text-xs font-mono">
                            <span className="text-green-600">12%</span>/<span className="text-red-500">-5%</span>
                          </span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('0 "bps"')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">Basis Pts</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">1234 bps</span>
                        </div>
                      </Button>
                    </>
                  )}
                  
                  {formatCategory === 'datetime' && (
                    <>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('MM/DD/YYYY')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">Short</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">12/31/2023</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('MMMM D, YYYY')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">Long</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">Dec 31, 2023</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('YYYY-MM-DD')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">ISO</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">2023-12-31</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('h:mm AM/PM')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">Time</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">3:45 PM</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('HH:mm:ss')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">24hr</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">15:45:30</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('MM/DD/YY h:mm AM/PM')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">Full</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">12/31/23 3:45 PM</span>
                        </div>
                      </Button>
                    </>
                  )}
                  
                  {formatCategory === 'text' && (
                    <>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('[Upper]')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">Upper</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">SAMPLE</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('[Lower]')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">Lower</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">sample</span>
                        </div>
                      </Button>
                      <Button variant="outline" className="h-8 px-2 justify-start group hover:bg-primary/10" onClick={() => setCurrentFormat('[Title]')}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">Title</span>
                          <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">Sample</span>
                        </div>
                      </Button>
                    </>
                  )}
                </div>
                
                {/* Custom Format Input */}
                <div className="mt-2 flex items-center gap-2">
                  <Input 
                    placeholder="Custom format: #,##0.00" 
                    className="h-7 text-xs font-mono flex-1"
                    value={currentFormat}
                    onChange={(e) => setCurrentFormat(e.target.value)}
                  />
                  <Button size="sm" variant="ghost" className="h-7 px-2" title="Apply format">
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex flex-col gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => setShowConditionalDialog(true)}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Conditional
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive">
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
            
            {/* Row 2: Live Preview Strip */}
            <div className="flex items-center gap-4 px-3 py-1.5 bg-muted/30 rounded-md">
              <span className="text-xs text-muted-foreground">Preview:</span>
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">1234.567</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-xs font-mono font-medium">1,234.57</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">-500</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-xs font-mono font-medium text-red-500">500</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">0.45</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-xs font-mono font-medium">45%</span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                Format: {currentFormat}
              </Badge>
            </div>
          </div>
        )}
        
        {activeTab === 'styling' && (
          <div className="space-y-2">
            {/* Cell/Header Toggle */}
            <div className="flex items-center justify-between mb-2">
              <ToggleGroup type="single" defaultValue="cell" size="sm">
                <ToggleGroupItem value="cell" className="text-xs h-7">
                  <Columns className="h-3 w-3 mr-1" />
                  Cell
                </ToggleGroupItem>
                <ToggleGroupItem value="header" className="text-xs h-7">
                  <FileText className="h-3 w-3 mr-1" />
                  Header
                </ToggleGroupItem>
              </ToggleGroup>
              
              <Button variant="ghost" size="sm" className="text-xs h-7">
                <Copy className="h-3 w-3 mr-1" />
                Copy to Header/Cell
              </Button>
            </div>
            
            {/* 4-Column Layout */}
            <div className="grid grid-cols-4 gap-3">
              {/* Column 1 - Font */}
              <div className="space-y-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Font</Label>
                  <Select defaultValue="inter">
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="arial">Arial</SelectItem>
                      <SelectItem value="helvetica">Helvetica</SelectItem>
                      <SelectItem value="georgia">Georgia</SelectItem>
                      <SelectItem value="mono">JetBrains Mono</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-1">
                  <Select defaultValue="400">
                    <SelectTrigger className="h-7 flex-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">Light</SelectItem>
                      <SelectItem value="400">Regular</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semibold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="14">
                    <SelectTrigger className="h-7 flex-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="9">9</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="11">11</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="14">14</SelectItem>
                      <SelectItem value="16">16</SelectItem>
                      <SelectItem value="18">18</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="24">24</SelectItem>
                      <SelectItem value="28">28</SelectItem>
                      <SelectItem value="32">32</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-1">
                  <Toggle 
                    size="sm" 
                    className="h-7 w-7" 
                    pressed={isBold}
                    onPressedChange={setIsBold}
                  >
                    <Bold className="h-3 w-3" />
                  </Toggle>
                  <Toggle 
                    size="sm" 
                    className="h-7 w-7"
                    pressed={isItalic}
                    onPressedChange={setIsItalic}
                  >
                    <Italic className="h-3 w-3" />
                  </Toggle>
                  <Toggle 
                    size="sm" 
                    className="h-7 w-7"
                    pressed={isUnderline}
                    onPressedChange={setIsUnderline}
                  >
                    <Underline className="h-3 w-3" />
                  </Toggle>
                </div>
              </div>
              
              {/* Column 2 - Alignment */}
              <div className="space-y-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Alignment</Label>
                  <ToggleGroup 
                    type="single" 
                    size="sm" 
                    value={currentAlignment}
                    onValueChange={(value) => value && setCurrentAlignment(value)}
                    className="w-full"
                  >
                    <ToggleGroupItem value="left" className="h-7 flex-1">
                      <AlignLeft className="h-3 w-3" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="center" className="h-7 flex-1">
                      <AlignCenter className="h-3 w-3" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="right" className="h-7 flex-1">
                      <AlignRight className="h-3 w-3" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground invisible">Vertical</Label>
                  <ToggleGroup type="single" size="sm" defaultValue="middle" className="w-full">
                    <ToggleGroupItem value="top" className="h-7 flex-1" aria-label="Align top">
                      <AlignVerticalJustifyStart className="h-3 w-3" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="middle" className="h-7 flex-1" aria-label="Align middle">
                      <AlignVerticalJustifyCenter className="h-3 w-3" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="bottom" className="h-7 flex-1" aria-label="Align bottom">
                      <AlignVerticalJustifyEnd className="h-3 w-3" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex items-center gap-1">
                    <Switch id="wrap-text" className="h-4 w-7" />
                    <Label htmlFor="wrap-text" className="text-xs cursor-pointer">
                      Wrap
                    </Label>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch id="auto-height" className="h-4 w-7" />
                    <Label htmlFor="auto-height" className="text-xs cursor-pointer">
                      Auto
                    </Label>
                  </div>
                </div>
              </div>
              
              {/* Column 3 - Colors */}
              <div className="space-y-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Colors</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 w-full justify-start">
                        <Type className="h-3 w-3 mr-1" />
                        <div className="w-3 h-3 rounded border bg-black" />
                        <span className="text-xs ml-1">Text</span>
                        <ChevronDown className="h-3 w-3 ml-auto" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <div className="grid grid-cols-8 gap-1 mb-2">
                        {['black', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'].map(color => (
                          <div
                            key={color}
                            className="h-6 w-6 rounded cursor-pointer hover:scale-110 transition-transform border"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <Input placeholder="#000000" className="h-7 text-xs font-mono" />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 w-full justify-start">
                      <PaintBucket className="h-3 w-3 mr-1" />
                      <div className="w-3 h-3 rounded border border-gray-300" />
                      <span className="text-xs ml-1">Fill</span>
                      <ChevronDown className="h-3 w-3 ml-auto" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48">
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      {['white', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'].map(color => (
                        <div
                          key={color}
                          className="h-6 w-6 rounded cursor-pointer hover:scale-110 transition-transform border"
                          style={{ backgroundColor: color === 'white' ? '#f0f0f0' : color }}
                        />
                      ))}
                    </div>
                    <Input placeholder="#FFFFFF" className="h-7 text-xs font-mono" />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Column 4 - Borders */}
              <div className="space-y-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Borders</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 w-full justify-between">
                        <Square className="h-3 w-3" />
                        <span className="text-xs">Configure</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56">
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-1">
                          <Toggle size="sm" className="h-7 w-full" pressed>
                            <Square className="h-3 w-3" />
                          </Toggle>
                          <Toggle size="sm" className="h-7 w-full">
                            <ArrowUp className="h-3 w-3" />
                          </Toggle>
                          <Toggle size="sm" className="h-7 w-full">
                            <ArrowRight className="h-3 w-3" />
                          </Toggle>
                          <Toggle size="sm" className="h-7 w-full">
                            <ArrowDown className="h-3 w-3" />
                          </Toggle>
                          <Toggle size="sm" className="h-7 w-full">
                            <ArrowLeft className="h-3 w-3" />
                          </Toggle>
                        </div>
                        <div className="flex gap-1">
                          <Select defaultValue="1">
                            <SelectTrigger className="h-7 w-14 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1px</SelectItem>
                              <SelectItem value="2">2px</SelectItem>
                              <SelectItem value="3">3px</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select defaultValue="solid">
                            <SelectTrigger className="h-7 flex-1 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solid">Solid</SelectItem>
                              <SelectItem value="dashed">Dashed</SelectItem>
                              <SelectItem value="dotted">Dotted</SelectItem>
                            </SelectContent>
                          </Select>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="icon" className="h-7 w-7">
                                <div className="w-4 h-4 rounded bg-gray-400" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40">
                              <div className="grid grid-cols-8 gap-1">
                                {['black', 'gray', 'red', 'blue', 'green', 'orange', 'purple', 'pink'].map(color => (
                                  <div
                                    key={color}
                                    className="h-5 w-5 rounded cursor-pointer hover:scale-110 transition-transform border"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Quick presets:
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 flex-1 p-1">
                    <Square className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 flex-1 p-1">
                    <div className="h-3 w-10 border-t border-b border-gray-400" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 flex-1 p-1">
                    <div className="h-3 w-10 border border-gray-400" />
                  </Button>
                </div>
              </div>
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
        
      </div>
    </Card>
    
    {/* Conditional Format Generator Dialog */}
    <Dialog open={showConditionalDialog} onOpenChange={setShowConditionalDialog}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Conditional Format Generator</DialogTitle>
          <DialogDescription>
            Create sophisticated formatting rules with emojis, symbols, and colors
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {/* Quick Templates */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Templates</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 justify-start"
                  onClick={() => {
                    // TODO: Apply template
                  }}
                >
                  <span className="mr-2">📈📉</span>
                  <span className="text-xs">Trend Arrows</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 justify-start"
                  onClick={() => {
                    // TODO: Apply template
                  }}
                >
                  <span className="mr-2">🟢🟡🔴</span>
                  <span className="text-xs">Traffic Lights</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 justify-start"
                  onClick={() => {
                    // TODO: Apply template
                  }}
                >
                  <span className="mr-2">⭐⭐⭐</span>
                  <span className="text-xs">Star Rating</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 justify-start"
                  onClick={() => {
                    // TODO: Apply template
                  }}
                >
                  <span className="mr-2">✅❌</span>
                  <span className="text-xs">Check/Cross</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 justify-start"
                  onClick={() => {
                    // TODO: Apply template
                  }}
                >
                  <span className="mr-2">🔥❄️</span>
                  <span className="text-xs">Hot/Cold</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 justify-start"
                  onClick={() => {
                    // TODO: Apply template
                  }}
                >
                  <span className="mr-2">▲▼</span>
                  <span className="text-xs">Triangles</span>
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Condition Rules */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Condition Rules</Label>
                <Button size="sm" variant="outline" className="h-7">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Rule
                </Button>
              </div>
              
              {/* Rule 1 */}
              <Card className="p-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Rule 1</Badge>
                    <Select defaultValue="greater">
                      <SelectTrigger className="h-7 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not-equals">Not Equals</SelectItem>
                        <SelectItem value="greater">Greater Than</SelectItem>
                        <SelectItem value="less">Less Than</SelectItem>
                        <SelectItem value="between">Between</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="starts">Starts With</SelectItem>
                        <SelectItem value="ends">Ends With</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input className="h-7 w-24" placeholder="Value" defaultValue="0" />
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Display Format</Label>
                      <div className="flex gap-2">
                        <Input 
                          className="h-7 flex-1" 
                          placeholder="Format or emoji" 
                          defaultValue="📈 {value}"
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="icon" variant="outline" className="h-7 w-7">
                              <Sparkles className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72">
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">Emoji & Symbol Picker</Label>
                              <div className="grid grid-cols-8 gap-1">
                                {['📈', '📉', '📊', '💹', '💰', '💵', '💴', '💶', '💷', '🟢', '🟡', '🔴', '🟠', '🔵', '🟣', '⚫', '⚪', '✅', '❌', '⭐', '🌟', '💎', '🔥', '❄️', '☀️', '🌙', '⚡', '💥', '🚀', '🎯', '🏆', '🥇', '🥈', '🥉', '▲', '▼', '◆', '●', '■', '▪', '→', '←', '↑', '↓', '↗', '↘', '⬆️', '⬇️'].map(emoji => (
                                  <Button
                                    key={emoji}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => {
                                      // TODO: Insert emoji
                                    }}
                                  >
                                    {emoji}
                                  </Button>
                                ))}
                              </div>
                              <Separator />
                              <div className="text-xs text-muted-foreground">
                                <p>Variables: {'{value}'}, {'{row.field}'}</p>
                                <p>Functions: UPPER(), LOWER(), ROUND()</p>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Style</Label>
                      <div className="flex gap-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 px-2">
                              <Type className="h-3 w-3 mr-1" />
                              <div className="w-3 h-3 rounded bg-green-500" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48">
                            <div className="grid grid-cols-8 gap-1">
                              {['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#000000'].map(color => (
                                <div
                                  key={color}
                                  className="h-6 w-6 rounded cursor-pointer hover:scale-110 transition-transform border"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 px-2">
                              <PaintBucket className="h-3 w-3 mr-1" />
                              <div className="w-3 h-3 rounded border" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48">
                            <div className="grid grid-cols-8 gap-1">
                              {['transparent', '#fef3c7', '#fee2e2', '#dbeafe', '#ede9fe', '#fce7f3', '#f3f4f6', '#ffffff'].map(color => (
                                <div
                                  key={color}
                                  className="h-6 w-6 rounded cursor-pointer hover:scale-110 transition-transform border"
                                  style={{ backgroundColor: color === 'transparent' ? '#f0f0f0' : color }}
                                />
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <ToggleGroup type="multiple" size="sm">
                          <ToggleGroupItem value="bold" className="h-7 w-7">
                            <Bold className="h-3 w-3" />
                          </ToggleGroupItem>
                          <ToggleGroupItem value="italic" className="h-7 w-7">
                            <Italic className="h-3 w-3" />
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Rule 2 */}
              <Card className="p-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Rule 2</Badge>
                    <Select defaultValue="less">
                      <SelectTrigger className="h-7 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not-equals">Not Equals</SelectItem>
                        <SelectItem value="greater">Greater Than</SelectItem>
                        <SelectItem value="less">Less Than</SelectItem>
                        <SelectItem value="between">Between</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="starts">Starts With</SelectItem>
                        <SelectItem value="ends">Ends With</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input className="h-7 w-24" placeholder="Value" defaultValue="0" />
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Display Format</Label>
                      <div className="flex gap-2">
                        <Input 
                          className="h-7 flex-1" 
                          placeholder="Format or emoji" 
                          defaultValue="📉 {value}"
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="icon" variant="outline" className="h-7 w-7">
                              <Sparkles className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72">
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">Emoji & Symbol Picker</Label>
                              <div className="grid grid-cols-8 gap-1">
                                {['📈', '📉', '📊', '💹', '💰', '💵', '💴', '💶', '💷', '🟢', '🟡', '🔴', '🟠', '🔵', '🟣', '⚫', '⚪', '✅', '❌', '⭐', '🌟', '💎', '🔥', '❄️', '☀️', '🌙', '⚡', '💥', '🚀', '🎯', '🏆', '🥇', '🥈', '🥉', '▲', '▼', '◆', '●', '■', '▪', '→', '←', '↑', '↓', '↗', '↘', '⬆️', '⬇️'].map(emoji => (
                                  <Button
                                    key={emoji}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => {
                                      // TODO: Insert emoji
                                    }}
                                  >
                                    {emoji}
                                  </Button>
                                ))}
                              </div>
                              <Separator />
                              <div className="text-xs text-muted-foreground">
                                <p>Variables: {'{value}'}, {'{row.field}'}</p>
                                <p>Functions: UPPER(), LOWER(), ROUND()</p>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Style</Label>
                      <div className="flex gap-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 px-2">
                              <Type className="h-3 w-3 mr-1" />
                              <div className="w-3 h-3 rounded bg-red-500" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48">
                            <div className="grid grid-cols-8 gap-1">
                              {['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#000000'].map(color => (
                                <div
                                  key={color}
                                  className="h-6 w-6 rounded cursor-pointer hover:scale-110 transition-transform border"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 px-2">
                              <PaintBucket className="h-3 w-3 mr-1" />
                              <div className="w-3 h-3 rounded border" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48">
                            <div className="grid grid-cols-8 gap-1">
                              {['transparent', '#fef3c7', '#fee2e2', '#dbeafe', '#ede9fe', '#fce7f3', '#f3f4f6', '#ffffff'].map(color => (
                                <div
                                  key={color}
                                  className="h-6 w-6 rounded cursor-pointer hover:scale-110 transition-transform border"
                                  style={{ backgroundColor: color === 'transparent' ? '#f0f0f0' : color }}
                                />
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <ToggleGroup type="multiple" size="sm">
                          <ToggleGroupItem value="bold" className="h-7 w-7">
                            <Bold className="h-3 w-3" />
                          </ToggleGroupItem>
                          <ToggleGroupItem value="italic" className="h-7 w-7">
                            <Italic className="h-3 w-3" />
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            <Separator />
            
            {/* Live Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Live Preview</Label>
              <Card className="p-4">
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center space-y-2">
                    <div className="text-xs text-muted-foreground">Input: 150</div>
                    <div className="p-2 rounded border bg-green-50 text-green-700 font-medium">
                      📈 150
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-xs text-muted-foreground">Input: -50</div>
                    <div className="p-2 rounded border bg-red-50 text-red-700 font-medium">
                      📉 -50
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-xs text-muted-foreground">Input: 0</div>
                    <div className="p-2 rounded border">
                      0
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-xs text-muted-foreground">Input: "Hot"</div>
                    <div className="p-2 rounded border bg-orange-50">
                      🔥 Hot
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-xs text-muted-foreground">Input: 4.5</div>
                    <div className="p-2 rounded border">
                      ⭐⭐⭐⭐⭐
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            <Separator />
            
            {/* Generated Format */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Generated Format String</Label>
              <Textarea 
                className="font-mono text-xs" 
                rows={3}
                value={'[>0][Green]📈 {value};[<0][Red]📉 {value};{value}'}
                readOnly
              />
              <div className="flex items-center gap-2">
                <Button size="sm">
                  <Check className="h-3 w-3 mr-1" />
                  Apply Format
                </Button>
                <Button size="sm" variant="outline">
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <Button size="sm" variant="outline">
                  <Save className="h-3 w-3 mr-1" />
                  Save as Template
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
    </>
  );
};