import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  clearFullscreenPreviewMark,
  isFullscreenPreviewMarked,
  markFullscreenPreview,
  readFullscreenPreviewTheme,
  setFullscreenPreviewTheme
} from '../src/utils/previewSession';
import type { ThemeConfig } from '../src/types';

const store = new Map<string, string>();
(global as any).window = {
  sessionStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, String(value)); },
    removeItem: (key: string) => { store.delete(key); }
  }
};

const rootDir = path.resolve(__dirname, '..');
const source = (relative: string) => fs.readFileSync(path.join(rootDir, relative), 'utf-8');

const theme: ThemeConfig = { id: 'midnight', name: 'Midnight' } as ThemeConfig;

afterEach(() => {
  store.clear();
  vi.useRealTimers();
});

describe('full-screen preview hand-off', () => {
  it('matches the studio marker when the public route hands over an @-prefixed handle', () => {
    markFullscreenPreview('StudioHandle');
    expect(isFullscreenPreviewMarked('@StudioHandle')).toBe(true);
  });

  it('clears the marker exactly once so the next ordinary visit is counted', () => {
    markFullscreenPreview('creator');
    clearFullscreenPreviewMark('@creator');
    expect(isFullscreenPreviewMarked('creator')).toBe(false);
    expect(isFullscreenPreviewMarked('nobody-else')).toBe(false);
  });

  it('carries the unsaved theme across the same handle in either spelling', () => {
    setFullscreenPreviewTheme('creator', theme);
    expect(readFullscreenPreviewTheme('@Creator')).toEqual(theme);
  });

  it('forgets a theme that never reached a preview', () => {
    vi.useFakeTimers();
    setFullscreenPreviewTheme('creator', theme);
    vi.advanceTimersByTime(61_000);
    expect(readFullscreenPreviewTheme('creator')).toBeUndefined();
  });

  it('ignores a hand-written value that is not a theme', () => {
    store.set('raloa-preview-theme:creator', 'not json');
    expect(readFullscreenPreviewTheme('creator')).toBeUndefined();
  });

  it('keeps both sides of the protocol on one key builder', () => {
    for (const file of ['src/App.tsx', 'src/features/builder/hooks/useLivePreview.ts']) {
      expect(source(file), file).not.toMatch(/raloa-(fullscreen-preview|preview-theme)/);
    }
  });
});
