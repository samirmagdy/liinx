import React from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { StarterSiteDialog } from './StarterSiteDialog';

/** Pulls the arriving `?template=` hand-off out of the builder context for the dialog. */
export const StarterSiteDialogHost: React.FC = () => {
  const { profile, starterSite, starterSiteError, applyingStarterSite, applyStarterSite, dismissStarterSite } = useBuilder();
  if (!starterSite) return null;
  return (
    <StarterSiteDialog
      starterSite={starterSite}
      profile={profile}
      error={starterSiteError}
      busy={applyingStarterSite}
      onApply={mode => void applyStarterSite(mode)}
      onDismiss={dismissStarterSite}
    />
  );
};
