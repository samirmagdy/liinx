import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { SETUP_STEPS, type SetupProgress, type SetupStepId } from '../shared/index.js';
import { runtimeTranslations } from '../src/config/runtimeTranslations';
import { LanguageProvider } from '../src/context/LanguageContext';
import { CapabilitiesProvider } from '../src/context/CapabilitiesContext';
import { ProductFeedbackProvider } from '../src/components/ProductFeedback';
import { BuilderProvider } from '../src/features/builder/context/BuilderContext';
import { SetupMilestoneCard } from '../src/features/builder/components/panels/SetupMilestoneCard';
import { CHECKLIST_ROWS, SetupChecklist } from '../src/features/builder/components/panels/SetupChecklist';
import { PublishSharePrompt } from '../src/features/builder/components/share/PublishSharePrompt';
import { INSTAGRAM_PROFILE_EDIT_URL, whatsappShareUrl } from '../src/features/builder/utils/shareLinks';
import { notifyPagePublished, onPagePublished } from '../src/features/builder/utils/publishEvents';
import { TEST_CREATOR_PROFILE } from './fixtures/testProfiles';
import type { CreatorProfile } from '../src/types';

if (typeof window === 'undefined') {
  (global as any).window = {
    location: { origin: 'https://raloa.test', href: 'https://raloa.test/studio', search: '', pathname: '/studio' },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    open: () => null,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const rootDir = path.resolve(__dirname, '..');
const source = (relative: string) => fs.readFileSync(path.join(rootDir, relative), 'utf-8');
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

const stepStates = (value: boolean): Record<SetupStepId, boolean> =>
  Object.fromEntries(SETUP_STEPS.map(step => [step, value])) as Record<SetupStepId, boolean>;

const progress = (overrides: Partial<SetupProgress> = {}): SetupProgress => ({
  steps: stepStates(false),
  done: 0,
  total: SETUP_STEPS.length,
  complete: false,
  dismissedAt: null,
  milestones: [],
  ...overrides
});

const render = (setup: SetupProgress | undefined, language: 'en' | 'ar' = 'en', profileExtra: Partial<CreatorProfile> = {}) => renderToString(
  <LanguageProvider initialLanguage={language}>
    <CapabilitiesProvider>
      <ProductFeedbackProvider>
        <BuilderProvider initialProfile={{ ...TEST_CREATOR_PROFILE, id: 'prof_checklist', setup, ...profileExtra } as CreatorProfile}>
          <SetupChecklist />
        </BuilderProvider>
      </ProductFeedbackProvider>
    </CapabilitiesProvider>
  </LanguageProvider>
);

describe('setup checklist', () => {
  it('shows one row per step the server reports', () => {
    expect(CHECKLIST_ROWS.map(row => row.id)).toEqual([...SETUP_STEPS]);
    const html = render(progress({ done: 1, steps: { ...progress().steps, published: true } }));
    expect(html).toContain(escape('Finish your page'));
    for (const row of CHECKLIST_ROWS) expect(html).toContain(escape(row.label));
    // Only the unfinished rows offer to move you.
    expect(html.match(/>Go</g)).toHaveLength(SETUP_STEPS.length - 1);
    expect(html).not.toContain('Your site is ready');
  });

  it('becomes the share card once every step is stored as done', () => {
    const allDone = stepStates(true);
    const html = render(progress({ steps: allDone, done: SETUP_STEPS.length, complete: true }));
    expect(html).toContain(escape('Your site is ready'));
    expect(html).not.toContain('Finish your page');
    expect(html).toContain(escape('Copy Link'));
    expect(html).toContain(escape('QR Code'));
    expect(html).toContain('wa.me');
    expect(html).toContain(escape('Add to Instagram bio'));
    expect(html).toContain('raloa.test/@');
  });

  it('stays away from a creator who hid it or whose profile has not loaded', () => {
    expect(render(progress({ dismissedAt: 1700000000000 }))).not.toContain('Finish your page');
    expect(render(undefined)).not.toContain('Finish your page');
  });

  it('speaks Arabic for every row and action', () => {
    const arabic = render(progress(), 'ar');
    expect(arabic).toContain(escape('أنهِ صفحتك'));
    expect(arabic).toContain(escape('أضف صورتك'));
    expect(arabic).not.toContain('Finish your page');
    for (const label of [...CHECKLIST_ROWS.map(row => row.label), 'Finish your page', 'Setup progress', 'Your site is ready', 'Go', 'Hide']) {
      const value = runtimeTranslations[label];
      expect(value, `${label} has no Arabic`).toBeTruthy();
      expect(value, `${label} maps to itself`).not.toBe(label);
    }
  });

  it('builds every share target from the address a visitor opens', () => {
    expect(whatsappShareUrl('https://raloa.app/@someone', 'My Page')).toBe(
      `https://wa.me/?text=${encodeURIComponent('My Page https://raloa.app/@someone')}`
    );
    expect(whatsappShareUrl('https://raloa.app/@someone', 'صفحتي')).toContain(encodeURIComponent('صفحتي'));
    expect(INSTAGRAM_PROFILE_EDIT_URL).toBe('https://www.instagram.com/accounts/edit/');

    const custom = render(progress({
      steps: stepStates(true), done: SETUP_STEPS.length, complete: true
    }), 'en', { customDomain: 'links.example.com', plan: 'pro' } as any);
    expect(custom).toContain('https://links.example.com/');
    expect(custom).not.toContain('/@');
  });
});

describe('publish event', () => {
  it('reaches a listener only while it is subscribed', () => {
    const seen: string[] = [];
    const unsubscribe = onPagePublished(pageId => seen.push(pageId));
    notifyPagePublished('page_1');
    unsubscribe();
    notifyPagePublished('page_2');
    expect(seen).toEqual(['page_1']);
  });

  it('fires on the publish transition, not on every save, and never from the button itself', () => {
    const pages = source('src/features/builder/hooks/usePages.ts');
    expect(pages).toContain('if (payload.published && !activePage.published) notifyPagePublished(');
    expect(source('src/features/builder/components/pages/PageManager.tsx')).not.toContain('notifyPagePublished');
    expect(source('src/features/builder/components/share/PublishSharePrompt.tsx')).toContain('onPagePublished(');
  });

  it('says nothing until a page has actually been published', () => {
    const html = renderToString(
      <LanguageProvider>
        <PublishSharePrompt />
      </LanguageProvider>
    );
    expect(html).not.toContain('Your page is live');
    expect(html).not.toContain('wa.me');
  });
});

describe('milestone card', () => {
  const renderCard = (milestones: SetupProgress['milestones'], language: 'en' | 'ar' = 'en') => renderToString(
    <LanguageProvider initialLanguage={language}>
      <CapabilitiesProvider>
        <ProductFeedbackProvider>
          <BuilderProvider initialProfile={{ ...TEST_CREATOR_PROFILE, setup: progress({ milestones }) } as CreatorProfile}>
            <SetupMilestoneCard />
          </BuilderProvider>
        </ProductFeedbackProvider>
      </CapabilitiesProvider>
    </LanguageProvider>
  );

  it('reports only what the tables hold, once per milestone', () => {
    expect(renderCard([])).not.toContain('Someone opened your page');
    expect(renderCard([{ id: 'first_view', eventId: 'vw_1' }])).toContain(escape('Someone opened your page.'));
    const tapped = renderCard([{ id: 'first_click', eventId: 'ck_1' }]);
    expect(tapped).toContain(escape('Someone tapped one of your links.'));
    expect(tapped).toContain(escape('Got it'));
    expect(renderCard([{ id: 'first_subscriber', eventId: 'ns_1' }], 'ar')).toContain(escape('اشترك أحدهم في قائمتك.'));
  });

  it('has Arabic for every milestone line', () => {
    for (const label of ['Someone opened your page.', 'Someone tapped one of your links.', 'Someone subscribed to your list.', 'Got it', 'We could not record that. Please try again.']) {
      const value = runtimeTranslations[label];
      expect(value, `${label} has no Arabic`).toBeTruthy();
      expect(value, `${label} maps to itself`).not.toBe(label);
    }
  });
});
