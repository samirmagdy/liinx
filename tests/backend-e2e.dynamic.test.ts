import { beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { initDatabase } from '../server/db.js';
import { confirmNewsletter } from './helpers/newsletterEmail.js';

vi.mock('../server/services/email.js', async () => {
  const { captureTransactionalEmail } = await import('./helpers/newsletterEmail.js');
  return { sendTransactionalEmail: vi.fn(captureTransactionalEmail) };
});


/**
 * Stateful backend journey.
 *
 * Every important identifier in this test is read from the preceding API
 * response. No profile, page, block, or session ID is fabricated by the test.
 */
describe('Dynamic Backend E2E — chained real API workflow', () => {
  beforeAll(() => initDatabase());

  it('completes a creator lifecycle using only API response state', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const credentials = {
      email: `dynamic_${unique}@liinx.test`,
      password: 'DynamicCreatorPassword2026!',
      username: `dynamic_${unique}`.slice(0, 30)
    };
    const portfolioSlug = `portfolio-${Date.now()}`;

    // Registration response becomes the authentication state for every next call.
    const registration = await request(app).post('/api/auth/register').send(credentials).expect(201);
    const authToken = registration.body.token as string;
    const profileId = registration.body.profileId as string;
    expect(authToken).toBeTruthy();
    expect(profileId).toBeTruthy();

    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${authToken}`);

    const session = await auth(request(app).get('/api/auth/me')).expect(200);
    expect(session.body.profile.id).toBe(profileId);
    expect(session.body.profile.username).toBe(credentials.username);

    const initialStudio = await auth(request(app).get('/api/studio/profile')).expect(200);
    const homePage = initialStudio.body.pages.find((page: any) => page.isHome);
    expect(homePage?.id).toBeTruthy();

    const createdPage = await auth(request(app).post('/api/studio/pages')).send({
      title: 'Portfolio',
      slug: portfolioSlug,
      description: 'Selected work and case studies.'
    });
    expect(createdPage.status, JSON.stringify(createdPage.body)).toBe(201);
    const portfolioPage = createdPage.body.page;
    expect(portfolioPage.id).toBeTruthy();
    expect(portfolioPage.slug).toMatch(/^portfolio-/);

    // The page ID comes from page creation and is used for the next writes.
    const portfolioBlock = await auth(request(app).post('/api/studio/blocks')).send({
      pageId: portfolioPage.id,
      type: 'link',
      title: 'Portfolio case study',
      url: 'https://example.com/case-study',
      subtitle: 'A real page-scoped link'
    }).expect(201);
    const portfolioBlockId = portfolioBlock.body.id as string;
    expect(portfolioBlock.body.pageId).toBe(portfolioPage.id);

    const formBlock = await auth(request(app).post('/api/studio/blocks')).send({
      pageId: portfolioPage.id,
      type: 'form',
      title: 'Project inquiry',
      extra: { fields: [{ name: 'name', label: 'Name', type: 'text', required: true }, { name: 'email', label: 'Email', type: 'email', required: true }] }
    }).expect(201);
    const formBlockId = formBlock.body.id as string;

    // Read the newly persisted collection, then derive the reorder payload from it.
    const afterCreate = await auth(request(app).get('/api/studio/profile')).expect(200);
    const portfolioBlocks = afterCreate.body.blocks.filter((block: any) => block.pageId === portfolioPage.id);
    expect(portfolioBlocks.map((block: any) => block.id)).toEqual(expect.arrayContaining([portfolioBlockId, formBlockId]));

    const reorderedIds = [...portfolioBlocks].reverse().map((block: any) => block.id);
    await auth(request(app).put('/api/studio/blocks/reorder')).send({ pageId: portfolioPage.id, blockIds: reorderedIds }).expect(200);

    // Update uses the ID returned by block creation, then the public API proves persistence.
    await auth(request(app).put(`/api/studio/blocks/${portfolioBlockId}`)).send({
      title: 'Updated portfolio case study'
    }).expect(200);

    const publicPortfolio = await request(app).get(`/api/profiles/${credentials.username}?page=${portfolioPage.slug}`).expect(200);
    expect(publicPortfolio.body.page.id).toBe(portfolioPage.id);
    expect(publicPortfolio.body.blocks.map((block: any) => block.id)).toEqual(expect.arrayContaining([portfolioBlockId, formBlockId]));
    expect(publicPortfolio.body.blocks.find((block: any) => block.id === portfolioBlockId).title).toBe('Updated portfolio case study');

    // Form submission uses the profile and form IDs returned by previous calls.
    await request(app).post('/api/forms/submit').send({
      profileId,
      blockId: formBlockId,
      fields: { name: 'A real visitor', email: `visitor_${unique}@example.com` }
    }).expect(201);

    // A tracked redirect returns the URL persisted in the block response/update path.
    const redirect = await request(app).get(`/r/${portfolioBlockId}`).expect(302);
    expect(redirect.headers.location).toBe('https://example.com/case-study');

    const analytics = await auth(request(app).get('/api/analytics/stats')).expect(200);
    expect(analytics.body.totalClicks).toBeGreaterThanOrEqual(1);

    // Unpublishing the page changes the next public API result, then republishing
    // restores it; this verifies an actual state transition, not only a response shape.
    await auth(request(app).put(`/api/studio/pages/${portfolioPage.id}`)).send({ published: false }).expect(200);
    await request(app).get(`/api/profiles/${credentials.username}?page=${portfolioPage.slug}`).expect(404);
    await auth(request(app).put(`/api/studio/pages/${portfolioPage.id}`)).send({ published: true }).expect(200);
    await request(app).get(`/api/profiles/${credentials.username}?page=${portfolioPage.slug}`).expect(200);

    // Deleting the page invokes the real server-side migration of its blocks to Home.
    await auth(request(app).delete(`/api/studio/pages/${portfolioPage.id}`)).expect(200);
    const afterDelete = await auth(request(app).get('/api/studio/profile')).expect(200);
    expect(afterDelete.body.blocks.filter((block: any) => block.id === portfolioBlockId)[0].pageId).toBe(homePage.id);
    await request(app).get(`/api/profiles/${credentials.username}?page=${portfolioPage.slug}`).expect(404);
  });

  it('rejects HTML disguised as a document upload through the real multipart endpoint', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const registration = await request(app).post('/api/auth/register').send({
      email: `upload_${unique}@liinx.test`,
      password: 'DynamicUploadPassword2026!',
      username: `upload_${unique}`.slice(0, 30)
    }).expect(201);

    await request(app)
      .post('/api/upload/file')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .attach('file', Buffer.from('<!doctype html><script>window.pwned=1</script>'), 'review.pdf')
      .expect(400);
  });

  it('exercises the advanced block catalogue, newsletter export, and Studio REST API', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const registration = await request(app).post('/api/auth/register').send({
      email: `catalogue_${unique}@liinx.test`,
      password: 'DynamicCataloguePassword2026!',
      username: `catalogue_${unique}`.slice(0, 30)
    }).expect(201);
    const token = registration.body.token as string;
    const profileId = registration.body.profileId as string;
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);
    const createBlock = async (payload: Record<string, unknown>) => auth(request(app).post('/api/studio/blocks')).send(payload).expect(201);

    const presets: Array<Record<string, unknown>> = [
      { type: 'rich_text', title: 'Story', extra: { body: '**Bold story**' } },
      { type: 'image', title: 'Portrait', extra: { imageUrl: 'https://example.com/portrait.jpg', alt: 'Portrait' } },
      { type: 'gallery', title: 'Gallery', extra: { items: [{ id: 'gallery-1', imageUrl: 'https://example.com/a.jpg', alt: 'A', caption: 'Caption A' }] } },
      { type: 'carousel', title: 'Carousel', extra: { items: [{ id: 'carousel-1', imageUrl: 'https://example.com/b.jpg', alt: 'B' }] } },
      { type: 'spacer', title: 'Spacer', extra: { height: 64 } },
      { type: 'download', title: 'Download', extra: { fileUrl: 'https://example.com/file.pdf', downloadName: 'file.pdf' } },
      { type: 'map', title: 'Location', extra: { location: 'Riyadh' } },
      { type: 'faq', title: 'FAQ', extra: { items: [{ id: 'faq-1', question: 'Q', answer: 'A' }] } },
      { type: 'testimonials', title: 'Testimonials', extra: { items: [{ id: 'testimonial-1', quote: 'Excellent', name: 'Client' }] } },
      { type: 'event', title: 'Event', extra: { date: '2026-10-01', url: 'https://example.com/event' } },
      { type: 'presave', title: 'Pre-save', extra: { url: 'https://example.com/presave' } },
      { type: 'phone', title: 'Phone', extra: { phone: '+966500000000' } },
      { type: 'product', title: 'Product', extra: { price: '$20', url: 'https://example.com/product' } },
      { type: 'tips', title: 'Tips', extra: { url: 'https://example.com/tips' } },
      { type: 'content_gate', title: 'Members', extra: { password: 'correct-horse', body: 'Private material' } }
    ];
    const createdIds: string[] = [];
    for (const preset of presets) {
      const response = await createBlock(preset);
      createdIds.push(response.body.id as string);
    }

    const publicProfile = await request(app).get(`/api/profiles/${registration.body.user.username}`).expect(200);
    const publicTypes = publicProfile.body.blocks.map((block: any) => block.type);
    for (const preset of presets) expect(publicTypes).toContain(preset.type);
    const gateId = createdIds[createdIds.length - 1];
    const gate = await request(app).post('/api/content-gates/verify').send({ profileId, blockId: gateId, password: 'correct-horse' }).expect(200);
    expect(gate.body.body).toBe('Private material');

    const newsletter = await createBlock({ type: 'newsletter', title: 'Dispatch', extra: { description: 'Updates', buttonText: 'Join' } });
    const newsletterEmail = `reader_${unique}@example.com`;
    await request(app).post('/api/newsletter/subscribe').send({ profileId, blockId: newsletter.body.id, email: newsletterEmail, consent: true }).expect(202);
    await confirmNewsletter(app, newsletterEmail);
    const exportResponse = await auth(request(app).get('/api/studio/subscribers/export')).expect(200);
    expect(exportResponse.text).toContain(`reader_${unique}@example.com`);

    await auth(request(app).put('/api/studio/plan')).send({ plan: 'studio' }).expect(200);
    const keyResponse = await auth(request(app).post('/api/studio/api-keys')).send({ name: 'dynamic-e2e-key' }).expect(201);
    const apiKey = keyResponse.body.apiKey as string;
    const v1Profile = await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${apiKey}`).expect(200);
    expect(v1Profile.body.id).toBe(profileId);
    const v1Block = await request(app).post('/api/v1/blocks').set('Authorization', `Bearer ${apiKey}`).send({ title: 'REST-created link', url: 'https://example.com/rest' }).expect(201);
    const keyId = keyResponse.body.key.id as string;
    expect(v1Block.body.block.id).toBeTruthy();
    await auth(request(app).delete(`/api/studio/api-keys/${keyId}`)).expect(200);
    await request(app).get('/api/v1/profile').set('Authorization', `Bearer ${apiKey}`).expect(401);
  });

  it('chains multi-profile creation and active-profile switching', async () => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const registration = await request(app).post('/api/auth/register').send({
      email: `profiles_${unique}@liinx.test`,
      password: 'DynamicProfilesPassword2026!',
      username: `profiles_${unique}`.slice(0, 30)
    }).expect(201);
    let token = registration.body.token as string;
    const primaryProfileId = registration.body.profileId as string;
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

    await auth(request(app).put('/api/studio/plan')).send({ plan: 'pro' }).expect(200);
    const created = await auth(request(app).post('/api/studio/profiles')).send({ username: `secondary_${unique}`.slice(0, 30), displayName: 'Secondary Profile' }).expect(201);
    expect(created.body.profile.id).toBeTruthy();
    token = created.body.token as string;
    const secondaryStudio = await auth(request(app).get('/api/studio/profile')).expect(200);
    expect(secondaryStudio.body.id).toBe(created.body.profile.id);

    const profiles = await auth(request(app).get('/api/studio/profiles')).expect(200);
    expect(profiles.body.profiles.map((profile: any) => profile.id)).toEqual(expect.arrayContaining([primaryProfileId, created.body.profile.id]));
    const switched = await auth(request(app).post(`/api/studio/profiles/${primaryProfileId}/select`)).expect(200);
    token = switched.body.token as string;
    const primaryStudio = await auth(request(app).get('/api/studio/profile')).expect(200);
    expect(primaryStudio.body.id).toBe(primaryProfileId);
  });
});
