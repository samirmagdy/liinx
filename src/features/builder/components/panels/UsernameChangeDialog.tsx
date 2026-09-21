import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { brand } from '../../../../config/brand';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { Modal } from '../../../../components/Modal';

interface UsernameChangeDialogProps {
  open: boolean;
  previousUsername: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const UsernameChangeDialog: React.FC<UsernameChangeDialogProps> = ({
  open,
  previousUsername,
  onCancel,
  onConfirm,
}) => {
  const { tr: ui } = useUiLanguage();
  const { profile } = useBuilder();

  return (
    <Modal
      open={open}
      onClose={onCancel}
      label={ui('Confirm handle change')}
    >
      <div className="bg-white p-6 rounded-3xl space-y-4 text-neutral-900">
        <div className="flex items-center gap-3 text-amber-600">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <h3 className="font-bold text-base">{ui('Change public handle?')}</h3>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          {ui('Changing your handle to')} <span className="font-mono font-bold text-neutral-900" dir="ltr">@{profile.username}</span> {ui('will alter your live URL to')} <span className="font-mono font-bold text-neutral-900" dir="ltr">{brand.domain}/@{profile.username}</span>. {ui('Any existing printed QR codes, physical badges, or external links pointing to')} <span className="font-mono font-bold text-neutral-900" dir="ltr">@{previousUsername}</span> {ui('will break.')}
        </p>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            {ui('Keep')} @{previousUsername}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-black text-white transition-colors cursor-pointer"
          >
            {ui('Confirm Change')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
