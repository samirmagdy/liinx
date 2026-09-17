import { RESERVED_USERNAMES } from '../constants/brand.js';

export { RESERVED_USERNAMES };

export interface BrandConfig {
  productName: string;
  productShortName: string;
  tagline: string;
  subheadline: string;
  domain: string;
  cnameTarget: string;
  supportEmail: string;
  legalName: string;
  copyrightName: string;
  logoMark: string;
  description: string;
  defaultTitle: string;
  socials: {
    twitter: string;
    instagram: string;
    github: string;
    linkedin: string;
  };
  colors: {
    ink: string;
    amber: string;
    canvas: string;
    surface: string;
    border: string;
  };
  reservedUsernames: readonly string[];
}

export const brand: BrandConfig = {
  productName: 'Liinx Studio',
  productShortName: 'Liinx',
  tagline: 'Your entire world. Designed your way.',
  subheadline: 'Create a beautiful mini-site for everything you make, sell and share.',
  domain: 'liinx.app',
  cnameTarget: 'liinx-app.fly.dev',
  supportEmail: 'support@liinx.app',
  legalName: 'Liinx Studio',
  copyrightName: 'Liinx Studio',
  logoMark: 'LX',
  description: 'A design-first micro-website builder for creators, professionals, freelancers, businesses and brands.',
  defaultTitle: 'Liinx Studio — A design-first micro-site builder for everything you make, sell and share',
  socials: {
    twitter: 'https://x.com/liinxapp',
    instagram: 'https://instagram.com/liinxapp',
    github: 'https://github.com/liinxapp',
    linkedin: 'https://linkedin.com/company/liinx'
  },
  colors: {
    ink: '#181817',
    amber: '#D97706',
    canvas: '#FAF9F6',
    surface: '#FFFFFF',
    border: '#E5E5E0'
  },
  reservedUsernames: RESERVED_USERNAMES
};
