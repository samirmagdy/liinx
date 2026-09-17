// USD cents; shared by the price display and Stripe Checkout.
export const paidPlans = {
  pro: { month: 1200, year: 12000, name: 'Liinx Pro' },
  studio: { month: 2900, year: 28800, name: 'Liinx Studio' }
} as const;

export type BillingInterval = 'month' | 'year';
export type SubscriptionPlan = 'free' | 'pro' | 'studio';

export const PLAN_ENTITLEMENTS = {
  free: { maxProfiles: 1, customDomain: false, paidCustomization: false, scheduling: false, apiAccess: false },
  pro: { maxProfiles: 5, customDomain: true, paidCustomization: true, scheduling: true, apiAccess: false },
  studio: { maxProfiles: 25, customDomain: true, paidCustomization: true, scheduling: true, apiAccess: true }
} as const;

export function normalizePlan(plan: unknown): SubscriptionPlan {
  return plan === 'pro' || plan === 'studio' ? plan : 'free';
}

export function entitlementsFor(plan: unknown) {
  return PLAN_ENTITLEMENTS[normalizePlan(plan)];
}

export function hasEntitlement(plan: unknown, key: keyof Omit<(typeof PLAN_ENTITLEMENTS)['free'], 'maxProfiles'>): boolean {
  return entitlementsFor(plan)[key];
}
