import React from 'react';

interface ApiKeyFormProps {
  keyName: string;
  error: string;
  generating: boolean;
  labels: {
    nameLabel: string;
    namePlaceholder: string;
    nameHelp: string;
    cancel: string;
    generate: string;
    generating: string;
  };
  onKeyNameChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

export const ApiKeyForm: React.FC<ApiKeyFormProps> = ({
  keyName,
  error,
  generating,
  labels,
  onKeyNameChange,
  onCancel,
  onSubmit
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {error && (
      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
        {error}
      </div>
    )}

    <div className="space-y-1.5">
      <label htmlFor="new-api-key-name" className="text-xs font-semibold text-neutral-800">{labels.nameLabel}</label>
      <input
        id="new-api-key-name"
        name="newKeyName"
        aria-label={labels.nameLabel}
        type="text"
        required
        value={keyName}
        onChange={e => onKeyNameChange(e.target.value)}
        placeholder={labels.namePlaceholder}
        className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-neutral-50 focus:border-neutral-900 outline-none"
      />
      <p className="text-xs text-neutral-600">
        {labels.nameHelp}
      </p>
    </div>

    <div className="pt-2 flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 cursor-pointer"
      >
        {labels.cancel}
      </button>
      <button
        type="submit"
        disabled={generating || !keyName.trim()}
        className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
      >
        {generating ? labels.generating : labels.generate}
      </button>
    </div>
  </form>
);
