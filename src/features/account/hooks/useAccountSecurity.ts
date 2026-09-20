import { useEffect } from 'react';
import { useAccountCredentials } from './useAccountCredentials';
import { useAccountDataControls } from './useAccountDataControls';

type AccountUser = { id: string; email: string; username: string } | null;

export function useAccountSecurity(
  user: AccountUser,
  ar: boolean,
  logout: () => void,
  setLocation: (path: string) => void,
  refreshProfile: () => Promise<void>
) {
  const { setNewEmail, ...credentials } = useAccountCredentials(ar, refreshProfile);
  const dataControls = useAccountDataControls(user, ar, logout, setLocation);
  useEffect(() => {
    if (user) setNewEmail(user.email);
  }, [user, setNewEmail]);

  return { ...credentials, setNewEmail, ...dataControls };
}
