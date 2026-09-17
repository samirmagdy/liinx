import React, { useState } from 'react';
import { Mail, CheckCircle2, Send, Loader2 } from 'lucide-react';
import { BlockItem, ThemeConfig } from '../../../../types';
import { api } from '../../../../services/api';
import { getAccessibleTextColor, getBorderColor } from '../../../../utils/colorContrast';
import { friendlyErrorMessage } from '../../../../utils/errors';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { getRadiusClass } from '../../utils/publicBio.utils';

interface NewsletterBlockViewProps {
  block: BlockItem;
  profileId: string;
  theme: ThemeConfig;
}

export const NewsletterBlockView: React.FC<NewsletterBlockViewProps> = ({
  block,
  profileId,
  theme
}) => {
  const { tr: ui } = useUiLanguage();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState<string | null>(null);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterUnsubscribeUrl, setNewsletterUnsubscribeUrl] = useState<string | null>(null);

  const handleNewsletter = async (e: React.FormEvent) => {
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
      const res = await api.newsletter.subscribe(profileId, block.id, newsletterEmail.trim(), newsletterConsent);
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

  return (
    <div
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
        <div
          className="p-3 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 justify-center"
          dir="auto"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{newsletterSuccess}</span>
          {newsletterUnsubscribeUrl && (
            <a href={newsletterUnsubscribeUrl} className="underline underline-offset-2" dir="auto">
              {ui('Unsubscribe')}
            </a>
          )}
        </div>
      ) : (
        <form onSubmit={handleNewsletter} className="space-y-2.5">
          <input
            id={`newsletter-email-${block.id}`}
            name="email"
            autoComplete="email"
            aria-label={ui('Enter your email address')}
            type="email"
            value={newsletterEmail}
            onChange={e => {
              setNewsletterEmail(e.target.value);
              if (newsletterError) setNewsletterError(null);
            }}
            placeholder={ui('Enter your email address')}
            className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border outline-none focus:ring-2 focus:ring-neutral-900/20"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.12)'),
              color: theme.cardText
            }}
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
            <input
              id={`newsletter-consent-${block.id}`}
              name="consent"
              autoComplete="off"
              type="checkbox"
              checked={newsletterConsent}
              onChange={e => setNewsletterConsent(e.target.checked)}
              className="mt-0.5 min-h-0"
            />
            <span>{ui('I agree to receive updates from this creator and can unsubscribe later.')}</span>
          </label>
          <p className="text-[10px] leading-relaxed opacity-75" style={{ color: theme.subtextColor }} dir="auto">
            {ui('Single opt-in: checking consent adds your email immediately. No confirmation email is sent.')}
          </p>
          <button
            type="submit"
            disabled={newsletterLoading}
            className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white transition-opacity hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{
              backgroundColor: theme.accentColor,
              color: getAccessibleTextColor(theme.accentColor)
            }}
          >
            {newsletterLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>{ui('Subscribing...')}</span>
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
};
