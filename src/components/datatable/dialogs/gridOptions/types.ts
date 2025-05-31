export interface GridOptionsProfile {
  id: string;
  name: string;
  description?: string;
  options: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface OptionConfig {
  key: string;
  label: string;
  description: string;
  type: 'boolean' | 'string' | 'number' | 'array' | 'object' | 'function';
  defaultValue?: any;
  options?: Array<{ value: any; label: string }>;
  enterprise?: boolean;
  category?: string;
}

export interface TabConfig {
  id: string;
  label: string;
  icon: string;
  options: OptionConfig[];
}