import { useState } from 'react';
import { api } from '../../../services/api';
import { useProductFeedback } from '../../../components/ProductFeedback';

type AccountUser = { username: string } | null;

export function useAccountDataControls(user: AccountUser, ar: boolean, logout: () => void, setLocation: (path: string) => void) {
  const { notify } = useProductFeedback();
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const blob = await api.auth.exportData();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `raloa-data-export-${user?.username || 'user'}-${Date.now()}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      anchor.remove();
    } catch (error) {
      notify(error instanceof Error ? error.message : (ar ? 'تعذر تصدير البيانات' : 'Export failed'));
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await api.auth.deleteAccount(deletePassword);
      logout();
      setLocation('/');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : (ar ? 'تعذر حذف الحساب' : 'Failed to delete account'));
      setDeleteLoading(false);
    }
  };

  return { exportLoading, handleExportData, deleteConfirmText, setDeleteConfirmText, deletePassword, setDeletePassword, deleteLoading, deleteError, handleDeleteAccount };
}
