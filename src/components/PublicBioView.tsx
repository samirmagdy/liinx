import React from 'react';
import { useLocation } from 'wouter';
import { AlertCircle } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../context/LanguageContext';
import { resolveTheme } from '../utils/colorContrast';
import { BioSkeletonLoader } from './LoadingScreen';
import { usePublicProfile } from '../features/public-bio/hooks/usePublicProfile';
import { PublicBioShell } from '../features/public-bio/components/PublicBioShell';
import { PublicBioViewProps } from '../features/public-bio/types/publicBio.types';

export { type PublicBioViewProps } from '../features/public-bio/types/publicBio.types';

export const PublicBioView: React.FC<PublicBioViewProps> = ({
  previewOnly = false,
  profile: initialProfile,
  username: routeUsername,
  pageSlug,
  customDomain,
  customTheme,
  onBackToStudio,
  onOpenQr
}) => {
  const { tr: ui } = useUiLanguage();
  const [, setLocation] = useLocation();

  const {
    profile,
    loading,
    notFound,
    serverError,
    footerLogoFailed,
    setFooterLogoFailed,
    reducedMotion
  } = usePublicProfile({
    initialProfile,
    routeUsername,
    customDomain,
    pageSlug,
    previewOnly
  });

  if (loading) {
    return <BioSkeletonLoader />;
  }

  if (serverError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-2">
          {ui('Unable to load creator page')}
        </h1>
        <p className="text-sm text-neutral-500 max-w-sm mb-6">
          {serverError}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-black transition-colors cursor-pointer"
          >
            {ui('Retry')}
          </button>
          <button
            onClick={() => setLocation('/')}
            className="px-5 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold hover:bg-neutral-100 text-neutral-900 transition-colors cursor-pointer"
          >
            {ui('Go to Homepage')}
          </button>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-neutral-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-2 text-balance">
          {ui('Creator page not found')}
        </h1>
        <p className="text-sm text-neutral-500 max-w-sm mb-6 text-pretty">
          {ui('The handle')}{' '}
          <span className="font-mono font-semibold text-neutral-900">
            @{routeUsername || 'unknown'}
          </span>{' '}
          {ui("hasn't been claimed yet or does not exist.")}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation('/')}
            className="px-5 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold hover:bg-neutral-100 text-neutral-900 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          >
            {ui('Go to Homepage')}
          </button>
          <button
            onClick={() =>
              setLocation(`/register?username=${routeUsername?.replace(/^@/, '') || ''}`)
            }
            className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-black transition-colors shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2"
          >
            {ui('Claim this handle')}
          </button>
        </div>
      </div>
    );
  }

  const theme = resolveTheme(profile.themeId, customTheme || profile.customTheme);

  return (
    <PublicBioShell
      profile={profile}
      theme={theme}
      previewOnly={previewOnly}
      customDomain={customDomain}
      onBackToStudio={onBackToStudio}
      onOpenQr={onOpenQr}
      reducedMotion={reducedMotion}
      footerLogoFailed={footerLogoFailed}
      setFooterLogoFailed={setFooterLogoFailed}
    />
  );
};
