import { useLanguage as useUiLanguage } from '../context/LanguageContext';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { CreatorProfile, ThemeConfig } from '../types';
import { THEMES } from '../data/mockData';
import { brand } from '../config/brand';
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
import { BookingCard } from './BookingCard';
import { 
  getSpotifyEmbedUrl, 
  getYouTubeEmbedUrl, 
  getVimeoEmbedUrl, 
  getSoundCloudEmbedUrl, 
  getAppleMusicEmbedUrl, 
  isDirectAudioFile, 
  isDirectVideoFile 
} from '../utils/mediaEmbeds';

interface PublicBioViewProps {
  previewOnly?: boolean;
  profile?: CreatorProfile;
  username?: string;
  customDomain?: string;
  customTheme?: ThemeConfig;
  onBackToStudio?: () => void;
  onOpenQr?: () => void;
}

export const PublicBioView: React.FC<PublicBioViewProps> = ({
  previewOnly = false,
  profile: initialProfile,
  username: routeUsername,
  customDomain,
  customTheme,
  onBackToStudio,
  onOpenQr
}) => {
  const { tr: ui } = useUiLanguage();
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<CreatorProfile | null>(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile);
  const [notFound, setNotFound] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ 'b3': true });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState<string | null>(null);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterUnsubscribeUrl, setNewsletterUnsubscribeUrl] = useState<string | null>(null);
  const [analyticsConsent, setAnalyticsConsent] = useState<'granted' | 'denied' | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (previewOnly) return;
    const saved = window.localStorage.getItem('liinx_analytics_consent');
    if (saved === 'granted' || saved === 'denied') setAnalyticsConsent(saved);
  }, [previewOnly]);

  const updateAnalyticsConsent = (value: 'granted' | 'denied') => {
    window.localStorage.setItem('liinx_analytics_consent', value);
    setAnalyticsConsent(value);
  };

  // Dynamic fetch when accessed via route or custom domain (0% fake demo fallback)
  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setLoading(false);
      return;
    }

    if (!routeUsername && !customDomain) return;

    setLoading(true);
    setNotFound(false);
    setServerError(null);

    const fetchPromise = customDomain
      ? api.profiles.getByCustomDomain(customDomain)
      : api.profiles.getByUsername(routeUsername!.replace(/^@/, ''));

    fetchPromise
      .then(fetchedProfile => {
        if (!fetchedProfile || !fetchedProfile.id) {
          setNotFound(true);
          return;
        }
        setProfile(fetchedProfile);
        document.title = `${fetchedProfile.displayName} (@${fetchedProfile.username}) | LIINX`;
        // Record profile visit for real analytics with UTM parameters
        api.analytics.recordView(fetchedProfile.id).catch(() => {});
      })
      .catch((err: any) => {
        const is404 = err?.status === 404 || err?.statusCode === 404 || err?.message?.toLowerCase().includes('not found');
        if (is404) {
          setNotFound(true);
        } else {
          setServerError(err?.message || 'Failed to load creator profile from server.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [initialProfile, routeUsername, customDomain]);

  useEffect(() => {
    if (!profile || previewOnly) return;
    const title = `${profile.displayName} (@${profile.username}) | LIINX`;
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', profile.bio || `Explore ${profile.displayName}'s links, media and updates on Liinx.`);
    document.querySelector('meta[name="robots"]')?.setAttribute('content', 'index, follow');
    const canonical = customDomain ? `https://${customDomain}` : `https://liinx.app/@${profile.username}`;
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', profile.bio || `Explore ${profile.displayName}'s links, media and updates on Liinx.`);
  }, [profile, previewOnly, customDomain]);

  // Google Analytics 4 (gtag.js) Injection
  useEffect(() => {
    if (previewOnly || analyticsConsent !== 'granted' || !profile?.gaMeasurementId) return;
    const gaId = profile.gaMeasurementId.trim();
    if (!gaId || !/^G-[A-Z0-9]+$/i.test(gaId)) return;

    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    script.async = true;
    script.id = 'liinx-ga4-script';
    document.head.appendChild(script);

    const inlineScript = document.createElement('script');
    inlineScript.id = 'liinx-ga4-inline';
    inlineScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `;
    document.head.appendChild(inlineScript);

    return () => {
      document.getElementById('liinx-ga4-script')?.remove();
      document.getElementById('liinx-ga4-inline')?.remove();
    };
  }, [profile?.gaMeasurementId, analyticsConsent, previewOnly]);

  // Meta Pixel (fbq) Injection
  useEffect(() => {
    if (previewOnly || analyticsConsent !== 'granted' || !profile?.metaPixelId) return;
    const pixelId = profile.metaPixelId.trim();
    if (!pixelId || !/^[0-9]+$/.test(pixelId)) return;

    const script = document.createElement('script');
    script.id = 'liinx-meta-pixel';
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    return () => {
      document.getElementById('liinx-meta-pixel')?.remove();
    };
  }, [profile?.metaPixelId, analyticsConsent, previewOnly]);

  // Custom Font Link Injection
  useEffect(() => {
    if (previewOnly || !profile?.customFontUrl) return;
    const fontUrl = profile.customFontUrl.trim();
    if (!fontUrl || !/^https?:\/\//i.test(fontUrl)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    link.id = 'liinx-custom-font';
    document.head.appendChild(link);

    return () => {
      document.getElementById('liinx-custom-font')?.remove();
    };
  }, [profile?.customFontUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mb-4" />
        <p className="text-sm font-mono text-neutral-500">{ui("Loading creator page...")}</p>
      </div>
    );
  }

  if (serverError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-2">
          {ui("Unable to load creator page")}</h1>
        <p className="text-sm text-neutral-500 max-w-sm mb-6">
          {serverError}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-black transition-colors cursor-pointer"
          >
            {ui("Retry")}</button>
          <button
            onClick={() => setLocation('/')}
            className="px-5 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold hover:bg-neutral-100 text-neutral-900 transition-colors cursor-pointer"
          >
            {ui("Go to Homepage")}</button>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-neutral-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-2 text-balance">
          {ui("Creator page not found")}</h1>
        <p className="text-sm text-neutral-500 max-w-sm mb-6 text-pretty">
          {ui("The handle")}<span className="font-mono font-semibold text-neutral-900">@{routeUsername || 'unknown'}</span> {ui("hasn't been claimed yet or does not exist.")}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation('/')}
            className="px-5 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold hover:bg-neutral-100 text-neutral-900 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          >
            {ui("Go to Homepage")}</button>
          <button
            onClick={() => setLocation(`/register?username=${routeUsername?.replace(/^@/, '') || ''}`)}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-black transition-colors shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2"
          >
            {ui("Claim this handle")}</button>
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
    setNewsletterError(null);
    try {
      if (!newsletterConsent) {
        setNewsletterError(ui('Please confirm that you want to receive updates.'));
        setNewsletterLoading(false);
        return;
      }
      const res = await api.newsletter.subscribe(profile.id, blockId, newsletterEmail.trim(), newsletterConsent);
      setNewsletterSuccess(res.message || ui('Subscribed successfully!'));
      setNewsletterUnsubscribeUrl(res.unsubscribeUrl || null);
      setNewsletterError(null);
      setTimeout(() => {
        setNewsletterSuccess(null);
        setNewsletterEmail('');
      }, 5000);
    } catch (err: any) {
      setNewsletterError(err.message || ui('Subscription failed. Please check your email.'));
    } finally {
      setNewsletterLoading(false);
    }
  };

  const getRadiusClass = (radius: ThemeConfig['cardRadius'], isComplex: boolean = false) => {
    switch (radius) {
      case 'none': return 'rounded-none';
      case 'md': return 'rounded-xl';
      case 'xl': return 'rounded-2xl';
      case 'full': return isComplex ? 'rounded-2xl' : 'rounded-full';
      default: return 'rounded-2xl';
    }
  };

  const isArabicText = (text?: string) => /[\u0600-\u06FF]/.test(text || '');
  const isProfileRtl = isArabicText(profile?.displayName) || isArabicText(profile?.bio);

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
      id="public-bio-view"
      className="min-h-screen w-full transition-colors duration-300 relative selection:bg-black selection:text-white"
      style={{
        background: theme.bgType === 'gradient' ? theme.bgGradient : theme.bgColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily === 'display' ? 'var(--font-display)' : theme.fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-sans)'
      }}
    >
      {profile?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: profile.customCss }} />
      )}
      {/* Top Floating Control Bar */}
      <header className="public-header sticky top-0 z-40 w-full px-4 py-3 bg-black/20 backdrop-blur-md border-b border-white/10 flex items-center justify-between text-xs">
        {onBackToStudio ? (
          <button
            onClick={onBackToStudio}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 text-white font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{ui("Back to Studio")}</span>
          </button>
        ) : (
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 text-white font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{ui("LIINX")}</span>
          </button>
        )}

        <div className="public-header-actions flex items-center gap-2">
          <button
            onClick={onOpenQr ? onOpenQr : () => setQrModalOpen(true)}
            className="px-3 py-1.5 rounded-full bg-neutral-100/10 hover:bg-neutral-100/20 text-white font-medium transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{ui("QR Code")}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-50 text-neutral-900 font-semibold hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{ui("Copied!")}</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>{ui("Share")}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Centered Bio Column */}
      <main dir={isProfileRtl ? 'rtl' : 'ltr'} className="max-w-xl mx-auto px-4 py-12 sm:py-16">
        
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
                title={ui("Verified Profile")}
              >
                <CheckCircle2 className="w-4 h-4 fill-current text-white" />
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 flex items-center justify-center gap-2">
            <span>{profile.displayName}</span>
          </h1>

          <p className="text-xs sm:text-sm font-mono opacity-65 mb-3">
            {brand.domain}/@{profile.username}
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
            if (block.type === 'booking') return <div key={block.id}><BookingCard block={block} theme={theme} /></div>;
            if (block.type === 'link') {
              // Real click redirection through /r/:blockId for 0% fake tracking!
              const redirectUrl = `/r/${block.id}`;
              const isComplexLink = Boolean(block.subtitle);
              const isPill = theme.cardRadius === 'full' && !isComplexLink;
              return (
                <a
                  key={block.id}
                  href={redirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`group relative ${isPill ? 'px-6 py-4' : 'p-4'} transition-shadow duration-200 flex items-center justify-between gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-current ${getRadiusClass(theme.cardRadius, isComplexLink)}`}
                  style={{
                    backgroundColor: block.highlighted ? (theme.isDark ? '#23242A' : '#FFFFFF') : theme.cardBg,
                    border: block.highlighted ? `2px solid ${theme.accentColor}` : theme.cardBorder,
                    color: theme.cardText
                  }}
                >
                  <div className="flex-1 min-w-0" dir="auto">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm sm:text-base tracking-tight truncate" dir="auto">
                        {block.title}
                      </span>
                      {block.badge && (
                        <span 
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase shadow-xs shrink-0"
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
                      <p className="text-xs truncate opacity-70" dir="auto">
                        {block.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="p-2 rounded-full opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-transform shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              );
            }

            if (block.type === 'header') {
              return (
                <div key={block.id} className="pt-6 pb-2 text-center" dir="auto">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest opacity-60" dir="auto">
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
                    className={`overflow-hidden transition-shadow duration-200 shadow-sm ${getRadiusClass(theme.cardRadius, true)}`}
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
                    className={`overflow-hidden transition-shadow duration-200 shadow-sm ${getRadiusClass(theme.cardRadius, true)}`}
                    style={{
                      backgroundColor: theme.cardBg,
                      border: theme.cardBorder,
                      color: theme.cardText
                    }}
                  >
                    <iframe
                      width="100%"
                      height="140"
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
                    className={`overflow-hidden transition-shadow duration-200 shadow-sm ${getRadiusClass(theme.cardRadius, true)}`}
                    style={{
                      backgroundColor: theme.cardBg,
                      border: theme.cardBorder,
                      color: theme.cardText
                    }}
                  >
                    <iframe
                      allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                      frameBorder="0"
                      height="175"
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
                  className={`p-4 transition-shadow duration-200 shadow-sm ${getRadiusClass(theme.cardRadius, true)}`}
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
                      {directAudio ? (
                        <button
                          onClick={() => {
                            const audioEl = document.getElementById(`audio-player-${block.id}`) as HTMLAudioElement;
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
                          aria-label={ui("Play track")}
                        >
                          {isPlayingAudio ? (
                            <Pause className="w-5 h-5 fill-white text-white" />
                          ) : (
                            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                          )}
                        </button>
                      ) : (
                        <a
                          href={block.audioUrl || `/r/${block.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          aria-label={ui("Listen track")}
                        >
                          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex-1 min-w-0" dir="auto">
                      <div className="flex items-center gap-1.5 text-[11px] opacity-70 mb-0.5">
                        <Music2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="uppercase font-mono tracking-wider font-semibold">{ui("Audio Track")}</span>
                      </div>
                      <p className="text-sm font-bold truncate" dir="auto">{block.title}</p>
                      <p className="text-xs truncate opacity-70" dir="auto">{block.artist}</p>
                    </div>

                    {isPlayingAudio && (
                      <div className="flex items-end gap-1 h-6 px-2 shrink-0">
                        <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_100ms] h-5" />
                        <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_300ms] h-6" />
                        <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_200ms] h-4" />
                      </div>
                    )}
                  </div>

                  {directAudio && (
                    <audio
                      id={`audio-player-${block.id}`}
                      src={block.audioUrl}
                      controls
                      className="w-full mt-3 h-8"
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
                  className={`overflow-hidden transition-shadow duration-200 border shadow-sm ${getRadiusClass(theme.cardRadius, true)}`}
                  style={{
                    backgroundColor: theme.cardBg,
                    border: theme.cardBorder,
                    color: theme.cardText
                  }}
                >
                  <button
                    onClick={() => toggleFolder(block.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:opacity-95 transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-current gap-2"
                  >
                    <div className="min-w-0 flex-1" dir="auto">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base truncate" dir="auto">{block.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900/10 font-mono shrink-0">
                          {block.items?.length || 0} {ui("links")}</span>
                      </div>
                      {block.subtitle && (
                        <p className="text-xs truncate opacity-65 mt-0.5 text-pretty" dir="auto">{block.subtitle}</p>
                      )}
                    </div>
                    <div className="p-1.5 rounded-full opacity-60 shrink-0">
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
                          className="p-3 rounded-xl block transition-colors hover:bg-neutral-100/5 dark:hover:bg-neutral-900/5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm font-semibold group-hover:underline truncate" dir="auto">{item.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0" />
                          </div>
                          {item.subtitle && (
                            <p className="text-xs opacity-60 truncate mt-0.5 text-pretty" dir="auto">{item.subtitle}</p>
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
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                  <div className="p-4" dir="auto">
                    <p className="text-sm font-bold line-clamp-1" dir="auto">{block.title}</p>
                  </div>
                </div>
              );
            }

            if (block.type === 'newsletter') {
              return (
                <div
                  key={block.id}
                  className={`p-5 transition-shadow duration-200 shadow-sm ${getRadiusClass(theme.cardRadius, true)}`}
                  style={{
                    backgroundColor: theme.cardBg,
                    border: theme.cardBorder,
                    color: theme.cardText
                  }}
                >
                  <h3 className="text-sm font-bold mb-1 flex items-center gap-2" dir="auto">
                    <Mail className="w-4 h-4 shrink-0" style={{ color: theme.accentColor }} />
                    <span dir="auto">{block.title}</span>
                  </h3>
                  <p className="text-xs opacity-75 mb-4 leading-relaxed text-pretty" dir="auto">
                    {block.description}
                  </p>

                  {newsletterSuccess ? (
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 justify-center" dir="auto">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{newsletterSuccess}</span>
                      {newsletterUnsubscribeUrl && <a href={newsletterUnsubscribeUrl} className="underline underline-offset-2" dir="auto">{ui("Unsubscribe")}</a>}
                    </div>
                  ) : (
                    <form onSubmit={(e) => handleNewsletter(e, block.id)} className="space-y-2.5">
                        <input id={`newsletter-email-${block.id}`} name="email" autoComplete="email" aria-label={ui("Enter your email address")}
                        type="email"
                        value={newsletterEmail}
                        onChange={(e) => {
                          setNewsletterEmail(e.target.value);
                          if (newsletterError) setNewsletterError(null);
                        }}
                        placeholder={ui("Enter your email address")}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-neutral-100/5 dark:bg-neutral-900/5 border border-neutral-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-neutral-900/20"
                        style={{ color: theme.textColor }}
                        required
                        spellCheck={false}
                        dir="auto"
                      />
                      {newsletterError && (
                        <p role="alert" className="text-xs text-rose-500 font-medium px-1" dir="auto">
                          {newsletterError}
                        </p>
                      )}
                      <label className="flex items-start gap-2 text-[11px] leading-relaxed opacity-80" dir="auto">
                        <input id={`newsletter-consent-${block.id}`} name="consent" autoComplete="off" type="checkbox" checked={newsletterConsent} onChange={e => setNewsletterConsent(e.target.checked)} className="mt-0.5 min-h-0" />
                        <span>{ui("I agree to receive updates from this creator and can unsubscribe later.")}</span>
                      </label>
                      <button
                        type="submit"
                        disabled={newsletterLoading}
                        className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white transition-opacity hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        style={{ backgroundColor: theme.accentColor }}
                      >
                        {newsletterLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                            <span>{ui("Subscribing...")}</span>
                          </>
                        ) : (
                          <>
                            <span dir="auto">{block.buttonText || 'Subscribe'}</span>
                            <Send className="w-3.5 h-3.5 shrink-0" />
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

        {/* Footer Brand Credit - omitted when white-labeled on Pro/Studio plans */}
        {!(profile.plan && profile.plan !== 'free' && profile.hideBranding) && (
          <div className="text-center pt-4 pb-12">
            <button 
              onClick={onBackToStudio ? onBackToStudio : () => setLocation('/')}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono tracking-wider transition-opacity hover:opacity-100 opacity-70 bg-neutral-100/5 dark:bg-neutral-900/5 border border-neutral-200 dark:border-neutral-800 shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
              style={{ color: theme.textColor }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{ui("Made with")}{' '}<strong>{ui("LIINX")}</strong></span>
            </button>
          </div>
        )}

      </main>

      <QrCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        username={profile.username}
        displayName={profile.displayName}
      />

      {!previewOnly && analyticsConsent === null && (profile.gaMeasurementId || profile.metaPixelId) && (
        <aside className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-lg rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-900 shadow-2xl" role="dialog" aria-label={ui('Privacy controls')}>
          <p className="text-xs leading-relaxed text-neutral-600" dir="auto">
            {ui('This page uses optional analytics and advertising pixels configured by the creator. Choose whether to allow them.')}
          </p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => updateAnalyticsConsent('denied')} className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30">
              {ui('Reject optional analytics')}
            </button>
            <button type="button" onClick={() => updateAnalyticsConsent('granted')} className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30">
              {ui('Allow optional analytics')}
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};
