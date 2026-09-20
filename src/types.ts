export * from '../shared/types/index.js';
import type { CreatorProfile } from '../shared/types/index.js';

export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  category: 'Creators' | 'Musicians' | 'Design & Art' | 'Brands' | 'Podcasts' | 'Gaming' | 'Wellness' | 'Lifestyle';
  description: string;
  profile: CreatorProfile;
  previewColor: string;
}
