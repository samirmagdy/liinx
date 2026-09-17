import React, { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Clock,
  Plus,
  MousePointerClick
} from 'lucide-react';
import {
  ProfileBlock,
  LinkBlock,
  AudioBlock,
  VideoBlock,
  NewsletterBlock,
  FolderBlock
} from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { StructuredItemsEditor } from './StructuredItemsEditor';
import { StructuredEditorKind } from '../../types/builder.types';
import {
  toDateTimeLocal,
  fromDateTimeLocal,
  getScheduleStatus
} from '../../utils/builder.utils';

interface BlockEditorItemProps {
  block: ProfileBlock;
  index: number;
}

export const BlockEditorItem: React.FC<BlockEditorItemProps> = ({ block, index }) => {
  const { tr: ui, lang } = useUiLanguage();
  const {
    profile,
    pages,
    activePage,
    visibleBlocks,
    confirmDeleteBlockId,
    setConfirmDeleteBlockId,
    handleMoveBlock,
    handleMoveBlockToPage,
    handleDuplicateBlock,
    handleDeleteBlock,
    handleUpdateBlockField,
    handleUpdateBlockExtra,
    handleAddFolderItem,
    handleMoveFolderItem,
    handleRemoveFolderItem,
    handleUpdateFolderItem,
    handleBlockImageUpload,
    handleBlockFileUpload
  } = useBuilder();

  const [richTextLinkUrl, setRichTextLinkUrl] = useState('');

  return (
    <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-3 hover:border-neutral-400 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
            {block.type}
          </span>
          <span className="text-xs font-bold text-[#18181B] truncate">
            {block.title || 'Untitled Block'}
          </span>
          {(block as LinkBlock).clicks !== undefined && (
            <span className="text-[10px] font-mono text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
              <MousePointerClick className="w-3 h-3" />
              <span>{(block as LinkBlock).clicks} {ui("clicks")}</span>
            </span>
          )}
          {getScheduleStatus((block as LinkBlock).startAt, (block as LinkBlock).endAt, ui, lang) && (
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
              getScheduleStatus((block as LinkBlock).startAt, (block as LinkBlock).endAt, ui, lang)?.color
            }`}>
              {getScheduleStatus((block as LinkBlock).startAt, (block as LinkBlock).endAt, ui, lang)?.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => handleMoveBlock(index, 'up')}
            disabled={index === 0}
            aria-label={ui('Move block up')}
            className="p-1 rounded-lg text-neutral-400 hover:text-black disabled:opacity-20 cursor-pointer"
            title={ui("Move up")}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleMoveBlock(index, 'down')}
            disabled={index === visibleBlocks.length - 1}
            aria-label={ui('Move block down')}
            className="p-1 rounded-lg text-neutral-400 hover:text-black disabled:opacity-20 cursor-pointer"
            title={ui("Move down")}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <select
            aria-label={ui('Move block to page')}
            value={(block as any).pageId || activePage?.id || ''}
            onChange={event => void handleMoveBlockToPage(block.id, event.target.value)}
            className="max-w-28 rounded-lg border border-neutral-200 bg-white px-1 py-1 text-[10px] text-neutral-700"
          >
            {pages.map(page => <option key={page.id} value={page.id}>{page.title}</option>)}
          </select>
          <button
            type="button"
            onClick={() => void handleDuplicateBlock(block.id)}
            aria-label={ui('Duplicate block')}
            title={ui('Duplicate block')}
            className="rounded-lg p-1 text-neutral-400 hover:text-black"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          {confirmDeleteBlockId === block.id ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  handleDeleteBlock(block.id);
                  setConfirmDeleteBlockId(null);
                }}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-700 text-white hover:bg-rose-800 transition-colors cursor-pointer"
              >
                {ui("Confirm")}
              </button>
              <button
                onClick={() => setConfirmDeleteBlockId(null)}
                className="px-2 py-0.5 rounded text-[10px] font-semibold text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
              >
                {ui("Cancel")}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteBlockId(block.id)}
              className="p-1 rounded-lg text-rose-400 hover:text-rose-600 cursor-pointer"
              title={ui("Delete block")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Form Fields per Block Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Title")}</label>
          <input
            aria-label={ui("Title")}
            type="text"
            value={block.title}
            onChange={(e) => handleUpdateBlockField(block.id, 'title', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
          />
        </div>

        {(block.type === 'link' || block.type === 'booking') && (
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Destination URL")}</label>
            <input
              aria-label={ui("Destination URL")}
              type="text"
              value={(block as LinkBlock).url || ''}
              onChange={(e) => handleUpdateBlockField(block.id, 'url', e.target.value)}
              placeholder="https://..."
              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-[11px] text-neutral-900"
            />
          </div>
        )}

        {block.type === 'audio' && (
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Artist Name")}</label>
            <input
              aria-label={ui("Artist Name")}
              type="text"
              value={(block as AudioBlock).artist || ''}
              onChange={(e) => handleUpdateBlockExtra(block.id, { artist: e.target.value })}
              placeholder={ui("Artist / Band")}
              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
            />
          </div>
        )}

        {block.type === 'video' && (
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Video Stream URL")}</label>
            <input
              aria-label={ui("Video Stream URL")}
              type="text"
              value={(block as VideoBlock).videoUrl || ''}
              onChange={(e) => handleUpdateBlockExtra(block.id, { videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-[11px] text-neutral-900"
            />
            <p className="mt-1 text-[10px] font-normal text-neutral-500">
              {ui('Supported: YouTube watch, youtu.be, or Shorts URLs; Vimeo links; or direct HTTPS MP4, WebM, OGV, or MOV files. Other HTTPS URLs remain external fallback links. Playback is never started automatically.')}
            </p>
          </div>
        )}

        {block.type === 'newsletter' && (
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Button CTA Text")}</label>
            <input
              aria-label={ui("Button CTA Text")}
              type="text"
              value={(block as NewsletterBlock).buttonText || 'Subscribe'}
              onChange={(e) => handleUpdateBlockExtra(block.id, { buttonText: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
            />
          </div>
        )}
      </div>

      {/* Secondary Fields per Block Type */}
      {block.type === 'link' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Subtitle Note")}</label>
              <input
                aria-label={ui("Subtitle Note")}
                type="text"
                value={(block as LinkBlock).subtitle || ''}
                onChange={(e) => handleUpdateBlockField(block.id, 'subtitle', e.target.value)}
                placeholder={ui("Supporting text...")}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Icon or emoji")}</label>
              <input
                aria-label={ui("Icon or emoji")}
                type="text"
                value={(block as LinkBlock).icon || ''}
                onChange={(e) => handleUpdateBlockField(block.id, 'icon', e.target.value || null)}
                placeholder={ui("Optional")}
                maxLength={50}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Badge Tag")}</label>
              <input
                aria-label={ui("Badge Tag")}
                type="text"
                value={(block as LinkBlock).badge || ''}
                onChange={(e) => handleUpdateBlockField(block.id, 'badge', e.target.value)}
                placeholder={ui("e.g. NEW, SALE, LISTEN")}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-neutral-100 text-xs">
            <label className="text-[11px] font-semibold text-neutral-600">
              {ui('Link layout')}
              <select
                value={(block as any).layout || 'list'}
                onChange={e => handleUpdateBlockExtra(block.id, { layout: e.target.value })}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] text-neutral-900"
              >
                <option value="list">{ui('List')}</option>
                <option value="grid">{ui('Grid card')}</option>
                <option value="featured">{ui('Featured')}</option>
              </select>
            </label>
            <label className="text-[11px] font-semibold text-neutral-600">
              {ui('Link animation')}
              <select
                value={(block as any).animation || 'none'}
                onChange={e => handleUpdateBlockExtra(block.id, { animation: e.target.value })}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] text-neutral-900"
              >
                <option value="none">{ui('None')}</option>
                <option value="fade">{ui('Fade in')}</option>
                <option value="lift">{ui('Lift on hover')}</option>
                <option value="pulse">{ui('Subtle pulse')}</option>
              </select>
            </label>
          </div>

          {/* Link Scheduling (Time-Release) */}
          <div className="pt-2 border-t border-neutral-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-neutral-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                <span>{ui("Link Scheduling & Time-Release")}</span>
              </label>
              {profile.plan === 'free' ? (
                <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                  {ui("PRO FEATURE")}
                </span>
              ) : (
                getScheduleStatus((block as LinkBlock).startAt, (block as LinkBlock).endAt, ui, lang) && (
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    getScheduleStatus((block as LinkBlock).startAt, (block as LinkBlock).endAt, ui, lang)?.color
                  }`}>
                    {getScheduleStatus((block as LinkBlock).startAt, (block as LinkBlock).endAt, ui, lang)?.label}
                  </span>
                )
              )}
            </div>

            {profile.plan !== 'free' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-neutral-400 block mb-1">{ui("Publish (Start Date/Time):")}</span>
                    <input
                      type="datetime-local"
                      value={toDateTimeLocal((block as LinkBlock).startAt)}
                      onChange={(e) => handleUpdateBlockField(block.id, 'startAt', fromDateTimeLocal(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-800 focus:outline-none focus:border-neutral-900 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <span className="text-neutral-400 block mb-1">{ui("Unpublish (End Date/Time):")}</span>
                    <input
                      type="datetime-local"
                      value={toDateTimeLocal((block as LinkBlock).endAt)}
                      onChange={(e) => handleUpdateBlockField(block.id, 'endAt', fromDateTimeLocal(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-800 focus:outline-none focus:border-neutral-900 font-mono text-[11px]"
                    />
                  </div>
                </div>
                <p className="text-[10px] leading-relaxed text-neutral-400 sm:col-span-2">
                  {ui("Schedule times use this browser timezone and are saved as UTC instants. The block is available from its start until (but not including) its end time.")}
                </p>
              </>
            ) : (
              <p className="text-[11px] text-neutral-400">
                {ui("Upgrade to Pro to automatically schedule links to go live and expire at specific dates and times.")}
              </p>
            )}
          </div>
        </>
      )}

      {block.type === 'audio' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Album Cover Image URL")}</label>
              <input
                aria-label={ui("Album Cover Image URL")}
                type="text"
                value={(block as AudioBlock).coverUrl || ''}
                onChange={(e) => handleUpdateBlockExtra(block.id, { coverUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-[11px] text-neutral-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Streaming Link")}</label>
              <input
                aria-label={ui("Streaming Link")}
                type="text"
                value={(block as AudioBlock).audioUrl || ''}
                onChange={(e) => handleUpdateBlockExtra(block.id, { audioUrl: e.target.value })}
                placeholder="https://open.spotify.com/..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-[11px] text-neutral-900"
              />
            </div>
          </div>
          <p className="mt-1 text-[10px] text-neutral-500">
            {ui('Supported: Spotify track, album, playlist, artist, or episode URLs; Apple Music pages; SoundCloud tracks; or direct HTTPS MP3, WAV, OGG, M4A, or AAC files. Playback never starts automatically.')}
          </p>
        </>
      )}

      {block.type === 'video' && (
        <div>
          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Thumbnail Preview Image URL")}</label>
          <input
            aria-label={ui("Thumbnail Preview Image URL")}
            type="text"
            value={(block as VideoBlock).thumbnailUrl || ''}
            onChange={(e) => handleUpdateBlockExtra(block.id, { thumbnailUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-[11px] text-neutral-900"
          />
          <p className="mt-1 text-[10px] font-normal text-neutral-500">
            {ui('Optional thumbnail. If it is unavailable, visitors see a neutral fallback. Remote video is hosted by the selected provider or media host; Liinx does not host these URLs.')}
          </p>
        </div>
      )}

      {block.type === 'newsletter' && (
        <div>
          <label className="block text-[11px] font-semibold text-neutral-500 mb-1">{ui("Newsletter Description")}</label>
          <input
            aria-label={ui("Newsletter Description")}
            type="text"
            value={(block as NewsletterBlock).description || ''}
            onChange={(e) => handleUpdateBlockExtra(block.id, { description: e.target.value })}
            placeholder={ui("What will subscribers get?")}
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
          />
        </div>
      )}

      {['rich_text', 'image', 'gallery', 'carousel', 'spacer', 'form', 'download', 'map', 'faq', 'testimonials', 'event', 'presave', 'phone', 'product', 'tips', 'content_gate'].includes(block.type) && (() => {
        const advanced = block as any;
        const updateAdvanced = (key: string, value: unknown) => handleUpdateBlockExtra(block.id, { [key]: value });
        const formatRichText = (marker: '**' | '*' | '## ' | '- ' | '1. ') => {
          const textarea = document.getElementById(`rich-text-${block.id}`) as HTMLTextAreaElement | null;
          const current = String(advanced.body || '');
          if (!textarea) return;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const selected = current.slice(start, end);
          const isLinePrefix = marker === '## ' || marker === '- ' || marker === '1. ';
          const lineStart = current.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
          const lineEnd = current.indexOf('\n', start) < 0 ? current.length : current.indexOf('\n', start);
          const replacement = isLinePrefix
            ? `${marker}${current.slice(lineStart, lineEnd)}`
            : `${marker}${selected}${marker}`;
          const replaceStart = isLinePrefix ? lineStart : start;
          const replaceEnd = isLinePrefix ? lineEnd : end;
          updateAdvanced('body', `${current.slice(0, replaceStart)}${replacement}${current.slice(replaceEnd)}`);
          const caret = isLinePrefix ? replaceStart + replacement.length : selected ? replaceStart + replacement.length : replaceStart + marker.length;
          requestAnimationFrame(() => { textarea.focus(); textarea.setSelectionRange(caret, caret); });
        };
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-neutral-100 text-xs">
            {(['rich_text', 'form', 'download', 'map', 'content_gate'].includes(block.type)) && (
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  {ui(block.type === 'rich_text' || block.type === 'content_gate' ? 'Content' : 'Description')}
                </label>
                {block.type === 'rich_text' && (
                  <>
                    <div className="mb-1 flex flex-wrap items-center gap-1">
                      <button type="button" aria-label={ui('Bold selected text')} onClick={() => formatRichText('**')} className="rounded border border-neutral-200 px-2 py-1 text-[10px] font-bold">B</button>
                      <button type="button" aria-label={ui('Italic selected text')} onClick={() => formatRichText('*')} className="rounded border border-neutral-200 px-2 py-1 text-[10px] italic">I</button>
                      <button type="button" aria-label={ui('Heading line')} onClick={() => formatRichText('## ')} className="rounded border border-neutral-200 px-2 py-1 text-[10px] font-bold">H</button>
                      <button type="button" aria-label={ui('Bulleted list line')} onClick={() => formatRichText('- ')} className="rounded border border-neutral-200 px-2 py-1 text-[10px]">•</button>
                      <button type="button" aria-label={ui('Numbered list line')} onClick={() => formatRichText('1. ')} className="rounded border border-neutral-200 px-2 py-1 text-[10px]">1.</button>
                    </div>
                    <div className="mb-1 flex gap-1">
                      <input
                        aria-label={ui('Safe link URL')}
                        value={richTextLinkUrl}
                        onChange={e => setRichTextLinkUrl(e.target.value)}
                        placeholder="https://..."
                        className="min-w-0 flex-1 rounded border border-neutral-200 px-2 py-1 text-[10px] text-neutral-900"
                      />
                      <button
                        type="button"
                        aria-label={ui('Insert link')}
                        disabled={!richTextLinkUrl.trim()}
                        onClick={() => {
                          const textarea = document.getElementById(`rich-text-${block.id}`) as HTMLTextAreaElement | null;
                          if (!textarea) return;
                          const current = String(advanced.body || '');
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selected = current.slice(start, end);
                          if (!selected) return;
                          try {
                            const parsed = new URL(richTextLinkUrl.trim());
                            if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) return;
                            const replacement = `[${selected}](${richTextLinkUrl.trim()})`;
                            updateAdvanced('body', `${current.slice(0, start)}${replacement}${current.slice(end)}`);
                            requestAnimationFrame(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + replacement.length, start + replacement.length);
                            });
                          } catch {
                            return;
                          }
                        }}
                        className="rounded border border-neutral-200 px-2 py-1 text-[10px] font-semibold disabled:opacity-40"
                      >
                        {ui('Link')}
                      </button>
                    </div>
                    <p className="mb-1 text-[10px] text-neutral-500">
                      {ui('Safe format: paragraphs, # headings, - or 1. lists, **bold**, *italic*, and [label](https://url). HTML is shown as text.')}
                    </p>
                  </>
                )}
                <textarea
                  id={block.type === 'rich_text' ? `rich-text-${block.id}` : undefined}
                  aria-label={ui(block.type === 'rich_text' ? 'Rich text content' : 'Content')}
                  value={advanced.body || advanced.description || ''}
                  onChange={e => updateAdvanced(block.type === 'rich_text' || block.type === 'content_gate' ? 'body' : 'description', e.target.value)}
                  className="w-full min-h-20 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                />
              </div>
            )}

            {block.type === 'image' && (
              <div className="space-y-2 sm:col-span-2">
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  {ui('Image URL')}
                  <input
                    value={advanced.imageUrl || ''}
                    onChange={e => updateAdvanced('imageUrl', e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) void handleBlockImageUpload(block.id, file);
                    e.currentTarget.value = '';
                  }}
                  aria-label={ui('Upload or replace image')}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="block text-[11px] font-semibold text-neutral-500">
                    {ui('Alt text')}
                    <input
                      value={advanced.alt || ''}
                      onChange={e => updateAdvanced('alt', e.target.value)}
                      maxLength={300}
                      placeholder={ui('Describe the image')}
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                    />
                  </label>
                  <label className="flex items-end gap-2 pb-1 text-[11px] font-semibold text-neutral-500">
                    <input
                      type="checkbox"
                      checked={Boolean(advanced.decorative)}
                      onChange={e => updateAdvanced('decorative', e.target.checked)}
                    />
                    {ui('Decorative image')}
                  </label>
                  <label className="block text-[11px] font-semibold text-neutral-500">
                    {ui('Caption')}
                    <input
                      value={advanced.caption || ''}
                      onChange={e => updateAdvanced('caption', e.target.value)}
                      maxLength={500}
                      placeholder={ui('Optional caption')}
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                    />
                  </label>
                  <label className="block text-[11px] font-semibold text-neutral-500">
                    {ui('Destination URL')}
                    <input
                      value={advanced.linkUrl || ''}
                      onChange={e => updateAdvanced('linkUrl', e.target.value)}
                      placeholder="https://..."
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                    />
                  </label>
                  <label className="block text-[11px] font-semibold text-neutral-500">
                    {ui('Image fit')}
                    <select
                      value={advanced.fit || 'cover'}
                      onChange={e => updateAdvanced('fit', e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                    >
                      <option value="cover">{ui('Crop to fill')}</option>
                      <option value="contain">{ui('Show full image')}</option>
                    </select>
                  </label>
                  <label className="block text-[11px] font-semibold text-neutral-500">
                    {ui('Image shape')}
                    <select
                      value={advanced.aspect || 'auto'}
                      onChange={e => updateAdvanced('aspect', e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                    >
                      <option value="auto">{ui('Natural')}</option>
                      <option value="square">{ui('Square')}</option>
                      <option value="portrait">{ui('Portrait')}</option>
                      <option value="landscape">{ui('Landscape')}</option>
                    </select>
                  </label>
                  <label className="block text-[11px] font-semibold text-neutral-500">
                    {ui('Crop position')}
                    <select
                      value={advanced.cropPosition || 'center'}
                      onChange={e => updateAdvanced('cropPosition', e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                    >
                      <option value="center">{ui('Center')}</option>
                      <option value="top">{ui('Top')}</option>
                      <option value="bottom">{ui('Bottom')}</option>
                      <option value="left">{ui('Left')}</option>
                      <option value="right">{ui('Right')}</option>
                    </select>
                  </label>
                </div>
                <p className="text-[10px] text-neutral-500">
                  {ui('Informative images need alt text. Mark an image decorative when it adds no meaning. Uploading a replacement does not delete the previous asset.')}
                </p>
              </div>
            )}

            {['download', 'event', 'presave', 'product', 'tips'].includes(block.type) && (
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  {ui('Destination URL')}
                </label>
                <input
                  value={advanced.fileUrl || advanced.url || ''}
                  onChange={e => updateAdvanced(block.type === 'download' ? 'fileUrl' : 'url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                />
                {block.type === 'download' && (
                  <input
                    type="file"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) void handleBlockFileUpload(block.id, file);
                    }}
                    aria-label={ui('Upload downloadable file')}
                    className="mt-2 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] text-neutral-900"
                  />
                )}
              </div>
            )}

            {block.type === 'event' && (
              <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
                <label className="block text-[11px] font-semibold text-neutral-500">
                  {ui('Event description')}
                  <textarea
                    value={advanced.description || ''}
                    onChange={e => updateAdvanced('description', e.target.value)}
                    maxLength={1000}
                    className="mt-1 min-h-20 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                </label>
                <label className="block text-[11px] font-semibold text-neutral-500">
                  {ui('Artwork URL')}
                  <input
                    value={advanced.artworkUrl || ''}
                    onChange={e => updateAdvanced('artworkUrl', e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                </label>
                <label className="block text-[11px] font-semibold text-neutral-500">
                  {ui('Date')}
                  <input
                    value={advanced.date || ''}
                    onChange={e => updateAdvanced('date', e.target.value)}
                    maxLength={100}
                    placeholder={ui('e.g. 12 October 2026')}
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                </label>
                <label className="block text-[11px] font-semibold text-neutral-500">
                  {ui('Time')}
                  <input
                    value={advanced.time || ''}
                    onChange={e => updateAdvanced('time', e.target.value)}
                    maxLength={50}
                    placeholder={ui('e.g. 7:00 PM')}
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                </label>
                <label className="block text-[11px] font-semibold text-neutral-500">
                  {ui('Timezone')}
                  <input
                    value={advanced.timezone || ''}
                    onChange={e => updateAdvanced('timezone', e.target.value)}
                    maxLength={80}
                    placeholder={ui('e.g. AST or UTC+3')}
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                </label>
                <label className="block text-[11px] font-semibold text-neutral-500">
                  {ui('Location')}
                  <input
                    value={advanced.location || ''}
                    onChange={e => updateAdvanced('location', e.target.value)}
                    maxLength={300}
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                </label>
                <p className="text-[10px] font-normal text-neutral-500 sm:col-span-2">
                  {ui('Date and time are displayed exactly as entered. Include the event timezone; Liinx does not convert times for visitors.')}
                </p>
              </div>
            )}

            {block.type === 'presave' && (
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-neutral-500">
                  {ui('Release description')}
                  <textarea
                    value={advanced.description || ''}
                    onChange={e => updateAdvanced('description', e.target.value)}
                    maxLength={1000}
                    className="mt-1 min-h-16 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                </label>
                <p className="mt-1 text-[10px] font-normal text-neutral-500">
                  {ui('External release link only. Liinx does not complete a music-service pre-save or request authorization.')}
                </p>
              </div>
            )}

            {block.type === 'product' && (
              <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
                <label className="block text-[11px] font-semibold text-neutral-500">
                  {ui('Product description')}
                  <textarea
                    value={advanced.description || ''}
                    onChange={e => updateAdvanced('description', e.target.value)}
                    maxLength={1000}
                    className="mt-1 min-h-20 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                </label>
                <label className="block text-[11px] font-semibold text-neutral-500">
                  {ui('Product image URL')}
                  <input
                    value={advanced.imageUrl || ''}
                    onChange={e => updateAdvanced('imageUrl', e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                </label>
                <label className="block text-[11px] font-semibold text-neutral-500">
                  {ui('Price amount')}
                  <input
                    value={advanced.priceAmount || ''}
                    onChange={e => updateAdvanced('priceAmount', e.target.value)}
                    inputMode="decimal"
                    maxLength={11}
                    placeholder={ui('e.g. 29.00')}
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                </label>
                <label className="block text-[11px] font-semibold text-neutral-500">
                  {ui('Currency code')}
                  <input
                    value={advanced.currency || ''}
                    onChange={e => updateAdvanced('currency', e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
                    maxLength={3}
                    placeholder={ui('e.g. USD')}
                    className="mt-1 w-full uppercase rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                </label>
                <p className="text-[10px] font-normal text-neutral-500 sm:col-span-2">
                  {ui('Display-only price. Liinx does not process checkout, inventory, taxes, or payments.')}
                </p>
              </div>
            )}

            {block.type === 'tips' && (
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-neutral-500">
                  {ui('Support description')}
                  <textarea
                    value={advanced.description || ''}
                    onChange={e => updateAdvanced('description', e.target.value)}
                    maxLength={1000}
                    className="mt-1 min-h-16 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                </label>
                <p className="mt-1 text-[10px] font-normal text-neutral-500">
                  {ui('External support link only. Liinx does not process tips or show earnings.')}
                </p>
              </div>
            )}

            {block.type === 'map' && (
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  {ui('Address or place to find')}
                  <input
                    value={advanced.location || ''}
                    onChange={e => updateAdvanced('location', e.target.value)}
                    maxLength={300}
                    placeholder={ui('City or address')}
                    className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                </label>
                <p className="text-[10px] font-normal text-neutral-500">
                  {ui('Directions link only. No embedded map or device location request is used.')}
                </p>
              </div>
            )}

            {block.type === 'phone' && (
              <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
                <label className="block text-[11px] font-semibold text-neutral-500">
                  {ui('Contact action')}
                  <select
                    value={advanced.contactType || 'phone'}
                    onChange={e => updateAdvanced('contactType', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  >
                    <option value="phone">{ui('Click to call')}</option>
                    <option value="email">{ui('Send email')}</option>
                  </select>
                </label>
                {advanced.contactType === 'email' ? (
                  <label className="block text-[11px] font-semibold text-neutral-500">
                    {ui('Email address')}
                    <input
                      value={advanced.email || ''}
                      onChange={e => updateAdvanced('email', e.target.value)}
                      type="email"
                      dir="ltr"
                      placeholder="hello@example.com"
                      className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                    />
                  </label>
                ) : (
                  <label className="block text-[11px] font-semibold text-neutral-500">
                    {ui('Phone number')}
                    <input
                      value={advanced.phone || ''}
                      onChange={e => updateAdvanced('phone', e.target.value)}
                      dir="ltr"
                      inputMode="tel"
                      placeholder="+966 50 123 4567"
                      className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                    />
                    <span className="mt-1 block text-[10px] font-normal text-neutral-500">
                      {ui('Include country code; spaces, parentheses, and hyphens are allowed.')}
                    </span>
                  </label>
                )}
                <label className="block text-[11px] font-semibold text-neutral-500">
                  {ui('Availability')}
                  <input
                    value={advanced.availability || ''}
                    onChange={e => updateAdvanced('availability', e.target.value)}
                    maxLength={200}
                    placeholder={ui('Optional availability')}
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                </label>
                <label className="block text-[11px] font-semibold text-neutral-500">
                  {ui('Contact description')}
                  <textarea
                    value={advanced.description || ''}
                    onChange={e => updateAdvanced('description', e.target.value)}
                    maxLength={1000}
                    className="mt-1 min-h-16 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                </label>
                {advanced.contactType === 'email' && (
                  <>
                    <label className="block text-[11px] font-semibold text-neutral-500">
                      {ui('Email subject')}
                      <input
                        value={advanced.subject || ''}
                        onChange={e => updateAdvanced('subject', e.target.value)}
                        maxLength={200}
                        className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                      />
                    </label>
                    <label className="block text-[11px] font-semibold text-neutral-500">
                      {ui('Email message')}
                      <textarea
                        value={advanced.body || ''}
                        onChange={e => updateAdvanced('body', e.target.value)}
                        maxLength={1000}
                        className="mt-1 min-h-16 w-full rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                      />
                    </label>
                  </>
                )}
                <p className="text-[10px] font-normal text-neutral-500 sm:col-span-2">
                  {ui('This is a creator-published contact action, not a form. Visitors are not asked to submit data to Liinx.')}
                </p>
              </div>
            )}

            {block.type === 'form' && (
              <div className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
                <label className="flex items-start gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={advanced.consentRequired === true}
                    onChange={e => updateAdvanced('consentRequired', e.target.checked)}
                    className="mt-0.5"
                  />
                  {ui('Require visitor consent before storing responses')}
                </label>
                <p className="mt-1 pl-5 font-normal">
                  {ui('Do not imply consent is collected unless this is enabled. Liinx does not send notifications automatically.')}
                </p>
                {advanced.consentRequired === true && (
                  <input
                    value={advanced.consentText || ''}
                    onChange={e => updateAdvanced('consentText', e.target.value)}
                    maxLength={300}
                    placeholder={ui('Consent text (optional)')}
                    aria-label={ui('Consent text')}
                    className="mt-2 w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-[11px] text-neutral-900"
                  />
                )}
              </div>
            )}

            {['gallery', 'carousel', 'faq', 'testimonials', 'form'].includes(block.type) && (
              <StructuredItemsEditor
                kind={block.type as StructuredEditorKind}
                value={advanced.items || advanced.fields || []}
                onChange={items => updateAdvanced(block.type === 'form' ? 'fields' : 'items', items)}
                onUpload={(file, _index, itemId) => void handleBlockImageUpload(block.id, file, 'imageUrl', undefined, itemId)}
                ui={ui}
              />
            )}

            {block.type === 'spacer' && (() => {
              const parsedHeight = Number(advanced.height);
              const spacerHeight = Number.isFinite(parsedHeight) ? Math.min(240, Math.max(16, parsedHeight)) : 48;
              return (
                <div>
                  <label htmlFor={`spacer-height-${block.id}`} className="block text-[11px] font-semibold text-neutral-500 mb-1">
                    {ui('Height (px)')}
                  </label>
                  <input
                    id={`spacer-height-${block.id}`}
                    type="number"
                    min="16"
                    max="240"
                    step="1"
                    value={spacerHeight}
                    onChange={e => {
                      const next = Number(e.target.value);
                      updateAdvanced('height', Number.isFinite(next) ? Math.min(240, Math.max(16, next)) : 48);
                    }}
                    aria-describedby={`spacer-help-${block.id}`}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                  />
                  <p id={`spacer-help-${block.id}`} className="mt-1 text-[10px] font-normal text-neutral-500">
                    {ui(`Adds ${spacerHeight}px of intentional space. Normal block gaps are not added around this spacer.`)}
                  </p>
                </div>
              );
            })()}

            {block.type === 'content_gate' && (
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  {ui('Access code')}
                </label>
                <input
                  type="password"
                  value={advanced.password || ''}
                  onChange={e => updateAdvanced('password', e.target.value)}
                  placeholder={advanced.locked ? ui('Leave blank to keep the current code; enter a new code to replace it.') : ui('Set a code to protect this text.')}
                  maxLength={128}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900"
                />
                <p className="mt-1 text-[10px] font-normal text-neutral-500">
                  {ui('Content gates protect inline text only. They do not provide membership or identity verification.')}
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {block.type === 'folder' && (
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <label className="block text-[11px] font-semibold text-neutral-500">
            {ui('Folder description')}
            <input
              value={(block as FolderBlock).subtitle || ''}
              onChange={e => handleUpdateBlockField(block.id, 'subtitle', e.target.value)}
              maxLength={250}
              placeholder={ui('Optional description')}
              className="mt-1 w-full rounded border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-900"
            />
          </label>
          <p className="text-[10px] text-neutral-500">
            {ui('Folders are collapsible one-level link groups, not subpages. Nested folders are not supported.')}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-700">{ui("Folder Links")}</span>
            <button
              type="button"
              onClick={() => handleAddFolderItem(block.id)}
              className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> {ui("Add Item")}
            </button>
          </div>
          {((block as FolderBlock).items || []).length === 0 && (
            <p className="py-2 text-[11px] text-neutral-500">{ui('No folder links yet. Add one to begin.')}</p>
          )}
          {((block as FolderBlock).items || []).map((item, itemIndex) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                aria-label={ui("Title")}
                type="text"
                value={item.title}
                onChange={(e) => handleUpdateFolderItem(block.id, item.id, 'title', e.target.value)}
                placeholder={ui("Title")}
                className="w-1/3 px-2 py-1 rounded border border-neutral-200 text-[11px] bg-neutral-50 text-neutral-900"
              />
              <input
                aria-label={ui("Destination URL")}
                type="text"
                value={item.url}
                onChange={(e) => handleUpdateFolderItem(block.id, item.id, 'url', e.target.value)}
                placeholder="https://..."
                className="flex-1 px-2 py-1 rounded border border-neutral-200 text-[11px] font-mono bg-neutral-50 text-neutral-900"
              />
              <button
                type="button"
                onClick={() => handleMoveFolderItem(block.id, item.id, -1)}
                disabled={itemIndex === 0}
                aria-label={ui('Move item up')}
                className="rounded p-1 text-neutral-500 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => handleMoveFolderItem(block.id, item.id, 1)}
                disabled={itemIndex === (block as FolderBlock).items.length - 1}
                aria-label={ui('Move item down')}
                className="rounded p-1 text-neutral-500 disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => handleRemoveFolderItem(block.id, item.id)}
                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
