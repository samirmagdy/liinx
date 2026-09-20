import { useState, type FormEvent } from 'react';
import { api } from '../../../services/api';

export type AccountMessage = { type: 'success' | 'error'; text: string } | null;

export function useAccountCredentials(ar: boolean, refreshProfile: () => Promise<void>) {
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<AccountMessage>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<AccountMessage>(null);

  const handleUpdateEmail = async (event: FormEvent) => {
    event.preventDefault();
    setEmailMessage(null);
    setEmailLoading(true);
    try {
      const result = await api.auth.updateEmail(newEmail, emailPassword);
      setEmailMessage({ type: 'success', text: result.message || (ar ? 'تم تحديث البريد الإلكتروني بنجاح' : 'Email updated successfully') });
      setEmailPassword('');
      await refreshProfile();
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      setEmailMessage({ type: 'error', text: message || (ar ? 'تعذر تحديث البريد الإلكتروني' : 'Failed to update email') });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: ar ? 'كلمتا المرور غير متطابقتين' : 'New passwords do not match' });
      return;
    }
    setPasswordLoading(true);
    try {
      const result = await api.auth.changePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: result.message || (ar ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      setPasswordMessage({ type: 'error', text: message || (ar ? 'تعذر تغيير كلمة المرور' : 'Failed to change password') });
    } finally {
      setPasswordLoading(false);
    }
  };

  return {
    newEmail, setNewEmail, emailPassword, setEmailPassword, emailLoading, emailMessage, handleUpdateEmail,
    currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword,
    passwordLoading, passwordMessage, handleChangePassword
  };
}
