import { BackupStorage, BackupMetadata, BackupItem, S3Config } from './types.js';
import { S3Client } from './s3Client.js';

export class S3CompatibleBackupStorage implements BackupStorage {
  readonly name = 's3-compatible';
  private readonly client: S3Client;
  private readonly prefix: string;

  constructor(config: S3Config) {
    this.client = new S3Client(config);
    this.prefix = config.prefix ? config.prefix.replace(/^\/+|\/+$/g, '') + '/' : '';
  }

  private fullKey(filename: string): string {
    return `${this.prefix}${filename}`;
  }

  async save(filename: string, data: Buffer, metadata: BackupMetadata): Promise<void> {
    const key = this.fullKey(filename);
    const metaKey = `${key}.meta.json`;

    // 1. Upload the backup binary payload
    await this.client.putObject(key, data, 'application/octet-stream');

    // 2. Upload metadata JSON sidecar
    const metaBuffer = Buffer.from(JSON.stringify(metadata, null, 2), 'utf-8');
    await this.client.putObject(metaKey, metaBuffer, 'application/json');
  }

  async get(filename: string): Promise<{ data: Buffer; metadata?: BackupMetadata } | null> {
    const key = this.fullKey(filename);
    const metaKey = `${key}.meta.json`;

    const data = await this.client.getObject(key);
    if (!data) return null;

    let metadata: BackupMetadata | undefined;
    try {
      const metaBuf = await this.client.getObject(metaKey);
      if (metaBuf) {
        metadata = JSON.parse(metaBuf.toString('utf-8'));
      }
    } catch {
      // Ignore metadata retrieval error
    }

    return { data, metadata };
  }

  async list(prefix = ''): Promise<BackupItem[]> {
    const searchPrefix = this.fullKey(prefix);
    const objects = await this.client.listObjects(searchPrefix);

    const items: BackupItem[] = [];
    for (const obj of objects) {
      if (obj.key.endsWith('.meta.json')) continue;
      const strippedKey = this.prefix ? obj.key.replace(this.prefix, '') : obj.key;

      items.push({
        key: strippedKey,
        sizeBytes: obj.size,
        lastModified: obj.lastModified
      });
    }

    return items.sort((a, b) => b.lastModified - a.lastModified);
  }

  async delete(filename: string): Promise<boolean> {
    const key = this.fullKey(filename);
    const metaKey = `${key}.meta.json`;

    const dataDeleted = await this.client.deleteObject(key);
    await this.client.deleteObject(metaKey).catch(() => {});

    return dataDeleted;
  }

  async exists(filename: string): Promise<boolean> {
    const key = this.fullKey(filename);
    const head = await this.client.headObject(key);
    return Boolean(head);
  }
}
