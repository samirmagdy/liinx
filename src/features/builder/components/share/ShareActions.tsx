import React, { useMemo, useState } from 'react';
import { Copy, QrCode, MessageCircle, Instagram } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { buildQrTargetUrl } from '../../../../utils/qr';
import { INSTAGRAM_PROFILE_EDIT_URL, whatsappShareUrl } from '../../utils/shareLinks';

const actionClass = 'inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 transition-colors hover:border-neutral-900 hover:text-neutral-900 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';

/**
 * The four ways a creator gets their address in front of someone. Every one of them carries the
 * address the visitor would actually open, including a connected custom domain, so what is shared
 * matches what is live.
 */
export const ShareActions: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { profile, activePage, setQrModalOpen } = useBuilder();
  const [notice, setNotice] = useState<string | null>(null);

  const pageUrl = useMemo(() => buildQrTargetUrl({
    username: profile.username,
    page: activePage,
    platformOrigin: window.location.origin,
    customDomain: profile.customDomain
  }) || '', [profile.username, profile.customDomain, activePage]);

  const copy = async (text: string, confirmation: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(confirmation);
    } catch {
      setNotice(ui('Your browser blocked the copy. Select the address and copy it by hand.'));
    }
  };

  const shareToInstagramBio = () => {
    // Opened first so the popup stays inside the click; the clipboard write is not user-blocking.
    window.open(INSTAGRAM_PROFILE_EDIT_URL, '_blank', 'noopener,noreferrer');
    void copy(pageUrl, ui('Link copied. Paste it into the bio field on the profile page that opened, then save.'));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={actionClass} onClick={() => void copy(pageUrl, ui('Copied!'))}>
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          {ui('Copy Link')}
        </button>
        <button type="button" className={actionClass} onClick={() => setQrModalOpen(true)}>
          <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
          {ui('QR Code')}
        </button>
        <a
          className={actionClass}
          href={whatsappShareUrl(pageUrl, profile.displayName || profile.username)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
          {ui('WhatsApp')}
        </a>
        <button type="button" className={actionClass} onClick={shareToInstagramBio}>
          <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
          {ui('Add to Instagram bio')}
        </button>
      </div>
      <p className="text-xs text-neutral-500 break-all" dir="ltr">{pageUrl}</p>
      {notice && <p role="status" className="text-xs font-semibold text-emerald-700">{notice}</p>}
    </div>
  );
};
