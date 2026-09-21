import React, { useState } from 'react';
import { Play, Pause, Music2 } from 'lucide-react';
import { type BlockItem, type ThemeConfig } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import {
  getSpotifyEmbedUrl,
  getSoundCloudEmbedUrl,
  getAppleMusicEmbedUrl,
  isDirectAudioFile
} from '../../../../utils/mediaEmbeds';
import { safePublicHref, getRadiusClass } from '../../utils/publicBio.utils';

interface AudioBlockViewProps {
  block: BlockItem;
  theme: ThemeConfig;
  playingAudioId: string | null;
  setPlayingAudioId: (id: string | null) => void;
  activeEmbeddedAudioId: string | null;
  setActiveEmbeddedAudioId: (id: string | null) => void;
}

export const AudioBlockView: React.FC<AudioBlockViewProps> = ({
  block,
  theme,
  playingAudioId,
  setPlayingAudioId,
  activeEmbeddedAudioId,
  setActiveEmbeddedAudioId
}) => {
  const { tr: ui } = useUiLanguage();
  const [audioArtworkFailures, setAudioArtworkFailures] = useState<Record<string, boolean>>({});
  const [audioFailures, setAudioFailures] = useState<Record<string, boolean>>({});

  const spotifyEmbed = getSpotifyEmbedUrl(block.audioUrl);
  const soundCloudEmbed = getSoundCloudEmbedUrl(block.audioUrl);
  const appleMusicEmbed = getAppleMusicEmbedUrl(block.audioUrl);
  const directAudio = isDirectAudioFile(block.audioUrl);
  const audioSource = safePublicHref(block.audioUrl);
  const coverSource = safePublicHref(block.coverUrl);
  const isPlayingAudio = playingAudioId === block.id;
  const hasArtwork = Boolean(coverSource && !audioArtworkFailures[block.id]);

  const embedFooter = audioSource ? (
    <a
      href={audioSource}
      target="_blank"
      rel="noreferrer"
      className="block px-3 pb-3 text-xs font-semibold underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-current"
    >
      {ui('Open audio provider')}
    </a>
  ) : (
    <p className="px-3 pb-3 text-xs" style={{ color: theme.subtextColor }}>
      {ui('Audio unavailable')}
    </p>
  );

  const embedPlaceholder = (
    <button
      type="button"
      onClick={() => setActiveEmbeddedAudioId(block.id)}
      className="flex h-28 w-full items-center justify-center gap-2 bg-neutral-100 px-4 text-xs font-semibold text-neutral-700 focus-visible:ring-2 focus-visible:ring-current"
      aria-label={ui('Load audio player')}
    >
      <Play className="h-4 w-4" />
      {ui('Load audio player')}
    </button>
  );

  if (spotifyEmbed) {
    return (
      <div
        className={`overflow-hidden transition-shadow duration-200 shadow-sm ${getRadiusClass(theme.cardRadius, true)}`}
        style={{
          backgroundColor: theme.cardBg,
          border: theme.cardBorder,
          color: theme.cardText
        }}
      >
        <div className="px-3 pt-3" dir="auto">
          <p className="truncate text-sm font-bold">{block.title}</p>
          <p className="truncate text-xs" style={{ color: theme.subtextColor }}>{block.artist}</p>
        </div>
        {activeEmbeddedAudioId === block.id ? (
          <iframe
            src={spotifyEmbed}
            width="100%"
            height="152"
            frameBorder="0"
            allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="w-full border-0 block"
            title={block.title}
          />
        ) : (
          embedPlaceholder
        )}
        {embedFooter}
      </div>
    );
  }

  if (soundCloudEmbed) {
    return (
      <div
        className={`overflow-hidden transition-shadow duration-200 shadow-sm ${getRadiusClass(theme.cardRadius, true)}`}
        style={{
          backgroundColor: theme.cardBg,
          border: theme.cardBorder,
          color: theme.cardText
        }}
      >
        <div className="px-3 pt-3" dir="auto">
          <p className="truncate text-sm font-bold">{block.title}</p>
          <p className="truncate text-xs" style={{ color: theme.subtextColor }}>{block.artist}</p>
        </div>
        {activeEmbeddedAudioId === block.id ? (
          <iframe
            width="100%"
            height="140"
            scrolling="no"
            frameBorder="no"
            allow=""
            src={soundCloudEmbed}
            loading="lazy"
            className="w-full border-0 block"
            title={block.title}
          />
        ) : (
          embedPlaceholder
        )}
        {embedFooter}
      </div>
    );
  }

  if (appleMusicEmbed) {
    return (
      <div
        className={`overflow-hidden transition-shadow duration-200 shadow-sm ${getRadiusClass(theme.cardRadius, true)}`}
        style={{
          backgroundColor: theme.cardBg,
          border: theme.cardBorder,
          color: theme.cardText
        }}
      >
        <div className="px-3 pt-3" dir="auto">
          <p className="truncate text-sm font-bold">{block.title}</p>
          <p className="truncate text-xs" style={{ color: theme.subtextColor }}>{block.artist}</p>
        </div>
        {activeEmbeddedAudioId === block.id ? (
          <iframe
            allow="encrypted-media *; fullscreen *; clipboard-write"
            frameBorder="0"
            height="175"
            className="w-full border-0 block"
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
            src={appleMusicEmbed}
            title={block.title}
          />
        ) : (
          embedPlaceholder
        )}
        {embedFooter}
      </div>
    );
  }

  return (
    <div
      className={`p-4 transition-shadow duration-200 shadow-sm ${getRadiusClass(theme.cardRadius, true)}`}
      style={{
        backgroundColor: theme.cardBg,
        border: theme.cardBorder,
        color: theme.cardText
      }}
    >
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-sm">
          {hasArtwork ? (
            <img
              src={coverSource || undefined}
              alt={block.title}
              loading="lazy"
              onError={() => setAudioArtworkFailures(prev => ({ ...prev, [block.id]: true }))}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              role="img"
              aria-label={ui('Artwork unavailable')}
              className="flex h-full w-full items-center justify-center bg-neutral-200 text-neutral-500"
            >
              <Music2 className="h-5 w-5" />
            </div>
          )}
          {directAudio ? (
            <button
              onClick={() => {
                const audioEl = document.getElementById(`audio-player-${block.id}`) as HTMLAudioElement | null;
                if (audioEl) {
                  if (audioEl.paused) {
                    document
                      .querySelectorAll<HTMLAudioElement>('audio[data-raloa-audio="true"]')
                      .forEach(other => {
                        if (other !== audioEl) other.pause();
                      });
                    void audioEl
                      .play()
                      .then(() => setPlayingAudioId(block.id))
                      .catch(() => setAudioFailures(prev => ({ ...prev, [block.id]: true })));
                  } else {
                    audioEl.pause();
                    setPlayingAudioId(null);
                  }
                }
              }}
              className="absolute inset-0 bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors focus-visible:ring-2 focus-visible:ring-white"
              aria-label={ui('Play track')}
            >
              {isPlayingAudio ? (
                <Pause className="w-5 h-5 fill-white text-white" />
              ) : (
                <Play className="w-5 h-5 fill-white text-white ml-0.5" />
              )}
            </button>
          ) : audioSource ? (
            <a
              href={audioSource}
              target="_blank"
              rel="noreferrer"
              className="absolute inset-0 bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors focus-visible:ring-2 focus-visible:ring-white"
              aria-label={ui('Listen track')}
            >
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            </a>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white"
              role="status"
            >
              {ui('Audio unavailable')}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0" dir="auto">
          <div className="flex items-center gap-1.5 text-xs mb-0.5" style={{ color: theme.subtextColor }}>
            <Music2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="uppercase font-mono tracking-caps font-semibold">{ui('Audio Track')}</span>
          </div>
          <p className="text-sm font-bold truncate" dir="auto">{block.title}</p>
          <p className="text-xs truncate" style={{ color: theme.subtextColor }} dir="auto">{block.artist}</p>
        </div>

        {isPlayingAudio && (
          <div className="flex items-end gap-1 h-6 px-2 shrink-0">
            <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_100ms] h-5" />
            <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_300ms] h-6" />
            <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_200ms] h-4" />
          </div>
        )}
      </div>

      {audioFailures[block.id] && (
        <p role="alert" className="mt-2 text-xs text-rose-600">
          {ui('This audio file could not be played. Try the external link.')}
        </p>
      )}

      {directAudio && audioSource && (
        <audio
          id={`audio-player-${block.id}`}
          src={audioSource}
          controls
          preload="metadata"
          data-raloa-audio="true"
          className="w-full mt-3 h-8"
          onPlay={event => {
            const current = event.currentTarget;
            document
              .querySelectorAll<HTMLAudioElement>('audio[data-raloa-audio="true"]')
              .forEach(other => {
                if (other !== current) other.pause();
              });
            setPlayingAudioId(block.id);
          }}
          onPause={() => setPlayingAudioId(null)}
          onEnded={() => setPlayingAudioId(null)}
          onError={() => setAudioFailures(prev => ({ ...prev, [block.id]: true }))}
        />
      )}
    </div>
  );
};
