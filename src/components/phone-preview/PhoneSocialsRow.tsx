import React from 'react';
import {
  Instagram,
  Twitter,
  Github,
  Mail,
  Youtube,
  Linkedin,
  Disc,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { type SocialLink, type ThemeConfig } from '../../types';
import { getBorderColor } from '../../utils/colorContrast';

interface PhoneSocialsRowProps {
  socials?: SocialLink[];
  theme: ThemeConfig;
}

export const PhoneSocialsRow: React.FC<PhoneSocialsRowProps> = ({ socials, theme }) => {
  if (!Array.isArray(socials) || socials.length === 0) return null;

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

  return (
    <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
      {socials.map((social, idx) => (
        <a
          key={idx}
          href={social.url}
          target="_blank"
          rel="noreferrer"
          aria-label={social.platform}
          className="grid h-11 w-11 place-items-center rounded-full border transition-transform hover:scale-110 active:scale-95"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,0.06)'),
            color: theme.cardText
          }}
          title={social.platform}
        >
          {renderSocialIcon(social.platform)}
        </a>
      ))}
    </div>
  );
};
