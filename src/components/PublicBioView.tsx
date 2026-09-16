import { useLanguage as useUiLanguage } from '../context/LanguageContext';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { CreatorProfile, ThemeConfig } from '../types';
import { THEMES } from '../data/mockData';
import { brand } from '../config/brand';
import { api } from '../services/api';
import { getAccessibleTextColor, getBorderColor, getThemeBackground, resolveTheme } from '../utils/colorContrast';
import { friendlyErrorMessage } from '../utils/errors';
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
  Phone,
  AtSign,
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

function safePublicHref(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value, window.location.origin);
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) return null;
    return url.toString();
  } catch { return null; }
}

const advancedBlockTypes = new Set(['rich_text', 'image', 'gallery', 'spacer', 'carousel', 'form', 'download', 'map', 'faq', 'testimonials', 'event', 'presave', 'phone', 'product', 'tips', 'content_gate']);
function normalizeFormFields(value: unknown): any[] {
  if (!Array.isArray(value)) return [];
  return value.filter(field => field && typeof field === 'object' && typeof field.name === 'string').map(field => ({ ...field, required: field.required === undefined ? true : Boolean(field.required) }));
}
function advancedRadius(radius: ThemeConfig['cardRadius']): string {
  return radius === 'none' ? 'rounded-none' : radius === 'full' ? 'rounded-3xl' : radius === 'md' ? 'rounded-xl' : 'rounded-2xl';
}
function renderRichText(value: string) {
  return value.split('\n').map((line, index) => {
    const heading = line.match(/^#{1,3}\s+(.*)$/);
    const content = heading ? heading[1] : line;
    const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map((part, partIndex) => part.startsWith('**') ? <strong key={partIndex}>{part.slice(2, -2)}</strong> : part.startsWith('*') ? <em key={partIndex}>{part.slice(1, -1)}</em> : <React.Fragment key={partIndex}>{part}</React.Fragment>);
    if (heading?.[0].startsWith('###')) return <h4 key={index} className="mt-3 font-bold">{parts}</h4>;
    if (heading?.[0].startsWith('##')) return <h3 key={index} className="mt-3 text-lg font-bold">{parts}</h3>;
    if (heading) return <h2 key={index} className="mt-3 text-xl font-bold">{parts}</h2>;
    return <p key={index} className="min-h-5">{parts}</p>;
  });
}

const AdvancedPublicBlock: React.FC<{ block: any; profileId: string; theme: ThemeConfig; previewOnly?: boolean }> = ({ block, profileId, theme, previewOnly = false }) => {
  const extra = block.extra || block;
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [gateValue, setGateValue] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  if (!advancedBlockTypes.has(block.type)) return null;
  const card = `p-5 shadow-sm ${advancedRadius(theme.cardRadius)}`;
  const cardStyle = { backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText };
  const fields = normalizeFormFields(extra.fields).length > 0 ? normalizeFormFields(extra.fields) : [{ name: 'message', label: 'Message', type: 'textarea', required: true }];
  const links = Array.isArray(extra.items) ? extra.items : Array.isArray(extra.links) ? extra.links : [];

  if (block.type === 'spacer') return <div key={block.id} aria-hidden="true" style={{ height: Math.min(240, Math.max(16, Number(extra.height) || 48)) }} />;
  if (block.type === 'rich_text') return <article className={card} style={cardStyle}><h3 className="font-bold mb-2">{block.title}</h3><div className="text-sm leading-7" style={{ color: theme.subtextColor }}>{renderRichText(extra.body || block.subtitle || '')}</div></article>;
  if (block.type === 'image') return <figure className={`overflow-hidden ${card}`} style={cardStyle}>{extra.imageUrl && <img src={extra.imageUrl} alt={extra.alt || block.title} className="w-full max-h-[520px] object-cover" loading="lazy" />}{extra.caption && <figcaption className="pt-3 text-xs" style={{ color: theme.subtextColor }}>{extra.caption}</figcaption>}</figure>;
  if (block.type === 'gallery' || block.type === 'carousel') return <div className={`${card} ${block.type === 'carousel' ? 'overflow-x-auto' : ''}`} style={cardStyle}><h3 className="font-bold mb-3">{block.title}</h3><div className={`grid ${block.type === 'carousel' ? 'grid-flow-col auto-cols-[75%] sm:auto-cols-[45%]' : 'grid-cols-2'} gap-2`}>{links.map((item: any, index: number) => <a key={item.id || index} href={safePublicHref(item.url) || '#'} target="_blank" rel="noreferrer" className="block"><img src={item.imageUrl || item.url} alt={item.alt || item.title || block.title} className="aspect-square w-full object-cover rounded-xl" loading="lazy" />{item.caption && <span className="mt-1 block text-xs" style={{ color: theme.subtextColor }}>{item.caption}</span>}</a>)}</div></div>;
  if (block.type === 'form') return <div className={card} style={cardStyle}><h3 className="font-bold mb-1">{block.title}</h3><p className="text-sm mb-4" style={{ color: theme.subtextColor }}>{block.subtitle || extra.description}</p><form className="space-y-3" onSubmit={async event => { event.preventDefault(); setStatus('Sending…'); try { const response = await fetch('/api/forms/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId, blockId: block.id, fields: formValues }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to send'); setStatus(data.message || 'Sent successfully.'); setFormValues({}); } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to send.'); } }}><div className="grid gap-3">{fields.map((field: any) => <label key={field.name} className="grid gap-1 text-xs font-semibold">{field.label || field.name}{field.type === 'textarea' ? <textarea required={field.required !== false} value={formValues[field.name] || ''} onChange={e => setFormValues(v => ({ ...v, [field.name]: e.target.value }))} className="min-h-24 rounded-xl border bg-transparent p-3 font-normal" /> : <input required={field.required !== false} type={field.type || 'text'} value={formValues[field.name] || ''} onChange={e => setFormValues(v => ({ ...v, [field.name]: e.target.value }))} className="rounded-xl border bg-transparent p-3 font-normal" />}</label>)}</div><button className="rounded-xl px-4 py-2 text-sm font-bold" style={{ backgroundColor: theme.accentColor, color: getAccessibleTextColor(theme.accentColor) }} disabled={status === 'Sending…'}>{extra.buttonText || 'Send'}</button>{status && <p role="status" className="text-xs" style={{ color: theme.subtextColor }}>{status}</p>}</form></div>;
  if (block.type === 'download') { const href = safePublicHref(extra.fileUrl || block.url); return <a href={href || '#'} download={extra.downloadName} target="_blank" rel="noreferrer" className={`${card} block hover:opacity-90`} style={cardStyle}><strong>{block.title}</strong><span className="block text-sm mt-1" style={{ color: theme.subtextColor }}>{extra.description || 'Download file'}</span></a>; }
  if (block.type === 'map') { const query = encodeURIComponent(extra.location || block.subtitle || ''); return <a href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noreferrer" className={`${card} block`} style={cardStyle}><strong>{block.title}</strong><span className="block text-sm mt-1" style={{ color: theme.subtextColor }}>{extra.location || block.subtitle}</span></a>; }
  if (block.type === 'faq') return <div className="space-y-2">{links.map((item: any, index: number) => <details key={item.id || index} className={card} style={cardStyle}><summary className="cursor-pointer font-bold">{item.question || item.title}</summary><p className="pt-3 text-sm leading-6" style={{ color: theme.subtextColor }}>{item.answer || item.subtitle}</p></details>)}</div>;
  if (block.type === 'testimonials') return <div className={`${card} space-y-4`} style={cardStyle}><h3 className="font-bold">{block.title}</h3>{links.map((item: any, index: number) => <blockquote key={item.id || index} className="border-l-2 pl-3"><p className="text-sm">“{item.quote || item.body}”</p><cite className="mt-1 block text-xs not-italic" style={{ color: theme.subtextColor }}>{item.name || item.author}</cite></blockquote>)}</div>;
  if (block.type === 'event' || block.type === 'presave' || block.type === 'product' || block.type === 'tips' || block.type === 'phone') { const href = safePublicHref(extra.url || block.url || (block.type === 'phone' ? `tel:${extra.phone}` : undefined)); return <a href={href || '#'} target={href?.startsWith('tel:') ? undefined : '_blank'} rel="noreferrer" className={`${card} block`} style={cardStyle}><strong>{block.title}</strong><span className="block text-sm mt-1" style={{ color: theme.subtextColor }}>{extra.description || block.subtitle || extra.date || extra.price || extra.phone || 'Open'}</span></a>; }
  if (block.type === 'content_gate') return <div className={card} style={cardStyle}>{unlocked ? <div className="whitespace-pre-wrap text-sm">{status}</div> : <form onSubmit={async e => { e.preventDefault(); setStatus('Checking…'); try { const response = await fetch('/api/content-gates/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId, blockId: block.id, password: gateValue }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to unlock'); setStatus(data.body || 'Unlocked.'); setUnlocked(true); } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to unlock.'); } }}><h3 className="font-bold">{block.title}</h3><p className="text-sm my-3" style={{ color: theme.subtextColor }}>{extra.description || 'Enter the access code to continue.'}</p><input required type="password" value={gateValue} onChange={e => setGateValue(e.target.value)} className="w-full rounded-xl border bg-transparent p-3 mb-2" placeholder="Access code" /><button className="rounded-xl px-4 py-2 text-sm font-bold" style={{ backgroundColor: theme.accentColor, color: getAccessibleTextColor(theme.accentColor) }}>Unlock</button>{status && <p role="alert" className="text-xs mt-2">{status}</p>}</form>}</div>;
  return null;
};

interface PublicBioViewProps {
  previewOnly?: boolean;
  profile?: CreatorProfile;
  username?: string;
  pageSlug?: string;
  customDomain?: string;
  customTheme?: ThemeConfig;
  onBackToStudio?: () => void;
  onOpenQr?: () => void;
}

export const PublicBioView: React.FC<PublicBioViewProps> = ({
  previewOnly = false,
  profile: initialProfile,
  username: routeUsername,
  pageSlug,
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
  const [pageSearch, setPageSearch] = useState('');

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
      ? api.profiles.getByCustomDomain(customDomain, pageSlug)
      : api.profiles.getByUsername(routeUsername!.replace(/^@/, ''), pageSlug);

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
  }, [initialProfile, routeUsername, customDomain, pageSlug]);

  useEffect(() => {
    if (!profile || previewOnly) return;
    if (profile.pageRedirectUrl && (!profile.pageRedirectUntil || profile.pageRedirectUntil > Date.now())) {
      window.location.replace(profile.pageRedirectUrl);
      return;
    }
    const title = profile.shareTitle || `${profile.displayName} (@${profile.username}) | LIINX`;
    const description = profile.shareDescription || profile.bio || `Explore ${profile.displayName}'s links, media and updates on Liinx.`;
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[name="robots"]')?.setAttribute('content', 'index, follow');
    const canonical = customDomain ? `https://${customDomain}${profile.page && !profile.page.isHome ? `/${profile.page.slug}` : ''}` : `https://liinx.app/@${profile.username}${profile.page && !profile.page.isHome ? `/${profile.page.slug}` : ''}`;
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    if (profile.shareImageUrl) document.querySelector('meta[property="og:image"]')?.setAttribute('content', profile.shareImageUrl);
  }, [profile, previewOnly, customDomain]);

  // Google Analytics 4 (gtag.js) Injection
  useEffect(() => {
    if (previewOnly || analyticsConsent !== 'granted' || typeof profile?.gaMeasurementId !== 'string') return;
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
    if (previewOnly || analyticsConsent !== 'granted' || typeof profile?.metaPixelId !== 'string') return;
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
    if (previewOnly || typeof profile?.customFontUrl !== 'string') return;
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
        <Loader2 className="w-8 h-8 animate-spin text-neutral-600 mb-4" />
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

  const theme = resolveTheme(profile.themeId, customTheme || profile.customTheme);
  const themeBackground = getThemeBackground(theme);

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
      setNewsletterError(friendlyErrorMessage(err, ui('Subscription failed. Please check your email.')));
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
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'tiktok': return <AtSign className="w-4 h-4" />;
      default: return <ExternalLink className="w-4 h-4" />;
    }
  };

  return (
    <div 
      id="public-bio-view"
      className="min-h-screen w-full transition-colors duration-300 relative selection:bg-black selection:text-white"
      style={{
        ...themeBackground,
        backgroundImage: profile.backgroundMediaType === 'image' && profile.backgroundMediaUrl
          ? `url(${profile.backgroundMediaUrl})`
          : themeBackground.backgroundImage,
        backgroundSize: profile.backgroundMediaType === 'image' && profile.backgroundMediaUrl ? 'cover' : undefined,
        backgroundAttachment: profile.backgroundMediaType === 'image' && profile.backgroundMediaUrl ? 'fixed' : undefined,
        color: theme.textColor,
        fontFamily: theme.fontFamily === 'display' ? 'var(--font-display)' : theme.fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-sans)'
      }}
    >
      {profile.backgroundMediaType === 'video' && profile.backgroundMediaUrl && <video className="fixed inset-0 -z-0 h-full w-full object-cover" src={profile.backgroundMediaUrl} autoPlay muted loop playsInline aria-hidden="true" />}
      {profile?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: profile.customCss }} />
      )}
      {/* Top Floating Control Bar */}
      <header
        className="public-header sticky top-0 z-40 w-full px-4 py-3 backdrop-blur-md border-b flex items-center justify-between text-xs"
        style={{
          backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.86)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(24, 24, 23, 0.12)'
        }}
      >
        {onBackToStudio ? (
          <button
            onClick={onBackToStudio}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium transition-opacity hover:opacity-80 cursor-pointer"
            style={{ backgroundColor: theme.cardBg, color: theme.cardText, borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.12)') }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{ui("Back to Studio")}</span>
          </button>
        ) : (
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium transition-opacity hover:opacity-80 cursor-pointer"
            style={{ backgroundColor: theme.cardBg, color: theme.cardText, borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.12)') }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{ui("LIINX")}</span>
          </button>
        )}

        <div className="public-header-actions flex items-center gap-2">
          <button
            onClick={onOpenQr ? onOpenQr : () => setQrModalOpen(true)}
            className="px-3 py-1.5 rounded-full border font-medium transition-opacity hover:opacity-80 cursor-pointer flex items-center gap-1.5"
            style={{ backgroundColor: theme.cardBg, color: theme.cardText, borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.12)') }}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{ui("QR Code")}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-semibold transition-opacity hover:opacity-80 shadow-xs cursor-pointer"
            style={{ backgroundColor: theme.cardBg, color: theme.cardText, borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.12)') }}
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
      <main dir={isProfileRtl ? 'rtl' : 'ltr'} className="max-w-xl mx-auto px-4 py-12 sm:py-16" onClickCapture={previewOnly ? event => { event.preventDefault(); event.stopPropagation(); } : undefined} onSubmitCapture={previewOnly ? event => { event.preventDefault(); event.stopPropagation(); } : undefined}>
        
        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4">
            <img 
              src={profile.avatarUrl} 
              alt={profile.displayName}
              onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/favicon.svg'; }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-md ring-4 ring-white/20"
              referrerPolicy="no-referrer"
            />
            {profile.verified && (
              <div 
                className="absolute bottom-1 right-1 p-1.5 rounded-full text-white shadow-md"
                style={{ backgroundColor: theme.accentColor, color: getAccessibleTextColor(theme.accentColor) }}
                title={ui("Verified Profile")}
              >
                <CheckCircle2 className="w-4 h-4 fill-current" style={{ color: getAccessibleTextColor(theme.accentColor) }} />
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 flex items-center justify-center gap-2">
            <span>{profile.displayName}</span>
          </h1>

          <p className="text-xs sm:text-sm font-mono mb-3" style={{ color: theme.subtextColor }}>
            {brand.domain}/@{profile.username}
          </p>

          <p 
            className="text-sm max-w-md leading-relaxed mb-6"
            style={{ color: theme.subtextColor }}
          >
            {profile.bio}
          </p>

          {/* Socials Row */}
          {Array.isArray(profile.socials) && profile.socials.length > 0 && (
            <div className="flex items-center justify-center gap-2.5 mb-2 flex-wrap">
              {profile.socials.map((social, idx) => (
                <a
                  key={idx}
                  href={safePublicHref(social.url) || '#'}
                  target={/^(https?:)/i.test(social.url) ? '_blank' : undefined}
                  rel={/^(https?:)/i.test(social.url) ? 'noreferrer' : undefined}
                  aria-label={`${social.platform} link`}
                  dir="ltr"
                  className="p-2.5 rounded-full transition-transform duration-200 hover:scale-110 active:scale-95 border shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.1)'),
                    color: theme.cardText
                  }}
                  title={social.platform}
                >
                  {renderSocialIcon(social.platform)}
                </a>
              ))}
            </div>
          )}
          {Array.isArray(profile.pages) && profile.pages.filter(page => page.published).length > 1 && (
            <nav aria-label={ui('Profile pages')} className="mt-4 flex max-w-full flex-wrap justify-center gap-2">
              {profile.pages.filter(page => page.published).map(page => {
                const href = customDomain ? `${page.isHome ? '/' : `/${page.slug}`}` : `/@${profile.username}${page.isHome ? '' : `/${page.slug}`}`;
                const active = profile.page?.id === page.id;
                return <a key={page.id} href={href} aria-current={active ? 'page' : undefined} className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors" style={{ backgroundColor: active ? theme.cardText : theme.cardBg, color: active ? theme.cardBg : theme.cardText, borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,.15)') }}>{page.title}</a>;
              })}
            </nav>
          )}
        </div>

        {/* Content Blocks */}
        {profile.blocks.length > 5 && <label className="mb-5 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm" style={{ backgroundColor: theme.cardBg, borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,.15)'), color: theme.cardText }}><span aria-hidden="true">⌕</span><input value={pageSearch} onChange={event => setPageSearch(event.target.value)} placeholder={ui('Search this page')} aria-label={ui('Search this page')} className="min-w-0 flex-1 bg-transparent outline-none" /></label>}
        <div className={`mb-14 ${profile.blocks.some(block => block.type === 'link' && (block as any).layout === 'grid') ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*:not(.liinx-grid-link)]:sm:col-span-2' : 'space-y-4'}`}>
          {(Array.isArray(profile.blocks) ? profile.blocks : []).filter(block => !pageSearch.trim() || `${block.title} ${block.subtitle || ''}`.toLowerCase().includes(pageSearch.trim().toLowerCase())).map((block) => {
            if (block.type === 'booking') return <div key={block.id}><BookingCard block={block} theme={theme} /></div>;
            if (block.type === 'link') {
              // Real click redirection through /r/:blockId for 0% fake tracking!
              const redirectUrl = `/r/${block.id}`;
              const isComplexLink = Boolean(block.subtitle);
              const isPill = theme.cardRadius === 'full' && !isComplexLink;
              const linkLayout = (block as any).layout || 'list';
              const linkAnimation = (block as any).animation || 'none';
              return (
                <a
                  key={block.id}
                  href={redirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${linkLayout === 'grid' ? 'liinx-grid-link' : 'sm:col-span-2'} group relative ${isPill ? 'px-6 py-4' : 'p-4'} transition-shadow duration-200 flex items-center justify-between gap-4 shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-current ${linkLayout === 'featured' ? 'min-h-28' : ''} ${linkLayout === 'grid' ? 'min-h-24' : ''} ${linkAnimation === 'fade' ? 'animate-fade-in' : ''} ${linkAnimation === 'pulse' ? 'motion-safe:animate-pulse' : ''} ${linkAnimation === 'lift' ? 'hover:-translate-y-0.5' : ''} ${getRadiusClass(theme.cardRadius, isComplexLink)}`}
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
                            color: getAccessibleTextColor(theme.accentColor)
                          }}
                        >
                          {block.badge}
                        </span>
                      )}
                    </div>
                    {block.subtitle && (
                      <p className="text-xs truncate" style={{ color: theme.subtextColor }} dir="auto">
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
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest" dir="auto">
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
                      <div className="flex items-center gap-1.5 text-[11px] mb-0.5" style={{ color: theme.subtextColor }}>
                        <Music2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="uppercase font-mono tracking-wider font-semibold">{ui("Audio Track")}</span>
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
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0"
                          style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.12)' : '#F5F5F5', color: theme.cardText }}
                        >
                          {block.items?.length || 0} {ui("links")}</span>
                      </div>
                      {block.subtitle && (
                        <p className="text-xs truncate mt-0.5 text-pretty" style={{ color: theme.subtextColor }} dir="auto">{block.subtitle}</p>
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
                            <p className="text-xs truncate mt-0.5 text-pretty" style={{ color: theme.subtextColor }} dir="auto">{item.subtitle}</p>
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
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-red-700 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
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
                  <p className="text-xs mb-4 leading-relaxed text-pretty" style={{ color: theme.subtextColor }} dir="auto">
                    {block.description}
                  </p>

                  {newsletterSuccess ? (
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 justify-center" dir="auto">
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
                        className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border outline-none focus:ring-2 focus:ring-neutral-900/20"
                        style={{ backgroundColor: theme.cardBg, borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.12)'), color: theme.cardText }}
                        required
                        spellCheck={false}
                        dir="auto"
                      />
                      {newsletterError && (
                        <p role="alert" className="text-xs text-rose-500 font-medium px-1" dir="auto">
                          {newsletterError}
                        </p>
                      )}
                      <label className="flex items-start gap-2 text-[11px] leading-relaxed" style={{ color: theme.subtextColor }} dir="auto">
                        <input id={`newsletter-consent-${block.id}`} name="consent" autoComplete="off" type="checkbox" checked={newsletterConsent} onChange={e => setNewsletterConsent(e.target.checked)} className="mt-0.5 min-h-0" />
                        <span>{ui("I agree to receive updates from this creator and can unsubscribe later.")}</span>
                      </label>
                      <button
                        type="submit"
                        disabled={newsletterLoading}
                        className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white transition-opacity hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        style={{ backgroundColor: theme.accentColor, color: getAccessibleTextColor(theme.accentColor) }}
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

            if (advancedBlockTypes.has(block.type)) {
              return <AdvancedPublicBlock key={block.id} block={block} profileId={profile.id} theme={theme} previewOnly={previewOnly} />;
            }

            return null;
          })}
        </div>

        {/* Footer Brand Credit - omitted when white-labeled on Pro/Studio plans */}
        {(profile.footerLogoUrl || !(profile.plan && profile.plan !== 'free' && profile.hideBranding)) && (
          <div className="text-center pt-4 pb-12">
            {profile.footerLogoUrl ? <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-xs" style={{ backgroundColor: theme.cardBg, borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.15)') }}><img src={profile.footerLogoUrl} alt={`${profile.displayName} logo`} className="h-4 max-w-20 object-contain" /></span> : <button
              onClick={onBackToStudio ? onBackToStudio : () => setLocation('/')}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono tracking-wider transition-opacity hover:opacity-100 bg-neutral-100/5 dark:bg-neutral-900/5 border border-neutral-200 dark:border-neutral-800 shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
              style={{ backgroundColor: theme.cardBg, color: theme.cardText, borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.15)') }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{ui("Made with")}{' '}<strong>{ui("LIINX")}</strong></span>
            </button>}
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
