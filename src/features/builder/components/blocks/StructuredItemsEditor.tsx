import React from 'react';
import { type StructuredEditorKind } from '../../types/builder.types';

export interface StructuredItemsEditorProps {
  kind: StructuredEditorKind;
  value: any[];
  onChange: (value: any[]) => void;
  onUpload?: (file: File, index: number, itemId?: string) => void;
  ui: (value: string) => string;
}

export const StructuredItemsEditor: React.FC<StructuredItemsEditorProps> = ({
  kind,
  value,
  onChange,
  onUpload,
  ui
}) => {
  const items = Array.isArray(value) ? value : [];

  const createItem = () =>
    kind === 'form'
      ? {
          id: `field_${Date.now()}_${items.length}`,
          name: `field_${items.length + 1}`,
          label: 'New field',
          type: 'text',
          required: false
        }
      : kind === 'faq'
      ? { id: `item-${Date.now()}`, question: '', answer: '' }
      : kind === 'testimonials'
      ? { id: `item-${Date.now()}`, quote: 'A great experience.', name: 'Client name' }
      : { id: `item-${Date.now()}`, imageUrl: '', alt: '', caption: '', title: '' };

  const update = (index: number, key: string, val: unknown) =>
    onChange(
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: val } : item
      )
    );

  const remove = (index: number) =>
    onChange(items.filter((_, itemIndex) => itemIndex !== index));

  const move = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= items.length) return;
    const copy = [...items];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    onChange(copy);
  };

  return (
    <div className="sm:col-span-2 space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-neutral-700">
          {ui(kind === 'form' ? 'Form fields' : 'Items')}
        </span>
        <button
          type="button"
          disabled={kind === 'form' && items.length >= 20}
          title={
            kind === 'form' && items.length >= 20
              ? ui('Forms can contain at most 20 fields.')
              : undefined
          }
          onClick={() => onChange([...items, createItem()])}
          className="rounded-lg border border-neutral-300 px-2 py-1 text-[11px] font-semibold hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {ui('Add item')}
        </button>
      </div>

      {items.length === 0 && (
        <p className="py-3 text-[11px] text-neutral-500">
          {ui('No items yet. Add one to begin.')}
        </p>
      )}

      {items.map((item, index) => (
        <div
          key={item.id || item.name || index}
          className="grid grid-cols-1 gap-2 rounded-lg border border-neutral-200 bg-white p-2 sm:grid-cols-[1fr_auto]"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {kind === 'form' && (
              <>
                <input
                  value={item.label || ''}
                  onChange={e => update(index, 'label', e.target.value)}
                  placeholder={ui('Label')}
                  aria-label={ui('Field label')}
                  maxLength={120}
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900"
                />
                <input
                  value={item.name || ''}
                  onChange={e =>
                    update(
                      index,
                      'name',
                      e.target.value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)
                    )
                  }
                  placeholder={ui('Field name')}
                  aria-label={ui('Field name')}
                  maxLength={64}
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 font-mono text-[11px] text-neutral-900"
                />
                <select
                  value={item.type || 'text'}
                  onChange={e => update(index, 'type', e.target.value)}
                  aria-label={ui('Field type')}
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900"
                >
                  <option value="text">{ui('Text')}</option>
                  <option value="email">{ui('Email')}</option>
                  <option value="tel">{ui('Phone')}</option>
                  <option value="textarea">{ui('Long text')}</option>
                </select>
                <label className="flex items-center gap-2 text-[11px] text-neutral-700">
                  <input
                    type="checkbox"
                    checked={item.required !== false}
                    onChange={e => update(index, 'required', e.target.checked)}
                  />
                  {ui('Required')}
                </label>
                <input
                  value={item.helpText || ''}
                  onChange={e => update(index, 'helpText', e.target.value)}
                  placeholder={ui('Help text (optional)')}
                  aria-label={ui('Field help text')}
                  maxLength={300}
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900 sm:col-span-2"
                />
                <label className="flex items-center gap-1 text-[11px] text-neutral-700">
                  {ui('Minimum')}
                  <input
                    type="number"
                    min="0"
                    max="2000"
                    value={item.minLength ?? ''}
                    onChange={e =>
                      update(
                        index,
                        'minLength',
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
                    }
                    aria-label={ui('Minimum length')}
                    className="w-20 rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900"
                  />
                </label>
                <label className="flex items-center gap-1 text-[11px] text-neutral-700">
                  {ui('Maximum')}
                  <input
                    type="number"
                    min="1"
                    max="2000"
                    value={item.maxLength ?? ''}
                    onChange={e =>
                      update(
                        index,
                        'maxLength',
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
                    }
                    aria-label={ui('Maximum length')}
                    className="w-20 rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900"
                  />
                </label>
              </>
            )}

            {(kind === 'gallery' || kind === 'carousel') && (
              <>
                <input
                  value={item.imageUrl || ''}
                  onChange={e => update(index, 'imageUrl', e.target.value)}
                  placeholder={ui('Image URL')}
                  aria-label={ui('Image URL')}
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900 sm:col-span-2"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file && onUpload) onUpload(file, index, item.id);
                  }}
                  aria-label={ui('Upload image')}
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900"
                />
                <input
                  value={item.alt || ''}
                  onChange={e => update(index, 'alt', e.target.value)}
                  placeholder={ui('Alt text')}
                  aria-label={ui('Alt text')}
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900"
                />
                <input
                  value={item.caption || ''}
                  onChange={e => update(index, 'caption', e.target.value)}
                  placeholder={ui('Caption')}
                  aria-label={ui('Caption')}
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900"
                />
                <input
                  value={item.linkUrl || ''}
                  onChange={e => update(index, 'linkUrl', e.target.value)}
                  placeholder={ui('Optional link URL')}
                  aria-label={ui('Optional image link URL')}
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900 sm:col-span-2"
                />
              </>
            )}

            {kind === 'faq' && (
              <>
                <input
                  value={item.question || ''}
                  onChange={e => update(index, 'question', e.target.value)}
                  placeholder={ui('Question')}
                  aria-label={ui('Question')}
                  maxLength={300}
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900"
                />
                <textarea
                  value={item.answer || ''}
                  onChange={e => update(index, 'answer', e.target.value)}
                  placeholder={ui('Answer')}
                  aria-label={ui('Answer')}
                  maxLength={5000}
                  className="min-h-24 rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900"
                />
                <p className="text-[10px] text-neutral-500 sm:col-span-2">
                  {ui('Answers are plain text. Line breaks are preserved; links are not supported in FAQs.')}
                </p>
              </>
            )}

            {kind === 'testimonials' && (
              <>
                <textarea
                  value={item.quote || ''}
                  onChange={e => update(index, 'quote', e.target.value)}
                  placeholder={ui('Quote')}
                  aria-label={ui('Quote')}
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900"
                />
                <input
                  value={item.name || ''}
                  onChange={e => update(index, 'name', e.target.value)}
                  placeholder={ui('Name')}
                  aria-label={ui('Name')}
                  className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900"
                />
              </>
            )}
          </div>

          <div className="flex items-start justify-end gap-1">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              aria-label={ui('Move item up')}
              className="rounded p-1 text-neutral-500 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === items.length - 1}
              aria-label={ui('Move item down')}
              className="rounded p-1 text-neutral-500 disabled:opacity-30"
            >
              ↓
            </button>
            {kind === 'form' && (
              <button
                type="button"
                onClick={() => {
                  const base = String(item.name || 'field').slice(0, 55);
                  let name = `${base}_copy`;
                  let suffix = 2;
                  while (
                    items.some(
                      (candidate, candidateIndex) =>
                        candidateIndex !== index && candidate.name === name
                    )
                  ) {
                    name = `${base}_copy_${suffix++}`;
                  }
                  onChange([
                    ...items.slice(0, index + 1),
                    { ...item, id: `field_${Date.now()}_${index}`, name },
                    ...items.slice(index + 1)
                  ]);
                }}
                disabled={items.length >= 20}
                aria-label={ui('Duplicate field')}
                className="rounded p-1 text-neutral-500 disabled:opacity-30"
              >
                +
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={ui(kind === 'form' ? 'Delete field' : 'Remove item')}
              className="rounded p-1 text-rose-600"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
