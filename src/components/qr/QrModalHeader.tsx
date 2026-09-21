import React from 'react';
import { QrCode } from 'lucide-react';

interface QrModalHeaderProps {
  title: string;
  shareLabel: string;
  privacyNote: string;
}

export const QrModalHeader: React.FC<QrModalHeaderProps> = ({ title, shareLabel, privacyNote }) => (
  <div className="text-center mb-6">
    <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mx-auto mb-2.5 shadow-sm">
      <QrCode className="w-5 h-5 text-amber-400" />
    </div>
    <h3 className="font-brand font-bold text-lg text-neutral-900">
      {title}</h3>
    <p className="text-xs text-neutral-500 mt-0.5">
      {shareLabel}</p>
    <p className="text-xs leading-relaxed text-neutral-500 mt-2">
      {privacyNote}
    </p>
  </div>
);
