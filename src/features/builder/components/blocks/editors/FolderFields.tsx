import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { type FolderBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';

interface FolderFieldsProps {
  block: FolderBlock;
}

const FolderItemRow: React.FC<{ blockId: string; item: FolderBlock['items'][number]; isFirst: boolean; isLast: boolean }> = ({ blockId, item, isFirst, isLast }) => {
  const { tr: ui } = useUiLanguage();
  const { handleMoveFolderItem, handleRemoveFolderItem, handleUpdateFolderItem } = useBuilder();

  return (
    <div className="flex items-center gap-2">
      <input
        id={`folder-item-title-${blockId}-${item.id}`}
        name="folderItemTitle"
        aria-label={ui('Title')}
        type="text"
        value={item.title}
        onChange={e => handleUpdateFolderItem(blockId, item.id, 'title', e.target.value)}
        placeholder={ui('Title')}
        className="w-1/3 px-2 py-1 rounded border border-neutral-200 text-xs bg-neutral-50 text-neutral-900"
      />
      <input
        id={`folder-item-url-${blockId}-${item.id}`}
        name="folderItemUrl"
        aria-label={ui('Destination URL')}
        type="text"
        value={item.url}
        onChange={e => handleUpdateFolderItem(blockId, item.id, 'url', e.target.value)}
        placeholder="https://..."
        className="flex-1 px-2 py-1 rounded border border-neutral-200 text-xs font-mono bg-neutral-50 text-neutral-900"
      />
      <button
        type="button"
        onClick={() => handleMoveFolderItem(blockId, item.id, -1)}
        disabled={isFirst}
        aria-label={ui('Move item up')}
        className="grid min-h-11 min-w-11 place-items-center rounded-lg text-neutral-600 disabled:opacity-30"
      >
        ↑
      </button>
      <button
        type="button"
        onClick={() => handleMoveFolderItem(blockId, item.id, 1)}
        disabled={isLast}
        aria-label={ui('Move item down')}
        className="grid min-h-11 min-w-11 place-items-center rounded-lg text-neutral-600 disabled:opacity-30"
      >
        ↓
      </button>
      <button
        type="button"
        onClick={() => handleRemoveFolderItem(blockId, item.id)}
        className="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-lg text-rose-600 hover:text-rose-700"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
};

export const FolderFields: React.FC<FolderFieldsProps> = ({ block }) => {
  const { tr: ui } = useUiLanguage();
  const { handleAddFolderItem, handleUpdateBlockField } = useBuilder();
  const items = block.items || [];

  return (
    <div className="space-y-2 pt-2 border-t border-neutral-100">
      <label className="block text-xs font-semibold text-neutral-500">
        {ui('Folder description')}
        <input
          id={`folder-subtitle-${block.id}`}
          name="folderSubtitle"
          value={block.subtitle || ''}
          onChange={e => handleUpdateBlockField(block.id, 'subtitle', e.target.value)}
          maxLength={250}
          placeholder={ui('Optional description')}
          className="mt-1 w-full rounded border border-neutral-200 px-2 py-1.5 text-xs text-neutral-900"
        />
      </label>
      <p className="text-xs text-neutral-500">
        {ui('Folders are collapsible one-level link groups, not subpages. Nested folders are not supported.')}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-700">{ui('Folder Links')}</span>
        <button
          type="button"
          onClick={() => handleAddFolderItem(block.id)}
          className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> {ui('Add Item')}
        </button>
      </div>
      {items.length === 0 && <p className="py-2 text-xs text-neutral-500">{ui('No folder links yet. Add one to begin.')}</p>}
      {items.map((item, itemIndex) => (
        <FolderItemRow
          key={item.id}
          blockId={block.id}
          item={item}
          isFirst={itemIndex === 0}
          isLast={itemIndex === items.length - 1}
        />
      ))}
    </div>
  );
};
