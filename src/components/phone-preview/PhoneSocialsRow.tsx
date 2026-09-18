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
    <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
      {socials.map((social, idx) => (
        <a
          key={idx}
          href={social.url}
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-full transition-transform hover:scale-110 active:scale-95 border focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
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
