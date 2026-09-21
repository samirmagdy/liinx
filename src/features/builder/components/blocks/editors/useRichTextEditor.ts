import { useState } from 'react';

const SAFE_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

export type RichTextMarker = '**' | '*' | '## ' | '- ' | '1. ';

interface RichTextEditorOptions {
  textareaId: string;
  getBody: () => string;
  updateBody: (value: string) => void;
}

function withRestoredCaret(field: HTMLTextAreaElement, caret: number) {
  requestAnimationFrame(() => {
    field.focus();
    field.setSelectionRange(caret, caret);
  });
}

export function useRichTextEditor({ textareaId, getBody, updateBody }: RichTextEditorOptions) {
  const [linkUrl, setLinkUrl] = useState('');

  const field = () => document.getElementById(textareaId) as HTMLTextAreaElement | null;

  const format = (marker: RichTextMarker) => {
    const textarea = field();
    const current = getBody();
    if (!textarea) return;
    const isLinePrefix = marker === '## ' || marker === '- ' || marker === '1. ';
    const lineStart = current.lastIndexOf('\n', Math.max(0, textarea.selectionStart - 1)) + 1;
    const newline = current.indexOf('\n', textarea.selectionStart);
    const lineEnd = newline < 0 ? current.length : newline;
    const selected = current.slice(textarea.selectionStart, textarea.selectionEnd);
    const replacement = isLinePrefix
      ? `${marker}${current.slice(lineStart, lineEnd)}`
      : `${marker}${selected}${marker}`;
    const replaceStart = isLinePrefix ? lineStart : textarea.selectionStart;
    const replaceEnd = isLinePrefix ? lineEnd : textarea.selectionEnd;
    updateBody(`${current.slice(0, replaceStart)}${replacement}${current.slice(replaceEnd)}`);
    withRestoredCaret(textarea, isLinePrefix || selected
      ? replaceStart + replacement.length
      : replaceStart + marker.length);
  };

  const insertLink = () => {
    const textarea = field();
    if (!textarea) return;
    const current = getBody();
    const selected = current.slice(textarea.selectionStart, textarea.selectionEnd);
    if (!selected) return;
    try {
      const parsed = new URL(linkUrl.trim());
      if (!SAFE_LINK_PROTOCOLS.includes(parsed.protocol)) return;
      const replacement = `[${selected}](${linkUrl.trim()})`;
      const afterLink = textarea.selectionStart + replacement.length;
      updateBody(`${current.slice(0, textarea.selectionStart)}${replacement}${current.slice(textarea.selectionEnd)}`);
      withRestoredCaret(textarea, afterLink);
    } catch {
      return;
    }
  };

  return { linkUrl, setLinkUrl, format, insertLink };
}
