import React from 'react';
import { type AudioBlock, type NewsletterBlock, type VideoBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';

interface MediaFieldsProps {
  block: AudioBlock | VideoBlock | NewsletterBlock;
}

export const AudioFields: React.FC<MediaFieldsProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { handleUpdateBlockExtra } = useBuilder();
  const audio = block as AudioBlock;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <div>
          <label htmlFor={`block-cover-url-${audio.id}`} className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Album Cover Image URL")}</label>
          <input
            id={`block-cover-url-${audio.id}`}
            name="blockCoverUrl"
            aria-label={ui("Album Cover Image URL")}
            type="text"
            value={audio.coverUrl || ''}
            onChange={(e) => handleUpdateBlockExtra(audio.id, { coverUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-xs text-neutral-900"
          />
        </div>
        <div>
          <label htmlFor={`block-audio-url-${audio.id}`} className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Streaming Link")}</label>
          <input
            id={`block-audio-url-${audio.id}`}
            name="blockAudioUrl"
            aria-label={ui("Streaming Link")}
            type="text"
            value={audio.audioUrl || ''}
            onChange={(e) => handleUpdateBlockExtra(audio.id, { audioUrl: e.target.value })}
            placeholder="https://open.spotify.com/..."
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-xs text-neutral-900"
          />
        </div>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        {ui('Supported: Spotify track, album, playlist, artist, or episode URLs; Apple Music pages; SoundCloud tracks; or direct HTTPS MP3, WAV, OGG, M4A, or AAC files. Playback never starts automatically.')}
      </p>
    </>
  );
};

export const VideoFields: React.FC<MediaFieldsProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { handleUpdateBlockExtra } = useBuilder();
  const video = block as VideoBlock;

  return (
    <div>
      <label htmlFor={`block-video-thumb-${video.id}`} className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Thumbnail Preview Image URL")}</label>
      <input
        id={`block-video-thumb-${video.id}`}
        name="blockThumbnailUrl"
        aria-label={ui("Thumbnail Preview Image URL")}
        type="text"
        value={video.thumbnailUrl || ''}
        onChange={(e) => handleUpdateBlockExtra(video.id, { thumbnailUrl: e.target.value })}
        placeholder="https://..."
        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 font-mono text-xs text-neutral-900"
      />
      <p className="mt-1 text-xs font-normal text-neutral-500">
        {ui('Optional thumbnail. If it is unavailable, visitors see a neutral fallback. Remote video is hosted by the selected provider or media host; RALOA does not host these URLs.')}
      </p>
    </div>
  );
};

export const NewsletterFields: React.FC<MediaFieldsProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { handleUpdateBlockExtra } = useBuilder();
  const newsletter = block as NewsletterBlock;

  return (
    <div>
      <label htmlFor={`block-newsletter-desc-${newsletter.id}`} className="block text-xs font-semibold text-neutral-500 mb-1">{ui("Newsletter Description")}</label>
      <input
        id={`block-newsletter-desc-${newsletter.id}`}
        name="blockNewsletterDesc"
        aria-label={ui("Newsletter Description")}
        type="text"
        value={newsletter.description || ''}
        onChange={(e) => handleUpdateBlockExtra(newsletter.id, { description: e.target.value })}
        placeholder={ui("What will subscribers get?")}
        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-900 text-neutral-900"
      />
    </div>
  );
};
