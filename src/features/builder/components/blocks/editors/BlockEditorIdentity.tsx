import React from 'react';
import { ChevronDown, ChevronRight, MousePointerClick } from 'lucide-react';
import { type LinkBlock, type ProfileBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { getScheduleStatus } from '../../../utils/builder.utils';

interface BlockEditorIdentityProps {
  block: ProfileBlock;
  isExpanded: boolean;
  onToggleExpand?: () => void;
}

export const BlockEditorIdentity: React.FC<BlockEditorIdentityProps> = ({
  block,
  isExpanded,
  onToggleExpand
}) => {
  const { tr: ui, lang } = useUiLanguage();
  const scheduleStatus = getScheduleStatus(
    (block as LinkBlock).startAt,
    (block as LinkBlock).endAt,
    ui,
    lang
  );

  return (
    <div className="flex items-center gap-2 min-w-0">
      {onToggleExpand && (
        <button type="button" onClick={onToggleExpand} aria-label={isExpanded ? ui("Collapse block") : ui("Expand block")} className="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-lg text-neutral-600 hover:text-black">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      )}
      <span className="text-[11px] font-mono font-bold uppercase tracking-caps px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
        {block.type}
      </span>
      <span className="text-xs font-bold text-neutral-900 truncate">
        {block.title || 'Untitled Block'}
      </span>
      {(block as LinkBlock).clicks !== undefined && (
        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-800">
          <MousePointerClick className="w-3 h-3" />
          <span>{(block as LinkBlock).clicks} {ui("clicks")}</span>
        </span>
      )}
      {scheduleStatus && (
        <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${scheduleStatus.color}`}>
          {scheduleStatus.label}
        </span>
      )}
      {block.visible === false && (
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-caps text-amber-800">
          {ui('Hidden')}
        </span>
      )}
    </div>
  );
};
