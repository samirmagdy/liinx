import { BaseImporterAdapter } from './base.js';
import { ImportedProfileData } from '../types.js';

export class LinktreeImporterAdapter extends BaseImporterAdapter {
  readonly provider = 'linktree' as const;
  readonly name = 'Linktree';

  isConfigured(): boolean {
    return process.env.LINKTREE_IMPORT_ENABLED === 'true' && Boolean(process.env.LINKTREE_API_KEY);
  }

  matches(url: string): boolean {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      return host === 'linktr.ee' || host.endsWith('.linktr.ee');
    } catch {
      return false;
    }
  }

  protected async executeImport(_url: string): Promise<ImportedProfileData> {
    // When an official Linktree partner API integration is established,
    // this method invokes the authenticated API client.
    throw new Error('Import is unavailable until an authorized provider API or export is configured.');
  }
}
