import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db } from '../server/db.js';

describe('creator form inbox', () => {
  let token = '';
  let otherToken = '';
  let profileId = '';
  let formId = '';
  let otherFormId = '';
  let firstSubmissionId = '';

  beforeAll(async () => {
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const registration = await request(app).post('/api/auth/register').send({ email: `inbox-${unique}@liinx.test`, password: 'InboxPassword2026!', username: `inbox_${unique}`.slice(0, 30) }).expect(201);
    token = registration.body.token;
    profileId = registration.body.profileId;
    const other = await request(app).post('/api/auth/register').send({ email: `inbox-other-${unique}@liinx.test`, password: 'InboxPassword2026!', username: `other_inbox_${unique}`.slice(0, 30) }).expect(201);
    otherToken = other.body.token;
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    const pageId = studio.body.pages.find((page: { isHome: boolean }) => page.isHome).id;
    const form = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'form', title: 'Contact requests', extra: { fields: [{ name: 'email', label: 'Email address', type: 'email' }, { name: 'message', label: 'Message', type: 'textarea', required: false }] } }).expect(201);
    formId = form.body.id;
    const otherForm = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'form', title: 'Other form', extra: { fields: [{ name: 'name', label: 'Name', type: 'text' }] } }).expect(201);
    otherFormId = otherForm.body.id;
    const now = Date.now();
    const insert = db.prepare('INSERT INTO form_submissions (id, profile_id, block_id, fields_json, submission_key, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    const seed = db.transaction(() => {
      for (let index = 0; index < 505; index += 1) {
        const id = `inbox_submission_${unique}_${index}`;
        if (index === 504) firstSubmissionId = id;
        insert.run(id, profileId, formId, JSON.stringify({ email: index === 504 ? '=SUM(A1:A2)' : `person${index}@example.test`, message: `Message ${index}` }), null, now - index);
      }
      insert.run(`inbox_other_${unique}`, profileId, otherFormId, JSON.stringify({ name: 'Other response' }), null, now + 1);
    });
    seed();
  });

  it('paginates beyond the legacy 500-row slice and filters by form', async () => {
    const first = await request(app).get('/api/studio/form-submissions?page=1&pageSize=100').set('Authorization', `Bearer ${token}`).expect(200);
    expect(first.body.total).toBe(506);
    expect(first.body.submissions).toHaveLength(100);
    expect(first.body.hasMore).toBe(true);
    const last = await request(app).get('/api/studio/form-submissions?page=6&pageSize=100&blockId=' + encodeURIComponent(formId)).set('Authorization', `Bearer ${token}`).expect(200);
    expect(last.body.total).toBe(505);
    expect(last.body.submissions).toHaveLength(5);
    expect(last.body.hasMore).toBe(false);
    expect(last.body.submissions[4].fieldLabels.email).toBe('Email address');
  });

  it('exports the selected form with readable labels and neutralized formulas', async () => {
    const response = await request(app).get(`/api/studio/form-submissions/export?blockId=${encodeURIComponent(formId)}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.text).toContain('Submitted At,Form,Field,Value');
    expect(response.text).toContain('Email address');
    expect(response.text).toContain("'=SUM(A1:A2)");
    expect(response.text).not.toContain('Other response');
  });

  it('deletes only owned responses and returns not-found for another account', async () => {
    await request(app).delete(`/api/studio/form-submissions/${firstSubmissionId}`).set('Authorization', `Bearer ${otherToken}`).expect(404);
    await request(app).delete(`/api/studio/form-submissions/${firstSubmissionId}`).set('Authorization', `Bearer ${token}`).expect(200);
    await request(app).delete(`/api/studio/form-submissions/${firstSubmissionId}`).set('Authorization', `Bearer ${token}`).expect(404);
  });
});
