import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { HeroPreviewControls } from '../src/components/HeroPreviewControls';
import { THEMES } from '../src/config/themes';
import { LanguageProvider } from '../src/context/LanguageContext';
import { translateRuntime } from '../src/config/runtimeTranslations';
import type { CreatorProfile } from '../src/types';

if (typeof window === 'undefined') {
  (global as any).window = {
    location: { origin: 'https://raloa.test', href: 'https://raloa.test/', search: '', pathname: '/' },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} })
  };
}

const profiles = [{ id: 'prf_hero', displayName: 'Ada Lovelace' }] as unknown as CreatorProfile[];

const render = (selectedThemeId: string, language: 'en' | 'ar') => renderToString(
  <LanguageProvider initialLanguage={language}>
    <HeroPreviewControls
      currentProfiles={profiles}
      selectedProfileIndex={0}
      onSelectProfile={() => {}}
      selectedThemeId={selectedThemeId}
      onSelectTheme={() => {}}
      activeTheme={THEMES.find(theme => theme.id === selectedThemeId)!}
    />
  </LanguageProvider>
);

/** The theme buttons are the pressed-state controls that also name themselves; the profile tabs carry no label. */
const themeButtons = (html: string) => html.split('<button').slice(1)
  .map(chunk => `<button${chunk.split('</button>')[0]}`)
  .filter(tag => tag.includes('aria-pressed') && tag.includes('aria-label'));

describe('hero theme switcher', () => {
  it('offers every preset the builder has, not a truncated handful', () => {
    const html = render(THEMES[0].id, 'en');
    const labels = themeButtons(html)
      .map(tag => tag.match(/aria-label="([^"]*)"/)?.[1])
      .filter(Boolean)
      .sort();
    expect(labels).toEqual(THEMES.map(theme => theme.name).sort());
  });

  it('draws each swatch with that theme own palette', () => {
    const html = render(THEMES[0].id, 'en');
    for (const theme of THEMES) {
      const paint = theme.bgType === 'gradient' ? theme.bgGradient : theme.bgColor;
      expect(html.includes(paint), theme.id).toBe(true);
      expect(html.includes(theme.accentColor), theme.id).toBe(true);
    }
  });

  it('marks only the chosen preset as pressed', () => {
    const html = render(THEMES[3].id, 'en');
    const buttons = themeButtons(html);
    expect(buttons.length).toBe(THEMES.length);
    const pressed = buttons.filter(tag => tag.includes('aria-pressed="true"'));
    expect(pressed.length).toBe(1);
    expect(pressed[0]).toContain(`aria-label="${THEMES[3].name}"`);
  });

  it('names every preset in Arabic for Arabic readers', () => {
    const html = render(THEMES[0].id, 'ar');
    const labels = themeButtons(html).map(tag => tag.match(/aria-label="([^"]*)"/)?.[1]).filter(Boolean);
    expect(labels.length).toBe(THEMES.length);
    for (const theme of THEMES) {
      const arabic = translateRuntime(theme.name, 'ar');
      expect(arabic, theme.name).not.toBe(theme.name);
      expect(labels, theme.name).toContain(arabic);
    }
  });
});
