import { type ThemeConfig } from '../types';

// The public route yields "@handle" while the studio knows the plain handle, so both sides resolve
// the marker through this function. Comparing the raw values left the preview looking like an
// ordinary visitor: the creator's own look at their page was counted as somebody arriving.
const handle = (username: string) => username.replace(/^@/, '').toLowerCase();

const flagKey = (username: string) => `raloa-fullscreen-preview:${handle(username)}`;
const themeKey = (username: string) => `raloa-preview-theme:${handle(username)}`;

/** An unsaved theme only needs to survive the trip to the preview, not a stale tab. */
const PREVIEW_THEME_TTL_MS = 60_000;

export function markFullscreenPreview(username: string): void {
  window.sessionStorage.setItem(flagKey(username), '1');
}

export function isFullscreenPreviewMarked(username: string): boolean {
  return window.sessionStorage.getItem(flagKey(username)) === '1';
}

export function clearFullscreenPreviewMark(username: string): void {
  window.sessionStorage.removeItem(flagKey(username));
}

export function setFullscreenPreviewTheme(username: string, theme: ThemeConfig): void {
  window.sessionStorage.setItem(themeKey(username), JSON.stringify({ theme, createdAt: Date.now() }));
}

export function readFullscreenPreviewTheme(username: string): ThemeConfig | undefined {
  try {
    const raw = window.sessionStorage.getItem(themeKey(username));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { theme?: ThemeConfig; createdAt?: number };
    if (!parsed.createdAt || Date.now() - parsed.createdAt > PREVIEW_THEME_TTL_MS || !parsed.theme) return undefined;
    return parsed.theme;
  } catch {
    return undefined;
  }
}
