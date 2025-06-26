/**
 * Simple storage adapter for localStorage
 * This is a minimal implementation to avoid module resolution issues
 */

export interface IStorageAdapter {
  get(key: string, defaultValue?: any): Promise<any>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
}

export class LocalStorageAdapter implements IStorageAdapter {
  async get(key: string, defaultValue?: any): Promise<any> {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue !== undefined ? defaultValue : null;
      }
      
      // Special case for sound preference
      if (key === 'column-dialog-sound-enabled') {
        return item === 'true';
      }
      
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return defaultValue !== undefined ? defaultValue : null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
    }
  }
}

// Export singleton instance
export const storageAdapter = new LocalStorageAdapter();