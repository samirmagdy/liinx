import { useRef, useState, type FormEvent } from 'react';
import { api } from '../../services/api';
import { friendlyErrorMessage } from '../../utils/errors';

export interface ImporterLink {
  title: string;
  url: string;
}

export interface ImporterPreview {
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  links: ImporterLink[];
  warnings?: string[];
}

const allIndices = (count: number) => new Set(Array.from({ length: count }, (_, index) => index));

export function useImportPreview({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ImporterPreview | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const requestGeneration = useRef(0);

  const preview = async (event: FormEvent) => {
    event.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setPreviewData(null);
    const generation = ++requestGeneration.current;

    try {
      const res = await api.importer.preview(url.trim());
      if (generation !== requestGeneration.current) return;
      if (res.success && res.data) {
        setPreviewData(res.data);
        setSelectedIndices(allIndices(res.data.links.length));
      } else {
        setError('No links found on this profile.');
      }
    } catch (err) {
      if (generation === requestGeneration.current) {
        setError(friendlyErrorMessage(err, 'We could not inspect that profile. Make sure it is public and try again.'));
      }
    } finally {
      if (generation === requestGeneration.current) setLoading(false);
    }
  };

  const reset = () => {
    requestGeneration.current++;
    setLoading(false);
    setPreviewData(null);
    setError(null);
  };

  const cancel = () => {
    reset();
    onClose();
  };

  const toggleSelectIndex = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedIndices(next);
  };

  const allSelected = previewData !== null && selectedIndices.size === previewData.links.length;

  const toggleSelectAll = () => {
    if (!previewData) return;
    setSelectedIndices(allSelected ? new Set() : allIndices(previewData.links.length));
  };

  return {
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
  };
}
