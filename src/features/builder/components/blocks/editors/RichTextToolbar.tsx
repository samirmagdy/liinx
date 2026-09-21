import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { type RichTextMarker } from './useRichTextEditor';

interface RichTextToolbarProps {
  blockId: string;
  linkUrl: string;
  onLinkUrlChange: (value: string) => void;
  onFormat: (marker: RichTextMarker) => void;
  onInsertLink: () => void;
}

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  blockId,
  linkUrl,
  onLinkUrlChange,
  onFormat,
  onInsertLink
}) => {
  const { tr: ui } = useUiLanguage();

  return (
    <>
      <div className="mb-1 flex flex-wrap items-center gap-1">
        <button type="button" aria-label={ui('Bold selected text')} onClick={() => onFormat('**')} className="rounded border border-neutral-200 px-2 py-1 text-xs font-bold">B</button>
        <button type="button" aria-label={ui('Italic selected text')} onClick={() => onFormat('*')} className="rounded border border-neutral-200 px-2 py-1 text-xs italic">I</button>
        <button type="button" aria-label={ui('Heading line')} onClick={() => onFormat('## ')} className="rounded border border-neutral-200 px-2 py-1 text-xs font-bold">H</button>
        <button type="button" aria-label={ui('Bulleted list line')} onClick={() => onFormat('- ')} className="rounded border border-neutral-200 px-2 py-1 text-xs">•</button>
        <button type="button" aria-label={ui('Numbered list line')} onClick={() => onFormat('1. ')} className="rounded border border-neutral-200 px-2 py-1 text-xs">1.</button>
      </div>
      <div className="mb-1 flex gap-1">
        <input
          id={`block-rich-text-url-${blockId}`}
          name="richTextLinkUrl"
          aria-label={ui('Safe link URL')}
          value={linkUrl}
          onChange={e => onLinkUrlChange(e.target.value)}
          placeholder="https://..."
          className="min-w-0 flex-1 rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-900"
        />
        <button
          type="button"
          aria-label={ui('Insert link')}
          disabled={!linkUrl.trim()}
          onClick={onInsertLink}
          className="rounded border border-neutral-200 px-2 py-1 text-xs font-semibold disabled:opacity-40"
        >
          {ui('Link')}
        </button>
      </div>
      <p className="mb-1 text-xs text-neutral-500">
        {ui('Safe format: paragraphs, # headings, - or 1. lists, **bold**, *italic*, and [label](https://url). HTML is shown as text.')}
      </p>
    </>
  );
};
