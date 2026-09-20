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
    accent: string;
    canvas: string;
    surface: string;
    border: string;
  };
  reservedUsernames: readonly string[];
}

export const brand: BrandConfig = {
  productName: 'RALOA',
  productShortName: 'RALOA',
  tagline: 'Your space on the internet.',
  subheadline: 'Create a beautiful mini-site for everything you make, sell and share.',
  domain: 'raloa.app',
  cnameTarget: 'raloa-app.fly.dev',
  supportEmail: 'support@raloa.app',
  legalName: 'RALOA',
  copyrightName: 'RALOA',
  logoMark: 'R',
  description: 'A design-first micro-website builder for creators, professionals, freelancers, businesses and brands.',
  defaultTitle: 'RALOA — Your space on the internet',
  socials: {
    twitter: 'https://x.com/raloaapp',
    instagram: 'https://instagram.com/raloaapp',
    github: 'https://github.com/raloaapp',
    linkedin: 'https://linkedin.com/company/raloa'
  },
  colors: {
    ink: '#0F172A',
    accent: '#6366F1',
    canvas: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0'
  },
  reservedUsernames: RESERVED_USERNAMES
};
