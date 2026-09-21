import React from 'react';
import {
  type AudioBlock,
  type LinkBlock,
  type NewsletterBlock,
  type ProfileBlock,
  type VideoBlock
} from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';

interface BlockCoreFieldsProps {
  block: ProfileBlock;
}

export const BlockCoreFields: React.FC<BlockCoreFieldsProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { handleUpdateBlockField, handleUpdateBlockExtra } = useBuilder();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
      <div>
        <label htmlFor={`block-title-${block.id}`} className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Title")}</label>
        <input
          id={`block-title-${block.id}`}
          name="blockTitle"
          aria-label={ui("Title")}
          type="text"
          value={block.title}
          onChange={(e) => handleUpdateBlockField(block.id, 'title', e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
        />
      </div>

      {(block.type === 'link' || block.type === 'booking') && (
        <div>
          <label htmlFor={`block-url-${block.id}`} className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Destination URL")}</label>
          <input
            id={`block-url-${block.id}`}
            name="blockUrl"
            aria-label={ui("Destination URL")}
            type="text"
            value={(block as LinkBlock).url || ''}
            onChange={(e) => handleUpdateBlockField(block.id, 'url', e.target.value)}
            placeholder="https://..."
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-xs text-neutral-900"
          />
        </div>
      )}

      {block.type === 'audio' && (
        <div>
          <label htmlFor={`block-artist-${block.id}`} className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Artist Name")}</label>
          <input
            id={`block-artist-${block.id}`}
            name="blockArtist"
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
          <label htmlFor={`block-video-url-${block.id}`} className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Video Stream URL")}</label>
          <input
            id={`block-video-url-${block.id}`}
            name="blockVideoUrl"
            aria-label={ui("Video Stream URL")}
            type="text"
            value={(block as VideoBlock).videoUrl || ''}
            onChange={(e) => handleUpdateBlockExtra(block.id, { videoUrl: e.target.value })}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-xs text-neutral-900"
          />
          <p className="mt-1 text-xs font-normal text-neutral-500">
            {ui('Supported: YouTube watch, youtu.be, or Shorts URLs; Vimeo links; or direct HTTPS MP4, WebM, OGV, or MOV files. Other HTTPS URLs remain external fallback links. Playback is never started automatically.')}
          </p>
        </div>
      )}

      {block.type === 'newsletter' && (
        <div>
          <label htmlFor={`block-button-text-${block.id}`} className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Button CTA Text")}</label>
          <input
            id={`block-button-text-${block.id}`}
            name="blockButtonText"
            aria-label={ui("Button CTA Text")}
            type="text"
            value={(block as NewsletterBlock).buttonText || 'Subscribe'}
            onChange={(e) => handleUpdateBlockExtra(block.id, { buttonText: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
          />
        </div>
      )}
    </div>
  );
};
