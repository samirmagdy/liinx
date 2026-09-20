import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal } from './Modal';

type ToastKind = 'success' | 'error';
type Toast = { id: number; message: string; kind: ToastKind };
type ConfirmOptions = { title?: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean };
type FeedbackContextValue = {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
  notify: (message: string, kind?: ToastKind) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function ProductFeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmation, setConfirmation] = useState<{ message: string; options: ConfirmOptions } | null>(null);
  const resolveConfirmation = useRef<((accepted: boolean) => void) | null>(null);

  const confirm = useCallback((message: string, options: ConfirmOptions = {}) => new Promise<boolean>(resolve => {
    resolveConfirmation.current = resolve;
    setConfirmation({ message, options });
  }), []);

  const finishConfirmation = (accepted: boolean) => {
    resolveConfirmation.current?.(accepted);
    resolveConfirmation.current = null;
    setConfirmation(null);
  };

  const notify = useCallback((message: string, kind: ToastKind = 'error') => {
    const id = Date.now() + Math.random();
    setToasts(current => [...current, { id, message, kind }]);
    window.setTimeout(() => setToasts(current => current.filter(toast => toast.id !== id)), 5000);
  }, []);

  const value = useMemo(() => ({ confirm, notify }), [confirm, notify]);
  const options = confirmation?.options;

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="fixed top-4 end-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} role={toast.kind === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${toast.kind === 'error' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
            {toast.message}
          </div>
        ))}
      </div>
      <Modal open={Boolean(confirmation)} onClose={() => finishConfirmation(false)} label={options?.title || 'Confirm action'}>
        <div className="space-y-5 p-6 text-start">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-neutral-900">{options?.title || 'Confirm action'}</h2>
            <p className="text-sm leading-relaxed text-neutral-600">{confirmation?.message}</p>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => finishConfirmation(false)} className="min-h-10 rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
              {options?.cancelLabel || 'Cancel'}
            </button>
            <button type="button" onClick={() => finishConfirmation(true)} className={`min-h-10 rounded-xl px-4 text-sm font-semibold text-white ${options?.destructive ? 'bg-rose-700 hover:bg-rose-800' : 'bg-neutral-900 hover:bg-black'}`}>
              {options?.confirmLabel || 'Continue'}
            </button>
          </div>
        </div>
      </Modal>
    </FeedbackContext.Provider>
  );
}

export function useProductFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useProductFeedback must be used within ProductFeedbackProvider');
  return context;
}
