import React from 'react';
import type { ImporterPreview } from './useLinkImport';

interface ImportedProfileCardProps {
  preview: ImporterPreview;
  linksFoundLabel: string;
}

export const ImportedProfileCard: React.FC<ImportedProfileCardProps> = ({ preview, linksFoundLabel }) => (
  <div className="p-3.5 rounded-2xl bg-neutral-100/60 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
    {preview.avatarUrl ? (
      <img
        src={preview.avatarUrl}
        alt={preview.displayName || "Avatar"}
        width={40}
        height={40}
        loading="lazy"
        className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
      />
    ) : (
      <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 font-bold text-sm">
        {preview.displayName?.[0] || 'U'}
      </div>
    )}
    <div className="min-w-0 flex-1">
      <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
        {preview.displayName || preview.username}
      </h4>
      {preview.bio && (
        <p className="text-xs text-neutral-500 truncate mt-0.5">
          {preview.bio}
        </p>
      )}
      <span className="inline-block mt-1 text-xs text-neutral-600 dark:text-neutral-300 font-medium">
        {preview.links.length} {linksFoundLabel}
      </span>
    </div>
  </div>
);
