import React, { useEffect, useRef } from 'react';

export function Modal({ open, onClose, label, children, wide = false }: { open: boolean; onClose: () => void; label: string; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    ref.current?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { ref.current?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, [open]);
  return <dialog ref={ref} aria-label={label} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }} className={`m-auto max-h-[92svh] w-[calc(100%-2rem)] ${wide ? 'max-w-lg' : 'max-w-sm'} overflow-y-auto rounded-3xl p-0 backdrop:bg-black/60`}>
    {open && children}
  </dialog>;
}
