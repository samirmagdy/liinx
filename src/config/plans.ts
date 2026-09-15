// USD cents; shared by the price display and Stripe Checkout.
export const paidPlans = {
  pro: { month: 1200, year: 12000, name: 'Liinx Pro' },
  studio: { month: 2900, year: 28800, name: 'Liinx Studio' }
} as const;
export type BillingInterval = 'month' | 'year';
