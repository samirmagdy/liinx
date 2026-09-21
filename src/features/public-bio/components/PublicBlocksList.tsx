import React from 'react';
import { type ProfileBlock, type ThemeConfig } from '../../../types';
import { getBorderColor } from '../../../utils/colorContrast';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { PublicBlockRenderer } from './PublicBlockRenderer';
import type { BlockPlayback } from '../hooks/useBlockPlayback';

interface PublicBlocksListProps {
  blocks: ProfileBlock[];
  profileId: string;
  theme: ThemeConfig;
  previewOnly: boolean;
  normalizedQuery: string;
  hasGridLink: boolean;
  playback: BlockPlayback;
}

export const PublicBlocksList: React.FC<PublicBlocksListProps> = ({
  blocks,
  profileId,
  theme,
  previewOnly,
  normalizedQuery,
  hasGridLink,
  playback
}) => {
  const { tr: ui } = useUiLanguage();

  return (
    <div
      className={`mb-14 ${
        hasGridLink
          ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 [&>*]:sm:col-span-2 [&>.raloa-grid-link]:sm:col-span-1'
          : 'space-y-4'
      }`}
    >
      {normalizedQuery && blocks.length === 0 ? (
        <p
          role="status"
          className="rounded-xl border px-4 py-5 text-center text-sm"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: getBorderColor(theme.cardBorder, 'rgba(0,0,0,.15)'),
            color: theme.subtextColor
          }}
        >
          {ui('No matching content on this page.')}
        </p>
      ) : (
        blocks.map((block, blockIndex) => (
          <PublicBlockRenderer
            key={block.id}
            block={block}
            profileId={profileId}
            theme={theme}
            previewOnly={previewOnly}
            blockIndex={blockIndex}
            blockCount={blocks.length}
            playingAudioId={playback.playingAudioId}
            setPlayingAudioId={playback.setPlayingAudioId}
            activeEmbeddedAudioId={playback.activeEmbeddedAudioId}
            setActiveEmbeddedAudioId={playback.setActiveEmbeddedAudioId}
            activeVideoId={playback.activeVideoId}
            setActiveVideoId={playback.setActiveVideoId}
            openFolders={playback.openFolders}
            onToggleFolder={playback.toggleFolder}
          />
        ))
      )}
    </div>
  );
};
