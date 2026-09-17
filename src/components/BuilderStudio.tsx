import React from 'react';
import { AlertCircle } from 'lucide-react';
import { CreatorProfile, ThemeConfig } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LoadingScreen } from './LoadingScreen';
import { BuilderProvider, useBuilder } from '../features/builder/context/BuilderContext';
import { BuilderShell } from '../features/builder/components/BuilderShell';
import { BuilderStudioProps } from '../features/builder/types/builder.types';

export type { BuilderStudioProps };

const BuilderStudioContent: React.FC = () => {
  const { tr } = useLanguage();
  const { loadState } = useBuilder();

  if (loadState !== 'ready') {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-neutral-50 flex flex-col items-center justify-center p-6 text-center" role="status">
        {loadState === 'loading' ? (
          <LoadingScreen message={tr('Loading your profile…')} submessage="Preparing your creative studio" fullscreen={false} />
        ) : (
          <div className="max-w-md bg-neutral-50 p-8 rounded-3xl border border-neutral-200 shadow-sm flex flex-col items-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-4 text-rose-600">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">
              {tr('Could not load your profile')}
            </h2>
            <p className="text-xs text-neutral-500 mb-6 max-w-sm text-pretty">
              {tr('Could not load your profile. No demo data is being shown.')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            >
              {tr('Retry')}
            </button>
          </div>
        )}
      </div>
    );
  }

  return <BuilderShell />;
};

export const BuilderStudio: React.FC<BuilderStudioProps> = ({
  initialProfile,
  onViewFullscreen
}) => {
  return (
    <BuilderProvider initialProfile={initialProfile} onViewFullscreen={onViewFullscreen}>
      <BuilderStudioContent />
    </BuilderProvider>
  );
};
