import React, { useState } from 'react';
import {
  ExternalLink,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Music2
} from 'lucide-react';
import { type ProfileBlock, type ThemeConfig, type LinkBlock, type AudioBlock, type VideoBlock, type FolderBlock, type InstagramGridBlock, type NewsletterBlock } from '../../types';
import { BookingCard } from '../BookingCard';
import { isDocumentBlock, PhoneDocumentBlock } from './PhoneDocumentBlock';
import { PhoneNewsletterBlock } from './PhoneNewsletterBlock';
import {
  getSpotifyEmbedUrl,
  getSoundCloudEmbedUrl,
  getAppleMusicEmbedUrl,
  getYouTubeEmbedUrl,
  getVimeoEmbedUrl,
  isDirectAudioFile,
  isDirectVideoFile
} from '../../utils/mediaEmbeds';
import { getAccessibleTextColor } from '../../utils/colorContrast';
import { useLanguage as useUiLanguage } from '../../context/LanguageContext';

interface PhoneBlocksListProps {
  blocks?: ProfileBlock[];
  theme: ThemeConfig;
  interactive?: boolean;
  onLinkClick?: (block: ProfileBlock) => void;
  onSubscribeNotice?: (message: string) => void;
  /** Only forms need it, and only when the preview is live enough to accept a submission. */
  profileId?: string;
}

