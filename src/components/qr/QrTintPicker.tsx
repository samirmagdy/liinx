import React from 'react';

const QR_TINTS = [
  { hex: '#0F172A', name: 'Navy ink' },
  { hex: '#B45309', name: 'Amber' },
  { hex: '#2563EB', name: 'Blue' },
  { hex: '#7C3AED', name: 'Violet' },
  { hex: '#047857', name: 'Emerald' },
];

interface QrTintPickerProps {
  value: string;
  label: string;
  onChange: (hex: string) => void;
}

export const QrTintPicker: React.FC<QrTintPickerProps> = ({ value, label, onChange }) => (
  <div className="flex items-center justify-between px-2 mb-6">
    <span className="text-xs font-medium text-neutral-600">{label}</span>
    <div className="flex items-center gap-0.5">
      {QR_TINTS.map(({ hex, name }) => (
        <button
          type="button"
          key={hex}
          onClick={() => onChange(hex)}
          aria-pressed={value === hex}
          title={name}
          aria-label={name}
          className={`grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-transform ${
            value === hex ? 'scale-100' : 'opacity-70 hover:opacity-100'
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-8 w-8 rounded-full border border-neutral-300 ${
              value === hex ? 'ring-2 ring-neutral-900 ring-offset-1' : ''
            }`}
            style={{ backgroundColor: hex }}
          />
        </button>
      ))}
    </div>
  </div>
);
