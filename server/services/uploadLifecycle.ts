import { db } from '../db.js';
import { storageKeyFromUrl, uploadStorage } from './uploadStorage.js';

/** Removes an owned upload only when no profile or block still references it. */
export async function cleanupUploadedFileIfUnreferenced(fileUrl: unknown, ownerUserId?: string): Promise<boolean> {
  if (typeof fileUrl !== 'string' || !storageKeyFromUrl(fileUrl)) return false;
  const row = db.prepare('SELECT path, owner_user_id as ownerUserId FROM uploaded_files WHERE path = ?').get(fileUrl) as { path: string; ownerUserId: string } | undefined;
  if (!row || (ownerUserId && row.ownerUserId !== ownerUserId)) return false;
  const referencedByBlock = db.prepare("SELECT 1 FROM blocks WHERE url = ? OR instr(coalesce(extra_json, ''), ?) > 0 LIMIT 1").get(fileUrl, fileUrl);
  const referencedByProfile = db.prepare(`SELECT 1 FROM profiles WHERE avatar_url = ? OR footer_logo_url = ? OR background_media_url = ? OR share_image_url = ? LIMIT 1`).get(fileUrl, fileUrl, fileUrl, fileUrl);
  if (referencedByBlock || referencedByProfile) return false;

  const key = storageKeyFromUrl(fileUrl);
  if (!key || !(await uploadStorage.delete(key))) return false;
  db.prepare('DELETE FROM uploaded_files WHERE path = ?').run(fileUrl);
  return true;
}
