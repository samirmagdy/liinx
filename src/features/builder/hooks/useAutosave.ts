import { useState, useEffect, useRef, type MutableRefObject, type Dispatch, type SetStateAction } from 'react';
import { type CreatorProfile, type ProfileBlock } from '../../../types';
import { api } from '../../../services/api';
import { SaveQueue } from '../../../utils/saveQueue';

interface UseAutosaveProps {
  profileRef: MutableRefObject<CreatorProfile>;
  setProfile: Dispatch<SetStateAction<CreatorProfile>>;
}

export function useAutosave({ profileRef, setProfile }: UseAutosaveProps) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [saveErrorBanner, setSaveErrorBanner] = useState<string | null>(null);

  const queueRef = useRef<SaveQueue | null>(null);

  if (!queueRef.current) {
    queueRef.current = new SaveQueue(
      async (key, patch) => {
        if (key === 'profile') {
          const result = await api.studio.updateProfile(patch);
          if (result.revision !== undefined) {
            profileRef.current = { ...profileRef.current, revision: result.revision };
            setProfile(previous => ({ ...previous, revision: result.revision }));
          }
          return result;
        }
        const result = await api.studio.updateBlock(key, patch);
        if (result.revision !== undefined) {
          profileRef.current = {
            ...profileRef.current,
            blocks: profileRef.current.blocks.map(block =>
              block.id === key ? { ...block, revision: result.revision } : block
            )
          };
          setProfile(previous => ({
            ...previous,
            blocks: previous.blocks.map(block =>
              block.id === key ? { ...block, revision: result.revision } : block
            )
          }));
        }
        return result;
      },
      state => {
        setSaveStatus(state);
        setSaveErrorBanner(state === 'error' ? 'Changes are not saved. Check your connection and retry.' : null);
      }
    );
  }

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (queueRef.current?.dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);

    const navigate = async (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest('a');
      if (!anchor || anchor.target === '_blank' || !queueRef.current?.dirty) return;
      event.preventDefault();
      event.stopPropagation();
      if (await queueRef.current.flush()) {
        window.location.assign(anchor.href);
      }
    };
    document.addEventListener('click', navigate, true);

    return () => {
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('click', navigate, true);
      queueRef.current?.dispose();
    };
  }, []);

  const triggerAutoSave = (updated: Partial<CreatorProfile>) => {
    const allowedKeys = new Set([
      'displayName', 'bio', 'avatarUrl', 'category', 'themeId',
      'hideBranding', 'gaMeasurementId', 'metaPixelId', 'customDomain',
      'customCss', 'customFontUrl', 'customTheme', 'socials'
    ]);
    const patch = Object.fromEntries(
      Object.entries(updated).filter(([k, v]) => allowedKeys.has(k) && v !== undefined)
    );
    if (Object.keys(patch).length > 0) {
      queueRef.current!.enqueue('profile', { ...patch, revision: profileRef.current.revision });
    }
  };

  const enqueueBlockSave = (blockId: string, patch: Partial<ProfileBlock> | Record<string, any>) => {
    const targetBlock = profileRef.current.blocks.find(b => b.id === blockId);
    queueRef.current!.enqueue(blockId, { ...patch, revision: targetBlock?.revision });
  };

  const handleRetryFailedSaves = () => queueRef.current!.flush();

  const flushQueue = async () => {
    if (queueRef.current?.dirty) {
      return await queueRef.current.flush();
    }
    return true;
  };

  return {
    saveStatus,
    setSaveStatus,
    saveErrorBanner,
    setSaveErrorBanner,
    queueRef,
    triggerAutoSave,
    enqueueBlockSave,
    handleRetryFailedSaves,
    flushQueue
  };
}
