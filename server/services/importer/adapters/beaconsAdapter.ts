import { BaseImporterAdapter } from './base.js';
import { ImportedProfileData } from '../types.js';

export class BeaconsImporterAdapter extends BaseImporterAdapter {
  readonly provider = 'beacons' as const;
  readonly name = 'Beacons';

  isConfigured(): boolean {
    return process.env.BEACONS_IMPORT_ENABLED === 'true' && Boolean(process.env.BEACONS_API_KEY);
  }

  matches(url: string): boolean {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      return host === 'beacons.ai' || host.endsWith('.beacons.ai');
    } catch {
      return false;
    }
  }

  protected async executeImport(_url: string): Promise<ImportedProfileData> {
    throw new Error('Import is unavailable until an authorized provider API or export is configured.');
  }
}
