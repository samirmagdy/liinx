import React, { useRef, useState } from 'react';
import { ImagePlus, Sparkles, Trash2 } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { api } from '../../../../services/api';
import { friendlyErrorMessage } from '../../../../utils/errors';

const GRADIENTS = [
  { name: 'Violet bloom', value: 'linear-gradient(135deg, #eef2ff 0%, #c4b5fd 48%, #7c3aed 100%)' },
  { name: 'Coral glow', value: 'linear-gradient(135deg, #fff1f2 0%, #fecdd3 48%, #fb7185 100%)' },
  { name: 'Meadow', value: 'linear-gradient(135deg, #ecfccb 0%, #86efac 52%, #166534 100%)' },
  { name: 'Midnight', value: 'linear-gradient(135deg, #0f172a 0%, #312e81 52%, #111827 100%)' },
];

const SHAPES = [
  { id: 'soft', label: 'Soft', className: 'rounded-2xl' },
  { id: 'organic', label: 'Organic', className: 'rounded-[28px_12px_28px_12px]' },
  { id: 'pill', label: 'Pill', className: 'rounded-full' },
  { id: 'cutout', label: 'Cutout', className: 'rounded-none' },
] as const;

export const ThemeVisualsCard: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { customTheme, updateThemeOverride } = useBuilder();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadBackground = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const uploaded = await api.studio.uploadImage(file);
      updateThemeOverride({ backgroundImageUrl: uploaded.url, bgType: 'gradient' });
    } catch (uploadError) {
      setError(friendlyErrorMessage(uploadError, ui('Image upload failed')));
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-5" aria-labelledby="theme-visuals-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="theme-visuals-heading" className="font-bold text-sm text-neutral-900 flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-600" />{ui('Immersive theme builder')}</h2>
          <p className="mt-1 text-xs leading-5 text-neutral-500">{ui('Layer gradients, artwork, and shape language into a page that feels authored—not templated.')}</p>
        </div>
        {customTheme.backgroundImageUrl && (
          <button type="button" onClick={() => updateThemeOverride({ backgroundImageUrl: null })} className="min-h-11 min-w-11 rounded-xl border border-neutral-200 bg-white text-neutral-500 hover:text-rose-600" aria-label={ui('Remove background image')}>
            <Trash2 className="mx-auto h-4 w-4" />
          </button>
        )}
      </div>

      <div>
        <span className="mb-2 block text-xs font-semibold text-neutral-700">{ui('Atmosphere')}</span>
        <div className="grid grid-cols-2 gap-2">
          {GRADIENTS.map(gradient => (
            <button key={gradient.name} type="button" onClick={() => updateThemeOverride({ bgType: 'gradient', bgGradient: gradient.value })} className="min-h-14 rounded-xl border border-neutral-200 p-2 text-start hover:border-neutral-900 focus-visible:ring-2 focus-visible:ring-indigo-500" style={{ background: gradient.value }}>
              <span className="rounded-lg bg-white/80 px-2 py-1 text-[11px] font-bold text-neutral-900">{ui(gradient.name)}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs font-semibold text-neutral-700">{ui('Shape language')}</span>
        <div className="grid grid-cols-4 gap-2">
          {SHAPES.map(shape => (
            <button key={shape.id} type="button" aria-pressed={customTheme.shapeStyle === shape.id} onClick={() => updateThemeOverride({ shapeStyle: shape.id })} className={`min-h-16 border border-neutral-200 bg-white p-2 text-xs font-semibold text-neutral-700 transition hover:border-neutral-900 focus-visible:ring-2 focus-visible:ring-indigo-500 ${shape.className} ${customTheme.shapeStyle === shape.id ? 'ring-2 ring-violet-500 ring-offset-1' : ''}`}>
              <span className="mx-auto mb-1 block h-6 w-10 bg-gradient-to-r from-violet-500 to-cyan-400" />{ui(shape.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-neutral-700">{ui('Avatar shape')}
          <select value={customTheme.profileShape || 'circle'} onChange={event => updateThemeOverride({ profileShape: event.target.value as 'circle' | 'rounded' | 'square' | 'blob' })} className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 font-normal">
            <option value="circle">{ui('Circle')}</option><option value="rounded">{ui('Rounded')}</option><option value="square">{ui('Square')}</option><option value="blob">{ui('Organic blob')}</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-neutral-700">{ui('Depth')}
          <select value={customTheme.shadow || 'sm'} onChange={event => updateThemeOverride({ shadow: event.target.value as 'none' | 'sm' | 'md' | 'lg' })} className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 font-normal">
            <option value="none">{ui('Flat')}</option><option value="sm">{ui('Soft')}</option><option value="md">{ui('Lifted')}</option><option value="lg">{ui('Immersive')}</option>
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-3">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (file) void uploadBackground(file); event.currentTarget.value = ''; }} />
        <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 text-xs font-bold text-neutral-800 hover:border-violet-500 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-indigo-500"><ImagePlus className="h-4 w-4" />{uploading ? ui('Uploading…') : customTheme.backgroundImageUrl ? ui('Replace theme artwork') : ui('Upload theme artwork')}</button>
        <p className="mt-2 text-center text-[11px] text-neutral-500">{ui('Use a portrait, texture, or full-bleed image. A readable gradient remains underneath.')}</p>
        {error && <p className="mt-2 text-xs text-rose-700" role="alert">{error}</p>}
      </div>
    </section>
  );
};
