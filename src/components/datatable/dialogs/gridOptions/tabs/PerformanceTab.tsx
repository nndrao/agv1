import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface PerformanceTabProps {
  options: AgGridReact['props'];
  onChange: (updates: Partial<AgGridReact['props']>) => void;
}

export function PerformanceTab({ options, onChange }: PerformanceTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Rendering Performance</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="animateRows">Animate Rows</Label>
            <Switch
              id="animateRows"
              checked={options.animateRows ?? false}
              onCheckedChange={(checked) => onChange({ animateRows: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="suppressColumnVirtualisation">Suppress Column Virtualisation</Label>
            <Switch
              id="suppressColumnVirtualisation"
              checked={options.suppressColumnVirtualisation ?? false}
              onCheckedChange={(checked) => onChange({ suppressColumnVirtualisation: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="suppressRowVirtualisation">Suppress Row Virtualisation</Label>
            <Switch
              id="suppressRowVirtualisation"
              checked={options.suppressRowVirtualisation ?? false}
              onCheckedChange={(checked) => onChange({ suppressRowVirtualisation: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="rowBuffer">Row Buffer</Label>
            <Input
              id="rowBuffer"
              type="number"
              min="0"
              value={options.rowBuffer ?? 10}
              onChange={(e) => onChange({ rowBuffer: parseInt(e.target.value) })}
              className="w-[100px]"
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
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="asyncTransactionWaitMillis">Async Transaction Wait (ms)</Label>
            <Input
              id="asyncTransactionWaitMillis"
              type="number"
              min="0"
              value={options.asyncTransactionWaitMillis ?? 50}
              onChange={(e) => onChange({ asyncTransactionWaitMillis: parseInt(e.target.value) })}
              className="w-[100px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="suppressModelUpdateAfterUpdateTransaction">Suppress Model Update</Label>
            <Switch
              id="suppressModelUpdateAfterUpdateTransaction"
              checked={options.suppressModelUpdateAfterUpdateTransaction ?? false}
              onCheckedChange={(checked) => onChange({ suppressModelUpdateAfterUpdateTransaction: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="batchUpdateWaitMillis">Batch Update Wait (ms)</Label>
            <Input
              id="batchUpdateWaitMillis"
              type="number"
              min="0"
              value={options.batchUpdateWaitMillis ?? 50}
              onChange={(e) => onChange({ batchUpdateWaitMillis: parseInt(e.target.value) })}
              className="w-[100px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="deltaSort">Enable Delta Sort</Label>
            <Switch
              id="deltaSort"
              checked={options.deltaSort ?? false}
              onCheckedChange={(checked) => onChange({ deltaSort: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Memory Management</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="maxConcurrentDatasourceRequests">Max Concurrent Datasource Requests</Label>
            <Input
              id="maxConcurrentDatasourceRequests"
              type="number"
              min="1"
              value={options.maxConcurrentDatasourceRequests ?? 2}
              onChange={(e) => onChange({ maxConcurrentDatasourceRequests: parseInt(e.target.value) })}
              className="w-[100px]"
            />
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
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="cacheOverflowSize">Cache Overflow Size</Label>
            <Input
              id="cacheOverflowSize"
              type="number"
              min="0"
              value={options.cacheOverflowSize ?? 2}
              onChange={(e) => onChange({ cacheOverflowSize: parseInt(e.target.value) })}
              className="w-[100px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="purgeClosedRowNodes">Purge Closed Row Nodes</Label>
            <Switch
              id="purgeClosedRowNodes"
              checked={options.purgeClosedRowNodes ?? false}
              onCheckedChange={(checked) => onChange({ purgeClosedRowNodes: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Event Handling</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="debounceVerticalScrollbar">Debounce Vertical Scrollbar</Label>
            <Switch
              id="debounceVerticalScrollbar"
              checked={options.debounceVerticalScrollbar ?? false}
              onCheckedChange={(checked) => onChange({ debounceVerticalScrollbar: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="suppressScrollOnNewData">Suppress Scroll on New Data</Label>
            <Switch
              id="suppressScrollOnNewData"
              checked={options.suppressScrollOnNewData ?? false}
              onCheckedChange={(checked) => onChange({ suppressScrollOnNewData: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="suppressAnimationFrame">Suppress Animation Frame</Label>
            <Switch
              id="suppressAnimationFrame"
              checked={options.suppressAnimationFrame ?? false}
              onCheckedChange={(checked) => onChange({ suppressAnimationFrame: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="suppressAsyncEvents">Suppress Async Events</Label>
            <Switch
              id="suppressAsyncEvents"
              checked={options.suppressAsyncEvents ?? false}
              onCheckedChange={(checked) => onChange({ suppressAsyncEvents: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}