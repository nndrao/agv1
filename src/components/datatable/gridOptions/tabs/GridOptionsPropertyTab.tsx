import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown } from 'lucide-react';
import { GridOptionsConfig, GridOptionsSection, GridOptionField } from '../types';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface PropertyGroup {
  title: string;
  fields: GridOptionField[];
}

interface GridOptionsPropertyTabProps {
  section: GridOptionsSection;
  options: GridOptionsConfig;
  onChange: (key: keyof GridOptionsConfig, value: any) => void;
  profileOptions: GridOptionsConfig;
}

export const GridOptionsPropertyTab: React.FC<GridOptionsPropertyTabProps> = ({
  section,
  options,
  onChange,
  profileOptions
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set([section.title]) // Expand current section by default
  );

  const toggleGroup = (groupTitle: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupTitle)) {
      newExpanded.delete(groupTitle);
    } else {
      newExpanded.add(groupTitle);
    }
    setExpandedGroups(newExpanded);
  };

  // Group fields by category if needed
  const groups: PropertyGroup[] = [
    {
      title: section.title,
      fields: section.options
    }
  ];

  const renderPropertyRow = (field: GridOptionField) => {
    const value = options[field.key];
    const profileValue = profileOptions[field.key];
    const hasChanged = value !== profileValue && value !== undefined;
    const isDefault = value === undefined || value === field.defaultValue;

    return (
      <div 
        key={field.key} 
        className="grid-option-property-row"
        data-modified={hasChanged}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="grid-option-property-label-cell">
                <Label htmlFor={field.key} className="grid-option-label">
                  {field.label}
                </Label>
              </div>
            </TooltipTrigger>
            {field.description && (
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs">{field.description}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <div className="grid-option-property-value-cell">
          {renderField(field, value, hasChanged, isDefault)}
        </div>
      </div>
    );
  };

  const renderField = (
    field: GridOptionField, 
    value: any, 
    hasChanged: boolean, 
    isDefault: boolean
  ) => {
    switch (field.type) {
      case 'number':
        return (
          <div className="grid-option-control">
            <Input
              id={field.key}
              type="number"
              value={value ?? field.defaultValue ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? undefined : Number(e.target.value);
                onChange(field.key, val);
              }}
              min={field.min}
              max={field.max}
              step={field.step}
              className="grid-option-input"
            />
            {field.unit && (
              <span className="grid-option-unit">{field.unit}</span>
            )}
          </div>
        );

      case 'boolean':
        return (
          <Switch
            id={field.key}
            checked={value ?? field.defaultValue ?? false}
            onCheckedChange={(checked) => onChange(field.key, checked)}
            className="grid-option-switch"
          />
        );

      case 'select':
        return (
          <Select
            value={String(value ?? field.defaultValue ?? '')}
            onValueChange={(val) => {
              if (val === 'null') onChange(field.key, null);
              else if (val === 'undefined') onChange(field.key, undefined);
              else onChange(field.key, val);
            }}
          >
            <SelectTrigger className="grid-option-select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem 
                  key={String(option.value)} 
                  value={String(option.value ?? 'null')}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        const currentValues = value ?? field.defaultValue ?? [];
        const isArray = Array.isArray(currentValues);
        const valuesArray = isArray ? currentValues : [];
        
        return (
          <div className="grid-option-multiselect-compact">
            <Select
              value="_multiselect"
              onValueChange={() => {}}
            >
              <SelectTrigger className="grid-option-select-trigger">
                <SelectValue>
                  {valuesArray.length > 0 
                    ? `${valuesArray.length} selected`
                    : 'None selected'
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  {field.options?.map(option => {
                    const isChecked = valuesArray.includes(option.value);
                    return (
                      <label
                        key={String(option.value)}
                        className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (!isArray && value === false) {
                              const newValues = checked ? [option.value] : [];
                              onChange(field.key, newValues);
                            } else {
                              const newValues = checked
                                ? [...valuesArray, option.value]
                                : valuesArray.filter((v: any) => v !== option.value);
                              onChange(field.key, newValues.length > 0 ? newValues : false);
                            }
                          }}
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid-options-property-grid">
      {groups.map(group => (
        <div key={group.title} className="grid-options-property-group">
          <div
            className="grid-options-property-group-header"
            onClick={() => toggleGroup(group.title)}
            data-expanded={expandedGroups.has(group.title)}
          >
            <ChevronDown className="grid-options-property-group-header-icon h-4 w-4" />
            {group.title}
          </div>
          <div 
            className="grid-options-property-group-content"
            data-expanded={expandedGroups.has(group.title)}
          >
            <div className="grid-options-fields">
              {group.fields.map(field => renderPropertyRow(field))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};