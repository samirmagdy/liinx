import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  type SystemCapabilities,
  DEFAULT_CAPABILITIES
} from '../../shared/index.js';

export type { SystemCapabilities };
export { DEFAULT_CAPABILITIES };

interface CapabilitiesContextType {
  capabilities: SystemCapabilities;
  isLoading: boolean;
  hasAnyImporter: boolean;
  isImporterAvailable: (provider: 'linktree' | 'beacons' | 'biofm') => boolean;
  refreshCapabilities: () => Promise<void>;
}

export const CapabilitiesContext = createContext<CapabilitiesContextType>({
  capabilities: DEFAULT_CAPABILITIES,
  isLoading: true,
  hasAnyImporter: false,
  isImporterAvailable: () => false,
  refreshCapabilities: async () => {}
});

export const CapabilitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [capabilities, setCapabilities] = useState<SystemCapabilities>(DEFAULT_CAPABILITIES);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCapabilities = async () => {
    try {
      const data = await api.capabilities.get();
      if (data && data.importers) {
        setCapabilities(data);
      }
    } catch (err) {
      // Fail-closed: keep default capabilities (all false)
      console.warn('Failed to load system capabilities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCapabilities();
  }, []);

  const hasAnyImporter = Boolean(
    capabilities.importers.linktree ||
    capabilities.importers.beacons ||
    capabilities.importers.biofm
  );

  const isImporterAvailable = (provider: 'linktree' | 'beacons' | 'biofm') => {
    return Boolean(capabilities.importers[provider]);
  };

  return (
    <CapabilitiesContext.Provider value={{
      capabilities,
      isLoading,
      hasAnyImporter,
      isImporterAvailable,
      refreshCapabilities
    }}>
      {children}
    </CapabilitiesContext.Provider>
  );
};

export function useCapabilities() {
  return useContext(CapabilitiesContext);
}
