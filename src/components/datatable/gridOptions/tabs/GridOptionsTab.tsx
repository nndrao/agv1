import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { GridOptionsConfig, GridOptionsSection, GridOptionField } from '../types';

interface GridOptionsTabProps {
  section: GridOptionsSection;
  options: GridOptionsConfig;
  onChange: (key: keyof GridOptionsConfig, value: any) => void;
  profileOptions: GridOptionsConfig;
}

export const GridOptionsTab: React.FC<GridOptionsTabProps> = ({
  section,
  options,
  onChange,
  profileOptions
}) => {
  const renderField = (field: GridOptionField) => {
    const key = field.key as keyof GridOptionsConfig;
    const value = options[key];
    const profileValue = profileOptions[key];
    const hasChanged = value !== profileValue && value !== undefined;
    const isDefault = value === undefined || value === field.defaultValue;

    switch (field.type) {
      case 'number':
        return (
          <div className="grid-option-field grid-option-field-number">
            <div className="grid-option-field-header">
              <Label htmlFor={field.key} className="grid-option-label">
                {field.label}
                {hasChanged && <Badge variant="default" className="ml-2 text-xs">Modified</Badge>}
                {isDefault && <Badge variant="outline" className="ml-2 text-xs">Default</Badge>}
              </Label>
              {field.description && (
                <p className="grid-option-description">{field.description}</p>
              )}
            </div>
            <div className="grid-option-control">
              <Input
                id={field.key}
                type="number"
                value={value ?? field.defaultValue ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : Number(e.target.value);
                  onChange(key, val);
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
          </div>
        );

      case 'boolean':
        return (
          <div className="grid-option-field grid-option-field-boolean">
            <div className="grid-option-field-content">
              <div className="grid-option-field-info">
                <Label htmlFor={field.key} className="grid-option-label">
                  {field.label}
                  {hasChanged && <Badge variant="default" className="ml-2 text-xs">Modified</Badge>}
                  {isDefault && <Badge variant="outline" className="ml-2 text-xs">Default</Badge>}
                </Label>
                {field.description && (
                  <p className="grid-option-description">{field.description}</p>
                )}
              </div>
              <Switch
                id={field.key}
                checked={value ?? field.defaultValue ?? false}
                onCheckedChange={(checked) => onChange(key, checked)}
                className="grid-option-switch"
              />
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="grid-option-field grid-option-field-select">
            <div className="grid-option-field-header">
              <Label htmlFor={field.key} className="grid-option-label">
                {field.label}
                {hasChanged && <Badge variant="default" className="ml-2 text-xs">Modified</Badge>}
                {isDefault && <Badge variant="outline" className="ml-2 text-xs">Default</Badge>}
              </Label>
              {field.description && (
                <p className="grid-option-description">{field.description}</p>
              )}
            </div>
            <Select
              value={String(value ?? field.defaultValue ?? '')}
              onValueChange={(val) => {
                // Handle special conversions
                if (val === 'null') onChange(key, null);
                else if (val === 'undefined') onChange(key, undefined);
                else onChange(key, val);
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
          </div>
        );

      case 'multiselect':
        const currentValues = value ?? field.defaultValue ?? [];
        const isArray = Array.isArray(currentValues);
        const valuesArray = isArray ? currentValues : [];
        
        return (
          <div className="grid-option-field grid-option-field-multiselect">
            <div className="grid-option-field-header">
              <Label className="grid-option-label">
                {field.label}
                {hasChanged && <Badge variant="default" className="ml-2 text-xs">Modified</Badge>}
                {isDefault && <Badge variant="outline" className="ml-2 text-xs">Default</Badge>}
              </Label>
              {field.description && (
                <p className="grid-option-description">{field.description}</p>
              )}
            </div>
            <div className="grid-option-multiselect-options">
              {field.options?.map(option => {
                const isChecked = valuesArray.includes(option.value);
                return (
                  <label
                    key={String(option.value)}
                    className="grid-option-multiselect-item"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (!isArray && value === false) {
                          // If it was false (disabled), start with empty array
                          const newValues = checked ? [option.value] : [];
                          onChange(key, newValues);
                        } else {
                          const newValues = checked
                            ? [...valuesArray, option.value]
                            : valuesArray.filter((v: any) => v !== option.value);
                          onChange(key, newValues.length > 0 ? newValues : false);
                        }
                      }}
                    />
                    <span className="grid-option-multiselect-label">
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid-options-tab-panel">
      <div className="grid-options-fields">
        {section.options.map(field => (
          <div key={field.key} className="grid-option-field-wrapper">
            {renderField(field)}
          </div>
        ))}
      </div>
    </div>
  );
};