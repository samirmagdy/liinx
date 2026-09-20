import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

export type CheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function useUsernameAvailability(handle: string, isRtl: boolean) {
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [reason, setReason] = useState<string | null>(null);
  const checkSeqRef = useRef(0);

  useEffect(() => {
    const trimmed = handle.trim().toLowerCase();
    if (!trimmed) {
      setStatus('idle');
      setReason(null);
      return;
    }

    if (trimmed.length < 3) {
      setStatus('invalid');
      setReason(isRtl ? '3 أحرف على الأقل' : 'At least 3 characters');
      return;
    }

    const currentSeq = ++checkSeqRef.current;
    setStatus('checking');
    setReason(null);

    const timer = setTimeout(async () => {
      try {
        const res = await api.auth.checkUsername(trimmed);
        if (currentSeq !== checkSeqRef.current) return;

        if (res.available) {
          setStatus('available');
          setReason(null);
        } else {
          setStatus('taken');
          setReason(res.reason || (isRtl ? 'محجوز' : 'Taken'));
        }
      } catch {
        if (currentSeq === checkSeqRef.current) {
          setStatus('idle');
          setReason(null);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [handle, isRtl]);

  return { status, reason };
}
