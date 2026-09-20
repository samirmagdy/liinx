import { describe, expect, it } from 'vitest';
import { languageForPath, localizedPath } from '../src/utils/languagePaths';

describe('localized marketing URLs', () => {
  it('detects Arabic only on the Arabic route prefix', () => {
    expect(languageForPath('/')).toBe('en');
    expect(languageForPath('/pricing')).toBe('en');
    expect(languageForPath('/ar')).toBe('ar');
    expect(languageForPath('/ar/')).toBe('ar');
    expect(languageForPath('/ar/features')).toBe('ar');
    expect(languageForPath('/arabic')).toBe('en');
  });

  it('maps the same page between English and Arabic without duplicating prefixes', () => {
    expect(localizedPath('/', 'ar')).toBe('/ar/');
    expect(localizedPath('/features', 'ar')).toBe('/ar/features');
    expect(localizedPath('/ar/features', 'ar')).toBe('/ar/features');
    expect(localizedPath('/ar/features', 'en')).toBe('/features');
    expect(localizedPath('/ar/', 'en')).toBe('/');
  });
});
