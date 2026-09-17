import React, { Component, lazy, Suspense } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { LanguageProvider } from './context/LanguageContext';
const Navbar = lazy(() => import('./components/Navbar').then(module => ({ default: module.Navbar })));
const Hero = lazy(() => import('./components/Hero').then(module => ({ default: module.Hero })));
const FeaturesSection = lazy(() => import('./components/FeaturesSection').then(module => ({ default: module.FeaturesSection })));
const ComparisonSection = lazy(() => import('./components/ComparisonSection').then(module => ({ default: module.ComparisonSection })));
const TemplatesSection = lazy(() => import('./components/TemplatesSection').then(module => ({ default: module.TemplatesSection })));
const PricingSection = lazy(() => import('./components/PricingSection').then(module => ({ default: module.PricingSection })));
const FaqSection = lazy(() => import('./components/FaqSection').then(module => ({ default: module.FaqSection })));
const Footer = lazy(() => import('./components/Footer').then(module => ({ default: module.Footer })));
const BuilderStudio = lazy(() => import('./components/BuilderStudio').then(module => ({ default: module.BuilderStudio })));
const PublicBioView = lazy(() => import('./components/PublicBioView').then(module => ({ default: module.PublicBioView })));
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { PrivacyPage, TermsPage, ContactPage, AboutPage } from './pages/LegalPages';
import { CreatorProfile, ThemeConfig } from './types';
import { api, authStorage } from './services/api';
import { RESERVED_USERNAMES } from './config/brand';
import { PageMetadata } from './components/PageMetadata';
import { BackgroundAnimation } from './components/BackgroundAnimation';
import { LoadingScreen, BioSkeletonLoader } from './components/LoadingScreen';
import { Lock, ArrowRight, Loader2, AlertTriangle, RotateCw } from 'lucide-react';
import * as Sentry from '@sentry/react';

function chooseTemplate(profile: CreatorProfile, navigate: (path: string) => void) {
  const theme = encodeURIComponent(profile.themeId);
  navigate(authStorage.getToken() ? `/studio?template=${theme}` : `/register?template=${theme}`);
}

function HomePage() {
  const [, setLocation] = useLocation();

  const handleClaimUsername = (handle: string) => {
    setLocation(`/register?username=${encodeURIComponent(handle)}`);
  };

  const handleOpenStudio = () => {
    setLocation('/studio');
  };

  const handleSelectTemplate = (profile: CreatorProfile) => {
    chooseTemplate(profile, setLocation);
  };

  const handleSelectPlan = (plan: string, interval: 'month' | 'year') => {
    setLocation(`/register?plan=${plan}&interval=${interval}`);
  };

  return (
    <div className="marketing-home min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="home" onClaimClick={handleClaimUsername} />
      <main className="flex-1">
        <Hero
          onClaimUsername={handleClaimUsername}
          onOpenStudio={handleOpenStudio}
        />
        <FeaturesSection onOpenStudio={handleOpenStudio} />
        <TemplatesSection maxVisible={4} onSelectTemplate={handleSelectTemplate} />
        <PricingSection onSelectPlan={handleSelectPlan} />
        <FaqSection />
      </main>
      <Footer onSelectView={(v) => {
        if (v === 'home') setLocation('/');
        else if (v === 'builder') setLocation('/studio');
        else if (v === 'templates') setLocation('/templates');
        else if (v === 'pricing') setLocation('/pricing');
      }} />
    </div>
  );
}

function PublicProfilePage({ username, pageSlug }: { username: string; pageSlug?: string }) {
  const { tr } = useLanguage();
  const previewKey = `liinx-fullscreen-preview:${username.toLowerCase()}`;
  const fullscreenPreview = window.sessionStorage.getItem(previewKey) === '1';
  if (fullscreenPreview) window.sessionStorage.removeItem(previewKey);
  const previewTheme = (() => {
    try {
      const raw = window.sessionStorage.getItem(`liinx-preview-theme:${username}`);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as { theme?: ThemeConfig; createdAt?: number };
      if (!parsed.createdAt || Date.now() - parsed.createdAt > 60_000 || !parsed.theme) return undefined;
      return parsed.theme;
    } catch {
      return undefined;
    }
  })();
  return <Suspense fallback={<BioSkeletonLoader />}><PublicBioView username={username} pageSlug={pageSlug} customTheme={previewTheme} previewOnly={fullscreenPreview} onBackToStudio={() => window.location.href = '/studio'} /></Suspense>;
}

function StudioPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { tr } = useLanguage();

  const handleFooterNavigation = (v: string) => {
    if (v === 'home') setLocation('/');
    else if (v === 'builder') setLocation('/studio');
    else if (v === 'templates') setLocation('/templates');
    else if (v === 'pricing') setLocation('/pricing');
  };

  if (isLoading) {
    return <LoadingScreen message={tr('Loading your profile…')} submessage="Preparing your creative studio" />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-neutral-900">
        <Navbar activeView="builder" />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-neutral-100 border border-neutral-200/80 flex items-center justify-center mb-6 shadow-xs text-neutral-900">
            <Lock className="w-7 h-7 text-neutral-800" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-900 mb-3 text-balance">
            {tr('Sign in to edit your page')}
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 max-w-md mb-8 text-pretty">
            {tr('Access your bio builder, customize your theme, and manage your links and live analytics.')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setLocation('/login')}
              className="px-6 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-black transition-colors shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2 flex items-center gap-2"
            >
              <span>{tr('Sign In')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              onClick={() => setLocation('/register')}
              className="px-6 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold hover:bg-neutral-100 text-neutral-900 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            >
              {tr('Create an account')}
            </button>
          </div>
        </main>
        <Footer onSelectView={handleFooterNavigation} />
      </div>
    );
  }

  return (
    <div className="marketing-shell min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="builder" />
      <main className="flex-1">
        <Suspense fallback={<LoadingScreen message={tr('Loading your profile…')} submessage="Preparing your creative studio" fullscreen={false} />}>
          <BuilderStudio
            onViewFullscreen={(profile, theme) => {
              window.sessionStorage.setItem(`liinx-preview-theme:${profile.username}`, JSON.stringify({ theme, createdAt: Date.now() }));
              setLocation(`/@${profile.username}`);
            }}
          />
        </Suspense>
      </main>
      <Footer onSelectView={handleFooterNavigation} />
    </div>
  );
}

function TemplatesPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="marketing-shell min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="templates" />
      <main className="flex-1 pt-8">
        <TemplatesSection headingLevel={1} onSelectTemplate={(p) => chooseTemplate(p, setLocation)} />
        <ComparisonSection />
      </main>
      <Footer onSelectView={(v) => {
        if (v === 'home') setLocation('/');
        else if (v === 'builder') setLocation('/studio');
        else if (v === 'templates') setLocation('/templates');
        else if (v === 'pricing') setLocation('/pricing');
      }} />
    </div>
  );
}

function PricingPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const handleSelectPlan = async (planId: string, interval: 'month' | 'year') => {
    if (!user) { setLocation('/register?plan=' + planId + '&interval=' + interval); return; }
    if (planId === 'free') { setLocation('/studio'); return; }
    const res = await api.billing.createCheckoutSession(planId as 'pro' | 'studio', interval);
    window.location.assign(res.url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <Navbar activeView="pricing" />
      <main className="flex-1 pt-8">
        <PricingSection headingLevel={1} onSelectPlan={handleSelectPlan} />
        <ComparisonSection />
        <FaqSection />
      </main>
      <Footer onSelectView={(v) => {
        if (v === 'home') setLocation('/');
        else if (v === 'builder') setLocation('/studio');
        else if (v === 'templates') setLocation('/templates');
        else if (v === 'pricing') setLocation('/pricing');
      }} />
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function CrashFallback() {
  const { tr } = useLanguage();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-neutral-900">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{tr('Something went wrong')}</h1>
          <p className="text-sm text-neutral-500">{tr('Reload this page to try again.')}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-black transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2"
            onClick={() => window.location.reload()}
          >
            <RotateCw className="w-4 h-4" />
            <span>{tr('Reload Page')}</span>
          </button>
          <a
            className="px-5 py-2.5 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center gap-2"
            href="/"
          >
            <span>{tr('Back to Home')}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </main>
  );
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application error', error, info);
    Sentry.captureException(error, { contexts: { react: { componentStack: info.componentStack || 'unknown' } } });
  }
  render() {
    return this.state.hasError ? <LanguageProvider><CrashFallback /></LanguageProvider> : this.props.children;
  }
}

export default function App() {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const defaultHosts = ['localhost', '127.0.0.1', '0.0.0.0', 'liinx.vercel.app', 'liinx.app'];
  const isCustomDomain = currentHost && !defaultHosts.includes(currentHost) && !currentHost.endsWith('.liinx.app');

  if (isCustomDomain) {
    const customPageSlug = typeof window !== 'undefined'
      ? window.location.pathname.split('/').filter(Boolean)[0] || undefined
      : undefined;
    return (
      <ErrorBoundary>
        <LanguageProvider>
          <AuthProvider>
            <div className="relative min-h-screen">
              <BackgroundAnimation />
              <div className="relative z-10">
                <Suspense fallback={<BioSkeletonLoader />}><PublicBioView
                  customDomain={currentHost}
                  pageSlug={customPageSlug}
                  onBackToStudio={() => window.location.href = 'https://liinx.app/studio'}
                /></Suspense>
              </div>
            </div>
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <div className="relative min-h-screen">
            <BackgroundAnimation />
            <div className="relative z-10">
              <PageMetadata />
              <Suspense fallback={<LoadingScreen message="Loading..." submessage="Liinx Studio" />}><Switch>
            {/* Core application routes */}
            <Route path="/" component={HomePage} />
            <Route path="/features" component={FeaturesPage} />
            <Route path="/templates" component={TemplatesPage} />
            <Route path="/pricing" component={PricingPage} />
            <Route path="/about" component={AboutPage} />
            <Route path="/contact" component={ContactPage} />
            <Route path="/privacy" component={PrivacyPage} />
            <Route path="/terms" component={TermsPage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/register" component={RegisterPage} />
            <Route path="/studio" component={StudioPage} />

            {/* Dynamic Public Bio Pages */}
            <Route path="/@:username/:pageSlug">
              {(params) => <PublicProfilePage username={params.username} pageSlug={params.pageSlug} />}
            </Route>
            <Route path="/@:username">
              {(params) => (
                <PublicProfilePage username={params.username} />
              )}
            </Route>

            <Route path="/:username/:pageSlug">
              {(params) => {
                const clean = params.username.toLowerCase();
                if (RESERVED_USERNAMES.includes(clean as any)) return <HomePage />;
                return <PublicProfilePage username={params.username} pageSlug={params.pageSlug} />;
              }}
            </Route>

            <Route path="/:username">
              {(params) => {
                // Guard against system routes and reserved words
                const clean = params.username.toLowerCase();
                if (RESERVED_USERNAMES.includes(clean as any)) {
                  return <HomePage />;
                }
                return <PublicProfilePage username={params.username} />;
              }}
            </Route>
              </Switch></Suspense>
            </div>
          </div>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};
