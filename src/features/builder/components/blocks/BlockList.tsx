import React from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { BlockEditorItem } from './BlockEditorItem';

export const BlockList: React.FC = () => {
  const { visibleBlocks } = useBuilder();

  return (
    <div className="space-y-3">
      {visibleBlocks.map((block, index) => (
        <BlockEditorItem key={block.id} block={block} index={index} />
      ))}
    </div>
  );
};
