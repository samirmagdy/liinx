import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { MilestoneId } from '../../../../../shared/index.js';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { api } from '../../../../services/api';
import { friendlyErrorMessage } from '../../../../utils/errors';

/** Each line describes exactly one stored row, which is why every one of them says "someone". */
const MILESTONE_COPY: Record<MilestoneId, string> = {
  first_view: 'Someone opened your page.',
  first_click: 'Someone tapped one of your links.',
  first_subscriber: 'Someone subscribed to your list.'
};

/**
 * One milestone at a time, only when the analytics tables really have a row for it, and never again
 * once it has been acknowledged from any device.
 */
export const SetupMilestoneCard: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { profile, setProfile } = useBuilder();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [milestone] = profile.setup?.milestones || [];

  if (!milestone) return null;

  const acknowledge = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.studio.ackMilestone(milestone.id);
      setProfile(res.profile);
    } catch (err) {
      setError(friendlyErrorMessage(err, ui('We could not record that. Please try again.')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 flex items-start gap-3">
      <Sparkles className="mt-0.5 w-4 h-4 shrink-0 text-indigo-600" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-neutral-900">{ui(MILESTONE_COPY[milestone.id])}</p>
        {error && <p role="alert" className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
      </div>
      <button
        type="button"
        onClick={() => void acknowledge()}
        disabled={busy}
        className="min-h-11 shrink-0 rounded-lg px-3 text-xs font-bold text-indigo-800 hover:bg-indigo-100 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {ui('Got it')}
      </button>
    </section>
  );
};
