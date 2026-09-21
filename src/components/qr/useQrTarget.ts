import { useEffect, useMemo, useState } from 'react';
import type { CreatorPage } from '../../types';
import { buildQrTargetUrl } from '../../utils/qr';

interface QrTargetOptions {
  username: string;
  pages: CreatorPage[];
  currentPageSlug?: string;
  customDomain?: string | null;
  isOpen: boolean;
}

export function useQrTarget({ username, pages, currentPageSlug, customDomain, isOpen }: QrTargetOptions) {
  const [selectedPageSlug, setSelectedPageSlug] = useState(currentPageSlug || 'home');

  useEffect(() => {
    setSelectedPageSlug(currentPageSlug || 'home');
  }, [currentPageSlug, isOpen]);

  const publishedPages = useMemo(() => pages.filter(page => page.published), [pages]);

  const targetPage = publishedPages.find(page => (page.isHome ? 'home' : page.slug) === selectedPageSlug)
    || publishedPages.find(page => page.isHome);

  const profileUrl = buildQrTargetUrl({
    username,
    page: targetPage,
    platformOrigin: window.location.origin,
    customDomain
  }) || '';

  return { publishedPages, targetPage, profileUrl, setSelectedPageSlug };
}

export function qrImageApiUrl(profileUrl: string, qrColor: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(profileUrl)}&color=${qrColor.replace('#', '')}&bgcolor=FFFFFF`;
}
