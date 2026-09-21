import React from 'react';

interface QrPreviewProps {
  qrApiUrl: string;
  profileUrl: string;
  imageFailed: boolean;
  unavailableMessage: string;
  onImageError: () => void;
}

export const QrPreview: React.FC<QrPreviewProps> = ({
  qrApiUrl,
  profileUrl,
  imageFailed,
  unavailableMessage,
  onImageError
}) => (
  <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col items-center justify-center mb-5">
    {imageFailed ? (
      <div role="status" className="flex h-48 w-48 items-center justify-center rounded-lg border border-dashed border-rose-300 px-5 text-center text-xs text-rose-700">
        {unavailableMessage}
      </div>
    ) : (
      <img
        src={qrApiUrl}
        alt={`QR code for ${profileUrl}`}
        width={192}
        height={192}
        onError={onImageError}
        className="w-48 h-48 object-contain rounded-lg"
      />
    )}
    <span dir="ltr" className="font-mono text-xs font-semibold text-neutral-900 mt-3 break-all text-center">
      {profileUrl}
    </span>
  </div>
);
