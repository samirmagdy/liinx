import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db } from '../server/db.js';

describe('form submission pipeline', () => {
  let token = '';
  let profileId = '';
  let username = '';
  let homePageId = '';
  let publicFormId = '';
  let publicFormWithConsentId = '';

  beforeAll(async () => {
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    username = `form_submit_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({ email: `${username}@liinx.test`, password: 'FormSubmissionPassword2026!', username }).expect(201);
    token = registration.body.token;
    profileId = registration.body.profileId;
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    homePageId = studio.body.pages.find((page: { isHome: boolean }) => page.isHome).id;
    const form = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId: homePageId, type: 'form', title: 'Inquiry', extra: { fields: [{ id: 'name_id', name: 'name', label: 'Name', type: 'text', required: true, maxLength: 40 }, { id: 'email_id', name: 'email', label: 'Email', type: 'email', required: true }] } }).expect(201);
    publicFormId = form.body.id;
    const consentForm = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId: homePageId, type: 'form', title: 'Consent inquiry', extra: { consentRequired: true, consentText: 'I agree to this response being stored.', fields: [{ name: 'message', label: 'Message', type: 'textarea', required: true }] } }).expect(201);
    publicFormWithConsentId = consentForm.body.id;
  });

  it('accepts valid data once and makes repeated clicks idempotent', async () => {
    const submissionKey = `submission_${Date.now()}_one`;
    const payload = { profileId, blockId: publicFormId, submissionKey, fields: { name: 'A creator', email: 'visitor@example.test' } };
    await request(app).post('/api/forms/submit').send(payload).expect(201);
    const duplicate = await request(app).post('/api/forms/submit').send(payload).expect(200);
    expect(duplicate.body.duplicate).toBe(true);
    expect((db.prepare('SELECT COUNT(*) AS count FROM form_submissions WHERE block_id = ? AND submission_key = ?').get(publicFormId, submissionKey) as { count: number }).count).toBe(1);
  });

  it('rejects malformed, missing, unknown, and removed fields without persistence', async () => {
    const invalid = { profileId, blockId: publicFormId, fields: { name: '', email: 'not-an-email', extra: 'unexpected' } };
    await request(app).post('/api/forms/submit').send(invalid).expect(400);
    await request(app).post('/api/forms/submit').send({ profileId, blockId: publicFormId, fields: { name: 'Only name' } }).expect(400);
    await request(app).put(`/api/studio/blocks/${publicFormId}`).set('Authorization', `Bearer ${token}`).send({ extra: { fields: [{ name: 'name', label: 'Name', type: 'text', required: false }] } }).expect(200);
    await request(app).post('/api/forms/submit').send({ profileId, blockId: publicFormId, fields: { name: 'Valid', email: 'removed@example.test' } }).expect(400);
    expect((db.prepare('SELECT COUNT(*) AS count FROM form_submissions WHERE block_id = ?').get(publicFormId) as { count: number }).count).toBe(1);
  });

  it('requires explicit consent only when the creator enables it', async () => {
    await request(app).post('/api/forms/submit').send({ profileId, blockId: publicFormWithConsentId, fields: { message: 'Please call me.' } }).expect(400);
    await request(app).post('/api/forms/submit').send({ profileId, blockId: publicFormWithConsentId, consent: true, fields: { message: 'Please call me.' } }).expect(201);
  });

  it('does not submit empty forms or forms on unpublished pages', async () => {
    const empty = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId: homePageId, type: 'form', title: 'Empty', extra: { fields: [] } }).expect(201);
    await request(app).post('/api/forms/submit').send({ profileId, blockId: empty.body.id, fields: {} }).expect(409);
    const page = await request(app).post('/api/studio/pages').set('Authorization', `Bearer ${token}`).send({ title: 'Draft', slug: `draft-${Date.now()}` }).expect(201);
    await request(app).put(`/api/studio/pages/${page.body.page.id}`).set('Authorization', `Bearer ${token}`).send({ published: false }).expect(200);
    const hidden = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId: page.body.page.id, type: 'form', title: 'Hidden', extra: { fields: [{ name: 'message', label: 'Message', type: 'textarea' }] } }).expect(201);
    await request(app).post('/api/forms/submit').send({ profileId, blockId: hidden.body.id, fields: { message: 'Should not save' } }).expect(404);
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.some((block: { id: string }) => block.id === hidden.body.id)).toBe(false);
  });
});
