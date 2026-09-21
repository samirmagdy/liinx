import { type SignupIntent } from '../contracts/templates.js';

/**
 * Block types suggested for the discipline stored on the account. Two rules keep this honest:
 * every entry must be a block type the builder really has, and nothing may be suggested that needs
 * a date, a price, a file, or somebody else's quote to render — those would ask the creator to
 * publish invented content to finish the step.
 */
export const RECOMMENDED_BLOCK_TYPES: Record<SignupIntent, string[]> = {
  creator: ['link', 'folder', 'rich_text', 'newsletter'],
  photographer: ['link', 'gallery', 'image', 'newsletter'],
  musician: ['audio', 'link', 'folder', 'newsletter'],
  developer: ['link', 'rich_text', 'faq', 'form'],
  coach: ['form', 'faq', 'link', 'newsletter'],
  business: ['link', 'form', 'newsletter', 'faq']
};

/** Unknown or unstored discipline: no suggestions, rather than guesses about someone's work. */
export function recommendedBlockTypes(intent: unknown): string[] {
  if (typeof intent !== 'string') return [];
  return RECOMMENDED_BLOCK_TYPES[intent as SignupIntent] || [];
}
