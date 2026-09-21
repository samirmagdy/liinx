import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { BlockEditorItem } from './BlockEditorItem';
import { BlockListEmptyState } from './BlockListEmptyState';

export const BlockList: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { visibleBlocks } = useBuilder();
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});
  const allCollapsed = visibleBlocks.length > 0 && visibleBlocks.every(b => collapsedBlocks[b.id] === true);

  const handleToggleExpandAll = () => {
    if (allCollapsed) {
      setCollapsedBlocks({});
    } else {
      const next: Record<string, boolean> = {};
      visibleBlocks.forEach(b => {
        next[b.id] = true;
      });
      setCollapsedBlocks(next);
    }
  };

  const handleToggleBlock = (blockId: string) => {
    setCollapsedBlocks(prev => ({
      ...prev,
      [blockId]: !prev[blockId]
    }));
  };

  return (
    <div className="space-y-3">
      {visibleBlocks.length > 1 && (
        <div className="flex items-center justify-end px-1">
          <button
            type="button"
            onClick={handleToggleExpandAll}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-neutral-100"
          >
            {allCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>{ui('Expand all')}</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>{ui('Collapse all')}</span>
              </>
            )}
          </button>
        </div>
      )}
      {visibleBlocks.length === 0 && <BlockListEmptyState />}
      {visibleBlocks.map((block, index) => (
        <BlockEditorItem
          key={block.id}
          block={block}
          index={index}
          isExpanded={!collapsedBlocks[block.id]}
          onToggleExpand={() => handleToggleBlock(block.id)}
        />
      ))}
    </div>
  );
};
