import React from 'react';
import {
  Plus,
  Link as LinkIcon,
  Sliders,
  Music,
  Video,
  FolderPlus,
  Mail,
  Download
} from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useCapabilities } from '../../../../context/CapabilitiesContext';
import { useBuilder } from '../../context/BuilderContext';

export const AddBlockMenu: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const { hasAnyImporter } = useCapabilities();
  const {
    showAddMenu,
    setShowAddMenu,
    handleAddLink,
    handleAddHeader,
    handleAddAudio,
    handleAddVideo,
    handleAddFolder,
    handleAddNewsletter,
    handleAddAdvancedBlock,
    setShowImporterModal
  } = useBuilder();

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          <span>{ui("Add New Link or Block to Profile")}</span>
        </button>

        {showAddMenu && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-neutral-50 rounded-2xl border border-neutral-200 shadow-2xl z-20 grid grid-cols-2 sm:grid-cols-3 gap-2 animate-fade-in">
            <button
              onClick={handleAddLink}
              className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            >
              <LinkIcon className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-neutral-900">{ui("Custom Link")}</span>
            </button>

            <button
              onClick={handleAddHeader}
              className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            >
              <Sliders className="w-4 h-4 text-neutral-700" />
              <span className="text-xs font-bold text-neutral-900">{ui("Section Title")}</span>
            </button>

            <button
              onClick={handleAddAudio}
              className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            >
              <Music className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-neutral-900">{ui("Audio Track")}</span>
            </button>

            <button
              onClick={handleAddVideo}
              className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            >
              <Video className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold text-neutral-900">{ui("Video Embed")}</span>
            </button>

            <button
              onClick={handleAddFolder}
              className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            >
              <FolderPlus className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-neutral-900">{ui("Link Folder")}</span>
            </button>

            <button
              onClick={handleAddNewsletter}
              className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            >
              <Mail className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-neutral-900">{ui("Newsletter")}</span>
            </button>

            {[
              ['rich_text', 'Rich Text'], ['image', 'Image'], ['gallery', 'Gallery'], ['carousel', 'Carousel'],
              ['spacer', 'Spacer'], ['form', 'Contact Form'], ['download', 'Download'], ['map', 'Location'],
              ['faq', 'FAQ'], ['testimonials', 'Testimonials'], ['event', 'Event'], ['presave', 'Pre-save'],
              ['phone', 'Phone'], ['product', 'Product'], ['tips', 'Tips'], ['content_gate', 'Content Gate']
            ].map(([type, label]) => (
              <button
                key={type}
                onClick={() => handleAddAdvancedBlock(type)}
                className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
              >
                <Plus className="w-4 h-4 text-neutral-600" />
                <span className="text-xs font-bold text-neutral-900">{ui(label)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowImporterModal(true)}
        className={`py-3.5 px-4 rounded-2xl bg-neutral-50 border shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 shrink-0 ${
          hasAnyImporter
            ? 'border-neutral-200 hover:border-emerald-600 text-neutral-900 hover:text-emerald-700 font-bold focus-visible:ring-emerald-500/20'
            : 'border-neutral-200 hover:border-neutral-300 text-neutral-600 font-medium focus-visible:ring-neutral-400'
        }`}
        title={hasAnyImporter ? ui("Import Linktree") : ui("Profile importing is currently unavailable")}
      >
        <Download className={`w-4 h-4 ${hasAnyImporter ? 'text-emerald-600' : 'text-neutral-400'}`} />
        <span>{hasAnyImporter ? ui("Import Linktree") : ui("Import")}</span>
        {!hasAnyImporter && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            {ui("Paused")}
          </span>
        )}
      </button>
    </div>
  );
};
