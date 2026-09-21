import React from 'react';
import { type ProfileBlock } from '../../../../../types';
import { BlockEditorIdentity } from './BlockEditorIdentity';
import { BlockEditorActions } from './BlockEditorActions';

interface BlockEditorHeaderProps {
  block: ProfileBlock;
  index: number;
  isExpanded: boolean;
  onToggleExpand?: () => void;
}

export const BlockEditorHeader: React.FC<BlockEditorHeaderProps> = ({
  block,
  index,
  isExpanded,
  onToggleExpand
}) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <BlockEditorIdentity block={block} isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
      <BlockEditorActions block={block} index={index} />
    </div>
  );
};
