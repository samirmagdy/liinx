/**
 * Setup progress is never stored as a number: it is derived from the rows that exist. These ids are
 * the contract between that derivation and the checklist that renders it, so a step cannot be added
 * to one side and forgotten on the other.
 */
export const SETUP_STEPS = ['photo', 'block', 'social', 'bio', 'preview', 'published'] as const;

export type SetupStepId = (typeof SETUP_STEPS)[number];

export interface SetupProgress {
  steps: Record<SetupStepId, boolean>;
  done: number;
  total: number;
  complete: boolean;
  /** When the creator hid the checklist. Null until they do, and stored on the account, not the device. */
  dismissedAt: number | null;
  /** Milestones that happened but have not been acknowledged yet. Empty means there is nothing to report. */
  milestones: SetupMilestone[];
}

/** The first real thing a stranger did on the page, taken from the same rows the analytics tab reads. */
export const MILESTONE_IDS = ['first_view', 'first_click', 'first_subscriber'] as const;

export type MilestoneId = (typeof MILESTONE_IDS)[number];

export interface SetupMilestone {
  id: MilestoneId;
  /** The stored row that triggered it, so the acknowledgement can be pinned to a real event. */
  eventId: string;
}
