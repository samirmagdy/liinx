import { useLanguage as useUiLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { friendlyErrorMessage } from '../utils/errors';
import { brand } from '../config/brand';

export const LoginPage: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      const after = new URLSearchParams(window.location.search).get('after');
      setLocation(after === 'import' ? '/studio?import=1' : '/studio');
    } catch (err: any) {
      setError(friendlyErrorMessage(err, 'Sign in failed. Check your email and password, then try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center justify-center mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded-lg">
          <img src="/brand/raloa-logo-horizontal-primary.png" alt={brand.productShortName} className="h-11 w-auto" loading="eager" decoding="async" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 text-balance">
          {ui("Welcome back to your Studio")}</h1>
        <p className="mt-2 text-sm text-neutral-600">
          {ui("Or")}{' '}
          <Link href="/register" className="font-semibold text-neutral-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded">
            {ui("claim a new handle and create your page")}</Link>
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
              <label htmlFor="login-email" className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                {ui("Email address")}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  type="email" id="login-email" name="email" autoComplete="email" dir="ltr"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                {ui("Password")}</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  type="password" id="login-password" name="password" autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-neutral-900 hover:bg-black text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{ui("Signing in...")}</span>
                </>
              ) : (
                <>
                  <span>{ui("Sign In")}</span>
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
