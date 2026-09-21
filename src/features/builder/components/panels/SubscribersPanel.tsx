import React from 'react';
import { Download, Trash2 } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';

export const SubscribersPanel: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    subscribers,
    subscribersLoading,
    subscribersError,
    handleExportCsv,
    handleDeleteSubscriber
  } = useBuilder();

  return (
    <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-sm text-neutral-900">{ui("Newsletter Email Subscribers")}</h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            {ui("Real subscribers collected directly from your page's newsletter blocks.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-black text-white text-xs font-mono font-bold rounded-xl">
            {subscribers.length} {ui("total")}
          </span>
          <button
            onClick={handleExportCsv}
            disabled={subscribers.length === 0}
            className="px-3 py-1 rounded-xl border border-neutral-300 hover:border-black text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
            title={ui("Download CSV")}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{ui("Export CSV")}</span>
          </button>
        </div>
      </div>

      {subscribersLoading ? (
        <div className="py-8 text-center text-xs text-neutral-600" role="status">
          {ui('Loading subscribers...')}
        </div>
      ) : subscribersError ? (
        <div className="py-4 text-center text-xs text-rose-600" role="alert">
          {subscribersError}
        </div>
      ) : subscribers.length === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-600 border border-dashed rounded-xl">
          {ui("No subscribers collected yet. Add a Newsletter block to your page to start capturing leads!")}
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
          {subscribers.map(sub => (
            <div key={sub.id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-neutral-50">
              <span className="font-semibold text-neutral-800 break-all">{sub.email}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-neutral-600 text-xs">{sub.subscribedAt}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteSubscriber(sub.id)}
                  aria-label={ui('Remove subscriber')}
                  title={ui('Remove subscriber')}
                  className="p-1.5 min-h-0 rounded-lg text-neutral-600 hover:text-rose-600 hover:bg-rose-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
