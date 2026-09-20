import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';

describe('form field editor contract and submission behavior', () => {
  let token = '';
  let profileId = '';
  let pageId = '';
  let username = '';

  beforeAll(async () => {
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    username = `form_fields_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({
      email: `form-fields-${unique}@raloa.test`, password: 'FormFieldsPassword2026!', username
    }).expect(201);
    token = registration.body.token;
    profileId = registration.body.profileId;
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    pageId = studio.body.pages.find((page: { isHome: boolean }) => page.isHome).id;
  });

  it('round-trips field identity, ordering, help, limits, and required flags', async () => {
    const fields = [
      { id: 'name_field', name: 'name', label: 'Full name', type: 'text', required: true, maxLength: 80, helpText: 'Use your preferred name.' },
      { id: 'message_field', name: 'message', label: 'Message', type: 'textarea', required: false, minLength: 5, maxLength: 500, helpText: 'Tell us what you need.' }
    ];
    const created = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'form', title: 'Contact', extra: { fields } }).expect(201);
    const blockId = created.body.id;
    const profile = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    const saved = profile.body.blocks.find((block: { id: string }) => block.id === blockId);
    expect(saved.fields).toEqual(fields);

    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.find((block: { id: string }) => block.id === blockId).fields).toEqual(fields);

    const reordered = [fields[1], fields[0]];
    await request(app).put(`/api/studio/blocks/${blockId}`).set('Authorization', `Bearer ${token}`).send({ extra: { fields: reordered } }).expect(200);
    const afterUpdate = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(afterUpdate.body.blocks.find((block: { id: string }) => block.id === blockId).fields.map((field: { id: string }) => field.id)).toEqual(['message_field', 'name_field']);
  });

  it('rejects empty, duplicate, and excessive field definitions', async () => {
    const base = { pageId, type: 'form', title: 'Invalid form' };
    await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ ...base, extra: { fields: [{ name: '', label: 'Missing name', type: 'text' }] } }).expect(400);
    await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ ...base, extra: { fields: [{ name: 'Email', label: 'One', type: 'text' }, { name: 'email', label: 'Two', type: 'text' }] } }).expect(400);
    const tooMany = Array.from({ length: 21 }, (_, index) => ({ name: `field_${index}`, label: `Field ${index}`, type: 'text' }));
    await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ ...base, extra: { fields: tooMany } }).expect(400);
  });

  it('defaults legacy required fields and enforces configured lengths on the server', async () => {
    const created = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'form', title: 'Legacy form', extra: { fields: [{ name: 'email', label: 'Email', type: 'email' }, { name: 'note', label: 'Note', type: 'textarea', required: false, maxLength: 5 }] } }).expect(201);
    const blockId = created.body.id;
    await request(app).post('/api/forms/submit').send({ profileId, blockId, fields: { note: 'short' } }).expect(400);
    await request(app).post('/api/forms/submit').send({ profileId, blockId, fields: { email: 'person@example.test', note: 'too long' } }).expect(400);
    await request(app).post('/api/forms/submit').send({ profileId, blockId, fields: { email: 'person@example.test', note: 'okay' } }).expect(201);
  });
});
