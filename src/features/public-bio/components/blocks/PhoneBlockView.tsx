import React from 'react';
import { BlockItem, ThemeConfig } from '../../../../types';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { getMailtoHref, getPhoneHref } from '../../../../utils/contactLinks';
import { safePublicHref, analyticsHref, advancedRadius } from '../../utils/publicBio.utils';

interface PhoneBlockViewProps {
  block: BlockItem;
  theme: ThemeConfig;
  previewOnly?: boolean;
}

export const PhoneBlockView: React.FC<PhoneBlockViewProps> = ({
  block,
  theme,
  previewOnly = false
}) => {
  const { tr: ui } = useUiLanguage();
  const extra = (block as any).extra || block;
  const card = `p-5 shadow-sm ${advancedRadius(theme.cardRadius)}`;
  const cardStyle = { backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText };

  const isEmail = extra.contactType === 'email';
  const rawHref = isEmail ? getMailtoHref(extra.email, extra.subject, extra.body) : getPhoneHref(extra.phone);
  const href = safePublicHref(rawHref);
  const actionHref = href && !previewOnly ? analyticsHref(`/r/${block.id}`) : null;
  const displayValue = isEmail
    ? typeof extra.email === 'string'
      ? extra.email
      : ''
    : typeof extra.phone === 'string'
    ? extra.phone
    : '';

  return (
    <article className={`${card} space-y-3`} style={cardStyle}>
      <h3 className="break-words font-bold">{block.title}</h3>
      {extra.description || block.subtitle ? (
        <p className="whitespace-pre-wrap break-words text-sm leading-6" style={{ color: theme.subtextColor }}>
          {extra.description || block.subtitle}
        </p>
      ) : null}
      {displayValue && (
        <p className="break-words text-sm" dir="ltr">
          {displayValue}
        </p>
      )}
      {extra.availability && (
        <p className="whitespace-pre-wrap break-words text-xs" style={{ color: theme.subtextColor }}>
          {extra.availability}
        </p>
      )}
      {actionHref ? (
        <a
          href={actionHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-lg border px-3 py-2 text-sm font-semibold underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          {ui(isEmail ? 'Send email' : 'Call')}
        </a>
      ) : (
        <p role="status" className="text-sm" style={{ color: theme.subtextColor }}>
          {href && previewOnly
            ? ui('Contact action is disabled in preview.')
            : ui('Contact action is not configured yet.')}
        </p>
      )}
      {!isEmail && (
        <p className="text-xs" style={{ color: theme.subtextColor }}>
          {ui('Your device may not have a dialer.')}
        </p>
      )}
    </article>
  );
};
