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
