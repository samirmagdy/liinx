import { useState } from 'react';
import { api } from '../../services/api';
import { friendlyErrorMessage } from '../../utils/errors';
import { useCapabilities } from '../../context/CapabilitiesContext';
import confetti from 'canvas-confetti';
import { useImportPreview, type ImporterLink, type ImporterPreview } from './useImportPreview';
import type { CreatorPage } from '../../types';

export type { ImporterLink, ImporterPreview };

interface UseLinkImportOptions {
  pages: CreatorPage[];
  onClose: () => void;
  onImportComplete: () => void | Promise<void>;
}

export function useLinkImport({ pages, onClose, onImportComplete }: UseLinkImportOptions) {
  const { hasAnyImporter } = useCapabilities();
  const {
    url,
    setUrl,
    loading,
    error,
    setError,
    previewData,
    selectedIndices,
    allSelected,
    preview,
    reset,
    cancel,
    toggleSelectIndex,
    toggleSelectAll
  } = useImportPreview({ onClose });

  const [importing, setImporting] = useState(false);
  const [updateProfileInfo, setUpdateProfileInfo] = useState(true);
  const availablePages = pages;
  const [pageId, setPageId] = useState(() => availablePages.find(page => page.isHome)?.id || '');

  const commit = async () => {
    if (!previewData || selectedIndices.size === 0) return;

    setImporting(true);
    setError(null);

    try {
      const linksToImport = previewData.links.filter((_, i) => selectedIndices.has(i));
      await api.importer.commit({
        pageId: pageId || undefined,
        links: linksToImport,
        updateProfileInfo,
        displayName: previewData.displayName,
        bio: previewData.bio,
        avatarUrl: previewData.avatarUrl
      });

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

      await onImportComplete();
      onClose();
    } catch (err) {
      setError(friendlyErrorMessage(err, 'We could not import those links. Your profile was not changed; please try again.'));
    } finally {
      setImporting(false);
    }
  };

  const cancelImport = () => {
    setImporting(false);
    cancel();
  };

  return {
    hasAnyImporter,
    url,
    setUrl,
    loading,
    error,
    previewData,
    selectedIndices,
    allSelected,
    importing,
    updateProfileInfo,
    setUpdateProfileInfo,
    availablePages,
    pageId,
    setPageId,
    preview,
    cancel: cancelImport,
    back: reset,
    toggleSelectIndex,
    toggleSelectAll,
    commit
  };
}
