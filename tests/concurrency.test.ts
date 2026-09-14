import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db, initDatabase } from '../server/db.js';

describe('Concurrency & Race Condition Testing', () => {
  beforeAll(() => {
    initDatabase();
  });

  const testUsername = `race_${Date.now()}`;
  let userToken = '';
  let userProfileId = '';

  it('Simultaneous identical username registration race condition', async () => {
    const targetUsername = `target_${Date.now()}`;
    const concurrency = 6;

    // Fire 6 simultaneous registration requests with identical username
    const registrationPromises = Array.from({ length: concurrency }).map((_, i) =>
      request(app)
        .post('/api/auth/register')
        .send({
          email: `race_${i}_${Date.now()}@liinx.test`,
          password: 'Password123!',
          username: targetUsername
        })
    );

    const responses = await Promise.all(registrationPromises);

    const successResponses = responses.filter(r => r.status === 201);
    const conflictResponses = responses.filter(r => r.status === 409);

    // Exactly 1 must win the race condition and succeed
    expect(successResponses.length).toBe(1);
    // All other 5 must receive 409 Conflict
    expect(conflictResponses.length).toBe(concurrency - 1);

    // Verify in database that exactly 1 profile exists with this username
    const profiles = db.prepare('SELECT id FROM profiles WHERE username = ?').all(targetUsername);
    expect(profiles).toHaveLength(1);

    userToken = successResponses[0].body.token;
    userProfileId = successResponses[0].body.profileId;
  });

  it('Simultaneous newsletter subscriptions race condition', async () => {
    const targetEmail = `sub_race_${Date.now()}@gmail.com`;
    const concurrency = 8;

    // Fire 8 simultaneous subscription requests for the identical email
    const subscribePromises = Array.from({ length: concurrency }).map(() =>
      request(app)
        .post('/api/newsletter/subscribe')
        .send({
          profileId: userProfileId,
          email: targetEmail
        })
    );

    const responses = await Promise.all(subscribePromises);

    // All should successfully return with HTTP 200/201 (idempotent friendly handling)
    for (const res of responses) {
      expect(res.body.success).toBe(true);
    }

    // Verify in database that exactly 1 subscriber record was stored, no duplicates
    const records = db.prepare('SELECT id FROM newsletter_subscribers WHERE profile_id = ? AND email = ?').all(userProfileId, targetEmail);
    expect(records).toHaveLength(1);
  });

  it('Concurrent rapid block reordering stability', async () => {
    // Clear any starter blocks so we test a clean slate of 4 blocks
    db.prepare('DELETE FROM blocks WHERE profile_id = ?').run(userProfileId);

    // Create 4 blocks for the user
    const blockIds: string[] = [];
    for (let i = 0; i < 4; i++) {
      const res = await request(app)
        .post('/api/studio/blocks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'link',
          title: `Block ${i}`,
          url: `https://example.com/${i}`
        });
      blockIds.push(res.body.id);
    }

    // Fire 5 concurrent reorder requests shuffling the order
    const reorderPromises = [
      request(app).put('/api/studio/blocks/reorder').set('Authorization', `Bearer ${userToken}`).send({ blockIds: [blockIds[3], blockIds[2], blockIds[1], blockIds[0]] }),
      request(app).put('/api/studio/blocks/reorder').set('Authorization', `Bearer ${userToken}`).send({ blockIds: [blockIds[1], blockIds[0], blockIds[3], blockIds[2]] }),
      request(app).put('/api/studio/blocks/reorder').set('Authorization', `Bearer ${userToken}`).send({ blockIds: [blockIds[0], blockIds[1], blockIds[2], blockIds[3]] })
    ];

    const reorderResponses = await Promise.all(reorderPromises);
    for (const r of reorderResponses) {
      expect(r.status).toBe(200);
      expect(r.body.success).toBe(true);
    }

    // Verify all 4 blocks have valid distinct integer positions (0, 1, 2, 3)
    const blocksInDb = db.prepare('SELECT position FROM blocks WHERE profile_id = ? ORDER BY position ASC').all(userProfileId) as { position: number }[];
    expect(blocksInDb).toHaveLength(4);
    const positions = blocksInDb.map(b => b.position);
    expect(positions).toEqual([0, 1, 2, 3]);
  });
});
