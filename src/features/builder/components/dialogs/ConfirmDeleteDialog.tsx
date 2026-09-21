import React from 'react';
import { Modal } from '../../../../components/Modal';

interface ConfirmDeleteDialogProps {
  open: boolean;
  label: string;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  label,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}) => (
  <Modal open={open} onClose={onCancel} label={label}>
    <div className="space-y-4 bg-white p-6 text-neutral-900">
      <div>
        <h2 className="text-base font-bold">{title}</h2>
        <p className="mt-2 text-sm text-neutral-600">{description}</p>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
);
