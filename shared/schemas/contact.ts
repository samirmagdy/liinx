import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120).refine(value => !/[\r\n]/.test(value), 'Name contains unsupported control characters.'),
  email: z.string().email().max(254),
  message: z.string().trim().min(1).max(5000),
  website: z.string().max(200).optional()
});

export type ContactInput = z.infer<typeof contactSchema>;

export interface ContactResponse {
  success: boolean;
  id: string;
  notification: 'sent' | 'not_configured' | 'failed';
}
