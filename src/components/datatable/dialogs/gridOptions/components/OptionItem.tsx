import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGridOptionsStore } from '../store/gridOptionsStore';
import { DEFAULT_GRID_OPTIONS } from '../constants/defaultOptions';
import { cn } from '@/lib/utils';

interface OptionItemProps {
  label: string;
  description: string;
  value: any;
  type: 'boolean' | 'string' | 'number' | 'select' | 'multiselect' | 'array' | 'json';
  onChange: (value: any) => void;
  options?: Array<{ value: any; label: string }>;
  showEnterpriseBadge?: boolean;
  optionKey?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export const OptionItem: React.FC<OptionItemProps> = ({
  label,
  description,
  value,
  type,
  onChange,
  options = [],
  showEnterpriseBadge = false,
  optionKey,
  min,
  max,
  step,
  placeholder
}) => {
  const { isOptionModified, resetOption } = useGridOptionsStore();
  const isModified = optionKey ? isOptionModified(optionKey) : false;
  const defaultValue = optionKey ? DEFAULT_GRID_OPTIONS[optionKey] : undefined;

  const renderControl = () => {
    switch (type) {
      case 'boolean':
        return (
          <Switch
            checked={value ?? false}
            onCheckedChange={onChange}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
            className="w-32"
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
          />
        );
      
      case 'string':
        return (
          <Input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || undefined)}
            className="w-64"
            placeholder={placeholder}
          />
        );
      
      case 'select':
        return (
          <Select value={value ?? ''} onValueChange={onChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'multiselect':
        return (
          <div className="text-sm text-muted-foreground">
            Multi-select coming soon
          </div>
        );
      
      case 'array':
      case 'json':
        return (
          <div className="text-sm text-muted-foreground">
            JSON editor coming soon
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={cn("option-item", isModified && "bg-primary/5 -mx-4 px-4 rounded-lg")}>
      <div className="option-info">
        <div className="option-label">
          <Label>{label}</Label>
          {showEnterpriseBadge && (
            <Badge variant="outline" className="enterprise-badge">
              Enterprise
            </Badge>
          )}
          {isModified && (
            <Badge variant="secondary" className="option-modified-badge">
              Modified
            </Badge>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p>{description}</p>
                {defaultValue !== undefined && (
                  <p className="mt-2 text-xs">
                    <span className="font-medium">Default:</span> {String(defaultValue)}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="option-description">{description}</p>
      </div>
      
      <div className="option-control">
        {renderControl()}
        {isModified && optionKey && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 h-8 w-8"
                  onClick={() => resetOption(optionKey)}
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Reset to default
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};