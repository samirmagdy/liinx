import React from 'react';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { useBuilder } from '../context/BuilderContext';
import { BuilderWorkspace } from './BuilderWorkspace';
import { QrCodeModal } from '../../../components/QrCodeModal';
import { LinktreeImporterModal } from '../../../components/LinktreeImporterModal';
import { ConfirmDeleteDialog } from './dialogs/ConfirmDeleteDialog';
import { NewProfileDialog } from './dialogs/NewProfileDialog';
import { ApiKeyDialog } from './dialogs/ApiKeyDialog';
import { api } from '../../../services/api';
import { resolveTheme } from '../../../utils/colorContrast';
import { initialPageId } from '../utils/builder.utils';
import type { CreatorProfile } from '../../../types';

export const BuilderShell: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    profile,
    setProfile,
    setCustomTheme,
    activePageId,
    setActivePageId,
    qrModalOpen,
    setQrModalOpen,
    showImporterModal,
    setShowImporterModal,
    setShowAddMenu,
    deletePageId,
    setDeletePageId,
    handleDeletePage,
    deleteProfileId,
    setDeleteProfileId,
    handleDeleteProfile
  } = useBuilder();

  const reloadProfileAfterImport = async () => {
    try {
      const liveProfile: CreatorProfile = await api.studio.getProfile();
      setProfile(liveProfile);
      if (!liveProfile.pages?.some(item => item.id === activePageId)) {
        setActivePageId(initialPageId(liveProfile));
      }
      setCustomTheme(resolveTheme(liveProfile.themeId, liveProfile.customTheme));
    } catch (err) {
      console.error('Failed to reload profile after import', err);
    }
  };

  return (
    <div className="studio-shell min-h-[calc(100vh-72px)] bg-neutral-50 border-t border-neutral-200 flex flex-col">
      <h1 className="sr-only">{ui('Bio Studio')} · @{profile.username}</h1>

      <BuilderWorkspace />

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        username={profile.username}
        displayName={profile.displayName}
        pages={profile.pages}
        customDomain={profile.customDomain}
      />

      {/* Linktree Importer Modal */}
      <LinktreeImporterModal
        isOpen={showImporterModal}
        onClose={() => setShowImporterModal(false)}
        onAddManual={() => setShowAddMenu(true)}
        onImportComplete={reloadProfileAfterImport}
        pages={profile.pages || []}
      />

      <ConfirmDeleteDialog
        open={Boolean(deletePageId)}
        label={ui('Confirm page deletion')}
        title={ui('Delete this page?')}
        description={ui('This page will be deleted. Its blocks will move to Home in their current order and will not be deleted.')}
        cancelLabel={ui('Cancel')}
        confirmLabel={ui('Delete page')}
        onCancel={() => setDeletePageId(null)}
        onConfirm={() => deletePageId && void handleDeletePage(deletePageId)}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteProfileId)}
        label={ui('Confirm profile deletion')}
        title={ui('Delete this profile?')}
        description={ui('This removes the selected profile and its pages, blocks, files, forms, subscribers, and provider connection. Your current profile remains active.')}
        cancelLabel={ui('Cancel')}
        confirmLabel={ui('Delete profile')}
        onCancel={() => setDeleteProfileId(null)}
        onConfirm={() => deleteProfileId && void handleDeleteProfile(deleteProfileId)}
      />

      <NewProfileDialog />

      <ApiKeyDialog />
    </div>
  );
};
