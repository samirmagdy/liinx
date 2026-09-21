import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AccountMessage } from './accountPanelTypes';

export function PanelFeedback({ message }: { message: AccountMessage }) {
  if (!message) return null;
  return (
    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
      {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      <span>{message.text}</span>
    </div>
  );
}

export function PanelLoading({ children }: { children: ReactNode }) {
  return <div className="py-6 text-center text-xs text-neutral-600 font-mono">{children}</div>;
}
