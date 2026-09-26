import React from 'react';
import { type ThemeConfig } from '../../../types';
import { getThemeBackground } from '../../../utils/colorContrast';

export function safePublicHref(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://raloa.test';
    const url = new URL(value, origin);
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function analyticsHref(path: string): string {
  if (typeof window === 'undefined') return path;
  const source = new URLSearchParams(window.location.search);
  const tracking = new URLSearchParams();
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const value = source.get(key)?.trim();
    if (value) tracking.set(key, value.slice(0, 200));
  }
  const query = tracking.toString();
  return query ? `${path}${path.includes('?') ? '&' : '?'}${query}` : path;
}

export function normalizeFormFields(value: unknown): Array<{
  id?: string;
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  helpText?: string;
}> {
  if (!Array.isArray(value)) return [];
  return value
    .filter(field => field && typeof field === 'object' && typeof (field as Record<string, unknown>).name === 'string')
    .map(field => {
      const candidate = field as Record<string, unknown>;
      return {
        id: typeof candidate.id === 'string' ? candidate.id : `field_${String(candidate.name)}`,
        name: String(candidate.name),
        label: typeof candidate.label === 'string' ? candidate.label : undefined,
        type: typeof candidate.type === 'string' ? candidate.type : undefined,
        required: candidate.required === undefined ? true : Boolean(candidate.required),
        minLength: typeof candidate.minLength === 'number' ? candidate.minLength : undefined,
        maxLength: typeof candidate.maxLength === 'number' ? candidate.maxLength : undefined,
        helpText: typeof candidate.helpText === 'string' ? candidate.helpText : undefined
      };
    });
}

export function normalizeFaqItems(value: unknown): Array<{ id?: string; question: string; answer: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.question !== 'string' || !candidate.question.trim()) return [];
    return [{
      id: typeof candidate.id === 'string' && candidate.id ? candidate.id : undefined,
      question: candidate.question,
      answer: typeof candidate.answer === 'string' ? candidate.answer : ''
    }];
  });
}

export function advancedRadius(radius: ThemeConfig['cardRadius']): string {
  return radius === 'none' ? 'rounded-none' : radius === 'full' ? 'rounded-3xl' : radius === 'md' ? 'rounded-xl' : 'rounded-2xl';
}

export function getRadiusClass(radius: ThemeConfig['cardRadius'], isComplex: boolean = false): string {
  switch (radius) {
    case 'none': return 'rounded-none';
    case 'md': return 'rounded-xl';
    case 'xl': return 'rounded-2xl';
    case 'full': return isComplex ? 'rounded-2xl' : 'rounded-full';
    default: return 'rounded-2xl';
  }
}

export function isArabicText(text?: string): boolean {
  return /[\u0600-\u06FF]/.test(text || '');
}

export function buildShellStyle(
  theme: ThemeConfig,
  options: { hasBackgroundMedia: boolean; backgroundMediaType?: string; backgroundMediaHref: string | null }
): React.CSSProperties {
  const themeBackground = getThemeBackground(theme);
  const imageBackdrop = options.hasBackgroundMedia && options.backgroundMediaType === 'image';

  return {
    ...themeBackground,
    backgroundImage: imageBackdrop ? `url(${options.backgroundMediaHref})` : themeBackground.backgroundImage,
    backgroundSize: imageBackdrop || theme.backgroundImageUrl ? 'cover' : undefined,
    backgroundPosition: imageBackdrop || theme.backgroundImageUrl ? 'center center' : undefined,
    backgroundAttachment: imageBackdrop || theme.backgroundImageUrl ? 'scroll' : undefined,
    color: theme.textColor,
    fontFamily: themeFontVar(theme.fontFamily)
  };
}

export function themeFontVar(fontFamily: ThemeConfig['fontFamily']): string {
  if (fontFamily === 'display') return 'var(--font-display)';
  if (fontFamily === 'mono') return 'var(--font-mono)';
  return 'var(--font-sans)';
}

export function renderRichTextInline(value: string): React.ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^\s)]+\))/g;
  return value.split(pattern).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
    if (link) {
      const href = safePublicHref(link[2]);
      if (href) return <a key={index} href={href} target={/^(https?:)/i.test(href) ? '_blank' : undefined} rel={/^(https?:)/i.test(href) ? 'noreferrer' : undefined} className="underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-current">{link[1]}</a>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export function renderRichText(value: string): React.ReactNode[] {
  const lines = value.split('\n');
  const output: React.ReactNode[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const unordered = line.match(/^[-*]\s+(.*)$/);
    const ordered = line.match(/^\d+\.\s+(.*)$/);
    if (unordered || ordered) {
      const items: string[] = [];
      const orderedList = Boolean(ordered);
      while (index < lines.length) {
        const item = lines[index].match(orderedList ? /^\d+\.\s+(.*)$/ : /^[-*]\s+(.*)$/);
        if (!item) break;
        items.push(item[1]);
        index += 1;
      }
      const List = orderedList ? 'ol' : 'ul';
      output.push(
        <List key={`list-${index}`} className={`${orderedList ? 'list-decimal' : 'list-disc'} ps-5 space-y-1`}>
          {items.map((item, itemIndex) => <li key={itemIndex}>{renderRichTextInline(item)}</li>)}
        </List>
      );
      index -= 1;
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const Heading = heading[1].length === 1 ? 'h2' : heading[1].length === 2 ? 'h3' : 'h4';
      output.push(<Heading key={index} className="mt-3 font-bold">{renderRichTextInline(heading[2])}</Heading>);
    } else {
      output.push(<p key={index} className="min-h-5">{renderRichTextInline(line)}</p>);
    }
  }
  return output;
}
