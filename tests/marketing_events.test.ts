import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';

describe('marketing funnel events', () => {
  beforeAll(() => initDatabase());

  it('accepts a validated anonymous event and stores only approved fields', async () => {
    const anonymousId = `anon_${Date.now()}_test`;
    const response = await request(app).post('/api/marketing/events').send({
      event: 'marketing_cta_clicked',
      anonymousId,
      sessionId: `ses_${Date.now()}_test`,
      route: '/',
      language: 'en',
      metadata: { source: 'hero_claim', count: 1 }
    });

    expect(response.status).toBe(202);
    const row = db.prepare('SELECT * FROM marketing_events WHERE id = ?').get(response.body.id) as any;
    expect(row.event_name).toBe('marketing_cta_clicked');
    expect(row.metadata_json).toContain('hero_claim');
    expect(row.metadata_json).not.toContain('email');
  });

  it('rejects unknown event names and anonymous writes without an identifier', async () => {
    const unknown = await request(app).post('/api/marketing/events').send({ event: 'made_up', route: '/', language: 'en', anonymousId: 'anon_invalid_test' });
    expect(unknown.status).toBe(400);

    const missingId = await request(app).post('/api/marketing/events').send({ event: 'template_previewed', route: '/templates', language: 'en' });
    expect(missingId.status).toBe(400);
  });

  it('deduplicates retries inside the same minute bucket', async () => {
    const payload = { event: 'template_previewed', anonymousId: `anon_retry_${Date.now()}`, sessionId: `ses_retry_${Date.now()}`, route: '/templates', language: 'en' };
    const first = await request(app).post('/api/marketing/events').send(payload);
    const second = await request(app).post('/api/marketing/events').send(payload);
    expect(first.status).toBe(202);
    expect(second.body.id).toBe(first.body.id);
    const count = db.prepare('SELECT COUNT(*) AS count FROM marketing_events WHERE id = ?').get(first.body.id) as { count: number };
    expect(count.count).toBe(1);
  });
});
