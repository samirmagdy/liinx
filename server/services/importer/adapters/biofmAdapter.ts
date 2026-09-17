import { BaseImporterAdapter } from './base.js';
import { type ImportedProfileData } from '../types.js';

export class BioFmImporterAdapter extends BaseImporterAdapter {
  readonly provider = 'biofm' as const;
  readonly name = 'Bio.fm';

  isConfigured(): boolean {
    return process.env.BIOFM_IMPORT_ENABLED === 'true' && Boolean(process.env.BIOFM_API_KEY);
  }

  matches(url: string): boolean {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      return host === 'bio.fm' || host.endsWith('.bio.fm');
    } catch {
      return false;
    }
  }

  protected async executeImport(_url: string): Promise<ImportedProfileData> {
    throw new Error('Import is unavailable until an authorized provider API or export is configured.');
  }
}
