import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import { useLocation } from 'wouter';
import confetti from 'canvas-confetti';
import { useAuth } from '../../../context/AuthContext';
import { friendlyErrorMessage } from '../../../utils/errors';
import { useStarterSiteChoice } from './useStarterSiteChoice';
import { useUsernameAvailability } from './useUsernameAvailability';
import { trackMarketingEvent } from '../../../services/marketingEvents';

/**
 * Everything the two signup steps share: the credentials, the starter-site choice, and the single
 * request that opens the account with that choice already applied.
 */
export function useSignupFlow() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const availability = useUsernameAvailability(username);
  const choice = useStarterSiteChoice();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialHandle = params.get('username');
    if (initialHandle) setUsername(initialHandle.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  }, []);

  // The phone previews only exist once the client has mounted, so the server-rendered form and the
  // hydrated one agree on everything except those pictures.
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleNextStep = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (availability.checked && !availability.available) {
      setError(availability.message || 'This username is not available.');
      return;
    }

    void trackMarketingEvent({ event: 'signup_started', language: window.location.pathname.startsWith('/ar') ? 'ar' : 'en', metadata: { step: 1 } });
    setStep(2);
  };

  const handleFinalSubmit = async (e: FormEvent | MouseEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // One request: the server opens the account and materialises the chosen starter site in the
      // same transaction, so a failure here is a real registration failure the creator sees.
      await register(email, password, username, {
        intent: choice.selectedIntent,
        ...(choice.selectedTemplateId ? { templateId: choice.selectedTemplateId } : {})
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
      const params = new URLSearchParams(window.location.search);
      const plan = params.get('plan');
      if (params.get('after') === 'import') {
        setLocation('/studio?import=1');
      } else if (plan === 'pro' || plan === 'studio') {
        setLocation(`/pricing?plan=${plan}&interval=${params.get('interval') === 'year' ? 'year' : 'month'}`);
      } else setLocation('/studio');
    } catch (err: any) {
      setError(friendlyErrorMessage(err, 'We could not create your account. Check your details and try again.'));
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    step,
    setStep,
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    ...choice,
    isHydrated,
    availability,
    error,
    isSubmitting,
    handleNextStep,
    handleFinalSubmit
  };
}

export type SignupFlow = ReturnType<typeof useSignupFlow>;
