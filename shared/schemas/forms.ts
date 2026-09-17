import { z } from 'zod';

export const formSubmissionSchema = z.object({
  profileId: z.string().min(1).max(100),
  blockId: z.string().min(1).max(100),
  submissionKey: z.string().regex(/^[A-Za-z0-9_-]{16,100}$/).optional(),
  consent: z.boolean().optional(),
  fields: z.record(z.string().regex(/^[A-Za-z0-9_-]{1,64}$/), z.string().trim().max(2000)).refine(value => Object.keys(value).length <= 20)
});

export type FormSubmissionInput = z.infer<typeof formSubmissionSchema>;
