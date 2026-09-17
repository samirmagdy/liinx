export interface SystemCapabilities {
  importers: {
    linktree: boolean;
    beacons: boolean;
    biofm: boolean;
  };
  instagram: boolean;
  billing: boolean;
  supportsHorizontalScaling: boolean;
}

export const DEFAULT_CAPABILITIES: SystemCapabilities = {
  importers: {
    linktree: false,
    beacons: false,
    biofm: false
  },
  instagram: false,
  billing: false,
  supportsHorizontalScaling: false
};
