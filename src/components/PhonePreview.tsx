import React, { useState } from 'react';
import { CreatorProfile, ThemeConfig, ProfileBlock } from '../types';
import { THEMES } from '../data/mockData';
import { 
  CheckCircle2, 
  ExternalLink, 
  Play, 
  Pause, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  Instagram, 
  Twitter, 
  Github, 
  Mail, 
  Youtube, 
  Linkedin,
  Disc,
  Share2,
  Music2,
  MessageCircle
} from 'lucide-react';
import { 
  getSpotifyEmbedUrl, 
  getYouTubeEmbedUrl, 
  getVimeoEmbedUrl, 
  getSoundCloudEmbedUrl, 
  getAppleMusicEmbedUrl, 
  isDirectAudioFile, 
  isDirectVideoFile 
} from '../utils/mediaEmbeds';

interface PhonePreviewProps {
  profile: CreatorProfile;
  customTheme?: ThemeConfig;
  interactive?: boolean;
  onLinkClick?: (block: ProfileBlock) => void;
  scale?: 'normal' | 'compact' | 'responsive' | 'editor';
  compact?: boolean;
  deviceMode?: 'mobile' | 'tablet' | 'desktop';
}

export const PhonePreview: React.FC<PhonePreviewProps> = ({
  profile,
  customTheme,
  interactive = true,
  onLinkClick,
  scale = 'normal',
  compact = false,
  deviceMode = 'mobile',
}) => {
  const theme = customTheme || THEMES.find(t => t.id === profile.themeId) || THEMES[0];
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    'b3': true
  });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSuccess(true);
    setTimeout(() => {
      setNewsletterSuccess(false);
      setNewsletterEmail('');
    }, 3500);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.origin + '/@' + profile.username);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const getRadiusClass = (radius: ThemeConfig['cardRadius']) => {
    switch (radius) {
      case 'none': return 'rounded-none';
      case 'md': return 'rounded-lg';
      case 'xl': return 'rounded-2xl';
      case 'full': return 'rounded-full';
      default: return 'rounded-2xl';
    }
  };

  const renderSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'spotify': return <Disc className="w-4 h-4" />;
      case 'github': return <Github className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-emerald-500" />;
      default: return <ExternalLink className="w-4 h-4" />;
    }
  };

  const scaleClass =
    deviceMode === 'desktop' ? 'max-w-[620px]' :
    deviceMode === 'tablet' ? 'max-w-[500px]' :
    scale === 'compact' ? 'max-w-[340px]' :
    scale === 'editor' ? 'max-w-[320px]' :
    'max-w-[380px]';

  return (
    <div className={`relative mx-auto w-full select-none ${scaleClass}`}>
      {compact ? (
        <div
          className="rounded-[28px] overflow-y-auto no-scrollbar pt-12 pb-8 px-5 transition-colors duration-300 shadow-lg"
          style={{
            background: theme.bgType === 'gradient' ? theme.bgGradient : theme.bgColor,
            color: theme.textColor,
            fontFamily: theme.fontFamily === 'display' ? 'var(--font-display)' : theme.fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-sans)',
            aspectRatio: '9 / 16',
          }}
        >
          {renderProfileContent()}
        </div>
      ) : (
        <div className="phone-shell relative rounded-[44px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] ring-1 ring-black/10 bg-neutral-900 border-[4px] border-neutral-800">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-neutral-800 rounded-full z-30" />

          <div className="relative w-full h-[660px] rounded-[36px] overflow-y-auto no-scrollbar pt-12 pb-8 px-5 transition-colors duration-300"
            style={{
              background: theme.bgType === 'gradient' ? theme.bgGradient : theme.bgColor,
              color: theme.textColor,
              fontFamily: theme.fontFamily === 'display' ? 'var(--font-display)' : theme.fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-sans)'
            }}>
            {renderProfileContent()}
          </div>
        </div>
      )}

      {/* Device Home Indicator Bar (editor mode only) */}
      {!compact && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/30 rounded-full pointer-events-none" />
      )}
    </div>
  );

  function renderProfileContent() {
    return (
      <>
        {/* Top Bar inside Screen */}
        <div className="flex items-center justify-between text-xs px-2 mb-6 opacity-70">
          <span className="font-mono text-[11px] font-semibold tracking-tight">9:41</span>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleShare}
              aria-label="Share bio link"
              className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
              title="Copy bio link"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Copy Toast inside screen */}
        {copiedNotification && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-neutral-900 text-white text-[11px] px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Link copied to clipboard</span>
          </div>
        )}

        {/* Header Profile Section */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <img 
              src={profile.avatarUrl} 
              alt={profile.displayName}
              className="w-20 h-20 rounded-full object-cover shadow-sm ring-2 ring-white/20"
              referrerPolicy="no-referrer"
            />
            {profile.verified && (
              <div 
                className="absolute bottom-0 right-0 p-1 rounded-full text-white shadow-sm"
                style={{ backgroundColor: theme.accentColor }}
                title="Verified Creator"
              >
                <CheckCircle2 className="w-3.5 h-3.5 fill-current text-white" />
              </div>
            )}
          </div>

          <h1 className="text-xl font-bold tracking-tight mb-1 flex items-center justify-center gap-1.5 text-balance">
            <span>{profile.displayName}</span>
          </h1>
          
          <p className="text-[11px] font-mono opacity-60 mb-2.5">
            liinx.co/@{profile.username}
          </p>

          <p 
            className="text-xs max-w-[280px] leading-relaxed mb-4 text-pretty"
            style={{ color: theme.subtextColor }}
          >
            {profile.bio}
          </p>

          {/* Social Icons Row */}
          {profile.socials && profile.socials.length > 0 && (
            <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
              {profile.socials.map((social, idx) => (
                <a
                  key={idx}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-full transition-transform hover:scale-110 active:scale-95 border focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.cardBorder.split(' ')[2] || 'rgba(0,0,0,0.06)',
                    color: theme.textColor
                  }}
                  title={social.platform}
                >
                  {renderSocialIcon(social.platform)}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Profile Blocks */}
        <div className="space-y-3 mb-8">
          {profile.blocks.map((block) => {
            if (block.type === 'link') {
              return (
                <div
                  key={block.id}
                  onClick={() => onLinkClick?.(block)}
                  className={`group relative p-3.5 transition-shadow duration-200 cursor-pointer flex items-center justify-between gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 ${getRadiusClass(theme.cardRadius)}`}
                  style={{
                    backgroundColor: block.highlighted ? (theme.isDark ? '#23242A' : '#FFFFFF') : theme.cardBg,
                    border: block.highlighted ? `2px solid ${theme.accentColor}` : theme.cardBorder,
                    color: theme.cardText
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-xs tracking-tight truncate">
                        {block.title}
                      </span>
                      {block.badge && (
                        <span 
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase"
                          style={{ 
                            backgroundColor: theme.accentColor, 
                            color: '#FFFFFF' 
                          }}
                        >
                          {block.badge}
                        </span>
                      )}
                    </div>
                    {block.subtitle && (
                      <p className="text-[11px] truncate opacity-70">
                        {block.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="p-1 rounded-full opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            }

            if (block.type === 'header') {
              return (
                <div key={block.id} className="pt-3 pb-1 text-center">
                  <h3 className="text-xs font-bold uppercase tracking-widest opacity-60">
                    {block.title}
                  </h3>
                </div>
              );
            }

            if (block.type === 'audio') {
              const spotifyEmbed = getSpotifyEmbedUrl(block.audioUrl);
              const soundCloudEmbed = getSoundCloudEmbedUrl(block.audioUrl);
              const appleMusicEmbed = getAppleMusicEmbedUrl(block.audioUrl);
              const directAudio = isDirectAudioFile(block.audioUrl);

              if (spotifyEmbed) {
                return (
                  <div
                    key={block.id}
                    className={`overflow-hidden transition-shadow shadow-xs ${getRadiusClass(theme.cardRadius)}`}
                    style={{
                      backgroundColor: theme.cardBg,
                      border: theme.cardBorder,
                      color: theme.cardText
                    }}
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
                    className={`overflow-hidden transition-shadow shadow-xs ${getRadiusClass(theme.cardRadius)}`}
                    style={{
                      backgroundColor: theme.cardBg,
                      border: theme.cardBorder,
                      color: theme.cardText
                    }}
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
                    className={`overflow-hidden transition-shadow shadow-xs ${getRadiusClass(theme.cardRadius)}`}
                    style={{
                      backgroundColor: theme.cardBg,
                      border: theme.cardBorder,
                      color: theme.cardText
                    }}
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
                  className={`p-3.5 transition-shadow shadow-xs ${getRadiusClass(theme.cardRadius)}`}
                  style={{
                    backgroundColor: theme.cardBg,
                    border: theme.cardBorder,
                    color: theme.cardText
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-xs">
                      <img 
                        src={block.coverUrl} 
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
                          className="absolute inset-0 bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          aria-label={isPlayingAudio ? 'Pause track' : 'Play track'}
                        >
                          {isPlayingAudio ? (
                            <Pause className="w-4 h-4 fill-white text-white" />
                          ) : (
                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                          )}
                        </button>
                      ) : (
                        <a
                          href={block.audioUrl || `/r/${block.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          aria-label="Listen track"
                        >
                          <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] opacity-70 mb-0.5">
                        <Music2 className="w-3 h-3 text-emerald-500" />
                        <span className="uppercase font-mono tracking-wider font-semibold">Audio Track</span>
                      </div>
                      <p className="text-xs font-bold truncate">{block.title}</p>
                      <p className="text-[11px] truncate opacity-70">{block.artist}</p>
                    </div>

                    {isPlayingAudio && (
                      <div className="flex items-end gap-0.5 h-5 px-1">
                        <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_100ms] h-4" />
                        <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_300ms] h-5" />
                        <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_200ms] h-3" />
                      </div>
                    )}
                  </div>

                  {directAudio && (
                    <audio
                      id={`phone-audio-${block.id}`}
                      src={block.audioUrl}
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
              const isOpen = openFolders[block.id];
              return (
                <div
                  key={block.id}
                  className={`overflow-hidden transition-shadow duration-200 border shadow-xs ${getRadiusClass(theme.cardRadius)}`}
                  style={{
                    backgroundColor: theme.cardBg,
                    border: theme.cardBorder,
                    color: theme.cardText
                  }}
                >
                  <button
                    onClick={() => toggleFolder(block.id)}
                    className="w-full p-3.5 flex items-center justify-between text-left transition-opacity hover:opacity-90 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs truncate">{block.title}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-white/10 font-mono">
                          {block.items.length} items
                        </span>
                      </div>
                      {block.subtitle && (
                        <p className="text-[10px] truncate opacity-65 mt-0.5 text-pretty">{block.subtitle}</p>
                      )}
                    </div>
                    <div className="p-1 rounded-full opacity-60">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-neutral-200 dark:border-white/10">
                      {block.items.map((item) => (
                        <a
                          key={item.id}
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl block transition-colors hover:bg-neutral-100 dark:hover:bg-white/5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium group-hover:underline truncate">{item.title}</span>
                            <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                          </div>
                          {item.subtitle && (
                            <p className="text-[10px] opacity-60 truncate mt-0.5">{item.subtitle}</p>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            if (block.type === 'video') {
              const ytEmbed = getYouTubeEmbedUrl(block.videoUrl);
              const vimeoEmbed = getVimeoEmbedUrl(block.videoUrl);
              const directVideo = isDirectVideoFile(block.videoUrl);
              const isPlaying = activeVideoId === block.id;

              return (
                <div
                  key={block.id}
                  className={`overflow-hidden transition-shadow shadow-xs group ${getRadiusClass(theme.cardRadius)}`}
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
                      <video
                        src={block.videoUrl}
                        controls
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (ytEmbed || vimeoEmbed || directVideo) {
                            setActiveVideoId(block.id);
                          } else {
                            window.open(block.videoUrl || `/r/${block.id}`, '_blank', 'noreferrer');
                          }
                        }}
                        className="block relative w-full h-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                        aria-label={`Play ${block.title}`}
                      >
                        <img 
                          src={block.thumbnailUrl} 
                          alt={block.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold line-clamp-1">{block.title}</p>
                  </div>
                </div>
              );
            }

            if (block.type === 'instagram_grid') {
              return (
                <div
                  key={block.id}
                  className={`p-3 transition-shadow shadow-xs ${getRadiusClass(theme.cardRadius)}`}
                  style={{
                    backgroundColor: theme.cardBg,
                    border: theme.cardBorder,
                    color: theme.cardText
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold">{block.title}</span>
                    <span className="text-[10px] font-mono opacity-60">{block.handle}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {block.posts.map(post => (
                      <div key={post.id} className="relative aspect-square rounded-lg overflow-hidden group">
                        <img 
                          src={post.imageUrl} 
                          alt="Post" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-mono">
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
                <div
                  key={block.id}
                  className={`p-4 transition-shadow shadow-xs ${getRadiusClass(theme.cardRadius)}`}
                  style={{
                    backgroundColor: theme.cardBg,
                    border: theme.cardBorder,
                    color: theme.cardText
                  }}
                >
                  <h3 className="text-xs font-bold mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" style={{ color: theme.accentColor }} />
                    <span>{block.title}</span>
                  </h3>
                  <p className="text-[11px] opacity-70 mb-3 leading-relaxed text-pretty">
                    {block.description}
                  </p>

                  {newsletterSuccess ? (
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium flex items-center gap-1.5 justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>You're on the list! Welcome.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSubscribe} className="space-y-2">
                      <input 
                        type="email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder="your@email.com…"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-100/50 dark:bg-white/5 border border-neutral-200 dark:border-white/15 outline-none transition-colors focus:ring-1 focus:ring-neutral-900/10"
                        style={{ color: theme.textColor }}
                        required
                        spellCheck={false}
                      />
                      <button
                        type="submit"
                        className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        style={{ backgroundColor: theme.accentColor }}
                      >
                        <span>{block.buttonText}</span>
                        <Send className="w-3 h-3" />
                      </button>
                    </form>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* LIINX Branding Footer Badge - omitted when white-labeled on Pro/Studio plans */}
        {!(profile.plan && profile.plan !== 'free' && profile.hideBranding) && (
          <div className="pt-2 pb-6 text-center">
            <a 
              href="#builder" 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider opacity-60 hover:opacity-100 transition-opacity bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
              style={{ color: theme.textColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Made with <strong>LIINX</strong></span>
            </a>
          </div>
        )}
      </>
    );
  }
};
