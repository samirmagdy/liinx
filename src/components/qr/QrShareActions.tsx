import React from 'react';
import { Download, Copy, Check } from 'lucide-react';

interface QrShareActionsProps {
  copied: boolean;
  downloading: boolean;
  labels: {
    copy: string;
    copied: string;
    download: string;
    downloading: string;
  };
  onCopy: () => void;
  onDownload: () => void;
}

export const QrShareActions: React.FC<QrShareActionsProps> = ({
  copied,
  downloading,
  labels,
  onCopy,
  onDownload
}) => (
  <div className="grid grid-cols-2 gap-2.5">
    <button
      onClick={onCopy}
      className="py-2.5 px-3 rounded-xl bg-neutral-50 border border-neutral-300 hover:border-neutral-900 text-xs font-semibold text-neutral-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{labels.copied}</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>{labels.copy}</span>
        </>
      )}
    </button>

    <button
      onClick={onDownload}
      disabled={downloading}
      className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <Download className="w-4 h-4" />
      <span>{downloading ? labels.downloading : labels.download}</span>
    </button>
  </div>
);
