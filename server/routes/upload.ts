import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.js';

export const uploadRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../public/uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
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

uploadRouter.post('/api/upload', requireAuth, (req, res) => {
  uploadFields(req, res, (err: any) => {
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

    // Securely write file with normalized extension based on detected magic bytes
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const safeFilename = `upload_${uniqueSuffix}${detected.ext}`;
    const targetPath = path.join(uploadsDir, safeFilename);

    try {
      fs.writeFileSync(targetPath, uploadedFile.buffer);
    } catch (writeErr: any) {
      console.error('Failed to write uploaded file:', writeErr);
      return res.status(500).json({ error: 'Failed to store uploaded image.' });
    }

    const fileUrl = `/uploads/${safeFilename}`;
    res.status(201).json({
      success: true,
      url: fileUrl,
      filename: safeFilename,
      size: uploadedFile.size,
      mimeType: detected.mime
    });
  });
});
