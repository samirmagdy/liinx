import React from 'react';
import { type ProfileBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useAdvancedFields } from './useAdvancedFields';
import { useRichTextEditor } from './useRichTextEditor';
import { RichTextToolbar } from './RichTextToolbar';

interface RichTextFieldProps {
  block: ProfileBlock;
}

export const RichTextField: React.FC<RichTextFieldProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { advanced, updateAdvanced } = useAdvancedFields(block);
  const isRichText = block.type === 'rich_text';
  const textareaId = isRichText ? `rich-text-${block.id}` : `block-body-${block.id}`;
  const bodyKey = isRichText || block.type === 'content_gate' ? 'body' : 'description';
  const { linkUrl, setLinkUrl, format, insertLink } = useRichTextEditor({
    textareaId,
    getBody: () => String(advanced.body || ''),
    updateBody: value => updateAdvanced('body', value)
  });

  return (
    <div className="sm:col-span-2">
      <label htmlFor={textareaId} className="block text-xs font-semibold text-neutral-500 mb-1">
        {ui(isRichText || block.type === 'content_gate' ? 'Content' : 'Description')}
      </label>
      {isRichText && (
        <RichTextToolbar
          blockId={block.id}
          linkUrl={linkUrl}
          onLinkUrlChange={setLinkUrl}
          onFormat={format}
          onInsertLink={insertLink}
        />
      )}
      <textarea
        id={textareaId}
        name="blockContent"
        aria-label={ui(isRichText ? 'Rich text content' : 'Content')}
        value={advanced.body || advanced.description || ''}
        onChange={e => updateAdvanced(bodyKey, e.target.value)}
        className="w-full min-h-20 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
      />
    </div>
  );
};
