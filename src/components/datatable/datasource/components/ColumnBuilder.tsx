import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Grid3X3,
  Settings
} from 'lucide-react';
import { ColDef } from 'ag-grid-community';

interface ColumnBuilderProps {
  schema: any;
  columnDefs: ColDef[];
  onChange: (columnDefs: ColDef[]) => void;
}

interface ColumnConfig extends ColDef {
  selected: boolean;
}

export function ColumnBuilder({ schema, columnDefs, onChange }: ColumnBuilderProps) {
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!schema?.properties) return;

    // Initialize columns from schema
    const schemaColumns: ColumnConfig[] = Object.entries(schema.properties).map(([field, def]: [string, any]) => {
      const existing = columnDefs.find(c => c.field === field);
      
      return {
        field,
        headerName: existing?.headerName || formatFieldName(field),
        selected: existing !== undefined || columnDefs.length === 0,
        sortable: existing?.sortable ?? true,
        filter: existing?.filter ?? true,
        resizable: existing?.resizable ?? true,
        editable: existing?.editable ?? false,
        cellDataType: getCellDataType(def),
        width: existing?.width,
        minWidth: existing?.minWidth ?? 100,
        ...existing
      };
    });

    setColumns(schemaColumns);
  }, [schema, columnDefs]);

  const handleColumnChange = (field: string, changes: Partial<ColumnConfig>) => {
    setColumns(prev => prev.map(col => 
      col.field === field ? { ...col, ...changes } : col
    ));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setColumns(prev => prev.map(col => ({ ...col, selected: checked })));
  };

  const applyChanges = () => {
    const selectedColumns = columns
      .filter(col => col.selected)
      .map(({ selected, ...colDef }) => colDef);
    
    onChange(selectedColumns);
  };

  const selectedCount = columns.filter(c => c.selected).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Column Builder
          </div>
          <Badge variant="outline">
            {selectedCount} / {columns.length} selected
          </Badge>
        </CardTitle>
        <CardDescription>
          Select and configure columns for your data grid
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="font-medium">
                Select All Columns
              </Label>
            </div>
            <Button size="sm" onClick={applyChanges}>
              Apply Changes
            </Button>
          </div>

          <ScrollArea className="h-[400px] rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Show</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[100px]">Options</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.map((column) => (
                  <React.Fragment key={column.field}>
                    <TableRow>
                      <TableCell>
                        <Checkbox
                          checked={column.selected}
                          onCheckedChange={(checked) => 
                            handleColumnChange(column.field!, { selected: !!checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {column.field}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={column.headerName}
                          onChange={(e) => 
                            handleColumnChange(column.field!, { headerName: e.target.value })
                          }
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={typeof column.cellDataType === 'string' ? column.cellDataType : 'text'}
                          onValueChange={(value) => 
                            handleColumnChange(column.field!, { cellDataType: value })
                          }
                        >
                          <SelectTrigger className="h-8 w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="dateString">Date String</SelectItem>
                            <SelectItem value="object">Object</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAdvanced(prev => ({
                            ...prev,
                            [column.field!]: !prev[column.field!]
                          }))}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {showAdvanced[column.field!] && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/50">
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`sortable-${column.field}`}
                                  checked={column.sortable}
                                  onCheckedChange={(checked) => 
                                    handleColumnChange(column.field!, { sortable: checked })
                                  }
                                />
                                <Label htmlFor={`sortable-${column.field}`}>
                                  Sortable
                                </Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`filter-${column.field}`}
                                  checked={!!column.filter}
                                  onCheckedChange={(checked) => 
                                    handleColumnChange(column.field!, { filter: checked })
                                  }
                                />
                                <Label htmlFor={`filter-${column.field}`}>
                                  Filterable
                                </Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`editable-${column.field}`}
                                  checked={typeof column.editable === 'boolean' ? column.editable : false}
                                  onCheckedChange={(checked) => 
                                    handleColumnChange(column.field!, { editable: checked })
                                  }
                                />
                                <Label htmlFor={`editable-${column.field}`}>
                                  Editable
                                </Label>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <Label>Width</Label>
                                <Input
                                  type="number"
                                  value={column.width || ''}
                                  onChange={(e) => 
                                    handleColumnChange(column.field!, { 
                                      width: e.target.value ? parseInt(e.target.value) : undefined 
                                    })
                                  }
                                  placeholder="Auto"
                                  className="h-8"
                                />
                              </div>
                              
                              <div className="space-y-1">
                                <Label>Min Width</Label>
                                <Input
                                  type="number"
                                  value={column.minWidth || ''}
                                  onChange={(e) => 
                                    handleColumnChange(column.field!, { 
                                      minWidth: e.target.value ? parseInt(e.target.value) : undefined 
                                    })
                                  }
                                  placeholder="100"
                                  className="h-8"
                                />
                              </div>
                              
                              <div className="space-y-1">
                                <Label>Max Width</Label>
                                <Input
                                  type="number"
                                  value={column.maxWidth || ''}
                                  onChange={(e) => 
                                    handleColumnChange(column.field!, { 
                                      maxWidth: e.target.value ? parseInt(e.target.value) : undefined 
                                    })
                                  }
                                  placeholder="None"
                                  className="h-8"
                                />
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

function getCellDataType(schemaDef: any): string {
  const type = schemaDef.type;
  
  if (type === 'boolean') return 'boolean';
  if (type === 'number' || type === 'integer') return 'number';
  if (type === 'string' && schemaDef.format === 'date-time') return 'dateString';
  if (type === 'object') return 'object';
  
  return 'text';
}