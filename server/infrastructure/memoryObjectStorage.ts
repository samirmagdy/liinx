import { type ObjectStorage, type StorageUploadOptions, type StoredObject } from './interfaces.js';

export class MemoryObjectStorage implements ObjectStorage {
  readonly provider = 's3' as const;
  private readonly objects = new Map<string, { data: Buffer; options: StorageUploadOptions }>();
  constructor(private readonly publicUrlPrefix = 'https://media.test') {}
  private safeKey(key: string): string {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(key)) throw new Error('Invalid object key.');
    return key;
  }
  async put(key: string, data: Buffer, options: StorageUploadOptions): Promise<StoredObject> {
    key = this.safeKey(key);
    this.objects.set(key, { data: Buffer.from(data), options });
    return { key, url: this.getUrl(key), sizeBytes: data.length, mimeType: options.mimeType };
  }
  async get(key: string) { return this.objects.get(this.safeKey(key))?.data ? Buffer.from(this.objects.get(this.safeKey(key))!.data) : null; }
  async delete(key: string) { return this.objects.delete(this.safeKey(key)); }
  async exists(key: string) { return this.objects.has(this.safeKey(key)); }
  getUrl(key: string) { return `${this.publicUrlPrefix}/${encodeURIComponent(this.safeKey(key))}`; }
  async healthCheck() { return true; }
}
