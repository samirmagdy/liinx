import React, { useState } from 'react';
import { Check, Circle, EyeOff } from 'lucide-react';
import { type SetupStepId } from '../../../../../shared/index.js';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { useLivePreview } from '../../hooks/useLivePreview';
import { api } from '../../../../services/api';
import { friendlyErrorMessage } from '../../../../utils/errors';
import { ShareActions } from '../share/ShareActions';

export const CHECKLIST_ROWS: { id: SetupStepId; label: string; target: string }[] = [
  { id: 'photo', label: 'Add your photo', target: 'builder-profile-avatar' },
  { id: 'block', label: 'Add a link or block', target: 'builder-add-block' },
  { id: 'social', label: 'Add a social profile', target: 'new-social-platform' },
  { id: 'bio', label: 'Write your bio', target: 'builder-profile-bio' },
  { id: 'preview', label: 'Preview your page', target: '' },
  { id: 'published', label: 'Publish a page', target: 'pages-heading' }
];

const scrollToTarget = (id: string) => {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ block: 'center' });
  if (typeof (element as HTMLElement).focus === 'function') element.focus({ preventScroll: true });
};

const ChecklistRow: React.FC<{
  label: string;
  done: boolean;
  onGo: () => void;
}> = ({ label, done, onGo }) => {
  const { tr: ui } = useUiLanguage();
  return (
    <li className="flex items-center gap-2">
      {done ? <Check className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" /> : <Circle className="w-4 h-4 shrink-0 text-neutral-300" aria-hidden="true" />}
      <span className={`flex-1 text-xs font-semibold ${done ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>{ui(label)}</span>
      {!done && (
        <button type="button" onClick={onGo} className="min-h-11 rounded-lg px-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          {ui('Go')}
        </button>
      )}
    </li>
  );
};

/**
 * The card only shows the steps the server says are missing, and every row moves the creator to the
 * real control that finishes it. Completion is not a claim made here: it is the absence of rows.
 */
export const SetupChecklist: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { profile, setProfile, setShowAddMenu } = useBuilder();
  const openLivePreview = useLivePreview();
  const [error, setError] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState(false);
  const setup = profile.setup;

  if (!setup || setup.dismissedAt) return null;

  const hide = async () => {
    setError(null);
    setDismissing(true);
    try {
      const res = await api.studio.dismissSetup();
      setProfile(res.profile);
    } catch (err) {
      setError(friendlyErrorMessage(err, ui('We could not hide the setup list. Please try again.')));
    } finally {
      setDismissing(false);
    }
  };

  if (setup.complete) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />
          <h2 className="text-sm font-bold text-neutral-900">{ui('Your site is ready')}</h2>
        </div>
        <ShareActions />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">{ui('Finish your page')}</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            {ui('Setup progress')} · {setup.done}/{setup.total} — {ui('Each step is something a visitor looks for.')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void hide()}
          disabled={dismissing}
          className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
          {ui('Hide')}
        </button>
      </div>

      {error && <p role="alert" className="text-xs font-medium text-rose-600">{error}</p>}

      <ul className="space-y-2">
        {CHECKLIST_ROWS.map(row => (
          <ChecklistRow
            key={row.id}
            label={row.label}
            done={setup.steps[row.id]}
            onGo={() => {
              if (row.id === 'preview') { void openLivePreview(); return; }
              if (row.id === 'block') setShowAddMenu(true);
              scrollToTarget(row.target);
            }}
          />
        ))}
      </ul>
    </section>
  );
};
