import React from 'react';
import { BlockItem } from '../../../../types';

interface SpacerBlockViewProps {
  block: BlockItem;
  blockIndex?: number;
  blockCount?: number;
}

export const SpacerBlockView: React.FC<SpacerBlockViewProps> = ({
  block,
  blockIndex = 0,
  blockCount = 1
}) => {
  const extra = (block as any).extra || block;
  const height = Math.min(240, Math.max(16, Number(extra.height) || 48));

  return (
    <div
      key={block.id}
      aria-hidden="true"
      data-spacing-height={height}
      className="pointer-events-none min-w-0 shrink-0"
      style={{
        height,
        marginTop: blockIndex > 0 ? '-1rem' : undefined,
        marginBottom: blockIndex < blockCount - 1 ? '-1rem' : undefined
      }}
    />
  );
};
