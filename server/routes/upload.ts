import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'node:crypto';
import { requireAuth } from '../middleware/auth.js';
import { sharedRateLimit } from '../middleware/rateLimit.js';
import { db } from '../db.js';
import { cleanupUploadedFileIfUnreferenced } from '../services/uploadLifecycle.js';
import { uploadStorage } from '../services/uploadStorage.js';

export const uploadRouter = Router();

function safeDisplayFilename(value: string): string {
  const name = path.basename(value).replace(/[\u0000-\u001f\u007f\\/<>:"|?*]+/g, '_').trim();
  return (name || 'download').slice(0, 150);
}

// Inspect binary header bytes to verify authentic image payload (anti-MIME spoofing)
export function detectImageMagicBytes(buffer: Buffer): { ext: string; mime: string } | null {
  if (!buffer || buffer.length < 3) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { ext: '.jpg', mime: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
    buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A
  ) {
    return { ext: '.png', mime: 'image/png' };
  }

  // GIF: GIF87a or GIF89a (47 49 46 38 37 61 or 47 49 46 38 39 61)
  if (
    buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61
  ) {
    return { ext: '.gif', mime: 'image/gif' };
  }

  // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { ext: '.webp', mime: 'image/webp' };
  }

  return null;
}

function getImageDimensions(buffer: Buffer, ext: string): { width: number; height: number } | null {
  if (ext === '.png' && buffer.length >= 24) return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  if (ext === '.gif' && buffer.length >= 10) return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  if (ext === '.webp' && buffer.length >= 30 && buffer.toString('ascii', 12, 16) === 'VP8X') return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  if (ext === '.jpg') {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      if (length < 2) break;
      offset += 2 + length;
    }
  }
  return null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]);
const documentUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

export function detectDocument(buffer: Buffer): { mime: string; ext: string } | null {
  // The filename and multipart Content-Type are untrusted. These signatures
  // are the only source of the persisted extension and response MIME type.
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') return { mime: 'application/pdf', ext: '.pdf' };
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && [0x03, 0x05, 0x07].includes(buffer[2]) && [0x04, 0x06, 0x08].includes(buffer[3])) return { mime: 'application/zip', ext: '.zip' };
  if (buffer.subarray(0, 3).toString('ascii') === 'ID3' || (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)) return { mime: 'audio/mpeg', ext: '.mp3' };
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WAVE') return { mime: 'audio/wav', ext: '.wav' };
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') return { mime: 'video/mp4', ext: '.mp4' };
  if (buffer.length <= 25 * 1024 * 1024) {
    const text = buffer.toString('utf8');
    if (text.includes('\u0000') || /<\/?(?:script|iframe|object|embed|svg|html|body)\b/i.test(text)) return null;
    return { mime: 'text/plain', ext: '.txt' };
  }
  return null;
}

