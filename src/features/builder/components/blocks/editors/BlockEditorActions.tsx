import React from 'react';
import { ArrowUp, ArrowDown, Eye, EyeOff, Copy, Trash2 } from 'lucide-react';
import { type ProfileBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';

interface BlockEditorActionsProps {
  block: ProfileBlock;
  index: number;
}

export const BlockEditorActions: React.FC<BlockEditorActionsProps> = ({ block, index }) => {
  const { tr: ui } = useUiLanguage();
  const {
    pages,
    activePage,
    visibleBlocks,
    confirmDeleteBlockId,
    setConfirmDeleteBlockId,
    handleMoveBlock,
    handleMoveBlockToPage,
    handleDuplicateBlock,
    handleDeleteBlock,
    handleUpdateBlockField
  } = useBuilder();

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => handleUpdateBlockField(block.id, 'visible', block.visible === false)}
        aria-label={ui(block.visible === false ? 'Show block' : 'Hide block')}
        title={ui(block.visible === false ? 'Show block' : 'Hide block')}
        className={"grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-lg transition-colors " + (block.visible === false ? "text-amber-600 hover:text-amber-800" : "text-neutral-600 hover:text-black")}
      >
        {block.visible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
      <button
        type="button"
        onClick={() => handleMoveBlock(index, 'up')}
        disabled={index === 0}
        aria-label={ui('Move block up')}
        className="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-lg text-neutral-600 hover:text-black disabled:opacity-20"
        title={ui("Move up")}
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => handleMoveBlock(index, 'down')}
        disabled={index === visibleBlocks.length - 1}
        aria-label={ui('Move block down')}
        className="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-lg text-neutral-600 hover:text-black disabled:opacity-20"
        title={ui("Move down")}
      >
        <ArrowDown className="w-3.5 h-3.5" />
      </button>
      <select
        id={`move-block-page-${block.id}`}
        name="blockPageId"
        aria-label={ui('Move block to page')}
        value={(block as any).pageId || activePage?.id || ''}
        onChange={event => void handleMoveBlockToPage(block.id, event.target.value)}
        className="max-w-28 rounded-lg border border-neutral-200 bg-white px-1 py-1 text-xs text-neutral-700"
      >
        {pages.map(page => <option key={page.id} value={page.id}>{page.title}</option>)}
      </select>
      <button
        type="button"
        onClick={() => void handleDuplicateBlock(block.id)}
        aria-label={ui('Duplicate block')}
        title={ui('Duplicate block')}
        className="grid min-h-11 min-w-11 place-items-center rounded-lg text-neutral-600 hover:text-black"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
      {confirmDeleteBlockId === block.id ? (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              handleDeleteBlock(block.id);
              setConfirmDeleteBlockId(null);
            }}
            className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-700 text-white hover:bg-rose-800 transition-colors cursor-pointer"
          >
            {ui("Confirm")}
          </button>
          <button
            onClick={() => setConfirmDeleteBlockId(null)}
            className="px-2 py-0.5 rounded text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
          >
            {ui("Cancel")}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDeleteBlockId(block.id)}
          className="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-lg text-rose-500 hover:text-rose-700"
          title={ui("Delete block")}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
