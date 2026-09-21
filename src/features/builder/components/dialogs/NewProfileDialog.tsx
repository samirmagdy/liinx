import React from 'react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { Modal } from '../../../../components/Modal';

export const NewProfileDialog: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    showNewProfileModal,
    setShowNewProfileModal,
    createProfileError,
    newUsername,
    setNewUsername,
    newDisplayName,
    setNewDisplayName,
    isCreatingProfile,
    handleCreateProfileSubmit
  } = useBuilder();

  return (
    <Modal open={showNewProfileModal} onClose={() => setShowNewProfileModal(false)} label={ui('Create a new site')}>
      <div className="bg-neutral-50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in border border-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-neutral-900">{ui("Create a new site")}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {ui("Add another project, brand, or persona under your account.")}
            </p>
          </div>
          <button
            onClick={() => setShowNewProfileModal(false)}
            className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {createProfileError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {createProfileError}
          </div>
        )}

        <form onSubmit={handleCreateProfileSubmit} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="create-profile-username" className="text-xs font-semibold text-neutral-800">{ui("Handle (Username)")}</label>
            <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 focus-within:bg-neutral-50 focus-within:border-neutral-900">
              <span className="text-xs font-mono text-neutral-600">@</span>
              <input
                id="create-profile-username"
                name="username"
                autoComplete="username"
                aria-label={ui("Handle (Username)")}
                type="text"
                required
                value={newUsername}
                onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder={ui("myotherbrand")}
                className="w-full text-xs font-mono p-2 bg-transparent outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="create-profile-display-name" className="text-xs font-semibold text-neutral-800">{ui("Display Name")}</label>
            <input
              id="create-profile-display-name"
              name="displayName"
              autoComplete="name"
              aria-label={ui("Display Name")}
              type="text"
              required
              value={newDisplayName}
              onChange={e => setNewDisplayName(e.target.value)}
              placeholder={ui("My Other Brand")}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-neutral-50 focus:border-neutral-900 outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewProfileModal(false)}
              className="px-4 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 cursor-pointer"
            >
              {ui("Cancel")}
            </button>
            <button
              type="submit"
              disabled={isCreatingProfile || !newUsername.trim() || !newDisplayName.trim()}
              className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {isCreatingProfile ? ui("Creating...") : ui("Create site")}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
