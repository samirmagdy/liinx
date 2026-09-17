import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { friendlyErrorMessage } from '../../../utils/errors';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { FormSubmissionItem, BuilderTab } from '../types/builder.types';

interface UseFormSubmissionsProps {
  activeTab: BuilderTab;
  profileId: string;
}

export function useFormSubmissions({ activeTab, profileId }: UseFormSubmissionsProps) {
  const { tr: ui } = useUiLanguage();
  const [formSubmissions, setFormSubmissions] = useState<FormSubmissionItem[]>([]);
  const [formSubmissionPage, setFormSubmissionPage] = useState(1);
  const [formSubmissionTotal, setFormSubmissionTotal] = useState(0);
  const [formSubmissionHasMore, setFormSubmissionHasMore] = useState(false);
  const [formSubmissionFilter, setFormSubmissionFilter] = useState('');
  const [formSubmissionRetry, setFormSubmissionRetry] = useState(0);
  const [formSubmissionsLoading, setFormSubmissionsLoading] = useState(false);
  const [formSubmissionsError, setFormSubmissionsError] = useState<string | null>(null);

  useEffect(() => {
    setFormSubmissions([]);
    setFormSubmissionPage(1);
    setFormSubmissionTotal(0);
    setFormSubmissionHasMore(false);
    setFormSubmissionFilter('');
    setFormSubmissionsError(null);
  }, [profileId]);

  useEffect(() => {
    if (activeTab !== 'settings') return;
    let cancelled = false;
    setFormSubmissionsLoading(true);
    setFormSubmissionsError(null);
    api.studio.getFormSubmissions({
      page: formSubmissionPage,
      pageSize: 25,
      blockId: formSubmissionFilter || undefined
    })
      .then(res => {
        if (cancelled) return;
        setFormSubmissions(res.submissions || []);
        setFormSubmissionTotal(res.total || 0);
        setFormSubmissionHasMore(Boolean(res.hasMore));
      })
      .catch(error => {
        if (!cancelled) {
          setFormSubmissionsError(friendlyErrorMessage(error, ui('Could not load form responses.')));
        }
      })
      .finally(() => {
        if (!cancelled) setFormSubmissionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, profileId, formSubmissionPage, formSubmissionFilter, formSubmissionRetry]);

  const handleExportFormResponses = async () => {
    try {
      const blob = await api.studio.exportFormSubmissions(formSubmissionFilter || undefined);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `liinx-${formSubmissionFilter ? 'form' : 'forms'}-responses.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setFormSubmissionsError(friendlyErrorMessage(error, ui('Could not export form responses.')));
    }
  };

  const handleDeleteFormSubmission = async (id: string) => {
    if (!window.confirm(ui('Delete this form response permanently?'))) return;
    try {
      await api.studio.deleteFormSubmission(id);
      setFormSubmissions(current => current.filter(item => item.id !== id));
      setFormSubmissionTotal(current => Math.max(0, current - 1));
    } catch (error) {
      setFormSubmissionsError(friendlyErrorMessage(error, ui('Could not delete form response.')));
    }
  };

  const refreshSubmissions = () => {
    setFormSubmissionRetry(c => c + 1);
  };

  return {
    formSubmissions,
    formSubmissionPage,
    setFormSubmissionPage,
    formSubmissionTotal,
    formSubmissionHasMore,
    formSubmissionFilter,
    setFormSubmissionFilter,
    formSubmissionsLoading,
    formSubmissionsError,
    setFormSubmissionsError,
    handleExportFormResponses,
    handleDeleteFormSubmission,
    refreshSubmissions
  };
}
