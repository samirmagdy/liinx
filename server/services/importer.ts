/**
 * Public Bio Importer Service Facade
 *
 * Provides backward-compatible exports for importer utilities, security helpers,
 * and profile import entrypoints. Core logic is modularized under `./importer/`.
 */
import { importerService } from './importer/service.js';
import { type ImportedProfileData } from './importer/types.js';

export * from './importer/index.js';

export function isImporterProviderConfigured(provider: 'linktree' | 'beacons' | 'biofm'): boolean {
  return importerService.isProviderConfigured(provider);
}

export async function importFromPublicUrl(inputUrl: string): Promise<ImportedProfileData> {
  return importerService.importFromPublicUrl(inputUrl);
}
