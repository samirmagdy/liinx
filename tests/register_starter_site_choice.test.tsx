import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import {
  SIGNUP_INTENTS,
  SIGNUP_INTENT_CATEGORIES,
  SITE_TEMPLATES,
  intentStartingCategory,
  registerSchema,
  siteTemplatesForIntent,
  type SignupIntent
} from '../shared/index.js';
import { translations } from '../src/config/i18n';
import { runtimeTranslations } from '../src/config/runtimeTranslations';
import { LanguageProvider } from '../src/context/LanguageContext';
import { StarterSiteChoices } from '../src/features/register/components/StarterSiteChoices';
import { starterSiteBlocks } from '../src/utils/starterSites';

if (typeof window === 'undefined') {
  (global as any).window = {
    location: { origin: 'https://raloa.test', href: 'https://raloa.test/register', search: '', pathname: '/register' },
    history: { replaceState: () => {} },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const rootDir = path.resolve(__dirname, '..');
const source = (relative: string) => fs.readFileSync(path.join(rootDir, relative), 'utf-8');
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

function renderChoices(language: 'en' | 'ar', intent: SignupIntent, selectedId: string | null): string {
  const templates = siteTemplatesForIntent(intent);
  const names = Object.fromEntries(templates.map(site => [
    site.id,
    translations[language].templatesSection.templates[site.id]?.name || site.name
  ]));
  return renderToString(
    <LanguageProvider initialLanguage={language}>
      <StarterSiteChoices
        templates={templates}
        names={names}
        selectedId={selectedId}
        onSelect={() => {}}
        isHydrated
      />
    </LanguageProvider>
  );
}

const CHOICE_LABELS = [
  'Choose a starter site',
  'Start with an empty page',
  'Default theme, nothing filled in',
  'No starter blocks. You add every link yourself.',
  'Step 2 of 2: Choose your focus discipline and the starter site to build on.',
  'Create my site'
];

describe('signup starter site choice', () => {
  it('offers every starter site to the discipline it was written for', () => {
    for (const intent of SIGNUP_INTENTS) {
      expect(siteTemplatesForIntent(intent).length, `no starter site for ${intent}`).toBeGreaterThan(0);
    }
    for (const template of SITE_TEMPLATES) {
      expect(siteTemplatesForIntent(template.intent).map(site => site.id)).toContain(template.id);
    }
  });

  it('draws each card from the composition the server will write', () => {
    for (const intent of SIGNUP_INTENTS) {
      const html = renderChoices('en', intent, null);
      for (const template of siteTemplatesForIntent(intent)) {
        expect(html, `${intent} is missing ${template.name}`).toContain(escape(template.name));
        // A spacer is height on the page, not a caption, so it renders without a title.
        for (const block of starterSiteBlocks(template).filter(item => item.type !== 'spacer')) {
          expect(html, `${template.name} is missing "${block.title}"`).toContain(escape(block.title));
        }
      }
      expect(html, `${intent} borrows somebody's photograph`).not.toContain('unsplash');
    }
  });

  it('marks exactly one choice as selected', () => {
    const empty = renderChoices('en', 'creator', null);
    expect(empty.match(/aria-pressed="true"/g)).toHaveLength(1);
    const first = siteTemplatesForIntent('creator')[0];
    const chosen = renderChoices('en', 'creator', first.id);
    expect(chosen.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(chosen).toContain(escape(first.name));
  });

  it('labels the choice in Arabic without leaking the English key', () => {
    const arabic = renderChoices('ar', 'creator', null);
    expect(arabic).toContain(escape('ابدأ بصفحة فارغة'));
    expect(arabic).not.toContain('Start with an empty page');
    for (const template of siteTemplatesForIntent('creator')) {
      const name = translations.ar.templatesSection.templates[template.id]?.name;
      expect(name, `${template.id} has no Arabic name`).toBeTruthy();
      expect(arabic).toContain(escape(name!));
      expect(arabic).not.toContain(escape(template.name));
    }
  });

  it('carries Arabic for every label the choice can show', () => {
    for (const label of CHOICE_LABELS) {
      const arabic = runtimeTranslations[label];
      expect(arabic, `${label} has no Arabic`).toBeTruthy();
      expect(arabic, `${label} maps to itself`).not.toBe(label);
    }
  });

  it('keeps the shared discipline list and its categories in step', () => {
    expect(Object.keys(SIGNUP_INTENT_CATEGORIES).sort()).toEqual([...SIGNUP_INTENTS].sort());
    for (const intent of SIGNUP_INTENTS) {
      expect(intentStartingCategory(intent)).toBe(SIGNUP_INTENT_CATEGORIES[intent]);
    }
    expect(intentStartingCategory('astronaut')).toBeUndefined();
    expect(intentStartingCategory(undefined)).toBeUndefined();
  });

  it('accepts a real discipline and rejects one the catalogue does not collect', () => {
    const base = { email: 'signup@raloa.test', password: 'StarterSitePassword2026!', username: 'signupintent' };
    expect(registerSchema.safeParse({ ...base, intent: 'musician' }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, intent: 'astronaut' }).success).toBe(false);
  });

  it('sends the choice with the registration instead of a second swallowed profile write', () => {
    const flow = source('src/features/register/hooks/useSignupFlow.ts');
    expect(flow).toContain('intent: choice.selectedIntent');
    expect(flow).toContain('templateId: choice.selectedTemplateId');
    expect(source('src/services/api.ts')).toContain('agencyReferral, ...starterSite');
    expect(source('src/context/AuthContext.tsx')).toContain('api.auth.register(email, pass, username, starterSite)');

    // The old shortcut wrote a theme id and reported no error when it failed.
    const signup = `${source('src/pages/RegisterPage.tsx')}${flow}${source('src/features/register/components/SignupStarterSiteStep.tsx')}`;
    expect(signup).not.toContain('updateProfile');
    expect(signup).not.toContain('catch {}');
    expect(signup).not.toContain('selectedThemeId');
    expect(signup).not.toContain('THEMES.slice');
    expect(source('src/features/register/components/SignupStarterSiteStep.tsx')).toContain('<StarterSiteChoices');
  });
});
