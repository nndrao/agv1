import React from 'react';
import { Layers, GitBranch, Sigma, Eye, Grid3x3 } from 'lucide-react';
import { OptionItem } from '../components/OptionItem';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GroupingPivotingTabProps {
  options: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export const GroupingPivotingTab: React.FC<GroupingPivotingTabProps> = ({ options, onChange }) => {
  return (
    <div className="space-y-6">
      <Alert>
        <Layers className="h-4 w-4" />
        <AlertDescription>
          Row grouping and pivoting are Enterprise features that allow you to organize and aggregate data.
        </AlertDescription>
      </Alert>

      {/* Row Grouping Section */}
      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <GitBranch className="option-group-icon" />
            Row Grouping
            <Badge variant="secondary" className="ml-2 text-xs">Enterprise</Badge>
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Group Display Type"
            description="How to display grouped rows"
            value={options.groupDisplayType}
            type="select"
            options={[
              { value: 'singleColumn', label: 'Single Column' },
              { value: 'multipleColumns', label: 'Multiple Columns' },
              { value: 'groupRows', label: 'Group Rows' },
              { value: 'custom', label: 'Custom' }
            ]}
            onChange={(value) => onChange('groupDisplayType', value)}
            optionKey="groupDisplayType"
            showEnterpriseBadge
          />
          
          <OptionItem
            label="Group Default Expanded"
            description="Default expansion level (-1 for all expanded)"
            value={options.groupDefaultExpanded}
            type="number"
            onChange={(value) => onChange('groupDefaultExpanded', value)}
            optionKey="groupDefaultExpanded"
            min={-1}
            max={10}
          />
          
          <OptionItem
            label="Row Group Panel Show"
            description="When to show the row group panel"
            value={options.rowGroupPanelShow}
            type="select"
            options={[
              { value: 'always', label: 'Always' },
              { value: 'onlyWhenGrouping', label: 'Only When Grouping' },
              { value: 'never', label: 'Never' }
            ]}
            onChange={(value) => onChange('rowGroupPanelShow', value)}
            optionKey="rowGroupPanelShow"
            showEnterpriseBadge
          />
          
          <OptionItem
            label="Group Use Entire Row"
            description="Display group rows spanning entire width"
            value={options.groupUseEntireRow}
            type="boolean"
            onChange={(value) => onChange('groupUseEntireRow', value)}
            optionKey="groupUseEntireRow"
          />
          
          <OptionItem
            label="Group Selects Children"
            description="Selecting a group selects all children"
            value={options.groupSelectsChildren}
            type="boolean"
            onChange={(value) => onChange('groupSelectsChildren', value)}
            optionKey="groupSelectsChildren"
          />
          
          <OptionItem
            label="Group Selects Filtered"
            description="When selecting group, only select filtered children"
            value={options.groupSelectsFiltered}
            type="boolean"
            onChange={(value) => onChange('groupSelectsFiltered', value)}
            optionKey="groupSelectsFiltered"
          />
          
          <OptionItem
            label="Group Remove Single Children"
            description="Remove groups with only one child"
            value={options.groupRemoveSingleChildren}
            type="boolean"
            onChange={(value) => onChange('groupRemoveSingleChildren', value)}
            optionKey="groupRemoveSingleChildren"
          />
          
          <OptionItem
            label="Group Remove Lowest Single Children"
            description="Remove single children from lowest level only"
            value={options.groupRemoveLowestSingleChildren}
            type="boolean"
            onChange={(value) => onChange('groupRemoveLowestSingleChildren', value)}
            optionKey="groupRemoveLowestSingleChildren"
          />
          
          <OptionItem
            label="Group Suppress Auto Column"
            description="Suppress the auto-created group column"
            value={options.groupSuppressAutoColumn}
            type="boolean"
            onChange={(value) => onChange('groupSuppressAutoColumn', value)}
            optionKey="groupSuppressAutoColumn"
          />
          
          <OptionItem
            label="Group Include Footer"
            description="Add footer row for each group"
            value={options.groupIncludeFooter}
            type="boolean"
            onChange={(value) => onChange('groupIncludeFooter', value)}
            optionKey="groupIncludeFooter"
            showEnterpriseBadge
          />
          
          <OptionItem
            label="Group Include Total Footer"
            description="Add total footer row at the end"
            value={options.groupIncludeTotalFooter}
            type="boolean"
            onChange={(value) => onChange('groupIncludeTotalFooter', value)}
            optionKey="groupIncludeTotalFooter"
            showEnterpriseBadge
          />
          
          <OptionItem
            label="Group Suppress Blank Header"
            description="Hide group header for top level groups"
            value={options.groupSuppressBlankHeader}
            type="boolean"
            onChange={(value) => onChange('groupSuppressBlankHeader', value)}
            optionKey="groupSuppressBlankHeader"
          />
          
          <OptionItem
            label="Group Suppress Row"
            description="Don't render group rows (custom grouping)"
            value={options.groupSuppressRow}
            type="boolean"
            onChange={(value) => onChange('groupSuppressRow', value)}
            optionKey="groupSuppressRow"
          />
          
          <OptionItem
            label="Group Hide Open Parents"
            description="Hide parent group row when expanded"
            value={options.groupHideOpenParents}
            type="boolean"
            onChange={(value) => onChange('groupHideOpenParents', value)}
            optionKey="groupHideOpenParents"
          />
          
          <OptionItem
            label="Show Opened Group"
            description="Show opened group in group column"
            value={options.showOpenedGroup}
            type="boolean"
            onChange={(value) => onChange('showOpenedGroup', value)}
            optionKey="showOpenedGroup"
          />
          
          <OptionItem
            label="Group Rows Sticky"
            description="Group rows stick to top when scrolling"
            value={options.groupRowsSticky}
            type="boolean"
            onChange={(value) => onChange('groupRowsSticky', value)}
            optionKey="groupRowsSticky"
            showEnterpriseBadge
          />
          
          <OptionItem
            label="Suppress Group Zero Sticky"
            description="Prevent top level groups from sticking"
            value={options.suppressGroupZeroSticky}
            type="boolean"
            onChange={(value) => onChange('suppressGroupZeroSticky', value)}
            optionKey="suppressGroupZeroSticky"
          />
          
          <OptionItem
            label="Suppress Make Column Visible After UnGroup"
            description="Keep columns hidden after ungrouping"
            value={options.suppressMakeColumnVisibleAfterUnGroup}
            type="boolean"
            onChange={(value) => onChange('suppressMakeColumnVisibleAfterUnGroup', value)}
            optionKey="suppressMakeColumnVisibleAfterUnGroup"
          />
          
          <OptionItem
            label="Tree Data Display Type"
            description="How to display tree data"
            value={options.treeDataDisplayType}
            type="select"
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'custom', label: 'Custom' }
            ]}
            onChange={(value) => onChange('treeDataDisplayType', value)}
            optionKey="treeDataDisplayType"
          />
        </div>
      </div>

      <Separator />

      {/* Pivoting Section */}
      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Grid3x3 className="option-group-icon" />
            Pivoting
            <Badge variant="secondary" className="ml-2 text-xs">Enterprise</Badge>
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Pivot Mode"
            description="Enable pivot mode"
            value={options.pivotMode}
            type="boolean"
            onChange={(value) => onChange('pivotMode', value)}
            optionKey="pivotMode"
            showEnterpriseBadge
          />
          
          <OptionItem
            label="Pivot Panel Show"
            description="When to show the pivot panel"
            value={options.pivotPanelShow}
            type="select"
            options={[
              { value: 'always', label: 'Always' },
              { value: 'onlyWhenPivoting', label: 'Only When Pivoting' },
              { value: 'never', label: 'Never' }
            ]}
            onChange={(value) => onChange('pivotPanelShow', value)}
            optionKey="pivotPanelShow"
            showEnterpriseBadge
          />
          
          <OptionItem
            label="Pivot Default Expanded"
            description="Default expansion level for pivot rows"
            value={options.pivotDefaultExpanded}
            type="number"
            onChange={(value) => onChange('pivotDefaultExpanded', value)}
            optionKey="pivotDefaultExpanded"
            min={-1}
            max={10}
            showEnterpriseBadge
          />
        </div>
      </div>

      <Separator />

      {/* Aggregation Section */}
      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Sigma className="option-group-icon" />
            Aggregation
          </h3>
        </div>
        <div className="option-group-content space-y-4">
          <OptionItem
            label="Suppress Agg Func In Header"
            description="Don't show aggregation function names in headers"
            value={options.suppressAggFuncInHeader}
            type="boolean"
            onChange={(value) => onChange('suppressAggFuncInHeader', value)}
            optionKey="suppressAggFuncInHeader"
          />
          
          <OptionItem
            label="Functions Read Only"
            description="Prevent users from modifying aggregation functions"
            value={options.functionsReadOnly}
            type="boolean"
            onChange={(value) => onChange('functionsReadOnly', value)}
            optionKey="functionsReadOnly"
            showEnterpriseBadge
          />
          
          <OptionItem
            label="Suppress Group Maintain Value Type"
            description="Don't preserve column value type when grouping"
            value={options.suppressGroupMaintainValueType}
            type="boolean"
            onChange={(value) => onChange('suppressGroupMaintainValueType', value)}
            optionKey="suppressGroupMaintainValueType"
          />
        </div>
      </div>

      <Separator />

      {/* Additional Options */}
      <div className="option-group">
        <div className="option-group-header">
          <h3 className="option-group-title">
            <Eye className="option-group-icon" />
            Group Row Rendering
          </h3>
        </div>
        <div className="option-group-content">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">The following option can be configured programmatically:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">groupRowRenderer</code> - Custom component for rendering group rows</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};