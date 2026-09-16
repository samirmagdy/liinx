import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';

describe('product and support-link cards', () => {
  let token = '';
  let username = '';
  let pageId = '';

  beforeAll(async () => {
    const unique = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    username = `products_${unique}`.slice(0, 30);
    const registration = await request(app).post('/api/auth/register').send({ email: `products-${unique}@liinx.test`, password: 'ProductsPassword2026!', username }).expect(201);
    token = registration.body.token;
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    pageId = studio.body.pages.find((page: any) => page.isHome).id;
  });

  it('persists product fields and uses a consistently formatted external checkout label', async () => {
    const product = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'product', title: 'Handmade notebook', extra: {
      description: 'A5 notebook with a linen cover.', imageUrl: 'https://example.com/notebook.jpg', priceAmount: '29.00', currency: 'USD', url: 'https://shop.example.test/notebook'
    } }).expect(201);
    const support = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'tips', title: 'Support the project', extra: { description: 'Use the external support page if you choose.', url: 'https://support.example.test/project' } }).expect(201);
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(publicProfile.body.blocks.find((block: any) => block.id === product.body.id)).toEqual(expect.objectContaining({ description: 'A5 notebook with a linen cover.', imageUrl: 'https://example.com/notebook.jpg', priceAmount: '29.00', currency: 'USD' }));
    expect(publicProfile.body.blocks.find((block: any) => block.id === support.body.id)).toEqual(expect.objectContaining({ description: 'Use the external support page if you choose.' }));
    await request(app).get(`/r/${product.body.id}`).expect(302).expect(response => expect(response.headers.location).toBe('https://shop.example.test/notebook'));
    await request(app).get(`/r/${support.body.id}`).expect(302).expect(response => expect(response.headers.location).toBe('https://support.example.test/project'));
  });

  it('rejects malformed price/currency or unsafe links and leaves missing actions unavailable', async () => {
    await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'product', title: 'Invalid price', extra: { priceAmount: '29.999', currency: 'US', url: 'https://shop.example.test' } }).expect(400);
    await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'tips', title: 'Unsafe support', extra: { url: 'javascript:alert(1)' } }).expect(400);
    const missing = await request(app).post('/api/studio/blocks').set('Authorization', `Bearer ${token}`).send({ pageId, type: 'product', title: 'Product without checkout', extra: { priceAmount: '0', currency: 'USD' } }).expect(201);
    await request(app).get(`/r/${missing.body.id}`).expect(404);
  });
});
