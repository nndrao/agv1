import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface DataRenderingTabProps {
  options: AgGridReact['props'];
  onChange: (updates: Partial<AgGridReact['props']>) => void;
}

export function DataRenderingTab({ options, onChange }: DataRenderingTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Row Data</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="rowData">Row Data Type</Label>
            <Select
              value={options.rowData ? 'client' : 'none'}
              onValueChange={(value) => {
                if (value === 'none') {
                  onChange({ rowData: undefined });
                }
                // Other data types would be handled in actual implementation
              }}
            >
              <SelectTrigger id="rowData" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="client">Client-Side</SelectItem>
                <SelectItem value="server">Server-Side (Configure in code)</SelectItem>
                <SelectItem value="viewport">Viewport (Configure in code)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="getRowId">Custom Row ID</Label>
            <Switch
              id="getRowId"
              checked={options.getRowId !== undefined}
              onCheckedChange={(checked) => onChange({ 
                getRowId: checked ? ((params: any) => params.data.id) : undefined 
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="immutableData">Immutable Data</Label>
            <Switch
              id="immutableData"
              checked={options.immutableData ?? false}
              onCheckedChange={(checked) => onChange({ immutableData: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="deltaRowDataMode">Delta Row Data Mode</Label>
            <Switch
              id="deltaRowDataMode"
              checked={options.deltaRowDataMode ?? false}
              onCheckedChange={(checked) => onChange({ deltaRowDataMode: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Pagination</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="pagination">Enable Pagination</Label>
            <Switch
              id="pagination"
              checked={options.pagination ?? false}
              onCheckedChange={(checked) => onChange({ pagination: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="paginationPageSize">Page Size</Label>
            <Input
              id="paginationPageSize"
              type="number"
              min="1"
              value={options.paginationPageSize ?? 100}
              onChange={(e) => onChange({ paginationPageSize: parseInt(e.target.value) })}
              className="w-[100px]"
              disabled={!options.pagination}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="paginationAutoPageSize">Auto Page Size</Label>
            <Switch
              id="paginationAutoPageSize"
              checked={options.paginationAutoPageSize ?? false}
              onCheckedChange={(checked) => onChange({ paginationAutoPageSize: checked })}
              disabled={!options.pagination}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="suppressPaginationPanel">Suppress Pagination Panel</Label>
            <Switch
              id="suppressPaginationPanel"
              checked={options.suppressPaginationPanel ?? false}
              onCheckedChange={(checked) => onChange({ suppressPaginationPanel: checked })}
              disabled={!options.pagination}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Row Models</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="rowModelType">Row Model Type</Label>
            <Select
              value={options.rowModelType || 'clientSide'}
              onValueChange={(value) => onChange({ rowModelType: value as any })}
            >
              <SelectTrigger id="rowModelType" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clientSide">Client Side</SelectItem>
                <SelectItem value="infinite">Infinite</SelectItem>
                <SelectItem value="viewport">Viewport</SelectItem>
                <SelectItem value="serverSide">Server Side</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="cacheBlockSize">Cache Block Size</Label>
            <Input
              id="cacheBlockSize"
              type="number"
              min="1"
              value={options.cacheBlockSize ?? 100}
              onChange={(e) => onChange({ cacheBlockSize: parseInt(e.target.value) })}
              className="w-[100px]"
              disabled={options.rowModelType === 'clientSide'}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="maxBlocksInCache">Max Blocks in Cache</Label>
            <Input
              id="maxBlocksInCache"
              type="number"
              min="0"
              value={options.maxBlocksInCache ?? 10}
              onChange={(e) => onChange({ maxBlocksInCache: parseInt(e.target.value) })}
              className="w-[100px]"
              disabled={options.rowModelType === 'clientSide'}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Master/Detail</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="masterDetail">Enable Master/Detail</Label>
            <Switch
              id="masterDetail"
              checked={options.masterDetail ?? false}
              onCheckedChange={(checked) => onChange({ masterDetail: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="detailRowHeight">Detail Row Height</Label>
            <Input
              id="detailRowHeight"
              type="number"
              min="0"
              value={options.detailRowHeight ?? 300}
              onChange={(e) => onChange({ detailRowHeight: parseInt(e.target.value) })}
              className="w-[100px]"
              disabled={!options.masterDetail}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="detailRowAutoHeight">Detail Row Auto Height</Label>
            <Switch
              id="detailRowAutoHeight"
              checked={options.detailRowAutoHeight ?? false}
              onCheckedChange={(checked) => onChange({ detailRowAutoHeight: checked })}
              disabled={!options.masterDetail}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="embedFullWidthRows">Embed Full Width Rows</Label>
            <Switch
              id="embedFullWidthRows"
              checked={options.embedFullWidthRows ?? false}
              onCheckedChange={(checked) => onChange({ embedFullWidthRows: checked })}
              disabled={!options.masterDetail}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Tree Data</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="treeData">Enable Tree Data</Label>
            <Switch
              id="treeData"
              checked={options.treeData ?? false}
              onCheckedChange={(checked) => onChange({ treeData: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="getDataPath">Data Path Function</Label>
            <Switch
              id="getDataPath"
              checked={options.getDataPath !== undefined}
              onCheckedChange={(checked) => onChange({ 
                getDataPath: checked ? ((data: any) => data.path) : undefined 
              })}
              disabled={!options.treeData}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="groupDefaultExpanded">Default Expanded Level</Label>
            <Input
              id="groupDefaultExpanded"
              type="number"
              min="-1"
              value={options.groupDefaultExpanded ?? 0}
              onChange={(e) => onChange({ groupDefaultExpanded: parseInt(e.target.value) })}
              className="w-[100px]"
              disabled={!options.treeData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}