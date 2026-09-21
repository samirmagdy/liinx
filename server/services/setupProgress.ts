import { db } from '../db.js';
import {
  isPlaceholderBio,
  isSeedAvatar,
  isSeedBlock,
  isSeedSocial,
  MILESTONE_IDS,
  SETUP_STEPS,
  type MilestoneId,
  type SetupMilestone,
  type SetupProgress,
  type SetupStepId
} from '../../shared/index.js';

interface SetupProfileRow {
  id: string;
  user_id?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  last_previewed_at?: number | null;
  setup_dismissed_at?: number | null;
}

interface SetupBlock {
  type?: string;
  title?: string | null;
  url?: string | null;
  visible?: unknown;
}

interface SetupPage {
  published?: unknown;
}

export interface SetupProgressSource {
  profile: SetupProfileRow;
  socials?: { url?: string | null }[];
  blocks?: SetupBlock[];
  pages?: SetupPage[];
}

const asArray = <T>(value: T[] | undefined): T[] => (Array.isArray(value) ? value : []);

/** The address written into the contact link at signup, so it is not mistaken for a linked profile. */
function ownerEmail(profile: SetupProfileRow): string | undefined {
  if (!profile.user_id) return undefined;
  return (db.prepare('SELECT email FROM users WHERE id = ?').get(profile.user_id) as { email?: string } | undefined)?.email;
}

/**
 * Which steps are complete, read off the rows that exist. Nothing here is a counter someone has to
 * increment: a step is done when the account actually contains the thing it asks for, and the
 * placeholder rows and copy every fresh account starts with do not count as the creator's own work.
 */
export function setupStepStates(source: SetupProgressSource, email?: string): Record<SetupStepId, boolean> {
  const { profile } = source;
  return {
    photo: !isSeedAvatar(profile.avatar_url),
    // A spacer is layout and a hidden block reaches nobody, so neither is a first link worth having.
    block: asArray(source.blocks).some(block => block.visible !== false && block.type !== 'spacer' && !isSeedBlock(block)),
    social: asArray(source.socials).some(social => !isSeedSocial(social, email)),
    bio: !isPlaceholderBio(profile.bio),
    preview: Boolean(profile.last_previewed_at),
    published: asArray(source.pages).some(page => Boolean(page.published))
  };
}

/** Which stored rows prove a milestone happened: the earliest one of its kind, if any exists. */
const MILESTONE_QUERIES: Record<MilestoneId, string> = {
  first_view: 'SELECT id FROM profile_views WHERE profile_id = ? ORDER BY created_at ASC LIMIT 1',
  first_click: 'SELECT id FROM link_clicks WHERE profile_id = ? ORDER BY created_at ASC LIMIT 1',
  first_subscriber: 'SELECT id FROM newsletter_subscribers WHERE profile_id = ? ORDER BY created_at ASC LIMIT 1'
};

/** Milestones that really happened and were never acknowledged. An account with no traffic gets []. */
export function pendingMilestones(profileId: string): SetupMilestone[] {
  const acknowledged = new Set(
    (db.prepare('SELECT milestone FROM setup_milestone_ack WHERE profile_id = ?').all(profileId) as { milestone: string }[])
      .map(row => row.milestone)
  );
  const pending: SetupMilestone[] = [];
  for (const id of MILESTONE_IDS) {
    if (acknowledged.has(id)) continue;
    const event = db.prepare(MILESTONE_QUERIES[id]).get(profileId) as { id: string } | undefined;
    if (event) pending.push({ id, eventId: event.id });
  }
  return pending;
}

export function buildSetupProgress(source: SetupProgressSource): SetupProgress {
  const steps = setupStepStates(source, ownerEmail(source.profile));
  const done = SETUP_STEPS.filter(id => steps[id]).length;
  return {
    steps,
    done,
    total: SETUP_STEPS.length,
    complete: done === SETUP_STEPS.length,
    dismissedAt: source.profile.setup_dismissed_at ?? null,
    milestones: pendingMilestones(source.profile.id)
  };
}
