import { useState } from 'react';
import type { ProfileBlock } from '../../../types';

export interface BlockPlayback {
  playingAudioId: string | null;
  setPlayingAudioId: (id: string | null) => void;
  activeEmbeddedAudioId: string | null;
  setActiveEmbeddedAudioId: (id: string | null) => void;
  activeVideoId: string | null;
  setActiveVideoId: (id: string | null) => void;
  openFolders: Record<string, boolean>;
  toggleFolder: (folderId: string) => void;
  activePlayingBlock: ProfileBlock | null;
}

export function useBlockPlayback(availableBlocks: ProfileBlock[]): BlockPlayback {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [activeEmbeddedAudioId, setActiveEmbeddedAudioId] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ b3: true });

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const activePlayingBlock = playingAudioId
    ? availableBlocks.find(b => b.id === playingAudioId && b.type === 'audio') ?? null
    : null;

  return {
    playingAudioId,
    setPlayingAudioId,
    activeEmbeddedAudioId,
    setActiveEmbeddedAudioId,
    activeVideoId,
    setActiveVideoId,
    openFolders,
    toggleFolder,
    activePlayingBlock
  };
}
