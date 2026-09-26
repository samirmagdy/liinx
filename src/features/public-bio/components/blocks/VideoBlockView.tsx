import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { type ThemeConfig, type VideoBlock } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { getYouTubeEmbedUrl, getVimeoEmbedUrl, isDirectVideoFile } from '../../../../utils/mediaEmbeds';
import { safePublicHref, getRadiusClass } from '../../utils/publicBio.utils';

interface VideoBlockViewProps {
  block: VideoBlock;
  theme: ThemeConfig;
  activeVideoId: string | null;
  setActiveVideoId: (id: string | null) => void;
}

export const VideoBlockView: React.FC<VideoBlockViewProps> = ({
  block,
  theme,
  activeVideoId,
  setActiveVideoId
}) => {
  const { tr: ui } = useUiLanguage();
  const [videoThumbnailFailures, setVideoThumbnailFailures] = useState<Record<string, boolean>>({});

  const ytEmbed = getYouTubeEmbedUrl(block.videoUrl);
  const vimeoEmbed = getVimeoEmbedUrl(block.videoUrl);
  const directVideo = isDirectVideoFile(block.videoUrl);
  const isPlaying = activeVideoId === block.id;
  const videoSource = safePublicHref(block.videoUrl);
  const thumbnailSource = safePublicHref(block.thumbnailUrl);
  const hasThumbnail = Boolean(thumbnailSource && !videoThumbnailFailures[block.id]);

  return (
    <div
      className={`overflow-hidden transition-shadow duration-200 shadow-sm group ${getRadiusClass(theme.cardRadius, true)}`}
      style={{
        backgroundColor: theme.cardBg,
        border: theme.cardBorder,
        color: theme.cardText
      }}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {isPlaying && ytEmbed ? (
          <iframe
            src={ytEmbed}
            title={block.title}
            loading="lazy"
            className="w-full h-full border-0"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : isPlaying && vimeoEmbed ? (
          <iframe
            src={vimeoEmbed}
            title={block.title}
            loading="lazy"
            className="w-full h-full border-0"
            allow="fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : isPlaying && directVideo ? (
          <video
            src={block.videoUrl}
            controls
            preload="metadata"
            className="w-full h-full object-cover"
          />
        ) : (
          <button
            type="button"
            disabled={!ytEmbed && !vimeoEmbed && !directVideo && !videoSource}
            onClick={() => {
              if (ytEmbed || vimeoEmbed || directVideo) {
                setActiveVideoId(block.id);
              } else if (videoSource) {
                window.open(videoSource, '_blank', 'noopener,noreferrer');
              }
            }}
            className="block relative w-full h-full text-left focus-visible:ring-2 focus-visible:ring-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-80"
            aria-label={
              ytEmbed || vimeoEmbed || directVideo
                ? `Play ${block.title}`
                : videoSource
                ? ui('Open video externally')
                : ui('Video unavailable')
            }
          >
            {hasThumbnail ? (
              <img
                src={thumbnailSource || undefined}
                alt={block.title}
                loading="lazy"
                onError={() => setVideoThumbnailFailures(prev => ({ ...prev, [block.id]: true }))}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                role="img"
                aria-label={ui('Video thumbnail unavailable')}
                className="flex h-full w-full items-center justify-center bg-neutral-800 text-xs text-white/80"
              >
                {ui('Video preview unavailable')}
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-red-700 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
            </div>
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 p-4" dir="auto">
        <p className="text-sm font-bold line-clamp-1" dir="auto">{block.title}</p>
        {videoSource && (
          <a
            href={videoSource}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-xs font-semibold underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-current"
          >
            {ui('Open video')}
          </a>
        )}
      </div>
    </div>
  );
};
