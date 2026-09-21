import { useLanguage as useUiLanguage } from '../context/LanguageContext';
import React from 'react';
import { Link } from 'wouter';
import { AlertCircle } from 'lucide-react';
import { brand } from '../config/brand';
import { useSignupFlow } from '../features/register/hooks/useSignupFlow';
import { SignupAccountStep } from '../features/register/components/SignupAccountStep';
import { SignupStarterSiteStep } from '../features/register/components/SignupStarterSiteStep';

export const RegisterPage: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const flow = useSignupFlow();
  const { step, error } = flow;

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center justify-center mb-4 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg">
          <img src="/brand/raloa-logo-horizontal-primary.png" alt={brand.productShortName} width={99} height={44} className="h-11 w-auto" loading="eager" decoding="async" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
          {step === 1 ? ui("Build your site") : ui("Choose your aesthetic")}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-neutral-600">
          {step === 1 ? (
            <>
              {ui("Already have an account?")}{' '}
              <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-neutral-900 hover:underline">
                {ui("Sign in here")}</Link>
            </>
          ) : (
            ui('Step 2 of 2: Choose your focus discipline and the starter site to build on.')
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-neutral-50/70 py-8 px-6 shadow-sm rounded-3xl border border-neutral-200 sm:px-10">
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? <SignupAccountStep flow={flow} /> : <SignupStarterSiteStep flow={flow} />}
        </div>
      </div>
    </main>
  );
};
