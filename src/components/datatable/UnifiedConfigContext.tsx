/**
 * Context provider for unified configuration
 * This allows child components to access unified config without prop drilling
 */

import React, { createContext, useContext } from 'react';
import { ComponentConfig } from '@/services/config/UnifiedConfigStore';
import { GridProfile } from './types';

interface UnifiedConfigContextValue {
  // Config data
  config: ComponentConfig | null;
  loading: boolean;
  error: Error | null;
  
  // Config operations
  loadConfig: () => Promise<void>;
  updateConfig: (updates: Partial<ComponentConfig>) => Promise<void>;
  createVersion: (name: string, description: string) => Promise<any>;
  activateVersion: (versionId: string) => Promise<void>;
  
  // Conversion utilities
  profileToConfig: (profile: GridProfile) => Partial<ComponentConfig>;
  configToProfile: (config: ComponentConfig) => GridProfile | null;
  
  // Instance info
  instanceId: string;
  enabled: boolean;
}

const UnifiedConfigContext = createContext<UnifiedConfigContextValue | null>(null);

interface UnifiedConfigProviderProps {
  children: React.ReactNode;
  value: UnifiedConfigContextValue;
}

export const UnifiedConfigProvider: React.FC<UnifiedConfigProviderProps> = ({ 
  children, 
  value 
}) => {
  return (
    <UnifiedConfigContext.Provider value={value}>
      {children}
    </UnifiedConfigContext.Provider>
  );
};

/**
 * Hook to access unified config from any child component
 */
export const useUnifiedConfigContext = () => {
  const context = useContext(UnifiedConfigContext);
  
  if (!context) {
    // Return a disabled context if not provided
    return {
      config: null,
      loading: false,
      error: null,
      loadConfig: async () => {},
      updateConfig: async () => {},
      createVersion: async () => null,
      activateVersion: async () => {},
      profileToConfig: () => ({}),
      configToProfile: () => null,
      instanceId: 'default',
      enabled: false
    } as UnifiedConfigContextValue;
  }
  
  return context;
};

/**
 * HOC to inject unified config props into a component
 */
export function withUnifiedConfig<P extends object>(
  Component: React.ComponentType<P & { unifiedConfig: UnifiedConfigContextValue }>
) {
  return (props: P) => {
    const unifiedConfig = useUnifiedConfigContext();
    return <Component {...props} unifiedConfig={unifiedConfig} />;
  };
}