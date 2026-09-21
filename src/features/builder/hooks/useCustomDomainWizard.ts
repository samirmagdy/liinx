import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../../services/api';
import { useBuilder } from '../context/BuilderContext';

export type DomainDnsState = 'verified' | 'pointing-elsewhere' | 'no-record' | 'lookup-unavailable';

export type DomainFinding = { state: DomainDnsState; foundTargets: string[] };

/** Long enough that a creator is not hammering a resolver, short enough to feel attended to. */
const POLL_INTERVAL_MS = 8000;

/**
 * Everything the domain card knows about DNS: what the resolver actually answered, and when to
 * ask again. Persisting the host itself stays in the builder context with the other settings.
 */
export function useCustomDomainWizard() {
  const {
    profile,
    customDomainInput,
    setCustomDomainInput,
    isSavingDomain,
    domainFeedback,
    handleSaveCustomDomain
  } = useBuilder();
  const savedDomain = (profile.customDomain || '').trim();
  // The stored flag is the server's own answer, so an already-connected domain opens on that
  // truth instead of pretending nothing has been checked yet.
  const [finding, setFinding] = useState<DomainFinding | null>(
    savedDomain && profile.customDomainVerified ? { state: 'verified', foundTargets: [] } : null
  );
  const [editingHost, setEditingHost] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const inFlight = useRef(false);

  const verified = Boolean(profile.customDomainVerified) || finding?.state === 'verified';
  const step: 'host' | 'records' = !savedDomain || editingHost ? 'host' : 'records';
  const connected = step === 'records' && verified;

  const checkNow = useCallback(async () => {
    if (!savedDomain || inFlight.current) return;
    inFlight.current = true;
    setIsChecking(true);
    try {
      const result = await api.studio.verifyCustomDomain(savedDomain);
      setFinding({ state: result.state, foundTargets: result.foundTargets ?? [] });
    } catch {
      // A request that never reached the resolver says nothing about the record, so it must not
      // be reported as "no CNAME found".
      setFinding({ state: 'lookup-unavailable', foundTargets: [] });
    } finally {
      inFlight.current = false;
      setIsChecking(false);
    }
  }, [savedDomain]);

  useEffect(() => {
    if (step !== 'records' || verified) return undefined;
    void checkNow();
    const timer = setInterval(() => { void checkNow(); }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [step, verified, checkNow]);

  const copyValue = useCallback(async (field: string, value: string) => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // The browser refused; the value stays on screen to be selected by hand.
    }
  }, []);

  const saveHost = useCallback(async () => {
    await handleSaveCustomDomain();
    setFinding(null);
    setEditingHost(false);
  }, [handleSaveCustomDomain]);

  const setHost = useCallback((raw: string) => {
    setCustomDomainInput(raw.toLowerCase().replace(/[^a-z0-9.-]/g, ''));
  }, [setCustomDomainInput]);

  return {
    step,
    savedDomain,
    connected,
    customDomainInput,
    finding,
    isChecking,
    isSavingDomain,
    domainFeedback,
    copiedField,
    setHost,
    saveHost,
    checkNow,
    copyValue,
    editHost: () => setEditingHost(true)
  };
}
