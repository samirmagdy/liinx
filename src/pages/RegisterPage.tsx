import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import { ArrowRight, Lock, Mail, AtSign, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [availability, setAvailability] = useState<{ checked: boolean; available: boolean; message?: string }>({
    checked: false,
    available: false
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const [, setLocation] = useLocation();

  // Read initial username from query parameter if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialHandle = params.get('username');
    if (initialHandle) {
      const clean = initialHandle.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setUsername(clean);
    }
  }, []);

  // Debounce username availability check
  useEffect(() => {
    if (!username || username.length < 3) {
      setAvailability({ checked: false, available: false });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.auth.checkUsername(username);
        setAvailability({ checked: true, available: res.available, message: res.reason });
      } catch (e) {
        setAvailability({ checked: false, available: false });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsSubmitting(true);

    try {
      await register(email, password, username);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setLocation('/studio');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded-lg">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            L
          </div>
          <span className="font-bold text-xl tracking-tight text-neutral-900">LIINX</span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 text-balance">
          Create your creator page
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-neutral-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-neutral-50/50 py-8 px-6 shadow-sm rounded-3xl border border-neutral-200 sm:px-10">
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Claim your handle
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="yourname"
                  className="w-full pl-10 pr-10 py-2.5 bg-white rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-colors"
                />
                {availability.checked && (
                  <div className="absolute right-3.5 top-3">
                    {availability.available ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                )}
              </div>
              <p className="mt-1 text-[11px] text-neutral-500">
                Your page will be hosted at <span className="font-mono text-neutral-700">liinx.co/@{username || 'yourname'}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Choose a password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (availability.checked && !availability.available)}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-neutral-900 hover:bg-black text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating your Studio...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Page</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
