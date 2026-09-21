import { PLAN_ENTITLEMENTS, normalizePlan, type SubscriptionPlan } from '../../../../shared/config/plans';
import { type BuilderTab, type SettingsSection, type UpgradeCapability } from '../types/builder.types';

/**
 * The Studio's navigation, written once. Labels are dictionary keys, so renaming a tab
 * means adding its Arabic here rather than hunting for the string in the sidebar.
 */
export const STUDIO_TABS: { id: BuilderTab; label: string; shortLabel: string }[] = [
  { id: 'content', label: 'Content', shortLabel: 'Content' },
  { id: 'design', label: 'Design', shortLabel: 'Design' },
  { id: 'audience', label: 'Audience', shortLabel: 'Audience' },
  { id: 'analytics', label: 'Analytics', shortLabel: 'Stats' },
  { id: 'settings', label: 'Settings', shortLabel: 'More' }
];

export const SETTINGS_SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: 'site', label: 'Site' },
  { id: 'domain', label: 'Domain & SEO' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'billing', label: 'Billing' },
  { id: 'advanced', label: 'Advanced' }
];

const isBuilderTab = (value: string | null): value is BuilderTab =>
  STUDIO_TABS.some(tab => tab.id === value);

export const parseBuilderTab = (value: string | null): BuilderTab => (isBuilderTab(value) ? value : 'content');

/** Lowest plan that grants each entitlement, read from the same table the server enforces. */
type EntitlementKey = keyof (typeof PLAN_ENTITLEMENTS)['free'];

/** Lowest paid plan that grants an entitlement, read from the table the server enforces. */
const lowestPlanFor = (key: EntitlementKey): SubscriptionPlan => {
  const granted = (plan: SubscriptionPlan) => {
    const value = PLAN_ENTITLEMENTS[plan as 'pro' | 'studio'][key];
    return key === 'maxProfiles'
      ? Number(value) > PLAN_ENTITLEMENTS.free.maxProfiles
      : Boolean(value);
  };
  if (granted('pro')) return 'pro';
  if (granted('studio')) return 'studio';
  return 'free';
};

const ENTITLEMENT_OF: Record<UpgradeCapability, EntitlementKey> = {
  'custom-domain': 'customDomain',
  'tracking-pixels': 'paidCustomization',
  'custom-css': 'paidCustomization',
  'white-label': 'paidCustomization',
  'background-media': 'paidCustomization',
  'footer-branding': 'paidCustomization',
  scheduling: 'scheduling',
  'api-access': 'apiAccess',
  'extra-sites': 'maxProfiles'
};

/**
 * What a locked control promises. The copy has to name the specific capability, because a
 * "PRO FEATURE" badge that says nothing is what made the paywall feel arbitrary.
 */
export const UPGRADE_COPY: Record<UpgradeCapability, { title: string; detail: string }> = {
  'custom-domain': {
    title: 'Connect your own domain',
    detail: 'Point links.yourbrand.com at your page instead of publishing under the platform address.'
  },
  'tracking-pixels': {
    title: 'Add your own analytics pixels',
    detail: 'Connect a Google Analytics 4 measurement ID and a Meta Pixel to your published page.'
  },
  'custom-css': {
    title: 'Write custom CSS and load your own webfont',
    detail: 'Custom styles are scoped to your public page, and font imports must come from Google Fonts.'
  },
  'white-label': {
    title: 'Remove the platform branding',
    detail: 'Hide the "Made with RALOA" badge so the page reads as yours alone.'
  },
  'background-media': {
    title: 'Set a background image or video',
    detail: 'Your own artwork behind the page, instead of the theme background.'
  },
  'footer-branding': {
    title: 'Put your own logo in the footer',
    detail: 'A logo, the address it links to, and the name a screen reader announces.'
  },
  scheduling: {
    title: 'Schedule when blocks appear',
    detail: 'Give a start and end time so a block goes live and retires on its own.'
  },
  'api-access': {
    title: 'Issue API keys',
    detail: 'Read your page and its analytics from your own tooling through the REST API.'
  },
  'extra-sites': {
    title: 'Run more than one site',
    detail: 'A free account publishes one site; extra handles for other projects need a paid plan.'
  }
};

export const minimumPlanFor = (capability: UpgradeCapability): SubscriptionPlan =>
  lowestPlanFor(ENTITLEMENT_OF[capability]);

const PLAN_RANK: Record<SubscriptionPlan, number> = { free: 0, pro: 1, studio: 2 };

/** Whether a plan already carries a capability — the same table the server enforces against. */
export const planUnlocks = (plan: unknown, capability: UpgradeCapability): boolean =>
  PLAN_RANK[normalizePlan(plan)] >= PLAN_RANK[minimumPlanFor(capability)];
