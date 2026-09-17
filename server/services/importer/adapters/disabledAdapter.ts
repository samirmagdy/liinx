import { BaseImporterAdapter } from './base.js';
import { ImportedProfileData } from '../types.js';

export class DisabledImporterAdapter extends BaseImporterAdapter {
  readonly provider = 'disabled' as const;
  readonly name = 'Disabled';

  isConfigured(): boolean {
    return false;
  }

  matches(_url: string): boolean {
    // Matches any URL that did not match an active provider adapter.
    return true;
  }

  override async import(_url: string): Promise<ImportedProfileData> {
    throw new Error('Only public Linktree, Beacons, or Bio.fm profile URLs are supported.');
  }

  protected async executeImport(_url: string): Promise<ImportedProfileData> {
    throw new Error('Only public Linktree, Beacons, or Bio.fm profile URLs are supported.');
  }
}
