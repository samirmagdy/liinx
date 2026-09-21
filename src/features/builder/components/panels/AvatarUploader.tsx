import React from 'react';
import { Loader2, Upload } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';

export const AvatarUploader: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { profile, fileInputRef, uploadingImage, avatarError } = useBuilder();

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <img
          src={profile.avatarUrl}
          alt={profile.displayName}
          width={64}
          height={64}
          decoding="async"
          onError={event => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = '/icons/favicon-32x32.png';
          }}
          className="w-16 h-16 rounded-full object-cover ring-2 ring-neutral-200"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          className="absolute inset-0 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-semibold cursor-pointer"
        >
          {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-300 hover:border-black transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-500" />
            <span>{uploadingImage ? ui("Uploading...") : ui("Upload Avatar Image")}</span>
          </button>
        </div>
        {avatarError && (
          <p role="alert" className="text-xs text-rose-600 font-medium">
            {avatarError}
          </p>
        )}
        <p className="text-xs text-neutral-500">
          {ui("Supports JPG, PNG, WEBP up to 5MB. Stored directly on server.")}
        </p>
      </div>
    </div>
  );
};
