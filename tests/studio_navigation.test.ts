import { describe, expect, it } from 'vitest';
import { runtimeTranslations } from '../src/config/runtimeTranslations';
import {
  STUDIO_TABS,
  SETTINGS_SECTIONS,
  UPGRADE_COPY,
  minimumPlanFor,
  planUnlocks
} from '../src/features/builder/config/studioNavigation';
import { type UpgradeCapability } from '../src/features/builder/types/builder.types';

const arabic = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Tab and dialog copy lives in a data file and is looked up as ui(label), so the ui('…')
 * parity ratchet never sees it. This does.
 */
describe('Studio navigation labels are translatable', () => {
  const labels = [
    ...STUDIO_TABS.flatMap(tab => [tab.label, tab.shortLabel]),
    ...SETTINGS_SECTIONS.map(section => section.label),
    ...Object.values(UPGRADE_COPY).flatMap(copy => [copy.title, copy.detail])
  ];

  it('covers every tab, section and upgrade string', () => {
    const missing = [...new Set(labels)].filter(label => !(label in runtimeTranslations));
    expect(missing, `No Arabic entry for: ${missing.join(' | ')}`).toEqual([]);
  });

  it('gives each of them real Arabic, not the key back', () => {
    const latin = [...new Set(labels)].filter(label => runtimeTranslations[label] && !arabic.test(runtimeTranslations[label]));
    expect(latin, `Arabic entry contains no Arabic: ${latin.join(' | ')}`).toEqual([]);
  });

  it('keeps all five tabs and their short mobile labels in step', () => {
    expect(STUDIO_TABS.map(tab => tab.id)).toEqual(['content', 'design', 'audience', 'analytics', 'settings']);
    STUDIO_TABS.forEach(tab => {
      expect(tab.shortLabel.length, `${tab.id} is too long for the mobile bar`).toBeLessThanOrEqual(8);
    });
  });

  it('lists the five Settings sections once', () => {
    expect(SETTINGS_SECTIONS.map(section => section.id)).toEqual(['site', 'domain', 'integrations', 'billing', 'advanced']);
  });
});

describe('Upgrade promises match the plan table the server enforces', () => {
  const capabilities = Object.keys(UPGRADE_COPY) as UpgradeCapability[];

  it('names a real paid plan for every locked affordance', () => {
    expect(capabilities.length).toBeGreaterThan(7);
    capabilities.forEach(capability => {
      expect(['pro', 'studio'], `${capability} has no paid plan`).toContain(minimumPlanFor(capability));
    });
  });

  it('does not sell Studio what Free already has, or vice versa', () => {
    capabilities.forEach(capability => {
      expect(planUnlocks('studio', capability), `${capability} on Studio`).toBe(true);
      expect(planUnlocks('free', capability), `${capability} on Free`).toBe(false);
    });
  });

  it('treats Pro as enough only where the plan table says so', () => {
    expect(planUnlocks('pro', 'api-access'), 'API keys are a Studio capability').toBe(false);
    expect(planUnlocks('pro', 'custom-domain')).toBe(true);
    expect(planUnlocks('pro', 'extra-sites'), 'Pro raises the site limit').toBe(true);
  });
});
