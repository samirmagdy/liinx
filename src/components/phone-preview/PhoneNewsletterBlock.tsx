import React from 'react';
import { Mail, Send } from 'lucide-react';
import { type NewsletterBlock, type ThemeConfig } from '../../types';
import { getAccessibleTextColor, getBorderColor } from '../../utils/colorContrast';
import { useLanguage as useUiLanguage } from '../../context/LanguageContext';

interface PhoneNewsletterBlockProps {
  block: NewsletterBlock;
  theme: ThemeConfig;
  radiusClass: string;
  email: string;
  onEmailChange: (email: string) => void;
  onSubscribe: (event: React.FormEvent) => void;
}

export const PhoneNewsletterBlock: React.FC<PhoneNewsletterBlockProps> = ({
  block,
  theme,
  radiusClass,
  email,
  onEmailChange,
  onSubscribe,
}) => {
  const { tr: ui } = useUiLanguage();
  return (
    <div
      className={`p-4 transition-shadow shadow-xs ${radiusClass}`}
      style={{ backgroundColor: theme.cardBg, border: theme.cardBorder, color: theme.cardText }}
    >
      <h3 className="text-xs font-bold mb-1 flex items-center gap-1.5" dir="auto">
        <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accentColor }} />
        <span dir="auto">{block.title}</span>
      </h3>
      <p className="text-[11px] mb-3 leading-relaxed text-pretty" style={{ color: theme.subtextColor }} dir="auto">
        {block.description}
      </p>

      <form onSubmit={onSubscribe} className="space-y-2">
        <input
          id={`phone-preview-newsletter-email-${block.id}`}
          name="email"
          autoComplete="email"
          aria-label={ui('Email address')}
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="your@email.com…"
          className="w-full px-3 py-2 text-xs rounded-xl border outline-none transition-colors focus-visible:ring-1 focus-visible:ring-indigo-500"
          style={{ backgroundColor: theme.cardBg, borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.12)'), color: theme.cardText }}
          required
          spellCheck={false}
          dir="ltr"
        />
        <button
          type="submit"
          className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
          style={{ backgroundColor: theme.accentColor, color: getAccessibleTextColor(theme.accentColor) }}
        >
          <span dir="auto">{block.buttonText}</span>
          <Send className="w-3 h-3 shrink-0" />
        </button>
      </form>
    </div>
  );
};
