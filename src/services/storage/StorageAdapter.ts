/**
 * StorageAdapter
 * 
 * Interface for storage adapters to implement.
 */

export interface StorageAdapter {
  get(key: string, defaultValue?: any): Promise<any>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
  clear?(): Promise<void>;
}

export const STORAGE_KEYS = {
  PROFILES: 'grid-profile-storage',
  COLUMN_TEMPLATES: 'column-template-store',
  DATA_SOURCES: 'datatable-datasources',
  UI_PREFERENCES: 'column-formatting-store',
  SOUND_ENABLED: 'column-dialog-sound-enabled',
} as const;