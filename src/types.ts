export * from '../shared/types/index.js';
import type { CreatorProfile } from '../shared/types/index.js';


export interface TemplateItem {
  id: string;
  name: string;
  category: 'Creators' | 'Musicians' | 'Design & Art' | 'Brands' | 'Podcasts' | 'Gaming' | 'Wellness' | 'Lifestyle';
  description: string;
  profile: CreatorProfile;
  previewColor: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  features: string[];
  ctaText: string;
}
