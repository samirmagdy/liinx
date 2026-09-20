import { useState, useEffect } from 'react';
import { type CreatorProfile } from '../../../types';
import { api } from '../../../services/api';
import { isAllowedFontStylesheetUrl } from '../../../utils/fontValidation';
import { safePublicHref } from '../utils/publicBio.utils';
import { findSystemDemoProfile } from '../../../../shared/index.js';
import { DEMO_PROFILES } from '../../../demo/demoProfiles';

interface UsePublicProfileProps {
  initialProfile?: CreatorProfile;
  routeUsername?: string;
  customDomain?: string;
  pageSlug?: string;
  previewOnly?: boolean;
}

function updatePublicProfileMetadata(profile: CreatorProfile, customDomain?: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const redirectUrl = safePublicHref(profile.pageRedirectUrl);
  const redirectIsActive = Boolean(
    redirectUrl &&
    /^https?:$/i.test(new URL(redirectUrl).protocol) &&
    (!profile.pageRedirectUntil || profile.pageRedirectUntil > Date.now())
  );
  if (redirectUrl && redirectIsActive) {
    window.location.replace(redirectUrl);
    return;
  }

  const title = profile.shareTitle || `${profile.displayName} (@${profile.username}) | RALOA`;
  const description = profile.shareDescription || profile.bio || `Explore ${profile.displayName}'s links, media and updates on RALOA.`;
  const isDemo = Boolean(findSystemDemoProfile(profile.username));
  const canonical = customDomain
    ? `https://${customDomain}${profile.page && !profile.page.isHome ? `/${profile.page.slug}` : ''}`
    : `https://raloa.app/@${profile.username}${profile.page && !profile.page.isHome ? `/${profile.page.slug}` : ''}`;
  const image = profile.shareImageUrl || profile.avatarUrl || 'https://raloa.app/social/og-image-1200x630.jpg';

  document.title = title;
  setMetaContent('meta[name="description"]', description);
  setMetaContent('meta[name="robots"]', isDemo ? 'noindex, nofollow' : 'index, follow');
  setMetaContent('link[rel="canonical"]', canonical, 'href');
  setMetaContent('meta[property="og:url"]', canonical);
  setMetaContent('meta[property="og:title"]', title);
  setMetaContent('meta[property="og:description"]', description);
  setMetaContent('meta[name="twitter:title"]', title);
  setMetaContent('meta[name="twitter:description"]', description);
  setMetaContent('meta[property="og:image"]', image);
  setMetaContent('meta[property="og:image:secure_url"]', image);
  setMetaContent('meta[property="og:image:alt"]', `${profile.displayName} on RALOA`);
  setMetaContent('meta[name="twitter:image"]', image);
}

function setMetaContent(selector: string, value: string, attribute = 'content') {
  document.querySelector(selector)?.setAttribute(attribute, value);
}

export function usePublicProfile({
  initialProfile,
  routeUsername,
  customDomain,
  pageSlug,
  previewOnly = false
}: UsePublicProfileProps) {
  const [profile, setProfile] = useState<CreatorProfile | null>(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile);
  const [notFound, setNotFound] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [footerLogoFailed, setFooterLogoFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  // Custom font stylesheet link injection
  useEffect(() => {
    if (!profile?.customFontUrl || !isAllowedFontStylesheetUrl(profile.customFontUrl) || typeof document === 'undefined') return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = profile.customFontUrl;
    document.head.appendChild(link);
    return () => link.remove();
  }, [profile?.customFontUrl]);

  // Reset footer logo error state when URL changes
  useEffect(() => {
    setFooterLogoFailed(false);
  }, [profile?.footerLogoUrl]);

  // Dynamic fetch when accessed via route or custom domain
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

    const cleanUsername = routeUsername?.replace(/^@/, '').toLowerCase().trim();

    const fetchPromise = customDomain
      ? api.profiles.getByCustomDomain(customDomain, pageSlug)
      : api.profiles.getByUsername(cleanUsername!, pageSlug);

    fetchPromise
      .then(fetchedProfile => {
        if (!fetchedProfile || !fetchedProfile.id) {
          const demo = cleanUsername ? (findSystemDemoProfile(cleanUsername) || DEMO_PROFILES.find(p => p.username.toLowerCase() === cleanUsername)) : undefined;
          if (demo) {
            setProfile(demo);
            if (typeof document !== 'undefined') {
              document.title = `${demo.displayName} (@${demo.username}) | RALOA`;
            }
            return;
          }
          setNotFound(true);
          return;
        }
        setProfile(fetchedProfile);
        if (typeof document !== 'undefined') {
          document.title = `${fetchedProfile.displayName} (@${fetchedProfile.username}) | RALOA`;
        }
      })
      .catch((err: any) => {
        const demo = cleanUsername ? (findSystemDemoProfile(cleanUsername) || DEMO_PROFILES.find(p => p.username.toLowerCase() === cleanUsername)) : undefined;
        if (demo) {
          setProfile(demo);
          if (typeof document !== 'undefined') {
            document.title = `${demo.displayName} (@${demo.username}) | RALOA`;
          }
          return;
        }
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

  // SEO & Head Metadata & Redirects
  useEffect(() => {
    if (!profile || previewOnly || typeof window === 'undefined' || typeof document === 'undefined') return;
    updatePublicProfileMetadata(profile, customDomain);
  }, [profile, previewOnly, customDomain]);

  return {
    profile,
    setProfile,
    loading,
    notFound,
    serverError,
    footerLogoFailed,
    setFooterLogoFailed,
    reducedMotion
  };
}
