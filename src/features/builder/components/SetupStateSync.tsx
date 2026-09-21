import { useEffect, useRef, type FC } from 'react';
import { useBuilder } from '../context/BuilderContext';
import { api } from '../../../services/api';

/**
 * Setup progress is derived on the server, so an edit that finishes a step has to be read back
 * rather than guessed at here. The read is debounced to the end of a burst of typing and replaces
 * only the derived part of the profile, never anything the creator is still editing.
 */
export const SetupStateSync: FC = () => {
  const { profile, setProfile } = useBuilder();
  const shownBlocks = profile.blocks.filter(block => (block as { visible?: boolean }).visible !== false).length;
  const signature = [profile.id, profile.revision, profile.bio, profile.avatarUrl, profile.socials.length, profile.blocks.length, shownBlocks, (profile.pages || []).length].join('|');
  const synced = useRef<string | null>(null);

  useEffect(() => {
    if (!profile.id || synced.current === signature) return;
    const timer = setTimeout(async () => {
      try {
        const fresh = await api.studio.getProfile();
        if (!fresh.setup) return;
        synced.current = signature;
        setProfile(previous => ({ ...previous, setup: fresh.setup }));
      } catch {
        // A failed read leaves the last known progress on screen; the next edit tries again.
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [signature, profile.id, setProfile]);

  return null;
};
