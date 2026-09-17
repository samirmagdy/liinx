import React from 'react';
import { type BlockItem } from '../../../../types';

interface HeaderBlockViewProps {
  block: BlockItem;
}

export const HeaderBlockView: React.FC<HeaderBlockViewProps> = ({ block }) => {
  return (
    <div className="pt-6 pb-2 text-center" dir="auto">
      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest" dir="auto">
        {block.title}
      </h3>
    </div>
  );
};