const uploadAttempts = new Map<string, { count: number; resetAt: number }>();
function uploadRateLimited(key: string): boolean {
  const now = Date.now();
  const current = uploadAttempts.get(key);
  if (!current || current.resetAt <= now) {
    uploadAttempts.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  current.count += 1;
  return current.count > 30;
}

uploadRouter.post('/api/upload', requireAuth, sharedRateLimit({ name: 'upload', limit: 30, windowMs: 60 * 60 * 1000 }), (req, res) => {
  if (uploadRateLimited((req as any).user?.userId || req.ip)) {
    return res.status(429).json({ error: 'Too many uploads. Please try again later.' });
  }
  uploadFields(req, res, async (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Image file size exceeds the 5MB limit.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const uploadedFile = files?.image?.[0] || files?.file?.[0] || (req as any).file;

    if (!uploadedFile || !uploadedFile.buffer) {
      return res.status(400).json({ error: 'Please select an image file to upload.' });
    }

    // Validate binary magic bytes
    const detected = detectImageMagicBytes(uploadedFile.buffer);
    if (!detected) {
      return res.status(400).json({
        error: 'Invalid file format: Only JPEG, PNG, WEBP, and GIF images are allowed. File failed magic byte verification.'
      });
    }

    const dimensions = getImageDimensions(uploadedFile.buffer, detected.ext);
    if (dimensions && (dimensions.width <= 0 || dimensions.height <= 0 || dimensions.width * dimensions.height > 40_000_000)) {
      return res.status(400).json({ error: 'Image dimensions are too large. Please upload an image under 40 megapixels.' });
    }

    // Securely write file with normalized extension based on detected magic bytes
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const safeFilename = `upload_${uniqueSuffix}${detected.ext}`;
    let stored: { key: string; url: string; sizeBytes: number; mimeType: string } | undefined;

    try {
      stored = await uploadStorage.put(safeFilename, uploadedFile.buffer, {
        mimeType: detected.mime,
        originalFilename: safeFilename,
        visibility: 'public',
        contentDisposition: 'inline',
        cacheControl: 'public, max-age=31536000, immutable'
      });
      const fileUrl = stored.url;
      db.prepare('INSERT INTO uploaded_files (path, owner_user_id, created_at) VALUES (?, ?, ?)')
        .run(fileUrl, (req as any).user.userId, Date.now());
    } catch (writeErr: any) {
      // If the database insert failed after a remote PUT, remove the object so
      // retries cannot accumulate orphaned media.
      if (stored) await uploadStorage.delete(stored.key).catch(() => {});
      console.error('Failed to write uploaded file:', writeErr);
      return res.status(500).json({ error: 'Failed to store uploaded image.' });
    }

    const fileUrl = stored.url;
    res.status(201).json({
      success: true,
      url: fileUrl,
      filename: safeFilename,
      size: stored.sizeBytes,
      mimeType: detected.mime
    });
  });
});

uploadRouter.post('/api/upload/file', requireAuth, sharedRateLimit({ name: 'file-upload', limit: 20, windowMs: 60 * 60 * 1000 }), (req, res, next) => {
  documentUpload.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File size exceeds the 25MB limit.' });
      return res.status(400).json({ error: err.message });
    }
    if (err) return res.status(400).json({ error: 'The file upload could not be read.' });
    next();
  });
}, async (req, res) => {
  const file = req.file;
  const detected = file && !(file as any).truncated ? detectDocument(file.buffer) : null;
  if (!file || !detected) return res.status(400).json({ error: 'The file content does not match a supported PDF, ZIP, TXT, MP3, WAV, or MP4 format.' });
  const safeFilename = `file_${Date.now()}-${crypto.randomBytes(8).toString('hex')}${detected.ext}`;
  let stored: { key: string; url: string; sizeBytes: number; mimeType: string } | undefined;
  try {
    stored = await uploadStorage.put(safeFilename, file.buffer, {
      mimeType: detected.mime,
      originalFilename: safeDisplayFilename(file.originalname),
      visibility: 'public',
      contentDisposition: 'attachment',
      cacheControl: 'public, max-age=31536000, immutable'
    });
    const fileUrl = stored.url;
    db.prepare('INSERT INTO uploaded_files (path, owner_user_id, created_at) VALUES (?, ?, ?)').run(fileUrl, (req as any).user.userId, Date.now());
    return res.status(201).json({ success: true, url: fileUrl, filename: stored.key, originalName: safeDisplayFilename(file.originalname), size: stored.sizeBytes, mimeType: detected.mime });
  } catch (error) {
    if (stored) await uploadStorage.delete(stored.key).catch(() => {});
    console.error('Failed to write uploaded file:', error);
    return res.status(500).json({ error: 'Failed to store uploaded file.' });
  }
});

uploadRouter.delete('/api/upload/file', requireAuth, async (req, res) => {
  const fileUrl = typeof req.body?.url === 'string' ? req.body.url : null;
  const row = fileUrl ? db.prepare('SELECT path FROM uploaded_files WHERE path = ? AND owner_user_id = ?').get(fileUrl, (req as any).user.userId) : undefined;
  if (!row) return res.status(404).json({ error: 'Uploaded file not found.' });
  if (!await cleanupUploadedFileIfUnreferenced(fileUrl, (req as any).user.userId)) return res.status(409).json({ error: 'The file is still in use or could not be removed.' });
  return res.json({ success: true });
});
