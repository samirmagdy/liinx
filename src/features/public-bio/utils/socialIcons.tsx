import React from 'react';
import {
  Instagram,
  Twitter,
  Youtube,
  Disc,
  Github,
  Linkedin,
  Mail,
  Phone,
  AtSign,
  ExternalLink
} from 'lucide-react';

export function renderSocialIcon(platform: string): React.ReactNode {
  switch (platform.toLowerCase()) {
    case 'instagram': return <Instagram className="w-4 h-4" />;
    case 'twitter':
    case 'x': return <Twitter className="w-4 h-4" />;
    case 'youtube': return <Youtube className="w-4 h-4" />;
    case 'spotify': return <Disc className="w-4 h-4" />;
    case 'github': return <Github className="w-4 h-4" />;
    case 'linkedin': return <Linkedin className="w-4 h-4" />;
    case 'email': return <Mail className="w-4 h-4" />;
    case 'phone': return <Phone className="w-4 h-4" />;
    case 'tiktok': return <AtSign className="w-4 h-4" />;
    default: return <ExternalLink className="w-4 h-4" />;
  }
}
