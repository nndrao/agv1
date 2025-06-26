import { StateStorage } from 'zustand/middleware';

/**
 * Custom storage implementation for profile store
 */
export const customProfileStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const item = localStorage.getItem(name);
    return item;
  },
  
  setItem: (name: string, value: string | any): void => {
    // Handle both string and object values (Zustand sometimes passes objects)
    let stringValue: string;
    if (typeof value === 'string') {
      stringValue = value;
    } else {
      try {
        stringValue = JSON.stringify(value);
      } catch (error) {
        console.error('[CustomStorage] Failed to stringify value:', error);
        return;
      }
    }
    
    localStorage.setItem(name, stringValue);
  },
  
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  }
};