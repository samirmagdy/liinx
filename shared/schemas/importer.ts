import { z } from 'zod';
import { isHttpUrl } from '../contracts/urlValidation.js';

export const importerPreviewSchema = z.object({
  url: z.string().min(1, 'Profile URL is required').max(2048).refine(value => {
    const normalized = value.trim();
    return /^(?:https?):\/\/[^\s]+$/i.test(normalized) || /^(?:@?[a-z0-9._-]+)$|^(?:www\.)?(?:linktr\.ee|beacons\.ai|bio\.fm)\/[a-z0-9._-]+$/i.test(normalized);
  }, 'Only public Linktree, Beacons, or Bio.fm profile URLs are supported.')
});

export const importerCommitSchema = z.object({
  pageId: z.string().min(1).max(100).optional(),
  links: z.array(z.object({
    title: z.string().min(1).max(150),
    url: z.string().refine(isHttpUrl, 'Only HTTP(S) links are allowed.'),
    subtitle: z.string().max(250).optional()
  })).max(100),
  updateProfileInfo: z.boolean().optional(),
  displayName: z.string().max(120).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().refine(isHttpUrl, 'Only HTTP(S) avatar URLs are allowed.').optional()
});

export type ImporterPreviewInput = z.infer<typeof importerPreviewSchema>;
export type ImporterCommitInput = z.infer<typeof importerCommitSchema>;
