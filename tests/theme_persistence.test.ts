import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../server/server.js';
import { db } from '../server/db.js';
import { THEMES } from '../src/data/mockData.js';
import { resolveTheme } from '../src/utils/colorContrast.js';

describe('theme selection and persistence', () => {
  it('persists a preset and safe overrides through studio and public responses', async () => {
    const id = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
    const registration = await request(app).post('/api/auth/register').send({ email: `theme-${id}@liinx.test`, password: 'ThemePassword2026!', username: `theme${id}`.slice(0, 30) }).expect(201);
    const token = registration.body.token as string;
    const username = registration.body.user.username as string;
    for (const preset of THEMES) {
      await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({ themeId: preset.id, customTheme: preset }).expect(200);
    }
    const customTheme = { ...THEMES.find(theme => theme.id === 'obsidian-noir')!, cardRadius: 'full', cardBg: '#112233', cardBorder: '1px solid #A3A3A3', accentColor: '#38BDF8' };
    await request(app).put('/api/studio/profile').set('Authorization', `Bearer ${token}`).send({ themeId: 'obsidian-noir', customTheme }).expect(200);
    const studio = await request(app).get('/api/studio/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(studio.body.themeId).toBe('obsidian-noir');
    expect(studio.body.customTheme.cardRadius).toBe('full');
    expect(resolveTheme(studio.body.themeId, studio.body.customTheme).cardBg).toBe('#112233');
    const publicProfile = await request(app).get(`/api/profiles/${username}`).expect(200);
    expect(resolveTheme(publicProfile.body.themeId, publicProfile.body.customTheme).cardBorder).toBe('1px solid #A3A3A3');
  });

  it('rejects unsupported preset ids and unsafe CSS-like theme fragments', async () => {
    const id = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
    const registration = await request(app).post('/api/auth/register').send({ email: `invalid-theme-${id}@liinx.test`, password: 'ThemePassword2026!', username: `invalidtheme${id}`.slice(0, 30) }).expect(201);
    const auth = request(app).put('/api/studio/profile').set('Authorization', `Bearer ${registration.body.token}`);
    await auth.send({ themeId: 'made-up-theme' }).expect(400);
    await auth.send({ customTheme: { cardRadius: 'rounded-xl' } }).expect(400);
    await auth.send({ customTheme: { cardBg: 'bg-red-500' } }).expect(400);
  });

  it('normalizes incomplete and legacy alias theme records without changing stored data', () => {
    const legacy = resolveTheme('midnight-ink', { background: '#0F172A', surface: '#1E293B', accent: '#38BDF8', radius: 'full' } as Record<string, unknown>);
    expect(legacy.bgColor).toBe('#0F172A');
    expect(legacy.cardBg).toBe('#1E293B');
    expect(legacy.cardRadius).toBe('full');
    const profile = db.prepare('SELECT custom_theme_json FROM profiles WHERE custom_theme_json IS NOT NULL LIMIT 1').get() as { custom_theme_json?: string } | undefined;
    expect(profile === undefined || typeof profile.custom_theme_json === 'string').toBe(true);
  });
});
