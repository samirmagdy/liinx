import React from 'react';
import { ArrowRight, AtSign, AlertCircle, CheckCircle2, Lock, Mail } from 'lucide-react';
import { brand } from '../../../config/brand';
import { useLanguage as useUiLanguage } from '../../../context/LanguageContext';
import { type SignupFlow } from '../hooks/useSignupFlow';

export const SignupAccountStep: React.FC<{ flow: SignupFlow }> = ({ flow }) => {
  const { tr: ui } = useUiLanguage();
  const { username, email, password, availability, setUsername, setEmail, setPassword, handleNextStep } = flow;

  return (
    <form className="space-y-4" onSubmit={handleNextStep}>
      <div>
        <label htmlFor="register-username" className="block text-xs font-bold text-neutral-700 mb-1.5">
          {ui("Choose your handle")}</label>
        <div className="relative">
          <AtSign className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
          <input
            id="register-username"
            name="username"
            autoComplete="username"
            aria-label={ui("Choose your handle")}
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder={ui("yourname")}
            className="w-full pl-10 pr-10 py-2.5 bg-white rounded-xl border border-neutral-300 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus:border-neutral-900 transition-colors"
          />
          {availability.checked && (
            <div className="absolute right-3.5 top-3">
              {availability.available ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500" />
              )}
            </div>
          )}
        </div>
        <p className="mt-1.5 text-xs text-neutral-500">
          {ui("Your live link will be")}<span className="font-mono text-neutral-700 font-semibold">{brand.domain}/@{username || 'yourname'}</span>
        </p>
      </div>

      <div>
        <label htmlFor="register-email" className="block text-xs font-bold text-neutral-700 mb-1.5">
          {ui("Email address")}</label>
        <div className="relative">
          <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
          <input
            id="register-email"
            type="email"
            aria-label={ui('Email address')} name="email" autoComplete="email" dir="ltr"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-neutral-300 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus:border-neutral-900 transition-colors"
          />
        </div>
      </div>

      <div>
        <label htmlFor="register-password" className="block text-xs font-bold text-neutral-700 mb-1.5">
          {ui("Choose password")}</label>
        <div className="relative">
          <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
          <input
            id="register-password"
            type="password"
            aria-label={ui('Choose password')} name="password" autoComplete="new-password" minLength={8} maxLength={128}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={ui("At least 8 characters")}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-neutral-300 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus:border-neutral-900 transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={availability.checked && !availability.available}
        className="w-full mt-3 py-3 px-4 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
      >
        <span>{ui("Continue to Step 2")}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
};
