import { useEffect, useState } from 'react';
import { api } from '../../../services/api';

export interface UsernameAvailability {
  checked: boolean;
  available: boolean;
  message?: string;
}

const UNKNOWN: UsernameAvailability = { checked: false, available: false };

/** Debounced handle lookup. A failed request stays unknown rather than claiming the name is free. */
export function useUsernameAvailability(username: string): UsernameAvailability {
  const [availability, setAvailability] = useState<UsernameAvailability>(UNKNOWN);

  useEffect(() => {
    let active = true;
    if (!username || username.length < 3) {
      setAvailability(UNKNOWN);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.auth.checkUsername(username);
        if (!active) return;
        setAvailability({ checked: true, available: res.available, message: res.reason });
      } catch {
        setAvailability(UNKNOWN);
      }
    }, 250);

    return () => { active = false; clearTimeout(timer); };
  }, [username]);

  return availability;
}
