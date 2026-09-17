import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type ObjectStorage, type StorageUploadOptions, type StoredObject } from './interfaces.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LocalFileObjectStorage implements ObjectStorage {
  readonly provider = 'local-fs' as const;
  private readonly rootDir: string;
  private readonly publicUrlPrefix: string;

  constructor(customRootDir?: string, publicUrlPrefix = '/uploads') {
    this.rootDir = path.resolve(customRootDir || process.env.UPLOADS_DIR || path.join(__dirname, '../../public/uploads'));
    this.publicUrlPrefix = publicUrlPrefix.replace(/\/$/, '');
  }

  private safeKey(key: string): string {
    const value = key.replace(/^\/+/, '');
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)) throw new Error('Invalid object key.');
    return value;
  }

  async put(key: string, data: Buffer, options: StorageUploadOptions): Promise<StoredObject> {
    const sanitizedKey = this.safeKey(key);
    const targetPath = path.join(this.rootDir, sanitizedKey);
    await fs.promises.mkdir(this.rootDir, { recursive: true });
    await fs.promises.writeFile(targetPath, data);
    return {
      key: sanitizedKey,
      url: `${this.publicUrlPrefix}/${sanitizedKey}`,
      sizeBytes: data.length,
      mimeType: options.mimeType
    };
  }

  async get(key: string): Promise<Buffer | null> {
    const sanitizedKey = this.safeKey(key);
    const targetPath = path.join(this.rootDir, sanitizedKey);
    try {
      return await fs.promises.readFile(targetPath);
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    const sanitizedKey = this.safeKey(key);
    const targetPath = path.join(this.rootDir, sanitizedKey);
    try {
      if (fs.existsSync(targetPath)) {
        await fs.promises.unlink(targetPath);
        return true;
      }
      // Deletion is idempotent so retries after a partial cleanup are safe.
      return true;
    } catch {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    const sanitizedKey = this.safeKey(key);
    const targetPath = path.join(this.rootDir, sanitizedKey);
    return fs.existsSync(targetPath);
  }

  getUrl(key: string): string {
    const sanitizedKey = this.safeKey(key);
    return `${this.publicUrlPrefix}/${sanitizedKey}`;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await fs.promises.mkdir(this.rootDir, { recursive: true });
      await fs.promises.access(this.rootDir, fs.constants.W_OK);
      return true;
    } catch { return false; }
  }
}

export const localFileObjectStorage = new LocalFileObjectStorage();
