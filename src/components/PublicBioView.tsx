import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { CreatorProfile, ThemeConfig } from '../types';
import { THEMES } from '../data/mockData';
import { api } from '../services/api';
import { 
  ArrowLeft, 
  Share2, 
  ExternalLink, 
  CheckCircle2, 
  Play, 
  Pause, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  Music2, 
  Instagram, 
  Twitter, 
  Youtube, 
  Disc, 
  Github, 
  Linkedin, 
  Mail, 
  Check,
  AlertCircle,
  Loader2,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QrCodeModal } from './QrCodeModal';

interface PublicBioViewProps {
  profile?: CreatorProfile;
  username?: string;
  customTheme?: ThemeConfig;
  onBackToStudio?: () => void;
  onOpenQr?: () => void;
}

export const PublicBioView: React.FC<PublicBioViewProps> = ({
  profile: initialProfile,
  username: routeUsername,
  customTheme,
  onBackToStudio,
  onOpenQr
}) => {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<CreatorProfile | null>(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile);
  const [notFound, setNotFound] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ 'b3': true });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState<string | null>(null);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Dynamic fetch when accessed via route
  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setLoading(false);
      return;
    }

    if (!routeUsername) return;

    const cleanUsername = routeUsername.replace(/^@/, '');
    setLoading(true);
    setNotFound(false);

    api.profiles.getByUsername(cleanUsername)
      .then(fetchedProfile => {
        setProfile(fetchedProfile);
        document.title = `${fetchedProfile.displayName} (@${fetchedProfile.username}) | LIINX`;
        // Record profile visit for real analytics
        api.analytics.recordView(fetchedProfile.id).catch(() => {});
      })
      .catch(err => {
        console.error('Failed to load public profile:', err);
        setNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [initialProfile, routeUsername]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mb-4" />
        <p className="text-sm font-mono text-neutral-500">Loading creator page...</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-neutral-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-2 text-balance">
          Creator page not found
        </h1>
        <p className="text-sm text-neutral-500 max-w-sm mb-6 text-pretty">
          The handle <span className="font-mono font-semibold text-neutral-900">@{routeUsername || 'unknown'}</span> hasn't been claimed yet or does not exist.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation('/')}
            className="px-5 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold hover:bg-neutral-100 text-neutral-900 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          >
            Go to Homepage
          </button>
          <button
            onClick={() => setLocation(`/register?username=${routeUsername?.replace(/^@/, '') || ''}`)}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-black transition-colors shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2"
          >
            Claim this handle
          </button>
        </div>
      </div>
    );
  }

  const theme = customTheme || profile.customTheme || THEMES.find(t => t.id === profile.themeId) || THEMES[0];

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.2 }
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleNewsletter = async (e: React.FormEvent, blockId?: string) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || newsletterLoading) return;

    setNewsletterLoading(true);
    try {
      const res = await api.newsletter.subscribe(profile.id, blockId, newsletterEmail.trim());
      setNewsletterSuccess(res.message || 'Subscribed successfully!');
      setTimeout(() => {
        setNewsletterSuccess(null);
        setNewsletterEmail('');
      }, 5000);
    } catch (err: any) {
      alert(err.message || 'Subscription failed. Please check your email.');
    } finally {
      setNewsletterLoading(false);
    }
  };

  const getRadiusClass = (radius: ThemeConfig['cardRadius']) => {
    switch (radius) {
      case 'none': return 'rounded-none';
      case 'md': return 'rounded-xl';
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
      default: return <ExternalLink className="w-4 h-4" />;
    }
  };

  return (
    <div 
      className="min-h-screen w-full transition-colors duration-300 relative selection:bg-black selection:text-white"
      style={{
        background: theme.bgType === 'gradient' ? theme.bgGradient : theme.bgColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily === 'display' ? 'var(--font-display)' : theme.fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-sans)'
      }}
    >
      {/* Top Floating Control Bar */}
      <header className="sticky top-0 z-40 w-full px-4 py-3 bg-black/20 backdrop-blur-md border-b border-white/10 flex items-center justify-between text-xs">
        {onBackToStudio ? (
          <button
            onClick={onBackToStudio}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Studio</span>
          </button>
        ) : (
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>LIINX</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQr ? onOpenQr : () => setQrModalOpen(true)}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#18181B] font-semibold hover:bg-white/90 transition-colors shadow-xs cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Centered Bio Column */}
      <main className="max-w-xl mx-auto px-4 py-12 sm:py-16">
        
        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4">
            <img 
              src={profile.avatarUrl} 
              alt={profile.displayName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-md ring-4 ring-white/20"
              referrerPolicy="no-referrer"
            />
            {profile.verified && (
              <div 
                className="absolute bottom-1 right-1 p-1.5 rounded-full text-white shadow-md"
                style={{ backgroundColor: theme.accentColor }}
                title="Verified Profile"
              >
                <CheckCircle2 className="w-4 h-4 fill-current text-white" />
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 flex items-center justify-center gap-2">
            <span>{profile.displayName}</span>
          </h1>

          <p className="text-xs sm:text-sm font-mono opacity-65 mb-3">
            liinx.co/@{profile.username}
          </p>

          <p 
            className="text-sm max-w-md leading-relaxed mb-6"
            style={{ color: theme.subtextColor }}
          >
            {profile.bio}
          </p>

          {/* Socials Row */}
          {profile.socials && profile.socials.length > 0 && (
            <div className="flex items-center justify-center gap-2.5 mb-2 flex-wrap">
              {profile.socials.map((social, idx) => (
                <a
                  key={idx}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-full transition-transform duration-200 hover:scale-110 active:scale-95 border shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: theme.cardBorder.split(' ')[2] || 'rgba(0,0,0,0.1)',
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

        {/* Content Blocks */}
        <div className="space-y-4 mb-14">
          {profile.blocks.map((block) => {
            if (block.type === 'link') {
              // Real click redirection through /r/:blockId for 0% fake tracking!
              const redirectUrl = `/r/${block.id}`;
              return (
                <a
                  key={block.id}
                  href={redirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`group relative p-4 transition-shadow duration-200 flex items-center justify-between gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-current ${getRadiusClass(theme.cardRadius)}`}
                  style={{
                    backgroundColor: block.highlighted ? (theme.isDark ? '#23242A' : '#FFFFFF') : theme.cardBg,
                    border: block.highlighted ? `2px solid ${theme.accentColor}` : theme.cardBorder,
                    color: theme.cardText
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm sm:text-base tracking-tight truncate">
                        {block.title}
                      </span>
                      {block.badge && (
                        <span 
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase shadow-xs"
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
                      <p className="text-xs truncate opacity-70">
                        {block.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="p-2 rounded-full opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-transform">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              );
            }

            if (block.type === 'header') {
              return (
                <div key={block.id} className="pt-6 pb-2 text-center">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest opacity-60">
                    {block.title}
                  </h3>
                </div>
              );
            }

            if (block.type === 'audio') {
              return (
                <div
                  key={block.id}
                  className={`p-4 transition-shadow duration-200 shadow-sm ${getRadiusClass(theme.cardRadius)}`}
                  style={{
                    backgroundColor: theme.cardBg,
                    border: theme.cardBorder,
                    color: theme.cardText
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-sm">
                      <img 
                        src={block.coverUrl} 
                        alt={block.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        aria-label="Play track"
                      >
                        {isPlayingAudio ? (
                          <Pause className="w-5 h-5 fill-white text-white" />
                        ) : (
                          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] opacity-70 mb-0.5">
                        <Music2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="uppercase font-mono tracking-wider font-semibold">Audio Track</span>
                      </div>
                      <p className="text-sm font-bold truncate">{block.title}</p>
                      <p className="text-xs truncate opacity-70">{block.artist}</p>
                    </div>

                    {isPlayingAudio && (
                      <div className="flex items-end gap-1 h-6 px-2">
                        <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_100ms] h-5" />
                        <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_300ms] h-6" />
                        <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_200ms] h-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            if (block.type === 'folder') {
              const isOpen = openFolders[block.id];
              return (
                <div
                  key={block.id}
                  className={`overflow-hidden transition-shadow duration-200 border shadow-sm ${getRadiusClass(theme.cardRadius)}`}
                  style={{
                    backgroundColor: theme.cardBg,
                    border: theme.cardBorder,
                    color: theme.cardText
                  }}
                >
                  <button
                    onClick={() => toggleFolder(block.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:opacity-95 transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base truncate">{block.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 font-mono">
                          {block.items?.length || 0} links
                        </span>
                      </div>
                      {block.subtitle && (
                        <p className="text-xs truncate opacity-65 mt-0.5 text-pretty">{block.subtitle}</p>
                      )}
                    </div>
                    <div className="p-1.5 rounded-full opacity-60">
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {isOpen && block.items && (
                    <div className="px-4 pb-4 pt-1 space-y-2 border-t border-black/5 dark:border-white/10">
                      {block.items.map((item) => (
                        <a
                          key={item.id}
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 rounded-xl block transition-colors hover:bg-black/5 dark:hover:bg-white/5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-semibold group-hover:underline truncate">{item.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                          </div>
                          {item.subtitle && (
                            <p className="text-xs opacity-60 truncate mt-0.5 text-pretty">{item.subtitle}</p>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            if (block.type === 'video') {
              return (
                <div
                  key={block.id}
                  className={`overflow-hidden transition-shadow duration-200 shadow-sm group ${getRadiusClass(theme.cardRadius)}`}
                  style={{
                    backgroundColor: theme.cardBg,
                    border: theme.cardBorder,
                    color: theme.cardText
                  }}
                >
                  <a href={`/r/${block.id}`} target="_blank" rel="noreferrer" className="block relative aspect-video w-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-current">
                    <img 
                      src={block.thumbnailUrl} 
                      alt={block.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                  </a>
                  <div className="p-4">
                    <p className="text-sm font-bold line-clamp-1">{block.title}</p>
                  </div>
                </div>
              );
            }

            if (block.type === 'newsletter') {
              return (
                <div
                  key={block.id}
                  className={`p-5 transition-shadow duration-200 shadow-sm ${getRadiusClass(theme.cardRadius)}`}
                  style={{
                    backgroundColor: theme.cardBg,
                    border: theme.cardBorder,
                    color: theme.cardText
                  }}
                >
                  <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" style={{ color: theme.accentColor }} />
                    <span>{block.title}</span>
                  </h3>
                  <p className="text-xs opacity-75 mb-4 leading-relaxed text-pretty">
                    {block.description}
                  </p>

                  {newsletterSuccess ? (
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 justify-center">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{newsletterSuccess}</span>
                    </div>
                  ) : (
                    <form onSubmit={(e) => handleNewsletter(e, block.id)} className="space-y-2.5">
                      <input 
                        type="email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/15 outline-none focus:ring-2 focus:ring-black/20"
                        style={{ color: theme.textColor }}
                        required
                        spellCheck={false}
                      />
                      <button
                        type="submit"
                        disabled={newsletterLoading}
                        className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white transition-opacity hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        style={{ backgroundColor: theme.accentColor }}
                      >
                        {newsletterLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Subscribing...</span>
                          </>
                        ) : (
                          <>
                            <span>{block.buttonText || 'Subscribe'}</span>
                            <Send className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Footer Brand Credit */}
        <div className="text-center pt-4 pb-12">
          <button 
            onClick={onBackToStudio ? onBackToStudio : () => setLocation('/')}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono tracking-wider transition-opacity hover:opacity-100 opacity-70 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/15 shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
            style={{ color: theme.textColor }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Made with <strong>LIINX</strong></span>
          </button>
        </div>

      </main>

      <QrCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        username={profile.username}
        displayName={profile.displayName}
      />
    </div>
  );
};