export const PhoneBlocksList: React.FC<PhoneBlocksListProps> = ({
  blocks,
  theme,
  interactive = true,
  onLinkClick,
  onSubscribeNotice,
  profileId = ''
}) => {
  const { tr: ui } = useUiLanguage();
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ b3: true });
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const getRadiusClass = (radius: ThemeConfig['cardRadius'], isComplex: boolean = false) => {
    switch (radius) {
      case 'none': return 'rounded-none';
      case 'md': return 'rounded-xl';
      case 'xl': return 'rounded-2xl';
      case 'full': return isComplex ? 'rounded-2xl' : 'rounded-full';
      default: return 'rounded-2xl';
    }
  };

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    onSubscribeNotice?.(ui('Interactive preview only. Open the live page to subscribe.'));
  };

  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <div className="space-y-3 mb-8">
      {blocks.map((block, index) => {
        if (block.type === 'booking') {
          return (
            <div key={block.id} data-feature="booking" className="transition-all duration-300">
              <BookingCard block={block} theme={theme} previewOnly={!interactive} />
            </div>
          );
        }

        if (block.type === 'link') {
          const linkBlock = block as LinkBlock;
          const isComplexLink = Boolean(linkBlock.subtitle);
          const isPill = theme.cardRadius === 'full' && !isComplexLink;
          return (
            <div
              key={block.id}
              onClick={() => onLinkClick?.(block)}
              className={`group relative theme-card-shape ${isPill ? 'px-5 py-3.5' : 'p-3.5'} transition-shadow duration-200 cursor-pointer flex items-center justify-between gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 ${getRadiusClass(theme.cardRadius, isComplexLink)}`}
              style={{
                backgroundColor: linkBlock.highlighted ? (theme.isDark ? '#23242A' : '#FFFFFF') : theme.buttonStyle === 'ghost' ? 'transparent' : theme.buttonStyle === 'outline' ? 'transparent' : theme.cardBg,
                border: linkBlock.highlighted ? `2px solid ${theme.accentColor}` : theme.buttonStyle === 'ghost' ? '1px solid transparent' : theme.buttonStyle === 'outline' ? `1px solid ${theme.accentColor}` : theme.cardBorder,
                color: theme.cardText
              }}
            >
              <div className="flex-1 min-w-0" dir="auto">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-xs tracking-tight truncate" dir="auto">
                    {block.title}
                  </span>
                  {linkBlock.badge && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-caps uppercase shrink-0"
                      style={{
                        backgroundColor: theme.accentColor,
                        color: getAccessibleTextColor(theme.accentColor)
                      }}
                    >
                      {linkBlock.badge}
                    </span>
                  )}
                </div>
                {linkBlock.subtitle && (
                  <p className="text-[11px] truncate" style={{ color: theme.subtextColor }} dir="auto">
                    {linkBlock.subtitle}
                  </p>
                )}
              </div>
              <div className="p-1 rounded-full opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform shrink-0">
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        }

        if (block.type === 'header') {
          return (
            <div key={block.id} className="pt-3 pb-1 text-center" dir="auto">
              <h3 className="text-xs font-bold uppercase tracking-widest" dir="auto">
                {block.title}
              </h3>
            </div>
          );
        }

        if (block.type === 'audio') {
          const audioBlock = block as AudioBlock;
          const spotifyEmbed = getSpotifyEmbedUrl(audioBlock.audioUrl);
          const soundCloudEmbed = getSoundCloudEmbedUrl(audioBlock.audioUrl);
          const appleMusicEmbed = getAppleMusicEmbedUrl(audioBlock.audioUrl);
          const directAudio = isDirectAudioFile(audioBlock.audioUrl);

          if (spotifyEmbed) {
            return (
              <div
                key={block.id}
                data-feature="audio"
                className={`overflow-hidden transition-shadow shadow-xs ${getRadiusClass(theme.cardRadius, true)} transition-all duration-300`}
                style={{ backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText }}
              >
                <iframe
                  src={spotifyEmbed}
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="w-full border-0 block"
                  title={block.title}
                />
              </div>
            );
          }

          if (soundCloudEmbed) {
            return (
              <div
                key={block.id}
                className={`overflow-hidden transition-shadow shadow-xs ${getRadiusClass(theme.cardRadius, true)}`}
                style={{ backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText }}
              >
                <iframe
                  width="100%"
                  height="120"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  src={soundCloudEmbed}
                  className="w-full border-0 block"
                  title={block.title}
                />
              </div>
            );
          }

          if (appleMusicEmbed) {
            return (
              <div
                key={block.id}
                className={`overflow-hidden transition-shadow shadow-xs ${getRadiusClass(theme.cardRadius, true)}`}
                style={{ backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText }}
              >
                <iframe
                  allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                  frameBorder="0"
                  height="150"
                  className="w-full border-0 block"
                  sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                  src={appleMusicEmbed}
                  title={block.title}
                />
              </div>
            );
          }

          return (
            <div
              key={block.id}
              data-feature="audio"
              className={`p-3.5 transition-shadow shadow-xs ${getRadiusClass(theme.cardRadius, true)} transition-all duration-300`}
              style={{ backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText }}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-xs">
                  <img
                    src={audioBlock.coverUrl}
                    alt={block.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {directAudio ? (
                    <button
                      onClick={() => {
                        const audioEl = document.getElementById(`phone-audio-${block.id}`) as HTMLAudioElement;
                        if (audioEl) {
                          if (audioEl.paused) {
                            audioEl.play();
                            setIsPlayingAudio(true);
                          } else {
                            audioEl.pause();
                            setIsPlayingAudio(false);
                          }
                        }
                      }}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors focus-visible:ring-2 focus-visible:ring-white"
                      aria-label={isPlayingAudio ? ui('Pause track') : ui('Play track')}
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-4 h-4 fill-white text-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      )}
                    </button>
                  ) : (
                    <a
                      href={audioBlock.audioUrl || `/r/${block.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors focus-visible:ring-2 focus-visible:ring-white"
                      aria-label={ui('Listen track')}
                    >
                      <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                    </a>
                  )}
                </div>

                <div className="flex-1 min-w-0" dir="auto">
                  <div className="flex items-center gap-1.5 text-[11px] mb-0.5" style={{ color: theme.subtextColor }}>
                    <Music2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="uppercase font-mono tracking-caps font-semibold">{ui('Audio Track')}</span>
                  </div>
                  <p className="text-xs font-bold truncate" dir="auto">{block.title}</p>
                  <p className="text-[11px] truncate" style={{ color: theme.subtextColor }} dir="auto">{audioBlock.artist}</p>
                </div>

                {isPlayingAudio && (
                  <div className="flex items-end gap-0.5 h-5 px-1 shrink-0">
                    <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_100ms] h-4" />
                    <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_300ms] h-5" />
                    <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_200ms] h-3" />
                  </div>
                )}
              </div>

              {directAudio && (
                <audio
                  id={`phone-audio-${block.id}`}
                  src={audioBlock.audioUrl}
                  controls
                  className="w-full mt-2.5 h-7"
                  onPlay={() => setIsPlayingAudio(true)}
                  onPause={() => setIsPlayingAudio(false)}
                  onEnded={() => setIsPlayingAudio(false)}
                />
              )}
            </div>
          );
        }

        if (block.type === 'folder') {
          const folderBlock = block as FolderBlock;
          const isOpen = openFolders[block.id];
          return (
            <div
              key={block.id}
              data-feature="folders"
              className={`overflow-hidden transition-shadow duration-200 border shadow-xs ${getRadiusClass(theme.cardRadius, true)} transition-all duration-300`}
              style={{ backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText }}
            >
              <button
                onClick={() => toggleFolder(block.id)}
                className="w-full p-3.5 flex items-center justify-between text-left transition-opacity hover:opacity-90 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 gap-2"
              >
                <div className="min-w-0 flex-1" dir="auto">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs truncate" dir="auto">{block.title}</span>
                    <span
                      className="text-[11px] px-1.5 py-0.5 rounded-full font-mono shrink-0"
                      style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.12)' : '#F5F5F5', color: theme.cardText }}
                    >
                      {folderBlock.items.length} {ui('items')}
                    </span>
                  </div>
                  {folderBlock.subtitle && (
                    <p className="text-[11px] truncate mt-0.5 text-pretty" style={{ color: theme.subtextColor }} dir="auto">{folderBlock.subtitle}</p>
                  )}
                </div>
                <div className="p-1 rounded-full opacity-60 shrink-0">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-neutral-200 dark:border-white/10">
                  {folderBlock.items.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl block transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900/5 group focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium group-hover:underline truncate" dir="auto">{item.title}</span>
                        <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-100 shrink-0" />
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] truncate mt-0.5" style={{ color: theme.subtextColor }} dir="auto">{item.subtitle}</p>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (block.type === 'video') {
          const videoBlock = block as VideoBlock;
          const ytEmbed = getYouTubeEmbedUrl(videoBlock.videoUrl);
          const vimeoEmbed = getVimeoEmbedUrl(videoBlock.videoUrl);
          const directVideo = isDirectVideoFile(videoBlock.videoUrl);
          const isPlaying = activeVideoId === block.id;

          return (
            <div
              key={block.id}
              className={`overflow-hidden transition-shadow shadow-xs group ${getRadiusClass(theme.cardRadius, true)}`}
              style={{ backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText }}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black">
                {isPlaying && ytEmbed ? (
                  <iframe
                    src={ytEmbed}
                    title={block.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : isPlaying && vimeoEmbed ? (
                  <iframe
                    src={vimeoEmbed}
                    title={block.title}
                    className="w-full h-full border-0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : isPlaying && directVideo ? (
                  <video src={videoBlock.videoUrl} controls autoPlay className="w-full h-full object-cover" />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (ytEmbed || vimeoEmbed || directVideo) {
                        setActiveVideoId(block.id);
                      } else {
                        window.open(videoBlock.videoUrl || `/r/${block.id}`, '_blank', 'noreferrer');
                      }
                    }}
                    className="block relative w-full h-full text-left focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                    aria-label={`${ui('Play track')} ${block.title}`}
                  >
                    <img
                      src={videoBlock.thumbnailUrl}
                      alt={block.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-700 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                  </button>
                )}
              </div>
              <div className="p-3" dir="auto">
                <p className="text-xs font-semibold line-clamp-1" dir="auto">{block.title}</p>
              </div>
            </div>
          );
        }

        if (block.type === 'instagram_grid') {
          const igBlock = block as InstagramGridBlock;
          return (
            <div
              key={block.id}
              className={`p-3 transition-shadow shadow-xs ${getRadiusClass(theme.cardRadius, true)}`}
              style={{ backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText }}
            >
              <div className="flex items-center justify-between mb-2" dir="auto">
                <span className="text-xs font-semibold" dir="auto">{block.title}</span>
                <span className="text-[11px] font-mono opacity-60 shrink-0">{igBlock.handle}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {igBlock.posts.map(post => (
                  <div key={post.id} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img
                      src={post.imageUrl}
                      alt={ui('Post')}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-mono">
                      ♥ {post.likes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (block.type === 'newsletter') {
          return (
            <PhoneNewsletterBlock
              key={block.id}
              block={block as NewsletterBlock}
              theme={theme}
              radiusClass={getRadiusClass(theme.cardRadius, true)}
              email={newsletterEmail}
              onEmailChange={setNewsletterEmail}
              onSubscribe={handleSubscribe}
            />
          );
        }

        if (isDocumentBlock(block.type)) {
          return (
            <PhoneDocumentBlock
              key={block.id}
              block={block}
              theme={theme}
              blockIndex={index}
              blockCount={blocks.length}
              profileId={profileId}
            />
          );
        }

        if (block.type === 'content_gate') {
          const gate = block as ProfileBlock & { body?: string; locked?: boolean };
          return (
            <div key={block.id} className={`p-3.5 shadow-xs ${getRadiusClass(theme.cardRadius, true)}`} style={{ backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText }}>
              <p className="text-xs font-bold" dir="auto">{block.title}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-caps" style={{ color: theme.subtextColor }}>{ui('Protected text preview')}</p>
              {gate.locked ? <p className="mt-2 whitespace-pre-wrap break-words text-xs" dir="auto">{gate.body || ui('Protected text is empty.')}</p> : <p className="mt-2 text-xs" style={{ color: theme.subtextColor }}>{ui('This gate is not configured yet.')}</p>}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};
