import { z } from 'zod';

export const marketingEventNames = [
  'marketing_cta_clicked',
  'template_previewed',
  'template_selected',
  'signup_started',
  'signup_completed',
  'page_published',
  'pricing_plan_selected',
  'checkout_started',
  'language_changed',
  'segment_selected'
] as const;

export const marketingEventNameSchema = z.enum(marketingEventNames);
export type MarketingEventName = z.infer<typeof marketingEventNameSchema>;

const metadataValueSchema = z.union([z.string().max(160), z.number(), z.boolean()]);

export const marketingEventSchema = z.object({
  event: marketingEventNameSchema,
  anonymousId: z.string().regex(/^[a-zA-Z0-9_-]{16,80}$/).optional(),
  sessionId: z.string().regex(/^[a-zA-Z0-9_-]{16,80}$/).optional(),
  route: z.string().regex(/^\/[a-zA-Z0-9_@?&=./-]{0,180}$/),
  language: z.enum(['en', 'ar']),
  segment: z.enum(['creator', 'business', 'agency', 'artist']).optional(),
  templateId: z.string().regex(/^[a-z0-9-]{1,80}$/).optional(),
  planId: z.enum(['free', 'pro', 'studio']).optional(),
  metadata: z.record(z.string().regex(/^[a-zA-Z0-9_]{1,40}$/), metadataValueSchema).optional()
}).strict();

export type MarketingEventPayload = z.infer<typeof marketingEventSchema>;
