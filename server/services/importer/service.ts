import { type ImporterAdapter, type ImporterCapabilities, type ImportedProfileData, type ImporterProvider } from './types.js';
import { LinktreeImporterAdapter } from './adapters/linktreeAdapter.js';
import { BeaconsImporterAdapter } from './adapters/beaconsAdapter.js';
import { BioFmImporterAdapter } from './adapters/biofmAdapter.js';
import { DisabledImporterAdapter } from './adapters/disabledAdapter.js';
import { normalizeImportUrl, isSupportedImportUrl } from './url.js';
import { isSafePublicUrl, isSafePublicUrlAsync } from './security.js';

export class ImporterService {
  private adapters: ImporterAdapter[];
  private disabledAdapter: DisabledImporterAdapter;

  constructor(customAdapters?: ImporterAdapter[]) {
    this.disabledAdapter = new DisabledImporterAdapter();
    this.adapters = customAdapters || [
      new LinktreeImporterAdapter(),
      new BeaconsImporterAdapter(),
      new BioFmImporterAdapter(),
    ];
  }

  registerAdapter(adapter: ImporterAdapter): void {
    this.adapters.unshift(adapter);
  }

  getAdapter(url: string): ImporterAdapter {
    for (const adapter of this.adapters) {
      if (adapter.matches(url)) {
        return adapter;
      }
    }
    return this.disabledAdapter;
  }

  getAdapterByProvider(provider: ImporterProvider): ImporterAdapter | undefined {
    return this.adapters.find(a => a.provider === provider);
  }

  isProviderConfigured(provider: 'linktree' | 'beacons' | 'biofm'): boolean {
    const adapter = this.getAdapterByProvider(provider);
    return Boolean(adapter?.isConfigured());
  }

  getCapabilities(): ImporterCapabilities {
    return {
      linktree: this.isProviderConfigured('linktree'),
      beacons: this.isProviderConfigured('beacons'),
      biofm: this.isProviderConfigured('biofm'),
    };
  }

  async importFromPublicUrl(inputUrl: string): Promise<ImportedProfileData> {
    const cleanUrl = normalizeImportUrl(inputUrl);
    if (!cleanUrl) {
      throw new Error('Only public Linktree, Beacons, or Bio.fm profile URLs are supported.');
    }

    if (!isSafePublicUrl(cleanUrl)) {
      throw new Error('Invalid or non-public profile URL provided.');
    }

    if (!isSupportedImportUrl(cleanUrl)) {
      throw new Error('Only public Linktree, Beacons, or Bio.fm profile URLs are supported.');
    }

    const safeDns = await isSafePublicUrlAsync(cleanUrl);
    if (!safeDns) {
      throw new Error('Invalid or non-public profile URL provided.');
    }

    const adapter = this.getAdapter(cleanUrl);
    return adapter.import(cleanUrl);
  }
}

export const importerService = new ImporterService();
