export type BackupType = 'database' | 'uploads';

export interface BackupMetadata {
  id: string;
  type: BackupType;
  filename: string;
  timestamp: string;
  sizeBytes: number;
  checksumSha256: string;
  encrypted: boolean;
  ivHex?: string;
  tagHex?: string;
  version: number;
}

export interface BackupItem {
  key: string;
  sizeBytes: number;
  lastModified: number;
  metadata?: BackupMetadata;
}

export interface BackupStorage {
  readonly name: string;
  save(filename: string, data: Buffer, metadata: BackupMetadata): Promise<void>;
  get(filename: string): Promise<{ data: Buffer; metadata?: BackupMetadata } | null>;
  list(prefix?: string): Promise<BackupItem[]>;
  delete(filename: string): Promise<boolean>;
  exists(filename: string): Promise<boolean>;
}

export interface S3Config {
  endpoint?: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix?: string;
  forcePathStyle?: boolean;
}

export interface RetentionConfig {
  daily: number;    // Number of daily backups to keep (default: 7)
  weekly: number;   // Number of weekly backups to keep (default: 4)
  monthly: number;  // Number of monthly backups to keep (default: 3)
}

export interface BackupResult {
  type: BackupType;
  localPath: string;
  remoteKey?: string;
  sizeBytes: number;
  checksumSha256: string;
  encrypted: boolean;
  durationMs: number;
  destinations: string[];
}
