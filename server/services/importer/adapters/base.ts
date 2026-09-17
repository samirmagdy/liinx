import { ImporterAdapter, ImporterProvider, ImportedProfileData } from '../types.js';

export abstract class BaseImporterAdapter implements ImporterAdapter {
  abstract readonly provider: ImporterProvider;
  abstract readonly name: string;

  abstract isConfigured(): boolean;
  abstract matches(url: string): boolean;

  async import(url: string): Promise<ImportedProfileData> {
    if (!this.isConfigured()) {
      throw new Error('Import is unavailable until an authorized provider API or export is configured.');
    }
    return this.executeImport(url);
  }

  protected abstract executeImport(url: string): Promise<ImportedProfileData>;
}
