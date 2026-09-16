import fs from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';

describe('download block and file lifecycle', () => {
  let token = '';
  let otherToken = '';
  let pageId = '';
  let uploadsRoot = '';

  beforeAll(async () => {
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const registration = await request(app).post('/api/auth/register').send({ email: `downloads-${unique}@liinx.test`, password: 'DownloadsPassword2026!', username: `downloads_${unique}`.slice(0, 30) }).expect(201);
    token = registration.body.token;
    const other = await request(app).post('/api/auth/register').send({ email: `downloads-other-${unique}@liinx.test`, password: 'DownloadsPassword2026!', username: `other_downloads_${unique}`.slice(0, 30) }).expect(201);
    otherToken = other.body.token;
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    pageId = studio.body.pages.find((page: any) => page.isHome).id;
    uploadsRoot = process.env.UPLOADS_DIR || 'public/uploads';
  });

  it('uploads supported files and serves each byte-for-byte as an attachment', async () => {
    const files = [
      { name: '../../guide.pdf', bytes: Buffer.from('%PDF-1.7\nfixture') , mime: 'application/pdf' },
      { name: 'archive.zip', bytes: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x01, 0x02]), mime: 'application/zip' },
      { name: 'audio.mp3', bytes: Buffer.from('ID3fixture'), mime: 'audio/mpeg' },
      { name: 'audio.wav', bytes: Buffer.from('RIFF1234WAVEfixture'), mime: 'audio/wav' },
      { name: 'video.mp4', bytes: Buffer.from([0, 0, 0, 20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]), mime: 'video/mp4' },
      { name: 'notes.txt', bytes: Buffer.from('Plain text fixture'), mime: 'text/plain' }
    ];
    for (const file of files) {
      const uploaded = await request(app).post('/api/upload/file').set('Authorization', `Bearer ${token}`).attach('file', file.bytes, file.name).expect(201);
      expect(uploaded.body.originalName).toBe(file.name === '../../guide.pdf' ? 'guide.pdf' : file.name);
      expect(uploaded.body.mimeType).toBe(file.mime);
      const served = await request(app).get(uploaded.body.url).buffer(true).parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
      }).expect(200);
      expect(Buffer.from(served.body)).toEqual(file.bytes);
      expect(served.headers['content-type']).toContain(file.mime);
      expect(served.headers['content-disposition']).toMatch(/^attachment/i);
      expect(served.headers['x-content-type-options']).toBe('nosniff');
    }
  });

  it('keeps shared assets, cleans replacements/deletions, and enforces owner cleanup', async () => {
    const first = await request(app).post('/api/upload/file').set('Authorization', `Bearer ${token}`).attach('file', Buffer.from('%PDF-1.7\nfirst fixture'), 'first.pdf').expect(201);
    const second = await request(app).post('/api/upload/file').set('Authorization', `Bearer ${token}`).attach('file', Buffer.from('%PDF-1.7\nsecond fixture'), 'second.pdf').expect(201);
    const firstBlock = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'download', title: 'Shared download', extra: { fileUrl: first.body.url, downloadName: 'Public guide.pdf', sizeBytes: first.body.size, mimeType: first.body.mimeType } }).expect(201);
    const secondBlock = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'download', title: 'Second download', extra: { fileUrl: first.body.url, downloadName: 'Second label.pdf' } }).expect(201);
    await request(app).delete('/api/upload/file').set('Authorization', `Bearer ${otherToken}`).send({ url: first.body.url }).expect(404);
    await request(app).delete(`/api/studio/blocks/${firstBlock.body.id}`).set('Authorization', `Bearer ${token}`).expect(200);
    await request(app).get(first.body.url).expect(200);
    await request(app).put(`/api/studio/blocks/${secondBlock.body.id}`).set('Authorization', `Bearer ${token}`).send({ extra: { fileUrl: second.body.url, downloadName: 'Renamed second.pdf', sizeBytes: second.body.size, mimeType: second.body.mimeType } }).expect(200);
    await request(app).get(first.body.url).expect(404);
    await request(app).get(second.body.url).expect(200);
    await request(app).delete(`/api/studio/blocks/${secondBlock.body.id}`).set('Authorization', `Bearer ${token}`).expect(200);
    await request(app).get(second.body.url).expect(404);
    expect(fs.existsSync(`${uploadsRoot}/${first.body.filename}`)).toBe(false);
    expect(fs.existsSync(`${uploadsRoot}/${second.body.filename}`)).toBe(false);
  });

  it('does not report a missing download as successful and rejects malformed download metadata', async () => {
    const missing = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'download', title: 'Missing download', extra: { downloadName: 'label.pdf' } }).expect(201);
    await request(app).get(`/r/${missing.body.id}`).expect(404);
    await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'download', title: 'Spoofed metadata', extra: { fileUrl: 'https://example.com/file.pdf', sizeBytes: 10, mimeType: 'text/html' } }).expect(400);
  });
});
