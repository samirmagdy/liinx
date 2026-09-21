import React from 'react';
import { Clock } from 'lucide-react';
import { type LinkBlock } from '../../../../../types';
import { useLanguage as useUiLanguage } from '../../../../../context/LanguageContext';
import { useBuilder } from '../../../context/BuilderContext';
import {
  toDateTimeLocal,
  fromDateTimeLocal,
  getScheduleStatus
} from '../../../utils/builder.utils';

interface LinkScheduleFieldsProps {
  block: LinkBlock;
}

export const LinkScheduleFields: React.FC<LinkScheduleFieldsProps> = ({ block }) => {
  const { tr: ui, lang } = useUiLanguage();
  const { profile, handleUpdateBlockField } = useBuilder();
  const scheduleStatus = getScheduleStatus(block.startAt, block.endAt, ui, lang);
  const isScheduled = profile.plan !== 'free';

  return (
    <div className="pt-2 border-t border-neutral-100 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-600 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-neutral-500" />
          <span>{ui("Link Scheduling & Time-Release")}</span>
        </span>
        {!isScheduled ? (
          <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
            {ui("PRO FEATURE")}
          </span>
        ) : (
          scheduleStatus && (
            <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${scheduleStatus.color}`}>
              {scheduleStatus.label}
            </span>
          )
        )}
      </div>

      {isScheduled ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-neutral-600 block mb-1">{ui("Publish (Start Date/Time):")}</span>
              <input
                id={`block-start-date-${block.id}`}
                name="blockStartDate"
                type="datetime-local"
                value={toDateTimeLocal(block.startAt)}
                onChange={(e) => handleUpdateBlockField(block.id, 'startAt', fromDateTimeLocal(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-800 focus:border-neutral-900 font-mono text-xs"
              />
            </div>
            <div>
              <span className="text-neutral-600 block mb-1">{ui("Unpublish (End Date/Time):")}</span>
              <input
                id={`block-end-date-${block.id}`}
                name="blockEndDate"
                type="datetime-local"
                value={toDateTimeLocal(block.endAt)}
                onChange={(e) => handleUpdateBlockField(block.id, 'endAt', fromDateTimeLocal(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-800 focus:border-neutral-900 font-mono text-xs"
              />
            </div>
          </div>
          <p className="text-xs leading-relaxed text-neutral-600 sm:col-span-2">
            {ui("Schedule times use this browser timezone and are saved as UTC instants. The block is available from its start until (but not including) its end time.")}
          </p>
        </>
      ) : (
        <p className="text-xs text-neutral-600">
          {ui("Upgrade to Pro to automatically schedule links to go live and expire at specific dates and times.")}
        </p>
      )}
    </div>
  );
};
