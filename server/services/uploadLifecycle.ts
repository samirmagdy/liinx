import fs from 'node:fs';
import path from 'node:path';
import { db } from '../db.js';

const uploadPathPattern = /^\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** Removes an owned upload only when no profile or block still references it. */
export function cleanupUploadedFileIfUnreferenced(fileUrl: unknown, ownerUserId?: string): boolean {
  if (typeof fileUrl !== 'string' || !uploadPathPattern.test(fileUrl)) return false;
  const row = db.prepare('SELECT path, owner_user_id as ownerUserId FROM uploaded_files WHERE path = ?').get(fileUrl) as { path: string; ownerUserId: string } | undefined;
  if (!row || (ownerUserId && row.ownerUserId !== ownerUserId)) return false;
  const referencedByBlock = db.prepare("SELECT 1 FROM blocks WHERE url = ? OR instr(coalesce(extra_json, ''), ?) > 0 LIMIT 1").get(fileUrl, fileUrl);
  const referencedByProfile = db.prepare(`SELECT 1 FROM profiles WHERE avatar_url = ? OR footer_logo_url = ? OR background_media_url = ? OR share_image_url = ? LIMIT 1`).get(fileUrl, fileUrl, fileUrl, fileUrl);
  if (referencedByBlock || referencedByProfile) return false;

  const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), 'public/uploads'));
  const filename = path.basename(fileUrl);
  const targetPath = path.resolve(uploadsDir, filename);
  if (!targetPath.startsWith(`${uploadsDir}${path.sep}`)) return false;
  try {
    fs.unlinkSync(targetPath);
  } catch (error: any) {
    if (error?.code !== 'ENOENT') return false;
  }
  db.prepare('DELETE FROM uploaded_files WHERE path = ?').run(fileUrl);
  return true;
}
