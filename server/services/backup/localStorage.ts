import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type BackupStorage, type BackupMetadata, type BackupItem } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultBackupsDir = path.resolve(__dirname, '../../../data/backups');

export class LocalBackupStorage implements BackupStorage {
  readonly name = 'local-filesystem';
  private readonly dir: string;

  constructor(customDir?: string) {
    this.dir = path.resolve(customDir || process.env.BACKUP_LOCAL_DIR || defaultBackupsDir);
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
  }

  getDirectory(): string {
    return this.dir;
  }

  async save(filename: string, data: Buffer, metadata: BackupMetadata): Promise<void> {
    const targetPath = path.join(this.dir, path.basename(filename));
    const metaPath = `${targetPath}.meta.json`;

    await fs.promises.writeFile(targetPath, data);
    await fs.promises.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  async get(filename: string): Promise<{ data: Buffer; metadata?: BackupMetadata } | null> {
    const targetPath = path.join(this.dir, path.basename(filename));
    const metaPath = `${targetPath}.meta.json`;

    if (!fs.existsSync(targetPath)) return null;

    const data = await fs.promises.readFile(targetPath);
    let metadata: BackupMetadata | undefined;

    if (fs.existsSync(metaPath)) {
      try {
        const metaRaw = await fs.promises.readFile(metaPath, 'utf-8');
        metadata = JSON.parse(metaRaw);
      } catch {
        // Ignore metadata parse error on read
      }
    }

    return { data, metadata };
  }

  async list(prefix = ''): Promise<BackupItem[]> {
    if (!fs.existsSync(this.dir)) return [];

    const files = await fs.promises.readdir(this.dir);
    const items: BackupItem[] = [];

    for (const f of files) {
      if (f.endsWith('.meta.json')) continue;
      if (prefix && !f.startsWith(prefix)) continue;

      const fullPath = path.join(this.dir, f);
      const stat = await fs.promises.stat(fullPath);
      let metadata: BackupMetadata | undefined;
      const metaPath = `${fullPath}.meta.json`;

      if (fs.existsSync(metaPath)) {
        try {
          const raw = await fs.promises.readFile(metaPath, 'utf-8');
          metadata = JSON.parse(raw);
        } catch {
          // ignore
        }
      }

      items.push({
        key: f,
        sizeBytes: stat.size,
        lastModified: stat.mtimeMs,
        metadata
      });
    }

    return items.sort((a, b) => b.lastModified - a.lastModified);
  }

  async delete(filename: string): Promise<boolean> {
    const targetPath = path.join(this.dir, path.basename(filename));
    const metaPath = `${targetPath}.meta.json`;
    let deleted = false;

    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
      deleted = true;
    }
    if (fs.existsSync(metaPath)) {
      await fs.promises.unlink(metaPath).catch(() => {});
    }

    return deleted;
  }

  async exists(filename: string): Promise<boolean> {
    const targetPath = path.join(this.dir, path.basename(filename));
    return fs.existsSync(targetPath);
  }
}
