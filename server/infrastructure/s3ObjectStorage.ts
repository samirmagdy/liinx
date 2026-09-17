import { S3Client } from '../services/backup/s3Client.js';
import { type ObjectStorage, type StorageUploadOptions, type StoredObject } from './interfaces.js';

export interface S3ObjectStorageConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicUrl?: string;
  forcePathStyle?: boolean;
  keyPrefix?: string;
}

function cleanKey(key: string): string {
  const value = key.replace(/^\/+/, '');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)) throw new Error('Invalid object key.');
  return value;
}

export class S3CompatibleObjectStorage implements ObjectStorage {
  readonly provider = 's3' as const;
  private readonly client: S3Client;
  private readonly publicUrl?: string;
  private readonly prefix: string;

  constructor(config: S3ObjectStorageConfig) {
    this.client = new S3Client({ ...config, prefix: undefined });
    this.publicUrl = config.publicUrl?.replace(/\/$/, '');
    this.prefix = (config.keyPrefix || '').replace(/^\/+|\/+$/g, '');
  }

  private objectKey(key: string): string {
    const clean = cleanKey(key);
    return this.prefix ? `${this.prefix}/${clean}` : clean;
  }

  async put(key: string, data: Buffer, options: StorageUploadOptions): Promise<StoredObject> {
    const clean = cleanKey(key);
    const disposition = options.contentDisposition || 'inline';
    const filename = (options.originalFilename || clean).replace(/[\r\n"\\]/g, '_').slice(0, 150);
    await this.client.putObject(this.objectKey(clean), data, options.mimeType, {
      'cache-control': options.cacheControl || 'public, max-age=31536000, immutable',
      'content-disposition': disposition === 'attachment' ? `attachment; filename="${filename}"` : 'inline'
    });
    return { key: clean, url: this.getUrl(clean), sizeBytes: data.length, mimeType: options.mimeType };
  }

  get(key: string): Promise<Buffer | null> { return this.client.getObject(this.objectKey(key)); }
  delete(key: string): Promise<boolean> { return this.client.deleteObject(this.objectKey(key)); }
  async exists(key: string): Promise<boolean> { return Boolean(await this.client.headObject(this.objectKey(key))); }

  getUrl(key: string): string {
    const clean = cleanKey(key);
    return this.publicUrl ? `${this.publicUrl}/${encodeURIComponent(clean)}` : `/uploads/${encodeURIComponent(clean)}`;
  }

  async healthCheck(): Promise<boolean> {
    // Configuration validation is intentionally local; probing a bucket on every
    // readiness request would add provider traffic and can leak operational detail.
    return Boolean(this.client && this.prefix !== undefined);
  }
}

export function createS3ObjectStorageFromEnv(): S3CompatibleObjectStorage {
  const required = ['MEDIA_S3_BUCKET', 'MEDIA_S3_ACCESS_KEY_ID', 'MEDIA_S3_SECRET_ACCESS_KEY'] as const;
  for (const name of required) if (!process.env[name]) throw new Error(`${name} is required when MEDIA_STORAGE=s3.`);
  return new S3CompatibleObjectStorage({
    bucket: process.env.MEDIA_S3_BUCKET!,
    region: process.env.MEDIA_S3_REGION || 'us-east-1',
    accessKeyId: process.env.MEDIA_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.MEDIA_S3_SECRET_ACCESS_KEY!,
    endpoint: process.env.MEDIA_S3_ENDPOINT,
    publicUrl: process.env.MEDIA_PUBLIC_URL,
    forcePathStyle: process.env.MEDIA_S3_FORCE_PATH_STYLE === 'true',
    keyPrefix: process.env.MEDIA_S3_PREFIX || 'media'
  });
}
