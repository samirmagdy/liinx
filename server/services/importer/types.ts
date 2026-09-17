export type ImporterProvider = 'linktree' | 'beacons' | 'biofm' | 'generic' | 'disabled';

export interface ImportedProfileData {
  sourceUrl: string;
  provider: ImporterProvider;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  links: {
    title: string;
    url: string;
    subtitle?: string;
  }[];
  socials: {
    platform: string;
    url: string;
  }[];
  warnings: string[];
}

export interface ImporterAdapter {
  readonly provider: ImporterProvider;
  readonly name: string;
  isConfigured(): boolean;
  matches(url: string): boolean;
  import(url: string): Promise<ImportedProfileData>;
}

export interface ImporterCapabilities {
  linktree: boolean;
  beacons: boolean;
  biofm: boolean;
}

export interface CommitImportedLinksPayload {
  pageId?: string;
  links: {
    title: string;
    url: string;
    subtitle?: string;
  }[];
  updateProfileInfo?: boolean;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface CommitImportedLinksResult {
  imported: number;
  skippedDuplicates: number;
}
