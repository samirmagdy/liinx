import React from 'react';
import { type ProfileBlock } from '../../../../types';
import { BlockEditorHeader } from './editors/BlockEditorHeader';
import { BlockCoreFields } from './editors/BlockCoreFields';
import { LinkFields } from './editors/LinkFields';
import { AudioFields, NewsletterFields, VideoFields } from './editors/MediaFields';
import { AdvancedFields } from './editors/AdvancedFields';
import { FolderFields } from './editors/FolderFields';

interface BlockEditorItemProps {
  block: ProfileBlock;
  index: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const BlockEditorItem: React.FC<BlockEditorItemProps> = ({ block, index, isExpanded = true, onToggleExpand }) => {
  return (
    <div id={"builder-block-" + block.id} tabIndex={-1} className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-3 hover:border-neutral-400 transition-all scroll-mt-24 focus:ring-2 focus:ring-neutral-900">
      <BlockEditorHeader
        block={block}
        index={index}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
      />

      {isExpanded && (
        <>
          <BlockCoreFields block={block} />
          {block.type === 'link' && <LinkFields block={block} />}
          {block.type === 'audio' && <AudioFields block={block} />}
          {block.type === 'video' && <VideoFields block={block} />}
          {block.type === 'newsletter' && <NewsletterFields block={block} />}
          <AdvancedFields block={block} />
          {block.type === 'folder' && <FolderFields block={block} />}
        </>
      )}
    </div>
  );
};
