import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ImporterError: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
    <AlertCircle className="w-4 h-4 shrink-0" />
    <span>{message}</span>
  </div>
);
