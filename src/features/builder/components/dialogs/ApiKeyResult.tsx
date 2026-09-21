import React from 'react';
import { AlertCircle, Check, Copy } from 'lucide-react';

interface ApiKeyResultProps {
  apiKey: string;
  copied: boolean;
  labels: {
    notice: string;
    noticeDetail: string;
    keyLabel: string;
    copy: string;
    copied: string;
    done: string;
  };
  onCopy: (apiKey: string) => void;
  onDone: () => void;
}

export const ApiKeyResult: React.FC<ApiKeyResultProps> = ({ apiKey, copied, labels, onCopy, onDone }) => (
  <div className="space-y-4">
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
      <span>
        <strong>{labels.notice}</strong> {labels.noticeDetail}
      </span>
    </div>

    <div className="space-y-1.5">
      <label htmlFor="created-live-api-key" className="text-xs font-semibold text-neutral-800">{labels.keyLabel}</label>
      <div className="flex items-center gap-2">
        <input
          id="created-live-api-key"
          name="createdApiKey"
          aria-label={labels.keyLabel}
          type="text"
          readOnly
          value={apiKey}
          className="w-full text-xs font-mono p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 select-all outline-none"
        />
        <button
          type="button"
          onClick={() => onCopy(apiKey)}
          className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? labels.copied : labels.copy}</span>
        </button>
      </div>
    </div>

    <div className="pt-2 flex justify-end">
      <button
        type="button"
        onClick={onDone}
        className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
      >
        {labels.done}
      </button>
    </div>
  </div>
);
