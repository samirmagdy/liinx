import React from 'react';
import { ArrowLeft, Briefcase, Camera, Code, Heart, Loader2, Music, Sparkles } from 'lucide-react';
import { type SignupIntent } from '../../../../shared/index.js';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { StarterSiteChoices } from './StarterSiteChoices';
import { type SignupFlow } from '../hooks/useSignupFlow';

const INTENT_OPTIONS: { id: SignupIntent; label: string; icon: typeof Sparkles }[] = [
  { id: 'creator', label: 'Creator / Influencer', icon: Sparkles },
  { id: 'photographer', label: 'Photographer / Visual Artist', icon: Camera },
  { id: 'musician', label: 'Musician / Producer / DJ', icon: Music },
  { id: 'developer', label: 'Developer / Designer / Studio', icon: Code },
  { id: 'coach', label: 'Coach / Consultant / Wellness', icon: Heart },
  { id: 'business', label: 'Small Business / Brand', icon: Briefcase }
];

export const SignupStarterSiteStep: React.FC<{ flow: SignupFlow }> = ({ flow }) => {
  const { tr: ui } = useUiLanguage();
  const {
    selectedIntent,
    selectedTemplateId,
    setSelectedTemplateId,
    starterSites,
    starterSiteNames,
    isHydrated,
    isSubmitting,
    handleIntentSelect,
    handleFinalSubmit,
    setStep
  } = flow;

  return (
    <form className="space-y-5" onSubmit={handleFinalSubmit}>
      <div>
        <span className="block text-xs font-bold text-neutral-700 mb-2">
          {ui("What are you building?")}</span>
        <div className="grid grid-cols-2 gap-2">
          {INTENT_OPTIONS.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedIntent === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleIntentSelect(item.id)}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-neutral-900 ring-1 ring-neutral-900 text-neutral-950'
                    : 'bg-white/60 border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-neutral-600'}`} />
                <span className="text-xs font-semibold leading-tight">{ui(item.label)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="block text-xs font-bold text-neutral-700 mb-2">
          {ui("Choose a starter site")}</span>
        <StarterSiteChoices
          templates={starterSites}
          names={starterSiteNames}
          selectedId={selectedTemplateId}
          onSelect={setSelectedTemplateId}
          isHydrated={isHydrated}
        />
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="px-3.5 py-3 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            title={ui("Back to account details")}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3.5 px-4 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{ui("Creating your Studio...")}</span>
              </>
            ) : (
              <>
                <span>{ui("Launch My Page")}</span>
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
